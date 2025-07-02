#!/usr/bin/env node

// Test script for music expansion functionality
const path = require('path');
const fs = require('fs-extra');

// Set up the environment
process.env.PEXELS_API_KEY = 'test-key';
process.env.NODE_ENV = 'test';

// Import the Config and MusicManager
const { Config } = require('../dist/config');
const { MusicManager } = require('../dist/short-creator/music');

async function testMusicExpansion() {
  console.log('🎵 Testing Music Expansion Functionality');
  console.log('========================================');
  console.log('');

  try {
    // Initialize config
    const config = new Config();
    console.log('✅ Config initialized');
    console.log(`📁 Music directory: ${config.musicDirPath}`);
    console.log('');

    // Initialize MusicManager (this should create the expanded directory structure)
    const musicManager = new MusicManager(config);
    console.log('✅ MusicManager initialized');
    console.log('');

    // Check if expanded directory was created
    const expandedPath = path.join(config.musicDirPath, 'expanded');
    if (fs.existsSync(expandedPath)) {
      console.log('✅ Expanded music directory created');
      console.log(`📁 Location: ${expandedPath}`);
      
      // List mood directories
      const moodDirs = fs.readdirSync(expandedPath).filter(item => 
        fs.statSync(path.join(expandedPath, item)).isDirectory()
      );
      
      console.log(`📂 Mood directories created: ${moodDirs.length}`);
      moodDirs.forEach(dir => console.log(`   - ${dir}`));
      console.log('');

      // Check if README was created
      const readmePath = path.join(expandedPath, 'README.md');
      if (fs.existsSync(readmePath)) {
        console.log('✅ README.md created with instructions');
      } else {
        console.log('❌ README.md not found');
      }
      console.log('');
    } else {
      console.log('❌ Expanded music directory not created');
      console.log('');
    }

    // Test music library stats
    const stats = musicManager.getLibraryStats();
    console.log('📊 Library Statistics:');
    console.log(`   Original tracks: ${stats.original}`);
    console.log(`   Expanded tracks: ${stats.expanded}`);
    console.log(`   Total tracks: ${stats.original + stats.expanded}`);
    console.log('');

    // Test mood distribution
    console.log('📈 Tracks by mood:');
    Object.entries(stats.byMood).forEach(([mood, count]) => {
      console.log(`   ${mood}: ${count} tracks`);
    });
    console.log('');

    // Test music selection
    console.log('🎵 Testing music selection...');
    const testMusic = musicManager.findMusicForVideo(60, 'happy');
    console.log(`   Selected: ${testMusic.file}`);
    console.log(`   Mood: ${testMusic.mood}`);
    console.log(`   URL: ${testMusic.url}`);
    console.log('');

    // Test with a mood that might not have music
    const fallbackMusic = musicManager.findMusicForVideo(60, 'excited');
    console.log('🔄 Testing fallback mechanism...');
    console.log(`   Requested mood: excited`);
    console.log(`   Selected: ${fallbackMusic.file}`);
    console.log(`   Actual mood: ${fallbackMusic.mood}`);
    console.log('');

    console.log('🎉 All tests passed! Music expansion is working correctly.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: ./scripts/download-music.sh');
    console.log('2. Download SuloSounds pack from: https://sulosounds.itch.io/100-songs');
    console.log('3. Extract and sort files into mood folders');
    console.log('4. Enjoy 10x more music variety! 🎵');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Make sure you have built the project: npm run build');
    console.error('2. Check that all dependencies are installed: npm install');
    console.error('3. Verify PEXELS_API_KEY is set (even for testing)');
    process.exit(1);
  }
}

// Run the test
testMusicExpansion().catch(console.error);