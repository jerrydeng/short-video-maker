const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

class VideoValidator {
  constructor() {
    this.validationResults = [];
  }

  async validateVideo(videoPath, expectedConfig = {}) {
    console.log(chalk.blue(`🔍 Validating video: ${path.basename(videoPath)}`));
    
    const result = {
      filePath: videoPath,
      timestamp: new Date().toISOString(),
      validations: {},
      overall: 'unknown',
      issues: [],
      warnings: []
    };

    try {
      // Check if file exists and is accessible
      const stats = await fs.stat(videoPath);
      result.validations.fileExists = true;
      result.validations.fileSize = stats.size;
      
      if (stats.size < 1000) {
        result.issues.push('File size is suspiciously small (< 1KB)');
      }

      // Get video metadata using ffprobe
      const metadata = await ffprobe(videoPath, { path: ffprobeStatic.path });
      result.metadata = metadata;

      // Validate video streams
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

      if (videoStream) {
        result.validations.hasVideo = true;
        result.validations.videoCodec = videoStream.codec_name;
        result.validations.videoDuration = parseFloat(videoStream.duration);
        result.validations.videoResolution = `${videoStream.width}x${videoStream.height}`;
        result.validations.videoFPS = eval(videoStream.r_frame_rate);

        // Validate resolution based on orientation
        if (expectedConfig.orientation === 'portrait') {
          if (videoStream.width >= videoStream.height) {
            result.issues.push('Expected portrait orientation but video is landscape');
          }
        } else if (expectedConfig.orientation === 'landscape') {
          if (videoStream.height >= videoStream.width) {
            result.issues.push('Expected landscape orientation but video is portrait');
          }
        }

        // Check for reasonable duration
        if (result.validations.videoDuration < 2) {
          result.warnings.push('Video duration is very short (< 2 seconds)');
        } else if (result.validations.videoDuration > 120) {
          result.warnings.push('Video duration is very long (> 2 minutes)');
        }

        // Check frame rate
        if (result.validations.videoFPS < 24) {
          result.warnings.push('Low frame rate detected (< 24 FPS)');
        }

      } else {
        result.validations.hasVideo = false;
        result.issues.push('No video stream found');
      }

      if (audioStream) {
        result.validations.hasAudio = true;
        result.validations.audioCodec = audioStream.codec_name;
        result.validations.audioDuration = parseFloat(audioStream.duration);
        result.validations.audioChannels = audioStream.channels;
        result.validations.audioSampleRate = audioStream.sample_rate;

        // Check audio duration vs video duration
        if (result.validations.hasVideo && Math.abs(result.validations.videoDuration - result.validations.audioDuration) > 1) {
          result.warnings.push('Audio and video durations differ significantly');
        }

        // Check for stereo audio
        if (audioStream.channels !== 2) {
          result.warnings.push('Audio is not stereo (2 channels)');
        }

      } else {
        result.validations.hasAudio = false;
        result.issues.push('No audio stream found');
      }

      // Overall validation
      if (result.issues.length === 0) {
        result.overall = result.warnings.length === 0 ? 'excellent' : 'good';
      } else {
        result.overall = 'failed';
      }

      this.logResults(result);
      this.validationResults.push(result);

    } catch (error) {
      result.validations.error = error.message;
      result.overall = 'error';
      result.issues.push(`Validation error: ${error.message}`);
      console.error(chalk.red(`❌ Error validating ${videoPath}:`), error.message);
    }

    return result;
  }

  logResults(result) {
    const fileName = path.basename(result.filePath);
    
    if (result.overall === 'excellent') {
      console.log(chalk.green(`✅ ${fileName}: Excellent quality`));
    } else if (result.overall === 'good') {
      console.log(chalk.yellow(`⚠️  ${fileName}: Good quality with warnings`));
    } else if (result.overall === 'failed') {
      console.log(chalk.red(`❌ ${fileName}: Failed validation`));
    } else {
      console.log(chalk.red(`💥 ${fileName}: Error during validation`));
    }

    // Log details
    if (result.validations.hasVideo) {
      console.log(chalk.cyan(`   📹 Video: ${result.validations.videoResolution} @ ${result.validations.videoFPS.toFixed(1)}fps, ${result.validations.videoDuration.toFixed(1)}s`));
    }
    
    if (result.validations.hasAudio) {
      console.log(chalk.cyan(`   🔊 Audio: ${result.validations.audioChannels}ch, ${result.validations.audioSampleRate}Hz, ${result.validations.audioDuration.toFixed(1)}s`));
    }

    // Log issues and warnings
    result.issues.forEach(issue => {
      console.log(chalk.red(`   ❌ ${issue}`));
    });

    result.warnings.forEach(warning => {
      console.log(chalk.yellow(`   ⚠️  ${warning}`));
    });

    console.log(''); // Empty line for spacing
  }

  async validateDirectory(dirPath) {
    console.log(chalk.blue(`📁 Validating all videos in: ${dirPath}`));
    
    try {
      const files = await fs.readdir(dirPath);
      const videoFiles = files.filter(file => 
        file.toLowerCase().endsWith('.mp4') || 
        file.toLowerCase().endsWith('.mov') ||
        file.toLowerCase().endsWith('.avi')
      );

      if (videoFiles.length === 0) {
        console.log(chalk.yellow('⚠️  No video files found in directory'));
        return [];
      }

      const results = [];
      for (const videoFile of videoFiles) {
        const videoPath = path.join(dirPath, videoFile);
        const result = await this.validateVideo(videoPath);
        results.push(result);
      }

      this.generateSummaryReport(results);
      return results;

    } catch (error) {
      console.error(chalk.red(`Error validating directory: ${error.message}`));
      throw error;
    }
  }

  generateSummaryReport(results = this.validationResults) {
    console.log(chalk.blue('\n📊 VALIDATION SUMMARY'));
    console.log(chalk.blue('='.repeat(50)));

    const excellent = results.filter(r => r.overall === 'excellent').length;
    const good = results.filter(r => r.overall === 'good').length;
    const failed = results.filter(r => r.overall === 'failed').length;
    const errors = results.filter(r => r.overall === 'error').length;

    console.log(chalk.green(`✅ Excellent: ${excellent}`));
    console.log(chalk.yellow(`⚠️  Good: ${good}`));
    console.log(chalk.red(`❌ Failed: ${failed}`));
    console.log(chalk.red(`💥 Errors: ${errors}`));
    console.log(chalk.cyan(`📁 Total: ${results.length}`));

    if (results.length > 0) {
      // Calculate averages
      const videoDurations = results
        .filter(r => r.validations.videoDuration)
        .map(r => r.validations.videoDuration);
      
      const fileSizes = results
        .filter(r => r.validations.fileSize)
        .map(r => r.validations.fileSize);

      if (videoDurations.length > 0) {
        const avgDuration = videoDurations.reduce((a, b) => a + b, 0) / videoDurations.length;
        console.log(chalk.cyan(`⏱️  Average duration: ${avgDuration.toFixed(1)}s`));
      }

      if (fileSizes.length > 0) {
        const avgSize = fileSizes.reduce((a, b) => a + b, 0) / fileSizes.length;
        console.log(chalk.cyan(`💾 Average file size: ${(avgSize / 1024 / 1024).toFixed(1)}MB`));
      }
    }

    // Common issues
    const allIssues = results.flatMap(r => r.issues);
    const issueFrequency = {};
    allIssues.forEach(issue => {
      issueFrequency[issue] = (issueFrequency[issue] || 0) + 1;
    });

    if (Object.keys(issueFrequency).length > 0) {
      console.log(chalk.red('\n🚨 COMMON ISSUES:'));
      Object.entries(issueFrequency)
        .sort((a, b) => b[1] - a[1])
        .forEach(([issue, count]) => {
          console.log(chalk.red(`   ${count}x: ${issue}`));
        });
    }

    console.log('');
  }

  async saveReport(outputPath) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.validationResults.length,
        excellent: this.validationResults.filter(r => r.overall === 'excellent').length,
        good: this.validationResults.filter(r => r.overall === 'good').length,
        failed: this.validationResults.filter(r => r.overall === 'failed').length,
        errors: this.validationResults.filter(r => r.overall === 'error').length
      },
      results: this.validationResults
    };

    await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
    console.log(chalk.green(`📄 Validation report saved to: ${outputPath}`));
  }
}

module.exports = VideoValidator;

// CLI usage
if (require.main === module) {
  const { program } = require('commander');

  program
    .name('video-validator')
    .description('Validate generated videos for quality and integrity')
    .version('1.0.0');

  program
    .command('validate')
    .description('Validate a single video file')
    .argument('<videoPath>', 'Path to video file')
    .action(async (videoPath) => {
      const validator = new VideoValidator();
      await validator.validateVideo(videoPath);
    });

  program
    .command('validate-dir')
    .description('Validate all videos in a directory')
    .argument('<dirPath>', 'Path to directory containing videos')
    .option('-r, --report <path>', 'Save validation report to file')
    .action(async (dirPath, options) => {
      const validator = new VideoValidator();
      await validator.validateDirectory(dirPath);
      
      if (options.report) {
        await validator.saveReport(options.report);
      }
    });

  program.parse();
}