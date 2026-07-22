import { describe, it, expect, beforeEach } from 'vitest';
import { PhysicsEngine } from '../engine/PhysicsEngine';
import { SPECIES_PRESETS } from '../store/useSimStore';

describe('PhysicsEngine 3D Molecular Dynamics', () => {
  let engine: PhysicsEngine;

  beforeEach(() => {
    engine = new PhysicsEngine(SPECIES_PRESETS[1]); // Argon
    engine.clearParticles();
  });

  it('should initialize with species parameters correctly', () => {
    expect(engine.currentSpecies.id).toBe('argon');
    expect(engine.currentSpecies.mass).toBe(39.95);
    expect(engine.particles.length).toBe(0);
  });

  it('should add particles within container bounds', () => {
    engine.addParticles(50, 300);
    expect(engine.particles.length).toBe(50);

    for (const p of engine.particles) {
      expect(p.x).toBeGreaterThanOrEqual(-engine.bounds.width / 2);
      expect(p.x).toBeLessThanOrEqual(engine.bounds.width / 2);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(engine.bounds.height);
      expect(p.z).toBeGreaterThanOrEqual(-engine.bounds.depth / 2);
      expect(p.z).toBeLessThanOrEqual(engine.bounds.depth / 2);
    }
  });

  it('should rescale velocities when temperature is modified', () => {
    engine.addParticles(100, 100);
    const initialTemp = engine.temperatureK;
    expect(initialTemp).toBeGreaterThan(0);

    engine.setTemperature(300);
    expect(engine.temperatureK).toBe(300);
  });

  it('should update particle positions during simulation steps', () => {
    engine.addParticles(20, 300);
    const initialPos = { x: engine.particles[0].x, y: engine.particles[0].y, z: engine.particles[0].z };

    engine.step(0.05);

    const newPos = { x: engine.particles[0].x, y: engine.particles[0].y, z: engine.particles[0].z };
    const moved = initialPos.x !== newPos.x || initialPos.y !== newPos.y || initialPos.z !== newPos.z;
    expect(moved).toBe(true);
  });

  it('should detect phase transitions based on species thresholds', () => {
    engine.addParticles(50, 10);
    engine.setTemperature(10);
    engine.step(0.01);
    expect(engine.phaseState).toBe('Solid');

    engine.setTemperature(500);
    engine.step(0.01);
    expect(engine.phaseState).toBe('Supercritical Plasma');
  });

  it('should enforce divider wall collision in diffusion mode', () => {
    engine.setDivider(true, 0); // Wall at X=0
    engine.addParticles(30, 300, SPECIES_PRESETS[0], 'left');

    const countsBefore = engine.getDiffusionCounts();
    expect(countsBefore.left).toBe(30);
    expect(countsBefore.right).toBe(0);

    // Step simulation - particles should remain on left side
    for (let i = 0; i < 20; i++) {
      engine.step(0.02);
    }

    const countsAfter = engine.getDiffusionCounts();
    expect(countsAfter.left).toBe(30);
    expect(countsAfter.right).toBe(0);
  });

  it('should produce valid telemetry snapshots', () => {
    engine.addParticles(40, 250);
    engine.step(0.02);

    const snapshot = engine.getTelemetrySnapshot();
    expect(snapshot.particleCount).toBe(40);
    expect(snapshot.temperatureK).toBeGreaterThan(0);
    expect(snapshot.pressureAtm).toBeGreaterThanOrEqual(0);
    expect(snapshot.phaseState).toBeDefined();
  });
});
