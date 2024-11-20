interface Particle {
    x: number;
    y: number;
    color: string;
    velocity: {
      x: number;
      y: number;
    };
    size: number;
    life: number;
    maxLife: number;
  }
  
  export class ParticleSystem {
    private particles: Particle[] = [];
    
    createParticles(x: number, y: number, color: string, count: number = 15) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = 2 + Math.random() * 4;
        
        this.particles.push({
          x,
          y,
          color,
          velocity: {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
          },
          size: 3 + Math.random() * 3,
          life: 1,
          maxLife: 0.7 + Math.random() * 0.3
        });
      }
    }
  
    update() {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const particle = this.particles[i];
        
        // Update position
        particle.x += particle.velocity.x;
        particle.y += particle.velocity.y;
        
        // Add gravity
        particle.velocity.y += 0.1;
        
        // Decrease life
        particle.life -= 0.02;
        
        // Remove dead particles
        if (particle.life <= 0) {
          this.particles.splice(i, 1);
        }
      }
    }
  
    draw(ctx: CanvasRenderingContext2D) {
      this.particles.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }
    
    clear() {
      this.particles = [];
    }
  }