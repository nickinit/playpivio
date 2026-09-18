import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createTokens, rotate, scramble } from './model'
import type { Move, Point, Token } from './model'
import { perimeterRoute, pointAlongRoute } from './geometry'
import { createRotationTiming, REVERSE_HOLD_MS } from './rotationTiming'

export function usePuzzle(initialTokens: () => Token[] = createTokens, canPlay?: (move: Move, tokens: Token[]) => boolean, allowReverse = true) {
  const [tokens, setTokens] = useState(initialTokens)
  const [active, setActive] = useState<Move | null>(null)
  const [counterclockwise, setCounterclockwise] = useState(false)
  const [moveCount, setMoveCount] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [debug, setDebug] = useState(false)
  const [message, setMessage] = useState('Pick any tile. Give the colors a little turn.')
  const [frameTime, setFrameTime] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const locked = useRef(false)
  const animationFrame = useRef(0)
  const reverseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tokenState = useRef(tokens)
  const pendingFinish = useRef(false)
  const gesture = useRef<{ release: () => void; cancel: () => void } | null>(null)

  useLayoutEffect(() => {
    tokenState.current = tokens
    if (pendingFinish.current) {
      locked.current = false
      pendingFinish.current = false
    }
  }, [tokens])
  useEffect(() => {
    const abort = () => gesture.current?.cancel()
    const visibility = () => { if (document.hidden) abort() }
    window.addEventListener('blur', abort)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      cancelAnimationFrame(animationFrame.current)
      if (reverseTimer.current !== null) clearTimeout(reverseTimer.current)
      window.removeEventListener('blur', abort)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])

  function beginPress(move: Move) {
    if (canPlay && !canPlay(move, tokenState.current)) return false
    if (locked.current || !svgRef.current) return false
    locked.current = true
    setActive(move)
    const initialCounterclockwise = counterclockwise
    setMessage(`Release to finish turning ${move.cells.join(' + ')}.`)
    const snapshot = tokenState.current
    const tracks = snapshot.flatMap(token => {
      const index = move.cycle.indexOf(token.position)
      if (index < 0) return []
      const nodes = Array.from(svgRef.current!.querySelectorAll<SVGElement>(`[data-token="${token.id}"]`))
      const previous = move.cycle[(index + move.cycle.length - 1) % move.cycle.length]
      return [{ route: perimeterRoute(move, token.position, move.cycle[(index + 1) % move.cycle.length]), reverseRoute: perimeterRoute(move, previous, token.position).reverse(), nodes }]
    })
    const start = performance.now()
    const timing = createRotationTiming(start, 320 / speed, allowReverse)
    let released = false
    let waiting = false
    let previous = 0
    const intervals: number[] = []
    function paint(nodes: SVGElement[], point: Point) {
      for (const node of nodes) {
        if (node.tagName.toLowerCase() === 'g') node.setAttribute('transform', `translate(${point.x} ${point.y})`)
        else { node.setAttribute('cx', String(point.x)); node.setAttribute('cy', String(point.y)) }
      }
    }
    function tick(now: number) {
      const { progress: relativeProgress, done, holding } = timing.sample(now)
      const progress = relativeProgress * (initialCounterclockwise ? -1 : 1)
      for (const track of tracks) paint(track.nodes, pointAlongRoute(progress < 0 ? track.reverseRoute : track.route, Math.abs(progress)))
      if (progress !== 0 && !done && previous) intervals.push(now - previous)
      previous = now
      if (holding && !released) { waiting = true; previous = 0 }
      else if (!done) animationFrame.current = requestAnimationFrame(tick)
      else {
        gesture.current = null
        const next = rotate(snapshot, progress < 0 ? [...move.cycle].reverse() : move.cycle)
        pendingFinish.current = true
        setTokens(next)
        setMoveCount(count => count + 1)
        setActive(null)
        setMessage('A little shift. A new perspective.')
        setFrameTime(intervals.length ? intervals.reduce((total, interval) => total + interval, 0) / intervals.length : null)
      }
    }
    gesture.current = {
      release() {
        if (released) return
        released = true
        if (reverseTimer.current !== null) clearTimeout(reverseTimer.current)
        const now = performance.now()
        const nextCounterclockwise = initialCounterclockwise !== (allowReverse && now - start >= REVERSE_HOLD_MS)
        setCounterclockwise(nextCounterclockwise)
        timing.release(now)
        setMessage(`Turning ${move.cells.join(' + ')} ${nextCounterclockwise ? 'counterclockwise' : 'clockwise'}…`)
        if (waiting) { waiting = false; animationFrame.current = requestAnimationFrame(tick) }
      },
      cancel() {
        if (released) return
        if (reverseTimer.current !== null) clearTimeout(reverseTimer.current)
        cancelAnimationFrame(animationFrame.current)
        for (const track of tracks) paint(track.nodes, track.route[0])
        gesture.current = null
        locked.current = false
        setActive(null)
        setMessage('Turn cancelled. Pick any tile to try again.')
      },
    }
    if (allowReverse) reverseTimer.current = setTimeout(() => {
      setCounterclockwise(!initialCounterclockwise)
      setMessage(`Release to turn ${initialCounterclockwise ? 'clockwise' : 'counterclockwise'}.`)
      if (waiting) { waiting = false; animationFrame.current = requestAnimationFrame(tick) }
    }, REVERSE_HOLD_MS)
    animationFrame.current = requestAnimationFrame(tick)
    return true
  }

  function releasePress() { gesture.current?.release() }
  function cancelPress() { gesture.current?.cancel() }
  function play(move: Move) {
    if (beginPress(move)) releasePress()
  }

  function reset() {
    if (locked.current) return
    setTokens(initialTokens())
    setMoveCount(0)
    setFrameTime(null)
    setMessage('A fresh start. There’s no wrong first move.')
  }
  function startLevel(nextTokens: Token[]) {
    if (locked.current) return
    setTokens(nextTokens)
    setMoveCount(0)
    setFrameTime(null)
    setMessage('Make every row a single color.')
  }
  function mix(availableMoves?: Move[]) {
    if (locked.current) return
    setTokens(scramble(createTokens(), 24, Math.random, availableMoves))
    setMoveCount(0)
    setFrameTime(null)
    setMessage('All mixed up. Make a little movement.')
  }

  return { tokens, active, counterclockwise, moveCount, speed, setSpeed, debug, setDebug, message, frameTime, svgRef, locked, play, beginPress, releasePress, cancelPress, reset, mix, startLevel }
}

export type Puzzle = ReturnType<typeof usePuzzle>
