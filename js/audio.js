/**
 * Audio Manager
 * Manages game sound effects and background music
 */

class AudioManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.5;
        
        // Sound config
        this.soundConfig = {
            jump: {
                src: 'sounds/jump.wav',
                volume: 0.6,
                poolSize: 3  // Can play multiple simultaneously
            },
            collect: {
                src: 'sounds/collect.wav',
                volume: 0.5,
                poolSize: 3
            },
            crash: {
                src: 'sounds/crash.wav',
                volume: 0.7,
                poolSize: 1  // Play only once
            },
            bgm: {
                src: 'sounds/bgm.mp3',
                volume: 0.3,
                loop: true
            }
        };
        
        this.init();
    }
    
    init() {
        // Preload sounds
        for (const [name, config] of Object.entries(this.soundConfig)) {
            if (name === 'bgm') {
                // Handle BGM separately
                this.sounds[name] = new Audio(config.src);
                this.sounds[name].volume = config.volume;
                this.sounds[name].loop = config.loop;
            } else {
                // Sound pool (supports multiple simultaneous playback)
                this.sounds[name] = [];
                for (let i = 0; i < config.poolSize; i++) {
                    const audio = new Audio(config.src);
                    audio.volume = config.volume;
                    this.sounds[name].push(audio);
                }
            }
        }
    }
    
    // Play sound
    play(name) {
        if (!this.enabled) return;
        
        if (name === 'bgm') {
            // Special BGM handling
            if (this.sounds.bgm) {
                this.sounds.bgm.play().catch(e => console.log('BGM播放失败:', e));
            }
            return;
        }
        
        // Find available audio from sound pool
        const pool = this.sounds[name];
        if (!pool || pool.length === 0) return;
        
        // Find a sound that's not playing, or the one that finished earliest
        const availableSound = pool.find(sound => sound.paused) || pool[0];
        
        availableSound.currentTime = 0;
        availableSound.play().catch(e => {
            // Autoplay may be blocked by browser, ignore error
            console.log('Sound playback failed:', e);
        });
    }
    
    // Stop sound
    stop(name) {
        if (name === 'bgm' && this.sounds.bgm) {
            this.sounds.bgm.pause();
            this.sounds.bgm.currentTime = 0;
            return;
        }
        
        const pool = this.sounds[name];
        if (pool) {
            pool.forEach(sound => {
                sound.pause();
                sound.currentTime = 0;
            });
        }
    }
    
    // Pause all sounds
    pauseAll() {
        Object.values(this.sounds).forEach(soundOrPool => {
            if (Array.isArray(soundOrPool)) {
                soundOrPool.forEach(sound => sound.pause());
            } else {
                soundOrPool.pause();
            }
        });
    }
    
    // Resume all sounds
    resumeAll() {
        if (this.enabled && this.sounds.bgm) {
            this.sounds.bgm.play().catch(e => {});
        }
    }
    
    // Toggle sound on/off
    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.pauseAll();
        }
        return this.enabled;
    }
    
    // Set volume
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(soundOrPool => {
            if (Array.isArray(soundOrPool)) {
                soundOrPool.forEach(sound => sound.volume = this.volume);
            } else {
                soundOrPool.volume = this.volume;
            }
        });
    }
}

// Create global audio manager instance
const audioManager = new AudioManager();
