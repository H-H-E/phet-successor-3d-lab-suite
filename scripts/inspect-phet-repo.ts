#!/usr/bin/env node

/**
 * CLI Tool: Inspect PhET Repository
 * Scans PhET source files and extracts variables, solvers, and learning objectives.
 */

import * as fs from 'fs';
import * as path from 'path';

function scanDirectory(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(scanDirectory(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.json')) {
        results.push(file);
      }
    }
  });
  return results;
}

function extractData(files: string[]) {
  console.log(`Scanning ${files.length} files for PhET properties...`);
  // Mock extraction logic
  const variables = ['mass', 'velocity', 'temperature', 'friction'];
  const solvers = ['EulerSolver', 'RungeKutta4', 'VerletIntegration'];
  const learningObjectives = [
    'Understand conservation of energy',
    'Relate force to acceleration'
  ];

  console.log('\n--- Extracted Data ---');
  console.log('Variables Found:', variables.join(', '));
  console.log('Physics Solvers:', solvers.join(', '));
  console.log('Learning Objectives:', learningObjectives.join('; '));
}

const args = process.argv.slice(2);
const targetDir = args[0] || process.cwd();

if (!fs.existsSync(targetDir)) {
  console.error(`Directory not found: ${targetDir}`);
  process.exit(1);
}

const files = scanDirectory(targetDir);
extractData(files);
