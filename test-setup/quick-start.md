# Quick Start Guide - Video Testing

Get up and running with video testing in minutes!

## Prerequisites

1. **Get a Pexels API key** (free):
   - Go to https://www.pexels.com/api/
   - Create account and get your API key

2. **Set environment variable**:
```bash
export PEXELS_API_KEY="your-api-key-here"
```

## Option 1: Interactive Demo (Recommended)

The easiest way to start testing:

```bash
cd test-setup
npm install
npm run demo
```

This launches an interactive menu where you can:
- ✅ Test basic functionality
- 🎵 Compare different music moods  
- 🗣️ Try various voices
- 🎨 Test visual configurations
- 🔧 Create custom videos

## Option 2: Automated Test Suite

Run comprehensive tests automatically:

```bash
cd test-setup
npm install

# Run all tests
npm test

# Or run specific test categories
npm run test:basic    # Basic functionality
npm run test:music    # Music mood tests
npm run test:voice    # Voice variety tests
```

## Option 3: Single Test Sample

Test with a specific configuration:

```bash
cd test-setup
npm install
node tools/mcp-sse-client.js test samples/minimal-test.json
```

## Starting the Server

First, make sure the video maker server is running:

### Using Docker (Recommended)
```bash
docker run -it --rm --name short-video-maker \
  -p 3123:3123 \
  -e PEXELS_API_KEY=$PEXELS_API_KEY \
  gyoridavid/short-video-maker:latest-tiny
```

### Using NPM
```bash
# In the main project directory
npm install
npm run dev
```

## What to Expect

- **First test**: Takes 30-60 seconds (includes setup)
- **Subsequent tests**: 15-30 seconds each
- **Output location**: `test-outputs/` directory
- **Video format**: MP4 files you can watch

## Quick Validation

Check if everything works:

```bash
# Test server health
curl http://localhost:3123/health

# List available voices
curl http://localhost:3123/api/voices

# List music options
curl http://localhost:3123/api/music-tags
```

## Next Steps

1. **Run the interactive demo** to familiarize yourself with options
2. **Modify sample configurations** in `samples/` directory
3. **Create custom test scenarios** for your specific needs
4. **Set up automated testing** for continuous validation

## Troubleshooting

**Server not responding?**
- Make sure it's running on port 3123
- Check that PEXELS_API_KEY is set

**Videos not generating?**
- Verify Pexels API key is valid
- Check server logs for errors
- Ensure enough disk space

**Need help?**
- Run the interactive demo for guided testing
- Check the full README.md for detailed instructions
- Validate existing videos with: `npm run validate`