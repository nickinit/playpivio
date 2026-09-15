export const PRESS_PROGRESS = .08

export function createRotationTiming(start: number, duration: number) {
  const pressDuration = Math.max(60, duration * PRESS_PROGRESS)
  let releasedAt: number | null = null
  const ease = (progress: number) => progress * progress * (3 - 2 * progress)
  return {
    release(now: number) {
      releasedAt ??= Math.max(now, start + pressDuration)
    },
    sample(now: number) {
      if (releasedAt !== null && now >= releasedAt) {
        const progress = Math.min(1, (now - releasedAt) / (duration * (1 - PRESS_PROGRESS)))
        return { progress: PRESS_PROGRESS + (1 - PRESS_PROGRESS) * ease(progress), done: progress === 1, holding: false }
      }
      const progress = Math.max(0, Math.min(1, (now - start) / pressDuration))
      return { progress: PRESS_PROGRESS * ease(progress), done: false, holding: progress === 1 }
    },
  }
}
