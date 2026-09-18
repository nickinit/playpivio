import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { completedRows, rotate } from '../src/model.ts'
import { canPlayTutorial, createTutorialTokens, tutorialMoves, tutorialSolved } from '../src/tutorial.ts'
import { usePuzzle } from '../src/usePuzzle.ts'
import TileBoard from '../src/TileBoard.tsx'

test('tutorial has eight dots and is solved by one clockwise A move', () => {
  const tokens = createTutorialTokens()
  assert.equal(tokens.length, 8)
  assert.equal(new Set(tokens.map(token => token.position)).size, 8)
  assert.equal(tokens.filter(token => token.color === 'coral').length, 4)
  assert.equal(tokens.filter(token => token.color === 'blue').length, 4)
  assert.deepEqual(completedRows(tokens), [])
  assert.equal(tutorialSolved(tokens), false)
  assert.equal(canPlayTutorial(tutorialMoves[0], tokens), true)
  assert.equal(canPlayTutorial(tutorialMoves[1], tokens), false)
  assert.equal(canPlayTutorial(tutorialMoves[2], tokens), false)
  const solved = rotate(tokens, tutorialMoves[0].cycle)
  assert.equal(tutorialSolved(solved), true)
  assert.deepEqual(completedRows(solved), [0, 1])
  assert.equal(canPlayTutorial(tutorialMoves[0], solved), false)
})

test('tutorial renders only ABC, eight dots, and one enabled tile', () => {
  function TutorialBoard() {
    const puzzle = usePuzzle(createTutorialTokens, canPlayTutorial)
    return createElement(TileBoard, { puzzle, availableMoves: tutorialMoves, boardHeight: 200, enabledMoveIds: ['A'], tutorialTileId: 'A' })
  }
  const markup = renderToStaticMarkup(createElement(TutorialBoard))
  assert.ok(markup.includes('viewBox="0 0 408 200"'))
  assert.equal((markup.match(/data-dot="true"/g) ?? []).length, 8)
  assert.equal((markup.match(/role="button"/g) ?? []).length, 3)
  assert.equal((markup.match(/tabindex="0"/g) ?? []).length, 1)
  assert.equal((markup.match(/aria-disabled="true"/g) ?? []).length, 2)
  assert.equal((markup.match(/class="center-dimple"/g) ?? []).length, 1)
  assert.equal((markup.match(/class="tutorial-pulse"/g) ?? []).length, 1)
  assert.deepEqual([...markup.matchAll(/data-move="([^"]+)"/g)].map(match => match[1]), ['A', 'B', 'C'])
})
