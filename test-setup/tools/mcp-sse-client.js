const EventSource = require('eventsource');
const axios = require('axios');
const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs').promises;
const path = require('path');

class MCPSSEClient {
  constructor(baseUrl = 'http://localhost:3123') {
    this.baseUrl = baseUrl;
    this.sessionId = null;
    this.eventSource = null;
    this.spinner = null;
  }

  async connect() {
    console.log(chalk.blue('🔗 Connecting to MCP SSE endpoint...'));
    
    try {
      // Initialize SSE connection
      this.eventSource = new EventSource(`${this.baseUrl}/mcp/sse`);
      
      return new Promise((resolve, reject) => {
        this.eventSource.onopen = () => {
          console.log(chalk.green('✅ Connected to MCP SSE'));
          resolve();
        };

        this.eventSource.onerror = (error) => {
          console.error(chalk.red('❌ SSE Connection error:'), error);
          reject(error);
        };

        this.eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (err) {
            console.error(chalk.red('Error parsing SSE message:'), err);
          }
        };

        // Extract session ID from the SSE connection
        setTimeout(() => {
          const url = this.eventSource.url;
          const urlParams = new URLSearchParams(url.split('?')[1]);
          this.sessionId = urlParams.get('sessionId') || 'default';
          console.log(chalk.cyan(`📱 Session ID: ${this.sessionId}`));
        }, 100);
      });
    } catch (error) {
      console.error(chalk.red('Failed to connect:'), error.message);
      throw error;
    }
  }

  handleMessage(data) {
    if (data.type === 'progress') {
      if (this.spinner) {
        this.spinner.text = `${data.message} (${data.progress}%)`;
      }
    } else if (data.type === 'result') {
      if (this.spinner) {
        this.spinner.succeed(chalk.green(`✅ ${data.message}`));
        this.spinner = null;
      }
      console.log(chalk.green('🎬 Video created with ID:'), chalk.bold(data.videoId));
    } else if (data.type === 'error') {
      if (this.spinner) {
        this.spinner.fail(chalk.red(`❌ ${data.message}`));
        this.spinner = null;
      }
      console.error(chalk.red('Error:'), data.message);
    }
  }

  async sendMessage(message) {
    if (!this.sessionId) {
      throw new Error('Not connected. Call connect() first.');
    }

    try {
      const response = await axios.post(`${this.baseUrl}/mcp/messages?sessionId=${this.sessionId}`, message, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error(chalk.red('Failed to send message:'), error.message);
      throw error;
    }
  }

  async createVideo(scenes, config, testName = 'Test Video') {
    console.log(chalk.blue(`🎬 Creating video: ${testName}`));
    
    this.spinner = ora('Preparing video creation...').start();

    const message = {
      method: 'tools/call',
      params: {
        name: 'create-short-video',
        arguments: {
          scenes,
          config
        }
      }
    };

    try {
      const result = await this.sendMessage(message);
      
      if (result.content && result.content[0]) {
        const videoId = result.content[0].text;
        console.log(chalk.green('🆔 Video ID:'), chalk.bold(videoId));
        return videoId;
      } else {
        throw new Error('No video ID returned');
      }
    } catch (error) {
      if (this.spinner) {
        this.spinner.fail('Failed to create video');
        this.spinner = null;
      }
      throw error;
    }
  }

  async getVideoStatus(videoId) {
    const message = {
      method: 'tools/call',
      params: {
        name: 'get-video-status',
        arguments: {
          videoId
        }
      }
    };

    try {
      const result = await this.sendMessage(message);
      if (result.content && result.content[0]) {
        return result.content[0].text;
      }
      return 'unknown';
    } catch (error) {
      console.error(chalk.red('Failed to get video status:'), error.message);
      return 'error';
    }
  }

  async waitForVideo(videoId, maxWaitTime = 300000) { // 5 minutes
    console.log(chalk.blue('⏳ Waiting for video to be ready...'));
    
    const startTime = Date.now();
    const checkInterval = 5000; // Check every 5 seconds
    
    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const status = await this.getVideoStatus(videoId);
          console.log(chalk.cyan(`📊 Status: ${status}`));
          
          if (status === 'ready') {
            console.log(chalk.green('✅ Video is ready!'));
            resolve(true);
          } else if (status === 'failed') {
            reject(new Error('Video processing failed'));
          } else if (Date.now() - startTime > maxWaitTime) {
            reject(new Error('Timeout waiting for video'));
          } else {
            setTimeout(checkStatus, checkInterval);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      checkStatus();
    });
  }

  async downloadVideo(videoId, outputPath) {
    try {
      console.log(chalk.blue('⬇️ Downloading video...'));
      
      const response = await axios.get(`${this.baseUrl}/api/short-video/${videoId}`, {
        responseType: 'stream'
      });

      const writer = require('fs').createWriteStream(outputPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(chalk.green(`✅ Video saved to: ${outputPath}`));
          resolve(outputPath);
        });
        writer.on('error', reject);
      });
    } catch (error) {
      console.error(chalk.red('Failed to download video:'), error.message);
      throw error;
    }
  }

  async runTest(testConfig, outputDir) {
    try {
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });
      
      // Create video
      const videoId = await this.createVideo(
        testConfig.input.scenes,
        testConfig.input.config,
        testConfig.name
      );

      // Wait for completion
      await this.waitForVideo(videoId);

      // Download video
      const outputPath = path.join(outputDir, `${testConfig.name.replace(/\s+/g, '-').toLowerCase()}.mp4`);
      await this.downloadVideo(videoId, outputPath);

      // Save test metadata
      const metadataPath = path.join(outputDir, `${testConfig.name.replace(/\s+/g, '-').toLowerCase()}-metadata.json`);
      await fs.writeFile(metadataPath, JSON.stringify({
        testConfig,
        videoId,
        outputPath,
        timestamp: new Date().toISOString(),
        status: 'completed'
      }, null, 2));

      console.log(chalk.green(`🎉 Test completed successfully: ${testConfig.name}`));
      return { videoId, outputPath, metadataPath };

    } catch (error) {
      console.error(chalk.red(`❌ Test failed: ${testConfig.name}`), error.message);
      throw error;
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      console.log(chalk.blue('🔌 Disconnected from MCP SSE'));
    }
  }
}

module.exports = MCPSSEClient;

// CLI usage
if (require.main === module) {
  const { program } = require('commander');

  program
    .name('mcp-sse-client')
    .description('MCP SSE Client for testing video creation')
    .version('1.0.0');

  program
    .command('test')
    .description('Run a test from a JSON file')
    .argument('<testFile>', 'Path to test configuration JSON file')
    .option('-o, --output <dir>', 'Output directory', './test-outputs')
    .action(async (testFile, options) => {
      try {
        const testConfig = JSON.parse(await fs.readFile(testFile, 'utf8'));
        const client = new MCPSSEClient();
        
        await client.connect();
        await client.runTest(testConfig, options.output);
        client.disconnect();
        
      } catch (error) {
        console.error(chalk.red('Test failed:'), error.message);
        process.exit(1);
      }
    });

  program.parse();
}