/**
 * Game Core Logic
 * Completely independent of rendering, only handles game state and logic
 */

// Game state
let canvas, ctx, renderer;
let gameState = 'start'; // start, playing, gameover
let score = 0;
let highScore = 0;
let gameSpeed = CONFIG.GAME_SPEED_START;
let lastTime = 0;
let gameTime = 0;

// Game objects
let player;
let obstacles = [];
let collectibles = [];
let powerups = [];
let particles = [];
let clouds = [];
let trees = [];

// Obstacle spawn control
let lastObstacleX = Infinity;  // Last obstacle X position
let minObstacleDistance = 250;   // Minimum obstacle spacing (pixels)
let obstacleCooldown = 0;        // Spawn cooldown (milliseconds)

// Easter egg stats
let collectibleCount = 0;        // Collectible count (for easter egg)

// Input state
let keys = {};

// Helper function to calculate responsive scale
function getGameScale() {
    // Base reference dimensions
    const baseWidth = 350;
    const baseHeight = 600;
    
    // Calculate base scale
    let scale = Math.min(canvas.width / baseWidth, canvas.height / baseHeight);
    
    // Mobile adjustment: reduce size on small screens
    if (canvas.width < 500) {
        // For phones: additional 0.7x reduction
        scale *= 0.7;
    } else if (canvas.width < 800) {
        // For tablets: slight reduction
        scale *= 0.85;
    }
    
    return scale;
}

// ========== Player Class ==========
class Player {
    constructor() {
        // Scale based on screen size with mobile adaptation
        const scale = getGameScale();
        // Sprite size (square, base 80px)
        this.baseWidth = 80 * scale;
        this.baseHeight = 80 * scale;
        this.width = this.baseWidth;
        this.height = this.baseHeight;
        
        this.x = canvas.width * 0.15;  // 15% from left
        this.y = 0;
        this.velocityY = 0;
        this.isGrounded = false;

        this.animFrame = 0;
        this.animTimer = 0;
        this.activePowerup = null;
        this.powerupTimer = 0;
        this.scoreMultiplier = 1;
        
        // Easter egg stats
        this.jumpCount = 0;  // Jump count
    }

    update(deltaTime) {
        // Update powerup time
        if (this.activePowerup) {
            this.powerupTimer -= deltaTime;
            if (this.powerupTimer <= 0) {
                this.deactivatePowerup();
            }
        }

        // Physics update
        this.velocityY += CONFIG.GRAVITY;
        this.y += this.velocityY;

        // Ground collision
        const groundY = canvas.height - CONFIG.GROUND_HEIGHT - this.height;
        if (this.y >= groundY) {
            this.y = groundY;
            this.velocityY = 0;
            this.isGrounded = true;
        } else {
            this.isGrounded = false;
        }

        // Animation frame update (60ms per frame for smoother animation)
        this.animTimer += deltaTime;
        if (this.animTimer > 60) {
            this.animFrame = (this.animFrame + 1) % 100;
            this.animTimer = 0;
        }
    }

    jump() {
        if (this.isGrounded) {
            this.velocityY = CONFIG.JUMP_POWER;
            this.isGrounded = false;
            this.jumpCount++;  // Count jumps
            
            // Play jump sound
            if (typeof audioManager !== 'undefined') {
                audioManager.play('jump');
            }
        }
    }

    activatePowerup(type) {
        this.activePowerup = type;
        this.powerupTimer = CONFIG.POWERUP_DURATION;
        this.scoreMultiplier = POWERUP_TYPES[type].multiplier;
    }

    deactivatePowerup() {
        this.activePowerup = null;
        this.scoreMultiplier = 1;
    }

    getBounds() {
        const padding = 10;
        return {
            x: this.x + padding,
            y: this.y + padding,
            width: this.width - padding * 2,
            height: this.height - padding * 2
        };
    }
}

// ========== Obstacle Class ==========
class Obstacle {
    constructor() {
        // Scale based on screen size
        const scale = getGameScale();
        
        this.isAirObstacle = Math.random() < 0.35;
        
        if (this.isAirObstacle) {
            // Air obstacle uses air config
            const config = OBSTACLE_ASSETS.air;
            this.width = config.width * scale;
            this.height = config.height * scale;
            this.x = canvas.width;
            // Air obstacle height: 90-110px above ground
            const airHeight = CONFIG.AIR_OBSTACLE_HEIGHT_MIN + 
                Math.random() * (CONFIG.AIR_OBSTACLE_HEIGHT_MAX - CONFIG.AIR_OBSTACLE_HEIGHT_MIN);
            this.y = canvas.height - CONFIG.GROUND_HEIGHT - airHeight * scale - this.height;
            this.type = 'air';
            // Randomly select asset
            this.asset = config.assets[Math.floor(Math.random() * config.assets.length)];
        } else {
            // Ground obstacle uses ground config
            const config = OBSTACLE_ASSETS.ground;
            this.width = config.width * scale;
            this.height = config.height * scale;
            this.x = canvas.width;
            this.y = canvas.height - CONFIG.GROUND_HEIGHT - this.height;
            this.type = 'ground';
            // 随机选择素材
            this.asset = config.assets[Math.floor(Math.random() * config.assets.length)];
        }
    }

    update() {
        this.x -= gameSpeed;
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }

    getBounds() {
        return {
            x: this.x + 5,
            y: this.y + 5,
            width: this.width - 10,
            height: this.height - 10
        };
    }
}

// ========== Obstacle Spawn Control ==========

// ========== Floating Text Effect ==========
function showFloatingText(text, x, y, type) {
    const container = document.getElementById('game-container');
    if (!container) return;
    
    const el = document.createElement('div');
    el.className = `floating-text ${type}`;
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    
    container.appendChild(el);
    
    // Remove element after animation
    setTimeout(() => {
        if (el.parentNode) {
            el.parentNode.removeChild(el);
        }
    }, 1000);
}

// ========== Collision Detection Utils ==========
function checkOverlapWithObstacles(newObject, safetyMargin = 100) {
    // Check if new object overlaps with existing obstacles horizontally
    // safetyMargin: safety distance to avoid spawning collectibles near obstacles (since obstacles move)
    const newLeft = newObject.x - safetyMargin;
    const newRight = newObject.x + (newObject.width || newObject.size) + safetyMargin;
    
    for (const obstacle of obstacles) {
        const obsLeft = obstacle.x - safetyMargin * 0.5;
        const obsRight = obstacle.x + obstacle.width + safetyMargin * 0.5;
        
        // Horizontal overlap check (considering safety margin)
        if (newLeft < obsRight && newRight > obsLeft) {
            return true; // Has overlap
        }
    }
    return false; // No overlap
}

function spawnObstacles(deltaTime) {
    // Update cooldown time
    if (obstacleCooldown > 0) {
        obstacleCooldown -= deltaTime;
        return;
    }
    
    // Find rightmost obstacle position
    let rightmostX = 0;
    for (const obs of obstacles) {
        rightmostX = Math.max(rightmostX, obs.x + obs.width);
    }
    
    // Calculate current safe distance (dynamically adjusted based on game speed, faster speed needs larger spacing)
    const currentMinDistance = minObstacleDistance + gameSpeed * 15;
    
    // Check if minimum distance is met
    const distanceFromRight = canvas.width - rightmostX;
    if (distanceFromRight < currentMinDistance) {
        return;
    }
    
    // Check for 'imminent danger' combinations (ground + air obstacles existing simultaneously)
    const hasGroundObstacle = obstacles.some(o => o.type === 'ground' && o.x > canvas.width * 0.6);
    const hasAirObstacle = obstacles.some(o => o.type === 'air' && o.x > canvas.width * 0.6);
    
    // If both ground and air obstacles exist, pause spawning
    if (hasGroundObstacle && hasAirObstacle) {
        return;
    }
    
    // Base spawn chance (slightly increases difficulty with speed)
    const baseSpawnChance = 0.015 + (gameSpeed - CONFIG.GAME_SPEED_START) * 0.001;
    
    if (Math.random() < baseSpawnChance) {
        const newObstacle = new Obstacle();
        
        // Force avoid 'dead end' combos: if just spawned ground obstacle, don't spawn air obstacle in next few frames
        // And vice versa
        if (newObstacle.type === 'ground' && hasAirObstacle) {
            // Change to ground obstacle, or skip spawning
            if (Math.random() < 0.7) return; // 70% chance to skip, give player a path
        }
        if (newObstacle.type === 'air' && hasGroundObstacle) {
            if (Math.random() < 0.7) return;
        }
        
        obstacles.push(newObstacle);
        
        // Set cooldown to prevent continuous spawning
        obstacleCooldown = 300 + Math.random() * 400; // 300-700ms cooldown
    }
}

// ========== Collectible Class ==========
class Collectible {
    constructor() {
        // 根据屏幕尺寸缩放（基准尺寸增大）
        const scale = getGameScale();
        this.size = 50 * scale;
        this.x = canvas.width;
        this.isAir = Math.random() < 0.4;
        
        if (this.isAir) {
            this.y = canvas.height - CONFIG.GROUND_HEIGHT - (120 + Math.random() * 50) * scale;
        } else {
            this.y = canvas.height - CONFIG.GROUND_HEIGHT - this.size - 15 * scale;
        }
        
        // Select collectible type based on new probability config
        // Use independent probabilities: check positive first, then negative
        const rand = Math.random();
        let selectedType;
        
        if (rand < COLLECTIBLE_CONFIG.POSITIVE_PROBABILITY) {
            // Spawn positive item, select among positive types
            const positiveTypes = Object.entries(COLLECTIBLE_TYPES).filter(([_, c]) => c.value > 0);
            const typeRand = Math.random();
            let cumulativeProb = 0;
            for (const [key, config] of positiveTypes) {
                cumulativeProb += config.probability;
                if (typeRand < cumulativeProb) {
                    selectedType = key;
                    break;
                }
            }
        } else if (rand < COLLECTIBLE_CONFIG.POSITIVE_PROBABILITY + COLLECTIBLE_CONFIG.NEGATIVE_PROBABILITY) {
            // Spawn negative item, select among negative types
            const negativeTypes = Object.entries(COLLECTIBLE_TYPES).filter(([_, c]) => c.value < 0);
            const typeRand = Math.random();
            let cumulativeProb = 0;
            for (const [key, config] of negativeTypes) {
                cumulativeProb += config.probability;
                if (typeRand < cumulativeProb) {
                    selectedType = key;
                    break;
                }
            }
        }
        
        // If none selected (probability margin), default to normal positive
        if (!selectedType) {
            selectedType = 'NORMAL_POSITIVE';
        }
        
        const typeConfig = COLLECTIBLE_TYPES[selectedType];
        this.value = typeConfig.value;
        // Use image asset instead of emoji
        this.asset = typeConfig.assets[Math.floor(Math.random() * typeConfig.assets.length)];
        this.typeColor = typeConfig.color;
        
        this.bobOffset = Math.random() * Math.PI * 2;
        this.collected = false;
    }

    update(deltaTime) {
        this.x -= gameSpeed;
        this.bobOffset += 0.05;
    }

    isOffScreen() {
        return this.x + this.size < 0;
    }

    getBounds() {
        return {
            x: this.x + 5,
            y: this.y + 5,
            width: this.size - 10,
            height: this.size - 10
        };
    }
}

// ========== PowerUp Class ==========
class PowerUp {
    constructor() {
        // 根据屏幕尺寸缩放（基准尺寸增大）
        const scale = getGameScale();
        this.size = 60 * scale;
        this.x = canvas.width;
        this.y = canvas.height - CONFIG.GROUND_HEIGHT - (100 + Math.random() * 60) * scale;
        
        // Select powerup based on style
        let types;
        if (ACTIVE_STYLE === 'songweirong') {
            types = ['OUTDOOR_JACKET', 'BUG_NET', 'GOLDEN_STAFF'];
        } else {
            types = ['MONKEY_KING', 'BICYCLE', 'JACKET'];
        }
        
        this.type = types[Math.floor(Math.random() * types.length)];
        this.config = POWERUP_TYPES[this.type];
        this.bobOffset = Math.random() * Math.PI * 2;
        this.collected = false;
    }

    update(deltaTime) {
        this.x -= gameSpeed;
        this.bobOffset += 0.05;
    }

    isOffScreen() {
        return this.x + this.size < 0;
    }

    getBounds() {
        return {
            x: this.x + 2,
            y: this.y + 2,
            width: this.size - 4,
            height: this.size - 4
        };
    }
}

// ========== Background Elements ==========
class Cloud {
    constructor() {
        this.reset();
        this.x = Math.random() * (canvas ? canvas.width : 800);
    }

    reset() {
        this.x = canvas ? canvas.width + 50 : 850;
        this.y = 30 + Math.random() * 100;
        this.speed = 0.3 + Math.random() * 0.3;
        this.opacity = 0.4 + Math.random() * 0.4;
    }

    update() {
        this.x -= this.speed;
        if (this.x < -100) {
            this.reset();
        }
    }
}

class Tree {
    constructor() {
        this.reset();
        this.x = Math.random() * (canvas ? canvas.width : 800);
    }

    reset() {
        this.x = canvas ? canvas.width : 800;
        this.y = canvas ? canvas.height - CONFIG.GROUND_HEIGHT : 500;
        this.type = Math.random() < 0.5 ? 'pine' : 'oak';
    }

    update() {
        this.x -= gameSpeed * 0.3;
        if (this.x < -50) {
            this.reset();
        }
    }
}

// ========== Particle Class ==========
class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = Math.random() * -3;
        this.life = 1;
        this.decay = 0.03;
        
        if (type === 'collect') {
            this.vx = (Math.random() - 0.5) * 6;
            this.vy = -Math.random() * 4 - 2;
            this.decay = 0.02;
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.type !== 'collect') {
            this.vy += 0.1;
        }
        this.life -= this.decay;
    }
}

// ========== Collision Detection ==========
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// ========== Game Initialization ==========
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Create renderer
    renderer = RendererManager.create(ctx, ACTIVE_STYLE);
    if (!renderer) {
        console.error('Failed to create renderer');
        return;
    }
    
    // Create game objects
    player = new Player();
    for (let i = 0; i < 5; i++) clouds.push(new Cloud());
    // for (let i = 0; i < 8; i++) trees.push(new Tree());
    
    // Load high score
    highScore = parseInt(localStorage.getItem('pixelRunnerHighScore')) || 0;
    document.getElementById('highScoreValue').textContent = highScore;
    
    // Bind events
    bindEvents();
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function bindEvents() {
    // Keyboard events
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') {
            e.preventDefault();
            if (gameState === 'playing') player.jump();
            else if (gameState === 'start' || gameState === 'gameover') {
                startGame();
            }
        }
    });

    // Touch/click events - tap anywhere to jump
    const mobileHint = document.getElementById('mobile-hint');
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        // Hide hint
        if (mobileHint && !mobileHint.classList.contains('hidden')) {
            mobileHint.classList.add('hidden');
        }
        if (gameState === 'playing') {
            player.jump();
        } else if (gameState === 'start' || gameState === 'gameover') {
            startGame();
        }
    });

    // Mouse events - click anywhere to jump
    canvas.addEventListener('mousedown', (e) => {
        if (gameState === 'playing') {
            player.jump();
        } else if (gameState === 'start' || gameState === 'gameover') {
            startGame();
        }
    });

    // Start button
    document.getElementById('start-btn').addEventListener('click', startGame);
}

// ========== Game Control ==========
function startGame() {
    gameState = 'playing';
    document.getElementById('game-overlay').classList.add('hidden');
    
    // Reset banner to default image
    const bannerImg = document.getElementById('banner-image');
    if (bannerImg) {
        bannerImg.src = RESULT_BANNER.default.src;
        bannerImg.alt = RESULT_BANNER.default.alt;
    }
    
    resetGame();
}

function resetGame() {
    score = 0;
    gameSpeed = CONFIG.GAME_SPEED_START;
    obstacles = [];
    collectibles = [];
    powerups = [];
    particles = [];
    player = new Player();
    
    // Reset obstacle spawn state
    lastObstacleX = Infinity;
    obstacleCooldown = 0;
    
    // Reset easter egg stats
    collectibleCount = 0;
    
    document.getElementById('score').textContent = '0';
}

function gameOver() {
    gameState = 'gameover';
    
    // Check easter egg
    const targetCount = EASTER_EGG_CONFIG.TARGET_COUNT;
    const isEasterEgg = EASTER_EGG_CONFIG.ENABLED && 
                        (collectibleCount === targetCount || player.jumpCount === targetCount);
    
    // Update high score
    const isNewRecord = score > highScore;
    if (isNewRecord) {
        highScore = Math.floor(score);
        localStorage.setItem('pixelRunnerHighScore', highScore);
        document.getElementById('highScoreValue').textContent = highScore;
    }
    
    // Show game over screen
    const overlay = document.getElementById('game-overlay');
    overlay.classList.remove('hidden');
    overlay.classList.add('game-over');
    
    // Easter egg title (update if element exists)
    const gameTitleEl = document.getElementById('game-title');
    if (gameTitleEl) {
        if (isEasterEgg) {
            const targetCount = EASTER_EGG_CONFIG.TARGET_COUNT;
            gameTitleEl.textContent = `🎉 Found ${targetCount} Easter Egg!`;
        } else {
            gameTitleEl.textContent = '💥 Game Over';
        }
    }
    
    document.getElementById('game-subtitle').innerHTML = 
        `最终得分: <span style="color: #FFD700; font-size: 1.3em;">${Math.floor(score)}</span>`;
    document.getElementById('start-btn').textContent = '再玩一次';
    
    // Show result image (simplified: only easter egg and normal states)
    showResultImage(isEasterEgg);
}

// Show result image
// Simplified logic: directly replace banner image
function showResultImage(isEasterEgg) {
    const bannerImg = document.getElementById('banner-image');
    
    if (!bannerImg) return;
    
    // Simplified logic: only easter egg and normal states
    if (isEasterEgg) {
        // Has easter egg: show easter egg banner
        bannerImg.src = RESULT_BANNER.easterEgg.src;
        bannerImg.alt = RESULT_BANNER.easterEgg.alt;
    }
    // No easter egg: keep default banner, no change needed
}

// ========== Game Loop ==========
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    gameTime += deltaTime;

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    // Update renderer time
    if (renderer) {
        renderer.updateTime(gameTime);
    }

    // Update background (regardless of game state)
    clouds.forEach(cloud => cloud.update());

    if (gameState !== 'playing') return;

    // Update game speed (increases with score)
    gameSpeed = Math.min(
        CONFIG.GAME_SPEED_MAX,
        CONFIG.GAME_SPEED_START + score * CONFIG.SPEED_INCREMENT
    );

    // Update score
    score += gameSpeed * 0.01 * player.scoreMultiplier;
    document.getElementById('score').textContent = Math.floor(score);

    // Update player
    player.update(deltaTime);

    // Spawn obstacles (with avoidability check)
    spawnObstacles(deltaTime);
    
    // Spawn collectibles and powerups (probability decays with score, higher difficulty = less rewards)
    const collectibleRate = Math.max(0.001, CONFIG.COLLECTIBLE_SPAWN_BASE - score * CONFIG.COLLECTIBLE_SPAWN_DECAY);
    const powerupRate = Math.max(0.0005, CONFIG.POWERUP_SPAWN_BASE - score * CONFIG.POWERUP_SPAWN_DECAY);
    
    // Spawn collectibles (check no overlap with obstacles)
    if (Math.random() < collectibleRate) {
        const newCollectible = new Collectible();
        if (!checkOverlapWithObstacles(newCollectible)) {
            collectibles.push(newCollectible);
        }
    }
    
    // Spawn powerups (check no overlap with obstacles)
    if (Math.random() < powerupRate) {
        const newPowerup = new PowerUp();
        if (!checkOverlapWithObstacles(newPowerup)) {
            powerups.push(newPowerup);
        }
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update();
        
        if (obstacles[i].isOffScreen()) {
            obstacles.splice(i, 1);
            continue;
        }
        
        if (checkCollision(player.getBounds(), obstacles[i].getBounds())) {
            // Play crash sound
            if (typeof audioManager !== 'undefined') {
                audioManager.play('crash');
            }
            gameOver();
        }
    }

    // Update collectibles
    for (let i = collectibles.length - 1; i >= 0; i--) {
        collectibles[i].update(deltaTime);
        
        if (collectibles[i].isOffScreen()) {
            collectibles.splice(i, 1);
            continue;
        }
        
        if (!collectibles[i].collected && checkCollision(player.getBounds(), collectibles[i].getBounds())) {
            collectibles[i].collected = true;
            const addScore = collectibles[i].value * player.scoreMultiplier;
            score += addScore;
            
            // Count collectibles (easter egg)
            collectibleCount++;
            
            // Play collect sound
            if (typeof audioManager !== 'undefined') {
                audioManager.play('collect');
            }
            
            // Show floating text (above player)
            showFloatingText(
                addScore > 0 ? `+${addScore}` : `${addScore}`,
                player.x + player.width / 2,
                player.y - 20,
                addScore > 0 ? 'positive' : 'negative'
            );
            
            collectibles.splice(i, 1);
        }
    }

    // Update powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
        powerups[i].update(deltaTime);
        
        if (powerups[i].isOffScreen()) {
            powerups.splice(i, 1);
            continue;
        }
        
        if (!powerups[i].collected && checkCollision(player.getBounds(), powerups[i].getBounds())) {
            powerups[i].collected = true;
            player.activatePowerup(powerups[i].type);
            powerups.splice(i, 1);
        }
    }

    // Update background elements
    trees.forEach(tree => tree.update());

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function draw() {
    if (!renderer) return;

    // Clear canvas
    renderer.ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    renderer.drawBackground(canvas.width, canvas.height);
    clouds.forEach(cloud => renderer.drawCloud(cloud));
    trees.forEach(tree => renderer.drawTree(tree));
    renderer.drawGround(0, canvas.height - CONFIG.GROUND_HEIGHT, canvas.width, CONFIG.GROUND_HEIGHT);

    // Draw game elements
    powerups.forEach(powerup => renderer.drawPowerup(powerup));
    collectibles.forEach(collectible => renderer.drawCollectible(collectible));
    obstacles.forEach(obstacle => renderer.drawObstacle(obstacle));
    particles.forEach(particle => renderer.drawParticle(particle));
    
    // Draw player (only show during gameplay)
    if (player && gameState === 'playing') renderer.drawPlayer(player);
    
    // Draw powerup UI
    if (player && player.activePowerup && gameState === 'playing') {
        renderer.drawPowerupUI(player, player.activePowerup, canvas.width);
    }
}

// Start game
window.onload = init;
