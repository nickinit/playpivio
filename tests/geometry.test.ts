import { test } from 'node:test'
import assert from 'node:assert/strict'
import { combinedMove, moveB, moves, positions } from '../src/model.ts'
import { boundaryLoops, intersectsSurface, maskPositionsForSurface, perimeterRoute, pointAlongRoute, tilePath, vertexSurfaces } from '../src/geometry.ts'

test('combined cells produce one boundary and remove all internal seams', () => {
  assert.deepEqual(boundaryLoops(combinedMove.cells), [combinedMove.cycle])
  assert.equal((tilePath(combinedMove.cells).match(/M/g) ?? []).length, 1)
  assert.equal((tilePath(combinedMove.cells).match(/Z/g) ?? []).length, 1)
  assert.ok(!tilePath(combinedMove.cells).includes('NaN'))
})
test('tile paths derive from cell unions, not the authored cycle', () => {
  assert.equal(tilePath(['H', 'D', 'A', 'E']).split(' ').length, tilePath(combinedMove.cells).split(' ').length)
  for (const move of moves) assert.ok(tilePath(move.cells).startsWith('M'))
})
test('shared vertices touch the newly combined neighboring tiles', () => {
  const relationships = vertexSurfaces(moves)
  assert.deepEqual(relationships.get(6), ['A', 'BC', 'DEF'])
  assert.deepEqual(relationships.get(7), ['BC', 'DEF'])
  assert.deepEqual(relationships.get(10), ['DEF', 'G', 'HIL'])
})
test('B midpoint movement and its cutout intersect both sides of a shared edge', () => {
  const route = perimeterRoute(moveB, 6, 2)
  const midpoint = pointAlongRoute(route, .5)
  assert.deepEqual(midpoint, { x: 152, y: 100 })
  assert.ok(intersectsSurface(midpoint, moveB.cells))
  assert.ok(intersectsSurface(midpoint, combinedMove.cells))
  assert.ok(!intersectsSurface(midpoint, ['L']))
})
test('combined move deforms B at start, midpoint, and destination', () => {
  for (const progress of [0, .25, .5, .75, 1]) {
    const point = pointAlongRoute(perimeterRoute(combinedMove, 2, 6), progress)
    assert.ok(intersectsSurface(point, moveB.cells))
    assert.ok(intersectsSurface(point, combinedMove.cells))
  }
})
test('future cycles that skip vertices follow boundary bends, never a diagonal', () => {
  const route = perimeterRoute(combinedMove, 2, 7)
  assert.deepEqual(route, [positions[2], positions[6], positions[7]])
  assert.deepEqual(pointAlongRoute(route, .5), positions[6])
  assert.deepEqual(pointAlongRoute(route, .25), { x: 152, y: 100 })
  assert.deepEqual(pointAlongRoute(route, .75), { x: 204, y: 152 })
})
test('every supplied cycle follows exactly one boundary edge', () => {
  for (const move of moves) {
    move.cycle.forEach((from, index) => {
      const to = move.cycle[(index + 1) % move.cycle.length]
      const route = perimeterRoute(move, from, to)
      assert.equal(route.length, 2)
      assert.deepEqual(pointAlongRoute(route, 0), positions[from])
      assert.deepEqual(pointAlongRoute(route, 1), positions[to])
    })
  }
})

test('BC, DEF and HIL each form one continuous tile matching the authored perimeter', () => {
  for (const id of ['BC', 'DEF', 'HIL']) {
    const move = moves.find(candidate => candidate.id === id)!
    assert.deepEqual(boundaryLoops(move.cells), [move.cycle])
    assert.equal((tilePath(move.cells).match(/M/g) ?? []).length, 1)
  }
  const coverage = moves.flatMap(move => move.cells)
  assert.equal(coverage.length, 12)
  assert.equal(new Set(coverage).size, 12)
})
test('additional unions are generic, including a rectangular tile', () => {
  const rectangle = boundaryLoops(['A', 'B', 'D', 'E'])
  assert.equal(rectangle.length, 1)
  assert.equal(rectangle[0].length, 8)
  assert.ok(!rectangle[0].includes(6))
  assert.ok(!tilePath(['A', 'B', 'D', 'E']).includes('NaN'))
})

test('compact layout has connected hole-free shapes of at most three cells', () => {
  assert.equal(Math.max(...moves.map(move => move.cells.length)), 3)
  assert.ok(moves.some(move => move.cells.length === 3))
  for (const move of moves) {
    assert.deepEqual(boundaryLoops(move.cells), [move.cycle])
    assert.equal(new Set(move.cycle).size, move.cycle.length)
    assert.equal((tilePath(move.cells).match(/M/g) ?? []).length, 1)
  }
})

test('mask pruning preserves every intersecting circle throughout every possible move', () => {
  for (const surface of moves) {
    const candidates = maskPositionsForSurface(surface, moves)
    for (const move of moves) {
      move.cycle.forEach((source, index) => {
        const route = perimeterRoute(move, source, move.cycle[(index + 1) % move.cycle.length])
        for (let sample = 0; sample <= 20; sample++) {
          if (intersectsSurface(pointAlongRoute(route, sample / 20), surface.cells)) {
            assert.ok(candidates.has(source), `${surface.id} needs source ${source} during ${move.id}`)
          }
        }
      })
    }
  }
})
