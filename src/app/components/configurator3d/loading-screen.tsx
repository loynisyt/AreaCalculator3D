import { useProgress } from "@react-three/drei";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  const { active, progress, errors, item, loaded, total } = useProgress();
  const [show, setShow] = useState(true);

  // Smooth out the disappearing phase to guarantee the scene is fully unblocked
  useEffect(() => {
    if (!active && progress === 100) {
      const timeout = setTimeout(() => setShow(false), 500); // Wait 0.5s before fade out
      return () => clearTimeout(timeout);
    } else {
      setShow(true);
    }
  }, [active, progress]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 text-white"
        >
          {/* Logo / Header */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex flex-col items-center"
          >
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Konfigurator 3D
              </h1>
            </div>
            <p className="text-gray-400 text-sm">Trwa ładowanie silnika i modeli...</p>
          </motion.div>

          {/* Progress Bar Container */}
          <div className="w-64 sm:w-80 md:w-96 max-w-full px-4">
            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden relative">
              <motion.div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "easeOut", duration: 0.3 }}
              />
            </div>

            {/* Metrics */}
            <div className="mt-4 flex items-center justify-between text-xs font-mono text-gray-400">
              <span className="flex-1 truncate pr-4" title={item}>
                {item ? `Ładowanie: ${item.split('/').pop()}` : "Inicjalizacja środowiska..."}
              </span>
              <span className="shrink-0 text-blue-400 font-bold ml-auto">
                {Math.round(progress)}%
              </span>
            </div>
            
            <div className="mt-1 text-center text-[10px] text-gray-600 font-mono">
                {loaded} / {total} plików
            </div>

            {/* Error State */}
            {errors.length > 0 && (
              <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-xs">
                Wykryto problem podcza ładowania niektórych zasobów. 
                Sprawdź połączenie z internetem.
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
