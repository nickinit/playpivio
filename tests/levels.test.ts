import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import TileBoard from '../src/TileBoard.tsx'
import { usePuzzle } from '../src/usePuzzle.ts'
import { cells, createTokens, moves, rotate, scramble, squareMoves } from '../src/model.ts'

function BasicBoard() {
  return createElement(TileBoard, { puzzle: usePuzzle(), availableMoves: squareMoves })
}

test('level 1 renders twelve separate squares and twenty shared dots', () => {
  const markup = renderToStaticMarkup(createElement(BasicBoard))
  assert.equal((markup.match(/role="button"/g) ?? []).length, 12)
  assert.equal((markup.match(/data-dot="true"/g) ?? []).length, 20)
  assert.deepEqual([...markup.matchAll(/data-move="([^"]+)"/g)].map(match => match[1]), Object.keys(cells))
  for (const move of squareMoves) {
    assert.deepEqual(move.cells, [move.id])
    assert.deepEqual(move.cycle, cells[move.id])
    const initial = createTokens()
    const next = rotate(initial, move.cycle)
    assert.equal(next.filter((token, index) => token.position !== initial[index].position).length, 4)
  }
})

test('legacy layout retained as level 6 has its combined shapes', () => {
  assert.equal(moves.length, 7)
  assert.deepEqual(moves.filter(move => move.cells.length > 1).map(move => move.id), ['BC', 'DEF', 'HIL'])
})

test('shuffling uses the selected level moves and preserves color counts', () => {
  for (const availableMoves of [squareMoves, moves]) {
    const initial = createTokens()
    const shuffled = scramble(initial, 1, () => .2, availableMoves)
    assert.deepEqual(shuffled, rotate(initial, availableMoves[Math.floor(.2 * availableMoves.length)].cycle))
    assert.notDeepEqual(shuffled, initial)
    assert.equal(new Set(shuffled.map(token => token.position)).size, 20)
    assert.deepEqual(shuffled.map(token => token.color), initial.map(token => token.color))
  }
})
