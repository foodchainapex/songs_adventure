/**
 * Image Sprite Style Renderer
 * Uses running_man.png for character running animation
 */

class ImageRenderer extends BaseRenderer {
    constructor(ctx) {
        super(ctx);
        this.colors = {
            groundObstacle: '#E74C3C',
            airObstacle: '#E67E22',
            collectibleGround: '#2ECC71',
            collectibleAir: '#9B59B6',
            powerup: '#F1C40F',
            ground: '#34495E',
            sky: '#87CEEB',
            cloud: 'rgba(255, 255, 255, 0.8)',
            particle: '#FFFFFF'
        };
        
        // Load running image (4x3 layout, 12 frames)
        this.runImage = new Image();
        this.runImage.src = 'assets/motion/output_spritesheet.png';
        this.runImageLoaded = false;
        this.runImage.onload = () => {
            this.runImageLoaded = true;
            // Auto-calculate frame size (assuming 4x3 layout)
            this.runConfig.frameWidth = this.runImage.width / 4;   // 4 frames per row
            this.runConfig.frameHeight = this.runImage.height / 3; // 3 rows total
            console.log('Run image loaded:', this.runImage.width + 'x' + this.runImage.height);
        };
        
        // Load jumping image (2x2 layout, 4 frames)
        this.jumpImage = new Image();
        this.jumpImage.src = 'jumpjump.png';
        this.jumpImageLoaded = false;
        this.jumpImage.onload = () => {
            this.jumpImageLoaded = true;
            // Auto-calculate frame size (assuming 2x2 layout)
            this.jumpConfig.frameWidth = this.jumpImage.width / 2;   // 2 frames per row
            this.jumpConfig.frameHeight = this.jumpImage.height / 2; // 2 rows total
            console.log('Jump image loaded:', this.jumpImage.width + 'x' + this.jumpImage.height);
        };
        
        // Load background image
        this.bgImage = new Image();
        this.bgImage.src = 'assets/background/background.png';
        this.bgImageLoaded = false;
        this.bgImage.onload = () => {
            this.bgImageLoaded = true;
            console.log('Background image loaded');
        };
        
        // Background scroll position
        this.bgX = 0;
        
        // Running sprite config (4x3 layout, 12 frames)
        // Frame size will be auto-calculated after image loads
        this.runConfig = {
            frameWidth: 128,  // Default value, will update after loading
            frameHeight: 128, // Default value, will update after loading
            framesPerRow: 4,
            totalFrames: 12
        };
        
        // Jumping sprite config (2x2 layout, 4 frames)
        // Frame size will be auto-calculated after image loads
        this.jumpConfig = {
            frameWidth: 128,   // Default value, will update after loading
            frameHeight: 128,  // Default value, will update after loading
            framesPerRow: 2,
            totalFrames: 4
        };
        
        // Render size (scales with screen)
        this.renderWidth = 64;
        this.renderHeight = 64;
        
        // Collectible image cache
        this.collectibleImages = {};
        this.obstacleImages = {};
        
        // Preload collectible images
        this.preloadCollectibleImages();
        this.preloadObstacleImages();
    }
    
    // 预加载收集物图片
    preloadCollectibleImages() {
        for (const [type, config] of Object.entries(COLLECTIBLE_TYPES)) {
            for (const assetPath of config.assets) {
                if (!this.collectibleImages[assetPath]) {
                    const img = new Image();
                    img.src = assetPath;
                    this.collectibleImages[assetPath] = img;
                }
            }
        }
    }
    
    // Preload obstacle images
    preloadObstacleImages() {
        for (const [type, config] of Object.entries(OBSTACLE_ASSETS)) {
            for (const assetPath of config.assets) {
                if (!this.obstacleImages[assetPath]) {
                    const img = new Image();
                    img.src = assetPath;
                    this.obstacleImages[assetPath] = img;
                }
            }
        }
    }
    
    drawBackground(width, height) {
        if (this.bgImageLoaded) {
            // Calculate background scale (aspect ratio fill height)
            // Supports any image size (current: 1037x661)
            const bgScale = height / this.bgImage.height;
            const scaledWidth = this.bgImage.width * bgScale;
            
            // Update background scroll position (slow scroll)
            this.bgX -= 0.5;  // Scroll speed
            if (this.bgX <= -scaledWidth) {
                this.bgX = 0;  // Loop
            }
            
            // Calculate how many background images needed to cover screen width
            const numImages = Math.ceil(width / scaledWidth) + 1;
            
            // Draw enough backgrounds for seamless scrolling
            for (let i = -1; i < numImages; i++) {
                const x = this.bgX + i * scaledWidth;
                // Only draw backgrounds within visible area
                if (x < width && x + scaledWidth > 0) {
                    this.ctx.drawImage(this.bgImage, x, 0, scaledWidth, height);
                }
            }
        } else {
            // Show solid color background when image not loaded
            const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(0.6, '#B8E6B8');
            gradient.addColorStop(1, '#90EE90');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, width, height);
            
            // Loading hint
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Loading background...', width/2, height/2);
            this.ctx.textAlign = 'left';
        }
    }
    
    drawGround(x, y, width, height) {
        // Background image already includes ground, draw faint line as visual cue
        this.ctx.fillStyle = 'rgba(52, 73, 94, 0.3)';  // Semi-transparent dark
        this.ctx.fillRect(x, y, width, height);
        
        // Ground top decorative line (lighter)
        this.ctx.fillStyle = 'rgba(44, 62, 80, 0.5)';
        this.ctx.fillRect(x, y, width, 3);
    }
    
    drawPlayer(player) {
        const { x, y, width, height, isGrounded, animFrame } = player;
        
        if (isGrounded) {
            // Running state
            if (this.runImageLoaded) {
                const config = this.runConfig;
                const frameIndex = animFrame % config.totalFrames;
                const sx = (frameIndex % config.framesPerRow) * config.frameWidth;
                const sy = Math.floor(frameIndex / config.framesPerRow) * config.frameHeight;
                
                this.ctx.drawImage(
                    this.runImage,
                    sx, sy, config.frameWidth, config.frameHeight,
                    x, y, width, height
                );
            } else {
                // Loading placeholder
                this.ctx.fillStyle = '#4ECDC4';
                this.ctx.fillRect(x, y, width, height);
                this.ctx.fillStyle = '#FFF';
                this.ctx.font = '10px Arial';
                this.ctx.fillText('Loading...', x + 5, y + height/2);
            }
        } else {
            // Jumping state - use same image as running
            if (this.runImageLoaded) {
                const config = this.runConfig;
                const frameIndex = animFrame % config.totalFrames;
                const sx = (frameIndex % config.framesPerRow) * config.frameWidth;
                const sy = Math.floor(frameIndex / config.framesPerRow) * config.frameHeight;
                
                this.ctx.drawImage(
                    this.runImage,
                    sx, sy, config.frameWidth, config.frameHeight,
                    x, y, width, height
                );
            } else {
                // 加载中占位
                this.ctx.fillStyle = '#45B7D1';
                this.ctx.fillRect(x, y, width, height);
                this.ctx.fillStyle = '#FFF';
                this.ctx.font = '10px Arial';
                this.ctx.fillText('Loading...', x + 5, y + height/2);
            }
        }
    }
    
    drawObstacle(obstacle) {
        const { x, y, width, height, type, asset } = obstacle;
        
        // Draw obstacle image
        if (asset && this.obstacleImages[asset] && this.obstacleImages[asset].complete) {
            this.ctx.drawImage(
                this.obstacleImages[asset],
                x, y, width, height
            );
        } else {
            // Placeholder when image not loaded
            const color = type === 'ground' ? this.colors.groundObstacle : this.colors.airObstacle;
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x, y, width, height);
            
            // Danger mark
            this.ctx.strokeStyle = '#FFF';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x + 5, y + 5);
            this.ctx.lineTo(x + width - 5, y + height - 5);
            this.ctx.moveTo(x + width - 5, y + 5);
            this.ctx.lineTo(x + 5, y + height - 5);
            this.ctx.stroke();
        }
    }
    
    drawCollectible(collectible) {
        const { x, y, size, asset, value } = collectible;
        
        // Calculate center point
        const cx = x + size / 2;
        const cy = y + size / 2;
        
        // Draw collectible image (transparent background, no border)
        if (asset && this.collectibleImages[asset] && this.collectibleImages[asset].complete) {
            this.ctx.drawImage(
                this.collectibleImages[asset],
                x,
                y,
                size,
                size
            );
        } else {
            // 图片未加载时的占位符
            this.ctx.fillStyle = '#888';
            this.ctx.fillRect(x, y, size, size);
        }
        
        // Draw score text (small text below image with shadow)
        const scoreText = (value > 0 ? '+' : '') + value;
        this.ctx.font = `bold ${Math.floor(size * 0.35)}px 'Press Start 2P'`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Text shadow
        this.ctx.fillStyle = '#000';
        this.ctx.fillText(scoreText, cx + 2, cy + size * 0.45 + 2);
        
        // Text body
        this.ctx.fillStyle = value > 0 ? '#2ECC71' : '#E74C3C';
        this.ctx.fillText(scoreText, cx, cy + size * 0.45);
        
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'alphabetic';
    }
    
    drawPowerup(powerup) {
        const { x, y, size, type } = powerup;
        
        const flash = Math.sin(this.gameTime * 0.01) > 0;
        const color = flash ? this.colors.powerup : '#F39C12';
        
        const cx = x + size / 2;
        const cy = y + size / 2;
        const outerRadius = size / 2;
        const innerRadius = size / 4;
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI / 5) - Math.PI / 2;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const px = cx + Math.cos(angle) * radius;
            const py = cy + Math.sin(angle) * radius;
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 10px monospace';
        this.ctx.textAlign = 'center';
        const multiplier = type === 'OUTDOOR_JACKET' ? 'x2' : 
                          type === 'BUG_NET' ? 'x3' : 'x5';
        this.ctx.fillText(multiplier, cx, cy + 3);
        this.ctx.textAlign = 'left';
    }
    
    drawParticle(particle) {
        const { x, y, size, life, maxLife } = particle;
        const alpha = life / maxLife;
        
        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        this.ctx.fillRect(x, y, size, size);
    }
    
    drawCloud(cloud) {
        const { x, y, width, height } = cloud;
        
        this.ctx.fillStyle = this.colors.cloud;
        this.ctx.beginPath();
        this.ctx.ellipse(x + width/2, y + height/2, width/2, height/2, 0, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawTree(tree) {
        const { x, y } = tree;
        const width = tree.width || 40;
        const height = tree.height || 80;
        
        this.ctx.fillStyle = '#27AE60';
        this.ctx.beginPath();
        this.ctx.moveTo(x + width/2, y);
        this.ctx.lineTo(x + width, y + height);
        this.ctx.lineTo(x, y + height);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawPowerupUI(player, powerupType, canvasWidth) {
        if (!player.activePowerup) return;
        
        const barWidth = 200;
        const barHeight = 20;
        const x = (canvasWidth - barWidth) / 2;
        const y = 60;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        const progress = player.powerupTimer / CONFIG.POWERUP_DURATION;
        this.ctx.fillStyle = this.colors.powerup;
        this.ctx.fillRect(x, y, barWidth * progress, barHeight);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'center';
        const multiplier = player.scoreMultiplier;
        this.ctx.fillText(`×${multiplier} BOOST`, canvasWidth / 2, y + 14);
        this.ctx.textAlign = 'left';
    }
}

// Register renderer
RendererManager.register('image', ImageRenderer);
