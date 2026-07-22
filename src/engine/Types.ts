export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  fx: number;
  fy: number;
  fz: number;
  speciesId: string;
  mass: number;
  radius: number;
  color: string;
}

export type PhaseState = 'Solid' | 'Liquid' | 'Gas' | 'Supercritical Plasma';

export interface SimTelemetrySnapshot {
  timestamp: number;
  temperatureK: number;
  pressureAtm: number;
  volumeNm3: number;
  particleCount: number;
  kineticEnergy: number;
  potentialEnergy: number;
  phaseState: PhaseState;
  leftCount?: number;
  rightCount?: number;
}
