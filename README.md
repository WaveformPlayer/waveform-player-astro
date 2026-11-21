> [!IMPORTANT]
> **Replaced by [`@arraypress/waveform-astro`](https://www.npmjs.com/package/@arraypress/waveform-astro) 2.0.** Import from `@arraypress/waveform-astro/player` instead — one package per framework, with a sub-path per component ([repo](https://github.com/WaveformPlayer/astro), [migration guide](https://docs.waveformplayer.com/getting-started/migrating-from-1x/)).
> This repository is archived and the npm package is deprecated; its 1.x releases keep working.

<div align="center">

# WaveformPlayer for Astro

**Typed Astro component wrapper for `@arraypress/waveform-player`.**
Every library option as a prop, `data-*` serialisation handled for you, plus optional lazy-mount for large grids.

[![npm version](https://img.shields.io/npm/v/@arraypress/waveform-player-astro?style=flat-square&labelColor=09090b&color=3f3f46)](https://www.npmjs.com/package/@arraypress/waveform-player-astro)
[![license](https://img.shields.io/npm/l/@arraypress/waveform-player-astro?style=flat-square&labelColor=09090b&color=3f3f46)](https://github.com/arraypress)

**[Documentation](https://docs.waveformplayer.com/)** · [npm](https://www.npmjs.com/package/@arraypress/waveform-player-astro)

</div>

---

## Install

```bash
npm install @arraypress/waveform-player-astro @arraypress/waveform-player
```

```astro
---
import WaveformPlayer from '@arraypress/waveform-player-astro';
---
<WaveformPlayer src="/track.mp3" title="My Song" artist="The Artist" waveformStyle="mirror" />
```

## Documentation

Full setup, every prop, the imperative API and SSR notes live on the docs site.

### -> [docs.waveformplayer.com](https://docs.waveformplayer.com/)

[Astro guide](https://docs.waveformplayer.com/frameworks/astro/) — install, props, the imperative API, and SSR notes. All four Astro wrappers (player / bar / playlist) are on that page.

## License

MIT © [ArrayPress](https://github.com/arraypress)
