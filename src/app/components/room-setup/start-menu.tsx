import { motion } from "motion/react";
import { PenTool, LayoutGrid, Upload, X } from "lucide-react";
import { useProjectStore } from "../../store/project-store";
import { ROOM_PRESETS } from "../../utils/presets";
import { PresetManager } from "../../utils/preset-manager";
import { ImportManager } from "../../utils/import-manager";
import { toast } from "sonner";
import { useRef, useState } from "react";

export function StartMenu() {
  const { setStartMode, setWalls } = useProjectStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);

  // Flow handlers
  const handleDrawRoom = () => {
    setStartMode("drawing");
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = ROOM_PRESETS.find(p => p.id === presetId);
    if (preset) {
       const initialWalls = PresetManager.generateWallsFromLengthsAndAngles(preset.walls);
       setWalls(initialWalls);
       setStartMode("drawing"); 
       toast.success(`Załadowano schemat: ${preset.name}`);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonStr = event.target?.result as string;
        const parsedProject = ImportManager.parseProjectJSON(jsonStr);
        
        if (parsedProject.furniture && parsedProject.furniture.length > 0) {
           // Full project with 3D furniture -> Jump to 3D View
           useProjectStore.getState().importProject(parsedProject);
           setStartMode("drawing"); // It doesn't matter, importProject sets isSetupComplete = true
        } else {
           // Only walls -> Jump to 2D Editor
           setWalls(parsedProject.walls || parsedProject); // Handle both formats
           setStartMode("drawing");
        }
        
        toast.success("Projekt wczytany pomyślnie");
      } catch (error: any) {
        toast.error(`Błąd wczytywania pliku: ${error.message}`);
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be uploaded again if needed
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/95 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-950 to-gray-950 pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl p-8 relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div 
             initial={{ y: -20, opacity: 0 }} 
             animate={{ y: 0, opacity: 1 }} 
             transition={{ delay: 0.1 }}
          >
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight">
              Witaj w Kreatorze
            </h1>
            <p className="text-gray-400 mt-3 text-lg">
              Jak chcesz rozpocząć swój projekt?
            </p>
          </motion.div>
        </div>

        {!showPresetsMenu ? (
          <div className="grid gap-6">
            <MenuTile 
              icon={<PenTool className="w-8 h-8 text-blue-400" />}
              title="Narysuj pokój od zera"
              description="Użyj myszki, aby ręcznie wyznaczyć ściany i ich układ."
              onClick={handleDrawRoom}
              delay={0.2}
            />

            <MenuTile 
              icon={<LayoutGrid className="w-8 h-8 text-emerald-400" />}
              title="Wybierz gotowy schemat"
              description="Skorzystaj z predefiniowanych kształtów pokojów."
              onClick={() => setShowPresetsMenu(true)}
              delay={0.3}
            />

            <MenuTile 
              icon={<Upload className="w-8 h-8 text-amber-400" />}
              title="Importuj projekt z JSON"
              description="Wgraj wcześniej zapisany plik, aby kontynuować pracę."
              onClick={handleImportClick}
              delay={0.4}
            />
            
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md"
          >
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Gotowe Schematy</h2>
                <button 
                  onClick={() => setShowPresetsMenu(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                   <X className="w-5 h-5" />
                </button>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[65vh] overflow-y-auto pr-3 custom-scrollbar">
                {ROOM_PRESETS.map((preset) => (
                   <button
                     key={preset.id}
                     onClick={() => handleSelectPreset(preset.id)}
                     className="flex flex-col items-center justify-center p-5 bg-gray-800/40 hover:bg-gray-800 border border-gray-700/50 hover:border-emerald-500/70 rounded-2xl transition-all duration-300 group shadow-lg hover:shadow-emerald-900/20"
                   >
                     <div className="w-full aspect-[4/3] bg-gray-950/80 rounded-xl mb-4 flex items-center justify-center border border-gray-800 group-hover:border-emerald-500/40 transition-colors overflow-hidden relative">
                        {/* Thumbnail Image */}
                        <div 
                           className="absolute inset-4 bg-contain bg-center bg-no-repeat opacity-100 group-hover:scale-105 transition-all duration-500 z-0" 
                           style={{ backgroundImage: `url(${preset.thumbnail})` }} 
                        />
                        
                        {/* Fallback Icon if Image doesn't load visually (behind the background image) */}
                        <LayoutGrid className="w-8 h-8 text-gray-600 z-[-1] absolute" />
                     </div>
                     <span className="text-md font-bold text-gray-300 group-hover:text-white transition-colors z-20">
                        {preset.name}
                     </span>
                     <span className="text-xs text-gray-500 mt-1 group-hover:text-emerald-400 transition-colors z-20">
                        {preset.walls.length} ścian
                     </span>
                   </button>
                ))}
             </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function MenuTile({ icon, title, description, onClick, delay }: { icon: React.ReactNode; title: string; description: string; onClick: () => void; delay: number }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center p-6 bg-gray-900/40 border border-gray-800 rounded-2xl hover:bg-gray-800/80 hover:border-gray-700 transition-all group text-left w-full shadow-lg hover:shadow-blue-900/20"
    >
      <div className="p-4 bg-gray-950/50 rounded-xl mr-6 group-hover:bg-gray-950 transition-colors border border-gray-800/50 group-hover:border-gray-700">
        <div className="group-hover:scale-110 transition-transform duration-300">
           {icon}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-bold text-gray-100 group-hover:text-white transition-colors mb-1">
          {title}
        </h3>
        <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
          {description}
        </p>
      </div>
    </motion.button>
  );
}
