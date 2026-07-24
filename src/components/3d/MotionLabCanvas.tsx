import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MotionPhysicsEngine } from '../../engine/MotionPhysicsEngine';
import { audioSystem } from '../../audio/SpatialAudioEngine';

interface MotionLabCanvasProps {
  mode: string;
  appliedForce: number;
  frictionCoeff: number;
  massKg: number;
  onTelemetryUpdate: (data: any) => void;
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
  const personMeshRef = useRef<THREE.Mesh | null>(null);
  const fridgeMeshRef = useRef<THREE.Mesh | null>(null);
  
  const trackLineRef = useRef<THREE.Line | null>(null);
  const skaterMeshRef = useRef<THREE.Mesh | null>(null);
  const splineHandlesRef = useRef<THREE.Group | null>(null);
  
  const sunMeshRef = useRef<THREE.Mesh | null>(null);
  const planetMeshRef = useRef<THREE.Mesh | null>(null);
  const orbitTrailRef = useRef<THREE.Line | null>(null);
  const orbitPointsRef = useRef<THREE.Vector3[]>([]);

  const springBobRef1 = useRef<THREE.Mesh | null>(null);
  const springBobRef2 = useRef<THREE.Mesh | null>(null);
  const pendulumRodRef = useRef<THREE.Mesh | null>(null);
  const pendulumBobRef = useRef<THREE.Mesh | null>(null);

  const appliedArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const frictionArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const netArrowRef = useRef<THREE.ArrowHelper | null>(null);

  const [pushObject, setPushObject] = useState('crate');

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

    // Forces Mode
    const crateGeo = new THREE.BoxGeometry(3, 3, 3);
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3, metalness: 0.2 });
    const crateMesh = new THREE.Mesh(crateGeo, crateMat);
    crateMesh.position.set(0, 1.5, 0);
    crateMesh.castShadow = true;
    scene.add(crateMesh);
    crateMeshRef.current = crateMesh;
    
    const personGeo = new THREE.CylinderGeometry(1, 1, 4);
    const personMat = new THREE.MeshStandardMaterial({ color: 0xff6666 });
    const personMesh = new THREE.Mesh(personGeo, personMat);
    personMesh.position.set(0, 2, 0);
    scene.add(personMesh);
    personMeshRef.current = personMesh;

    const fridgeGeo = new THREE.BoxGeometry(2, 5, 2);
    const fridgeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const fridgeMesh = new THREE.Mesh(fridgeGeo, fridgeMat);
    fridgeMesh.position.set(0, 2.5, 0);
    scene.add(fridgeMesh);
    fridgeMeshRef.current = fridgeMesh;

    const appArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1.5, 0), 5, 0x22c55e, 1, 0.5);
    const fricArrow = new THREE.ArrowHelper(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1.5, 0), 5, 0xef4444, 1, 0.5);
    const netArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 3.5, 0), 5, 0x06b6d4, 1, 0.5);

    scene.add(appArrow);
    scene.add(fricArrow);
    scene.add(netArrow);

    appliedArrowRef.current = appArrow;
    frictionArrowRef.current = fricArrow;
    netArrowRef.current = netArrow;

    // SkatePark Mode
    const splinePts = [
      new THREE.Vector3(-25, 20, 0),
      new THREE.Vector3(-12, 3, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(12, 6, 0),
      new THREE.Vector3(25, 22, 0)
    ];
    const curve = new THREE.CatmullRomCurve3(splinePts);
    const points = curve.getPoints(100);
    const trackGeo = new THREE.BufferGeometry().setFromPoints(points);
    const trackMat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 3 });
    const trackLine = new THREE.Line(trackGeo, trackMat);
    scene.add(trackLine);
    trackLineRef.current = trackLine;

    const handlesGroup = new THREE.Group();
    splinePts.forEach(pt => {
        const hGeo = new THREE.SphereGeometry(0.8);
        const hMat = new THREE.MeshBasicMaterial({color: 0xff3333});
        const hMesh = new THREE.Mesh(hGeo, hMat);
        hMesh.position.copy(pt);
        handlesGroup.add(hMesh);
    });
    scene.add(handlesGroup);
    splineHandlesRef.current = handlesGroup;

    const skaterGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const skaterMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.1, metalness: 0.8 });
    const skaterMesh = new THREE.Mesh(skaterGeo, skaterMat);
    scene.add(skaterMesh);
    skaterMeshRef.current = skaterMesh;

    // Orbits Mode
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

    // PendulumSpring Mode
    const springBobGeo = new THREE.SphereGeometry(1.5, 32, 32);
    const springBobMat1 = new THREE.MeshStandardMaterial({ color: 0xa855f7 });
    const springBobMat2 = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
    const springBob1 = new THREE.Mesh(springBobGeo, springBobMat1);
    const springBob2 = new THREE.Mesh(springBobGeo, springBobMat2);
    scene.add(springBob1);
    scene.add(springBob2);
    springBobRef1.current = springBob1;
    springBobRef2.current = springBob2;

    const pendRodGeo = new THREE.CylinderGeometry(0.1, 0.1, 10);
    const pendRodMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const pendRod = new THREE.Mesh(pendRodGeo, pendRodMat);
    pendRod.position.set(10, 5, 0); // Offset to right
    scene.add(pendRod);
    pendulumRodRef.current = pendRod;

    const pendBobGeo = new THREE.SphereGeometry(1.0);
    const pendBobMat = new THREE.MeshStandardMaterial({ color: 0xff3333 });
    const pendBob = new THREE.Mesh(pendBobGeo, pendBobMat);
    scene.add(pendBob);
    pendulumBobRef.current = pendBob;

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
    let time = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      time += 0.016;

      // Update engine
      // @ts-ignore
      if (engine.setMode) engine.setMode(mode);
      engine.setAppliedForce(appliedForce);
      engine.setFriction(frictionCoeff);
      engine.setMass(massKg);

      const telemetry = engine.step(0.016);
      onTelemetryUpdate(telemetry);

      audioSystem.updateThermalHum(telemetry.speed * 20, 10);

      const isForces = mode === 'Forces';
      crateMesh.visible = isForces && pushObject === 'crate';
      personMesh.visible = isForces && pushObject === 'person';
      fridgeMesh.visible = isForces && pushObject === 'fridge';
      
      appArrow.visible = isForces;
      fricArrow.visible = isForces;
      netArrow.visible = isForces;

      trackLine.visible = mode === 'SkatePark';
      skaterMesh.visible = mode === 'SkatePark';
      handlesGroup.visible = mode === 'SkatePark';

      sunMesh.visible = mode === 'Orbits';
      planetMesh.visible = mode === 'Orbits';
      orbitTrail.visible = mode === 'Orbits';

      springBob1.visible = mode === 'PendulumSpring';
      springBob2.visible = mode === 'PendulumSpring';
      pendRod.visible = mode === 'PendulumSpring';
      pendBob.visible = mode === 'PendulumSpring';

      if (isForces) {
        crateMesh.position.x = engine.crateBody.position.x;
        personMesh.position.x = engine.crateBody.position.x;
        fridgeMesh.position.x = engine.crateBody.position.x;

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
        springBob1.position.set(-5, 10 + engine.springDisplacement, 0);
        springBob2.position.set(0, 10 + engine.springDisplacement * 1.5, 0); // comparison rig

        const theta = Math.sin(time * 2) * Math.PI / 4;
        pendRod.rotation.z = theta;
        pendRod.position.set(10, 10, 0);
        pendBob.position.set(10 - Math.sin(theta)*5, 10 - Math.cos(theta)*5, 0);
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
  }, [mode, pushObject]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      {mode === 'Forces' && (
          <div className="absolute top-4 left-4 flex gap-2">
              <button onClick={() => setPushObject('crate')} className={`px-2 py-1 rounded text-xs ${pushObject==='crate'?'bg-blue-600':'bg-slate-700'}`}>Crate</button>
              <button onClick={() => setPushObject('person')} className={`px-2 py-1 rounded text-xs ${pushObject==='person'?'bg-blue-600':'bg-slate-700'}`}>Person</button>
              <button onClick={() => setPushObject('fridge')} className={`px-2 py-1 rounded text-xs ${pushObject==='fridge'?'bg-blue-600':'bg-slate-700'}`}>Fridge</button>
          </div>
      )}
    </div>
  );
};
