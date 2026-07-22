import { describe, it, expect, beforeEach } from 'vitest';
import { WavePhysicsEngine } from '../engine/WavePhysicsEngine';

describe('WavePhysicsEngine 3D Wave PDE & Optics', () => {
  let engine: WavePhysicsEngine;

  beforeEach(() => {
    engine = new WavePhysicsEngine();
  });

  it('should compute two-slit diffraction angle correctly', () => {
    engine.wavelengthNm = 500; // 0.5 um
    engine.slitSeparationUm = 2.0;

    const angle = engine.computeDiffractionAngle(1);
    expect(angle).toBeGreaterThan(0);
    expect(angle).toBeLessThan(90);
  });

  it('should compute Snell Law refraction angle correctly', () => {
    engine.refractiveIndexN = 1.5; // Glass
    const refrAngle = engine.computeRefractionAngle(45);

    expect(refrAngle).toBeLessThan(45); // Light bends towards normal in denser medium
  });
});
