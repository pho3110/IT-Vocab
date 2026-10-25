import test from 'node:test';
import assert from 'node:assert/strict';
import { springFrames } from '../src/motion.js';

test('spring starts at the current position and settles exactly at the new target in either direction', () => {
  for (const [from, to, velocity] of [[4, 230, 0], [230, 4, 0], [100, 125, 700], [100, 95, -900]]) {
    const frames = springFrames(from, to, velocity);
    assert.ok(Math.abs(frames[0].x - from) < .001);
    assert.equal(frames.at(-1).x, to);
    assert.equal(frames[0].offset, 0);
    assert.equal(frames.at(-1).offset, 1);
    assert.ok(frames.every((f, i) => Number.isFinite(f.x) && (!i || f.offset > frames[i - 1].offset)));
    assert.ok(Math.abs(frames.at(-2).x - to) < .5);
  }
});

test('interrupted movement resumes from its current position and reduced motion goes straight to target', () => {
  const initial = springFrames(4, 250);
  const interrupted = initial[7].x;
  const reversed = springFrames(interrupted, 4);
  assert.ok(Math.abs(reversed[0].x - interrupted) < .001);
  assert.equal(reversed.at(-1).x, 4);
  assert.deepEqual(springFrames(4, 250, 100, true).map(f => f.x), [250, 250]);
  assert.deepEqual(springFrames(4, 4).map(f => f.x), [4, 4]);
});
