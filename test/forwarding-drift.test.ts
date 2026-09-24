/// <reference types="node" />
/**
 * test/forwarding-drift.test.ts
 * -----------------------------
 *
 * Guards the one contract types can't: that every option the installed core
 * accepts survives the trip through this component's `data-*` attributes and
 * back out of the core's own `parseDataAttributes()`.
 *
 * `WaveformPlayerProps` derives from the core's `WaveformPlayerOptions`, so a
 * new core option type-checks here for free — and is then silently dropped,
 * because the `Astro.props` destructure and the `setStr('data-…')` list are
 * written by hand. This suite enumerates the core's real option surface (see
 * `core-options.ts`), renders each option, feeds the emitted attributes to the
 * installed core's parser, and fails for any key that doesn't come back out
 * and isn't listed in `NOT_FORWARDED` with a reason. Adding a core option
 * without wiring it here must fail this test.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import WaveformPlayerRaw from '../src/WaveformPlayer.astro';
import {
	isCallbackKey,
	loadCoreOptionKeys,
	loadParseDataAttributes,
	sampleValues,
} from './core-options';

const WaveformPlayer = WaveformPlayerRaw as Parameters<AstroContainer['renderToString']>[0];

/**
 * Core options this wrapper deliberately does NOT forward, each with why.
 * Everything else the core accepts must round-trip through `data-*`.
 */
const NOT_FORWARDED: Record<string, string> = {
	// Astro's inline-CSS attribute on the host <div>. The core's `style` is only
	// a shorthand alias for `waveformStyle`, which is forwarded under its
	// canonical name.
	style: 'Astro CSS attribute on the host div; use waveformStyle for the visual style',
};

/**
 * Every core callback (`onLoad`, …, `onNextTrack`, `onPreviousTrack`): a
 * server-rendered component emits static HTML, and a function can't be
 * serialised into a `data-*` attribute. They're omitted from
 * `WaveformPlayerProps`; lifecycle is observed via the DOM `waveformplayer:*`
 * events instead. Matched by shape so a new core callback is covered too.
 */
const notForwarded = (key: string): boolean => key in NOT_FORWARDED || isCallbackKey(key);

/** Core keys that come back from the parser under a different option name. */
const PARSED_AS: Record<string, string> = {
	// `src` is the core's shorthand for `url`; the wrapper emits `data-url`.
	src: 'url',
};

let container: AstroContainer;
let parseDataAttributes: Awaited<ReturnType<typeof loadParseDataAttributes>>;

beforeAll(async () => {
	container = await AstroContainer.create();
	parseDataAttributes = await loadParseDataAttributes();
});

/** Decode the entities Astro emits in attribute values (a browser's `dataset` would). */
const decode = (v: string): string =>
	v
		.replace(/&quot;/g, '"')
		.replace(/&#x27;|&#39;|&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');

/**
 * Equal, or — for a structured value — the JSON text of it: the parser keeps
 * some attributes (e.g. `data-waveform`) as the raw string and the core
 * decodes it later (`setWaveformData`), which is still a working round trip.
 */
const sameValue = (got: unknown, want: unknown): boolean =>
	JSON.stringify(got) === JSON.stringify(want) ||
	(typeof got === 'string' && typeof want === 'object' && got === JSON.stringify(want));

/** The host element's `data-*` attributes as the browser's `dataset` would expose them. */
function datasetOf(html: string): Record<string, string> {
	const tag = /<div\b[^>]*>/.exec(html)?.[0] ?? '';
	const dataset: Record<string, string> = {};
	for (const [, name, value = ''] of tag.matchAll(/\sdata-([\w-]+)(?:="([^"]*)")?/g)) {
		dataset[name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = decode(value);
	}
	return dataset;
}

describe('<WaveformPlayer> — forwarding drift vs the installed core', () => {
	it('round-trips every core option through data-* and the core parser, or lists it in NOT_FORWARDED', async () => {
		const { keys, defaults } = await loadCoreOptionKeys();
		const dropped: string[] = [];

		for (const key of keys) {
			if (notForwarded(key)) continue;
			const [value] = sampleValues(key, defaults[key]);
			const props = key === 'src' || key === 'url' ? { [key]: value } : { url: '/a.mp3', [key]: value };
			const html = await container.renderToString(WaveformPlayer, { props });
			const parsed = parseDataAttributes({ dataset: datasetOf(html) });
			const got = parsed[PARSED_AS[key] ?? key];
			if (!sameValue(got, value)) dropped.push(key);
		}

		expect(dropped, 'core options that do not survive data-* emission + core parsing').toEqual([]);
	});

	it('NOT_FORWARDED / PARSED_AS only name keys the core actually has', async () => {
		const { keys } = await loadCoreOptionKeys();
		const unknown = [...Object.keys(NOT_FORWARDED), ...Object.keys(PARSED_AS)].filter(
			(k) => !keys.includes(k)
		);
		expect(unknown, 'stale entries — the core no longer has these options').toEqual([]);
	});
});
