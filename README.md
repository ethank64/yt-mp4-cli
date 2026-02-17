# yt-mp4-cli

A simple Node.js CLI tool to download YouTube videos as MP4 files with customizable quality and output options.

## Installation

### Global Installation

```bash
npm install -g yt-mp4-cli
```

### For Development

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd yt-mp4-cli
npm install
```

To run the CLI locally during development:

```bash
npm start "<youtube-url>" [options]
```

Or directly:

```bash
node ./bin/ytmp4.js "<youtube-url>" [options]
```

**Note:** Always quote the YouTube URL to prevent shell interpretation of special characters.

## Usage

```bash
ytmp4 "<youtube-url>" [options]
```

### Options

- `-q, --quality <quality>`: Video quality selection
  - `highest` (default): Download highest available quality
  - `lowest`: Download lowest available quality
  - Specific resolution: e.g., `720p`, `480p`, `360p` (will select closest available)
- `-o, --output <filename>`: Custom output filename (without extension, .mp4 will be added automatically)
- `-h, --help`: Display help information
- `-V, --version`: Display version number

### Examples

```bash
# Download with default settings (highest quality, video title as filename)
ytmp4 "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Download with specific quality
ytmp4 "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --quality 720p

# Download with custom output filename
ytmp4 "https://www.youtube.com/watch?v=dQw4w9WgXcQ" -o my-video

# Combine options
ytmp4 "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --quality 480p --output my-video

# Using npm start (for local development)
npm start "https://www.youtube.com/watch?v=dQw4w9WgXcQ" --quality 720p --output my-video
```

**Note:** Always quote the YouTube URL to prevent shell interpretation of special characters (especially important in zsh).

## Features

- Download YouTube videos as MP4 files
- Selectable video quality (highest, lowest, or specific resolution)
- Custom output filename support
- Real-time download progress bar
- Automatic filename sanitization
- Comprehensive error handling

## Requirements

- Node.js 18+

## License

MIT
