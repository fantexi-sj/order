import { create } from 'zustand'

interface CounterState {
    num: number
    add: () => void
    minus: () => void
    asyncAdd: () => void
}

const useCounterStore = create<CounterState>((set, get) => ({
    num: 0,
    add: () => set((state) => ({ num: state.num + 1 })),
    minus: () => set((state) => ({ num: state.num - 1 })),
    asyncAdd: () => {
        setTimeout(() => {
            get().add()
        }, 2000)
    }
}))

export default useCounterStore