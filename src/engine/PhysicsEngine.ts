import type { Particle, PhaseState, SimTelemetrySnapshot } from './Types';
import type { ParticleSpecies } from '../schemas/sim_schema';

export interface ContainerBounds {
  width: number;
  height: number;
  depth: number;
}

export class PhysicsEngine {
  public particles: Particle[] = [];
  public bounds: ContainerBounds = { width: 30, height: 35, depth: 30 };
  public temperatureK: number = 300;
  public pressureAtm: number = 1.0;
  public kineticEnergy: number = 0;
  public potentialEnergy: number = 0;
  public phaseState: PhaseState = 'Gas';
  public currentSpecies: ParticleSpecies;

  // Diffusion Mode Divider Wall
  public isDividerActive: boolean = false;
  public dividerX: number = 0;

  private nextParticleId: number = 0;
  private timeStep: number = 0.02;

  constructor(initialSpecies: ParticleSpecies) {
    this.currentSpecies = initialSpecies;
  }

  public setSpecies(species: ParticleSpecies) {
    this.currentSpecies = species;
    for (const p of this.particles) {
      if (p.speciesId === this.currentSpecies.id) {
        p.mass = species.mass;
        p.color = species.color;
      }
    }
  }

  public setContainerDimensions(width: number, height: number, depth: number) {
    this.bounds.width = Math.max(12, Math.min(50, width));
    this.bounds.height = Math.max(15, Math.min(50, height));
    this.bounds.depth = Math.max(12, Math.min(50, depth));
  }

  public setDivider(active: boolean, xPosition: number = 0) {
    this.isDividerActive = active;
    this.dividerX = xPosition;
  }

  public addParticles(
    count: number,
    targetTempK: number = this.temperatureK,
    speciesOverride?: ParticleSpecies,
    side: 'all' | 'left' | 'right' = 'all'
  ) {
    const species = speciesOverride || this.currentSpecies;
    const radius = 0.8;

    let minX = -this.bounds.width / 2 + radius;
    let maxX = this.bounds.width / 2 - radius;

    if (this.isDividerActive) {
      if (side === 'left') {
        maxX = this.dividerX - radius;
      } else if (side === 'right') {
        minX = this.dividerX + radius;
      }
    }

    const w = maxX - minX;
    const h = this.bounds.height - 2 * radius;
    const d = this.bounds.depth - 2 * radius;

    const baseSpeed = Math.sqrt((3 * 0.008314 * targetTempK) / (species.mass * 0.01));

    for (let i = 0; i < count; i++) {
      const px = minX + Math.random() * w;
      const py = radius + Math.random() * h;
      const pz = (Math.random() - 0.5) * d;

      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = baseSpeed * (0.7 + Math.random() * 0.6);

      const vx = speed * Math.sin(phi) * Math.cos(theta);
      const vy = speed * Math.sin(phi) * Math.sin(theta);
      const vz = speed * Math.cos(phi);

      this.particles.push({
        id: this.nextParticleId++,
        x: px,
        y: py,
        z: pz,
        vx,
        vy,
        vz,
        fx: 0,
        fy: 0,
        fz: 0,
        speciesId: species.id,
        mass: species.mass,
        radius,
        color: species.color
      });
    }
  }

  public removeParticles(count: number) {
    const toRemove = Math.min(count, this.particles.length);
    this.particles.splice(this.particles.length - toRemove, toRemove);
  }

  public clearParticles() {
    this.particles = [];
  }

  public applyHeat(deltaTempK: number) {
    this.temperatureK = Math.max(5, Math.min(2000, this.temperatureK + deltaTempK));
    this.rescaleVelocitiesToTemperature(this.temperatureK);
  }

  public setTemperature(targetTempK: number) {
    this.temperatureK = Math.max(5, Math.min(2000, targetTempK));
    this.rescaleVelocitiesToTemperature(this.temperatureK);
  }

  private rescaleVelocitiesToTemperature(targetK: number) {
    if (this.particles.length === 0) return;
    const currentTemp = this.computeKineticTemperature();
    if (currentTemp <= 0.1) {
      for (const p of this.particles) {
        const baseSpeed = Math.sqrt((3 * 0.008314 * targetK) / (p.mass * 0.01));
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        p.vx = baseSpeed * Math.sin(phi) * Math.cos(theta);
        p.vy = baseSpeed * Math.sin(phi) * Math.sin(theta);
        p.vz = baseSpeed * Math.cos(phi);
      }
      return;
    }

    const scaleFactor = Math.sqrt(targetK / currentTemp);
    for (const p of this.particles) {
      p.vx *= scaleFactor;
      p.vy *= scaleFactor;
      p.vz *= scaleFactor;
    }
  }

  public step(dt: number = this.timeStep): { wallCollisions: number; avgImpulse: number } {
    if (this.particles.length === 0) {
      this.temperatureK = 0;
      this.pressureAtm = 0;
      this.kineticEnergy = 0;
      this.potentialEnergy = 0;
      this.phaseState = 'Gas';
      return { wallCollisions: 0, avgImpulse: 0 };
    }

    const N = this.particles.length;

    for (let i = 0; i < N; i++) {
      this.particles[i].fx = 0;
      this.particles[i].fy = -0.05 * (this.particles[i].mass / 20);
      this.particles[i].fz = 0;
    }

    let totalPotEng = 0;
    let virialSum = 0;

    const sigma = this.currentSpecies.sigma * 0.25;
    const epsilon = this.currentSpecies.epsilon * 0.05;
    const rCutoff = 3.0 * sigma;
    const rCutoffSq = rCutoff * rCutoff;

    for (let i = 0; i < N; i++) {
      const p1 = this.particles[i];
      for (let j = i + 1; j < N; j++) {
        const p2 = this.particles[j];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dz = p2.z - p1.z;

        const r2 = dx * dx + dy * dy + dz * dz;

        if (r2 < rCutoffSq && r2 > 0.04) {
          const invR2 = 1.0 / r2;
          const sig2_over_r2 = (sigma * sigma) * invR2;
          const sig6 = sig2_over_r2 * sig2_over_r2 * sig2_over_r2;
          const sig12 = sig6 * sig6;

          const fScalar = 24.0 * epsilon * (2.0 * sig12 - sig6) * invR2;
          const clampedFScalar = Math.max(-50, Math.min(50, fScalar));

          const fx = clampedFScalar * dx;
          const fy = clampedFScalar * dy;
          const fz = clampedFScalar * dz;

          p1.fx -= fx;
          p1.fy -= fy;
          p1.fz -= fz;

          p2.fx += fx;
          p2.fy += fy;
          p2.fz += fz;

          totalPotEng += 4.0 * epsilon * (sig12 - sig6);
          virialSum += (dx * fx + dy * fy + dz * fz);
        }
      }
    }

    this.potentialEnergy = totalPotEng;

    let wallCollisions = 0;
    let totalImpulse = 0;

    const halfW = this.bounds.width / 2;
    const halfD = this.bounds.depth / 2;
    const maxH = this.bounds.height;

    for (let i = 0; i < N; i++) {
      const p = this.particles[i];

      p.vx += (p.fx / p.mass) * dt;
      p.vy += (p.fy / p.mass) * dt;
      p.vz += (p.fz / p.mass) * dt;

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;

      const r = p.radius;

      // X boundaries
      if (p.x - r < -halfW) {
        p.x = -halfW + r;
        p.vx = -p.vx * 0.95;
        wallCollisions++;
        totalImpulse += Math.abs(2 * p.mass * p.vx);
      } else if (p.x + r > halfW) {
        p.x = halfW - r;
        p.vx = -p.vx * 0.95;
        wallCollisions++;
        totalImpulse += Math.abs(2 * p.mass * p.vx);
      }

      // Divider Wall collision reflection
      if (this.isDividerActive) {
        if (p.x < this.dividerX && p.x + r > this.dividerX) {
          p.x = this.dividerX - r;
          p.vx = -p.vx * 0.95;
          wallCollisions++;
          totalImpulse += Math.abs(2 * p.mass * p.vx);
        } else if (p.x > this.dividerX && p.x - r < this.dividerX) {
          p.x = this.dividerX + r;
          p.vx = -p.vx * 0.95;
          wallCollisions++;
          totalImpulse += Math.abs(2 * p.mass * p.vx);
        }
      }

      // Y boundaries (Floor & Lid)
      if (p.y - r < 0) {
        p.y = r;
        p.vy = -p.vy * 0.95;
        wallCollisions++;
        totalImpulse += Math.abs(2 * p.mass * p.vy);
      } else if (p.y + r > maxH) {
        p.y = maxH - r;
        p.vy = -p.vy * 0.95;
        wallCollisions++;
        totalImpulse += Math.abs(2 * p.mass * p.vy);
      }

      // Z boundaries
      if (p.z - r < -halfD) {
        p.z = -halfD + r;
        p.vz = -p.vz * 0.95;
        wallCollisions++;
        totalImpulse += Math.abs(2 * p.mass * p.vz);
      } else if (p.z + r > halfD) {
        p.z = halfD - r;
        p.vz = -p.vz * 0.95;
        wallCollisions++;
        totalImpulse += Math.abs(2 * p.mass * p.vz);
      }
    }

    this.temperatureK = this.computeKineticTemperature();

    const volumeNm3 = (this.bounds.width * this.bounds.height * this.bounds.depth) / 1000;

    const idealPressure = (N * 0.08206 * this.temperatureK) / (volumeNm3 * 10);
    const wallPressure = (totalImpulse / (dt * (this.bounds.width * this.bounds.height * 6))) * 0.5;
    this.pressureAtm = Math.max(0, idealPressure + wallPressure + (virialSum / (3 * volumeNm3 * 100)));

    this.determinePhaseState();

    return {
      wallCollisions,
      avgImpulse: wallCollisions > 0 ? totalImpulse / wallCollisions : 0
    };
  }

  private computeKineticTemperature(): number {
    if (this.particles.length === 0) return 0;
    let totalKineticEnergy = 0;
    for (const p of this.particles) {
      const v2 = p.vx * p.vx + p.vy * p.vy + p.vz * p.vz;
      totalKineticEnergy += 0.5 * p.mass * v2;
    }
    this.kineticEnergy = totalKineticEnergy;
    const avgEk = totalKineticEnergy / this.particles.length;
    return (avgEk * 45.0) / (this.currentSpecies.mass * 0.1);
  }

  private determinePhaseState() {
    const T = this.temperatureK;
    const tripleT = this.currentSpecies.triplePointTemp;
    const critT = this.currentSpecies.criticalPointTemp;

    if (T > critT * 1.5) {
      this.phaseState = 'Supercritical Plasma';
    } else if (T > tripleT * 1.1) {
      this.phaseState = 'Gas';
    } else if (T > tripleT * 0.7) {
      this.phaseState = 'Liquid';
    } else {
      this.phaseState = 'Solid';
    }
  }

  public getDiffusionCounts(): { left: number; right: number } {
    let left = 0;
    let right = 0;
    for (const p of this.particles) {
      if (p.x < this.dividerX) left++;
      else right++;
    }
    return { left, right };
  }

  public getTelemetrySnapshot(): SimTelemetrySnapshot {
    const volumeNm3 = (this.bounds.width * this.bounds.height * this.bounds.depth) / 1000;
    const { left, right } = this.getDiffusionCounts();
    return {
      timestamp: Date.now(),
      temperatureK: Math.round(this.temperatureK),
      pressureAtm: parseFloat(this.pressureAtm.toFixed(2)),
      volumeNm3: parseFloat(volumeNm3.toFixed(2)),
      particleCount: this.particles.length,
      kineticEnergy: parseFloat(this.kineticEnergy.toFixed(1)),
      potentialEnergy: parseFloat(this.potentialEnergy.toFixed(1)),
      phaseState: this.phaseState,
      leftCount: left,
      rightCount: right
    };
  }
}
