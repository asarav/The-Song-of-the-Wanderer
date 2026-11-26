import { create } from 'zustand'

export type BootScreen = 'title' | 'roadmap'

interface AppStore {
  screen: BootScreen
  setScreen: (screen: BootScreen) => void
}

/**
 * App-level UI state only. Game state will live in a separate store in M2,
 * which dispatches commands into the pure engine. Keep the two apart.
 */
export const useAppStore = create<AppStore>((set) => ({
  screen: 'title',
  setScreen: (screen) => set({ screen }),
}))
