export type QuantumSubMode = 'BuildAtom' | 'RutherfordScattering' | 'Photochemistry';

export interface QuantumTelemetry {
  timestamp: number;
  mode: QuantumSubMode;
  protons: number;
  neutrons: number;
  electrons: number;
  massNumber: number;
  netCharge: number;
  elementSymbol: string;
  isStable: boolean;
  scatteringAngleDeg: number;
}

export class QuantumPhysicsEngine {
  public mode: QuantumSubMode = 'BuildAtom';

  public protons: number = 6; // Carbon default
  public neutrons: number = 6;
  public electrons: number = 6;

  public alphaEnergyMeV: number = 5.0;
  public foilTargetZ: number = 79; // Gold (Au)

  public setMode(mode: QuantumSubMode) {
    this.mode = mode;
  }

  public getElementSymbol(): { symbol: string; name: string } {
    const table: Record<number, { symbol: string; name: string }> = {
      1: { symbol: 'H', name: 'Hydrogen' },
      2: { symbol: 'He', name: 'Helium' },
      3: { symbol: 'Li', name: 'Lithium' },
      4: { symbol: 'Be', name: 'Beryllium' },
      5: { symbol: 'B', name: 'Boron' },
      6: { symbol: 'C', name: 'Carbon' },
      7: { symbol: 'N', name: 'Nitrogen' },
      8: { symbol: 'O', name: 'Oxygen' },
      9: { symbol: 'F', name: 'Fluorine' },
      10: { symbol: 'Ne', name: 'Neon' }
    };
    return table[this.protons] || { symbol: 'X', name: 'Unknown' };
  }

  public isNucleusStable(): boolean {
    if (this.protons === 1) return this.neutrons <= 2;
    const ratio = this.neutrons / Math.max(1, this.protons);
    return ratio >= 0.8 && ratio <= 1.5;
  }

  public computeRutherfordDeflection(impactParamFm: number): number {
    // b = (z * Z * e^2) / (4 * pi * eps0 * m * v^2 * tan(theta / 2))
    const z = 2; // Alpha particle charge
    const k = 14.4; // MeV * fm
    const tanHalfTheta = (z * this.foilTargetZ * k) / (2 * this.alphaEnergyMeV * Math.max(0.5, impactParamFm));
    const thetaRad = 2 * Math.atan(tanHalfTheta);
    return (thetaRad * 180) / Math.PI;
  }

  public step(_dt: number = 0.016): QuantumTelemetry {
    const { symbol } = this.getElementSymbol();
    return {
      timestamp: Date.now(),
      mode: this.mode,
      protons: this.protons,
      neutrons: this.neutrons,
      electrons: this.electrons,
      massNumber: this.protons + this.neutrons,
      netCharge: this.protons - this.electrons,
      elementSymbol: symbol,
      isStable: this.isNucleusStable(),
      scatteringAngleDeg: parseFloat(this.computeRutherfordDeflection(2.0).toFixed(1))
    };
  }
}
