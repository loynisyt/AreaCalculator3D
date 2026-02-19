import { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { Toaster, toast } from "sonner";

export function SimpleConfigurator() {
  const [itemCount, setItemCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <div className="h-16 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <motion.a
            href="/"
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Powrót</span>
          </motion.a>
          <div className="h-8 w-px bg-gray-700" />
          <div>
            <h1 className="text-lg font-bold">Konfigurator 3D</h1>
            <p className="text-xs text-gray-400">Ładowanie silnika Three.js...</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setItemCount(itemCount + 1);
              toast.success("Dodano element");
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Dodaj
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toast.info("Zapisano projekt")}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Zapisz
          </motion.button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl font-bold text-blue-400 mb-4">{itemCount}</div>
          <p className="text-gray-400">Elementów w projekcie</p>
          <p className="text-sm text-gray-600 mt-4">
            Silnik Three.js załaduje się po odświeżeniu strony
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
          >
            Odśwież stronę aby załadować 3D
          </motion.button>
        </div>
      </div>
    </div>
  );
}
