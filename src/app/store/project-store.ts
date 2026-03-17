import { create } from "zustand";
import { Furniture3D, Room3D, Wall } from "../components/configurator3d/types";
import { CountertopManager } from "../utils/countertop-manager";

// New Door Type
export interface Door {
  id: string;
  wallId: string;
  distanceFromStart: number; // Distance from the start node of the wall (in mm)
  width: number; // in mm
  height: number; // in mm
}

// Extended Wall Type (2D Nodes to 3D)
export interface Wall2D extends Wall {
  startNode: [number, number]; // [x, z] coordinates in mm
  endNode: [number, number];   // [x, z] coordinates in mm
  isSemiWall: boolean;
}

interface ProjectState {
  // Global View State
  isSetupComplete: boolean;
  startMode: "menu" | "drawing" | "preset_selection";
  
  // Room State
  room: Room3D;
  walls: Wall2D[];
  doors: Door[];
  
  // Furniture State
  furniture: Furniture3D[];
  
  // History
  history: {
    furniture: Furniture3D[];
    walls: Wall2D[];
    doors: Door[];
  }[];
  historyIndex: number;

  // Actions
  setSetupComplete: (complete: boolean) => void;
  setStartMode: (mode: "menu" | "drawing" | "preset_selection") => void;
  setRoom: (room: Room3D) => void;
  
  // Wall Actions
  setWalls: (walls: Wall2D[]) => void;
  updateWall: (id: string, updates: Partial<Wall2D>) => void;
  
  // Door Actions
  addDoor: (door: Door) => void;
  updateDoor: (id: string, updates: Partial<Door>) => void;
  removeDoor: (id: string) => void;
  
  // Furniture Actions
  addFurniture: (item: Furniture3D) => void;
  updateFurniture: (id: string, updates: Partial<Furniture3D>) => void;
  removeFurniture: (id: string) => void;
  setFurniture: (furniture: Furniture3D[]) => void;
  autoGenerateCountertops: () => void;
  
  // History Actions
  undo: () => void;
  redo: () => void;
  addToHistory: () => void;
  
  // Project Actions
  importProject: (projectData: any) => void;
  getProjectData: () => any;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  isSetupComplete: false,
  startMode: "menu",
  
  room: { width: 6, height: 3, depth: 5 },
  walls: [],
  doors: [],
  furniture: [],
  
  history: [{ furniture: [], walls: [], doors: [] }],
  historyIndex: 0,

  setSetupComplete: (complete) => set({ isSetupComplete: complete }),
  setStartMode: (mode) => set({ startMode: mode }),
  
  setRoom: (room) => set({ room }),

  // Helpers for History
  addToHistory: () => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({
        furniture: JSON.parse(JSON.stringify(state.furniture)),
        walls: JSON.parse(JSON.stringify(state.walls)),
        doors: JSON.parse(JSON.stringify(state.doors))
      });
      return {
        history: newHistory,
        historyIndex: state.historyIndex + 1
      };
    });
  },

  // Walls
  setWalls: (walls) => {
    set({ walls });
    get().addToHistory();
  },
  updateWall: (id, updates) => {
    set((state) => ({
      walls: state.walls.map(w => w.id === id ? { ...w, ...updates } : w)
    }));
    get().addToHistory();
  },

  // Doors
  addDoor: (door) => {
    set((state) => ({ doors: [...state.doors, door] }));
    get().addToHistory();
  },
  updateDoor: (id, updates) => {
    set((state) => ({
      doors: state.doors.map(d => d.id === id ? { ...d, ...updates } : d)
    }));
    get().addToHistory();
  },
  removeDoor: (id) => {
    set((state) => ({ doors: state.doors.filter(d => d.id !== id) }));
    get().addToHistory();
  },

  // Furniture
  addFurniture: (item) => {
    set((state) => ({ furniture: [...state.furniture, item] }));
    get().addToHistory();
  },
  updateFurniture: (id, updates) => {
    set((state) => ({
      furniture: state.furniture.map(f => f.id === id ? { ...f, ...updates } : f)
    }));
    get().addToHistory();
  },
  removeFurniture: (id) => {
    set((state) => ({ furniture: state.furniture.filter(f => f.id !== id) }));
    get().addToHistory();
  },
  setFurniture: (furniture) => {
    set({ furniture });
    get().addToHistory();
  },
  autoGenerateCountertops: () => {
    set((state) => {
      const newFurnitureList = CountertopManager.generateCountertops(state.furniture);
      return { furniture: newFurnitureList };
    });
    get().addToHistory();
  },

  // History Actions
  undo: () => set((state) => {
    if (state.historyIndex > 0) {
      const prevIndex = state.historyIndex - 1;
      const prevState = state.history[prevIndex];
      return {
        historyIndex: prevIndex,
        furniture: JSON.parse(JSON.stringify(prevState.furniture)),
        walls: JSON.parse(JSON.stringify(prevState.walls)),
        doors: JSON.parse(JSON.stringify(prevState.doors)),
      };
    }
    return state;
  }),
  redo: () => set((state) => {
    if (state.historyIndex < state.history.length - 1) {
      const nextIndex = state.historyIndex + 1;
      const nextState = state.history[nextIndex];
      return {
        historyIndex: nextIndex,
        furniture: JSON.parse(JSON.stringify(nextState.furniture)),
        walls: JSON.parse(JSON.stringify(nextState.walls)),
        doors: JSON.parse(JSON.stringify(nextState.doors)),
      };
    }
    return state;
  }),

  // Import / Export
  getProjectData: () => {
    const state = get();
    return {
      furniture: state.furniture,
      room: state.room,
      walls: state.walls,
      doors: state.doors,
      timestamp: new Date().toISOString()
    };
  },
  importProject: (projectData) => {
    set({
      furniture: projectData.furniture || [],
      room: projectData.room || { width: 6, height: 3, depth: 5 },
      walls: projectData.walls || [],
      doors: projectData.doors || [],
      isSetupComplete: true, // Jump straight into editor
      history: [{
        furniture: projectData.furniture || [],
        walls: projectData.walls || [],
        doors: projectData.doors || []
      }],
      historyIndex: 0
    });
  }
}));
