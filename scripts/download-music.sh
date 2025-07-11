#!/bin/bash

# Music Download Helper Script
# This script helps download and organize free music packs for your video generator

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MUSIC_DIR="$PROJECT_ROOT/static/music/expanded"

echo "🎵 Music Download Helper"
echo "======================="
echo ""

# Ensure expanded music directory exists
if [ ! -d "$MUSIC_DIR" ]; then
    echo "❌ Expanded music directory not found. Please run the application first to create the directory structure."
    echo "Expected location: $MUSIC_DIR"
    exit 1
fi

echo "📁 Music directory: $MUSIC_DIR"
echo ""

# Function to download and extract SuloSounds pack
download_sulosounds() {
    echo "📥 Downloading SuloSounds 100+ Song Library (CC0)..."
    echo "   Source: https://sulosounds.itch.io/100-songs"
    echo "   License: CC0 (Public Domain)"
    echo "   Size: ~2.5GB"
    echo ""
    
    # Create temp directory
    TEMP_DIR=$(mktemp -d)
    echo "📁 Temporary directory: $TEMP_DIR"
    
    # Note: itch.io doesn't allow direct downloads, so we provide instructions
    echo "⚠️  Manual Download Required"
    echo "   Due to itch.io's download protection, you need to download manually:"
    echo ""
    echo "   1. Visit: https://sulosounds.itch.io/100-songs"
    echo "   2. Click 'Download' (it's free!)"
    echo "   3. Extract the ZIP file"
    echo "   4. Move music files to appropriate mood folders in:"
    echo "      $MUSIC_DIR"
    echo ""
    echo "💡 Quick categorization tips:"
    echo "   - happy/excited: Upbeat, energetic tracks"
    echo "   - chill/contemplative: Slow, ambient tracks"  
    echo "   - sad/melancholic: Minor keys, slow tempo"
    echo "   - dark/uneasy: Dissonant, tense music"
    echo ""
    
    # Clean up
    rm -rf "$TEMP_DIR"
}

# Function to download Free Music Archive samples
download_fma_samples() {
    echo "📥 Downloading Free Music Archive samples..."
    echo "   Source: https://freemusicarchive.org/"
    echo "   License: Various Creative Commons"
    echo ""
    
    # Create temp directory
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    # Download a few sample tracks using curl/wget if available
    if command -v curl &> /dev/null; then
        echo "📡 Downloading sample tracks..."
        
        # Note: FMA changed their structure, so we provide instructions instead
        echo "⚠️  Manual Download Recommended"
        echo "   The Free Music Archive has changed their download structure."
        echo "   For best results:"
        echo ""
        echo "   1. Visit: https://freemusicarchive.org/"
        echo "   2. Browse by genre or mood"
        echo "   3. Look for CC0 or CC-BY licensed tracks"
        echo "   4. Download individual tracks or collections"
        echo "   5. Sort them into mood folders"
        echo ""
    fi
    
    # Clean up
    cd "$PROJECT_ROOT"
    rm -rf "$TEMP_DIR"
}

# Function to show current library status
show_library_status() {
    echo "📊 Current Music Library Status"
    echo "=============================="
    echo ""
    
    for mood_dir in "$MUSIC_DIR"/*; do
        if [ -d "$mood_dir" ]; then
            mood_name=$(basename "$mood_dir")
            count=$(find "$mood_dir" -name "*.mp3" -o -name "*.wav" -o -name "*.ogg" | wc -l)
            echo "   $mood_name: $count tracks"
        fi
    done
    echo ""
    
    total_expanded=$(find "$MUSIC_DIR" -name "*.mp3" -o -name "*.wav" -o -name "*.ogg" | wc -l)
    echo "   Total expanded tracks: $total_expanded"
    echo "   Original tracks: 32"
    echo "   Total library: $((total_expanded + 32)) tracks"
    echo ""
}

# Function to organize files by mood (helper for manual sorting)
organize_music() {
    echo "🗂️  Music Organization Helper"
    echo "=========================="
    echo ""
    echo "This will help you organize downloaded music files."
    echo "Place your downloaded music files in: $MUSIC_DIR/unsorted/"
    echo ""
    
    UNSORTED_DIR="$MUSIC_DIR/unsorted"
    mkdir -p "$UNSORTED_DIR"
    
    if [ "$(ls -A "$UNSORTED_DIR" 2>/dev/null)" ]; then
        echo "📁 Found files in unsorted directory:"
        ls -la "$UNSORTED_DIR"/*.{mp3,wav,ogg} 2>/dev/null | head -10
        echo ""
        echo "💡 Manual sorting tips:"
        echo "   - Listen to each track"
        echo "   - Move to appropriate mood folder:"
        for mood_dir in "$MUSIC_DIR"/*; do
            if [ -d "$mood_dir" ] && [ "$(basename "$mood_dir")" != "unsorted" ]; then
                echo "     mv '$UNSORTED_DIR/song.mp3' '$(basename "$mood_dir")/"
            fi
        done
    else
        echo "📁 Unsorted directory is empty. Place your downloaded music files here:"
        echo "   $UNSORTED_DIR"
    fi
    echo ""
}

# Main menu
show_menu() {
    echo "Choose an option:"
    echo "1) Download SuloSounds pack (manual)"
    echo "2) Download Free Music Archive samples (manual)"
    echo "3) Show current library status"
    echo "4) Organize downloaded music"
    echo "5) Exit"
    echo ""
    read -p "Enter choice [1-5]: " choice
    
    case $choice in
        1) download_sulosounds ;;
        2) download_fma_samples ;;
        3) show_library_status ;;
        4) organize_music ;;
        5) echo "👋 Happy music making!"; exit 0 ;;
        *) echo "Invalid choice. Please try again."; echo ""; show_menu ;;
    esac
}

# Check if we're running the script directly
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    # Show initial status
    show_library_status
    
    # Show menu
    while true; do
        show_menu
        echo ""
        read -p "Press Enter to continue or Ctrl+C to exit..."
        echo ""
    done
fi