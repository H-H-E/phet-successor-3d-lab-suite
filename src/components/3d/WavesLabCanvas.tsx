import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { WavePhysicsEngine } from '../../engine/WavePhysicsEngine';
import type { WaveSubMode } from '../../engine/WavePhysicsEngine';

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

  const waveMeshRef = useRef<THREE.Mesh | null>(null);
  const laserBeamRef = useRef<THREE.Line | null>(null);
  const refractedBeamRef = useRef<THREE.Line | null>(null);
  const prismMeshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const mount = containerRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#050914');

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 25, 45);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 40, 20);
    scene.add(dirLight);

    // 1. 3D Wave Surface Plane Mesh
    const gridSegments = 60;
    const waveGeo = new THREE.PlaneGeometry(40, 40, gridSegments, gridSegments);
    waveGeo.rotateX(-Math.PI / 2);
    const waveMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      wireframe: true,
      side: THREE.DoubleSide
    });
    const waveMesh = new THREE.Mesh(waveGeo, waveMat);
    scene.add(waveMesh);
    waveMeshRef.current = waveMesh;

    // 2. Optics Prism Mesh
    const prismGeo = new THREE.BoxGeometry(10, 15, 10);
    const prismMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 2
    });
    const prismMesh = new THREE.Mesh(prismGeo, prismMat);
    prismMesh.position.set(0, 7.5, 0);
    scene.add(prismMesh);
    prismMeshRef.current = prismMesh;

    // Laser Beams
    const laserMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 4 });
    const laserBeam = new THREE.Line(new THREE.BufferGeometry(), laserMat);
    scene.add(laserBeam);
    laserBeamRef.current = laserBeam;

    const refractedBeam = new THREE.Line(new THREE.BufferGeometry(), laserMat);
    scene.add(refractedBeam);
    refractedBeamRef.current = refractedBeam;

    // Render Loop
    let animId: number;
    let time = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.03 * frequencyHz;

      const engine = engineRef.current;
      engine.frequencyHz = frequencyHz;
      engine.wavelengthNm = wavelengthNm;
      engine.refractiveIndexN = refractiveIndexN;

      const telemetry = engine.step(0.016);
      onTelemetryUpdate(telemetry);

      waveMesh.visible = mode !== 'RefractionOptics';
      prismMesh.visible = mode === 'RefractionOptics';
      laserBeam.visible = mode === 'RefractionOptics';
      refractedBeam.visible = mode === 'RefractionOptics';

      if (mode !== 'RefractionOptics') {
        // Displace Wave Surface vertices dynamically
        const posAttr = waveGeo.attributes.position as THREE.BufferAttribute;
        const count = posAttr.count;
        const k = 0.5;

        for (let i = 0; i < count; i++) {
          const x = posAttr.getX(i);
          const z = posAttr.getZ(i);
          const r = Math.sqrt(x * x + z * z);

          let height = 0;
          if (mode === 'WavePDE') {
            height = Math.sin(k * r - time) * 2;
          } else {
            // Two-slit interference superposition
            const r1 = Math.sqrt((x + 5) * (x + 5) + z * z);
            const r2 = Math.sqrt((x - 5) * (x - 5) + z * z);
            height = Math.sin(k * r1 - time) + Math.sin(k * r2 - time);
          }

          posAttr.setY(i, height);
        }
        posAttr.needsUpdate = true;
      } else {
        // Compute Snell's Law Laser Beam bending
        const incidentAngle = 45;
        const refrAngle = engine.computeRefractionAngle(incidentAngle);

        const p1 = new THREE.Vector3(-25, 7.5, 0);
        const p2 = new THREE.Vector3(-5, 7.5, 0);
        laserBeam.geometry.setFromPoints([p1, p2]);

        const rad2 = (refrAngle * Math.PI) / 180;
        const p3 = new THREE.Vector3(25, 7.5 + 20 * Math.tan(rad2), 0);
        refractedBeam.geometry.setFromPoints([p2, p3]);
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
