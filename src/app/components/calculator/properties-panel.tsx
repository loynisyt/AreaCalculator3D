import { motion } from "motion/react";
import { Furniture } from "./types";
import { Trash2, Copy } from "lucide-react";

interface PropertiesPanelProps {
  selectedFurniture: Furniture | null;
  onUpdateFurniture: (id: string, updates: Partial<Furniture>) => void;
  onDeleteFurniture: (id: string) => void;
  onDuplicateFurniture: (id: string) => void;
  roomWidth: number;
  roomHeight: number;
  onUpdateRoom: (width: number, height: number) => void;
}

export function PropertiesPanel({
  selectedFurniture,
  onUpdateFurniture,
  onDeleteFurniture,
  onDuplicateFurniture,
  roomWidth,
  roomHeight,
  onUpdateRoom,
}: PropertiesPanelProps) {
  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="w-80 bg-gray-900/95 backdrop-blur-xl border-l border-white/10 overflow-y-auto"
    >
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-white">Właściwości</h2>

        {/* Room Settings */}
        <div className="mb-8 p-4 bg-white/5 rounded-lg border border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-blue-400">
            Wymiary pokoju
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400 block mb-1">
                Szerokość (cm)
              </label>
              <input
                type="number"
                value={roomWidth}
                onChange={(e) =>
                  onUpdateRoom(Number(e.target.value), roomHeight)
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:border-blue-400 focus:outline-none"
                min="100"
                max="1000"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">
                Wysokość (cm)
              </label>
              <input
                type="number"
                value={roomHeight}
                onChange={(e) =>
                  onUpdateRoom(roomWidth, Number(e.target.value))
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:border-blue-400 focus:outline-none"
                min="100"
                max="800"
              />
            </div>
          </div>
        </div>

        {/* Furniture Properties */}
        {selectedFurniture ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-400/30">
              <h3 className="text-lg font-semibold mb-4 text-blue-400">
                Zaznaczony mebel
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">
                    Nazwa
                  </label>
                  <input
                    type="text"
                    value={selectedFurniture.name}
                    onChange={(e) =>
                      onUpdateFurniture(selectedFurniture.id, {
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:border-blue-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">
                      Szerokość (cm)
                    </label>
                    <input
                      type="number"
                      value={selectedFurniture.width}
                      onChange={(e) =>
                        onUpdateFurniture(selectedFurniture.id, {
                          width: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:border-blue-400 focus:outline-none"
                      min="10"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">
                      Wysokość (cm)
                    </label>
                    <input
                      type="number"
                      value={selectedFurniture.height}
                      onChange={(e) =>
                        onUpdateFurniture(selectedFurniture.id, {
                          height: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:border-blue-400 focus:outline-none"
                      min="10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">
                      X (cm)
                    </label>
                    <input
                      type="number"
                      value={Math.round(selectedFurniture.x)}
                      onChange={(e) =>
                        onUpdateFurniture(selectedFurniture.id, {
                          x: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:border-blue-400 focus:outline-none"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-1">
                      Y (cm)
                    </label>
                    <input
                      type="number"
                      value={Math.round(selectedFurniture.y)}
                      onChange={(e) =>
                        onUpdateFurniture(selectedFurniture.id, {
                          y: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:border-blue-400 focus:outline-none"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">
                    Cena (zł)
                  </label>
                  <input
                    type="number"
                    value={selectedFurniture.price}
                    onChange={(e) =>
                      onUpdateFurniture(selectedFurniture.id, {
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:border-blue-400 focus:outline-none"
                    min="0"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onDuplicateFurniture(selectedFurniture.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Kopiuj
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onDeleteFurniture(selectedFurniture.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Usuń
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            Wybierz mebel, aby edytować jego właściwości
          </div>
        )}
      </div>
    </motion.div>
  );
}
