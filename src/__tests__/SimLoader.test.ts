import { describe, it, expect } from 'vitest';
import { SimLoader } from '../engine/SimLoader';

describe('SimLoader', () => {
  it('should parse a valid simulation config object', () => {
    const mockConfig = {
      metadata: {
        id: "test-lab",
        title: "Test Lab",
        subtitle: "A test lab",
        domain: "Mechanics",
        targetGradeLevel: ["High School"],
        version: "1.0.0"
      },
      pedagogy: {
        learningObjectives: ["Test objective"],
        prerequisiteConcepts: [],
        addressedMisconceptions: []
      },
      variables: [],
      species: [],
      tasks: []
    };

    const loadedConfig = SimLoader.load(mockConfig);
    expect(loadedConfig.metadata.id).toBe("test-lab");
    expect(loadedConfig.metadata.domain).toBe("Mechanics");
  });

  it('should parse a valid simulation config JSON string', () => {
    const jsonString = JSON.stringify({
      metadata: {
        id: "test-lab",
        title: "Test Lab",
        subtitle: "A test lab",
        domain: "Thermal",
        targetGradeLevel: ["High School"],
        version: "1.0.0"
      },
      pedagogy: {
        learningObjectives: [],
        prerequisiteConcepts: [],
        addressedMisconceptions: []
      },
      variables: [],
      species: [],
      tasks: []
    });

    const loadedConfig = SimLoader.load(jsonString);
    expect(loadedConfig.metadata.domain).toBe("Thermal");
  });

  it('should throw an error for invalid JSON string', () => {
    expect(() => {
      SimLoader.load("{ invalid json }");
    }).toThrow('Failed to parse simulation config JSON.');
  });

  it('should throw an error if metadata is missing', () => {
    const invalidConfig = {
      pedagogy: { learningObjectives: [] },
      variables: [],
      species: [],
      tasks: []
    };
    expect(() => {
      SimLoader.load(invalidConfig as any);
    }).toThrow('Simulation config missing required metadata.');
  });
});
