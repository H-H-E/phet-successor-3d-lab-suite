import { describe, it, expect, beforeEach } from 'vitest';
import { CircuitPhysicsEngine } from '../engine/CircuitPhysicsEngine';

describe('CircuitPhysicsEngine 3D Electromagnetism', () => {
  let engine: CircuitPhysicsEngine;

  beforeEach(() => {
    engine = new CircuitPhysicsEngine();
  });

  it('should calculate Ohm Law current and power accurately', () => {
    engine.voltageSource = 12;
    engine.resistanceOhms = 4;
    engine.isSwitchClosed = true;

    const telemetry = engine.step();
    expect(telemetry.currentAmps).toBe(3.0);
    expect(telemetry.powerWatts).toBe(36.0);
  });

  it('should set current to 0 when switch is open', () => {
    engine.voltageSource = 12;
    engine.resistanceOhms = 4;
    engine.isSwitchClosed = false;

    const telemetry = engine.step();
    expect(telemetry.currentAmps).toBe(0);
    expect(telemetry.powerWatts).toBe(0);
  });

  it('should compute Coulomb electric field vector at spatial coordinates', () => {
    const eField = engine.computeElectricFieldAt(0, 0, 0);
    expect(eField.mag).toBeGreaterThan(0);
  });
});
