import { useState, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import {
  Undo,
  Redo,
  Magnet,
  Grid3x3,
  FileDown,
  Save,
  Eye,
  Minimize2,
  Maximize2,
  ArrowLeft,
  Download,
} from "lucide-react";
import { Furniture3D, Room3D, Wall, FURNITURE_CATALOG } from "./types";
import { Viewport3D } from "./viewport-3d";
import { InspectorPanel } from "./inspector-panel";
import { FurnitureLibrary } from "./furniture-library";
import { ProductionCalculator } from "./production-calculator";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

type TransformMode = "translate" | "rotate" | "scale";

export function Configurator3D() {
  const [furniture, setFurniture] = useState<Furniture3D[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState<TransformMode>("translate");
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [viewMode, setViewMode] = useState<"3d" | "top" | "front">("3d");

  const [room] = useState<Room3D>({
    width: 6,
    height: 3,
    depth: 5,
  });

  const [walls] = useState<Wall[]>([
    {
      id: "wall-back",
      position: [0, 1.5, -2.5],
      rotation: 0,
      length: 6,
      height: 3,
      thickness: 0.0,
    },
    {
      id: "wall-left",
      position: [-3, 1.5, 0],
      rotation: Math.PI / 2,
      length: 5,
      height: 3,
      thickness: 0.0,
    }
   
  ]);

  const [history, setHistory] = useState<Furniture3D[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const selectedFurniture = furniture.find((f) => f.id === selectedId) || null;

  // Add to history
  const addToHistory = useCallback(
    (newFurniture: Furniture3D[]) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(newFurniture)));
        return newHistory;
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  // Add furniture from catalog
 // Wewnątrz Configurator3D -> handleAddFurniture
const handleAddFurniture = (
  catalogItem: (typeof FURNITURE_CATALOG)[keyof typeof FURNITURE_CATALOG][number],
  category: string
) => {
  const newFurniture: Furniture3D = {
    id: `furniture-${Date.now()}`,
    name: catalogItem.name,
    category: category as Furniture3D["category"],
    position: [0, (catalogItem.dimensions.height / 2000), 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    dimensions: catalogItem.dimensions,
    material: catalogItem.material,
    frontType: catalogItem.frontType,
    basePrice: catalogItem.basePrice,
    hardware: catalogItem.hardware,
    snapPoints: catalogItem.snapPoints,
    isAppliance: catalogItem.isAppliance,
    // DODAJ TO: Upewnij się, że pobierasz wartość z katalogu lub ustawiasz startową
    shelfCount: catalogItem.shelfCount ?? 2, 
    requiresSupport: catalogItem.requiresSupport,
  };

  const updated = [...furniture, newFurniture];
  setFurniture(updated);
  setSelectedId(newFurniture.id);
  addToHistory(updated);
  toast.success(`Dodano ${catalogItem.name}`);
};

  // Transform furniture
  const handleTransformFurniture = (
    id: string,
    position: [number, number, number],
    rotation: [number, number, number],
    scale: [number, number, number]
  ) => {
    const updated = furniture.map((f) =>
      f.id === id ? { ...f, position, rotation, scale } : f
    );
    setFurniture(updated);
  };

  // Update furniture
  const handleUpdateFurniture = (
    id: string,
    updates: Partial<Furniture3D>
  ) => {
    const updated = furniture.map((f) => (f.id === id ? { ...f, ...updates } : f));
    setFurniture(updated);
    addToHistory(updated);
  };

  // Delete furniture
  const handleDeleteFurniture = (id: string) => {
    const updated = furniture.filter((f) => f.id !== id);
    setFurniture(updated);
    setSelectedId(null);
    addToHistory(updated);
    toast.info("Usunięto element");
  };

  // Duplicate furniture
  const handleDuplicateFurniture = (id: string) => {
    const original = furniture.find((f) => f.id === id);
    if (original) {
      const duplicate: Furniture3D = {
        ...JSON.parse(JSON.stringify(original)),
        id: `furniture-${Date.now()}`,
        position: [
          original.position[0] + 0.7,
          original.position[1],
          original.position[2],
        ],
      };
      const updated = [...furniture, duplicate];
      setFurniture(updated);
      setSelectedId(duplicate.id);
      addToHistory(updated);
      toast.success("Zduplikowano element");
    }
  };

  // Undo/Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setFurniture(JSON.parse(JSON.stringify(history[historyIndex - 1])));
      toast.info("Cofnięto");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setFurniture(JSON.parse(JSON.stringify(history[historyIndex + 1])));
      toast.info("Ponowiono");
    }
  };

  // Export PDF
  const handleExportPDF = () => {
    toast.info("Generowanie dokumentacji technicznej...");

    try {
      const production = ProductionCalculator.calculateProduction(furniture);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Title page
      pdf.setFontSize(24);
      pdf.text("Dokumentacja Techniczna", 15, 20);
      pdf.setFontSize(10);
      pdf.text(`Data: ${new Date().toLocaleDateString("pl-PL")}`, 15, 30);

      let y = 45;

      // Project summary
      pdf.setFontSize(16);
      pdf.text("Podsumowanie projektu", 15, y);
      y += 10;

      pdf.setFontSize(10);
      pdf.text(`Wymiary pomieszczenia: ${room.width}m × ${room.height}m × ${room.depth}m`, 15, y);
      y += 7;
      pdf.text(`Liczba elementów: ${furniture.length}`, 15, y);
      y += 7;
      pdf.text(
        `Całkowita powierzchnia płyt: ${production.totalPanelArea.toFixed(2)} m²`,
        15,
        y
      );
      y += 7;
      y += 7;
      pdf.text(
        `Koszt całkowity: ${production.totalPrice.toLocaleString("pl-PL")} PLN`,
        15,
        y
      );
      y += 15;

      // Cutting list
      pdf.setFontSize(16);
      pdf.text("Lista formatek do cięcia", 15, y);
      y += 10;

      pdf.setFontSize(8);
      production.panelCuttingList.forEach((cut) => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(
          `${cut.furnitureName} - ${cut.panelType}: ${cut.width}×${cut.height}mm (${cut.material}) ×${cut.quantity}`,
          20,
          y
        );
        y += 5;
      });

      y += 10;
      if (y > 250) {
        pdf.addPage();
        y = 20;
      }

      // Hardware list
      pdf.setFontSize(16);
      pdf.text("Zestawienie okuć i akcesoriów", 15, y);
      y += 10;

      pdf.setFontSize(8);
      production.hardwareList.forEach((hw) => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(
          `${hw.name}: ${hw.quantity} szt. × ${hw.pricePerUnit} PLN = ${(
            hw.quantity * hw.pricePerUnit
          ).toFixed(2)} PLN`,
          20,
          y
        );
        y += 5;
      });

      // Save
      pdf.save(`projekt-meble-${Date.now()}.pdf`);
      toast.success("Dokumentacja wygenerowana!");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Błąd generowania PDF");
    }
  };

  // Save project
  const handleSaveProject = () => {
    const projectData = {
      furniture,
      room,
      walls,
      timestamp: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `projekt-3d-${Date.now()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Projekt zapisany!");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Transform modes
      if (e.key === "g" || e.key === "G") {
        setTransformMode("translate");
        toast.info("Tryb: Przesuwanie");
      }
      if (e.key === "r" || e.key === "R") {
        setTransformMode("rotate");
        toast.info("Tryb: Obrót");
      }
      if ((e.key === "s" || e.key === "S") && !e.ctrlKey && !e.metaKey) {
        setTransformMode("scale");
        toast.info("Tryb: Skalowanie");
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if (
        ((e.ctrlKey || e.metaKey) && e.key === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z")
      ) {
        e.preventDefault();
        handleRedo();
      }

      // Delete
      if (e.key === "Delete" && selectedId) {
        handleDeleteFurniture(selectedId);
      }

      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === "d" && selectedId) {
        e.preventDefault();
        handleDuplicateFurniture(selectedId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, historyIndex]);

  const production = ProductionCalculator.calculateProduction(furniture);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      {/* Top Toolbar */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="h-16 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 flex items-center justify-between px-6 shadow-xl"
      >
        <div className="flex items-center gap-4">
          <motion.a
            href="/"
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Powrót</span>
          </motion.a>
          <div className="h-8 w-px bg-gray-700" />
          <div>
            <h1 className="text-lg font-bold text-white">
              Konfigurator Produkcyjny 3D
            </h1>
            <p className="text-xs text-gray-400">
              Profesjonalny system projektowania mebli B2B
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className="p-2 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Cofnij (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRedo}
            disabled={historyIndex === history.length - 1}
            className="p-2 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Ponów (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </motion.button>

          <div className="h-8 w-px bg-gray-700 mx-2" />

          {/* Transform modes */}
          <div className="flex gap-1 bg-gray-800 rounded p-1">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setTransformMode("translate")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                transformMode === "translate"
                  ? "bg-red-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Przesuwanie (G)"
            >
              Move
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setTransformMode("rotate")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                transformMode === "rotate"
                  ? "bg-green-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Obrót (R)"
            >
              Rotate
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setTransformMode("scale")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                transformMode === "scale"
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Skalowanie (S)"
            >
              Scale
            </motion.button>
          </div>

          <div className="h-8 w-px bg-gray-700 mx-2" />

          {/* Snap toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSnapEnabled(!snapEnabled);
              toast.info(
                snapEnabled ? "Snapping wyłączony" : "Snapping włączony"
              );
            }}
            className={`p-2 rounded transition-colors ${
              snapEnabled
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
            title="Inteligentne przyciąganie"
          >
            <Magnet className="w-4 h-4" />
          </motion.button>

          <div className="h-8 w-px bg-gray-700 mx-2" />

          {/* Export buttons */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveProject}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded flex items-center gap-2 text-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            Zapisz
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportPDF}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded flex items-center gap-2 text-sm font-semibold transition-colors shadow-lg"
          >
            <Download className="w-4 h-4" />
            Eksportuj PDF
          </motion.button>
        </div>
      </motion.div>

      {/* Main workspace */}
      <div className="flex-1 flex overflow-hidden">
        <FurnitureLibrary onAddFurniture={handleAddFurniture} />

        <div className="flex-1 relative">
          <Viewport3D
            furniture={furniture}
            walls={walls}
            room={room}
            selectedId={selectedId}
            transformMode={transformMode}
            snapEnabled={snapEnabled}
            onSelectFurniture={setSelectedId}
            onTransformFurniture={handleTransformFurniture}
          />

          {/* Production stats overlay */}
          <div className="absolute bottom-4 left-4 right-4 bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-lg p-4 shadow-2xl">
            <div className="grid grid-cols-3 gap-12">
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Elementy
                </div>
                <div className="text-2xl font-bold text-white">
                  {furniture.length}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Płyty
                </div>
                <div className="text-2xl font-bold text-blue-400">
                  {production.totalPanelArea.toFixed(2)} m²
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Koszt całkowity
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {production.totalPrice.toLocaleString("pl-PL")} PLN
                </div>
              </div>
            </div>
          </div>
        </div>

        <InspectorPanel
          selectedFurniture={selectedFurniture}
          onUpdateFurniture={handleUpdateFurniture}
          onDeleteFurniture={handleDeleteFurniture}
          onDuplicateFurniture={handleDuplicateFurniture}
        />
      </div>
    </div>
  );
}
