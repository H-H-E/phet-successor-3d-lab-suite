import { describe, it, expect, beforeEach } from 'vitest';
import { QuantumPhysicsEngine } from '../engine/QuantumPhysicsEngine';

describe('QuantumPhysicsEngine Subatomic Physics', () => {
  let engine: QuantumPhysicsEngine;

  beforeEach(() => {
    engine = new QuantumPhysicsEngine();
  });

  it('should identify chemical element symbols correctly', () => {
    engine.protons = 6;
    expect(engine.getElementSymbol().symbol).toBe('C');

    engine.protons = 1;
    expect(engine.getElementSymbol().symbol).toBe('H');
  });

  it('should classify nuclear stability for isotopes', () => {
    engine.protons = 6;
    engine.neutrons = 6;
    expect(engine.isNucleusStable()).toBe(true);

    engine.neutrons = 20; // Unstable ratio
    expect(engine.isNucleusStable()).toBe(false);
  });

  it('should compute Rutherford Coulomb deflection angle', () => {
    const angle = engine.computeRutherfordDeflection(2.0);
    expect(angle).toBeGreaterThan(0);
  });
});
