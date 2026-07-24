import { create } from 'zustand';
import type { ParticleSpecies, GuidedTask } from '../schemas/sim_schema';
import type { PhaseState, SimTelemetrySnapshot } from '../engine/Types';

export type LabMode = 'PhaseStates' | 'GasLaws' | 'Diffusion';

export const SPECIES_PRESETS: ParticleSpecies[] = [
  {
    id: 'neon',
    name: 'Neon (Ne)',
    formula: 'Ne',
    mass: 20.18,
    sigma: 2.75,
    epsilon: 0.31,
    color: '#ff5533',
    triplePointTemp: 24,
    criticalPointTemp: 44
  },
  {
    id: 'argon',
    name: 'Argon (Ar)',
    formula: 'Ar',
    mass: 39.95,
    sigma: 3.40,
    epsilon: 0.99,
    color: '#33ccff',
    triplePointTemp: 84,
    criticalPointTemp: 150
  },
  {
    id: 'oxygen',
    name: 'Oxygen (O₂)',
    formula: 'O₂',
    mass: 32.00,
    sigma: 3.46,
    epsilon: 0.98,
    color: '#33ffaa',
    triplePointTemp: 54,
    criticalPointTemp: 154
  },
  {
    id: 'water',
    name: 'Water (H₂O)',
    formula: 'H₂O',
    mass: 18.02,
    sigma: 3.15,
    epsilon: 1.50,
    color: '#4477ff',
    triplePointTemp: 273,
    criticalPointTemp: 647
  }
];

export const INITIAL_TASKS: GuidedTask[] = [
  {
    id: 'task-1',
    title: 'Induce a Phase Change',
    prompt: 'Heat the container until Argon transitions from a Solid into a Gas (> 95 K).',
    targetVariable: 'temperatureK',
    targetCondition: 'gte',
    targetValue: 95,
    hint: 'Use the Heat / Cool slider at the bottom of the 3D container to add thermal energy.',
    explanation: 'Adding heat increases average particle kinetic energy, overcoming attractive intermolecular Lennard-Jones forces.',
    completed: false
  },
  {
    id: 'task-2',
    title: 'High Pressure Compression',
    prompt: 'Reduce the container volume or add particles until the pressure exceeds 3.5 atm.',
    targetVariable: 'pressureAtm',
    targetCondition: 'gte',
    targetValue: 3.5,
    hint: 'Drag the container side handles inward or pump more particles into the container.',
    explanation: 'According to Kinetic Molecular Theory, reducing volume increases particle wall collision frequency per unit area.',
    completed: false
  },
  {
    id: 'task-3',
    title: 'Cooling to Absolute Zero',
    prompt: 'Cool the container temperature down below 20 Kelvin.',
    targetVariable: 'temperatureK',
    targetCondition: 'lte',
    targetValue: 20,
    hint: 'Slide the heater/cooler bucket to "COOL".',
    explanation: 'Removing thermal energy slows particle velocity, causing molecules to settle into a tight lattice solid state.',
    completed: false
  }
];

interface SimStoreState {
  labMode: LabMode;
  setLabMode: (mode: LabMode) => void;
  species: ParticleSpecies;
  setSpecies: (species: ParticleSpecies) => void;

  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  speedMultiplier: number;
  setSpeedMultiplier: (speed: number) => void;

  temperatureK: number;
  setTemperatureK: (temp: number) => void;
  pressureAtm: number;
  phaseState: PhaseState;
  particleCount: number;

  containerWidth: number;
  containerHeight: number;
  containerDepth: number;
  setContainerDimensions: (w: number, h: number, d: number) => void;

  tasks: GuidedTask[];
  checkTaskCompletion: (tempK: number, pressAtm: number, phase: PhaseState) => void;

  telemetryHistory: SimTelemetrySnapshot[];
  addTelemetrySnapshot: (snapshot: SimTelemetrySnapshot) => void;
  clearTelemetry: () => void;

  isAudioMuted: boolean;
  toggleAudioMute: () => void;
  ariaAnnouncement: string;
  setAriaAnnouncement: (msg: string) => void;

  highContrastMode: boolean;
  toggleHighContrastMode: () => void;
  reducedMotion: boolean;
  toggleReducedMotion: () => void;
}

export const useSimStore = create<SimStoreState>((set, get) => ({
  labMode: 'PhaseStates',
  setLabMode: (labMode) => set({ labMode }),

  species: SPECIES_PRESETS[1],
  setSpecies: (species) => set({ species }),

  isPlaying: true,
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  speedMultiplier: 1.0,
  setSpeedMultiplier: (speedMultiplier) => set({ speedMultiplier }),

  temperatureK: 84,
  setTemperatureK: (temperatureK) => set({ temperatureK }),
  pressureAtm: 1.0,
  phaseState: 'Solid',
  particleCount: 120,

  containerWidth: 30,
  containerHeight: 35,
  containerDepth: 30,
  setContainerDimensions: (containerWidth, containerHeight, containerDepth) =>
    set({ containerWidth, containerHeight, containerDepth }),

  tasks: INITIAL_TASKS,
  checkTaskCompletion: (tempK, pressAtm, phase) => {
    const tasks = get().tasks;
    let updated = false;

    const newTasks = tasks.map((task) => {
      if (task.completed) return task;

      let isSuccess = false;
      if (task.targetVariable === 'temperatureK') {
        if (task.targetCondition === 'gte' && tempK >= (task.targetValue as number)) isSuccess = true;
        if (task.targetCondition === 'lte' && tempK <= (task.targetValue as number)) isSuccess = true;
      } else if (task.targetVariable === 'pressureAtm') {
        if (task.targetCondition === 'gte' && pressAtm >= (task.targetValue as number)) isSuccess = true;
      } else if (task.targetVariable === 'phaseState') {
        if (phase === task.targetValue) isSuccess = true;
      }

      if (isSuccess) {
        updated = true;
        return { ...task, completed: true };
      }
      return task;
    });

    if (updated) {
      set({ tasks: newTasks });
    }
  },

  telemetryHistory: [],
  addTelemetrySnapshot: (snapshot) =>
    set((state) => ({
      telemetryHistory: [...state.telemetryHistory.slice(-100), snapshot]
    })),
  clearTelemetry: () => set({ telemetryHistory: [] }),

  isAudioMuted: false,
  toggleAudioMute: () => set((state) => ({ isAudioMuted: !state.isAudioMuted })),
  ariaAnnouncement: '',
  setAriaAnnouncement: (msg) => set({ ariaAnnouncement: msg }),

  highContrastMode: false,
  toggleHighContrastMode: () => set((state) => ({ highContrastMode: !state.highContrastMode })),
  reducedMotion: false,
  toggleReducedMotion: () => set((state) => ({ reducedMotion: !state.reducedMotion }))
}));
