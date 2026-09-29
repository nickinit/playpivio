import { useEffect, useRef } from 'react'
import { BALL_COLORS } from './TileBoard'

export default function Completion({ level, moves, onContinue }: { level: number; moves: number; onContinue: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])
  return <dialog ref={dialog} className="completion" aria-labelledby="completion-title" aria-describedby="completion-message" onCancel={event => { event.preventDefault(); onContinue() }}>
    <div className="celebration-dots" aria-hidden="true">
      {Object.values(BALL_COLORS).map((color, index) => <span key={color} style={{ background: color, animationDelay: `${index * 90}ms` }} />)}
    </div>
    <p className="eyebrow">LEVEL {level} COMPLETE</p>
    <h2 id="completion-title">Perfectly in place.</h2>
    <p id="completion-message">Every row, one color. Nicely done!</p>
    <p className="completion-moves">{moves} {moves === 1 ? 'move' : 'moves'}</p>
    <button autoFocus className="completion-continue" onClick={onContinue}>Pick next level →</button>
  </dialog>
}
