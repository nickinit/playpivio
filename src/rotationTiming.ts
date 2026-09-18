export const PRESS_PROGRESS = .08
export const REVERSE_HOLD_MS = 500
export const REVERSE_PREVIEW_MS = 120

export function createRotationTiming(start: number, duration: number, allowReverse = true) {
  const pressDuration = Math.max(60, duration * PRESS_PROGRESS)
  let releasedAt: number | null = null
  let releaseProgress = PRESS_PROGRESS
  let target = 1
  const ease = (progress: number) => progress * progress * (3 - 2 * progress)
  function heldProgress(now: number) {
    if (allowReverse && now >= start + REVERSE_HOLD_MS) {
      const progress = Math.min(1, (now - start - REVERSE_HOLD_MS) / REVERSE_PREVIEW_MS)
      return { progress: PRESS_PROGRESS * (1 - 2 * ease(progress)), done: false, holding: progress === 1 }
    }
    const progress = Math.max(0, Math.min(1, (now - start) / pressDuration))
    return { progress: PRESS_PROGRESS * ease(progress), done: false, holding: progress === 1 }
  }
  return {
    release(now: number) {
      if (releasedAt !== null) return
      releasedAt = Math.max(now, start + pressDuration)
      releaseProgress = heldProgress(releasedAt).progress
      target = allowReverse && now >= start + REVERSE_HOLD_MS ? -1 : 1
    },
    sample(now: number) {
      if (releasedAt !== null && now >= releasedAt) {
        const progress = Math.min(1, (now - releasedAt) / (duration * Math.abs(target - releaseProgress)))
        return { progress: releaseProgress + (target - releaseProgress) * ease(progress), done: progress === 1, holding: false }
      }
      return heldProgress(now)
    },
  }
}
