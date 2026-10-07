import { create } from "zustand";
import { persist } from "zustand/middleware";

type PrivacyState = {
  amountsHidden: boolean;
  toggleAmountsHidden: () => void;
};

export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set) => ({
      amountsHidden: false,
      toggleAmountsHidden: () => set((state) => ({ amountsHidden: !state.amountsHidden })),
    }),
    { name: "billtrail-privacy" },
  ),
);