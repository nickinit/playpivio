import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRotationTiming, PRESS_PROGRESS } from '../src/rotationTiming.ts'

test('press travels to exactly 8 percent and holds indefinitely without settling', () => {
  const timing = createRotationTiming(100, 320, false)
  assert.equal(timing.sample(100).progress, 0)
  assert.ok(timing.sample(130).progress > 0)
  assert.ok(timing.sample(130).progress < PRESS_PROGRESS)
  assert.deepEqual(timing.sample(160), { progress: .08, done: false, holding: true })
  assert.deepEqual(timing.sample(10000), { progress: .08, done: false, holding: true })
})

test('release completes only the remaining 92 percent and ignores repeat releases', () => {
  const timing = createRotationTiming(0, 320, false)
  timing.release(1000)
  timing.release(1100)
  assert.equal(timing.sample(1000).progress, .08)
  assert.ok(Math.abs(timing.sample(1147.2).progress - .54) < 1e-10)
  assert.deepEqual(timing.sample(1295), { progress: 1, done: true, holding: false })
})

test('quick taps finish the initial press segment before continuing without a jump', () => {
  const timing = createRotationTiming(0, 320, false)
  timing.release(10)
  assert.ok(timing.sample(30).progress < .08)
  assert.equal(timing.sample(60).progress, .08)
  assert.equal(timing.sample(355).done, true)
})

test('speed scales both movement segments, but holding time does not advance the move', () => {
  for (const speed of [.25, 1, 2]) {
    const duration = 320 / speed
    const timing = createRotationTiming(0, duration, false)
    assert.equal(timing.sample(2000).progress, .08)
    timing.release(2000)
    assert.equal(timing.sample(2001 + duration * .92).done, true)
  }
})
