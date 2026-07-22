export type CircuitSubMode = 'ChargesAndFields' | 'ElectronDrift' | 'Breadboard';

export interface PointCharge {
  id: number;
  x: number;
  y: number;
  z: number;
  charge: number; // in NanoCoulombs (e.g. +1 or -1)
}

export interface CircuitElement {
  id: string;
  type: 'Battery' | 'Resistor' | 'LightBulb' | 'Switch';
  value: number; // Volts for battery, Ohms for resistor
  nodeA: number;
  nodeB: number;
}

export interface CircuitTelemetry {
  timestamp: number;
  mode: CircuitSubMode;
  currentAmps: number;
  voltageVolts: number;
  totalResistanceOhms: number;
  powerWatts: number;
  electricFieldMax: number;
}

export class CircuitPhysicsEngine {
  public mode: CircuitSubMode = 'ChargesAndFields';

  // Mode 1: Charges & Fields
  public charges: PointCharge[] = [
    { id: 1, x: -10, y: 5, z: 0, charge: 1 },
    { id: 2, x: 10, y: 5, z: 0, charge: -1 }
  ];

  // Mode 2 & 3: Circuit Topology
  public voltageSource: number = 9; // Volts
  public resistanceOhms: number = 10; // Ohms
  public isSwitchClosed: boolean = true;

  public currentAmps: number = 0.9;
  public powerWatts: number = 8.1;

  public setMode(mode: CircuitSubMode) {
    this.mode = mode;
  }

  public addCharge(x: number, y: number, z: number, charge: number) {
    this.charges.push({
      id: Date.now() + Math.random(),
      x,
      y,
      z,
      charge
    });
  }

  public clearCharges() {
    this.charges = [];
  }

  public computeElectricFieldAt(x: number, y: number, z: number): { ex: number; ey: number; ez: number; mag: number } {
    const k = 8.99e1; // Scaled Coulomb constant
    let ex = 0;
    let ey = 0;
    let ez = 0;

    for (const q of this.charges) {
      const dx = x - q.x;
      const dy = y - q.y;
      const dz = z - q.z;
      const r2 = dx * dx + dy * dy + dz * dz;
      const r = Math.sqrt(r2);

      if (r > 0.5) {
        const f = (k * q.charge) / r2;
        ex += f * (dx / r);
        ey += f * (dy / r);
        ez += f * (dz / r);
      }
    }

    const mag = Math.sqrt(ex * ex + ey * ey + ez * ez);
    return { ex, ey, ez, mag };
  }

  public step(_dt: number = 0.016): CircuitTelemetry {
    if (this.isSwitchClosed && this.resistanceOhms > 0) {
      // Ohm's Law: I = V / R
      this.currentAmps = this.voltageSource / this.resistanceOhms;
      // Power: P = V * I
      this.powerWatts = this.voltageSource * this.currentAmps;
    } else {
      this.currentAmps = 0;
      this.powerWatts = 0;
    }

    return {
      timestamp: Date.now(),
      mode: this.mode,
      currentAmps: parseFloat(this.currentAmps.toFixed(2)),
      voltageVolts: this.voltageSource,
      totalResistanceOhms: this.resistanceOhms,
      powerWatts: parseFloat(this.powerWatts.toFixed(2)),
      electricFieldMax: parseFloat((this.charges.length * 5).toFixed(1))
    };
  }
}
