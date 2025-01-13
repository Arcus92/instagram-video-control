export enum VideoAutoplayMode {
  // Videos start playing after loading but without audio (default).
  muted = 'muted',

  // Videos starts playing after loading with audio. This requires special browser permission.
  unmuted = 'unmuted',

  // Videos are stopped after loading.
  stopped = 'stopped',
}
