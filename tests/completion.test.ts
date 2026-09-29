import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Completion from '../src/Completion.tsx'

test('completion displays level, move count, five celebration dots and home action', () => {
  const markup = renderToStaticMarkup(createElement(Completion, { level: 10, moves: 23, onContinue: () => {} }))
  assert.ok(markup.includes('LEVEL 10 COMPLETE'))
  assert.ok(markup.includes('23 moves'))
  assert.ok(markup.includes('Pick next level'))
  assert.ok(markup.includes('aria-labelledby="completion-title"'))
  assert.equal((markup.match(/animation-delay:/g) ?? []).length, 5)
})
