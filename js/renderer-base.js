/**
 * Base Renderer Class
 * All style renderers must extend this class
 */

class BaseRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.gameTime = 0;
    }

    updateTime(time) {
        this.gameTime = time;
    }

    // Required methods
    drawBackground(width, height) {
        throw new Error('drawBackground must be implemented');
    }

    drawGround(x, y, width, height) {
        throw new Error('drawGround must be implemented');
    }

    drawPlayer(player) {
        throw new Error('drawPlayer must be implemented');
    }

    drawObstacle(obstacle) {
        throw new Error('drawObstacle must be implemented');
    }

    drawCollectible(collectible) {
        throw new Error('drawCollectible must be implemented');
    }

    drawPowerup(powerup) {
        throw new Error('drawPowerup must be implemented');
    }

    drawParticle(particle) {
        throw new Error('drawParticle must be implemented');
    }

    drawCloud(cloud) {
        throw new Error('drawCloud must be implemented');
    }

    drawTree(tree) {
        throw new Error('drawTree must be implemented');
    }

    drawPowerupUI(player, powerupType, canvasWidth) {
        throw new Error('drawPowerupUI must be implemented');
    }

    // Utility methods
    roundRect(x, y, w, h, r) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + w - r, y);
        this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        this.ctx.lineTo(x + w, y + h - r);
        this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.ctx.lineTo(x + r, y + h);
        this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        this.ctx.lineTo(x, y + r);
        this.ctx.quadraticCurveTo(x, y, x + r, y);
        this.ctx.closePath();
    }
}

// Renderer Manager
const RendererManager = {
    current: null,
    renderers: {},
    
    register(name, RendererClass) {
        this.renderers[name] = RendererClass;
    },
    
    create(ctx, type) {
        if (this.renderers[type]) {
            this.current = new this.renderers[type](ctx);
            return this.current;
        }
        console.error('Unknown renderer:', type);
        return null;
    }
};
