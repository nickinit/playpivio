import { useEffect, useRef, useState } from 'react'
import TileBoard from './TileBoard'
import { usePuzzle } from './usePuzzle'
import { moves, squareMoves } from './model'
import './styles.css'

export default function App() {
  const basicPuzzle = usePuzzle()
  const advancedPuzzle = usePuzzle()
  const [level, setLevel] = useState<1 | 10 | null>(null)
  const started = level !== null
  const puzzle = level === 1 ? basicPuzzle : advancedPuzzle
  const headingRef = useRef<HTMLHeadingElement>(null)
  const levelButtons = useRef<Partial<Record<1 | 10, HTMLButtonElement | null>>>({})
  const lastLevel = useRef<1 | 10>(10)
  const returningHome = useRef(false)
  useEffect(() => {
    if (started) headingRef.current?.focus()
    else if (returningHome.current) {
      levelButtons.current[lastLevel.current]?.focus()
      returningHome.current = false
    }
  }, [started])
  return <div className={`app-shell ${started ? '' : 'home-screen'}`}>
    <header className="site-header">
      <a className="wordmark" href="/" aria-label="Pivio home"><span className="brand-symbol" aria-hidden="true"><i /><i /><i /><i /></span>pivio<span className="wordmark-period">.</span></a>
      {started ? <button className="back-button" disabled={!!puzzle.active} onClick={() => {
        if (puzzle.locked.current) return
        returningHome.current = true
        setLevel(null)
      }}><span aria-hidden="true">←</span> Back</button> : <span className="prototype-badge"><span /> An experiment in play</span>}
    </header>
    <main>
      <section className="introduction" aria-labelledby="page-title">
        <p className="eyebrow">A LITTLE LOGIC. A LITTLE MAGIC.</p>
        <h1 id="page-title" ref={headingRef} tabIndex={-1}>Good things come around.</h1>
        <p className="subtitle">{started ? 'Press a tile. Follow the color. Find your flow.' : 'A little movement. A new perspective. Choose your level.'}</p>
      </section>
      {started ? <section className="playground" aria-label={`Level ${level} puzzle`}>
        <div className="board-meta"><span><i /> Level {level}</span><span className="move-count">Moves: <strong>{String(puzzle.moveCount).padStart(2, '0')}</strong></span></div>
        <div className="board-stage"><TileBoard key={level} puzzle={puzzle} availableMoves={level === 1 ? squareMoves : moves} /></div>
      </section> : <section className="level-selection" aria-label="Choose a level">
        {([1, 10] as const).map(choice => <button key={choice} ref={node => { levelButtons.current[choice] = node }} className="level-card" onClick={() => {
          const selectedPuzzle = choice === 1 ? basicPuzzle : advancedPuzzle
          selectedPuzzle.mix(choice === 1 ? squareMoves : moves)
          lastLevel.current = choice
          setLevel(choice)
        }}>
          <span className="level-title">Level {choice}</span>
          <span className="level-description">{choice === 1 ? 'Simple squares. A gentle beginning.' : 'Connected shapes. A new perspective.'}</span>
          <span className="level-start" aria-hidden="true">Play <span>→</span></span>
        </button>)}
      </section>}
    </main>
    <footer className="site-footer"><span className="color-signature" aria-hidden="true"><i /><i /><i /><i /><i /></span><p>No timer. No pressure. Just a little movement.</p><span className="version">PIVIO · INTERACTION STUDY 01</span></footer>
  </div>
}
