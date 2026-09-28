import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import TileBoard, { BALL_COLORS } from '../src/TileBoard.tsx'
import { usePuzzle } from '../src/usePuzzle.ts'
import { CUTOUT_RADIUS, DOT_RADIUS, TILE_CORNER_RADIUS, TILE_GAP, maskPositionsForSurface } from '../src/geometry.ts'
import { COLORS, BOARD_WIDTH, BOARD_HEIGHT, STEP, moves } from '../src/model.ts'

function TestBoard() {
  return createElement(TileBoard, { puzzle: usePuzzle() })
}

test('renderer creates exactly twenty shared dot objects above all tile surfaces', () => {
  const markup = renderToStaticMarkup(createElement(TestBoard))
  assert.equal((markup.match(/data-dot="true"/g) ?? []).length, 20)
  assert.ok(markup.indexOf('class="tokens"') > markup.lastIndexOf('data-move='))
  for (const color of COLORS) {
    assert.equal((markup.match(new RegExp(`data-color="${color}"`, 'g')) ?? []).length, 4)
  }
})
test('every surface has all stationary and potential incoming tokens pre-mounted in its mask', () => {
  const markup = renderToStaticMarkup(createElement(TestBoard))
  const masks = [...markup.matchAll(/<mask\b[^>]*id="cutouts-([^"]+)"[^>]*>(.*?)<\/mask>/g)]
  assert.equal(masks.length, 7)
  for (const mask of masks) {
    const surface = moves.find(move => move.id === mask[1])!
    const positions = maskPositionsForSurface(surface, moves)
    assert.equal((mask[2].match(/data-token=/g) ?? []).length, positions.size)
    for (const position of positions) assert.ok(mask[2].includes(`data-token="token-${position}"`))
  }
})
test('compact board exposes seven tiles including BC, DEF and HIL', () => {
  const markup = renderToStaticMarkup(createElement(TestBoard))
  const renderedMoves = [...markup.matchAll(/data-move="([^"]+)"/g)].map(match => match[1])
  assert.deepEqual(renderedMoves, moves.map(move => move.id))
  assert.equal((markup.match(/role="button"/g) ?? []).length, 7)
  assert.ok(!markup.includes('position-labels'))
  assert.ok(!markup.includes('debug-panel'))
})

test('single and combined surfaces use the same flat masked material', () => {
  const markup = renderToStaticMarkup(createElement(TestBoard))
  assert.equal((markup.match(/class="center-dimple"/g) ?? []).length, moves.length)
  assert.equal((markup.match(/class="surface-face" d="[^"]+" fill="#BCB8AB"/g) ?? []).length, moves.length)
  assert.ok(markup.includes(`viewBox="0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}"`))
  for (const move of moves) assert.ok(markup.includes(`mask="url(#cutouts-${move.id})"`))
})

test('restyling preserves board proportions and touching cutouts', () => {
  assert.equal(STEP, 104)
  assert.equal(DOT_RADIUS, 24.5)
  assert.equal(CUTOUT_RADIUS, DOT_RADIUS)
  assert.equal(TILE_GAP, 3)
  assert.equal(TILE_CORNER_RADIUS, 12)
})

test('each animated dot is exactly one flat solid circle in the requested palette', () => {
  const markup = renderToStaticMarkup(createElement(TestBoard))
  const dots = [...markup.matchAll(/<g[^>]*data-dot="true"[^>]*data-color="([^"]+)"[^>]*>(.*?)<\/g>/g)]
  assert.equal(dots.length, 20)
  assert.deepEqual(BALL_COLORS, {
    coral: '#EB6B67', blue: '#438EDB', yellow: '#F2BC4B', mint: '#55B98A', lavender: '#8C68D8',
  })
  for (const dot of dots) {
    assert.equal(dot[2], `<circle r="${DOT_RADIUS}" fill="${BALL_COLORS[dot[1] as keyof typeof BALL_COLORS]}"></circle>`)
  }
})

test('renderer has no gradients, lighting filters, reflections or grounding layers', () => {
  const markup = renderToStaticMarkup(createElement(TestBoard))
  for (const removed of ['Gradient', '<filter', 'filter=', 'resin-', 'background-grounding', 'surface-bevel', '<ellipse', '<image', '<canvas']) {
    assert.ok(!markup.includes(removed), removed)
  }
  assert.equal(markup, renderToStaticMarkup(createElement(TestBoard)))
})
