import { useMemo, useRef, useState } from 'react'
import { BOARD_WIDTH, BOARD_HEIGHT, ORIGIN, COLUMNS, STEP, completedRows, cells, moves, positions } from './model'
import type { Color, Move } from './model'
import { CUTOUT_RADIUS, DOT_RADIUS, maskPositionsForSurface, tilePath, vertexSurfaces } from './geometry'
import type { Puzzle } from './usePuzzle'

function buildSurfaces(availableMoves: Move[]) { return availableMoves.map(move => {
  const centers = move.cells.map(cell => ({ x: (positions[cells[cell][0]].x + positions[cells[cell][2]].x) / 2, y: (positions[cells[cell][0]].y + positions[cells[cell][2]].y) / 2 }))
  const vertices = move.cells.flatMap(cell => cells[cell].map(position => positions[position]))
  const left = Math.min(...vertices.map(point => point.x))
  const top = Math.min(...vertices.map(point => point.y))
  const bounds = { x: left - 4, y: top - 4, width: Math.max(...vertices.map(point => point.x)) - left + 8, height: Math.max(...vertices.map(point => point.y)) - top + 12 }
  return { ...move, bounds, path: tilePath(move.cells), maskPositions: maskPositionsForSurface(move, availableMoves), center: { x: centers.reduce((sum, point) => sum + point.x, 0) / centers.length, y: centers.reduce((sum, point) => sum + point.y, 0) / centers.length } }
}) }
export const BALL_COLORS: Record<Color, string> = {
  coral: '#EB6B67',
  blue: '#438EDB',
  yellow: '#F2BC4B',
  mint: '#55B98A',
  lavender: '#8C68D8',
}
export const DIMPLE_RADIUS = 4.2

export default function TileBoard({ puzzle, availableMoves = moves, boardHeight = BOARD_HEIGHT, enabledMoveIds, tutorialTileId }: { puzzle: Puzzle; availableMoves?: Move[]; boardHeight?: number; enabledMoveIds?: string[]; tutorialTileId?: string }) {
  const surfaces = useMemo(() => buildSurfaces(availableMoves), [availableMoves])
  const touches = useMemo(() => vertexSurfaces(availableMoves), [availableMoves])
  const { tokens, active, debug, svgRef, play, beginPress, releasePress, cancelPress, locked } = puzzle
  const [hovered, setHovered] = useState<Move | null>(null)
  const inputOwner = useRef<number | string | null>(null)
  const selected = active ?? hovered
  const neighbors = new Set(active?.cycle.flatMap(position => touches.get(position) ?? []))
  function hover(move: Move | null) { if (!locked.current) setHovered(move) }
  function materialClass(move: Move) {
    return `tile ${active?.id === move.id ? 'pressed' : ''} ${hovered?.id === move.id && !active ? 'hovered' : ''}`
  }

  return <>
    <svg ref={svgRef} className={`puzzle-board ${active ? 'is-moving' : ''}`} viewBox={`0 0 ${BOARD_WIDTH} ${boardHeight}`} role="group" aria-label={`Pivio puzzle: ${tokens.length} shared dots and ${surfaces.length} rotatable tiles`}>
      <title>Pivio tactile puzzle board</title>
      <desc>Choose a cream tile to move its perimeter dots clockwise. Tab between tiles and press Enter or Space to rotate.</desc>
      <defs>
        <marker id="cycle-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 L5 2.5 L0 5" fill="none" stroke="#696c54" strokeWidth="1" /></marker>
        {surfaces.map(surface => <mask key={surface.id} id={`cutouts-${surface.id}`} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" {...surface.bounds} style={{ maskType: 'luminance' }}>
          <rect {...surface.bounds} fill="white" />
          {tokens.filter(token => surface.maskPositions.has(token.position)).map(token => <circle key={token.id} data-token={token.id} cx={positions[token.position].x} cy={positions[token.position].y} r={CUTOUT_RADIUS} fill="black" />)}
        </mask>)}
      </defs>
      <g className="surfaces">
        {surfaces.map(surface => {
          const enabled = !enabledMoveIds || enabledMoveIds.includes(surface.id)
          const isActive = active?.id === surface.id
          const state = isActive ? 'active' : neighbors.has(surface.id) ? 'passive' : 'idle'
          return <g key={surface.id} role="button" tabIndex={enabled ? 0 : -1} aria-label={`Rotate ${surface.cells.join(' + ')} clockwise`} aria-disabled={!enabled || !!active}
            data-move={surface.id} data-state={state} className={`${materialClass(surface)} ${enabled ? '' : 'tile-disabled'}`}
            onPointerEnter={() => hover(surface)} onPointerLeave={() => hover(null)}
            onPointerDown={event => {
              if (!enabled || event.button !== 0 || !event.isPrimary || locked.current) return
              event.preventDefault()
              if (beginPress(surface)) {
                inputOwner.current = event.pointerId
                event.currentTarget.setPointerCapture(event.pointerId)
              }
            }}
            onPointerUp={event => {
              if (inputOwner.current !== event.pointerId) return
              inputOwner.current = null
              releasePress()
            }}
            onPointerCancel={event => {
              if (inputOwner.current !== event.pointerId) return
              inputOwner.current = null
              cancelPress()
            }}
            onLostPointerCapture={event => {
              if (inputOwner.current !== event.pointerId) return
              inputOwner.current = null
              cancelPress()
            }}
            onClick={event => { if (enabled && event.detail === 0) play(surface) }} onFocus={() => hover(surface)}
            onBlur={() => { inputOwner.current = null; cancelPress(); hover(null) }}
            onKeyDown={event => {
              if (event.key === 'Escape') { inputOwner.current = null; cancelPress() }
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                if (enabled && !event.repeat && beginPress(surface)) inputOwner.current = event.key
              }
            }}
            onKeyUp={event => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              if (inputOwner.current !== event.key) return
              inputOwner.current = null
              releasePress()
            }}>
            <g pointerEvents="none">
              <g mask={`url(#cutouts-${surface.id})`}>
                <path className="surface-face" d={surface.path} fill="#F2F1EB" fillRule="evenodd" />
              </g>
            </g>
            <path d={surface.path} fill="transparent" className="hit-area" fillRule="evenodd" />
            {(!tutorialTileId || surface.id === tutorialTileId) && <g className="surface-face" pointerEvents="none">
              <circle className="center-dimple" cx={surface.center.x} cy={surface.center.y} r={DIMPLE_RADIUS} fill="#B8BCB4" />
              {surface.id === tutorialTileId && enabled && !active && <circle className="tutorial-pulse" cx={surface.center.x} cy={surface.center.y} r="10" aria-hidden="true" />}
            </g>}
            {debug && <path d={surface.path} className={`debug-surface ${state}`} pointerEvents="none" />}
          </g>
        })}
      </g>
      {debug && <g pointerEvents="none" className="debug-overlay">
        {Object.entries(cells).map(([label, corners]) => <text key={label} x={(positions[corners[0]].x + positions[corners[2]].x) / 2} y={(positions[corners[0]].y + positions[corners[2]].y) / 2 + 4} textAnchor="middle">{label}</text>)}
        {selected && selected.cycle.map((source, index) => {
          const from = positions[source]
          const to = positions[selected.cycle[(index + 1) % selected.cycle.length]]
          return <line key={source} x1={from.x + (to.x - from.x) * .3} y1={from.y + (to.y - from.y) * .3} x2={from.x + (to.x - from.x) * .68} y2={from.y + (to.y - from.y) * .68} markerEnd="url(#cycle-arrow)" />
        })}
        {tokens.map(token => <circle key={token.id} data-token={token.id} cx={positions[token.position].x} cy={positions[token.position].y} r={CUTOUT_RADIUS} className="debug-cutout" />)}
      </g>}
      <g className="tokens" pointerEvents="none" aria-hidden="true">
        {tokens.map(token => <g key={token.id} data-token={token.id} data-dot="true" data-color={token.color} transform={`translate(${positions[token.position].x} ${positions[token.position].y})`}>
          <circle r={DOT_RADIUS} fill={BALL_COLORS[token.color]} />
        </g>)}
      </g>
      {debug && <g className="position-labels" pointerEvents="none">{Object.entries(positions).map(([position, point]) => <text key={position} x={point.x} y={point.y - DOT_RADIUS - 9} textAnchor="middle">{position}</text>)}</g>}
      <g className="row-checks" pointerEvents="none">
        {completedRows(tokens).filter(row => !active?.cycle.some(position => Math.floor((position - 1) / COLUMNS) === row)).map(row =>
          <g key={row} data-complete-row={row + 1} transform={`translate(${BOARD_WIDTH - 10} ${ORIGIN + row * STEP})`} role="img" aria-label={`Row ${row + 1}: all colors match`}>
            <circle r="8" fill="#E7E5DE" />
            <path d="M-4 0 L-1 3 L4 -3" fill="none" stroke="#29332B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>,
        )}
      </g>
    </svg>
    {debug && <div className="debug-panel">
      <div><strong>{selected ? selected.cells.join(' + ') : 'Geometry inspector'}</strong><span>{tokens.length} tokens · {surfaces.length} surfaces</span></div>
      <p>{selected ? [...selected.cycle, selected.cycle[0]].join(' → ') : 'Hover or focus a tile to inspect its cycle.'}</p>
      <div className="debug-key"><span>● Active press</span><span>● Passive deformation</span><span>{puzzle.frameTime ? `${puzzle.frameTime.toFixed(1)} ms / frame · last move` : 'Timing appears after a move'}</span></div>
    </div>}
  </>
}
