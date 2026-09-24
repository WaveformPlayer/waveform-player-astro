# CLAUDE.md — @arraypress/waveform-player-astro

Astro wrapper for `@arraypress/waveform-player`. Renders the container markup and
passes options as `data-*` attributes for the core to parse client-side.

## Commands
- `npm test` — vitest. **This is the only pre-publish gate: there is no `build`
  and no `prepublishOnly`** — the package ships `src/` directly.

## The rule that matters: two edits per option, both manual

`src/WaveformPlayer.astro`. A new option needs **both**:
1. Add it to the `Astro.props` destructure.
2. Add `setStr('data-<kebab>', <key> ?? null);` — kebab-case
   (`crossOrigin` → `data-cross-origin`).

Miss either and the prop typechecks fine and is silently dropped at runtime.

`test/forwarding-drift.test.ts` renders every option the installed core has and
feeds the emitted `data-*` through the core's own `parseDataAttributes()`, so it
fails on either miss. A deliberately unforwarded option goes in its
`NOT_FORWARDED` map with a reason; a new option with a `null` default needs a
sample value in `test/core-options.ts` (the test says so). A new attribute that
needs a newer core than the peer floor also means raising the floor
(`test/peer-range.test.ts` lists which attribute sets it).

## Conventions
- Prop **types** derive from core's `WaveformPlayerOptions` via `Omit<>` — never
  re-declare the option surface here. Types flowing does **not** mean values flow;
  the `setStr` list above is the actual runtime contract.
- `style` stays Astro's CSS prop — the visual style prop is `waveformStyle`.
- Add a mirror test in `test/WaveformPlayer.test.ts` + a `CHANGELOG.md` entry.

## Cross-repo
One of 15 packages that must change together — load the `waveform-release` skill.
