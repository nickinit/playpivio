import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import TileBoard from '../src/TileBoard.tsx'
import { usePuzzle } from '../src/usePuzzle.ts'
import { CUTOUT_RADIUS, DOT_RADIUS, TILE_CORNER_RADIUS, TILE_GAP, maskPositionsForSurface } from '../src/geometry.ts'
import { COLORS, BOARD_WIDTH, BOARD_HEIGHT, ORIGIN, STEP, moves } from '../src/model.ts'

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

test('all single and combined surfaces share dimples and material filters', () => {
  const markup = renderToStaticMarkup(createElement(TestBoard))
  assert.equal((markup.match(/class="center-dimple"/g) ?? []).length, 7)
  assert.equal((markup.match(/filter="url\(#surface-bevel\)"/g) ?? []).length, 7)
  assert.ok(!markup.includes('<image'))
  assert.ok(!markup.includes('<canvas'))
})

test('tiles do not restore the old offset body and individual cast-shadow layers', () => {
  const markup = renderToStaticMarkup(createElement(TestBoard))
  for (const removed of ['tile-underlay', 'surface-shadow', 'surface-body', 'tile-body']) assert.ok(!markup.includes(removed))
  assert.equal((markup.match(/role="button"/g) ?? []).length, 7)
})

test('tile material lighting uses shared board coordinates rather than each shape bounds', () => {
  const markup = renderToStaticMarkup(createElement(TestBoard))
  for (const material of ['tile-ivory']) {
    assert.ok(markup.includes(`<linearGradient id="${material}" gradientUnits="userSpaceOnUse" x1="${ORIGIN}" y1="${ORIGIN}" x2="${BOARD_WIDTH - ORIGIN}" y2="${BOARD_HEIGHT - ORIGIN}">`))
    assert.equal((markup.match(new RegExp(`fill="url\\(#${material}\\)"`, 'g')) ?? []).length, 7)
  }
})

test('reference proportions change rendered dimensions without changing grid spacing', () => {
  assert.equal(STEP, 104)
  assert.ok(DOT_RADIUS * 2 / STEP > .45 && DOT_RADIUS * 2 / STEP < .5)
  assert.equal(CUTOUT_RADIUS, DOT_RADIUS)
  assert.equal(TILE_GAP, 3)
  assert.equal(TILE_CORNER_RADIUS, 12)
})

test('dots retain their material shading without projecting shadows onto tiles', () => {
  const markup = renderToStaticMarkup(createElement(TestBoard))
  const dots = [...markup.matchAll(/<g[^>]*data-dot="true"[^>]*>(.*?)<\/g>/g)]
  assert.equal(dots.length, 20)
  for (const dot of dots) {
    assert.ok(dot[1].includes('url(#color-'))
    assert.ok(dot[1].includes('url(#dot-gloss)'))
    assert.ok(!dot[1].includes('filter='))
  }
  for (const removed of ['dot-shadow', 'dot-ambient-shadow', 'dot-cast-shadow', 'moving-contact-field', 'indentation-shadows']) assert.ok(!markup.includes(removed))
})

test('resin finishes are asymmetric, clipped to each ball, deterministic and filter-free', () => {
  const markup = renderToStaticMarkup(createElement(TestBoard))
  assert.equal((markup.match(/class="resin-finish" clip-path="url\(#ball-material-clip\)"/g) ?? []).length, 20)
  for (const finish of ['resin-sheen', 'resin-warmth', 'resin-tone']) {
    assert.equal((markup.match(new RegExp(`fill="url\\(#${finish}\\)"`, 'g')) ?? []).length, 20)
  }
  assert.ok(markup.includes('rotate(-8)'))
  assert.ok(markup.includes('rotate(5)'))
  assert.equal(markup, renderToStaticMarkup(createElement(TestBoard)))
})

test('reference grounding stays behind tiles and follows the twenty moving tokens', () => {
  const markup = renderToStaticMarkup(createElement(TestBoard))
  const groundingStart = markup.indexOf('<g class="background-grounding"')
  const facesStart = markup.indexOf('<g class="surfaces">')
  assert.ok(groundingStart > 0 && groundingStart < facesStart)
  const grounding = markup.slice(groundingStart, facesStart)
  assert.ok(grounding.includes('mask="url(#background-only)"'))
  assert.equal((grounding.match(/data-token=/g) ?? []).length, 20)
  const exclusion = markup.match(/<mask id="background-only"[^>]*>(.*?)<\/mask>/)![1]
  assert.equal((exclusion.match(/<path /g) ?? []).length, 7)
  assert.equal((exclusion.match(/fill="black"/g) ?? []).length, 7)
  assert.ok(!markup.includes('M-22 -3 C-25'))
  assert.ok(!markup.includes('candy-lip'))
})
