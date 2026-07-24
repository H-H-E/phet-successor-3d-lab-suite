export class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  private humOscillator: OscillatorNode | null = null;
  private humGain: GainNode | null = null;
  private humPanner: PannerNode | null = null;
  private listener: AudioListener | null = null;

  // Music state
  private nextNoteTime: number = 0;
  private currentScale: number[] = [0, 2, 4, 5, 7, 9, 11]; // Major scale intervals
  private tempo: number = 60; // BPM
  private lastTemperature: number = 300;

  constructor() {}

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      
      this.listener = this.ctx.listener;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Continuous thermal hum oscillator
      this.humOscillator = this.ctx.createOscillator();
      this.humGain = this.ctx.createGain();
      this.humPanner = this.ctx.createPanner();
      
      this.humPanner.panningModel = 'HRTF';
      this.humPanner.distanceModel = 'inverse';
      this.humPanner.refDistance = 1;
      this.humPanner.maxDistance = 10000;
      this.humPanner.rolloffFactor = 1;

      this.humOscillator.type = 'sine';
      this.humOscillator.frequency.setValueAtTime(120, this.ctx.currentTime);
      this.humGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

      this.humOscillator.connect(this.humGain);
      this.humGain.connect(this.humPanner);
      this.humPanner.connect(this.masterGain);
      this.humOscillator.start();

      this.nextNoteTime = this.ctx.currentTime + 0.1;
      
      this.isInitialized = true;
      this.scheduleMusic();
    } catch {
      console.warn('Web Audio API not supported in this browser environment.');
    }
  }
  
  public updateListenerPosition(x: number, y: number, z: number, px: number, py: number, pz: number) {
    if (!this.isInitialized || !this.ctx || !this.listener) return;
    const now = this.ctx.currentTime;
    // listener position
    if (this.listener.positionX) {
      this.listener.positionX.linearRampToValueAtTime(x, now + 0.1);
      this.listener.positionY.linearRampToValueAtTime(y, now + 0.1);
      this.listener.positionZ.linearRampToValueAtTime(z, now + 0.1);
    } else {
      this.listener.setPosition(x, y, z);
    }
    // Set orientation (px, py, pz are forward vector)
    if (this.listener.forwardX) {
      this.listener.forwardX.linearRampToValueAtTime(px, now + 0.1);
      this.listener.forwardY.linearRampToValueAtTime(py, now + 0.1);
      this.listener.forwardZ.linearRampToValueAtTime(pz, now + 0.1);
      this.listener.upX.linearRampToValueAtTime(0, now + 0.1);
      this.listener.upY.linearRampToValueAtTime(1, now + 0.1);
      this.listener.upZ.linearRampToValueAtTime(0, now + 0.1);
    } else {
      this.listener.setOrientation(px, py, pz, 0, 1, 0);
    }
  }

  private scheduleMusic() {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;
    
    // Procedural ambient background music generator that harmonically adapts pitch and tempo to system state
    while (this.nextNoteTime < this.ctx.currentTime + 0.5) {
      this.playMusicNote(this.nextNoteTime);
      const secondsPerBeat = 60.0 / this.tempo;
      this.nextNoteTime += secondsPerBeat * (Math.random() > 0.5 ? 0.5 : 1);
    }
    
    setTimeout(() => this.scheduleMusic(), 100);
  }
  
  private playMusicNote(time: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Scale adapts based on temperature
    // Cold -> Minor, Hot -> Major, very hot -> Lydian
    if (this.lastTemperature < 200) {
      this.currentScale = [0, 2, 3, 5, 7, 8, 10]; // Minor
    } else if (this.lastTemperature < 500) {
      this.currentScale = [0, 2, 4, 5, 7, 9, 11]; // Major
    } else {
      this.currentScale = [0, 2, 4, 6, 7, 9, 11]; // Lydian
    }
    
    const rootFrequency = 220; // A3
    const degree = Math.floor(Math.random() * this.currentScale.length);
    const octave = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
    const semitones = this.currentScale[degree] + (octave * 12);
    const frequency = rootFrequency * Math.pow(2, semitones / 12);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, time);
    
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.015, time + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 2.0);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(time);
    osc.stop(time + 2.1);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.3, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playParticleCollision(impulse: number, temperatureK: number, position?: {x: number, y: number, z: number}, velocity?: {x: number, y: number, z: number}, observerVelocity?: {x: number, y: number, z: number}) {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this.ctx.createPanner();
    
    panner.panningModel = 'HRTF';
    if (position) {
      panner.positionX.value = position.x;
      panner.positionY.value = position.y;
      panner.positionZ.value = position.z;
    }

    let baseFreq = 200 + Math.min(1800, temperatureK * 1.5 + impulse * 50);
    
    // Doppler effect
    if (velocity && observerVelocity && position) {
       // v = 343 m/s (speed of sound in air, abstract here)
       const v = 343;
       // Source radial velocity (positive if moving away)
       // Calculate vector from source to observer (let's assume observer is at origin for simplicity of calculation, or use exact listener pos)
       // We'll do a simple approximation
       const sourceV = velocity.x + velocity.y + velocity.z; 
       baseFreq = baseFreq * (v / (v + sourceV * 0.1));
    }
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, this.ctx.currentTime + 0.04);

    const volume = Math.min(0.15, 0.01 + impulse * 0.02);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain!);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  public updateThermalHum(temperatureK: number, particleCount: number) {
    if (!this.isInitialized || !this.ctx || !this.humOscillator || !this.humGain || this.isMuted) return;
    this.lastTemperature = temperatureK;
    this.tempo = 40 + (temperatureK / 10); // Tempo increases with temperature
    
    const targetFreq = 80 + Math.min(800, temperatureK * 0.6);
    this.humOscillator.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);

    const targetVol = particleCount > 0 ? Math.min(0.08, 0.005 + particleCount * 0.0002) : 0;
    this.humGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.1);
  }

  public playPhaseChangeSound(newPhase: string) {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const freq = newPhase === 'Solid' ? 220 : newPhase === 'Liquid' ? 440 : newPhase === 'Gas' ? 880 : 1320;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  public playTaskSuccessSound() {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.15, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.3);
    });
  }
}

export const audioSystem = new SpatialAudioEngine();
