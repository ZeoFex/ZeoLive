import { create } from "zustand";

interface BookingState {
  selectedTutorId: string | null;
  selectedDate: string | null;
  selectedTime: string | null;
  setTutor: (id: string | null) => void;
  setDate: (date: string | null) => void;
  setTime: (time: string | null) => void;
  reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedTutorId: null,
  selectedDate: null,
  selectedTime: null,
  setTutor: (id) => set({ selectedTutorId: id }),
  setDate: (date) => set({ selectedDate: date }),
  setTime: (time) => set({ selectedTime: time }),
  reset: () =>
    set({ selectedTutorId: null, selectedDate: null, selectedTime: null }),
}));
