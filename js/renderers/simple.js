/**
 * Minimal Block Style Renderer
 * All elements represented by solid color blocks, focus on game logic verification
 */

class SimpleRenderer extends BaseRenderer {
    constructor(ctx) {
        super(ctx);
        // Calculate scale based on canvas size (base size increased)
        const canvas = ctx.canvas;
        this.scale = Math.min(canvas.width / 350, canvas.height / 600);
        this.fontSize = {
            small: Math.max(12, 12 * this.scale),
            normal: Math.max(14, 14 * this.scale),
            large: Math.max(18, 18 * this.scale),
            score: Math.max(32, 40 * this.scale)
        };
        this.colors = {
            // Player
            player: '#4ECDC4',
            playerJumping: '#45B7D1',

            
            // Obstacles
            groundObstacle: '#E74C3C',  // Red = danger (need to jump)
            airObstacle: '#E67E22',      // Orange = air obstacle (may hit when jumping)
            
            // Collectibles
            collectibleGround: '#2ECC71', // Green = ground collectible
            collectibleAir: '#9B59B6',    // Purple = air collectible
            
            // Powerups
            powerup: '#F1C40F',           // Yellow = powerup
            
            // Environment
            ground: '#34495E',
            sky: '#ECF0F1',
            cloud: '#BDC3C7',
            particle: '#FFFFFF'
        };
    }
    
    drawBackground(width, height) {
        // Solid color background
        this.ctx.fillStyle = this.colors.sky;
        this.ctx.fillRect(0, 0, width, height);
        
        // Simple horizon line
        this.ctx.fillStyle = '#D5DBDB';
        this.ctx.fillRect(0, height - CONFIG.GROUND_HEIGHT - 20, width, 20);
    }
    
    drawGround(x, y, width, height) {
        this.ctx.fillStyle = this.colors.ground;
        this.ctx.fillRect(x, y, width, height);
        
        // Ground decorative line
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.fillRect(x, y, width, 4);
    }
    
    drawPlayer(player) {
        const { x, y, width, height, isGrounded } = player;
        
        // Choose color based on state
        let color = this.colors.player;
        if (!isGrounded) color = this.colors.playerJumping;
        
        // Player main block
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
        
        // Border to make block clearer
        this.ctx.strokeStyle = '#2C3E50';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
        
        // Simple eyes indicating direction
        this.ctx.fillStyle = '#FFF';
        const eyeSize = 6;
        this.ctx.fillRect(x + width - 15, y + 10, eyeSize, eyeSize);
        this.ctx.fillRect(x + width - 15, y + 25, eyeSize, eyeSize);
    }
    
    drawObstacle(obstacle) {
        const { x, y, width, height, type, subtype } = obstacle;
        
        // Color distinguishes ground/air obstacles
        const color = type === 'ground' ? this.colors.groundObstacle : this.colors.airObstacle;
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
        
        // Danger mark (X)
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x + 5, y + 5);
        this.ctx.lineTo(x + width - 5, y + height - 5);
        this.ctx.moveTo(x + width - 5, y + 5);
        this.ctx.lineTo(x + 5, y + height - 5);
        this.ctx.stroke();
        
        // Type indicator
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = `bold ${this.fontSize.normal}px monospace`;
        const label = type === 'ground' ? '▼' : '▲';  // ▼=ground(jump) ▲=air(don't hit)
        this.ctx.fillText(label, x + width/2 - 4, y + height/2 + 4);
    }
    
    drawCollectible(collectible) {
        const { x, y, size, emoji, value, typeColor } = collectible;
        
        // Calculate center point (for drawing emoji and score)
        const cx = x + size / 2;
        const cy = y + size / 2;
        
        // Square represents collectible (with rounded corners), use type color
        this.ctx.fillStyle = typeColor || this.colors.collectibleGround;
        
        // 绘制圆角正方形
        const radius = size * 0.15;  // Corner radius
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + size - radius, y);
        this.ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
        this.ctx.lineTo(x + size, y + size - radius);
        this.ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
        this.ctx.lineTo(x + radius, y + size);
        this.ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Border
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw emoji icon
        this.ctx.font = `${Math.floor(size * 0.6)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(emoji || '❓', cx, cy - 2);
        
        // Draw score
        this.ctx.fillStyle = value > 0 ? '#2ECC71' : '#E74C3C';
        this.ctx.font = `bold ${Math.floor(size * 0.3)}px monospace`;
        this.ctx.fillText((value > 0 ? '+' : '') + value, cx, cy + size * 0.35);
        
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'alphabetic';
    }
    
    drawPowerup(powerup) {
        const { x, y, size, type } = powerup;
        
        // Flash effect
        const flash = Math.sin(this.gameTime * 0.01) > 0;
        const color = flash ? this.colors.powerup : '#F39C12';
        
        // Star shape represents powerup
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
        
        // Multiplier label
        this.ctx.fillStyle = '#000';
        this.ctx.font = `bold ${this.fontSize.small}px monospace`;
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
        // Simplified cloud = white ellipse
        const { x, y } = cloud;
        const width = cloud.width || 60;
        const height = cloud.height || 30;
        
        this.ctx.fillStyle = this.colors.cloud;
        this.ctx.beginPath();
        this.ctx.ellipse(x + width/2, y + height/2, width/2, height/2, 0, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawTree(tree) {
        // Simplified tree = green triangle
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
        
        // Background bar
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        // Progress bar
        const progress = player.powerupTimer / CONFIG.POWERUP_DURATION;
        this.ctx.fillStyle = this.colors.powerup;
        this.ctx.fillRect(x, y, barWidth * progress, barHeight);
        
        // Text
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = `${this.fontSize.normal}px monospace`;
        this.ctx.textAlign = 'center';
        const multiplier = player.scoreMultiplier;
        this.ctx.fillText(`×${multiplier} BOOST`, canvasWidth / 2, y + 14);
        this.ctx.textAlign = 'left';
    }
}

// Register renderer
RendererManager.register('simple', SimpleRenderer);
