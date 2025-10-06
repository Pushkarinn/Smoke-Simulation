import * as THREE from 'three';

export interface SmokeParticleOptions {
  particleCount?: number;
  particleSize?: number;
  particleOpacity?: number;
  particleColor?: number;
  emissionRate?: number;
  particleLifetime?: number;
  gravity?: number;
  wind?: THREE.Vector3;
  startVelocity?: THREE.Vector3;
  startVelocityRandomness?: number;
  fadeIn?: number;
  fadeOut?: number;
}

export class SmokeParticleSystem {
  private particles: THREE.Points;
  private particleGeometry: THREE.BufferGeometry;
  private particleMaterial: THREE.ShaderMaterial;
  private particleCount: number;
  private positions: Float32Array;
  private velocities: Float32Array;
  private lifetimes: Float32Array;
  private ages: Float32Array;
  private sizes: Float32Array;
  private opacities: Float32Array;
  private emissionRate: number;
  private particleLifetime: number;
  private gravity: number;
  private wind: THREE.Vector3;
  private startVelocity: THREE.Vector3;
  private startVelocityRandomness: number;
  private fadeIn: number;
  private fadeOut: number;
  private emissionTimer: number = 0;
  private nextParticleIndex: number = 0;

  constructor(options: SmokeParticleOptions = {}) {
    const {
      particleCount = 200,
      particleSize = 25.0,
      particleColor = 0x888888,
      emissionRate = 18,
      particleLifetime = 6.0,
      gravity = -0.12, // stronger buoyancy for upward movement (10x)
      wind = new THREE.Vector3(0.03, 0, 0.02), // 10x wind strength
      startVelocity = new THREE.Vector3(0, 0.25, 0), // 10x initial upward velocity
      startVelocityRandomness = 0.12, // 10x randomness
      fadeIn = 0.15,
      fadeOut = 0.5
    } = options;

    this.particleCount = particleCount;
    this.emissionRate = emissionRate;
    this.particleLifetime = particleLifetime;
    this.gravity = gravity;
    this.wind = wind;
    this.startVelocity = startVelocity;
    this.startVelocityRandomness = startVelocityRandomness;
    this.fadeIn = fadeIn;
    this.fadeOut = fadeOut;

    // Initialize arrays
    this.positions = new Float32Array(particleCount * 3);
    this.velocities = new Float32Array(particleCount * 3);
    this.lifetimes = new Float32Array(particleCount);
    this.ages = new Float32Array(particleCount);
    this.sizes = new Float32Array(particleCount);
    this.opacities = new Float32Array(particleCount);

    // Initialize all particles as inactive
    for (let i = 0; i < particleCount; i++) {
      this.lifetimes[i] = -1; // Inactive
      this.ages[i] = 0;
      this.sizes[i] = particleSize * (0.5 + Math.random() * 0.5);
      this.opacities[i] = 0;
    }

    // Create geometry
    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    this.particleGeometry.setAttribute('opacity', new THREE.BufferAttribute(this.opacities, 1));

    // Create shader material
    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(particleColor) },
        pointTexture: { value: this.createSmokeTexture() }
      },
      vertexShader: `
        attribute float size;
        attribute float opacity;
        varying float vOpacity;
        
        void main() {
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          // Proper point size scaling - much smaller and distance-based
          gl_PointSize = size * (50.0 / length(mvPosition.xyz));
          gl_PointSize = clamp(gl_PointSize, 2.0, 100.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform sampler2D pointTexture;
        varying float vOpacity;
        
        void main() {
          gl_FragColor = vec4(color, vOpacity);
          gl_FragColor = gl_FragColor * texture2D(pointTexture, gl_PointCoord);
          if (gl_FragColor.a < 0.001) discard;
        }
      `,
      blending: THREE.NormalBlending,
      depthTest: true,
      depthWrite: false,
      transparent: true,
    });

    // Create the particle system
    this.particles = new THREE.Points(this.particleGeometry, this.particleMaterial);
  }

  private createSmokeTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext('2d')!;
    
    // Create a more realistic smoke texture with noise
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(200,200,200,0.8)');
    gradient.addColorStop(0.3, 'rgba(150,150,150,0.6)');
    gradient.addColorStop(0.7, 'rgba(100,100,100,0.3)');
    gradient.addColorStop(1, 'rgba(50,50,50,0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    
    // Add some noise for more realistic smoke appearance
    const imageData = context.getImageData(0, 0, 128, 128);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 0.2;
      data[i] = Math.max(0, Math.min(255, data[i] + noise * 255)); // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise * 255)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise * 255)); // B
    }
    
    context.putImageData(imageData, 0, 0);
    
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  public getParticleSystem(): THREE.Points {
    return this.particles;
  }

  public update(deltaTime: number): void {
    this.emissionTimer += deltaTime;

    // Emit new particles
    const particlesToEmit = Math.floor(this.emissionTimer * this.emissionRate);
    this.emissionTimer -= particlesToEmit / this.emissionRate;

    for (let i = 0; i < particlesToEmit; i++) {
      this.emitParticle();
    }

    // Update existing particles
    for (let i = 0; i < this.particleCount; i++) {
      if (this.lifetimes[i] >= 0) {
        this.updateParticle(i, deltaTime);
      }
    }

    // Update buffer attributes
    this.particleGeometry.attributes.position.needsUpdate = true;
    this.particleGeometry.attributes.opacity.needsUpdate = true;
  }

  private emitParticle(): void {
    // Find an inactive particle or reuse the oldest one
    let particleIndex = -1;
    for (let i = 0; i < this.particleCount; i++) {
      if (this.lifetimes[i] < 0) {
        particleIndex = i;
        break;
      }
    }

    if (particleIndex === -1) {
      particleIndex = this.nextParticleIndex;
      this.nextParticleIndex = (this.nextParticleIndex + 1) % this.particleCount;
    }

    // Initialize particle at origin with very slight initial spread (10x larger)
    const i3 = particleIndex * 3;
    const initialSpread = 0.2; // 10x larger initial spread
    this.positions[i3] = (Math.random() - 0.5) * initialSpread; // x - tiny initial spread
    this.positions[i3 + 1] = Math.random() * initialSpread; // y - slightly above origin
    this.positions[i3 + 2] = (Math.random() - 0.5) * initialSpread; // z - tiny initial spread

    // Create cone-shaped upward emission pattern
    const coneAngle = Math.PI / 6; // 30-degree cone
    const randomAngle = Math.random() * Math.PI * 2; // random rotation around Y axis
    const coneHeight = Math.cos(Math.random() * coneAngle); // bias toward vertical
    const coneRadius = Math.sin(Math.random() * coneAngle) * this.startVelocityRandomness;
    
    // Strong upward bias with radial spread
    this.velocities[i3] = this.startVelocity.x + Math.cos(randomAngle) * coneRadius;
    this.velocities[i3 + 1] = this.startVelocity.y + coneHeight * this.startVelocityRandomness * 3; // stronger upward
    this.velocities[i3 + 2] = this.startVelocity.z + Math.sin(randomAngle) * coneRadius;

    this.lifetimes[particleIndex] = this.particleLifetime;
    this.ages[particleIndex] = 0;
  }

  private updateParticle(index: number, deltaTime: number): void {
    this.ages[index] += deltaTime;
    
    if (this.ages[index] >= this.lifetimes[index]) {
      // Particle died
      this.lifetimes[index] = -1;
      this.opacities[index] = 0;
      return;
    }

    const i3 = index * 3;
    const ageRatio = this.ages[index] / this.lifetimes[index];
    
    // Enhanced turbulence for natural smoke movement (10x scale)
    const time = this.ages[index];
    const turbulenceX = Math.sin(time * 1.5 + index * 0.1) * 0.02; // 10x turbulence
    const turbulenceZ = Math.cos(time * 1.8 + index * 0.2) * 0.02; // 10x turbulence
    const verticalTurbulence = Math.sin(time * 0.8) * 0.01; // 10x turbulence
    
    // Smoke spreads more as it rises (natural dispersion)
    const dispersionFactor = 1 + ageRatio * 2;
    
    // Update velocity with enhanced physics
    // Buoyancy decreases over time as smoke cools
    const buoyancy = this.gravity * (1 + ageRatio * 0.5);
    this.velocities[i3 + 1] += buoyancy * deltaTime;
    
    // Horizontal spread increases with height and age
    this.velocities[i3] += (this.wind.x * dispersionFactor + turbulenceX) * deltaTime;
    this.velocities[i3 + 2] += (this.wind.z * dispersionFactor + turbulenceZ) * deltaTime;
    
    // Vertical turbulence for natural smoke waviness
    this.velocities[i3 + 1] += verticalTurbulence * deltaTime;
    
    // Different drag for different axes - less drag on upward movement
    const horizontalDrag = 0.985 - ageRatio * 0.01; // increases with age
    const verticalDrag = 0.995; // minimal drag on upward movement
    
    this.velocities[i3] *= horizontalDrag;
    this.velocities[i3 + 1] *= verticalDrag;
    this.velocities[i3 + 2] *= horizontalDrag;

    // Update position
    this.positions[i3] += this.velocities[i3] * deltaTime;
    this.positions[i3 + 1] += this.velocities[i3 + 1] * deltaTime;
    this.positions[i3 + 2] += this.velocities[i3 + 2] * deltaTime;

    // Update opacity with more realistic fading
    let opacity = 1.0;
    
    if (ageRatio < this.fadeIn) {
      opacity = ageRatio / this.fadeIn;
    } else if (ageRatio > this.fadeOut) {
      opacity = 1.0 - (ageRatio - this.fadeOut) / (1.0 - this.fadeOut);
    }
    
    // Smoke gets less opaque as it spreads and rises
    const heightFade = Math.min(1.0, this.positions[i3 + 1] * 0.1); // fade with height
    this.opacities[index] = opacity * (0.5 - ageRatio * 0.3 - heightFade * 0.1);
    
    // Particles grow more rapidly as they age (smoke expansion)
    const growthRate = 0.4 + ageRatio * 0.6; // accelerating growth
    this.sizes[index] = this.sizes[index] * (1 + deltaTime * growthRate);
  }

  public setPosition(x: number, y: number, z: number): void {
    this.particles.position.set(x, y, z);
  }

  public dispose(): void {
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
    if (this.particleMaterial.uniforms.pointTexture.value) {
      this.particleMaterial.uniforms.pointTexture.value.dispose();
    }
  }
}