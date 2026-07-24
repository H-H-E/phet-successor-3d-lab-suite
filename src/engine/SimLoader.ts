import type { SimulationConfig } from '../schemas/sim_schema';

export class SimLoader {
  static load(configSource: string | Record<string, any>): SimulationConfig {
    let raw: any;
    if (typeof configSource === 'string') {
      try {
        raw = JSON.parse(configSource);
      } catch {
        throw new Error('Failed to parse simulation config JSON.');
      }
    } else {
      raw = configSource;
    }

    // Perform basic validation
    if (!raw || typeof raw !== 'object') {
      throw new Error('Simulation config must be an object.');
    }
    if (!raw.metadata || !raw.metadata.id || !raw.metadata.domain) {
      throw new Error('Simulation config missing required metadata.');
    }
    if (!raw.pedagogy || !Array.isArray(raw.pedagogy.learningObjectives)) {
      throw new Error('Simulation config missing required pedagogy goals.');
    }
    if (!Array.isArray(raw.variables)) {
      throw new Error('Simulation config missing variables array.');
    }
    if (!Array.isArray(raw.species)) {
      throw new Error('Simulation config missing species array.');
    }
    if (!Array.isArray(raw.tasks)) {
      throw new Error('Simulation config missing tasks array.');
    }

    return raw as SimulationConfig;
  }
}
