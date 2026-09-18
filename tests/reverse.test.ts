import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRotationTiming } from '../src/rotationTiming.ts'
import { levels, createSolvedTokens } from '../src/levels.ts'
import { rotate, positions } from '../src/model.ts'
import { intersectsSurface, maskPositionsForSurface, perimeterRoute, pointAlongRoute } from '../src/geometry.ts'

test('short presses stay clockwise; long holds smoothly reverse the preview and finish counterclockwise', () => {
  const short = createRotationTiming(0, 320)
  short.release(200)
  assert.equal(short.sample(1000).progress, 1)
  const long = createRotationTiming(0, 320)
  assert.equal(long.sample(499).progress, .08)
  assert.equal(long.sample(500).progress, .08)
  assert.equal(long.sample(560).progress, 0)
  assert.equal(long.sample(620).progress, -.08)
  assert.equal(long.sample(5000).progress, -.08)
  long.release(5000)
  assert.equal(long.sample(5000).progress, -.08)
  assert.equal(long.sample(5400).progress, -1)
  assert.equal(long.sample(5400).done, true)
})

test('release during direction transition stays continuous and locks counterclockwise', () => {
  for (const time of [500, 525, 560, 600]) {
    const timing = createRotationTiming(0, 320)
    const before = timing.sample(time).progress
    timing.release(time)
    assert.equal(timing.sample(time).progress, before)
    timing.release(1000)
    assert.equal(timing.sample(2000).progress, -1)
  }
})

test('reverse cycles undo clockwise moves and shared masks cover every reverse route', () => {
  for (const level of levels) {
    for (const move of level.moves) {
      const tokens = createSolvedTokens()
      assert.deepEqual(rotate(rotate(tokens, move.cycle), [...move.cycle].reverse()), tokens)
      move.cycle.forEach((source, index) => {
        const destination = move.cycle[(index + move.cycle.length - 1) % move.cycle.length]
        const route = perimeterRoute(move, destination, source).reverse()
        assert.deepEqual(pointAlongRoute(route, 1), positions[destination])
        for (const surface of level.moves) {
          const candidates = maskPositionsForSurface(surface, level.moves)
          for (const progress of [0, .25, .5, .75, 1]) {
            if (intersectsSurface(pointAlongRoute(route, progress), surface.cells)) assert.ok(candidates.has(source))
          }
        }
      })
    }
  }
})
