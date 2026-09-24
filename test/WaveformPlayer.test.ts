/**
 * test/WaveformPlayer.test.ts
 * ---------------------------
 *
 * End-to-end output tests for the `<WaveformPlayer>` Astro component.
 *
 * Each test renders the component with a specific prop combination
 * using Astro's `experimental_AstroContainer` API, then asserts on the
 * returned HTML string to confirm the wrapper emits the correct
 * `data-*` attributes (and, just as importantly, omits attributes for
 * props the consumer didn't set so the core library's defaults can
 * apply).
 *
 * No browser, no jsdom — Astro renders to a string and we parse the
 * resulting markup directly.
 *
 * @see ../src/WaveformPlayer.astro
 */
import { describe, it, expect, expectTypeOf, beforeAll, vi } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
// The Astro shim in src/astro-shim.d.ts models component imports as opaque
// factories. The container API wants its own `AstroComponentFactory` type
// (an Astro internal). Cast at the import boundary — this is test-only and
// not part of the public type surface.
import WaveformPlayerRaw from '../src/WaveformPlayer.astro';
import type { WaveformPlayerProps } from '../src/types';

const WaveformPlayer = WaveformPlayerRaw as Parameters<
	AstroContainer['renderToString']
>[0];

/**
 * Shared container instance — created once and reused. Astro's
 * container is stateless across renders so this is safe.
 */
let container: AstroContainer;

beforeAll(async () => {
	container = await AstroContainer.create();
});

/**
 * Render the component with the given props and return the HTML.
 *
 * The container API types `props` as an indexable `Record<string, any>`
 * but our public `WaveformPlayerProps` interface is intentionally
 * strict (no index signature), so we cast at the boundary. This keeps
 * the public type clean for end users while letting tests pass typed
 * prop objects through to the container.
 *
 * @param props - The props to pass to `<WaveformPlayer>`.
 * @returns The rendered HTML string.
 */
async function render(props: WaveformPlayerProps): Promise<string> {
	return container.renderToString(WaveformPlayer, {
		props: props as unknown as Record<string, unknown>,
	});
}

/**
 * Decode the small set of HTML entities Astro emits inside attribute
 * values when serialising to HTML. We need this because browsers
 * transparently decode entities when reading `dataset.foo`, so the
 * library at runtime sees the original string — but our test, which
 * scrapes the raw HTML string, sees the encoded form. Without this
 * decode step, any JSON containing `"` would fail comparison.
 *
 * @param value - Raw HTML attribute value as written in the markup.
 * @returns The decoded string a browser would yield at runtime.
 */
function decodeEntities(value: string): string {
	return value
		.replace(/&quot;/g, '"')
		.replace(/&#x27;/g, "'")
		.replace(/&#39;/g, "'")
		.replace(/&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}

/**
 * Extract the value of a specific attribute from a rendered HTML
 * fragment. Returns `null` if the attribute is absent, `''` if the
 * attribute is present with no value, or the decoded value otherwise.
 *
 * Intentionally minimal — we only need to introspect a known set of
 * attributes on a single root `<div>`, so a regex is enough and avoids
 * pulling in a parser dependency.
 *
 * @param html - The HTML to search.
 * @param name - The attribute name (case-sensitive).
 * @returns The attribute's value (HTML-entity-decoded), or `null` if not present.
 */
function getAttr(html: string, name: string): string | null {
	// Boolean-style attribute (present without a value or =""):
	const bare = new RegExp(`\\s${name}(?=[\\s>])`).test(html);
	const valued = new RegExp(`\\s${name}="([^"]*)"`).exec(html);
	if (valued) return decodeEntities(valued[1]);
	if (bare) return '';
	return null;
}

/**
 * Convenience — assert that a given attribute is NOT present in the
 * rendered HTML. Used heavily to verify that omitted props don't bleed
 * default values into the DOM.
 *
 * @param html - The HTML to inspect.
 * @param name - The attribute name expected to be absent.
 */
function expectNoAttr(html: string, name: string): void {
	expect(getAttr(html, name), `expected ${name} to be absent`).toBeNull();
}

// ─── Minimal render ──────────────────────────────────────────────────────

describe('<WaveformPlayer> — minimal props', () => {
	it('renders a single host div with the init attribute and data-url', async () => {
		const html = await render({ url: '/audio/track.mp3' });

		expect(html).toContain('<div');
		expect(getAttr(html, 'data-waveform-player')).toBe('');
		expect(getAttr(html, 'data-url')).toBe('/audio/track.mp3');
	});

	it('does NOT emit any optional data-* attributes when their props are omitted', async () => {
		const html = await render({ url: '/audio/track.mp3' });

		// Spot-check a representative sample from each prop group. If any
		// of these surface, the wrapper is forcing a value the consumer
		// didn't ask for and the library can't apply its own defaults.
		expectNoAttr(html, 'data-audio-mode');
		expectNoAttr(html, 'data-preload');
		expectNoAttr(html, 'data-cross-origin');
		expectNoAttr(html, 'data-waveform-style');
		expectNoAttr(html, 'data-height');
		expectNoAttr(html, 'data-samples');
		expectNoAttr(html, 'data-bar-width');
		expectNoAttr(html, 'data-bar-spacing');
		expectNoAttr(html, 'data-waveform');
		expectNoAttr(html, 'data-color-preset');
		expectNoAttr(html, 'data-waveform-color');
		expectNoAttr(html, 'data-progress-color');
		expectNoAttr(html, 'data-playback-rate');
		expectNoAttr(html, 'data-show-playback-speed');
		expectNoAttr(html, 'data-playback-rates');
		expectNoAttr(html, 'data-show-controls');
		expectNoAttr(html, 'data-show-info');
		expectNoAttr(html, 'data-show-bpm');
		expectNoAttr(html, 'data-button-align');
		expectNoAttr(html, 'data-markers');
		expectNoAttr(html, 'data-title');
		expectNoAttr(html, 'data-artist');
		expectNoAttr(html, 'data-artwork');
		expectNoAttr(html, 'data-album');
		expectNoAttr(html, 'data-autoplay');
		expectNoAttr(html, 'data-single-play');
		expectNoAttr(html, 'data-play-on-seek');
		expectNoAttr(html, 'data-enable-media-session');
		expectNoAttr(html, 'data-play-icon');
		expectNoAttr(html, 'data-pause-icon');
	});

	it('always applies the wfp-host class for stylable hook', async () => {
		const html = await render({ url: '/a.mp3' });
		expect(html).toMatch(/class="[^"]*\bwfp-host\b/);
	});
});

// ─── Audio source props ──────────────────────────────────────────────────

describe('<WaveformPlayer> — audio source props', () => {
	it('emits data-audio-mode when audioMode is set', async () => {
		const html = await render({ url: '/a.mp3', audioMode: 'external' });
		expect(getAttr(html, 'data-audio-mode')).toBe('external');
	});

	it('emits data-preload when preload is set', async () => {
		const html = await render({ url: '/a.mp3', preload: 'none' });
		expect(getAttr(html, 'data-preload')).toBe('none');
	});

	it('emits data-cross-origin when crossOrigin is set', async () => {
		const html = await render({ url: '/a.mp3', crossOrigin: 'anonymous' });
		expect(getAttr(html, 'data-cross-origin')).toBe('anonymous');
	});

	it('omits data-cross-origin by default (native <audio> behavior)', async () => {
		const html = await render({ url: '/a.mp3' });
		expectNoAttr(html, 'data-cross-origin');
	});
});

// ─── Waveform visualisation props ────────────────────────────────────────

describe('<WaveformPlayer> — waveform visualisation props', () => {
	it('emits the waveform style + numeric sizing attrs as strings', async () => {
		const html = await render({
			url: '/a.mp3',
			waveformStyle: 'bars',
			height: 80,
			samples: 250,
			barWidth: 3,
			barSpacing: 2,
		});

		expect(getAttr(html, 'data-waveform-style')).toBe('bars');
		expect(getAttr(html, 'data-height')).toBe('80');
		expect(getAttr(html, 'data-samples')).toBe('250');
		expect(getAttr(html, 'data-bar-width')).toBe('3');
		expect(getAttr(html, 'data-bar-spacing')).toBe('2');
	});

	it('JSON-stringifies waveform when given an array of peaks', async () => {
		const peaks = [0.1, 0.5, 0.9, 0.3];
		const html = await render({ url: '/a.mp3', waveform: peaks });

		expect(getAttr(html, 'data-waveform')).toBe(JSON.stringify(peaks));
	});

	it('passes waveform through verbatim when given a string (URL or inline JSON)', async () => {
		const url = '/peaks/track.json';
		const html = await render({ url: '/a.mp3', waveform: url });

		expect(getAttr(html, 'data-waveform')).toBe(url);
	});
});

// ─── Gradient axis + seek handle ─────────────────────────────────────────

describe('<WaveformPlayer> — waveformGradient + seekHandle', () => {
	// Typed via the core's WaveformPlayerOptions since core 1.18 / 1.17, but
	// the data-* emission is hand-written — so both type-checked and were
	// silently dropped. The core reads `data-waveform-gradient` as a plain
	// axis string ('vertical' | 'horizontal' | 'diagonal') and
	// `data-seek-handle` as a boolean.
	it('emits data-waveform-gradient and data-seek-handle (including false)', async () => {
		const html = await render({ url: '/a.mp3', waveformGradient: 'horizontal', seekHandle: false });
		expect(getAttr(html, 'data-waveform-gradient')).toBe('horizontal');
		expect(getAttr(html, 'data-seek-handle')).toBe('false');
	});

	it('omits both when unset so the core defaults apply', async () => {
		const html = await render({ url: '/a.mp3' });
		expectNoAttr(html, 'data-waveform-gradient');
		expectNoAttr(html, 'data-seek-handle');
	});
});

// ─── Colour props ────────────────────────────────────────────────────────

describe('<WaveformPlayer> — colour props', () => {
	it('emits colorPreset only when it is dark or light (not null)', async () => {
		const dark = await render({ url: '/a.mp3', colorPreset: 'dark' });
		expect(getAttr(dark, 'data-color-preset')).toBe('dark');

		const auto = await render({ url: '/a.mp3', colorPreset: null });
		expectNoAttr(auto, 'data-color-preset');
	});

	it('emits every individual colour as its kebab-case attribute', async () => {
		const html = await render({
			url: '/a.mp3',
			waveformColor: '#abc',
			progressColor: 'rgb(0,0,0)',
		});

		expect(getAttr(html, 'data-waveform-color')).toBe('#abc');
		expect(getAttr(html, 'data-progress-color')).toBe('rgb(0,0,0)');
	});
});

// ─── Playback controls ───────────────────────────────────────────────────

describe('<WaveformPlayer> — playback controls', () => {
	it('emits the playback rate as a numeric string', async () => {
		const html = await render({ url: '/a.mp3', playbackRate: 1.25 });
		expect(getAttr(html, 'data-playback-rate')).toBe('1.25');
	});

	it('emits showPlaybackSpeed as a "true"/"false" string', async () => {
		const on = await render({ url: '/a.mp3', showPlaybackSpeed: true });
		expect(getAttr(on, 'data-show-playback-speed')).toBe('true');

		const off = await render({ url: '/a.mp3', showPlaybackSpeed: false });
		expect(getAttr(off, 'data-show-playback-speed')).toBe('false');
	});

	it('JSON-stringifies playbackRates', async () => {
		const rates = [0.5, 1, 2];
		const html = await render({ url: '/a.mp3', playbackRates: rates });
		expect(getAttr(html, 'data-playback-rates')).toBe(JSON.stringify(rates));
	});

	it('omits playbackRates when passed an empty array', async () => {
		const html = await render({ url: '/a.mp3', playbackRates: [] });
		expectNoAttr(html, 'data-playback-rates');
	});
});

// ─── Button appearance ───────────────────────────────────────────────────

describe('<WaveformPlayer> — button appearance props', () => {
	it('emits button style, size, and radius as strings', async () => {
		const html = await render({
			url: '/a.mp3',
			buttonStyle: 'minimal',
			buttonSize: 64,
			buttonRadius: '0.5rem',
		});

		expect(getAttr(html, 'data-button-style')).toBe('minimal');
		expect(getAttr(html, 'data-button-size')).toBe('64');
		expect(getAttr(html, 'data-button-radius')).toBe('0.5rem');
	});

	it('emits buttonRadius={0} rather than dropping it as falsy', async () => {
		const html = await render({ url: '/a.mp3', buttonRadius: 0 });
		expect(getAttr(html, 'data-button-radius')).toBe('0');
	});

	it('omits the button attrs when unset so the core defaults apply', async () => {
		const html = await render({ url: '/a.mp3' });
		expectNoAttr(html, 'data-button-size');
		expectNoAttr(html, 'data-button-radius');
	});

	it('emits artworkPosition, and omits it when unset', async () => {
		const html = await render({
			url: '/a.mp3',
			artwork: '/cover.jpg',
			artworkPosition: 'button',
		});
		expect(getAttr(html, 'data-artwork-position')).toBe('button');

		expectNoAttr(await render({ url: '/a.mp3', artwork: '/cover.jpg' }), 'data-artwork-position');
	});
});

// ─── UI toggles ──────────────────────────────────────────────────────────

describe('<WaveformPlayer> — UI toggle props', () => {
	it('emits every UI boolean toggle as "true" / "false"', async () => {
		const html = await render({
			url: '/a.mp3',
			showControls: false,
			showInfo: false,
			showTime: false,
			showHoverTime: true,
			showBPM: true,
		});

		expect(getAttr(html, 'data-show-controls')).toBe('false');
		expect(getAttr(html, 'data-show-info')).toBe('false');
		expect(getAttr(html, 'data-show-time')).toBe('false');
		expect(getAttr(html, 'data-show-hover-time')).toBe('true');
		// Important: `data-show-bpm` (single lowercase token), NOT
		// `data-show-b-p-m`. The library's parseDataAttributes reads
		// `dataset.showBpm`, so the emitted attribute must be exactly
		// `data-show-bpm`.
		expect(getAttr(html, 'data-show-bpm')).toBe('true');
	});

	it('emits buttonAlign verbatim', async () => {
		const html = await render({ url: '/a.mp3', buttonAlign: 'center' });
		expect(getAttr(html, 'data-button-align')).toBe('center');
	});
});

// ─── Markers ─────────────────────────────────────────────────────────────

describe('<WaveformPlayer> — markers', () => {
	it('JSON-stringifies the markers array', async () => {
		const markers = [
			{ time: 0, label: 'Intro' },
			{ time: 30, label: 'Drop', color: '#f00' },
		];
		const html = await render({ url: '/a.mp3', markers });

		expect(getAttr(html, 'data-markers')).toBe(JSON.stringify(markers));
	});

	it('omits data-markers when the array is empty', async () => {
		const html = await render({ url: '/a.mp3', markers: [] });
		expectNoAttr(html, 'data-markers');
	});

	it('emits showMarkers as a boolean string', async () => {
		const html = await render({ url: '/a.mp3', showMarkers: false });
		expect(getAttr(html, 'data-show-markers')).toBe('false');
	});
});

// ─── Metadata ────────────────────────────────────────────────────────────

describe('<WaveformPlayer> — content metadata', () => {
	it('emits title, artist, artwork, album when set', async () => {
		const html = await render({
			url: '/a.mp3',
			title: 'My Track',
			artist: 'Artist Name',
			artwork: '/img/cover.jpg',
			album: 'The Album',
		});

		expect(getAttr(html, 'data-title')).toBe('My Track');
		expect(getAttr(html, 'data-artist')).toBe('Artist Name');
		expect(getAttr(html, 'data-artwork')).toBe('/img/cover.jpg');
		expect(getAttr(html, 'data-album')).toBe('The Album');
	});

	it('does not break when title contains HTML-meaningful characters', async () => {
		const html = await render({
			url: '/a.mp3',
			title: 'Track <with> "quotes" & ampersands',
		});

		// Astro escapes attribute values for us — the rendered HTML
		// should remain valid and round-trip back through DOM parsing.
		expect(html).toMatch(/data-title="[^"]*"/);
		expect(html).toContain('Track');
	});
});

// ─── Behaviour flags ─────────────────────────────────────────────────────

describe('<WaveformPlayer> — behaviour flags', () => {
	it('emits every behaviour flag as "true"/"false"', async () => {
		const html = await render({
			url: '/a.mp3',
			autoplay: true,
			singlePlay: false,
			playOnSeek: false,
			enableMediaSession: false,
		});

		expect(getAttr(html, 'data-autoplay')).toBe('true');
		expect(getAttr(html, 'data-single-play')).toBe('false');
		expect(getAttr(html, 'data-play-on-seek')).toBe('false');
		expect(getAttr(html, 'data-enable-media-session')).toBe('false');
	});
});

// ─── Lazy mounting ───────────────────────────────────────────────────────

describe('<WaveformPlayer> — lazy mount', () => {
	it('uses data-waveform-player-lazy instead of data-waveform-player when lazy', async () => {
		const html = await render({ url: '/a.mp3', lazy: true });

		expect(getAttr(html, 'data-waveform-player-lazy')).toBe('');
		expectNoAttr(html, 'data-waveform-player');
	});

	it('uses data-waveform-player when lazy is false', async () => {
		const html = await render({ url: '/a.mp3', lazy: false });

		expect(getAttr(html, 'data-waveform-player')).toBe('');
		expectNoAttr(html, 'data-waveform-player-lazy');
	});

	it('ships the IntersectionObserver script ONLY when lazy is true', async () => {
		const lazy = await render({ url: '/a.mp3', lazy: true });
		expect(lazy).toContain('__wfpLazyMountBound');
		expect(lazy).toContain('IntersectionObserver');

		const eager = await render({ url: '/a.mp3', lazy: false });
		expect(eager).not.toContain('__wfpLazyMountBound');
		expect(eager).not.toContain('IntersectionObserver');
	});

	it('waits for window.WaveformPlayer with a bounded retry before giving up', async () => {
		const lazy = await render({ url: '/a.mp3', lazy: true });

		// The lazy mount must not silently bail when the core script has not
		// installed window.WaveformPlayer yet — it retries a bounded number
		// of times (no busy-loop) and then warns.
		expect(lazy).toContain('MAX_WAIT_ATTEMPTS');
		expect(lazy).toContain('setTimeout');
		expect(lazy).toContain('console.warn');
	});
});

// ─── View Transitions re-init (non-lazy) ─────────────────────────────────

describe('<WaveformPlayer> — View Transitions re-init', () => {
	it('ships a non-lazy re-init script that re-runs init on astro:page-load', async () => {
		const eager = await render({ url: '/a.mp3', lazy: false });

		// Non-lazy players must re-initialise after client-side navigation
		// because the core only auto-inits on DOMContentLoaded.
		expect(eager).toContain('__wfpInitBound');
		expect(eager).toContain('astro:page-load');
		expect(eager).toContain('WaveformPlayer.init()');
	});

	it('does NOT ship the non-lazy re-init script when lazy is true', async () => {
		const lazy = await render({ url: '/a.mp3', lazy: true });
		expect(lazy).not.toContain('__wfpInitBound');
	});
});

// ─── View Transitions teardown (astro:before-swap) ───────────────────────

/**
 * Pull the before-swap teardown script out of the rendered HTML and run it
 * against hand-rolled `window` / `document` fakes — the test env is plain
 * Node, and all the script touches is `addEventListener`, the core's static
 * instance list, and each container's `closest()` / `getAttribute()`.
 */
function runSwapScript(html: string, instances: unknown[]) {
	const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
	const code = scripts.find((s) => s.includes('astro:before-swap'));
	if (!code) throw new Error('no astro:before-swap script in the rendered HTML');
	const listeners: Record<string, Array<(e: unknown) => void>> = {};
	const fakeDocument = {
		addEventListener: (type: string, fn: (e: unknown) => void) => {
			(listeners[type] ??= []).push(fn);
		},
	};
	const fakeWindow: Record<string, unknown> = {
		WaveformPlayer: { getAllInstances: () => instances.slice() },
	};
	new Function('window', 'document', code)(fakeWindow, fakeDocument);
	return {
		listeners,
		fakeWindow,
		swap(persistKeysInNewDoc: string[] = []) {
			const newDocument = {
				querySelectorAll: () =>
					persistKeysInNewDoc.map((k) => ({ getAttribute: () => k })),
			};
			(listeners['astro:before-swap'] ?? []).forEach((fn) => fn({ newDocument }));
		},
	};
}

/** A fake player whose container optionally sits inside a transition:persist host. */
function fakePlayer(opts: { declarative?: boolean; persistKey?: string; connected?: boolean } = {}) {
	const { declarative = true, persistKey, connected = true } = opts;
	const container = {
		isConnected: connected,
		hasAttribute: (name: string) => declarative && name === 'data-waveform-player',
		closest: (sel: string) =>
			persistKey && sel === '[data-astro-transition-persist]'
				? { getAttribute: () => persistKey }
				: null,
	};
	return { container, destroy: vi.fn() };
}

describe('<WaveformPlayer> — View Transitions teardown', () => {
	it('ships the before-swap teardown for lazy and non-lazy players alike', async () => {
		for (const lazy of [false, true]) {
			const html = await render({ url: '/a.mp3', lazy });
			expect(html).toContain('astro:before-swap');
			expect(html).toContain('__wfpSwapBound');
		}
	});

	it('destroys players whose containers leave the page on swap', async () => {
		const leaving = fakePlayer();
		const detached = fakePlayer({ connected: false });
		const { swap } = runSwapScript(await render({ url: '/a.mp3' }), [leaving, detached]);
		swap();
		expect(leaving.destroy).toHaveBeenCalledTimes(1);
		expect(detached.destroy).toHaveBeenCalledTimes(1);
	});

	it('keeps players inside a transition:persist host the new page also has', async () => {
		const persisted = fakePlayer({ persistKey: 'player-dock' });
		const notCarriedOver = fakePlayer({ persistKey: 'old-only' });
		const { swap } = runSwapScript(await render({ url: '/a.mp3' }), [persisted, notCarriedOver]);
		swap(['player-dock']);
		expect(persisted.destroy).not.toHaveBeenCalled();
		expect(notCarriedOver.destroy).toHaveBeenCalledTimes(1);
	});

	it('leaves players it did not mount (no data-waveform-player) to their owners', async () => {
		// e.g. a React/Vue island's player — its framework owns the lifecycle
		// and would destroy it a second time.
		const island = fakePlayer({ declarative: false });
		const { swap } = runSwapScript(await render({ url: '/a.mp3' }), [island]);
		swap();
		expect(island.destroy).not.toHaveBeenCalled();
	});

	it('binds once per page and survives a missing core or a throwing destroy()', async () => {
		const html = await render({ url: '/a.mp3' });
		const boom = fakePlayer();
		boom.destroy.mockImplementation(() => {
			throw new Error('boom');
		});
		const after = fakePlayer();
		const run = runSwapScript(html, [boom, after]);
		const error = vi.spyOn(console, 'error').mockImplementation(() => {});
		expect(() => run.swap()).not.toThrow();
		expect(after.destroy).toHaveBeenCalledTimes(1);
		error.mockRestore();

		// Second copy of the script on the same page (a second player) is a no-op.
		new Function('window', 'document', html.match(/<script[^>]*>([\s\S]*?astro:before-swap[\s\S]*?)<\/script>/)![1])(
			run.fakeWindow,
			{ addEventListener: () => { throw new Error('bound twice'); } }
		);

		// No core on the page yet: the handler must not throw.
		delete run.fakeWindow.WaveformPlayer;
		expect(() => run.swap()).not.toThrow();
	});
});

// ─── Astro extras ────────────────────────────────────────────────────────

describe('<WaveformPlayer> — Astro extras', () => {
	it('passes through the id prop to the container', async () => {
		const html = await render({ url: '/a.mp3', id: 'my-player' });
		expect(getAttr(html, 'id')).toBe('my-player');
	});

	it('merges user-supplied class with wfp-host', async () => {
		const html = await render({ url: '/a.mp3', class: 'my-custom' });

		const classAttr = getAttr(html, 'class');
		expect(classAttr).not.toBeNull();
		expect(classAttr).toContain('wfp-host');
		expect(classAttr).toContain('my-custom');
	});

	it('passes through inline style', async () => {
		const html = await render({ url: '/a.mp3', style: 'min-height: 64px;' });
		expect(getAttr(html, 'style')).toBe('min-height: 64px;');
	});
});

// ─── Types ───────────────────────────────────────────────────────────────

describe('WaveformPlayerProps (types)', () => {
	it('omits every core callback, including onNextTrack / onPreviousTrack', () => {
		// A function can't cross the server-rendered data-* boundary, so a typed
		// callback prop would type-check and then do nothing. Lifecycle is
		// observed through the DOM `waveformplayer:*` events instead.
		expectTypeOf<WaveformPlayerProps>().not.toHaveProperty('onPlay');
		expectTypeOf<WaveformPlayerProps>().not.toHaveProperty('onNextTrack');
		expectTypeOf<WaveformPlayerProps>().not.toHaveProperty('onPreviousTrack');
	});
});

// ─── Realistic combined usage ────────────────────────────────────────────

describe('<WaveformPlayer> — realistic combined usage', () => {
	it('handles a fully-loaded prop set without dropping or mangling attributes', async () => {
		const html = await render({
			url: '/audio/track.mp3',
			audioMode: 'self',
			preload: 'metadata',
			waveformStyle: 'bars',
			height: 80,
			samples: 250,
			barWidth: 3,
			barSpacing: 1,
			waveform: '/peaks/track.json',
			colorPreset: 'dark',
			waveformColor: 'rgba(255,255,255,0.3)',
			progressColor: 'rgba(168,85,247,0.9)',
			playbackRate: 1,
			showPlaybackSpeed: true,
			playbackRates: [0.5, 1, 1.5, 2],
			showControls: true,
			showInfo: true,
			showTime: true,
			showBPM: true,
			buttonAlign: 'center',
			markers: [
				{ time: 0, label: 'Intro' },
				{ time: 60, label: 'Drop' },
			],
			showMarkers: true,
			title: 'My Track',
			artist: 'Artist Name',
			artwork: '/img/cover.jpg',
			album: 'The Album',
			autoplay: false,
			singlePlay: true,
			playOnSeek: true,
			enableMediaSession: true,
			id: 'my-player',
			class: 'theme-dark',
			style: 'min-height: 80px;',
		});

		// Init attr + class + id + style
		expect(getAttr(html, 'data-waveform-player')).toBe('');
		expect(getAttr(html, 'id')).toBe('my-player');
		expect(getAttr(html, 'style')).toBe('min-height: 80px;');
		const classAttr = getAttr(html, 'class');
		expect(classAttr).toContain('wfp-host');
		expect(classAttr).toContain('theme-dark');

		// Spot-check one attribute from every major group to confirm
		// nothing dropped on the way through.
		expect(getAttr(html, 'data-url')).toBe('/audio/track.mp3');
		expect(getAttr(html, 'data-waveform-style')).toBe('bars');
		expect(getAttr(html, 'data-bar-width')).toBe('3');
		expect(getAttr(html, 'data-waveform')).toBe('/peaks/track.json');
		expect(getAttr(html, 'data-color-preset')).toBe('dark');
		expect(getAttr(html, 'data-progress-color')).toBe('rgba(168,85,247,0.9)');
		expect(getAttr(html, 'data-playback-rates')).toBe('[0.5,1,1.5,2]');
		expect(getAttr(html, 'data-show-bpm')).toBe('true');
		expect(getAttr(html, 'data-button-align')).toBe('center');
		expect(getAttr(html, 'data-markers')).toBe(
			'[{"time":0,"label":"Intro"},{"time":60,"label":"Drop"}]'
		);
		expect(getAttr(html, 'data-title')).toBe('My Track');
		expect(getAttr(html, 'data-enable-media-session')).toBe('true');
	});
});

// ─── Shorthand alias + accessibility / error parity ──────────────────────

describe('<WaveformPlayer> — src alias + accessibility + error parity', () => {
	it('accepts the `src` shorthand and emits it as the canonical data-url', async () => {
		const html = await render({ src: '/audio/track.mp3' } as WaveformPlayerProps);
		expect(getAttr(html, 'data-url')).toBe('/audio/track.mp3');
	});

	it('prefers canonical `url` over `src` when both are given', async () => {
		const html = await render({
			url: '/canonical.mp3',
			src: '/alias.mp3',
		} as WaveformPlayerProps);
		expect(getAttr(html, 'data-url')).toBe('/canonical.mp3');
	});

	it('emits data-error-text / data-accessible-seek / data-seek-label', async () => {
		const html = await render({
			url: '/audio/track.mp3',
			errorText: 'Could not load',
			accessibleSeek: false,
			seekLabel: 'Scrub track',
		});
		expect(getAttr(html, 'data-error-text')).toBe('Could not load');
		expect(getAttr(html, 'data-accessible-seek')).toBe('false');
		expect(getAttr(html, 'data-seek-label')).toBe('Scrub track');
	});

	it('omits the accessibility/error attrs when their props are absent', async () => {
		const html = await render({ url: '/audio/track.mp3' });
		expectNoAttr(html, 'data-error-text');
		expectNoAttr(html, 'data-accessible-seek');
		expectNoAttr(html, 'data-seek-label');
	});
});
