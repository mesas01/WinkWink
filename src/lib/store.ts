import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "./i18n";
interface Preferences { lang: Lang; theme: "light" | "dark"; employeePreview: boolean; setLang: (lang: Lang) => void; toggleTheme: () => void; setEmployeePreview: (employeePreview: boolean) => void }
export const useApp = create<Preferences>()(persist((set) => ({ lang: "es", theme: "light", employeePreview: false, setLang: (lang) => set({ lang }), toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })), setEmployeePreview: (employeePreview) => set({ employeePreview }) }), { name: "winkwink-preferences" }));
