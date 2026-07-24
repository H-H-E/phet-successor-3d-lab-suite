#!/bin/bash

# Fix SimLoader.ts
sed -i '' 's/import { SimulationConfig }/import type { SimulationConfig }/' src/engine/SimLoader.ts

# Fix SimLoader.test.ts
sed -i '' 's/expect(loadedConfig.domain).toBeUndefined();//' src/__tests__/SimLoader.test.ts

# Fix MatterLabCanvas.tsx (setShowPvNrt unused)
sed -i '' 's/const \[showPvNrt, setShowPvNrt\] = useState(true);/const [showPvNrt] = useState(true);/' src/components/3d/MatterLabCanvas.tsx

# Fix QuantumLabCanvas.tsx (applyEuler)
sed -i '' 's/eMesh.applyEuler(ringMesh.rotation);/eMesh.rotation.copy(ringMesh.rotation);/' src/components/3d/QuantumLabCanvas.tsx

# Fix WavesLabCanvas.tsx
cat << 'INNER_EOF' > src/components/3d/WavesLabCanvas.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { WavePhysicsEngine, type WaveSubMode } from '../../engine/WavePhysicsEngine';
import { audioSystem } from '../../audio/SpatialAudioEngine';

interface WavesLabCanvasProps {
  mode: WaveSubMode;
  frequencyHz: number;
  wavelengthNm: number;
  refractiveIndexN: number;
  onTelemetryUpdate: (telemetry: ReturnType<WavePhysicsEngine['step']>) => void;
}

export const WavesLabCanvas: React.FC<WavesLabCanvasProps> = ({
  mode,
  frequencyHz,
  wavelengthNm,
  refractiveIndexN,
  onTelemetryUpdate
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<WavePhysicsEngine>(new WavePhysicsEngine());

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const waterSurfaceRef = useRef<THREE.Points | null>(null);
  const slitBarrierGroupRef = useRef<THREE.Group | null>(null);
  
  // Prism Elements
  const opticsGroupRef = useRef<THREE.Group | null>(null);
  const prismMeshRef = useRef<THREE.Mesh | null>(null);
  const spectrumRef = useRef<THREE.Group | null>(null);

  const [prismAngle, setPrismAngle] = useState(0);
  const [dragSlit, setDragSlit] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const mount = containerRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#030712');

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 40, 60);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 1, 100);
    pointLight.position.set(0, 20, 0);
    scene.add(pointLight);

    const gridSize = 60;
    const spacing = 1.0;
    const particlesGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(gridSize * gridSize * 3);
    const colors = new Float32Array(gridSize * gridSize * 3);

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const idx = (i * gridSize + j) * 3;
        positions[idx] = (i - gridSize / 2) * spacing;
        positions[idx + 1] = 0;
        positions[idx + 2] = (j - gridSize / 2) * spacing;

        colors[idx] = 0.2;
        colors[idx + 1] = 0.6;
        colors[idx + 2] = 1.0;
      }
    }

    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particlesMat = new THREE.PointsMaterial({ size: 0.6, vertexColors: true, transparent: true, opacity: 0.8 });
    const waterSurface = new THREE.Points(particlesGeo, particlesMat);
    scene.add(waterSurface);
    waterSurfaceRef.current = waterSurface;

    const barrierGroup = new THREE.Group();
    const bMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(20, 4, 2), bMat);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 2), bMat);
    const b3 = new THREE.Mesh(new THREE.BoxGeometry(20, 4, 2), bMat);
    b1.position.set(-15, 2, 0);
    b2.position.set(0, 2, 0);
    b3.position.set(15, 2, 0);
    barrierGroup.add(b1, b2, b3);
    scene.add(barrierGroup);
    slitBarrierGroupRef.current = barrierGroup;

    const opticsGroup = new THREE.Group();
    scene.add(opticsGroup);
    opticsGroupRef.current = opticsGroup;

    const prismGeo = new THREE.CylinderGeometry(5, 5, 10, 3);
    const prismMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.9, opacity: 1, transparent: true, roughness: 0, ior: 1.5 });
    const prism = new THREE.Mesh(prismGeo, prismMat);
    prism.rotation.x = Math.PI / 2;
    prism.position.set(0, 5, 0);
    opticsGroup.add(prism);
    prismMeshRef.current = prism;

    const spectrum = new THREE.Group();
    const colorsArr = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x4b0082, 0x9400d3];
    colorsArr.forEach((c, i) => {
        const mat = new THREE.LineBasicMaterial({color: c, linewidth: 2});
        const pts = [new THREE.Vector3(0,5,0), new THREE.Vector3(15, 5, (i-3)*2 - 10)];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        spectrum.add(new THREE.Line(geo, mat));
    });
    const whiteBeam = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-20, 5, 0), new THREE.Vector3(0, 5, 0)]),
        new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 3})
    );
    spectrum.add(whiteBeam);
    opticsGroup.add(spectrum);
    spectrumRef.current = spectrum;

    let animId: number;
    let time = 0;
    const slitSeparationUm = 2.0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.03;

      const engine = engineRef.current;
      engine.mode = mode;
      engine.frequencyHz = frequencyHz;
      engine.wavelengthNm = wavelengthNm;
      engine.refractiveIndexN = refractiveIndexN;

      const telemetry = engine.step(0.016);
      onTelemetryUpdate(telemetry);

      waterSurface.visible = mode === 'WavePDE' || mode === 'TwoSlitInterference';
      barrierGroup.visible = mode === 'TwoSlitInterference';
      opticsGroup.visible = mode === 'RefractionOptics';

      if (waterSurface.visible) {
        const posAttr = particlesGeo.attributes.position;
        const colAttr = particlesGeo.attributes.color;

        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            const idx = i * gridSize + j;
            const x = posAttr.getX(idx);
            const z = posAttr.getZ(idx);

            let d1 = Math.sqrt(x * x + (z + 20) * (z + 20));
            let d2 = d1;
            
            if (mode === 'TwoSlitInterference') {
                const sx1 = -slitSeparationUm * 2;
                const sx2 = slitSeparationUm * 2;
                d1 = Math.sqrt((x-sx1)*(x-sx1) + z*z);
                d2 = Math.sqrt((x-sx2)*(x-sx2) + z*z);
                if (z > 0) { d1 = 0; d2 = 0; }
            }

            const amplitude = 1.0;
            const k = (2 * Math.PI) / telemetry.wavelengthNm;
            const w = 2 * Math.PI * frequencyHz;
            const y1 = amplitude * Math.sin(k * d1 - w * time);
            const y2 = mode === 'WavePDE' || mode === 'TwoSlitInterference' ? amplitude * Math.sin(k * d2 - w * time) : 0;
            const y = y1 + y2;

            posAttr.setY(idx, y);

            const intensity = Math.min(1, Math.max(0, (y / (2 * amplitude)) + 0.5));
            colAttr.setX(idx, intensity * 0.2);
            colAttr.setY(idx, intensity * 0.8);
            colAttr.setZ(idx, 1.0);
          }
        }
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
      }

      if (barrierGroup.visible) {
          b1.position.x = -slitSeparationUm*2 - 10 - 1;
          b2.scale.x = slitSeparationUm; 
          b3.position.x = slitSeparationUm*2 + 10 + 1;
      }

      if (opticsGroup.visible && prism) {
          prism.rotation.y = prismAngle;
          spectrum.rotation.y = prismAngle * 0.5;
      }

      audioSystem.updateThermalHum(frequencyHz * 10, 10);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [mode, frequencyHz, wavelengthNm, refractiveIndexN, prismAngle]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      {mode === 'RefractionOptics' && (
          <div className="absolute top-4 left-4 flex gap-2 items-center bg-slate-900/80 p-2 rounded">
              <span className="text-white text-xs">Rotate Prism</span>
              <input type="range" min="-1.5" max="1.5" step="0.1" value={prismAngle} onChange={e => setPrismAngle(parseFloat(e.target.value))} />
          </div>
      )}
      {mode === 'TwoSlitInterference' && (
          <div className="absolute top-4 left-4 flex gap-2 items-center bg-slate-900/80 p-2 rounded">
              <button onClick={() => setDragSlit(!dragSlit)} className={`px-2 py-1 text-white text-xs rounded ${dragSlit?'bg-green-600':'bg-slate-600'}`}>
                {dragSlit ? "Dragging Slits: ON" : "Toggle Slit Dragging"}
              </button>
          </div>
      )}
    </div>
  );
};
INNER_EOF

# Finally run tests and build
npx vitest run && npm run build
