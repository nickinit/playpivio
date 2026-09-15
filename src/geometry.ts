import { boundaryLoops, cells, interpolate, positions } from './model.ts'
import type { CellId, Move, Point, PositionId } from './model.ts'

export const DOT_RADIUS = 24.5
export const CUTOUT_RADIUS = DOT_RADIUS
export const TILE_GAP = 3
export const TILE_CORNER_RADIUS = 12

export { boundaryLoops } from './model.ts'

function insetLoop(loop: PositionId[], inset: number): Point[] {
  const points = loop.map(position => positions[position])
  return points.map((point, index) => {
    const previous = points[(index + points.length - 1) % points.length]
    const next = points[(index + 1) % points.length]
    const incomingLength = Math.hypot(point.x - previous.x, point.y - previous.y)
    const outgoingLength = Math.hypot(next.x - point.x, next.y - point.y)
    const incoming = { x: -(point.y - previous.y) / incomingLength, y: (point.x - previous.x) / incomingLength }
    const outgoing = { x: -(next.y - point.y) / outgoingLength, y: (next.x - point.x) / outgoingLength }
    const divisor = 1 + incoming.x * outgoing.x + incoming.y * outgoing.y
    return { x: point.x + inset * (incoming.x + outgoing.x) / divisor, y: point.y + inset * (incoming.y + outgoing.y) / divisor }
  })
}

function roundedPath(points: Point[], radius: number): string {
  const corners = points.map((point, index) => {
    const previous = points[(index + points.length - 1) % points.length]
    const next = points[(index + 1) % points.length]
    const beforeLength = Math.hypot(point.x - previous.x, point.y - previous.y)
    const afterLength = Math.hypot(point.x - next.x, point.y - next.y)
    const distance = Math.min(radius, beforeLength / 2, afterLength / 2)
    return { point, before: interpolate(point, previous, distance / beforeLength), after: interpolate(point, next, distance / afterLength) }
  })
  return corners.map(({ before, point, after }, index) =>
    `${index === 0 ? 'M' : 'L'}${before.x},${before.y} Q${point.x},${point.y} ${after.x},${after.y}`,
  ).join(' ') + ' Z'
}

export function tilePath(cellIds: CellId[]): string {
  return boundaryLoops(cellIds).map(loop => roundedPath(insetLoop(loop, TILE_GAP), TILE_CORNER_RADIUS)).join(' ')
}

export function vertexSurfaces(surfaces: Move[]): Map<PositionId, string[]> {
  const result = new Map<PositionId, string[]>()
  for (const surface of surfaces) {
    for (const position of new Set(surface.cells.flatMap(cell => cells[cell]))) {
      result.set(position, [...(result.get(position) ?? []), surface.id])
    }
  }
  return result
}

export function perimeterRoute(move: Move, from: PositionId, to: PositionId): Point[] {
  const loop = boundaryLoops(move.cells).find(boundary => boundary.includes(from) && boundary.includes(to))
  if (!loop) throw new Error('Move destinations must lie on the same tile boundary.')
  const route = [positions[from]]
  let index = loop.indexOf(from)
  do {
    index = (index + 1) % loop.length
    route.push(positions[loop[index]])
  } while (loop[index] !== to)
  return route
}

export function pointAlongRoute(route: Point[], progress: number): Point {
  const lengths = route.slice(1).map((point, index) => Math.hypot(point.x - route[index].x, point.y - route[index].y))
  let remaining = lengths.reduce((total, length) => total + length, 0) * Math.max(0, Math.min(progress, 1))
  for (let index = 0; index < lengths.length; index++) {
    if (remaining <= lengths[index]) return interpolate(route[index], route[index + 1], remaining / lengths[index])
    remaining -= lengths[index]
  }
  return route[route.length - 1]
}

export function intersectsSurface(point: Point, cellIds: CellId[], radius = CUTOUT_RADIUS): boolean {
  return cellIds.some(cell => {
    const topLeft = positions[cells[cell][0]]
    const bottomRight = positions[cells[cell][2]]
    const nearestX = Math.max(topLeft.x, Math.min(point.x, bottomRight.x))
    const nearestY = Math.max(topLeft.y, Math.min(point.y, bottomRight.y))
    return Math.hypot(point.x - nearestX, point.y - nearestY) <= radius
  })
}

export function maskPositionsForSurface(surface: Move, possibleMoves: Move[]): Set<PositionId> {
  const relevant = new Set(Object.keys(positions).map(Number).filter(position => intersectsSurface(positions[position], surface.cells)))
  for (const move of possibleMoves) {
    move.cycle.forEach((source, index) => {
      const route = perimeterRoute(move, source, move.cycle[(index + 1) % move.cycle.length])
      if (route.some(point => intersectsSurface(point, surface.cells))) relevant.add(source)
    })
  }
  return relevant
}
