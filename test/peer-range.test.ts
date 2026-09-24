/**
 * test/peer-range.test.ts
 * -----------------------
 *
 * Pins the core peer floor to the oldest core that parses every `data-*`
 * attribute this component emits. An older core ignores the attributes it
 * doesn't know, so an under-declared floor fails silently at the consumer's
 * site: the prop renders, the option never applies.
 */
import { describe, it, expect } from 'vitest';
import pkg from '../package.json';

/** `^1.23.0` → `[1, 23, 0]`. */
const floor = (range: string): number[] => {
	const m = /^\^(\d+)\.(\d+)\.(\d+)$/.exec(range);
	if (!m) throw new Error(`expected a caret range, got ${range}`);
	return m.slice(1).map(Number);
};

const atLeast = (a: number[], b: number[]): boolean => {
	for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
	return true;
};

describe('core peer range', () => {
	it('declares a floor that parses every data-* attribute the component emits', () => {
		// Newest attribute emitted, and the core release that added it:
		//   data-cross-origin                           1.23.0  ← the floor
		//   data-button-radius, data-artwork-position   1.22.0
		//   data-seek-value-text, data-unknown-track-text, … 1.20.0
		//   data-waveform-gradient                      1.18.0
		//   data-seek-handle                            1.17.0
		expect(pkg.peerDependencies['@arraypress/waveform-player']).toBe('^1.23.0');
	});

	it('develops against a core at least as new as the peer floor', () => {
		const peer = floor(pkg.peerDependencies['@arraypress/waveform-player']);
		const dev = floor(pkg.devDependencies['@arraypress/waveform-player']);
		expect(atLeast(dev, peer), 'devDependency floor below the peer floor').toBe(true);
	});
});
