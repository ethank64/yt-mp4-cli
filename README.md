# youtube-mp4-cli

Simple Node.js CLI tool to download YouTube videos as MP4 files.

## Installation

```bash
npm install -g youtube-mp4-cli
```

## Usage

```bash
ytmp4 <youtube-url> [options]
```

### Options

- `-o, --output <path>`: Output file path (default: `<title>.mp4` in current directory)

### Examples

```bash
ytmp4 https://www.youtube.com/watch?v=dQw4w9WgXcQ

# Custom output path
ytmp4 https://www.youtube.com/watch?v=dQw4w9WgXcQ -o ./downloads/video.mp4
```

## Requirements

- Node.js 18+

## License

MIT
