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
export const BALL_COLORS: Record<Color, [string, string, string, string]> = {
  coral: ['#ff9998', '#ff6f6b', '#ed5759', '#b84046'],
  blue: ['#71c9ff', '#329df4', '#148cde', '#126ca5'],
  yellow: ['#ffe780', '#ffc845', '#efb52b', '#b38724'],
  mint: ['#83dfb8', '#45c995', '#28b381', '#258569'],
  lavender: ['#c599ff', '#a36be8', '#9157d8', '#6941a0'],
}
export const DIMPLE_RADIUS = 4.2
export const MOLD_SOFTNESS = 2.1
export const BALL_FINISHES = [
  { tilt: -8, x: -1, y: .4, strength: .9 },
  { tilt: 5, x: .8, y: -.5, strength: .8 },
  { tilt: -2, x: .2, y: .8, strength: 1 },
]

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
    return `tile molded ${active?.id === move.id ? 'pressed' : ''} ${hovered?.id === move.id && !active ? 'hovered' : ''}`
  }

  return <>
    <svg ref={svgRef} className={`puzzle-board ${active ? 'is-moving' : ''}`} viewBox={`0 0 ${BOARD_WIDTH} ${boardHeight}`} role="group" aria-label={`Pivio puzzle: ${tokens.length} shared dots and ${surfaces.length} rotatable tiles`}>
      <title>Pivio tactile puzzle board</title>
      <desc>Choose a cream tile to move its perimeter dots clockwise. Tab between tiles and press Enter or Space to rotate.</desc>
      <defs>
        <linearGradient id="tile-ivory" gradientUnits="userSpaceOnUse" x1={ORIGIN} y1={ORIGIN} x2={BOARD_WIDTH - ORIGIN} y2={boardHeight - ORIGIN}>
          <stop stopColor="#f8f4ec" /><stop offset="0.48" stopColor="#f5f0e6" /><stop offset="1" stopColor="#f1ece2" />
        </linearGradient>
        <radialGradient id="dot-gloss">
          <stop stopColor="#fffdf8" stopOpacity=".28" /><stop offset=".38" stopColor="#fffdf8" stopOpacity=".12" /><stop offset="1" stopColor="#fffdf8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="resin-sheen">
          <stop stopColor="#fffdf6" stopOpacity=".32" /><stop offset=".35" stopColor="#fffdf6" stopOpacity=".15" /><stop offset="1" stopColor="#fffdf6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="resin-warmth">
          <stop stopColor="#ffe6c6" stopOpacity=".12" /><stop offset=".5" stopColor="#ffe6c6" stopOpacity=".04" /><stop offset="1" stopColor="#ffe6c6" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="resin-tone">
          <stop stopColor="#352c4b" stopOpacity=".11" /><stop offset=".45" stopColor="#352c4b" stopOpacity=".04" /><stop offset="1" stopColor="#352c4b" stopOpacity="0" />
        </radialGradient>
        <clipPath id="ball-material-clip" clipPathUnits="userSpaceOnUse"><circle r={DOT_RADIUS} /></clipPath>
        <radialGradient id="dot-bounce" cx="28%" cy="81%" r="54%">
          <stop stopColor="#ffedda" stopOpacity=".13" /><stop offset=".7" stopColor="#ffedda" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dimple-material" cx="65%" cy="72%" r="85%">
          <stop stopColor="#c7beb0" /><stop offset=".7" stopColor="#bfb5a7" /><stop offset="1" stopColor="#a79d90" />
        </radialGradient>
        {Object.entries(BALL_COLORS).map(([color, stops]) => <radialGradient key={color} id={`color-${color}`} cx="50%" cy="50%" r="50%" fx="55%" fy="44%">
          <stop stopColor={stops[1]} /><stop offset=".7" stopColor={stops[1]} /><stop offset=".94" stopColor={stops[2]} /><stop offset="1" stopColor={stops[2]} />
        </radialGradient>)}
        <filter id="tile-mold" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={MOLD_SOFTNESS} />
          <feComponentTransfer><feFuncA type="linear" slope="10" intercept="-4.5" /></feComponentTransfer>
        </filter>
        <filter id="surface-bevel" x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.25" result="soft" />
          <feOffset in="soft" dx="-1.6" dy="2.2" result="lower" />
          <feComposite in="SourceAlpha" in2="lower" operator="out" result="top-rim" />
          <feFlood floodColor="#ffffff" floodOpacity=".8" />
          <feComposite in2="top-rim" operator="in" result="highlight" />
          <feOffset in="soft" dx="2" dy="-2.8" result="upper" />
          <feComposite in="SourceAlpha" in2="upper" operator="out" result="bottom-rim" />
          <feFlood floodColor="#aaa08e" floodOpacity=".42" />
          <feComposite in2="bottom-rim" operator="in" result="shade" />
          <feOffset in="soft" dx=".65" dy="-1" result="edge-offset" />
          <feComposite in="SourceAlpha" in2="edge-offset" operator="out" result="edge-band" />
          <feFlood floodColor="#8f8373" floodOpacity=".08" />
          <feComposite in2="edge-band" operator="in" result="edge-shade" />
          <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="highlight" /><feMergeNode in="shade" /><feMergeNode in="edge-shade" /></feMerge>
        </filter>
        <filter id="dimple-inset" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx=".2" dy=".65" stdDeviation=".25" floodColor="#fffdf4" floodOpacity=".9" />
        </filter>
        <marker id="cycle-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 L5 2.5 L0 5" fill="none" stroke="#696c54" strokeWidth="1" /></marker>
        {surfaces.map(surface => <mask key={surface.id} id={`cutouts-${surface.id}`} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" {...surface.bounds} style={{ maskType: 'luminance' }}>
          <rect {...surface.bounds} fill="white" />
          {tokens.filter(token => surface.maskPositions.has(token.position)).map(token => <circle key={token.id} data-token={token.id} cx={positions[token.position].x} cy={positions[token.position].y} r={CUTOUT_RADIUS} fill="black" />)}
        </mask>)}
        <radialGradient id="ground-contact">
          <stop stopColor="#615344" stopOpacity=".28" /><stop offset=".55" stopColor="#615344" stopOpacity=".18" /><stop offset="1" stopColor="#615344" stopOpacity="0" />
        </radialGradient>
        <filter id="ground-softness" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" /></filter>
        <mask id="background-only" maskUnits="userSpaceOnUse" x="0" y="0" width={BOARD_WIDTH} height={boardHeight} style={{ maskType: 'luminance' }}>
          <rect width={BOARD_WIDTH} height={boardHeight} fill="white" />
          {surfaces.map(surface => <g key={surface.id} className={materialClass(surface)}>
            <path className="surface-face" d={surface.path} fill="black" stroke="black" strokeWidth="1" fillRule="evenodd" />
          </g>)}
        </mask>
      </defs>
      <g className="background-grounding" mask="url(#background-only)" pointerEvents="none" aria-hidden="true">
        <g filter="url(#ground-softness)" transform="translate(-1.5 3)" fill="#786b59" opacity=".19">
          {surfaces.map(surface => <path key={surface.id} d={surface.path} fillRule="evenodd" />)}
        </g>
        {tokens.map(token => <g key={token.id} data-token={token.id} transform={`translate(${positions[token.position].x} ${positions[token.position].y})`}>
          <ellipse cx="-3" cy="6" rx="34" ry="33" fill="url(#ground-contact)" />
        </g>)}
      </g>
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
              <g filter="url(#surface-bevel)"><g filter="url(#tile-mold)"><g mask={`url(#cutouts-${surface.id})`}>
                <path className="surface-face" d={surface.path} fill="url(#tile-ivory)" fillRule="evenodd" />
              </g></g></g>
            </g>
            <path d={surface.path} fill="transparent" className="hit-area" fillRule="evenodd" />
            {(!tutorialTileId || surface.id === tutorialTileId) && <g className="surface-face" pointerEvents="none">
              <circle className="center-dimple" cx={surface.center.x} cy={surface.center.y} r={DIMPLE_RADIUS} fill="url(#dimple-material)" filter="url(#dimple-inset)" />
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
        {tokens.map((token, index) => {
          const finish = BALL_FINISHES[index % BALL_FINISHES.length]
          return <g key={token.id} data-token={token.id} data-dot="true" data-color={token.color} transform={`translate(${positions[token.position].x} ${positions[token.position].y})`}>
          <circle r={DOT_RADIUS} fill={`url(#color-${token.color})`} />
          <circle r={DOT_RADIUS} fill="url(#dot-bounce)" />
          <g className="resin-finish" clipPath="url(#ball-material-clip)">
            <g transform={`scale(-1 1) translate(${finish.x} ${finish.y}) rotate(${finish.tilt})`} opacity={finish.strength}>
              <ellipse cx="-8" cy="-11" rx="17" ry="14" transform="rotate(-18 -8 -11)" fill="url(#dot-gloss)" />
              <ellipse cx="-7" cy="-16" rx="11" ry="5.5" transform="rotate(-22 -7 -16)" fill="url(#resin-sheen)" />
              <ellipse cx="-10" cy="9" rx="14" ry="10" transform="rotate(24 -10 9)" fill="url(#resin-warmth)" />
              <ellipse cx="12" cy="3" rx="10" ry="17" transform="rotate(-17 12 3)" fill="url(#resin-tone)" />
            </g>
          </g>
        </g>})}
      </g>
      {debug && <g className="position-labels" pointerEvents="none">{Object.entries(positions).map(([position, point]) => <text key={position} x={point.x} y={point.y - DOT_RADIUS - 9} textAnchor="middle">{position}</text>)}</g>}
      <g className="row-checks" pointerEvents="none">
        {completedRows(tokens).filter(row => !active?.cycle.some(position => Math.floor((position - 1) / COLUMNS) === row)).map(row =>
          <g key={row} data-complete-row={row + 1} transform={`translate(${BOARD_WIDTH - 10} ${ORIGIN + row * STEP})`} role="img" aria-label={`Row ${row + 1}: all colors match`}>
            <circle r="8" fill="#e1ebd8" />
            <path d="M-4 0 L-1 3 L4 -3" fill="none" stroke="#5f8050" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
