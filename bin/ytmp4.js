#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ytdl from 'ytdl-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

program
  .name('ytmp4')
  .description('Download a YouTube video as an MP4 file')
  .argument('<url>', 'YouTube video URL')
  .option('-o, --output <path>', 'Output file path (default: "<title>.mp4")')
  .version('0.1.0')
  .action(async (url, options) => {
    const spinner = ora('Validating YouTube URL...').start();

    try {
      if (!ytdl.validateURL(url)) {
        spinner.fail('Invalid YouTube URL');
        console.error(chalk.red('Please provide a valid YouTube video link.'));
        process.exit(1);
      }

      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title.replace(/[\\/:*?"<>|]/g, '_');
      const outputPath = options.output
        ? path.resolve(process.cwd(), options.output)
        : path.resolve(process.cwd(), `${title}.mp4`);

      spinner.text = `Downloading: ${title}`;

      const video = ytdl(url, {
        filter: 'audioandvideo',
        quality: 'highest',
      });

      const totalSize = parseInt(info.videoDetails.lengthSeconds, 10);
      let downloaded = 0;

      video.on('progress', (chunkLength, downloadedBytes, totalBytes) => {
        downloaded = downloadedBytes;
        const percent = ((downloadedBytes / totalBytes) * 100).toFixed(1);
        spinner.text = `Downloading: ${title} (${percent}%)`;
      });

      video.on('error', (err) => {
        spinner.fail('Download failed');
        console.error(chalk.red(err.message));
        process.exit(1);
      });

      const writeStream = fs.createWriteStream(outputPath);

      writeStream.on('finish', () => {
        spinner.succeed(`Downloaded to ${outputPath}`);
      });

      video.pipe(writeStream);
    } catch (err) {
      spinner.fail('Something went wrong');
      console.error(chalk.red(err.message));
      process.exit(1);
    }
  });

program.parse(process.argv);
