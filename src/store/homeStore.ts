import { create } from "zustand";

export interface HomeState {
  selectedPackageId: string | null;
  selectedServiceId: string | null;
  setSelectedPackageId: (packageId: string | null) => void;
  setSelectedServiceId: (serviceId: string | null) => void;
  reset: () => void;
}

const initialState = {
  selectedPackageId: "1",
  selectedServiceId: null,
};

export const useHomeStore = create<HomeState>((set) => ({
  ...initialState,
  setSelectedPackageId: (packageId) => set({ selectedPackageId: packageId }),
  setSelectedServiceId: (serviceId) => set({ selectedServiceId: serviceId }),
  reset: () => set(initialState),
}));
