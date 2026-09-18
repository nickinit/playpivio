import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { COLORS, COLUMNS, completedRows, createTokens, rotate, squareMoves } from '../src/model.ts'
import TileBoard from '../src/TileBoard.tsx'
import { usePuzzle } from '../src/usePuzzle.ts'

const solved = createTokens().map(token => ({ ...token, color: COLORS[Math.floor((token.position - 1) / COLUMNS)] }))

test('matching rows use positions, not token order, and require every dot', () => {
  assert.deepEqual(completedRows([...solved].reverse()), [0, 1, 2, 3, 4])
  assert.deepEqual(completedRows(solved.slice(1)), [1, 2, 3, 4])
  assert.deepEqual(completedRows(rotate(solved, squareMoves[0].cycle)), [2, 3, 4])
})

test('board displays a check for each completed row and hides checks on moving rows', () => {
  function Board({ moving = false }: { moving?: boolean }) {
    const puzzle = usePuzzle()
    return createElement(TileBoard, { puzzle: { ...puzzle, tokens: solved, active: moving ? squareMoves[0] : null }, availableMoves: squareMoves })
  }
  const idle = renderToStaticMarkup(createElement(Board))
  assert.equal((idle.match(/data-complete-row=/g) ?? []).length, 5)
  assert.ok(idle.includes('Row 1: all colors match'))
  const moving = renderToStaticMarkup(createElement(Board, { moving: true }))
  assert.equal((moving.match(/data-complete-row=/g) ?? []).length, 3)
  assert.ok(!moving.includes('data-complete-row="1"'))
})
