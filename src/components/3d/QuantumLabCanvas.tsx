import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { QuantumPhysicsEngine } from '../../engine/QuantumPhysicsEngine';
import type { QuantumSubMode } from '../../engine/QuantumPhysicsEngine';

interface QuantumLabCanvasProps {
  mode: QuantumSubMode;
  protons: number;
  neutrons: number;
  electrons: number;
  alphaEnergyMeV: number;
  onTelemetryUpdate: (telemetry: ReturnType<QuantumPhysicsEngine['step']>) => void;
}

export const QuantumLabCanvas: React.FC<QuantumLabCanvasProps> = ({
  mode,
  protons,
  neutrons,
  electrons,
  alphaEnergyMeV,
  onTelemetryUpdate
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<QuantumPhysicsEngine>(new QuantumPhysicsEngine());

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const nucleusGroupRef = useRef<THREE.Group | null>(null);
  const orbitalRingsGroupRef = useRef<THREE.Group | null>(null);
  const alphaBeamRef = useRef<THREE.Line | null>(null);
  const goldFoilRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const mount = containerRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#070913');

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 15, 45);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(15, 30, 20);
    scene.add(dirLight);

    const gridHelper = new THREE.GridHelper(100, 20, 0x1e293b, 0x0f172a);
    scene.add(gridHelper);

    // 1. Nucleus & Orbitals Group
    const nucleusGroup = new THREE.Group();
    scene.add(nucleusGroup);
    nucleusGroupRef.current = nucleusGroup;

    const orbitalRingsGroup = new THREE.Group();
    scene.add(orbitalRingsGroup);
    orbitalRingsGroupRef.current = orbitalRingsGroup;

    // 2. Rutherford Gold Foil & Alpha Beam
    const foilGeo = new THREE.BoxGeometry(0.5, 20, 20);
    const foilMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.1 });
    const goldFoil = new THREE.Mesh(foilGeo, foilMat);
    scene.add(goldFoil);
    goldFoilRef.current = goldFoil;

    const beamMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 3 });
    const alphaBeam = new THREE.Line(new THREE.BufferGeometry(), beamMat);
    scene.add(alphaBeam);
    alphaBeamRef.current = alphaBeam;

    // Render Loop
    let animId: number;
    let angleTime = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      angleTime += 0.03;

      const engine = engineRef.current;
      engine.protons = protons;
      engine.neutrons = neutrons;
      engine.electrons = electrons;
      engine.alphaEnergyMeV = alphaEnergyMeV;

      const telemetry = engine.step(0.016);
      onTelemetryUpdate(telemetry);

      nucleusGroup.visible = mode === 'BuildAtom';
      orbitalRingsGroup.visible = mode === 'BuildAtom';

      goldFoil.visible = mode === 'RutherfordScattering';
      alphaBeam.visible = mode === 'RutherfordScattering';

      if (mode === 'BuildAtom') {
        nucleusGroup.clear();

        const pGeo = new THREE.SphereGeometry(0.8, 16, 16);
        const pMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
        const nMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 });

        for (let i = 0; i < protons; i++) {
          const pMesh = new THREE.Mesh(pGeo, pMat);
          const r = Math.cbrt(i) * 1.2;
          pMesh.position.set(
            Math.sin(i * 2.4) * r,
            Math.cos(i * 1.8) * r,
            Math.sin(i * 3.1) * r
          );
          nucleusGroup.add(pMesh);
        }

        for (let i = 0; i < neutrons; i++) {
          const nMesh = new THREE.Mesh(pGeo, nMat);
          const r = Math.cbrt(i + 1) * 1.2;
          nMesh.position.set(
            Math.cos(i * 2.1) * r,
            Math.sin(i * 1.4) * r,
            Math.cos(i * 2.9) * r
          );
          nucleusGroup.add(nMesh);
        }

        orbitalRingsGroup.clear();
        
        // Bohr 2n^2 shells
        let remainingElectrons = electrons;
        let n = 1;
        while (remainingElectrons > 0 && n <= 7) {
            const capacity = 2 * n * n;
            const shellElectrons = Math.min(capacity, remainingElectrons);
            const radius = 4 * n;

            // Probability Cloud
            const cloudGeo = new THREE.SphereGeometry(radius, 32, 32);
            const cloudMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.05, side: THREE.DoubleSide });
            orbitalRingsGroup.add(new THREE.Mesh(cloudGeo, cloudMat));

            // Orbital Ring
            const ringGeo = new THREE.RingGeometry(radius - 0.1, radius + 0.1, 64);
            ringGeo.rotateX(Math.PI / 2);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            
            // Randomize ring rotation for 3D look
            ringMesh.rotation.x = Math.PI / 2 + (n * 0.2);
            ringMesh.rotation.y = n * 0.5;
            orbitalRingsGroup.add(ringMesh);

            // Electrons
            const eGeo = new THREE.SphereGeometry(0.6, 16, 16);
            const eMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

            for (let i = 0; i < shellElectrons; i++) {
                const eMesh = new THREE.Mesh(eGeo, eMat);
                const theta = angleTime / n + (i * (2 * Math.PI)) / shellElectrons;
                eMesh.position.set(Math.cos(theta) * radius, 0, Math.sin(theta) * radius);
                // Apply same rotation as ring
                eMesh.position.applyEuler(ringMesh.rotation);
                orbitalRingsGroup.add(eMesh);
            }

            remainingElectrons -= shellElectrons;
            n++;
        }
      } else {
        const deflAngle = engine.computeRutherfordDeflection(2.0);
        const rad = (deflAngle * Math.PI) / 180;

        const p1 = new THREE.Vector3(-25, 0, 0);
        const p2 = new THREE.Vector3(0, 0, 0);
        const p3 = new THREE.Vector3(20 * Math.cos(rad), 20 * Math.sin(rad), 0);

        alphaBeam.geometry.setFromPoints([p1, p2, p3]);
      }

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
  }, [mode]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};
