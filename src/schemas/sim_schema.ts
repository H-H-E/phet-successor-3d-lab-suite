export interface SimulationMetadata {
  id: string;
  title: string;
  subtitle: string;
  domain: 'Thermal' | 'Mechanics' | 'Electromagnetism' | 'Waves' | 'Quantum';
  targetGradeLevel: string[];
  version: string;
}

export interface PedagogicalGoal {
  learningObjectives: string[];
  prerequisiteConcepts: string[];
  addressedMisconceptions: string[];
}

export interface SimVariable {
  id: string;
  name: string;
  symbol: string;
  unit: string;
  min: number;
  max: number;
  default: number;
  step: number;
  description: string;
}

export interface ParticleSpecies {
  id: string;
  name: string;
  formula: string;
  mass: number; // in atomic mass units (u)
  sigma: number; // Lennard-Jones collision diameter (Angstroms)
  epsilon: number; // Lennard-Jones potential depth (kJ/mol)
  color: string;
  triplePointTemp: number; // Kelvin
  criticalPointTemp: number; // Kelvin
}

export interface GuidedTask {
  id: string;
  title: string;
  prompt: string;
  targetVariable: string;
  targetCondition: 'gte' | 'lte' | 'eq' | 'phase_is';
  targetValue: number | string;
  hint: string;
  explanation: string;
  completed: boolean;
}

export interface SimulationConfig {
  metadata: SimulationMetadata;
  pedagogy: PedagogicalGoal;
  variables: SimVariable[];
  species: ParticleSpecies[];
  tasks: GuidedTask[];
}
