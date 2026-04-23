import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAppStore = create(
  persist(
    (set) => ({
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),

      activeProject: null,
      setActiveProject: (project) => set({ activeProject: project }),

      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: "jira-clone-store",
      partialize: (state) => ({
        currentUser: state.currentUser,
        activeProject: state.activeProject,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);