/** Temporary, procedurally generated arcade music and effects. No audio downloads. */
export class ArcadeAudio {
  private context = new AudioContext();
  private musicGain = this.context.createGain();
  private effectsGain = this.context.createGain();
  private musicTimer?: ReturnType<typeof setInterval>;
  private beat = 0;
  private volume = .7;
  private musicEnabled = false;
  private soundEnabled = false;
  private ducked = false;

  constructor() {
    this.musicGain.gain.value = 0;
    this.effectsGain.gain.value = 0;
    this.musicGain.connect(this.context.destination);
    this.effectsGain.connect(this.context.destination);
  }

  private tone(frequency: number, time: number, duration: number, volume: number, channel: GainNode, type: OscillatorType = "sine") {
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    oscillator.connect(envelope);
    envelope.connect(channel);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(volume, time + .012);
    envelope.gain.exponentialRampToValueAtTime(.0001, time + duration);
    oscillator.start(time);
    oscillator.stop(time + duration + .02);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
  }

  private level(channel: GainNode, value: number) {
    channel.gain.cancelScheduledValues(this.context.currentTime);
    channel.gain.setTargetAtTime(value, this.context.currentTime, .02);
  }

  resume() {
    if (this.context.state === "suspended") void this.context.resume().catch(() => {});
  }

  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    this.level(this.effectsGain, this.soundEnabled ? this.volume : 0);
    this.updateMusicLevel();
  }

  setDucked(value: boolean) { this.ducked = value; this.updateMusicLevel(); }

  private updateMusicLevel() {
    this.level(this.musicGain, this.musicEnabled ? .6 * this.volume * (this.ducked ? .2 : 1) : 0);
  }

  setSound(enabled: boolean) {
    this.soundEnabled = enabled;
    this.resume();
    this.level(this.effectsGain, enabled ? this.volume : 0);
  }

  setMusic(enabled: boolean) {
    this.resume();
    clearInterval(this.musicTimer);
    this.musicEnabled = enabled;
    this.updateMusicLevel();
    if (!enabled) return;
    const notes = [261.63, 293.66, 329.63, 392, 440, 523.25];
    const tick = () => {
      // Do not accumulate notes while autoplay is blocked or audio is interrupted.
      if (this.context.state !== "running") return;
      const time = this.context.currentTime;
      this.tone(notes[Math.floor(Math.random() * notes.length)], time, .28, .045, this.musicGain, "triangle");
      if (this.beat++ % 4 === 0) this.tone([130.81, 98, 110, 98][Math.floor(this.beat / 4) % 4], time, .55, .06, this.musicGain);
    };
    tick();
    this.musicTimer = setInterval(tick, 240);
  }

  play(win: boolean) {
    const pitches = win ? [523.25, 659.25, 783.99, 1046.5] : [160 + Math.random() * 90, 110];
    pitches.forEach((frequency, i) => this.tone(frequency, this.context.currentTime + i * .09, .24, .045, this.effectsGain, win ? "sine" : "triangle"));
  }

  dispose() {
    clearInterval(this.musicTimer);
    void this.context.close().catch(() => {});
  }
}
