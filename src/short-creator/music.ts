import path from "path";
import fs from "fs-extra";

import { type Music, MusicForVideo, MusicMoodEnum } from "../types/shorts";
import { Config } from "../config";

// Expanded music library with mood-based organization
interface ExpandedMusicLibrary {
  [mood: string]: string[]; // mood -> array of filenames
}

export class MusicManager {
  private static originalMusicList: Music[] = [
    {
      file: "Sly Sky - Telecasted.mp3",
      start: 0,
      end: 152,
      mood: MusicMoodEnum.melancholic,
    },
    {
      file: "No.2 Remembering Her - Esther Abrami.mp3",
      start: 2,
      end: 134,
      mood: MusicMoodEnum.melancholic,
    },
    {
      file: "Champion - Telecasted.mp3",
      start: 0,
      end: 142,
      mood: MusicMoodEnum.chill,
    },
    {
      file: "Oh Please - Telecasted.mp3",
      start: 0,
      end: 154,
      mood: MusicMoodEnum.chill,
    },
    {
      file: "Jetski - Telecasted.mp3",
      start: 0,
      end: 142,
      mood: MusicMoodEnum.uneasy,
    },
    {
      file: "Phantom - Density & Time.mp3",
      start: 0,
      end: 178,
      mood: MusicMoodEnum.uneasy,
    },
    {
      file: "On The Hunt - Andrew Langdon.mp3",
      start: 0,
      end: 95,
      mood: MusicMoodEnum.uneasy,
    },
    {
      file: "Name The Time And Place - Telecasted.mp3",
      start: 0,
      end: 142,
      mood: MusicMoodEnum.excited,
    },
    {
      file: "Delayed Baggage - Ryan Stasik.mp3",
      start: 3,
      end: 108,
      mood: MusicMoodEnum.euphoric,
    },
    {
      file: "Like It Loud - Dyalla.mp3",
      start: 4,
      end: 160,
      mood: MusicMoodEnum.euphoric,
    },
    {
      file: "Organic Guitar House - Dyalla.mp3",
      start: 2,
      end: 160,
      mood: MusicMoodEnum.euphoric,
    },
    {
      file: "Honey, I Dismembered The Kids - Ezra Lipp.mp3",
      start: 2,
      end: 144,
      mood: MusicMoodEnum.dark,
    },
    {
      file: "Night Hunt - Jimena Contreras.mp3",
      start: 0,
      end: 88,
      mood: MusicMoodEnum.dark,
    },
    {
      file: "Curse of the Witches - Jimena Contreras.mp3",
      start: 0,
      end: 102,
      mood: MusicMoodEnum.dark,
    },
    {
      file: "Restless Heart - Jimena Contreras.mp3",
      start: 0,
      end: 94,
      mood: MusicMoodEnum.sad,
    },
    {
      file: "Heartbeat Of The Wind - Asher Fulero.mp3",
      start: 0,
      end: 124,
      mood: MusicMoodEnum.sad,
    },
    {
      file: "Hopeless - Jimena Contreras.mp3",
      start: 0,
      end: 250,
      mood: MusicMoodEnum.sad,
    },
    {
      file: "Touch - Anno Domini Beats.mp3",
      start: 0,
      end: 165,
      mood: MusicMoodEnum.happy,
    },
    {
      file: "Cafecito por la Manana - Cumbia Deli.mp3",
      start: 0,
      end: 184,
      mood: MusicMoodEnum.happy,
    },
    {
      file: "Aurora on the Boulevard - National Sweetheart.mp3",
      start: 0,
      end: 130,
      mood: MusicMoodEnum.happy,
    },
    {
      file: "Buckle Up - Jeremy Korpas.mp3",
      start: 0,
      end: 128,
      mood: MusicMoodEnum.angry,
    },
    {
      file: "Twin Engines - Jeremy Korpas.mp3",
      start: 0,
      end: 120,
      mood: MusicMoodEnum.angry,
    },
    {
      file: "Hopeful - Nat Keefe.mp3",
      start: 0,
      end: 175,
      mood: MusicMoodEnum.hopeful,
    },
    {
      file: "Hopeful Freedom - Asher Fulero.mp3",
      start: 1,
      end: 172,
      mood: MusicMoodEnum.hopeful,
    },
    {
      file: "Crystaline - Quincas Moreira.mp3",
      start: 0,
      end: 140,
      mood: MusicMoodEnum.contemplative,
    },
    {
      file: "Final Soliloquy - Asher Fulero.mp3",
      start: 1,
      end: 178,
      mood: MusicMoodEnum.contemplative,
    },
    {
      file: "Seagull - Telecasted.mp3",
      start: 0,
      end: 123,
      mood: MusicMoodEnum.funny,
    },
    {
      file: "Banjo Doops - Joel Cummins.mp3",
      start: 0,
      end: 98,
      mood: MusicMoodEnum.funny,
    },
    {
      file: "Baby Animals Playing - Joel Cummins.mp3",
      start: 0,
      end: 124,
      mood: MusicMoodEnum.funny,
    },
    {
      file: "Sinister - Anno Domini Beats.mp3",
      start: 0,
      end: 215,
      mood: MusicMoodEnum.dark,
    },
    {
      file: "Traversing - Godmode.mp3",
      start: 0,
      end: 95,
      mood: MusicMoodEnum.dark,
    },
  ];

  private expandedMusicPath: string;
  private expandedLibrary: ExpandedMusicLibrary = {};

  constructor(private config: Config) {
    this.expandedMusicPath = path.join(this.config.musicDirPath, "expanded");
    this.loadExpandedLibrary();
  }

  /**
   * Load expanded music library from the expanded directory structure
   */
  private loadExpandedLibrary(): void {
    try {
      if (!fs.existsSync(this.expandedMusicPath)) {
        // Create expanded directory structure if it doesn't exist
        this.createExpandedDirectoryStructure();
        return;
      }

      // Load music files from mood-based folders
      for (const mood of Object.values(MusicMoodEnum)) {
        const moodPath = path.join(this.expandedMusicPath, mood);
        if (fs.existsSync(moodPath)) {
          const files = fs.readdirSync(moodPath)
            .filter((file: string) => file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.ogg'))
            .map((file: string) => path.join(mood, file)); // Include folder name in path
          
          this.expandedLibrary[mood] = files;
        }
      }
    } catch (error) {
      console.warn('Failed to load expanded music library:', error);
    }
  }

  /**
   * Create the expanded directory structure with mood-based folders
   */
  private createExpandedDirectoryStructure(): void {
    try {
      fs.ensureDirSync(this.expandedMusicPath);
      
      // Create folders for each mood
      for (const mood of Object.values(MusicMoodEnum)) {
        const moodPath = path.join(this.expandedMusicPath, mood);
        fs.ensureDirSync(moodPath);
      }

      // Create README with instructions
      const readmeContent = `# Expanded Music Library

This directory contains additional music organized by mood. To add more music:

1. Download music packs (e.g., SuloSounds: https://sulosounds.itch.io/100-songs)
2. Extract the files
3. Sort them into the appropriate mood folders:

## Mood Folders:
- **sad**: Melancholic, sorrowful, emotional tracks
- **melancholic**: Contemplative, introspective music  
- **happy**: Upbeat, cheerful, joyful tracks
- **euphoric**: High-energy, exciting, celebratory music
- **excited**: Energetic, dynamic, enthusiastic tracks
- **chill**: Relaxed, ambient, peaceful music
- **uneasy**: Tense, anxious, suspenseful tracks
- **angry**: Aggressive, intense, dramatic music
- **dark**: Ominous, mysterious, foreboding tracks
- **hopeful**: Inspiring, optimistic, uplifting music
- **contemplative**: Thoughtful, reflective, meditative tracks
- **funny**: Playful, quirky, humorous music

## Supported Formats:
- MP3, WAV, OGG

## License Requirements:
Make sure any music you add is properly licensed for your use case.
Creative Commons (CC0, CC-BY) or public domain music is recommended.

## Recommended Sources:
- SuloSounds (CC0): https://sulosounds.itch.io/100-songs
- xDeviruchi (CC-BY-SA): https://xdeviruchi.itch.io/8-bit-fantasy-adventure-music-pack
- OpenGameArt (CC0): https://opengameart.org/content/cc0-music-0
- Free Music Archive: https://freemusicarchive.org/
`;

      fs.writeFileSync(path.join(this.expandedMusicPath, 'README.md'), readmeContent);
    } catch (error) {
      console.warn('Failed to create expanded directory structure:', error);
    }
  }

  /**
   * Get a random music track for the specified mood, with fallback to original library
   */
  private getRandomMusicForMood(mood: MusicMoodEnum, videoDuration: number): Music | null {
    // First try expanded library
    const expandedTracks = this.expandedLibrary[mood];
    if (expandedTracks && expandedTracks.length > 0) {
      const randomFile = expandedTracks[Math.floor(Math.random() * expandedTracks.length)];
      const fullPath = path.join(this.expandedMusicPath, randomFile);
      
      if (fs.existsSync(fullPath)) {
        return {
          file: randomFile, // This includes the mood folder in the path
          start: 0,
          end: videoDuration + 10, // Add some buffer for video length
          mood: mood,
        };
      }
    }

    // Fallback to original library
    const originalTracks = MusicManager.originalMusicList.filter(music => music.mood === mood);
    if (originalTracks.length > 0) {
      return originalTracks[Math.floor(Math.random() * originalTracks.length)];
    }

    return null;
  }

  /**
   * Get the complete music list (original + expanded)
   */
  public musicList(): MusicForVideo[] {
    const allMusic: MusicForVideo[] = [];

    // Add original music
    const originalMusic = MusicManager.originalMusicList.map((music: Music) => ({
      ...music,
      url: `http://localhost:${this.config.port}/api/music/${encodeURIComponent(music.file)}`,
    }));
    allMusic.push(...originalMusic);

    // Add expanded music
    for (const [mood, files] of Object.entries(this.expandedLibrary)) {
      for (const file of files) {
        allMusic.push({
          file: file,
          start: 0,
          end: 180, // Default 3 minutes, will be adjusted based on actual file
          mood: mood,
          url: `http://localhost:${this.config.port}/api/music/expanded/${encodeURIComponent(file)}`,
        });
      }
    }

    return allMusic;
  }

  /**
   * Find appropriate music for video with enhanced selection
   */
  public findMusicForVideo(videoDuration: number, requestedMood?: MusicMoodEnum): MusicForVideo {
    const mood = requestedMood || MusicMoodEnum.chill; // Default fallback
    
    // Try to get music for the requested mood
    let selectedMusic = this.getRandomMusicForMood(mood, videoDuration);
    
    // If no music found for requested mood, try similar moods
    if (!selectedMusic) {
      const similarMoods = this.getSimilarMoods(mood);
      for (const similarMood of similarMoods) {
        selectedMusic = this.getRandomMusicForMood(similarMood, videoDuration);
        if (selectedMusic) break;
      }
    }

    // Final fallback to any available music
    if (!selectedMusic) {
      const allOriginal = MusicManager.originalMusicList;
      selectedMusic = allOriginal[Math.floor(Math.random() * allOriginal.length)];
    }

    // Determine the correct URL based on whether it's expanded or original music
    const isExpandedMusic = selectedMusic.file.includes('/');
    const baseUrl = isExpandedMusic ? 'expanded/' : '';
    
    return {
      ...selectedMusic,
      url: `http://localhost:${this.config.port}/api/music/${baseUrl}${encodeURIComponent(selectedMusic.file)}`,
    };
  }

  /**
   * Get similar moods for fallback selection
   */
  private getSimilarMoods(mood: MusicMoodEnum): MusicMoodEnum[] {
    const moodGroups: Record<MusicMoodEnum, MusicMoodEnum[]> = {
      [MusicMoodEnum.happy]: [MusicMoodEnum.excited, MusicMoodEnum.euphoric, MusicMoodEnum.hopeful],
      [MusicMoodEnum.excited]: [MusicMoodEnum.happy, MusicMoodEnum.euphoric],
      [MusicMoodEnum.euphoric]: [MusicMoodEnum.excited, MusicMoodEnum.happy],
      [MusicMoodEnum.sad]: [MusicMoodEnum.melancholic, MusicMoodEnum.contemplative],
      [MusicMoodEnum.melancholic]: [MusicMoodEnum.sad, MusicMoodEnum.contemplative],
      [MusicMoodEnum.dark]: [MusicMoodEnum.uneasy, MusicMoodEnum.angry],
      [MusicMoodEnum.uneasy]: [MusicMoodEnum.dark, MusicMoodEnum.angry],
      [MusicMoodEnum.angry]: [MusicMoodEnum.dark, MusicMoodEnum.uneasy],
      [MusicMoodEnum.chill]: [MusicMoodEnum.contemplative, MusicMoodEnum.hopeful],
      [MusicMoodEnum.contemplative]: [MusicMoodEnum.chill, MusicMoodEnum.melancholic],
      [MusicMoodEnum.hopeful]: [MusicMoodEnum.happy, MusicMoodEnum.chill],
      [MusicMoodEnum.funny]: [MusicMoodEnum.happy, MusicMoodEnum.excited],
    };

    return moodGroups[mood] || [MusicMoodEnum.chill];
  }

  private musicFileExist(music: Music): boolean {
    // Check if it's expanded music (contains folder separator)
    if (music.file.includes('/')) {
      return fs.existsSync(path.join(this.expandedMusicPath, music.file));
    }
    // Original music location
    return fs.existsSync(path.join(this.config.musicDirPath, music.file));
  }

  public ensureMusicFilesExist(): void {
    // Check original music files
    for (const music of MusicManager.originalMusicList) {
      if (!this.musicFileExist(music)) {
        console.warn(`Original music file not found: ${music.file}`);
      }
    }

    // Create expanded directory if it doesn't exist
    if (!fs.existsSync(this.expandedMusicPath)) {
      this.createExpandedDirectoryStructure();
    }
  }

  /**
   * Get statistics about the music library
   */
  public getLibraryStats(): { original: number; expanded: number; byMood: Record<string, number> } {
    const stats = {
      original: MusicManager.originalMusicList.length,
      expanded: 0,
      byMood: {} as Record<string, number>
    };

    // Count expanded music
    for (const [mood, files] of Object.entries(this.expandedLibrary)) {
      const count = files.length;
      stats.expanded += count;
      stats.byMood[mood] = (stats.byMood[mood] || 0) + count;
    }

    // Count original music by mood
    for (const music of MusicManager.originalMusicList) {
      stats.byMood[music.mood] = (stats.byMood[music.mood] || 0) + 1;
    }

    return stats;
  }
}
