export class SpatialAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  private humOscillator: OscillatorNode | null = null;
  private humGain: GainNode | null = null;

  constructor() {
    // Lazy AudioContext instantiation on user gesture
  }

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Continuous thermal hum oscillator
      this.humOscillator = this.ctx.createOscillator();
      this.humGain = this.ctx.createGain();
      this.humOscillator.type = 'sine';
      this.humOscillator.frequency.setValueAtTime(120, this.ctx.currentTime);
      this.humGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

      this.humOscillator.connect(this.humGain);
      this.humGain.connect(this.masterGain);
      this.humOscillator.start();

      this.isInitialized = true;
    } catch {
      console.warn('Web Audio API not supported in this browser environment.');
    }
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

  public playParticleCollision(impulse: number, temperatureK: number) {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    // Trigger micro-click synth impulse
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pitch scales with Temperature & Impulse
    const baseFreq = 200 + Math.min(1800, temperatureK * 1.5 + impulse * 50);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, this.ctx.currentTime + 0.04);

    const volume = Math.min(0.15, 0.01 + impulse * 0.02);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  public updateThermalHum(temperatureK: number, particleCount: number) {
    if (!this.isInitialized || !this.ctx || !this.humOscillator || !this.humGain || this.isMuted) return;

    // Pitch rises with higher temperature
    const targetFreq = 80 + Math.min(800, temperatureK * 0.6);
    this.humOscillator.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);

    // Volume scales gently with particle count
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
