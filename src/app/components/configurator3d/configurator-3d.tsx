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
import { loadRobotoBase64 } from "../../../fonts/roboto";
import { toast } from "sonner";
import { useProjectStore } from "../../store/project-store";
import { getWallsBoundingBoxCenter } from "../../utils/geometry-2d";

type TransformMode = "translate" | "rotate" | "scale";

export function Configurator3D() {
  const {
    furniture,
    walls,
    room,
    historyIndex,
    history,
    addFurniture,
    updateFurniture,
    removeFurniture,
    setFurniture,
    autoGenerateCountertops,
    undo,
    redo,
    getProjectData,
  } = useProjectStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState<TransformMode>("translate");
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [viewMode, setViewMode] = useState<"3d" | "top" | "front">("3d");

  const selectedFurniture = furniture.find((f) => f.id === selectedId) || null;
  const canvasCenterPx = getWallsBoundingBoxCenter(walls);

  // Add furniture from catalog
  const handleAddFurniture = (
    catalogItem: (typeof FURNITURE_CATALOG)[keyof typeof FURNITURE_CATALOG][number],
    category: string
  ) => {
    const itemHeight = catalogItem.dimensions?.height ?? 800;

    const newFurniture: Furniture3D = {
      id: `furniture-${Date.now()}`,
      name: catalogItem.name || "Mebel",
      category: category as Furniture3D["category"],
      position: [0, itemHeight / 2000, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      dimensions: catalogItem.dimensions!,
      material: catalogItem.material!,
      frontType: catalogItem.frontType!,
      basePrice: catalogItem.basePrice ?? 0,
      hardware: catalogItem.hardware ?? [],
      snapPoints: catalogItem.snapPoints!,
      isAppliance: catalogItem.isAppliance ?? false,
      shelfCount: (catalogItem as any).shelfCount ?? 2,
      guides: (catalogItem as any).guides,
      requiresSupport: catalogItem.requiresSupport ?? false,
    };

    addFurniture(newFurniture);
    setSelectedId(newFurniture.id);
    toast.success(`Dodano ${catalogItem.name}`);
  };

  // Transform furniture
  const handleTransformFurniture = (
    id: string,
    position: [number, number, number],
    rotation: [number, number, number],
    scale: [number, number, number]
  ) => {
    // Only update local array to prevent lag, we can commit to store on mouse up ideally, but this works for now.
    updateFurniture(id, { position, rotation, scale });
  };

  // Update furniture
  const handleUpdateFurniture = (
    id: string,
    updates: Partial<Furniture3D>
  ) => {
    updateFurniture(id, updates);
  };

  // Delete furniture
  const handleDeleteFurniture = (id: string) => {
    removeFurniture(id);
    setSelectedId(null);
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
      addFurniture(duplicate);
      setSelectedId(duplicate.id);
      toast.success("Zduplikowano element");
    }
  };

  // Undo/Redo - wrapped store methods for toasts
  const handleUndo = () => {
    if (historyIndex > 0) {
      undo();
      toast.info("Cofnięto");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      redo();
      toast.info("Ponowiono");
    }
  };

  // Export PDF
  const handleExportPDF = async () => {
    toast.info("Generowanie dokumentacji technicznej...");

    try {
      const production = ProductionCalculator.calculateProduction(furniture);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Register Roboto font so that Polish letters like ąęćńłóśżźć are rendered correctly
      const robotoBase64 = await loadRobotoBase64();
      pdf.addFileToVFS("Roboto-Regular.ttf", robotoBase64);
      pdf.addFont("Roboto-Regular.ttf", "Roboto", "normal");
      pdf.setFont("Roboto");

      let y = 15;
      const margin = 15;
      const pageWidth = pdf.internal.pageSize.getWidth();

      // --- Header / Title ---
      pdf.setFontSize(22);
      pdf.setTextColor(30, 41, 59); // Slate 800
      pdf.text("Projekt Pomieszczenia", margin, y);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139); // Slate 500
      pdf.text(`Wygenerowano: ${new Date().toLocaleString("pl-PL")}`, pageWidth - margin, y, { align: "right" });
      
      y += 8;
      pdf.setDrawColor(226, 232, 240); // Slate 200
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;

      // --- 3D Scene Screenshot ---
      const canvas = document.querySelector('canvas');
      if (canvas) {
        try {
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - (margin * 2);
          // calculate proportional height
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
          y += imgHeight + 10;
        } catch (e) {
          console.error("Failed to capture 3D canvas screenshot.", e);
        }
      }

      // Automatically add new page if needed
      const checkPageBreak = (spaceNeeded: number) => {
         if (y + spaceNeeded > 280) {
            pdf.addPage();
            y = margin + 5;
            return true;
         }
         return false;
      };

      // --- Room & Walls Properties ---
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42); 
      pdf.text("Parametry ścian", margin, y);
      y += 8;

      pdf.setFontSize(10);
      pdf.setTextColor(71, 85, 105);
      
      // Draw Wall Table Headers
      pdf.setFont("Roboto", "bold");
      pdf.text("Ściana", margin, y);
      pdf.text("Długość (mm)", margin + 40, y);
      pdf.text("Kąt (°)", margin + 80, y);
      pdf.line(margin, y + 2, margin + 120, y + 2);
      y += 7;
      
      pdf.setFont("Roboto", "normal");
      walls.forEach((wall, idx) => {
         checkPageBreak(10);
         // Compute distance & angle from existing nodes
         const dx = wall.endNode[0] - wall.startNode[0];
         const dy = wall.endNode[1] - wall.startNode[1];
         const rawAngle = Math.atan2(dy, dx) * 180 / Math.PI;
         let angleDeg = Math.round(rawAngle % 360);
         if (angleDeg < 0) angleDeg += 360;
         
         const distMm = Math.round(Math.sqrt(dx*dx + dy*dy) * 10);
         
         pdf.text(`${idx + 1}`, margin, y);
         pdf.text(`${distMm}`, margin + 40, y);
         pdf.text(`${angleDeg}°`, margin + 80, y);
         y += 6;
      });
      y += 5;
      
      checkPageBreak(30);

      // --- Project Summary ---
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42);
      pdf.text("Podsumowanie projektu", margin, y);
      y += 8;

      pdf.setFontSize(11);
      pdf.setTextColor(30, 41, 59);
      pdf.text(`Liczba elementów meblowych: ${furniture.length}`, margin, y);
      y += 6;
      pdf.text(`Całkowita powierzchnia płyt: ${production.totalPanelArea.toFixed(2)} m²`, margin, y);
      y += 6;
      
      pdf.setFont("Roboto", "bold");
      pdf.text(`Koszt całkowity: ${production.totalPrice.toLocaleString("pl-PL")} PLN`, margin, y);
      pdf.setFont("Roboto", "normal");
      y += 15;

      // --- Cutting list ---
      checkPageBreak(25);
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42);
      pdf.text("Lista formatek do cięcia", margin, y);
      y += 8;

      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      production.panelCuttingList.forEach((cut) => {
        checkPageBreak(6);
        pdf.text(
          `• ${cut.furnitureName} - ${cut.panelType}: ${cut.width}×${cut.height}mm (${cut.material}) ×${cut.quantity}`,
          margin,
          y
        );
        y += 5;
      });

      y += 10;
      checkPageBreak(25);

      // --- Hardware list ---
      pdf.setFontSize(16);
      pdf.setTextColor(15, 23, 42);
      pdf.text("Zestawienie okuć i akcesoriów", margin, y);
      y += 8;

      pdf.setFontSize(9);
      pdf.setTextColor(71, 85, 105);
      production.hardwareList.forEach((hw) => {
        checkPageBreak(6);
        pdf.text(
          `• ${hw.name}: ${hw.quantity} szt. × ${hw.pricePerUnit} PLN = ${(
            hw.quantity * hw.pricePerUnit
          ).toFixed(2)} PLN`,
          margin,
          y
        );
        y += 5;
      });

      // Save
      pdf.save(`projekt-pomieszczenia-${Date.now()}.pdf`);
      toast.success("Dokumentacja wygenerowana!");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Błąd generowania PDF");
    }
  };

  // Save project
  const handleSaveProject = () => {
    const projectData = getProjectData();

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

          {/* New Generuj Blaty button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              autoGenerateCountertops();
              toast.success("Połączono szafki blatami!");
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-emerald-900/20"
          >
            <Grid3x3 className="w-4 h-4" />
            <span>Generuj Blaty</span>
          </motion.button>

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
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-gray-800 text-gray-400"
            }`}
            title="Magnetyczne przyciąganie"
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
            canvasCenterPx={canvasCenterPx}
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
