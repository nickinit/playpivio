import TileBoard from './TileBoard'
import { usePuzzle } from './usePuzzle'
import './styles.css'

function ResetIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 6a7 7 0 1 1-1 7M4 2v5h5" /></svg>
}
function ShuffleIcon() {
  return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h2c4 0 6 10 10 10h2m-3-3 3 3-3 3M3 15h2c1.4 0 2.6-1.2 3.8-3M11 8c1.3-2 2.5-3 4-3h2m-3-3 3 3-3 3" /></svg>
}

export default function App() {
  const puzzle = usePuzzle()
  return <div className="app-shell">
    <header className="site-header">
      <a className="wordmark" href="/" aria-label="Pivio home"><span className="brand-symbol" aria-hidden="true"><i /><i /><i /><i /></span>pivio<span className="wordmark-period">.</span></a>
      <span className="prototype-badge"><span /> An experiment in play</span>
    </header>
    <main>
      <section className="introduction" aria-labelledby="page-title">
        <p className="eyebrow">A LITTLE LOGIC. A LITTLE MAGIC.</p>
        <h1 id="page-title">Good things come around.</h1>
        <p className="subtitle">Press a tile. Follow the color. Find your flow.</p>
      </section>
      <section className="playground" aria-label="Interactive puzzle prototype">
        <div className="board-meta"><span><i /> Free play</span><span className="move-count">Moves: <strong>{String(puzzle.moveCount).padStart(2, '0')}</strong></span></div>
        <div className="board-stage"><TileBoard puzzle={puzzle} /></div>
        <p className="play-hint" aria-live="polite" role="status"><span aria-hidden="true">↻</span> {puzzle.message}</p>
        <div className="primary-controls">
          <button className="control-button" disabled={!!puzzle.active} onClick={puzzle.reset}><ResetIcon />Reset</button>
          <button className="control-button shuffle-button" disabled={!!puzzle.active} onClick={puzzle.mix}><ShuffleIcon />Scramble</button>
        </div>
        <div className="settings-row">
          <div className="speed-control"><label htmlFor="speed">Animation speed <output htmlFor="speed">{puzzle.speed.toFixed(2).replace(/0$/, '')}×</output></label>
            <input id="speed" type="range" min="0.25" max="2" step="0.25" value={puzzle.speed} disabled={!!puzzle.active} onChange={event => puzzle.setSpeed(Number(event.target.value))} aria-valuetext={`${puzzle.speed} times normal speed`} />
          </div>
          <label className="debug-toggle"><input type="checkbox" checked={puzzle.debug} disabled={!!puzzle.active} onChange={event => puzzle.setDebug(event.target.checked)} /><span className="switch" aria-hidden="true" /><span>Debug</span></label>
        </div>
      </section>
    </main>
    <footer className="site-footer"><span className="color-signature" aria-hidden="true"><i /><i /><i /><i /><i /></span><p>No timer. No pressure. Just a little movement.</p><span className="version">PIVIO · INTERACTION STUDY 01</span></footer>
  </div>
}
