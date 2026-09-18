import { completedRows, rotate, squareMoves } from './model'
import type { Move, Token } from './model'

export const TUTORIAL_KEY = 'pivio-tutorial-completed-v1'
export const tutorialMoves = squareMoves.slice(0, 3)
export function createTutorialTokens(): Token[] {
  const solved: Token[] = Array.from({ length: 8 }, (_, index) => ({
    id: `token-${index + 1}`, position: index + 1, color: index < 4 ? 'coral' : 'blue',
  }))
  return rotate(solved, [...tutorialMoves[0].cycle].reverse())
}
export function tutorialSolved(tokens: Token[]): boolean {
  return tokens.length === 8 && completedRows(tokens).length === 2
}
export function canPlayTutorial(move: Move, tokens: Token[]): boolean {
  return move.id === 'A' && !tutorialSolved(tokens)
}
export function readTutorialCompletion(): boolean {
  try { return localStorage.getItem(TUTORIAL_KEY) === 'true' } catch { return false }
}
