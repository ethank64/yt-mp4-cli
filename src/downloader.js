import ytdl from '@distube/ytdl-core';
import fs from 'fs-extra';
import path from 'path';
import { createWriteStream, readdirSync, unlinkSync } from 'fs';
import cliProgress from 'cli-progress';

/**
 * Sanitize filename by removing invalid characters and limiting length
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filesystem characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, 200); // Limit length
}

/**
 * Clean up player-script.js debug files created by ytdl-core
 * These are temporary debug files that aren't needed
 */
function cleanupPlayerScripts() {
  try {
    const cwd = process.cwd();
    const files = readdirSync(cwd);
    const playerScriptPattern = /^\d+-player-script\.js$/;
    
    files.forEach(file => {
      if (playerScriptPattern.test(file)) {
        try {
          unlinkSync(path.join(cwd, file));
        } catch (err) {
          // Ignore errors when cleaning up
        }
      }
    });
  } catch (err) {
    // Ignore errors when cleaning up
  }
}

/**
 * Get video info and select appropriate format based on quality option
 * @param {string} url - YouTube video URL
 * @param {string} quality - Quality preference (highest, lowest, or specific like 720p)
 * @returns {Promise<Object>} - Video info and selected format
 */
async function getVideoInfo(url, quality = 'highest') {
  try {
    const info = await ytdl.getInfo(url);
    
    // Get available video+audio formats
    const videoFormats = info.formats.filter(format => 
      format.hasVideo && format.hasAudio && format.container === 'mp4'
    );
    
    // If no combined formats, try to get best available
    const allFormats = info.formats.filter(format => 
      (format.hasVideo && format.hasAudio) || format.hasVideo
    );
    
    const formats = videoFormats.length > 0 ? videoFormats : allFormats;
    
    if (formats.length === 0) {
      throw new Error('No video formats available for this video');
    }

    let selectedFormat;
    
    if (quality === 'highest') {
      // Use ytdl's built-in method or find highest quality
      try {
        selectedFormat = ytdl.chooseFormat(info.formats, { quality: 'highest' });
      } catch {
        // Fallback to manual selection
        selectedFormat = formats.reduce((best, current) => {
          const bestHeight = parseInt(best.height) || 0;
          const currentHeight = parseInt(current.height) || 0;
          return currentHeight > bestHeight ? current : best;
        });
      }
    } else if (quality === 'lowest') {
      // Get lowest quality video+audio format
      selectedFormat = formats.reduce((worst, current) => {
        const worstHeight = parseInt(worst.height) || Infinity;
        const currentHeight = parseInt(current.height) || Infinity;
        return currentHeight < worstHeight ? current : worst;
      });
    } else {
      // Try to match specific quality (e.g., "720p", "480p")
      const qualityNum = parseInt(quality);
      if (isNaN(qualityNum)) {
        throw new Error(`Invalid quality option: ${quality}. Use "highest", "lowest", or a number like "720p"`);
      }
      
      // Find format closest to requested quality
      selectedFormat = formats.reduce((closest, current) => {
        const closestHeight = parseInt(closest.height) || 0;
        const currentHeight = parseInt(current.height) || 0;
        const requestedHeight = qualityNum;
        
        const closestDiff = Math.abs(closestHeight - requestedHeight);
        const currentDiff = Math.abs(currentHeight - requestedHeight);
        
        return currentDiff < closestDiff ? current : closest;
      });
    }

    return { info, format: selectedFormat };
  } catch (error) {
    if (error.message.includes('Sign in to confirm your age')) {
      throw new Error('This video is age-restricted and cannot be downloaded');
    } else if (error.message.includes('Private video')) {
      throw new Error('This video is private and cannot be downloaded');
    } else if (error.message.includes('Video unavailable')) {
      throw new Error('This video is unavailable');
    } else if (error.message.includes('Could not extract functions') || error.message.includes('Unable to retrieve video metadata')) {
      throw new Error('Unable to extract video information. YouTube may have changed their API. Try updating ytdl-core or try again later.');
    }
    throw error;
  }
}

/**
 * Download YouTube video as MP4
 * @param {string} url - YouTube video URL
 * @param {Object} options - Download options
 * @param {string} options.quality - Video quality (highest, lowest, or specific like 720p)
 * @param {string} options.output - Custom output filename (without extension)
 * @returns {Promise<string>} - Path to downloaded file
 */
export async function downloadVideo(url, options = {}) {
  const { quality = 'highest', output } = options;

  try {
    // Validate URL
    if (!ytdl.validateURL(url)) {
      throw new Error('Invalid YouTube URL');
    }

    // Get video info and format
    const { info, format } = await getVideoInfo(url, quality);

    // Determine output filename
    let filename;
    if (output) {
      filename = sanitizeFilename(output);
    } else {
      filename = sanitizeFilename(info.videoDetails.title);
    }
    
    // Ensure .mp4 extension
    if (!filename.endsWith('.mp4')) {
      filename += '.mp4';
    }

    // Get full output path (current directory)
    const outputPath = path.resolve(process.cwd(), filename);

    // Check if file already exists
    if (await fs.pathExists(outputPath)) {
      throw new Error(`File already exists: ${outputPath}`);
    }

    // Create download stream
    const videoStream = ytdl.downloadFromInfo(info, { format });

    // Get video size for progress tracking
    const contentLength = format.contentLength ? parseInt(format.contentLength) : null;
    let downloadedBytes = 0;

    // Create progress bar
    const progressBar = new cliProgress.SingleBar({
      format: 'Downloading |{bar}| {percentage}% | {value}/{total} bytes | Speed: {speed}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    if (contentLength) {
      progressBar.start(contentLength, 0);
    } else {
      progressBar.start(100, 0);
    }

    // Create write stream
    const writeStream = createWriteStream(outputPath);

    // Track download progress
    videoStream.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      if (contentLength) {
        progressBar.update(downloadedBytes);
      } else {
        // Estimate progress if content length unknown
        const estimatedProgress = Math.min(95, (downloadedBytes / (1024 * 1024 * 100)) * 100);
        progressBar.update(estimatedProgress);
      }
    });

    // Handle errors
    videoStream.on('error', (error) => {
      progressBar.stop();
      writeStream.destroy();
      fs.remove(outputPath).catch(() => {}); // Clean up partial file
      throw error;
    });

    writeStream.on('error', (error) => {
      progressBar.stop();
      videoStream.destroy();
      fs.remove(outputPath).catch(() => {}); // Clean up partial file
      throw error;
    });

    // Pipe video stream to file
    await new Promise((resolve, reject) => {
      videoStream.pipe(writeStream);
      
      writeStream.on('finish', () => {
        progressBar.stop();
        resolve();
      });

      writeStream.on('error', reject);
      videoStream.on('error', reject);
    });

    // Clean up any player-script.js debug files created by ytdl-core
    cleanupPlayerScripts();

    return outputPath;
  } catch (error) {
    // Clean up any player-script.js debug files even on error
    cleanupPlayerScripts();
    
    if (error.message.includes('Invalid YouTube URL')) {
      throw new Error('Invalid YouTube URL. Please provide a valid YouTube video URL.');
    }
    // Re-throw with original message for better debugging
    throw error;
  }
}

