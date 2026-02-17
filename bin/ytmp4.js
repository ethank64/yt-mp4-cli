#!/usr/bin/env node

import { Command } from 'commander';
import { downloadVideo } from '../src/downloader.js';

const program = new Command();

program
  .name('ytmp4')
  .description('Download YouTube videos as MP4 files')
  .version('0.1.0')
  .argument('<url>', 'YouTube video URL')
  .option('-q, --quality <quality>', 'Video quality (highest, lowest, or specific like 720p, 480p)', 'highest')
  .option('-o, --output <filename>', 'Output filename (without extension)')
  .action(async (url, options) => {
    try {
      console.log('Fetching video information...');
      const outputPath = await downloadVideo(url, {
        quality: options.quality,
        output: options.output
      });
      
      console.log(`\n✓ Successfully downloaded: ${outputPath}`);
      process.exit(0);
    } catch (error) {
      console.error(`\n✖ Error: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();

