import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { FURNITURE_CATEGORIES } from "./types";

interface FurniturePanelProps {
  onAddFurniture: (
    name: string,
    width: number,
    height: number,
    price: number,
    category: string
  ) => void;
}

export function FurniturePanel({ onAddFurniture }: FurniturePanelProps) {
  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="w-80 bg-gray-900/95 backdrop-blur-xl border-r border-white/10 overflow-y-auto"
    >
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-white">
          Kategorie mebli
        </h2>

        <div className="space-y-6">
          {Object.entries(FURNITURE_CATEGORIES).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-3 text-blue-400">
                {category}
              </h3>
              <div className="space-y-2">
                {items.map((item) => (
                  <motion.button
                    key={item.name}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      onAddFurniture(
                        item.name,
                        item.width,
                        item.height,
                        item.defaultPrice,
                        category
                      )
                    }
                    className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-blue-400/50 transition-all"
                  >
                    <div className="text-left">
                      <div className="font-medium text-white">{item.name}</div>
                      <div className="text-xs text-gray-400">
                        {item.width} × {item.height} cm
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-400 font-semibold">
                        {item.defaultPrice} zł
                      </span>
                      <Plus className="w-4 h-4 text-blue-400" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
