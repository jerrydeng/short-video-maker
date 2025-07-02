const inquirer = require('inquirer');
const MCPSSEClient = require('../tools/mcp-sse-client');
const VideoValidator = require('../tools/video-validator');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

class InteractiveDemo {
  constructor() {
    this.client = new MCPSSEClient();
    this.validator = new VideoValidator();
    this.outputDir = './demo-outputs';
  }

  async start() {
    console.log(chalk.blue('🎬 Welcome to the Short Video Maker Interactive Demo!'));
    console.log(chalk.blue('=' .repeat(55)));
    console.log(chalk.cyan('This demo will guide you through creating test videos with different configurations.'));
    console.log(chalk.cyan('You can watch and evaluate the generated videos to test functionality.\n'));

    try {
      await this.setup();
      await this.showMainMenu();
    } catch (error) {
      console.error(chalk.red('Demo failed:'), error.message);
    } finally {
      this.client.disconnect();
    }
  }

  async setup() {
    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Check server health
    console.log(chalk.blue('🔍 Checking server health...'));
    try {
      const axios = require('axios');
      const response = await axios.get('http://localhost:3123/health');
      if (response.data.status === 'ok') {
        console.log(chalk.green('✅ Server is healthy'));
      } else {
        throw new Error('Server health check failed');
      }
    } catch (error) {
      throw new Error('Server is not running. Please start the server first.');
    }

    // Connect to MCP SSE
    console.log(chalk.blue('🔗 Connecting to MCP SSE...'));
    await this.client.connect();
    console.log(chalk.green('✅ Connected successfully\n'));
  }

  async showMainMenu() {
    const choices = [
      { name: '🚀 Quick Start Demo - Simple video test', value: 'quick' },
      { name: '🎵 Music Mood Test - Test different music styles', value: 'music' },
      { name: '🗣️  Voice Test - Try different voices', value: 'voice' },
      { name: '🎨 Visual Test - Test captions and orientations', value: 'visual' },
      { name: '🔧 Custom Test - Build your own configuration', value: 'custom' },
      { name: '📊 Validate Existing Videos', value: 'validate' },
      { name: '❌ Exit', value: 'exit' }
    ];

    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: 'What would you like to test?',
        choices
      }
    ]);

    switch (choice) {
      case 'quick':
        await this.runQuickDemo();
        break;
      case 'music':
        await this.runMusicDemo();
        break;
      case 'voice':
        await this.runVoiceDemo();
        break;
      case 'visual':
        await this.runVisualDemo();
        break;
      case 'custom':
        await this.runCustomDemo();
        break;
      case 'validate':
        await this.runValidationDemo();
        break;
      case 'exit':
        console.log(chalk.blue('👋 Thanks for using the demo!'));
        return;
    }

    // Ask if they want to continue
    const { continue: cont } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'Would you like to run another test?',
        default: true
      }
    ]);

    if (cont) {
      await this.showMainMenu();
    } else {
      console.log(chalk.blue('👋 Thanks for using the demo!'));
    }
  }

  async runQuickDemo() {
    console.log(chalk.blue('\n🚀 Running Quick Start Demo'));
    console.log(chalk.cyan('This will create a simple test video to verify everything is working.\n'));

    const testConfig = {
      name: 'Quick Start Demo',
      input: {
        scenes: [
          {
            text: 'Welcome to the video creation demo. This is a quick test to make sure everything is working correctly.',
            searchTerms: ['technology', 'demo', 'test']
          }
        ],
        config: {
          paddingBack: 1500,
          music: 'chill',
          voice: 'af_heart',
          orientation: 'portrait',
          musicVolume: 'medium',
          captionPosition: 'bottom',
          captionBackgroundColor: '#2196F3'
        }
      }
    };

    await this.runTest(testConfig, 'quick-demo');
  }

  async runMusicDemo() {
    console.log(chalk.blue('\n🎵 Running Music Mood Demo'));
    
    const musicChoices = [
      { name: '😊 Happy - Upbeat and joyful', value: 'happy' },
      { name: '😢 Sad - Melancholic and emotional', value: 'sad' },
      { name: '😎 Chill - Relaxed and calm', value: 'chill' },
      { name: '🌚 Dark - Mysterious and intense', value: 'dark' },
      { name: '😂 Funny - Quirky and playful', value: 'funny' },
      { name: '🌅 Hopeful - Inspiring and uplifting', value: 'hopeful' }
    ];

    const { selectedMoods } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedMoods',
        message: 'Select music moods to test (you can select multiple):',
        choices: musicChoices,
        validate: (input) => input.length > 0 ? true : 'Please select at least one mood.'
      }
    ]);

    for (const mood of selectedMoods) {
      const testConfig = {
        name: `Music Test - ${mood.charAt(0).toUpperCase() + mood.slice(1)}`,
        input: {
          scenes: [
            {
              text: this.getMusicTestText(mood),
              searchTerms: this.getMusicSearchTerms(mood)
            }
          ],
          config: {
            paddingBack: 2000,
            music: mood,
            voice: 'af_bella',
            orientation: 'portrait',
            musicVolume: 'high',
            captionPosition: 'center',
            captionBackgroundColor: this.getMusicColor(mood)
          }
        }
      };

      await this.runTest(testConfig, 'music-demo');
    }
  }

  async runVoiceDemo() {
    console.log(chalk.blue('\n🗣️  Running Voice Demo'));
    
    const voiceChoices = [
      { name: '👩 af_heart - Female, warm', value: 'af_heart' },
      { name: '👩 af_bella - Female, clear', value: 'af_bella' },
      { name: '👩 af_nova - Female, modern', value: 'af_nova' },
      { name: '👨 am_adam - Male, deep', value: 'am_adam' },
      { name: '👨 am_echo - Male, smooth', value: 'am_echo' },
      { name: '👨 bm_lewis - Male, British', value: 'bm_lewis' },
      { name: '👩 bf_emma - Female, British', value: 'bf_emma' }
    ];

    const { selectedVoices } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedVoices',
        message: 'Select voices to test (you can select multiple):',
        choices: voiceChoices,
        validate: (input) => input.length > 0 ? true : 'Please select at least one voice.'
      }
    ]);

    for (const voice of selectedVoices) {
      const testConfig = {
        name: `Voice Test - ${voice}`,
        input: {
          scenes: [
            {
              text: 'Hello! This is a voice test. You can hear the distinct characteristics of this particular voice. Each voice has its own personality and tone.',
              searchTerms: ['person', 'speaking', 'communication']
            }
          ],
          config: {
            paddingBack: 1500,
            music: 'chill',
            voice: voice,
            orientation: 'portrait',
            musicVolume: 'low',
            captionPosition: 'bottom',
            captionBackgroundColor: '#4CAF50'
          }
        }
      };

      await this.runTest(testConfig, 'voice-demo');
    }
  }

  async runVisualDemo() {
    console.log(chalk.blue('\n🎨 Running Visual Demo'));
    
    const orientations = [
      { name: '📱 Portrait (9:16) - Mobile-friendly', value: 'portrait' },
      { name: '🖥️  Landscape (16:9) - Desktop-friendly', value: 'landscape' }
    ];

    const positions = [
      { name: '⬆️  Top', value: 'top' },
      { name: '⏺️  Center', value: 'center' },
      { name: '⬇️  Bottom', value: 'bottom' }
    ];

    const { orientation } = await inquirer.prompt([
      {
        type: 'list',
        name: 'orientation',
        message: 'Select video orientation:',
        choices: orientations
      }
    ]);

    const { position } = await inquirer.prompt([
      {
        type: 'list',
        name: 'position',
        message: 'Select caption position:',
        choices: positions
      }
    ]);

    const { color } = await inquirer.prompt([
      {
        type: 'input',
        name: 'color',
        message: 'Enter caption background color (hex code):',
        default: '#FF5722',
        validate: (input) => /^#[0-9A-Fa-f]{6}$/.test(input) ? true : 'Please enter a valid hex color (e.g., #FF5722)'
      }
    ]);

    const testConfig = {
      name: `Visual Test - ${orientation} ${position}`,
      input: {
        scenes: [
          {
            text: `This is a visual test. The video is in ${orientation} orientation with captions positioned at the ${position} of the screen.`,
            searchTerms: ['visual', 'design', 'layout']
          }
        ],
        config: {
          paddingBack: 1500,
          music: 'contemplative',
          voice: 'af_nova',
          orientation: orientation,
          musicVolume: 'medium',
          captionPosition: position,
          captionBackgroundColor: color
        }
      }
    };

    await this.runTest(testConfig, 'visual-demo');
  }

  async runCustomDemo() {
    console.log(chalk.blue('\n🔧 Running Custom Demo'));
    console.log(chalk.cyan('Build your own video configuration:\n'));

    const { text } = await inquirer.prompt([
      {
        type: 'input',
        name: 'text',
        message: 'Enter the text to be spoken:',
        validate: (input) => input.trim().length > 0 ? true : 'Please enter some text.'
      }
    ]);

    const { searchTerms } = await inquirer.prompt([
      {
        type: 'input',
        name: 'searchTerms',
        message: 'Enter search terms for background video (comma-separated):',
        default: 'nature, peaceful, scenic',
        filter: (input) => input.split(',').map(term => term.trim())
      }
    ]);

    // Get available options from server
    const musicTags = await this.getAvailableMusicTags();
    const voices = await this.getAvailableVoices();

    const config = await inquirer.prompt([
      {
        type: 'list',
        name: 'music',
        message: 'Select music mood:',
        choices: musicTags.map(tag => ({ name: tag, value: tag }))
      },
      {
        type: 'list',
        name: 'voice',
        message: 'Select voice:',
        choices: voices.map(voice => ({ name: voice, value: voice }))
      },
      {
        type: 'list',
        name: 'orientation',
        message: 'Select orientation:',
        choices: [
          { name: 'Portrait (9:16)', value: 'portrait' },
          { name: 'Landscape (16:9)', value: 'landscape' }
        ]
      },
      {
        type: 'list',
        name: 'captionPosition',
        message: 'Select caption position:',
        choices: [
          { name: 'Top', value: 'top' },
          { name: 'Center', value: 'center' },
          { name: 'Bottom', value: 'bottom' }
        ]
      },
      {
        type: 'list',
        name: 'musicVolume',
        message: 'Select music volume:',
        choices: [
          { name: 'Muted', value: 'muted' },
          { name: 'Low', value: 'low' },
          { name: 'Medium', value: 'medium' },
          { name: 'High', value: 'high' }
        ]
      }
    ]);

    const testConfig = {
      name: 'Custom Test',
      input: {
        scenes: [
          {
            text: text,
            searchTerms: searchTerms
          }
        ],
        config: {
          paddingBack: 1500,
          captionBackgroundColor: '#9C27B0',
          ...config
        }
      }
    };

    await this.runTest(testConfig, 'custom-demo');
  }

  async runValidationDemo() {
    console.log(chalk.blue('\n📊 Running Validation Demo'));
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to validate?',
        choices: [
          { name: '📁 All videos in demo outputs', value: 'all' },
          { name: '📹 Specific video file', value: 'specific' }
        ]
      }
    ]);

    if (action === 'all') {
      await this.validator.validateDirectory(this.outputDir);
    } else {
      const { filePath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'filePath',
          message: 'Enter path to video file:',
          validate: async (input) => {
            try {
              await fs.access(input);
              return true;
            } catch {
              return 'File not found. Please enter a valid path.';
            }
          }
        }
      ]);

      await this.validator.validateVideo(filePath);
    }
  }

  async runTest(testConfig, category) {
    console.log(chalk.blue(`\n🎬 Creating: ${testConfig.name}`));
    
    try {
      const result = await this.client.runTest(testConfig, path.join(this.outputDir, category));
      
      // Validate the video
      const validation = await this.validator.validateVideo(result.outputPath, testConfig.input.config);
      
      console.log(chalk.green(`\n✅ Video created successfully!`));
      console.log(chalk.cyan(`📁 Output: ${result.outputPath}`));
      console.log(chalk.cyan(`🆔 Video ID: ${result.videoId}`));
      
      if (validation.overall === 'excellent') {
        console.log(chalk.green(`✨ Quality: Excellent`));
      } else if (validation.overall === 'good') {
        console.log(chalk.yellow(`⚠️  Quality: Good (with warnings)`));
      } else {
        console.log(chalk.red(`❌ Quality: Issues detected`));
      }

      // Ask if they want to play the video
      const { playVideo } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'playVideo',
          message: 'Would you like to open the video to watch it?',
          default: true
        }
      ]);

      if (playVideo) {
        await this.openVideo(result.outputPath);
      }

    } catch (error) {
      console.error(chalk.red(`❌ Failed to create video: ${error.message}`));
    }
  }

  async openVideo(videoPath) {
    const os = require('os');
    const { exec } = require('child_process');
    
    let command;
    switch (os.platform()) {
      case 'darwin': // macOS
        command = `open "${videoPath}"`;
        break;
      case 'win32': // Windows
        command = `start "" "${videoPath}"`;
        break;
      default: // Linux
        command = `xdg-open "${videoPath}"`;
        break;
    }

    exec(command, (error) => {
      if (error) {
        console.log(chalk.yellow(`⚠️  Could not open video automatically. File location: ${videoPath}`));
      } else {
        console.log(chalk.green(`🎥 Opening video in default player...`));
      }
    });
  }

  async getAvailableMusicTags() {
    try {
      const axios = require('axios');
      const response = await axios.get('http://localhost:3123/api/music-tags');
      return response.data;
    } catch {
      return ['happy', 'sad', 'chill', 'dark', 'funny', 'hopeful', 'angry', 'excited'];
    }
  }

  async getAvailableVoices() {
    try {
      const axios = require('axios');
      const response = await axios.get('http://localhost:3123/api/voices');
      return response.data;
    } catch {
      return ['af_heart', 'af_bella', 'af_nova', 'am_adam', 'am_echo', 'bm_lewis'];
    }
  }

  getMusicTestText(mood) {
    const texts = {
      happy: 'What a wonderful day! The sun is shining, birds are singing, and everything feels absolutely amazing!',
      sad: 'Sometimes life brings us moments of reflection. In these quiet times, we find beauty in our memories.',
      chill: 'Take a deep breath and relax. Let the peaceful rhythm of life wash over you like gentle waves.',
      dark: 'In the shadows of the night, mysteries unfold and secrets whisper through the darkness.',
      funny: 'Why did the coffee file a police report? It got mugged! Sometimes the best medicine is laughter.',
      hopeful: 'Every ending is a new beginning. Tomorrow brings fresh opportunities and endless possibilities.'
    };
    return texts[mood] || 'This is a music test with background music.';
  }

  getMusicSearchTerms(mood) {
    const terms = {
      happy: ['sunshine', 'flowers', 'celebration', 'joy'],
      sad: ['rain', 'memories', 'reflection', 'contemplation'],
      chill: ['ocean', 'waves', 'peaceful', 'meditation'],
      dark: ['shadows', 'night', 'mysterious', 'dramatic'],
      funny: ['comedy', 'laughter', 'fun', 'playful'],
      hopeful: ['sunrise', 'growth', 'inspiration', 'future']
    };
    return terms[mood] || ['music', 'audio', 'sound'];
  }

  getMusicColor(mood) {
    const colors = {
      happy: '#FFD700',
      sad: '#6C7B7F',
      chill: '#4A90E2',
      dark: '#330033',
      funny: '#FF6B6B',
      hopeful: '#FF9500'
    };
    return colors[mood] || '#2196F3';
  }
}

// Run the demo
if (require.main === module) {
  const demo = new InteractiveDemo();
  demo.start().catch(console.error);
}

module.exports = InteractiveDemo;