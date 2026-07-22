import { describe, it, expect, beforeEach } from 'vitest';
import { MotionPhysicsEngine } from '../engine/MotionPhysicsEngine';

describe('MotionPhysicsEngine 3D Mechanics', () => {
  let engine: MotionPhysicsEngine;

  beforeEach(() => {
    engine = new MotionPhysicsEngine();
    engine.resetState();
  });

  it('should calculate Newtonian net force and friction accurately', () => {
    engine.setMode('Forces');
    engine.setMass(50);
    engine.setFriction(0.2); // max static friction = 0.2 * 50 * 9.81 = 98.1 N
    engine.setAppliedForce(50); // Less than static friction

    const t1 = engine.step(0.016);
    expect(t1.netForce).toBe(0);
    expect(t1.speed).toBe(0);

    engine.setAppliedForce(200); // Exceeds static friction
    const t2 = engine.step(0.016);
    expect(t2.netForce).toBeGreaterThan(0);
  });

  it('should conserve total energy in Skate Park mode', () => {
    engine.setMode('SkatePark');
    engine.setFriction(0); // Frictionless

    const t1 = engine.step(0.016);
    const initialTotal = t1.kineticEnergy + t1.potentialEnergy;

    for (let i = 0; i < 30; i++) {
      engine.step(0.016);
    }

    const t2 = engine.step(0.016);
    const endTotal = t2.kineticEnergy + t2.potentialEnergy;

    expect(Math.abs(initialTotal - endTotal)).toBeLessThan(50);
  });

  it('should update gravitational N-body orbits', () => {
    engine.setMode('Orbits');
    const initialDist = Math.sqrt(engine.planetPos.x ** 2 + engine.planetPos.y ** 2 + engine.planetPos.z ** 2);
    expect(initialDist).toBeGreaterThan(0);

    for (let i = 0; i < 10; i++) {
      engine.step(0.016);
    }

    const newDist = Math.sqrt(engine.planetPos.x ** 2 + engine.planetPos.y ** 2 + engine.planetPos.z ** 2);
    expect(newDist).toBeGreaterThan(0);
  });

  it('should oscillate in harmonic spring mode', () => {
    engine.setMode('PendulumSpring');
    const initialDisp = engine.springDisplacement;

    engine.step(0.1);
    expect(engine.springDisplacement).not.toBe(initialDisp);
  });
});
