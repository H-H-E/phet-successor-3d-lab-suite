export type WaveSubMode = 'WavePDE' | 'TwoSlitInterference' | 'RefractionOptics';

export interface WaveTelemetry {
  timestamp: number;
  mode: WaveSubMode;
  frequencyHz: number;
  wavelengthNm: number;
  refractiveIndex: number;
  diffractionAngleDeg: number;
}

export class WavePhysicsEngine {
  public mode: WaveSubMode = 'WavePDE';

  public frequencyHz: number = 2.0;
  public amplitude: number = 1.0;
  public wavelengthNm: number = 500; // Visible light / sound scale
  public slitSeparationUm: number = 2.0;
  public refractiveIndexN: number = 1.5; // Glass

  public setMode(mode: WaveSubMode) {
    this.mode = mode;
  }

  public computeDiffractionAngle(order: number = 1): number {
    // d * sin(theta) = m * lambda
    const lambdaUm = this.wavelengthNm * 1e-3;
    const sinTheta = (order * lambdaUm) / Math.max(0.1, this.slitSeparationUm);
    if (Math.abs(sinTheta) > 1) return 90;
    return (Math.asin(sinTheta) * 180) / Math.PI;
  }

  public computeRefractionAngle(incidentAngleDeg: number): number {
    // Snell's Law: n1 * sin(theta1) = n2 * sin(theta2)
    const rad1 = (incidentAngleDeg * Math.PI) / 180;
    const sinTheta2 = (1.0 * Math.sin(rad1)) / Math.max(1.0, this.refractiveIndexN);
    return (Math.asin(sinTheta2) * 180) / Math.PI;
  }

  public step(_dt: number = 0.016): WaveTelemetry {
    return {
      timestamp: Date.now(),
      mode: this.mode,
      frequencyHz: this.frequencyHz,
      wavelengthNm: this.wavelengthNm,
      refractiveIndex: this.refractiveIndexN,
      diffractionAngleDeg: parseFloat(this.computeDiffractionAngle(1).toFixed(1))
    };
  }
}
