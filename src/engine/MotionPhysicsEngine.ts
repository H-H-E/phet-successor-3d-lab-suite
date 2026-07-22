import * as CANNON from 'cannon-es';

export type MotionSubMode = 'Forces' | 'SkatePark' | 'Orbits' | 'PendulumSpring';

export interface MotionTelemetry {
  timestamp: number;
  mode: MotionSubMode;
  speed: number;
  acceleration: number;
  netForce: number;
  kineticEnergy: number;
  potentialEnergy: number;
  thermalEnergy: number;
  totalEnergy: number;
}

export interface TrackPoint {
  x: number;
  y: number;
  z: number;
}

export class MotionPhysicsEngine {
  public world: CANNON.World;
  public mode: MotionSubMode = 'Forces';

  // Mode 1: Forces & Friction
  public crateBody: CANNON.Body;
  public groundBody: CANNON.Body;
  public appliedForce: number = 0;
  public massKg: number = 50;
  public frictionCoeff: number = 0.3;
  public speed: number = 0;
  public acceleration: number = 0;
  public netForce: number = 0;

  // Mode 2: Energy Skate Park
  public skaterMass: number = 60;
  public trackPoints: TrackPoint[] = [
    { x: -20, y: 15, z: 0 },
    { x: -10, y: 3, z: 0 },
    { x: 0, y: 0, z: 0 },
    { x: 10, y: 5, z: 0 },
    { x: 20, y: 18, z: 0 }
  ];
  public skaterDistance: number = 0; // Distance along track (0 to 1)
  public skaterSpeed: number = 0;
  public skaterHeight: number = 15;
  public kineticEnergy: number = 0;
  public potentialEnergy: number = 0;
  public thermalEnergy: number = 0;

  // Mode 3: Orbits (N-body)
  public planetMass: number = 10;
  public starMass: number = 1000;
  public planetPos: { x: number; y: number; z: number } = { x: 25, y: 0, z: 0 };
  public planetVel: { x: number; y: number; z: number } = { x: 0, y: 0, z: 6.3 };

  // Mode 4: Spring & Pendulum
  public springK: number = 20; // N/m
  public springMass: number = 2; // kg
  public springDisplacement: number = 3; // meters
  public springVel: number = 0;

  constructor() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.81, 0);

    // Setup Cannon ground
    const groundShape = new CANNON.Plane();
    this.groundBody = new CANNON.Body({ mass: 0 });
    this.groundBody.addShape(groundShape);
    this.groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(this.groundBody);

    // Setup Cannon crate
    const crateShape = new CANNON.Box(new CANNON.Vec3(1.5, 1.5, 1.5));
    this.crateBody = new CANNON.Body({ mass: this.massKg });
    this.crateBody.addShape(crateShape);
    this.crateBody.position.set(0, 1.5, 0);
    this.world.addBody(this.crateBody);
  }

  public setMode(mode: MotionSubMode) {
    this.mode = mode;
    this.resetState();
  }

  public resetState() {
    this.crateBody.position.set(0, 1.5, 0);
    this.crateBody.velocity.set(0, 0, 0);
    this.crateBody.mass = this.massKg;
    this.crateBody.updateMassProperties();

    this.skaterDistance = 0;
    this.skaterSpeed = 0;
    this.thermalEnergy = 0;

    this.planetPos = { x: 25, y: 0, z: 0 };
    this.planetVel = { x: 0, y: 0, z: 6.3 };

    this.springDisplacement = 3;
    this.springVel = 0;
  }

  public setAppliedForce(f: number) {
    this.appliedForce = f;
  }

  public setFriction(friction: number) {
    this.frictionCoeff = friction;
  }

  public setMass(mass: number) {
    this.massKg = mass;
    this.crateBody.mass = mass;
    this.crateBody.updateMassProperties();
  }

  public step(dt: number = 0.016): MotionTelemetry {
    if (this.mode === 'Forces') {
      this.stepForcesMode(dt);
    } else if (this.mode === 'SkatePark') {
      this.stepSkateParkMode(dt);
    } else if (this.mode === 'Orbits') {
      this.stepOrbitsMode(dt);
    } else if (this.mode === 'PendulumSpring') {
      this.stepSpringMode(dt);
    }

    const totalEnergy = this.kineticEnergy + this.potentialEnergy + this.thermalEnergy;

    return {
      timestamp: Date.now(),
      mode: this.mode,
      speed: parseFloat(this.speed.toFixed(2)),
      acceleration: parseFloat(this.acceleration.toFixed(2)),
      netForce: parseFloat(this.netForce.toFixed(1)),
      kineticEnergy: parseFloat(this.kineticEnergy.toFixed(1)),
      potentialEnergy: parseFloat(this.potentialEnergy.toFixed(1)),
      thermalEnergy: parseFloat(this.thermalEnergy.toFixed(1)),
      totalEnergy: parseFloat(totalEnergy.toFixed(1))
    };
  }

  private stepForcesMode(dt: number) {
    const g = 9.81;
    const normalForce = this.massKg * g;
    const maxStaticFriction = this.frictionCoeff * normalForce;

    let frictionForce = 0;
    const v = this.crateBody.velocity.x;

    if (Math.abs(v) < 0.01) {
      // Static friction
      if (Math.abs(this.appliedForce) <= maxStaticFriction) {
        frictionForce = -this.appliedForce;
        this.netForce = 0;
      } else {
        frictionForce = -Math.sign(this.appliedForce) * maxStaticFriction;
        this.netForce = this.appliedForce + frictionForce;
      }
    } else {
      // Kinetic friction
      frictionForce = -Math.sign(v) * maxStaticFriction;
      this.netForce = this.appliedForce + frictionForce;
    }

    this.acceleration = this.netForce / this.massKg;

    // Apply force to Cannon body
    this.crateBody.force.set(this.netForce, 0, 0);
    this.world.step(dt);

    this.speed = Math.abs(this.crateBody.velocity.x);

    // Energies
    this.kineticEnergy = 0.5 * this.massKg * this.speed * this.speed;
    this.potentialEnergy = 0;
  }

  private stepSkateParkMode(dt: number) {
    const g = 9.81;
    // Calculate skater height based on distance along curve
    const t = (Math.sin(this.skaterDistance * Math.PI) + 1) / 2;
    this.skaterHeight = 18 * Math.pow(t - 0.5, 2) * 4;

    const potEng = this.skaterMass * g * this.skaterHeight;

    // Total energy conserved minus friction
    const maxEng = this.skaterMass * g * 18;
    const frictionLoss = this.frictionCoeff * 5 * dt;
    this.thermalEnergy += frictionLoss;

    const availKinetic = Math.max(0, maxEng - potEng - this.thermalEnergy);
    this.skaterSpeed = Math.sqrt((2 * availKinetic) / this.skaterMass);

    const dir = Math.cos(this.skaterDistance * Math.PI) > 0 ? 1 : -1;
    this.skaterDistance += dir * (this.skaterSpeed / 50) * dt;

    if (this.skaterDistance > 1) this.skaterDistance = 1;
    if (this.skaterDistance < 0) this.skaterDistance = 0;

    this.speed = this.skaterSpeed;
    this.kineticEnergy = availKinetic;
    this.potentialEnergy = potEng;
    this.netForce = this.skaterMass * g * Math.sin(t * Math.PI);
    this.acceleration = this.netForce / this.skaterMass;
  }

  private stepOrbitsMode(dt: number) {
    const G = 100;
    const r2 = this.planetPos.x * this.planetPos.x + this.planetPos.y * this.planetPos.y + this.planetPos.z * this.planetPos.z;
    const r = Math.sqrt(r2);

    const fMag = (G * this.starMass * this.planetMass) / Math.max(1, r2);
    const fx = -fMag * (this.planetPos.x / r);
    const fy = -fMag * (this.planetPos.y / r);
    const fz = -fMag * (this.planetPos.z / r);

    const ax = fx / this.planetMass;
    const ay = fy / this.planetMass;
    const az = fz / this.planetMass;

    this.planetVel.x += ax * dt;
    this.planetVel.y += ay * dt;
    this.planetVel.z += az * dt;

    this.planetPos.x += this.planetVel.x * dt;
    this.planetPos.y += this.planetVel.y * dt;
    this.planetPos.z += this.planetVel.z * dt;

    this.speed = Math.sqrt(this.planetVel.x * this.planetVel.x + this.planetVel.y * this.planetVel.y + this.planetVel.z * this.planetVel.z);
    this.netForce = fMag;
    this.acceleration = fMag / this.planetMass;
    this.kineticEnergy = 0.5 * this.planetMass * this.speed * this.speed;
    this.potentialEnergy = -(G * this.starMass * this.planetMass) / r;
  }

  private stepSpringMode(dt: number) {
    // Hooke's Law: F = -k * x - c * v
    const damping = 0.5;
    const fSpring = -this.springK * this.springDisplacement - damping * this.springVel;
    const accel = fSpring / this.springMass;

    this.springVel += accel * dt;
    this.springDisplacement += this.springVel * dt;

    this.speed = Math.abs(this.springVel);
    this.acceleration = Math.abs(accel);
    this.netForce = Math.abs(fSpring);
    this.kineticEnergy = 0.5 * this.springMass * this.springVel * this.springVel;
    this.potentialEnergy = 0.5 * this.springK * this.springDisplacement * this.springDisplacement;
  }
}
