import { useEffect, useRef, useState } from 'react'
import TileBoard from './TileBoard'
import { usePuzzle } from './usePuzzle'
import { ORIGIN, STEP } from './model'
import { canPlayTutorial, createTutorialTokens, readTutorialCompletion, tutorialMoves, tutorialSolved, TUTORIAL_KEY } from './tutorial'
import './styles.css'

import { createLevelStart, levels } from './levels'

type Level = number
const choices = [{ id: 0, name: 'Learn the basics in one move.' }, ...levels]

export default function App() {
  const tutorialPuzzle = usePuzzle(createTutorialTokens, canPlayTutorial, false)
  const [tutorialComplete, setTutorialComplete] = useState(readTutorialCompletion)
  const solvedTutorial = tutorialSolved(tutorialPuzzle.tokens)
  useEffect(() => {
    if (!solvedTutorial || tutorialPuzzle.moveCount === 0) return
    setTutorialComplete(true)
    try { localStorage.setItem(TUTORIAL_KEY, 'true') } catch {}
  }, [solvedTutorial, tutorialPuzzle.moveCount])
  const mainPuzzle = usePuzzle()
  const [level, setLevel] = useState<Level | null>(null)
  const started = level !== null
  const puzzle = level === 0 ? tutorialPuzzle : mainPuzzle
  const selectedLevel = levels.find(candidate => candidate.id === level)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const levelButtons = useRef<Partial<Record<Level, HTMLButtonElement | null>>>({})
  const lastLevel = useRef<Level>(0)
  const returningHome = useRef(false)
  useEffect(() => {
    if (started) headingRef.current?.focus()
    else if (returningHome.current) {
      levelButtons.current[lastLevel.current]?.focus()
      returningHome.current = false
    }
  }, [started])
  return <div className={`app-shell ${started ? '' : 'home-screen'} ${level === 0 ? 'tutorial-screen' : ''}`}>
    <header className="site-header">
      <a className="wordmark" href="/" aria-label="Pivio home"><span className="brand-symbol" aria-hidden="true"><i /><i /><i /><i /></span>pivio<span className="wordmark-period">.</span></a>
      {started ? <button className="back-button" disabled={!!puzzle.active} onClick={() => {
        if (puzzle.locked.current) return
        returningHome.current = true
        setLevel(null)
      }}><span aria-hidden="true">←</span> Back</button> : <span className="prototype-badge"><span /> An experiment in play</span>}
    </header>
    <main>
      {level === 0 ? <section className="tutorial-introduction" aria-labelledby="page-title">
        {!solvedTutorial && <p className="tutorial-goal">Your goal: make every row a single color.</p>}
        <h1 id="page-title" ref={headingRef} tabIndex={-1} aria-live="polite">
          {solvedTutorial ? <>Well done! Both rows match.<span>You’re ready to play.</span></> : <>Press the left tile to move its dots clockwise.<span>Release to finish.</span></>}
        </h1>
      </section> : <section className="introduction" aria-labelledby="page-title">
        <p className="eyebrow">PIVIO · COLOR PUZZLE</p>
        <h1 id="page-title" ref={headingRef} tabIndex={-1}>{started ? 'Make every row one color.' : 'Choose your level.'}</h1>
        <p className="subtitle">{started ? 'Press to turn. Hold to switch direction. Release to finish.' : 'Start with the basics. Find your next challenge.'}</p>
      </section>}
      {started ? <section className="playground" aria-label={`Level ${level} puzzle`}>
        {level !== 0 && <div className="board-meta"><span><i /> Level {level}</span><span className="direction-indicator" role="status" aria-live="polite" aria-label={`Rotation: ${puzzle.counterclockwise ? 'counterclockwise' : 'clockwise'}`} title={`${puzzle.counterclockwise ? 'Counterclockwise' : 'Clockwise'} · Hold a tile to switch`}><span aria-hidden="true">{puzzle.counterclockwise ? '↺' : '↻'}</span></span><span className="move-count">Moves: <strong>{String(puzzle.moveCount).padStart(2, '0')}</strong></span></div>}
        <div className="board-stage"><TileBoard key={level} puzzle={puzzle} availableMoves={level === 0 ? tutorialMoves : selectedLevel!.moves} boardHeight={level === 0 ? ORIGIN * 2 + STEP : undefined} enabledMoveIds={level === 0 ? solvedTutorial ? [] : ['A'] : undefined} tutorialTileId={level === 0 ? 'A' : undefined} /></div>
        {level === 0 && !solvedTutorial && <p className="tutorial-hint">Only the left tile is active. Press tiles, not dots.</p>}
        {level === 0 && solvedTutorial && <button className="tutorial-continue" onClick={() => { returningHome.current = true; setLevel(null) }}>Choose a level →</button>}
      </section> : <section className="level-selection" aria-label="Choose a level">
        {choices.map(({ id: choice, name }) => <button key={choice} ref={node => { levelButtons.current[choice] = node }} className="level-card" disabled={choice !== 0 && !tutorialComplete} onClick={() => {
          if (choice !== 0 && !tutorialComplete) return
          if (choice === 0) tutorialPuzzle.reset()
          if (choice !== 0) mainPuzzle.startLevel(createLevelStart(levels.find(candidate => candidate.id === choice)!).tokens)
          lastLevel.current = choice
          setLevel(choice)
        }}>
          <span className="level-title">Level {choice}</span>
          <span className="level-description">{name}</span>
          <span className="level-start" aria-hidden="true">{choice !== 0 && !tutorialComplete ? 'Complete Level 0 first' : choice === 0 && tutorialComplete ? 'Replay →' : 'Play →'}</span>
        </button>)}
      </section>}
    </main>
    {level !== 0 && <footer className="site-footer"><span className="color-signature" aria-hidden="true"><i /><i /><i /><i /><i /></span><p>No timer. No pressure. Just a little movement.</p><span className="version">PIVIO · INTERACTION STUDY 01</span></footer>}
  </div>
}
