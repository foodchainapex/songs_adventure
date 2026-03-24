/**
 * Game Configuration File
 * Change ACTIVE_STYLE to switch styles
 */

// ==========================================
// Change style here
// 'simple'     = Minimal blocks (recommended for gameplay testing)
// 'pixel'      = Pixel style
// 'cartoon'    = Cartoon style
// 'boy'        = Boy style
// 'songweirong'= Songweirong Forest Adventure
// ==========================================
const ACTIVE_STYLE = 'image';
// ==========================================

// Game Configuration
const CONFIG = {
    GRAVITY: 0.6,
    JUMP_POWER: -12,
    GROUND_HEIGHT: 55,
    
    // Player size (scales with screen)
    PLAYER_WIDTH: 80,
    PLAYER_HEIGHT: 100,
    
    // Air obstacle height (relative to ground)
    // Player height 80, jump peak ~200 (120 above ground)
    // Set 90-110 above ground: won't hit if not jumping, will hit if jumping
    AIR_OBSTACLE_HEIGHT_MIN: 90,
    AIR_OBSTACLE_HEIGHT_MAX: 110,
    
    // Speed settings (increases with score)
    GAME_SPEED_START: 5,
    GAME_SPEED_MAX: 15,
    SPEED_INCREMENT: 0.001,
    
    // Spawn probability settings
    COLLECTIBLE_SPAWN_BASE: 0.008,
    COLLECTIBLE_SPAWN_DECAY: 0.000001,
    POWERUP_SPAWN_BASE: 0,      // Temporarily disable powerup spawn (assets not ready)
    POWERUP_SPAWN_DECAY: 0,
    
    POWERUP_DURATION: 20000,
    PIXEL_SCALE: 4
};

// Collectible configuration (four tiers)
// Can set positive/negative item probabilities separately
const COLLECTIBLE_CONFIG = {
    // Positive item spawn probability (0-1)
    POSITIVE_PROBABILITY: 0.75,
    // Negative item spawn probability (0-1, independent from positive, sum <= 1)
    NEGATIVE_PROBABILITY: 0.25
};

const COLLECTIBLE_TYPES = {
    // High value (+10) - 9 assets
    HIGH_POSITIVE: {
        assets: [
            'assets/collectibles/pos_10/CF_.png',
            'assets/collectibles/pos_10/bug.png',
            'assets/collectibles/pos_10/huanxi.png',
            'assets/collectibles/pos_10/lihua.png',
            'assets/collectibles/pos_10/lizard0.png',
            'assets/collectibles/pos_10/lizard1.png',
            'assets/collectibles/pos_10/redpanda.png',
            'assets/collectibles/pos_10/sanhua.png',
            'assets/collectibles/pos_10/squirrel.png'
        ],
        value: 10,
        color: '#FFD700',  // Gold
        probability: 0.2   // 20% of positive items
    },
    // Normal value (+5) - 4 assets
    NORMAL_POSITIVE: {
        assets: [
            'assets/collectibles/pos_5/cdf.png',
            'assets/collectibles/pos_5/coconut.png',
            'assets/collectibles/pos_5/latiao.png',
            'assets/collectibles/pos_5/wangzai.png'
        ],
        value: 5,
        color: '#2ECC71',  // Green
        probability: 0.8   // 80% of positive items
    },
    // Normal penalty (-5) - 2 assets
    NORMAL_NEGATIVE: {
        assets: [
            'assets/collectibles/neg_5/coffee.png',
            'assets/collectibles/neg_5/wine.png'
        ],
        value: -5,
        color: '#E67E22',  // Orange
        probability: 0.7   // 70% of negative items
    },
    // High penalty (-10) - 2 assets
    HIGH_NEGATIVE: {
        assets: [
            'assets/collectibles/neg_10/bacon.png',
            'assets/collectibles/neg_10/web.png'
        ],
        value: -10,
        color: '#E74C3C',  // Red
        probability: 0.3   // 30% of negative items
    }
};

// Powerup configuration
const POWERUP_TYPES = {
    MONKEY_KING: { emoji: '🐵', title: '齐天大圣', multiplier: 2, color: '#FFD700' },
    BICYCLE: { emoji: '🚲', title: '自行车', multiplier: 3, color: '#FF6B6B' },
    JACKET: { emoji: '🧥', title: '冲锋衣', multiplier: 5, color: '#4ECDC4' },
    OUTDOOR_JACKET: { emoji: '🧥', title: '冲锋衣', multiplier: 2, color: '#FF6B35' },
    BUG_NET: { emoji: '🕸️', title: '捕虫网', multiplier: 3, color: '#4ECDC4' },
    GOLDEN_STAFF: { emoji: '🏃', title: '金箍棒', multiplier: 5, color: '#FFD700' }
};

// Sprite data (for pixel style)
const SPRITES = {
    boy_stand: {
        colors: { 'H': '#4A3728', 'S': '#FFCCAA', 'T': '#FF6B6B', 'L': '#4169E1', 's': '#333333', 'W': '#FFFFFF', 'B': '#000000' },
        pixels: [
            "____HHHHHH______",
            "___HHHHHHHH_____",
            "__HHHHHHHHHH____",
            "__HHHSSSSHHH____",
            "__HHSSWWSSHH____",
            "__HHSSBBSSHH____",
            "___HSSSSSSH_____",
            "____TTTTTT______",
            "___TTTTTTTT_____",
            "___TTTTTTTT_____",
            "___TTTTTTTT_____",
            "___TTTTTTTT_____",
            "____LL__LL______",
            "____LL__LL______",
            "____LL__LL______",
            "___ssss_ssss____",
            "___ssss_ssss____"
        ]
    },
    boy_run1: {
        colors: { 'H': '#4A3728', 'S': '#FFCCAA', 'T': '#FF6B6B', 'L': '#4169E1', 's': '#333333', 'W': '#FFFFFF', 'B': '#000000' },
        pixels: [
            "____HHHHHH______",
            "___HHHHHHHH_____",
            "__HHHHHHHHHH____",
            "__HHHSSSSHHH____",
            "__HHSSWWSSHH____",
            "__HHSSBBSSHH____",
            "___HSSSSSSH_____",
            "____TTTTTT______",
            "___TTTTTTTT_____",
            "___TTTTTTTT_____",
            "___TTTTTTTT_____",
            "___TTTTTTTT_____",
            "___LLL__________",
            "___LLLL_________",
            "___LLLLL________",
            "__ss____________"
        ]
    }
};

// Obstacle asset configuration
// Multiple assets per size, game randomly selects
const OBSTACLE_ASSETS = {
    // Ground obstacles (adjust based on actual assets)
    ground: {
        width: 64,
        height: 64,
        assets: [
            'assets/obstacles/ground/chunk.png',
            'assets/obstacles/ground/mud.png',
            'assets/obstacles/ground/rock.png',
            'assets/obstacles/ground/rock0.png',
            'assets/obstacles/ground/rock1.png'
        ]
    },
    // Air obstacles (adjust based on actual assets)
    air: {
        width: 80,
        height: 48,
        assets: [
            'assets/obstacles/air/obstacles.png',
            'assets/obstacles/air/rock3.png'
        ]
    }
};

// Easter egg configuration
const EASTER_EGG_CONFIG = {
    TARGET_COUNT: 1,  // Target count to trigger easter egg (collectibles or jumps)
    ENABLED: true     // Whether to enable easter egg
};

// Result page banner configuration
// Only two states: easter egg / no easter egg (default)
const RESULT_BANNER = {
    // Easter egg banner
    easterEgg: {
        src: 'assets/banner/egg_edition.png',
        alt: 'Easter egg found!'
    },
    // Default banner (same as game entry)
    default: {
        src: 'assets/banner/normal_edition.png',
        alt: 'Songweirong Adventure'
    }
};
