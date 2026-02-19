import { motion } from "motion/react";
import { Search, Plus, Layers } from "lucide-react";
import { useState } from "react";
import { FURNITURE_CATALOG } from "./types";

interface FurnitureLibraryProps {
  onAddFurniture: (
    catalogItem: (typeof FURNITURE_CATALOG)[keyof typeof FURNITURE_CATALOG][number],
    category: string
  ) => void;
}

export function FurnitureLibrary({ onAddFurniture }: FurnitureLibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(
    "Szafki dolne"
  );

  const categories = Object.keys(FURNITURE_CATALOG);

  const filteredCategories = Object.entries(FURNITURE_CATALOG).reduce(
    (acc, [category, items]) => {
      const filtered = items.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
      return acc;
    },
    {} as typeof FURNITURE_CATALOG
  );

  return (
    <motion.div
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="w-[380px] h-full bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-700 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" />
          Katalog Mebli
        </h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Szukaj produktu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(filteredCategories).map(([category, items]) => (
          <div key={category} className="border-b border-gray-800">
            <button
              onClick={() =>
                setActiveCategory(activeCategory === category ? null : category)
              }
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors group"
            >
              <span className="text-sm font-semibold text-gray-300 group-hover:text-white">
                {category}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{items.length}</span>
                <motion.div
                  animate={{
                    rotate: activeCategory === category ? 90 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="text-gray-500"
                >
                  ▶
                </motion.div>
              </div>
            </button>

            <motion.div
              initial={false}
              animate={{
                height: activeCategory === category ? "auto" : 0,
                opacity: activeCategory === category ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-2 space-y-2">
                {items.map((item, idx) => (
                  <motion.button
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    whileHover={{ x: 5, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onAddFurniture(item, category)}
                    className="w-full group relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/10 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />

                    <div className="relative flex items-start justify-between p-3 bg-gray-800/40 hover:bg-gray-800/70 rounded-lg border border-gray-700/50 hover:border-blue-600/50 transition-all">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: item.material.color }}
                          />
                          <span className="text-sm font-medium text-white">
                            {item.name}
                          </span>
                        </div>

                        <div className="text-xs text-gray-400 font-mono">
                          {item.dimensions.width} × {item.dimensions.height} ×{" "}
                          {item.dimensions.depth} mm
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {item.material.type} · {item.frontType}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-green-400">
                            {item.basePrice} zł
                          </span>
                          <div className="p-1 bg-blue-600/20 rounded group-hover:bg-blue-600/40 transition-colors">
                            <Plus className="w-3.5 h-3.5 text-blue-400" />
                          </div>
                        </div>

                        {item.isAppliance && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-600/20 text-yellow-400 rounded border border-yellow-600/30">
                            AGD
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        ))}
      </div>

      {/* Info footer */}
      <div className="p-4 border-t border-gray-700 bg-gray-900/50">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Kliknij aby dodać do sceny</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Przeciągnij w viewport do pozycjonowania</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
