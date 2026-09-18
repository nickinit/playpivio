import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { boundaryLoops, cells, completedRows, rotate } from '../src/model.ts'
import { createLevelStart, createSolvedTokens, levels } from '../src/levels.ts'
import TileBoard from '../src/TileBoard.tsx'
import { usePuzzle } from '../src/usePuzzle.ts'

test('ten approved layouts cover every cell once with valid single perimeters', () => {
  const expected = [[], ['AB'], ['AB', 'EF'], ['AD', 'EF', 'KL'], ['AB', 'DE', 'HI', 'JK'], ['BC', 'DEF', 'HIL'], ['ADG', 'BEH', 'CFI', 'JKL'], ['ABE', 'CF', 'DGJ', 'HIKL'], ['ADEH', 'BCFI', 'GJKL'], ['ADEHI', 'BCF', 'GJKL']]
  assert.deepEqual(levels.map(level => level.id), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  for (const level of levels) {
    assert.deepEqual(level.moves.filter(move => move.cells.length > 1).map(move => move.id).sort(), [...expected[level.id - 1]].sort())
    assert.deepEqual(level.moves.flatMap(move => move.cells).sort(), Object.keys(cells).sort())
    for (const move of level.moves) assert.deepEqual(boundaryLoops(move.cells), [move.cycle])
  }
})

test('every level generates unsolved, balanced starts reversible using legal clockwise moves', () => {
  for (const level of levels) {
    for (let sample = 0; sample < 20; sample++) {
      let seed = sample + 1
      const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
        return seed / 4294967296
      }
      const { tokens, sequence } = createLevelStart(level, random)
      assert.ok(completedRows(tokens).length < 5)
      assert.equal(new Set(tokens.map(token => token.position)).size, 20)
      assert.deepEqual(tokens.map(token => token.color), createSolvedTokens().map(token => token.color))
      let restored = tokens
      for (const move of [...sequence].reverse()) {
        assert.ok(level.moves.includes(move))
        for (let turn = 0; turn < move.cycle.length - 1; turn++) restored = rotate(restored, move.cycle)
      }
      assert.deepEqual(restored, createSolvedTokens())
    }
  }
})

test('all ten boards render their own surfaces with exactly twenty shared dots', () => {
  for (const level of levels) {
    function Board() {
      return createElement(TileBoard, { puzzle: usePuzzle(), availableMoves: level.moves })
    }
    const markup = renderToStaticMarkup(createElement(Board))
    assert.equal((markup.match(/data-dot="true"/g) ?? []).length, 20)
    assert.deepEqual([...markup.matchAll(/data-move="([^"]+)"/g)].map(match => match[1]), level.moves.map(move => move.id))
  }
})
