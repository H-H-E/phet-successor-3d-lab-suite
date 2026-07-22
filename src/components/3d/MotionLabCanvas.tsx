import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { MotionPhysicsEngine } from '../../engine/MotionPhysicsEngine';
import type { MotionSubMode } from '../../engine/MotionPhysicsEngine';
import { audioSystem } from '../../audio/SpatialAudioEngine';

interface MotionLabCanvasProps {
  mode: MotionSubMode;
  appliedForce: number;
  frictionCoeff: number;
  massKg: number;
  onTelemetryUpdate: (telemetry: ReturnType<MotionPhysicsEngine['step']>) => void;
}

export const MotionLabCanvas: React.FC<MotionLabCanvasProps> = ({
  mode,
  appliedForce,
  frictionCoeff,
  massKg,
  onTelemetryUpdate
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MotionPhysicsEngine>(new MotionPhysicsEngine());

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const crateMeshRef = useRef<THREE.Mesh | null>(null);
  const appliedArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const frictionArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const netArrowRef = useRef<THREE.ArrowHelper | null>(null);

  const skaterMeshRef = useRef<THREE.Mesh | null>(null);
  const trackLineRef = useRef<THREE.Line | null>(null);

  const sunMeshRef = useRef<THREE.Mesh | null>(null);
  const planetMeshRef = useRef<THREE.Mesh | null>(null);
  const orbitTrailRef = useRef<THREE.Line | null>(null);
  const orbitPointsRef = useRef<THREE.Vector3[]>([]);

  const springBobRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const mount = containerRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#090d16');

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 15, 45);
    camera.lookAt(0, 5, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const gridHelper = new THREE.GridHelper(100, 20, 0x334155, 0x1e293b);
    scene.add(gridHelper);

    const crateGeo = new THREE.BoxGeometry(3, 3, 3);
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3, metalness: 0.2 });
    const crateMesh = new THREE.Mesh(crateGeo, crateMat);
    crateMesh.position.set(0, 1.5, 0);
    crateMesh.castShadow = true;
    scene.add(crateMesh);
    crateMeshRef.current = crateMesh;

    const appArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1.5, 0), 5, 0x22c55e, 1, 0.5);
    const fricArrow = new THREE.ArrowHelper(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1.5, 0), 5, 0xef4444, 1, 0.5);
    const netArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 3.5, 0), 5, 0x06b6d4, 1, 0.5);

    scene.add(appArrow);
    scene.add(fricArrow);
    scene.add(netArrow);

    appliedArrowRef.current = appArrow;
    frictionArrowRef.current = fricArrow;
    netArrowRef.current = netArrow;

    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-25, 20, 0),
      new THREE.Vector3(-12, 3, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(12, 6, 0),
      new THREE.Vector3(25, 22, 0)
    ]);
    const points = curve.getPoints(100);
    const trackGeo = new THREE.BufferGeometry().setFromPoints(points);
    const trackMat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 3 });
    const trackLine = new THREE.Line(trackGeo, trackMat);
    scene.add(trackLine);
    trackLineRef.current = trackLine;

    const skaterGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const skaterMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.1, metalness: 0.8 });
    const skaterMesh = new THREE.Mesh(skaterGeo, skaterMat);
    scene.add(skaterMesh);
    skaterMeshRef.current = skaterMesh;

    const sunGeo = new THREE.SphereGeometry(3, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sunMesh);
    sunMeshRef.current = sunMesh;

    const planetGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const planetMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
    const planetMesh = new THREE.Mesh(planetGeo, planetMat);
    scene.add(planetMesh);
    planetMeshRef.current = planetMesh;

    const orbitLineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, opacity: 0.5, transparent: true });
    const orbitTrail = new THREE.Line(new THREE.BufferGeometry(), orbitLineMat);
    scene.add(orbitTrail);
    orbitTrailRef.current = orbitTrail;

    const springBobGeo = new THREE.SphereGeometry(1.5, 32, 32);
    const springBobMat = new THREE.MeshStandardMaterial({ color: 0xa855f7 });
    const springBob = new THREE.Mesh(springBobGeo, springBobMat);
    scene.add(springBob);
    springBobRef.current = springBob;

    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
      audioSystem.init();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;

      let theta = Math.atan2(camera.position.x, camera.position.z);
      const radius = camera.position.distanceTo(new THREE.Vector3(0, 5, 0));

      theta -= dx * 0.005;
      camera.position.x = radius * Math.sin(theta);
      camera.position.z = radius * Math.cos(theta);
      camera.position.y = Math.max(2, camera.position.y - dy * 0.1);
      camera.lookAt(0, 5, 0);

      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    mount.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    let animId: number;
    const engine = engineRef.current;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      engine.setAppliedForce(appliedForce);
      engine.setFriction(frictionCoeff);
      engine.setMass(massKg);

      const telemetry = engine.step(0.016);
      onTelemetryUpdate(telemetry);

      audioSystem.updateThermalHum(telemetry.speed * 20, 10);

      crateMesh.visible = mode === 'Forces';
      appArrow.visible = mode === 'Forces';
      fricArrow.visible = mode === 'Forces';
      netArrow.visible = mode === 'Forces';

      trackLine.visible = mode === 'SkatePark';
      skaterMesh.visible = mode === 'SkatePark';

      sunMesh.visible = mode === 'Orbits';
      planetMesh.visible = mode === 'Orbits';
      orbitTrail.visible = mode === 'Orbits';

      springBob.visible = mode === 'PendulumSpring';

      if (mode === 'Forces') {
        crateMesh.position.x = engine.crateBody.position.x;

        const pos = crateMesh.position;
        appArrow.position.set(pos.x, pos.y, pos.z);
        fricArrow.position.set(pos.x, pos.y, pos.z);
        netArrow.position.set(pos.x, pos.y + 2, pos.z);

        const appLen = Math.abs(appliedForce) / 10;
        appArrow.setLength(Math.max(0.1, appLen), Math.min(1, appLen * 0.3), Math.min(0.5, appLen * 0.2));
        appArrow.setDirection(new THREE.Vector3(Math.sign(appliedForce) || 1, 0, 0));

        const fricLen = Math.abs(telemetry.netForce - appliedForce) / 10;
        fricArrow.setLength(Math.max(0.1, fricLen), Math.min(1, fricLen * 0.3), Math.min(0.5, fricLen * 0.2));
        fricArrow.setDirection(new THREE.Vector3(-Math.sign(engine.crateBody.velocity.x || appliedForce || 1), 0, 0));

        const netLen = Math.abs(telemetry.netForce) / 10;
        netArrow.setLength(Math.max(0.1, netLen), Math.min(1, netLen * 0.3), Math.min(0.5, netLen * 0.2));
        netArrow.setDirection(new THREE.Vector3(Math.sign(telemetry.netForce) || 1, 0, 0));
      } else if (mode === 'SkatePark') {
        const point = curve.getPointAt(engine.skaterDistance);
        skaterMesh.position.copy(point);
      } else if (mode === 'Orbits') {
        planetMesh.position.set(engine.planetPos.x, engine.planetPos.y, engine.planetPos.z);

        orbitPointsRef.current.push(planetMesh.position.clone());
        if (orbitPointsRef.current.length > 200) orbitPointsRef.current.shift();

        orbitTrail.geometry.setFromPoints(orbitPointsRef.current);
      } else if (mode === 'PendulumSpring') {
        springBob.position.set(0, 10 + engine.springDisplacement, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      mount.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [mode]);

  useEffect(() => {
    engineRef.current.setMode(mode);
    orbitPointsRef.current = [];
  }, [mode]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};
