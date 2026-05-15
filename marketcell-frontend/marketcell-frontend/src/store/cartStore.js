import { create } from 'zustand';

export const useCartStore = create((set) => ({
  itemCount: 0,
  setItemCount: (n) => set({ itemCount: n }),
  increment: () => set((s) => ({ itemCount: s.itemCount + 1 })),
  decrement: () => set((s) => ({ itemCount: Math.max(0, s.itemCount - 1) })),
}));