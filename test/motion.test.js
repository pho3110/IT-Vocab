import test from 'node:test';
import assert from 'node:assert/strict';
import { glassDeformation, springFrames } from '../src/motion.js';

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

test('gel deforms in the direction of movement, is stronger on touch, and stays bounded', () => {
  const touch = glassDeformation(800, true);
  const pointer = glassDeformation(800, false);
  const reverse = glassDeformation(-800, true);
  assert.ok(touch.scaleX > pointer.scaleX);
  assert.ok(touch.scaleY < pointer.scaleY);
  assert.equal(touch.scaleX, reverse.scaleX);
  assert.equal(touch.skew, -reverse.skew);
  const fast = glassDeformation(1e6);
  assert.ok(fast.scaleX <= 1.16 && fast.scaleY >= .925 && Math.abs(fast.skew) <= 3);
  assert.deepEqual(glassDeformation(800, true, true), { scaleX: 1, scaleY: 1, skew: 0 });
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
