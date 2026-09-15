import { test } from 'node:test'
import assert from 'node:assert/strict'
import { COLORS, cells, combinedMove, createTokens, moveB, moves, positions, rotate, scramble } from '../src/model.ts'

test('exactly 20 unique tokens and positions, with four of each of five colors', () => {
  const tokens = createTokens()
  assert.equal(COLORS.length, 5)
  assert.equal(Object.keys(cells).length, 12)
  assert.equal(moves.length, 7)
  assert.equal(new Set(moves.map(move => move.id)).size, moves.length)
  assert.equal(new Set(moves.flatMap(move => move.cells)).size, 12)
  assert.equal(tokens.length, 20)
  assert.equal(new Set(tokens.map(token => token.id)).size, 20)
  assert.equal(new Set(tokens.map(token => token.position)).size, 20)
  for (const color of new Set(tokens.map(token => token.color))) assert.equal(tokens.filter(token => token.color === color).length, 4)
})
test('B rotates 2 → 3 → 7 → 6 → 2 without mutating its input', () => {
  const tokens = createTokens()
  const next = rotate(tokens, moveB.cycle)
  for (const [source, target] of [[2, 3], [3, 7], [7, 6], [6, 2]]) {
    assert.equal(next.find(token => token.id === `token-${source}`)?.position, target)
  }
  assert.deepEqual(tokens, createTokens())
  assert.equal(next[0].position, 1)
})
test('every combined perimeter position advances once', () => {
  const next = rotate(createTokens(), combinedMove.cycle)
  combinedMove.cycle.forEach((source, index) => {
    assert.equal(next[source - 1].position, combinedMove.cycle[(index + 1) % 10])
  })
})
test('all configured paths use orthogonal steps and cycles restore the board', () => {
  for (const move of moves) {
    let tokens = createTokens()
    move.cycle.forEach((source, index) => {
      const from = positions[source]
      const to = positions[move.cycle[(index + 1) % move.cycle.length]]
      assert.ok(from.x === to.x || from.y === to.y)
      tokens = rotate(tokens, move.cycle)
    })
    assert.deepEqual(tokens, createTokens())
  }
})
test('scrambling preserves identities, colors and one token per position', () => {
  const tokens = scramble(createTokens(), 1000, () => 0.37)
  assert.equal(new Set(tokens.map(token => token.position)).size, 20)
  assert.deepEqual(tokens.map(token => token.color), createTokens().map(token => token.color))
})
test('invalid cycles fail explicitly', () => {
  assert.throws(() => rotate(createTokens(), [2, 2, 6]))
  assert.throws(() => rotate(createTokens(), [0, 21]))
})
