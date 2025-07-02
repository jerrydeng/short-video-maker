# MCP SSE Video Creation Testing Setup

This directory contains a comprehensive testing environment for the MCP SSE video creation endpoint, allowing you to test video generation with different configurations and evaluate the results.

## Overview

The testing setup provides:
- **Sample JSON inputs** for different video scenarios
- **MCP client scripts** to test the SSE endpoint
- **Test automation scripts** for reliability testing
- **Output validation tools** to verify video quality
- **Configuration testing** for music, voices, and other parameters

## Prerequisites

1. **Pexels API Key**: Get your free API key from [Pexels API](https://www.pexels.com/api/)
2. **Server Running**: Ensure the short-video-maker server is running on `localhost:3123`
3. **Dependencies**: Install Node.js and required packages

## Quick Start

1. Set your Pexels API key:
```bash
export PEXELS_API_KEY="your-pexels-api-key-here"
```

2. Start the server:
```bash
# Using Docker (recommended)
docker run -it --rm --name short-video-maker -p 3123:3123 -e PEXELS_API_KEY=$PEXELS_API_KEY gyoridavid/short-video-maker:latest-tiny

# Or using npm
npm run dev
```

3. Run the test suite:
```bash
cd test-setup
npm install
npm test
```

## Test Categories

### 1. Basic Functionality Tests
- Simple single-scene videos
- Multi-scene videos
- Different orientations (portrait/landscape)

### 2. Audio Configuration Tests
- Different voices (male/female, accents)
- Music mood variations
- Music volume levels
- Voice with background music balance

### 3. Visual Configuration Tests
- Caption positioning (top/center/bottom)
- Caption styling and colors
- Different video orientations
- Background video search terms

### 4. Edge Case Tests
- Long text scenarios
- Short text scenarios
- Special characters in text
- Invalid search terms

### 5. Performance Tests
- Concurrent video generation
- Memory usage monitoring
- Processing time benchmarks

## Sample Test Inputs

### Minimal Test (Quick Validation)
```json
{
  "scenes": [
    {
      "text": "This is a quick test of the video generation system.",
      "searchTerms": ["technology", "computer"]
    }
  ],
  "config": {
    "paddingBack": 1000,
    "music": "chill",
    "voice": "af_heart",
    "orientation": "portrait",
    "musicVolume": "medium"
  }
}
```

### Music Mood Test Suite
Test different music moods to evaluate audio-visual harmony:
- Sad/Melancholic
- Happy/Euphoric
- Dark/Uneasy
- Chill/Contemplative
- Funny/Quirky

### Voice Variety Test
Test different voice characteristics:
- Female voices: `af_heart`, `af_bella`, `af_nova`
- Male voices: `am_adam`, `am_echo`, `bm_lewis`
- British accents: `bf_emma`, `bm_george`

## Testing Tools

### 1. MCP SSE Client (`mcp-sse-client.js`)
Interactive client for testing MCP SSE communication with real-time status updates.

### 2. Batch Tester (`batch-test.js`)
Automated testing of multiple configurations with result comparison.

### 3. Video Validator (`video-validator.js`)
Validates generated videos for:
- File integrity
- Duration accuracy
- Audio presence
- Video resolution

### 4. Performance Monitor (`performance-monitor.js`)
Monitors system resources during video generation:
- CPU usage
- Memory consumption
- Disk I/O
- Processing time

## Output Structure

Generated test videos are organized as:
```
test-outputs/
├── basic-tests/
├── music-tests/
├── voice-tests/
├── visual-tests/
├── edge-case-tests/
└── performance-tests/
```

Each test creates:
- `video.mp4` - The generated video
- `metadata.json` - Test configuration and results
- `log.txt` - Processing logs
- `performance.json` - Performance metrics

## Evaluation Criteria

### Audio Quality
- [ ] Clear speech without artifacts
- [ ] Appropriate music volume balance
- [ ] Music mood matches content
- [ ] No audio clipping or distortion

### Visual Quality
- [ ] Captions are readable and well-positioned
- [ ] Background videos are relevant to search terms
- [ ] Smooth transitions between scenes
- [ ] Proper video resolution and aspect ratio

### Timing and Synchronization
- [ ] Captions sync with speech
- [ ] Music starts/ends appropriately
- [ ] Padding time is correct
- [ ] Scene transitions are smooth

### Technical Reliability
- [ ] Consistent processing times
- [ ] No memory leaks during batch processing
- [ ] Error handling for edge cases
- [ ] SSE connection stability

## Configuration Testing Matrix

| Test Scenario | Voice | Music | Position | Volume | Orientation |
|---------------|-------|--------|----------|---------|-------------|
| Basic Test    | af_heart | chill | bottom | medium | portrait |
| Happy Content | af_bella | happy | center | high | landscape |
| Serious Content | bm_lewis | contemplative | top | low | portrait |
| Funny Content | af_nova | funny | bottom | medium | landscape |
| Dark Content | am_echo | dark | center | medium | portrait |

## Troubleshooting Guide

### Common Issues
1. **Pexels API Rate Limits**: Implement delays between requests
2. **Memory Issues**: Use smaller concurrency settings
3. **Audio Sync Problems**: Check padding and timing configurations
4. **Video Quality**: Verify search terms are descriptive

### Debug Commands
```bash
# Check server health
curl http://localhost:3123/health

# List available voices
curl http://localhost:3123/api/voices

# List music tags
curl http://localhost:3123/api/music-tags

# Check video status
curl http://localhost:3123/api/short-video/{videoId}/status
```

## Continuous Testing

Set up automated testing with:
```bash
# Daily quality assurance
npm run test:daily

# Performance regression testing
npm run test:performance

# Full feature matrix testing
npm run test:matrix
```

## Contributing to Tests

When adding new test cases:
1. Add sample JSON to `samples/`
2. Update the test matrix
3. Document expected outcomes
4. Include performance benchmarks