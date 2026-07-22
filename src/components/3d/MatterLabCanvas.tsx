import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useSimStore } from '../../store/useSimStore';
import { PhysicsEngine } from '../../engine/PhysicsEngine';
import { audioSystem } from '../../audio/SpatialAudioEngine';

export const MatterLabCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    species,
    isPlaying,
    speedMultiplier,
    temperatureK,
    setTemperatureK,
    containerWidth,
    containerHeight,
    containerDepth,
    checkTaskCompletion,
    addTelemetrySnapshot,
    setAriaAnnouncement
  } = useSimStore();

  const engineRef = useRef<PhysicsEngine>(new PhysicsEngine(species));
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const containerBoxRef = useRef<THREE.LineSegments | null>(null);

  const previousPhaseRef = useRef<string>('');
  const heatInputRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const mount = containerRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#0a0d14');

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 25, 75);
    camera.lookAt(0, 15, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 50, 30);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x00d2ff, 1.5, 60);
    pointLight.position.set(0, 15, 0);
    scene.add(pointLight);

    const gridHelper = new THREE.GridHelper(100, 20, 0x1f293d, 0x111827);
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    const boxGeo = new THREE.BoxGeometry(containerWidth, containerHeight, containerDepth);
    const boxEdges = new THREE.EdgesGeometry(boxGeo);
    const boxMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, linewidth: 2 });
    const containerBox = new THREE.LineSegments(boxEdges, boxMat);
    containerBox.position.set(0, containerHeight / 2, 0);
    scene.add(containerBox);
    containerBoxRef.current = containerBox;

    const glassGeo = new THREE.BoxGeometry(containerWidth, containerHeight, containerDepth);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.25,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 1.2
    });
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.set(0, containerHeight / 2, 0);
    scene.add(glassMesh);

    const maxParticles = 1000;
    const sphereGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.3
    });
    const instancedMesh = new THREE.InstancedMesh(sphereGeo, sphereMat, maxParticles);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(instancedMesh);
    instancedMeshRef.current = instancedMesh;

    const engine = engineRef.current;
    engine.setSpecies(species);
    engine.clearParticles();
    engine.addParticles(120, temperatureK);

    let isDragging = false;
    let previousMouseX = 0;
    let previousMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
      audioSystem.init();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMouseX;
      const deltaY = e.clientY - previousMouseY;

      const radius = camera.position.distanceTo(new THREE.Vector3(0, 15, 0));
      let theta = Math.atan2(camera.position.x, camera.position.z);
      let phi = Math.acos(Math.max(-1, Math.min(1, (camera.position.y - 15) / radius)));

      theta -= deltaX * 0.005;
      phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, phi - deltaY * 0.005));

      camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
      camera.position.y = 15 + radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
      camera.lookAt(0, 15, 0);

      previousMouseX = e.clientX;
      previousMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.05;
      const dir = new THREE.Vector3(0, 15, 0).sub(camera.position).normalize();
      camera.position.addScaledVector(dir, -zoomFactor);
    };

    mount.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    mount.addEventListener('wheel', onWheel, { passive: false });

    const handleResize = () => {
      if (!mount || !renderer || !camera) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    let telemetryTimer = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (isPlaying) {
        if (heatInputRef.current !== 0) {
          engine.applyHeat(heatInputRef.current * 2.5 * speedMultiplier);
          setTemperatureK(Math.round(engine.temperatureK));
        }

        const stepResults = engine.step(0.02 * speedMultiplier);

        if (stepResults.wallCollisions > 0) {
          audioSystem.playParticleCollision(stepResults.avgImpulse, engine.temperatureK);
        }
        audioSystem.updateThermalHum(engine.temperatureK, engine.particles.length);

        if (engine.phaseState !== previousPhaseRef.current) {
          if (previousPhaseRef.current !== '') {
            audioSystem.playPhaseChangeSound(engine.phaseState);
            setAriaAnnouncement(`Phase changed to ${engine.phaseState} at ${Math.round(engine.temperatureK)} Kelvin`);
          }
          previousPhaseRef.current = engine.phaseState;
        }

        checkTaskCompletion(engine.temperatureK, engine.pressureAtm, engine.phaseState);

        telemetryTimer += 0.016;
        if (telemetryTimer >= 1.0) {
          addTelemetrySnapshot(engine.getTelemetrySnapshot());
          telemetryTimer = 0;
        }
      }

      const particles = engine.particles;
      const count = particles.length;
      instancedMesh.count = count;

      const T = engine.temperatureK;
      const heatRatio = Math.min(1, Math.max(0, T / 400));
      color.setHSL(0.6 - heatRatio * 0.6, 0.9, 0.5 + heatRatio * 0.2);

      for (let i = 0; i < count; i++) {
        const p = particles[i];
        dummy.position.set(p.x, p.y, p.z);
        dummy.scale.setScalar(p.radius);
        dummy.updateMatrix();

        instancedMesh.setMatrixAt(i, dummy.matrix);
        instancedMesh.setColorAt(i, color);
      }
      instancedMesh.instanceMatrix.needsUpdate = true;
      if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      mount.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      mount.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    engine.setSpecies(species);
  }, [species]);

  useEffect(() => {
    const engine = engineRef.current;
    engine.setContainerDimensions(containerWidth, containerHeight, containerDepth);

    if (containerBoxRef.current) {
      const boxGeo = new THREE.BoxGeometry(containerWidth, containerHeight, containerDepth);
      containerBoxRef.current.geometry.dispose();
      containerBoxRef.current.geometry = new THREE.EdgesGeometry(boxGeo);
      containerBoxRef.current.position.set(0, containerHeight / 2, 0);
    }
  }, [containerWidth, containerHeight, containerDepth]);

  const startHeating = () => {
    heatInputRef.current = 1;
    audioSystem.init();
  };
  const startCooling = () => {
    heatInputRef.current = -1;
    audioSystem.init();
  };
  const stopThermalInput = () => {
    heatInputRef.current = 0;
  };

  const handleAddParticles = () => {
    engineRef.current.addParticles(30, temperatureK);
    audioSystem.init();
    audioSystem.playParticleCollision(1.5, temperatureK);
  };

  const handleRemoveParticles = () => {
    engineRef.current.removeParticles(30);
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/85 backdrop-blur-md px-6 py-3 rounded-2xl border border-slate-700/60 shadow-2xl">
        <button
          onMouseDown={startCooling}
          onMouseUp={stopThermalInput}
          onMouseLeave={stopThermalInput}
          onTouchStart={startCooling}
          onTouchEnd={stopThermalInput}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-xl shadow-lg transition active:scale-95"
          title="Hold to cool container"
        >
          <span className="text-lg">❄️</span> Cool Container
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">Bucket Thermostat</span>
          <div className="w-32 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-yellow-400 to-red-500 transition-all duration-200"
              style={{ width: `${Math.min(100, (temperatureK / 500) * 100)}%` }}
            />
          </div>
        </div>

        <button
          onMouseDown={startHeating}
          onMouseUp={stopThermalInput}
          onMouseLeave={stopThermalInput}
          onTouchStart={startHeating}
          onTouchEnd={stopThermalInput}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-medium rounded-xl shadow-lg transition active:scale-95"
          title="Hold to heat container"
        >
          <span className="text-lg">🔥</span> Heat Container
        </button>
      </div>

      <div className="absolute top-6 right-6 flex flex-col gap-2 bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl border border-slate-700/60 shadow-xl">
        <span className="text-xs font-semibold text-slate-300 px-2 uppercase tracking-wider">Particle Injector</span>
        <div className="flex gap-2">
          <button
            onClick={handleAddParticles}
            className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition active:scale-95"
          >
            + Add 30
          </button>
          <button
            onClick={handleRemoveParticles}
            className="flex-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow transition active:scale-95"
          >
            - Remove 30
          </button>
        </div>
      </div>
    </div>
  );
};
