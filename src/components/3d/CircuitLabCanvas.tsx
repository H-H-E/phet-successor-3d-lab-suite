import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CircuitPhysicsEngine } from '../../engine/CircuitPhysicsEngine';
import type { CircuitSubMode } from '../../engine/CircuitPhysicsEngine';
import { audioSystem } from '../../audio/SpatialAudioEngine';

interface CircuitLabCanvasProps {
  mode: CircuitSubMode;
  voltageSource: number;
  resistanceOhms: number;
  isSwitchClosed: boolean;
  onTelemetryUpdate: (telemetry: ReturnType<CircuitPhysicsEngine['step']>) => void;
}

export const CircuitLabCanvas: React.FC<CircuitLabCanvasProps> = ({
  mode,
  voltageSource,
  resistanceOhms,
  isSwitchClosed,
  onTelemetryUpdate
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CircuitPhysicsEngine>(new CircuitPhysicsEngine());

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const chargesGroupRef = useRef<THREE.Group | null>(null);
  const fieldArrowsGroupRef = useRef<THREE.Group | null>(null);
  const circuitGroupRef = useRef<THREE.Group | null>(null);
  const bulbGlowMeshRef = useRef<THREE.Mesh | null>(null);
  const electronsMeshRef = useRef<THREE.InstancedMesh | null>(null);

  const electronProgressRef = useRef<number[]>([]);

  // Probes
  const [probePlaced, setProbePlaced] = useState(false);
  const voltmeterRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const mount = containerRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#0a0c16');

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 20, 50);
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

    // 1. Charges & Field Group
    const chargesGroup = new THREE.Group();
    scene.add(chargesGroup);
    chargesGroupRef.current = chargesGroup;

    const fieldArrowsGroup = new THREE.Group();
    scene.add(fieldArrowsGroup);
    fieldArrowsGroupRef.current = fieldArrowsGroup;

    // 2. 3D Circuit Breadboard Group
    const circuitGroup = new THREE.Group();
    scene.add(circuitGroup);
    circuitGroupRef.current = circuitGroup;

    // Wire Loop Mesh
    const points = [
      new THREE.Vector3(-15, 2, -10),
      new THREE.Vector3(15, 2, -10),
      new THREE.Vector3(15, 2, 10),
      new THREE.Vector3(-15, 2, 10),
      new THREE.Vector3(-15, 2, -10)
    ];
    const wireGeo = new THREE.BufferGeometry().setFromPoints(points);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 4 });
    const wireLine = new THREE.Line(wireGeo, wireMat);
    circuitGroup.add(wireLine);

    // Battery Cylinder
    const battGeo = new THREE.CylinderGeometry(1.5, 1.5, 4, 32);
    const battMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8 });
    const battMesh = new THREE.Mesh(battGeo, battMat);
    battMesh.rotation.z = Math.PI / 2;
    battMesh.position.set(-15, 2, 0);
    circuitGroup.add(battMesh);

    // Resistor / Lightbulb Mesh
    const bulbGeo = new THREE.SphereGeometry(2, 32, 32);
    const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, transparent: true, opacity: 0.8 });
    const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
    bulbMesh.position.set(15, 2, 0);
    circuitGroup.add(bulbMesh);
    bulbGlowMeshRef.current = bulbMesh;

    // Probes
    const vmGeo = new THREE.BoxGeometry(2, 2, 2);
    const vmMat = new THREE.MeshStandardMaterial({color: 0x00ff00});
    const vmM = new THREE.Mesh(vmGeo, vmMat);
    vmM.position.set(0, 5, 0);
    circuitGroup.add(vmM);
    voltmeterRef.current = vmM;

    // Moving Electrons Instanced Mesh
    const eGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const eMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const numElectrons = 30;
    const electronsMesh = new THREE.InstancedMesh(eGeo, eMat, numElectrons);
    circuitGroup.add(electronsMesh);
    electronsMeshRef.current = electronsMesh;

    electronProgressRef.current = Array.from({ length: numElectrons }, (_, i) => i / numElectrons);

    // Render Loop
    let animId: number;
    const dummy = new THREE.Object3D();
    const curvePath = new THREE.CatmullRomCurve3(points, true);

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const engine = engineRef.current;
      engine.voltageSource = voltageSource;
      engine.resistanceOhms = resistanceOhms;
      engine.isSwitchClosed = isSwitchClosed;

      const telemetry = engine.step(0.016);
      onTelemetryUpdate(telemetry);

      chargesGroup.visible = mode === 'ChargesAndFields';
      fieldArrowsGroup.visible = mode === 'ChargesAndFields';
      circuitGroup.visible = mode !== 'ChargesAndFields';

      if (mode === 'ChargesAndFields') {
        chargesGroup.clear();
        fieldArrowsGroup.clear();

        for (const q of engine.charges) {
          const sphereGeo = new THREE.SphereGeometry(1.5, 32, 32);
          const sphereMat = new THREE.MeshStandardMaterial({
            color: q.charge > 0 ? 0xef4444 : 0x3b82f6,
            roughness: 0.2
          });
          const qMesh = new THREE.Mesh(sphereGeo, sphereMat);
          qMesh.position.set(q.x, q.y, q.z);
          chargesGroup.add(qMesh);
        }

        for (let x = -25; x <= 25; x += 10) {
          for (let z = -25; z <= 25; z += 10) {
            const eField = engine.computeElectricFieldAt(x, 2, z);
            if (eField.mag > 0.05) {
              const dir = new THREE.Vector3(eField.ex, 0, eField.ez).normalize();
              const arrow = new THREE.ArrowHelper(
                dir,
                new THREE.Vector3(x, 2, z),
                Math.min(4, eField.mag * 0.8),
                0x38bdf8,
                0.8,
                0.4
              );
              fieldArrowsGroup.add(arrow);
            }
          }
        }
      } else {
        const speed = isSwitchClosed ? telemetry.currentAmps * 0.1 : 0;

        for (let i = 0; i < numElectrons; i++) {
          electronProgressRef.current[i] = (electronProgressRef.current[i] + speed * 0.016) % 1;
          const pos = curvePath.getPointAt(electronProgressRef.current[i]);
          dummy.position.copy(pos);
          dummy.updateMatrix();
          electronsMesh.setMatrixAt(i, dummy.matrix);
        }
        electronsMesh.instanceMatrix.needsUpdate = true;

        if (bulbGlowMeshRef.current) {
          const powerRatio = Math.min(1, telemetry.powerWatts / 20);
          (bulbGlowMeshRef.current.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0xfacc15);
          (bulbGlowMeshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = powerRatio * 2;
        }

        if (isSwitchClosed && telemetry.currentAmps > 0) {
          audioSystem.updateThermalHum(telemetry.currentAmps * 100, 20);
        }
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

  const handleAddCharge = (type: number) => {
    engineRef.current.addCharge(Math.random() * 20 - 10, 5, Math.random() * 20 - 10, type);
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      {mode === 'ChargesAndFields' && (
        <div className="absolute top-4 left-4 flex gap-2">
            <button onClick={() => handleAddCharge(1)} className="px-3 py-1 bg-red-600 text-white rounded shadow text-xs font-bold">+ Positive Charge</button>
            <button onClick={() => handleAddCharge(-1)} className="px-3 py-1 bg-blue-600 text-white rounded shadow text-xs font-bold">- Negative Charge</button>
            <button onClick={() => engineRef.current.clearCharges()} className="px-3 py-1 bg-slate-600 text-white rounded shadow text-xs font-bold">Clear All</button>
        </div>
      )}
      {mode !== 'ChargesAndFields' && (
        <div className="absolute top-4 left-4 flex gap-2">
            <button onClick={() => setProbePlaced(!probePlaced)} className={`px-3 py-1 text-white rounded shadow text-xs font-bold ${probePlaced?'bg-green-600':'bg-slate-600'}`}>
                {probePlaced ? "Voltmeter Connected!" : "Snap Voltmeter Probes"}
            </button>
        </div>
      )}
    </div>
  );
};
