import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "motion/react";
import {
  Undo,
  Redo,
  Grid3x3,
  ArrowLeft,
  Save,
} from "lucide-react";
import { Furniture, Room } from "./types";
import { CalculatorCanvas } from "./calculator-canvas";
import { FurniturePanel } from "./furniture-panel";
import { PropertiesPanel } from "./properties-panel";
import { BottomBar } from "./bottom-bar";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { loadRobotoBase64 } from "../../../fonts/roboto"; // dynamic loader returns a base64 string

export function Calculator3D() {
  const [furniture, setFurniture] = useState<Furniture[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room>({
    width: 400,
    height: 300,
    points: [],
  });
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [history, setHistory] = useState<Furniture[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const selectedFurniture = furniture.find((f) => f.id === selectedId) || null;

  const addToHistory = useCallback((newFurniture: Furniture[]) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(newFurniture)));
      return newHistory;
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const handleAddFurniture = (
    name: string,
    width: number,
    height: number,
    price: number,
    category: string
  ) => {
    const newFurniture: Furniture = {
      id: Date.now().toString(),
      type: name,
      name,
      x: 50,
      y: 50,
      width,
      height,
      price,
      category,
    };

    const updated = [...furniture, newFurniture];
    setFurniture(updated);
    setSelectedId(newFurniture.id);
    addToHistory(updated);
  };

  const handleMoveFurniture = (id: string, x: number, y: number) => {
    const updated = furniture.map((f) =>
      f.id === id ? { ...f, x, y } : f
    );
    setFurniture(updated);
  };

  const handleUpdateFurniture = (id: string, updates: Partial<Furniture>) => {
    const updated = furniture.map((f) =>
      f.id === id ? { ...f, ...updates } : f
    );
    setFurniture(updated);
    addToHistory(updated);
  };

  const handleDeleteFurniture = (id: string) => {
    const updated = furniture.filter((f) => f.id !== id);
    setFurniture(updated);
    setSelectedId(null);
    addToHistory(updated);
  };

  const handleDuplicateFurniture = (id: string) => {
    const original = furniture.find((f) => f.id === id);
    if (original) {
      const duplicate: Furniture = {
        ...original,
        id: Date.now().toString(),
        x: original.x + 20,
        y: original.y + 20,
      };
      const updated = [...furniture, duplicate];
      setFurniture(updated);
      setSelectedId(duplicate.id);
      addToHistory(updated);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setFurniture(JSON.parse(JSON.stringify(history[historyIndex - 1])));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setFurniture(JSON.parse(JSON.stringify(history[historyIndex + 1])));
    }
  };

  const handleUpdateRoom = (width: number, height: number) => {
    setRoom({ ...room, width, height });
  };

  const calculateTotalArea = () => {
    return furniture.reduce((sum, f) => {
      return sum + (f.width * f.height) / 10000; // cm² to m²
    }, 0);
  };

  const calculateTotalPrice = () => {
    return furniture.reduce((sum, f) => sum + f.price, 0);
  };

// Zwróć uwagę na ten nowy import na górze pliku (zaraz go stworzymy!)

  const handleExportPDF = async () => {
    if (!canvasContainerRef.current) return;

    try {
      const canvas = await html2canvas(canvasContainerRef.current, {
        backgroundColor: "#faf9f7",
        scale: 2,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      // --- NOWY KOD: Dodawanie polskiej czcionki ---
      // pobieramy TTF jako base64 i rejestrujemy w VFS
      const robotoBase64 = await loadRobotoBase64();
      pdf.addFileToVFS("Roboto-Regular.ttf", robotoBase64);
      pdf.addFont("Roboto-Regular.ttf", "Roboto", "normal");
      pdf.setFont("Roboto");
      // ---------------------------------------------

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      
      // Add summary page
      pdf.addPage();
      pdf.setFontSize(20);
      
      // Od teraz pdf.text() będzie używać Roboto, więc polskie znaki zadziałają!
      pdf.text("Podsumowanie projektu", 40, 40);
      
      pdf.setFontSize(14);
      let y = 80;
      pdf.text(`Wymiary pokoju: ${room.width} × ${room.height} cm`, 40, y);
      y += 30;
      pdf.text(`Powierzchnia zabudowy: ${calculateTotalArea().toFixed(2)} m²`, 40, y);
      y += 30;
      pdf.text(`Liczba elementów: ${furniture.length}`, 40, y);
      y += 30;
      pdf.text(`Całkowita cena: ${calculateTotalPrice().toLocaleString("pl-PL")} PLN`, 40, y);
      
      y += 50;
      pdf.setFontSize(16);
      pdf.text("Lista mebli:", 40, y);
      y += 30;
      
      pdf.setFontSize(12);
      furniture.forEach((item, index) => {
        pdf.text(
          `${index + 1}. ${item.name} - ${item.width}×${item.height}cm - ${item.price} PLN`,
          40,
          y
        );
        y += 20;
      });

      pdf.save("projekt-interior-vision.pdf");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Wystąpił błąd podczas eksportu PDF");
    }
  };

  const handleExportImage = async () => {
    if (!canvasContainerRef.current) return;

    try {
      const canvas = await html2canvas(canvasContainerRef.current, {
        backgroundColor: "#faf9f7",
        scale: 2,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = "projekt-interior-vision.png";
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error("Error exporting image:", error);
      alert("Wystąpił błąd podczas eksportu obrazu");
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === "Delete" && selectedId) {
        handleDeleteFurniture(selectedId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d" && selectedId) {
        e.preventDefault();
        handleDuplicateFurniture(selectedId);
      }
    },
    [selectedId, historyIndex]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Top Toolbar */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-16 bg-gray-900 border-b border-white/10 flex items-center justify-between px-6"
      >
        <div className="flex items-center gap-4">
          <motion.a
            href="/"
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 text-white hover:text-blue-400"
          >
            <ArrowLeft className="w-5 h-5" />
            Powrót
          </motion.a>
          <div className="h-8 w-px bg-white/20" />
          <h1 className="text-xl font-bold text-white">
            Kreator 3D - InteriorVision
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleUndo}
            disabled={historyIndex === 0}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Cofnij (Ctrl+Z)"
          >
            <Undo className="w-5 h-5 text-white" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRedo}
            disabled={historyIndex === history.length - 1}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Ponów (Ctrl+Y)"
          >
            <Redo className="w-5 h-5 text-white" />
          </motion.button>

          <div className="h-8 w-px bg-white/20 mx-2" />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`p-2 rounded-lg transition-colors ${
              snapToGrid
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-white/5 hover:bg-white/10"
            }`}
            title="Przyciąganie do siatki"
          >
            <Grid3x3 className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <FurniturePanel onAddFurniture={handleAddFurniture} />

        <div className="flex-1 flex flex-col p-6">
          <div ref={canvasContainerRef} className="flex-1 flex items-center justify-center">
            <CalculatorCanvas
              furniture={furniture}
              selectedId={selectedId}
              onSelectFurniture={setSelectedId}
              onMoveFurniture={handleMoveFurniture}
              room={room}
              snapToGrid={snapToGrid}
              gridSize={10}
            />
          </div>
        </div>

        <PropertiesPanel
          selectedFurniture={selectedFurniture}
          onUpdateFurniture={handleUpdateFurniture}
          onDeleteFurniture={handleDeleteFurniture}
          onDuplicateFurniture={handleDuplicateFurniture}
          roomWidth={room.width}
          roomHeight={room.height}
          onUpdateRoom={handleUpdateRoom}
        />
      </div>

      {/* Bottom Bar */}
      <BottomBar
        totalArea={calculateTotalArea()}
        totalPrice={calculateTotalPrice()}
        furnitureCount={furniture.length}
        onExportPDF={handleExportPDF}
        onExportImage={handleExportImage}
      />
    </div>
  );
}