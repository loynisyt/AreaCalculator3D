import { motion } from "motion/react";
import {
  Trash2,
  Copy,
  Move,
  RotateCw,
  Maximize2,
  Ruler,
  DollarSign,
  Package,
  AlertTriangle,
} from "lucide-react";
import { Furniture3D, MaterialType, FrontType } from "./types";
import { ProductionCalculator } from "./production-calculator";
import { useState, useEffect } from "react";

interface InspectorPanelProps {
  selectedFurniture: Furniture3D | null;
  onUpdateFurniture: (id: string, updates: Partial<Furniture3D>) => void;
  onDeleteFurniture: (id: string) => void;
  onDuplicateFurniture: (id: string) => void;
}

const MATERIALS: MaterialType[] = ["MDF", "Laminat", "Fornir", "Płyta melamina"];
const FRONTS: FrontType[] = ["Gładki", "Frezowany", "Szkło", "Lustro"];

export function InspectorPanel({
  selectedFurniture,
  onUpdateFurniture,
  onDeleteFurniture,
  onDuplicateFurniture,
}: InspectorPanelProps) {
  const [localDimensions, setLocalDimensions] = useState({
    width: 0,
    height: 0,
    depth: 0,
  });

  const [calculatedPrice, setCalculatedPrice] = useState(0);

  useEffect(() => {
    if (selectedFurniture) {
      setLocalDimensions(selectedFurniture.dimensions);
      setCalculatedPrice(selectedFurniture.basePrice);
    }
  }, [selectedFurniture?.id]);

  const handleDimensionChange = (
    dimension: "width" | "height" | "depth",
    value: number
  ) => {
    if (!selectedFurniture) return;

    const newDimensions = { ...localDimensions, [dimension]: value };
    setLocalDimensions(newDimensions);

    // Recalculate price
    const newPrice = ProductionCalculator.calculateDimensionChangePrice(
      selectedFurniture,
      newDimensions
    );
    setCalculatedPrice(newPrice);
  };

  const applyDimensionChanges = () => {
    if (!selectedFurniture) return;

    onUpdateFurniture(selectedFurniture.id, {
      dimensions: localDimensions,
      basePrice: calculatedPrice,
    });
  };

  const handleMaterialChange = (materialType: MaterialType) => {
    if (!selectedFurniture) return;

    const materials = {
      MDF: { pricePerM2: 95, thickness: 18, color: "#D4A574" },
      Laminat: { pricePerM2: 120, thickness: 20, color: "#E8D5C4" },
      Fornir: { pricePerM2: 180, thickness: 20, color: "#8B6F47" },
      "Płyta melamina": { pricePerM2: 85, thickness: 18, color: "#A0826D" },
    };

    const newMaterial = {
      type: materialType,
      ...materials[materialType],
    };

    onUpdateFurniture(selectedFurniture.id, {
      material: newMaterial,
    });
  };

  if (!selectedFurniture) {
    return (
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="w-[420px] h-full bg-gradient-to-b from-gray-900 to-gray-950 border-l border-gray-700 flex flex-col items-center justify-center text-gray-500"
      >
        <Package className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-sm">Wybierz mebel aby edytować</p>
        <p className="text-xs mt-2 text-gray-600">
          Kliknij na obiekt w viewport
        </p>
      </motion.div>
    );
  }

  const panelArea = ProductionCalculator.calculatePanelArea(selectedFurniture);
  const hardwareCost = selectedFurniture.hardware.reduce(
    (sum, hw) => sum + hw.quantity * hw.pricePerUnit,
    0
  );

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="w-[420px] h-full bg-gradient-to-b from-gray-900 to-gray-950 border-l border-gray-700 overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-md border-b border-gray-700 p-4 z-10">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-lg font-bold text-white">
              {selectedFurniture.name}
            </h2>
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              {selectedFurniture.category}
            </p>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDuplicateFurniture(selectedFurniture.id)}
              className="p-2 bg-green-600/20 hover:bg-green-600/30 rounded border border-green-600/50 transition-colors"
              title="Duplikuj"
            >
              <Copy className="w-4 h-4 text-green-400" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onDeleteFurniture(selectedFurniture.id)}
              className="p-2 bg-red-600/20 hover:bg-red-600/30 rounded border border-red-600/50 transition-colors"
              title="Usuń"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </motion.button>
          </div>
        </div>

        {selectedFurniture.isAppliance && (
          <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-yellow-600/20 border border-yellow-600/50 rounded text-yellow-400 text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>Urządzenie AGD - wymiary fabryczne</span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Technical Dimensions */}
        <section>
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Ruler className="w-4 h-4 text-blue-400" />
            Wymiary techniczne (mm)
          </h3>

          <div className="space-y-3 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <div>
              <label className="text-xs text-gray-400 block mb-1 font-mono">
                Szerokość (W)
              </label>
              <input
                type="number"
                value={localDimensions.width}
                onChange={(e) =>
                  handleDimensionChange("width", Number(e.target.value))
                }
                onBlur={applyDimensionChanges}
                disabled={selectedFurniture.isAppliance}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white font-mono focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                min="100"
                step="10"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1 font-mono">
                Wysokość (H)
              </label>
              <input
                type="number"
                value={localDimensions.height}
                onChange={(e) =>
                  handleDimensionChange("height", Number(e.target.value))
                }
                onBlur={applyDimensionChanges}
                disabled={selectedFurniture.isAppliance}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white font-mono focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                min="100"
                step="10"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1 font-mono">
                Głębokość (D)
              </label>
              <input
                type="number"
                value={localDimensions.depth}
                onChange={(e) =>
                  handleDimensionChange("depth", Number(e.target.value))
                }
                onBlur={applyDimensionChanges}
                disabled={selectedFurniture.isAppliance}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white font-mono focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                min="100"
                step="10"
              />
            </div>

            {selectedFurniture.dimensions.width !== localDimensions.width ||
            selectedFurniture.dimensions.height !== localDimensions.height ||
            selectedFurniture.dimensions.depth !== localDimensions.depth ? (
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={applyDimensionChanges}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold text-sm transition-colors"
              >
                Zastosuj zmiany wymiarów
              </motion.button>
            ) : null}
          </div>
        </section>

        {/* Material Selection */}
        {!selectedFurniture.isAppliance && (
          <section>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-400" />
              Specyfikacja materiałowa
            </h3>
<div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
    <label className="text-xs text-gray-400 block mb-2 uppercase tracking-wider flex items-center gap-2">
      <Move className="w-3 h-3" /> Konfiguracja wnętrza
    </label>
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-300">Liczba półek:</span>
      <input
        type="number"
        min="0"
        max="10"
        value={selectedFurniture.shelfCount || 0}
        onChange={(e) => 
          onUpdateFurniture(selectedFurniture.id, { 
            shelfCount: parseInt(e.target.value) || 0 
          })
        }
        className="w-20 px-3 py-1 bg-gray-900 border border-gray-600 rounded text-white font-mono focus:border-blue-500 outline-none"
      />
    </div>
    <p className="text-[10px] text-gray-500 mt-2 italic">
      * Szerokość półek zostanie automatycznie pomniejszona o {selectedFurniture.material.thickness * 2}mm (grubość boków).
    </p>
  </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-2">
                  Materiał korpusu
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {MATERIALS.map((mat) => (
                    <motion.button
                      key={mat}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleMaterialChange(mat)}
                      className={`px-3 py-2 rounded text-xs font-medium transition-colors border ${
                        selectedFurniture.material.type === mat
                          ? "bg-purple-600 border-purple-400 text-white"
                          : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {mat}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-2">
                  Typ frontu
                </label>
                <select
                  value={selectedFurniture.frontType}
                  onChange={(e) =>
                    onUpdateFurniture(selectedFurniture.id, {
                      frontType: e.target.value as FrontType,
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white text-sm focus:border-purple-500 focus:outline-none"
                >
                  {FRONTS.map((front) => (
                    <option key={front} value={front}>
                      {front}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-gray-800/50 rounded border border-gray-700">
                <div className="text-xs text-gray-400 mb-1">
                  Grubość płyty
                </div>
                <div className="text-white font-mono">
                  {selectedFurniture.material.thickness} mm
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Production Data */}
        <section>
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            Dane produkcyjne
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded border border-gray-700">
              <span className="text-xs text-gray-400">
                Powierzchnia płyt
              </span>
              <span className="text-white font-mono font-semibold">
                {panelArea.toFixed(3)} m²
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded border border-gray-700">
              <span className="text-xs text-gray-400">Koszt materiału</span>
              <span className="text-white font-mono font-semibold">
                {(panelArea * selectedFurniture.material.pricePerM2).toFixed(
                  2
                )}{" "}
                PLN
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded border border-gray-700">
              <span className="text-xs text-gray-400">Koszt okuć</span>
              <span className="text-white font-mono font-semibold">
                {hardwareCost.toFixed(2)} PLN
              </span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-900/40 to-green-800/40 rounded border border-green-600/50">
              <span className="text-sm text-green-300 font-semibold">
                Cena całkowita
              </span>
              <span className="text-xl text-green-400 font-bold font-mono">
                {calculatedPrice.toFixed(2)} PLN
              </span>
            </div>
          </div>
        </section>

        {/* Hardware List */}
        {selectedFurniture.hardware.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
              Okucia i akcesoria
            </h3>

            <div className="space-y-2">
              {selectedFurniture.hardware.map((hw, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-2 bg-gray-800/30 rounded text-xs"
                >
                  <span className="text-gray-300">{hw.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">×{hw.quantity}</span>
                    <span className="text-white font-mono">
                      {(hw.quantity * hw.pricePerUnit).toFixed(2)} PLN
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Transform Info */}
        <section className="pt-4 border-t border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
            Pozycja w przestrzeni
          </h3>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2 bg-gray-800/50 rounded">
              <div className="text-red-400 mb-1">X</div>
              <div className="text-white">
                {(selectedFurniture.position[0] * 1000).toFixed(0)} mm
              </div>
            </div>
            <div className="p-2 bg-gray-800/50 rounded">
              <div className="text-green-400 mb-1">Y</div>
              <div className="text-white">
                {(selectedFurniture.position[1] * 1000).toFixed(0)} mm
              </div>
            </div>
            <div className="p-2 bg-gray-800/50 rounded">
              <div className="text-blue-400 mb-1">Z</div>
              <div className="text-white">
                {(selectedFurniture.position[2] * 1000).toFixed(0)} mm
              </div>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
