const MCPSSEClient = require('./tools/mcp-sse-client');
const VideoValidator = require('./tools/video-validator');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');

class TestRunner {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3123';
    this.outputDir = options.outputDir || './test-outputs';
    this.client = new MCPSSEClient(this.baseUrl);
    this.validator = new VideoValidator();
    this.results = [];
  }

  async setup() {
    console.log(chalk.blue('🚀 Setting up test environment...'));
    
    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });
    
    // Check server health
    await this.checkServerHealth();
    
    // Connect to MCP SSE
    await this.client.connect();
    
    console.log(chalk.green('✅ Test environment ready'));
  }

  async checkServerHealth() {
    try {
      const axios = require('axios');
      const response = await axios.get(`${this.baseUrl}/health`);
      
      if (response.data.status === 'ok') {
        console.log(chalk.green('✅ Server is healthy'));
      } else {
        throw new Error('Server health check failed');
      }
    } catch (error) {
      console.error(chalk.red('❌ Server health check failed:'), error.message);
      console.error(chalk.yellow('💡 Make sure the server is running on', this.baseUrl));
      process.exit(1);
    }
  }

  async runSample(samplePath, testCategory = 'general') {
    console.log(chalk.blue(`\n🎬 Running test: ${path.basename(samplePath)}`));
    
    try {
      const testConfig = JSON.parse(await fs.readFile(samplePath, 'utf8'));
      const categoryDir = path.join(this.outputDir, testCategory);
      await fs.mkdir(categoryDir, { recursive: true });
      
      const startTime = Date.now();
      const result = await this.client.runTest(testConfig, categoryDir);
      const processingTime = Date.now() - startTime;
      
      // Validate the generated video
      const validationResult = await this.validator.validateVideo(
        result.outputPath, 
        testConfig.input.config
      );
      
      const testResult = {
        testName: testConfig.name || path.basename(samplePath),
        testCategory,
        processingTime,
        ...result,
        validation: validationResult,
        status: validationResult.overall === 'error' ? 'failed' : 'completed'
      };
      
      this.results.push(testResult);
      return testResult;
      
    } catch (error) {
      console.error(chalk.red(`❌ Test failed: ${error.message}`));
      const testResult = {
        testName: path.basename(samplePath),
        testCategory,
        status: 'failed',
        error: error.message
      };
      this.results.push(testResult);
      return testResult;
    }
  }

  async runSampleArray(samples, testCategory = 'batch') {
    console.log(chalk.blue(`\n📦 Running batch test: ${samples.length} samples`));
    
    const categoryDir = path.join(this.outputDir, testCategory);
    await fs.mkdir(categoryDir, { recursive: true });
    
    const results = [];
    
    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];
      console.log(chalk.blue(`\n[${i + 1}/${samples.length}] ${sample.name}`));
      
      try {
        const startTime = Date.now();
        const result = await this.client.runTest(sample, categoryDir);
        const processingTime = Date.now() - startTime;
        
        // Validate the generated video
        const validationResult = await this.validator.validateVideo(
          result.outputPath,
          sample.input.config
        );
        
        const testResult = {
          testName: sample.name,
          testCategory,
          processingTime,
          ...result,
          validation: validationResult,
          status: validationResult.overall === 'error' ? 'failed' : 'completed'
        };
        
        results.push(testResult);
        this.results.push(testResult);
        
      } catch (error) {
        console.error(chalk.red(`❌ Test failed: ${error.message}`));
        const testResult = {
          testName: sample.name,
          testCategory,
          status: 'failed',
          error: error.message
        };
        results.push(testResult);
        this.results.push(testResult);
      }
      
      // Small delay between tests to avoid overwhelming the server
      if (i < samples.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return results;
  }

  async runBasicTests() {
    console.log(chalk.blue('\n🔧 Running Basic Tests'));
    console.log(chalk.blue('='.repeat(50)));
    
    const basicTests = [
      './samples/minimal-test.json',
      './samples/multi-scene-test.json'
    ];
    
    for (const testPath of basicTests) {
      if (await this.fileExists(testPath)) {
        await this.runSample(testPath, 'basic-tests');
      } else {
        console.log(chalk.yellow(`⚠️  Skipping ${testPath} - file not found`));
      }
    }
  }

  async runMusicTests() {
    console.log(chalk.blue('\n🎵 Running Music Tests'));
    console.log(chalk.blue('='.repeat(50)));
    
    const musicTestsPath = './samples/music-mood-tests.json';
    if (await this.fileExists(musicTestsPath)) {
      const musicTests = JSON.parse(await fs.readFile(musicTestsPath, 'utf8'));
      await this.runSampleArray(musicTests, 'music-tests');
    } else {
      console.log(chalk.yellow(`⚠️  Skipping music tests - ${musicTestsPath} not found`));
    }
  }

  async runAllTests() {
    console.log(chalk.blue('\n🎯 Running Complete Test Suite'));
    console.log(chalk.blue('='.repeat(50)));
    
    await this.runBasicTests();
    await this.runMusicTests();
    // Add more test categories here as you create them
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  generateSummaryReport() {
    console.log(chalk.blue('\n📊 TEST SUMMARY REPORT'));
    console.log(chalk.blue('='.repeat(50)));
    
    const totalTests = this.results.length;
    const completedTests = this.results.filter(r => r.status === 'completed').length;
    const failedTests = this.results.filter(r => r.status === 'failed').length;
    
    console.log(chalk.cyan(`📁 Total Tests: ${totalTests}`));
    console.log(chalk.green(`✅ Completed: ${completedTests}`));
    console.log(chalk.red(`❌ Failed: ${failedTests}`));
    
    if (completedTests > 0) {
      const validationResults = this.results
        .filter(r => r.validation)
        .map(r => r.validation);
      
      const excellentVideos = validationResults.filter(v => v.overall === 'excellent').length;
      const goodVideos = validationResults.filter(v => v.overall === 'good').length;
      const failedVideos = validationResults.filter(v => v.overall === 'failed').length;
      
      console.log(chalk.blue('\n🎬 VIDEO QUALITY:'));
      console.log(chalk.green(`✨ Excellent: ${excellentVideos}`));
      console.log(chalk.yellow(`⚠️  Good: ${goodVideos}`));
      console.log(chalk.red(`❌ Failed: ${failedVideos}`));
      
      // Processing time statistics
      const processingTimes = this.results
        .filter(r => r.processingTime)
        .map(r => r.processingTime);
      
      if (processingTimes.length > 0) {
        const avgTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
        const minTime = Math.min(...processingTimes);
        const maxTime = Math.max(...processingTimes);
        
        console.log(chalk.blue('\n⏱️  PROCESSING TIMES:'));
        console.log(chalk.cyan(`Average: ${(avgTime / 1000).toFixed(1)}s`));
        console.log(chalk.cyan(`Fastest: ${(minTime / 1000).toFixed(1)}s`));
        console.log(chalk.cyan(`Slowest: ${(maxTime / 1000).toFixed(1)}s`));
      }
    }
    
    // Group by test category
    const categories = [...new Set(this.results.map(r => r.testCategory))];
    console.log(chalk.blue('\n📂 BY CATEGORY:'));
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.testCategory === category);
      const completed = categoryResults.filter(r => r.status === 'completed').length;
      const total = categoryResults.length;
      console.log(chalk.cyan(`${category}: ${completed}/${total}`));
    });
    
    console.log('');
  }

  async saveReport() {
    const reportPath = path.join(this.outputDir, 'test-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        completed: this.results.filter(r => r.status === 'completed').length,
        failed: this.results.filter(r => r.status === 'failed').length
      },
      results: this.results
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(chalk.green(`📄 Full test report saved to: ${reportPath}`));
  }

  async cleanup() {
    this.client.disconnect();
    console.log(chalk.blue('🧹 Test environment cleaned up'));
  }
}

// CLI Interface
if (require.main === module) {
  program
    .name('test-runner')
    .description('Comprehensive test runner for MCP SSE video creation')
    .version('1.0.0');

  program
    .command('all')
    .description('Run all test suites')
    .option('-o, --output <dir>', 'Output directory', './test-outputs')
    .option('-u, --url <url>', 'Server URL', 'http://localhost:3123')
    .action(async (options) => {
      const runner = new TestRunner(options);
      try {
        await runner.setup();
        await runner.runAllTests();
        runner.generateSummaryReport();
        await runner.saveReport();
      } finally {
        await runner.cleanup();
      }
    });

  program
    .command('basic')
    .description('Run basic functionality tests')
    .option('-o, --output <dir>', 'Output directory', './test-outputs')
    .option('-u, --url <url>', 'Server URL', 'http://localhost:3123')
    .action(async (options) => {
      const runner = new TestRunner(options);
      try {
        await runner.setup();
        await runner.runBasicTests();
        runner.generateSummaryReport();
        await runner.saveReport();
      } finally {
        await runner.cleanup();
      }
    });

  program
    .command('music')
    .description('Run music mood tests')
    .option('-o, --output <dir>', 'Output directory', './test-outputs')
    .option('-u, --url <url>', 'Server URL', 'http://localhost:3123')
    .action(async (options) => {
      const runner = new TestRunner(options);
      try {
        await runner.setup();
        await runner.runMusicTests();
        runner.generateSummaryReport();
        await runner.saveReport();
      } finally {
        await runner.cleanup();
      }
    });

  program
    .command('sample')
    .description('Run a specific test sample')
    .argument('<samplePath>', 'Path to test sample JSON file')
    .option('-o, --output <dir>', 'Output directory', './test-outputs')
    .option('-u, --url <url>', 'Server URL', 'http://localhost:3123')
    .action(async (samplePath, options) => {
      const runner = new TestRunner(options);
      try {
        await runner.setup();
        await runner.runSample(samplePath);
        runner.generateSummaryReport();
        await runner.saveReport();
      } finally {
        await runner.cleanup();
      }
    });

  program.parse();
}

module.exports = TestRunner;