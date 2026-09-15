export type PositionId = number
export type CellId = string
export type Point = { x: number; y: number }
export type Move = { id: string; cells: CellId[]; cycle: PositionId[] }
export const COLORS = ['coral', 'blue', 'yellow', 'mint', 'lavender'] as const
export type Color = typeof COLORS[number]
export type Token = { id: string; color: Color; position: PositionId }

export const COLUMNS = 4
export const ROWS = 5
export const TOKEN_COUNT = COLUMNS * ROWS
export const STEP = 104
export const ORIGIN = 48
export const BOARD_WIDTH = ORIGIN * 2 + (COLUMNS - 1) * STEP
export const BOARD_HEIGHT = ORIGIN * 2 + (ROWS - 1) * STEP
export const positions: Record<PositionId, Point> = Object.fromEntries(
  Array.from({ length: TOKEN_COUNT }, (_, index) => [index + 1, {
    x: ORIGIN + (index % COLUMNS) * STEP,
    y: ORIGIN + Math.floor(index / COLUMNS) * STEP,
  }]),
)
export const cells = Object.fromEntries(
  Array.from({ length: (COLUMNS - 1) * (ROWS - 1) }, (_, index) => {
    const row = Math.floor(index / (COLUMNS - 1))
    const column = index % (COLUMNS - 1)
    const label = row < 4 && column < 3 ? String.fromCharCode(65 + row * 3 + column) : `R${row + 1}C${column + 1}`
    const topLeft = row * COLUMNS + column + 1
    return [label, [topLeft, topLeft + 1, topLeft + COLUMNS + 1, topLeft + COLUMNS]]
  }),
) as Record<CellId, PositionId[]>

export function boundaryLoops(cellIds: CellId[]): PositionId[][] {
  const edges = new Map<string, [PositionId, PositionId]>()
  for (const cell of new Set(cellIds)) {
    cells[cell].forEach((from, index, corners) => {
      const to = corners[(index + 1) % corners.length]
      if (!edges.delete(`${to}:${from}`)) edges.set(`${from}:${to}`, [from, to])
    })
  }
  const loops: PositionId[][] = []
  while (edges.size) {
    const first = edges.values().next().value!
    const loop: PositionId[] = []
    let current = first[0]
    do {
      loop.push(current)
      const next = [...edges.values()].filter(edge => edge[0] === current)
      if (next.length !== 1) throw new Error('Tile unions must have non-touching, closed boundary loops.')
      edges.delete(`${next[0][0]}:${next[0][1]}`)
      current = next[0][1]
    } while (current !== first[0])
    loops.push(loop)
  }
  return loops
}


function createMove(id: string, cellIds: CellId[]): Move {
  return { id, cells: cellIds, cycle: boundaryLoops(cellIds)[0] }
}
export const moveB = createMove('B', ['B'])
export const combinedMove = createMove('ADEH', ['A', 'D', 'E', 'H'])
const groups = [['B', 'C'], ['D', 'E', 'F'], ['H', 'I', 'L']]
export const moves: Move[] = Object.keys(cells).flatMap(cell => {
  const group = groups.find(group => group.includes(cell))
  if (group && group[0] !== cell) return []
  return [createMove(group ? group.join('') : cell, group ?? [cell])]
})

export function createTokens(): Token[] {
  let seed = 781
  const colors: Color[] = Array.from({ length: TOKEN_COUNT }, (_, index) => COLORS[index % COLORS.length])
  for (let index = colors.length - 1; index > 0; index--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const other = Math.floor(seed / 4294967296 * (index + 1))
    const previous = colors[index]
    colors[index] = colors[other]
    colors[other] = previous
  }
  return colors.map((color, index) => ({ id: `token-${index + 1}`, color, position: index + 1 }))
}

export function rotate(tokens: Token[], cycle: PositionId[]): Token[] {
  if (cycle.length < 2 || new Set(cycle).size !== cycle.length || cycle.some(position => !positions[position])) {
    throw new Error('A move requires a cycle of at least two unique board positions.')
  }
  const destinations = new Map(cycle.map((position, index) => [position, cycle[(index + 1) % cycle.length]]))
  return tokens.map(token => ({ ...token, position: destinations.get(token.position) ?? token.position }))
}

export function interpolate(from: Point, to: Point, progress: number): Point {
  return { x: from.x + (to.x - from.x) * progress, y: from.y + (to.y - from.y) * progress }
}

export function scramble(tokens: Token[], count = 24, random = Math.random): Token[] {
  let result = tokens
  for (let index = 0; index < count; index++) result = rotate(result, moves[Math.floor(random() * moves.length)].cycle)
  return result
}
