import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  DoorOpen, 
  Settings, 
  Ruler, 
  MousePointer2 
} from "lucide-react";
import { toast } from "sonner";
import { useProjectStore, Wall2D, Door } from "../../store/project-store";
import { distance, resizeWallByLength, snapAngle, normalizeAngle, resizeWallByAngle } from "../../utils/geometry-2d";

type ToolMode = "select" | "draw" | "add-door";

export function RoomSetup2D() {
  const { 
    walls, setWalls, updateWall, 
    doors, addDoor, removeDoor, updateDoor,
    setSetupComplete, setRoom
  } = useProjectStore();

  const [mode, setMode] = useState<ToolMode>("draw");
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState<{ start: [number, number], end: [number, number] } | null>(null);

  // Selected Wall Form state
  const [wallLengthInput, setWallLengthInput] = useState<string>("");
  const [wallHeightInput, setWallHeightInput] = useState<string>("3000");
  const [wallAngleInput, setWallAngleInput] = useState<string>("");
  const [isSemiWall, setIsSemiWall] = useState(false);

  // Door dragging & selection state
  const [draggedDoorId, setDraggedDoorId] = useState<string | null>(null);
  const [selectedDoorId, setSelectedDoorId] = useState<string | null>(null);
  
  // Door Form State
  const [doorWidthInput, setDoorWidthInput] = useState<string>("");
  const [doorHeightInput, setDoorHeightInput] = useState<string>("");
  const [doorDistanceInput, setDoorDistanceInput] = useState<string>("");

  // Keyboard modifiers
  const [isAltPressed, setIsAltPressed] = useState(false);

  const canvasRef = useRef<SVGSVGElement>(null);

  // When a wall is selected, populate the form
  useEffect(() => {
    if (selectedWallId) {
      const w = walls.find(w => w.id === selectedWallId);
      if (w) {
         // Display in mm
         const distPx = distance(w.startNode, w.endNode);
         const distMm = distPx * 10;
         setWallLengthInput(Math.round(distMm).toString());
         setWallHeightInput(w.height.toString());
         
         const angleRad = Math.atan2(w.endNode[1] - w.startNode[1], w.endNode[0] - w.startNode[0]);
         const angleDeg = normalizeAngle(angleRad * (180 / Math.PI));
         setWallAngleInput(Math.round(angleDeg).toString());
         
         setIsSemiWall(w.isSemiWall || false);
      }
    } else {
      setWallLengthInput("");
    }
  }, [selectedWallId, walls]);

  // When a door is selected, populate the form
  useEffect(() => {
     if (selectedDoorId) {
        const d = doors.find(d => d.id === selectedDoorId);
        if (d) {
           setDoorWidthInput(d.width.toString());
           setDoorHeightInput(d.height.toString());
           setDoorDistanceInput(Math.round(d.distanceFromStart).toString());
        }
     }
  }, [selectedDoorId, doors]);

  const getMousePos = (e: React.MouseEvent | MouseEvent): [number, number] => {
    if (!canvasRef.current) return [0, 0];
    const CTM = canvasRef.current.getScreenCTM();
    if (CTM) {
      return [
        (e.clientX - CTM.e) / CTM.a,
        (e.clientY - CTM.f) / CTM.d
      ];
    }
    return [0, 0];
  };

  const handlePointerDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    
    if (mode === "draw") {
      if (!isDrawing) {
        // Start a new line sequence
        // Try to snap to the end node of the last wall
        let startPoint = pos;
        if (walls.length > 0) {
            const lastWall = walls[walls.length - 1];
            if (distance(pos, lastWall.endNode) < 20) {
                startPoint = lastWall.endNode;
            }
        }
        setIsDrawing(true);
        setCurrentLine({ start: startPoint, end: pos });
        setSelectedWallId(null);
        setSelectedDoorId(null);
      } else {
        // Finish current segment, snap if close to start
        let endPoint = pos;
        
        // Auto-close room logic: snap to the very first node and stop drawing
        if (walls.length > 2) {
          const firstWall = walls[0];
          if (distance(pos, firstWall.startNode) < 30) {
            endPoint = firstWall.startNode;
            setIsDrawing(false); // Stop drawing after closure
          }
        }

        const newWall: Wall2D = {
          id: `wall-${Date.now()}`,
          startNode: currentLine!.start,
          endNode: endPoint,
          isSemiWall: false,
          position: [0, 0, 0], // calculated later in Configurator3D
          rotation: 0,
          length: 0, 
          height: 3000, 
          thickness: 100
        };

        setWalls([...walls, newWall]);

        if (isDrawing) {
            // Continues drawing from the new end point
            setCurrentLine({ start: endPoint, end: getMousePos(e) });
        } else {
            setCurrentLine(null);
        }
      }
    } else if (mode === "select") {
       setSelectedWallId(null); // Clicked empty space
       setSelectedDoorId(null);
    }
  };

  const handlePointerMove = (e: React.MouseEvent) => {
    if (mode === "draw" && isDrawing && currentLine) {
        let pos = getMousePos(e);
        
        // Visual Snapping to first node logic
        if (walls.length > 2) {
            const firstWall = walls[0];
            if (distance(pos, firstWall.startNode) < 30) {
               pos = firstWall.startNode;
               setCurrentLine({ ...currentLine, end: pos });
               return; // Skip angle snapping if we are closing the room
            }
        }
        
        // Angle Snapping Logic
        if (!isAltPressed) {
           const dx = pos[0] - currentLine.start[0];
           const dy = pos[1] - currentLine.start[1];
           const rawAngle = Math.atan2(dy, dx);
           const snappedRaw = snapAngle(rawAngle, 10); // 10 degrees threshold
           
           if (snappedRaw !== rawAngle) {
              const currentLen = distance(currentLine.start, pos);
              pos = [
                 currentLine.start[0] + currentLen * Math.cos(snappedRaw),
                 currentLine.start[1] + currentLen * Math.sin(snappedRaw)
              ];
           }
           // Distance mapping for doors:
           // We can click near a door to start dragging it.
           // For simplicity, we trigger door dragging dynamically in onPointerDown of the door SVG element itself.
        }

        setCurrentLine({ ...currentLine, end: pos });
    } else if (draggedDoorId) {
        // Drag door logic
        const doorToDrag = doors.find(d => d.id === draggedDoorId);
        if (doorToDrag) {
           const parentWall = walls.find(w => w.id === doorToDrag.wallId);
           if (parentWall) {
              const pos = getMousePos(e);
              // Project mouse pos onto the wall line to find distance from start
              const wallLenPx = distance(parentWall.startNode, parentWall.endNode);
              const dx = parentWall.endNode[0] - parentWall.startNode[0];
              const dy = parentWall.endNode[1] - parentWall.startNode[1];
              
              const px = pos[0] - parentWall.startNode[0];
              const py = pos[1] - parentWall.startNode[1];
              
              // dot product over squared distance
              let t = (px * dx + py * dy) / (wallLenPx * wallLenPx);
              
              // clamp t between 0 and 1
              t = Math.max(0, Math.min(1, t));
              
              // Keep door inside wall bounds considering its width
              const doorWidthPx = doorToDrag.width / 10;
              const maxT = (wallLenPx - doorWidthPx) / wallLenPx;
              t = Math.min(t, maxT);

              const newDistMm = t * wallLenPx * 10;
              
              updateDoor(draggedDoorId, { distanceFromStart: newDistMm });
           }
        }
    }
  };

  const handlePointerUp = () => {
    setDraggedDoorId(null);
  };

  const handleWallClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (mode === "select") {
      setSelectedWallId(id);
      setSelectedDoorId(null);
    } else if (mode === "add-door") {
        const newDoor: Door = {
           id: `door-${Date.now()}`,
           wallId: id,
           distanceFromStart: 500, // default 500mm from edge
           width: 900,
           height: 2000
        };
        addDoor(newDoor);
        toast.success("Dogano Drzwi");
        setMode("select");
        setSelectedWallId(null);
        setSelectedDoorId(newDoor.id);
    }
  };

  const stopDrawing = () => {
     setIsDrawing(false);
     setCurrentLine(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Alt") setIsAltPressed(true);
      if (e.key === "Escape") {
        stopDrawing();
        setSelectedWallId(null);
        setSelectedDoorId(null);
        setMode("select");
      }
      if (e.key === "Delete" || e.key === "Backspace") {
         if (selectedWallId && mode === "select") {
            setWalls(walls.filter(w => w.id !== selectedWallId));
            setSelectedWallId(null);
         }
         if (selectedDoorId && mode === "select") {
            removeDoor(selectedDoorId);
            setSelectedDoorId(null);
         }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
       if (e.key === "Alt") setIsAltPressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
       window.removeEventListener("keydown", handleKeyDown);
       window.removeEventListener("keyup", handleKeyUp);
    };
  }, [selectedWallId, walls, mode]);

  // Form Handlers
  const applyWallEdits = () => {
    if (!selectedWallId) return;
    const len = Number(wallLengthInput);
    const angle = Number(wallAngleInput);
    
    if (!isNaN(len) && len > 0 && !isNaN(angle)) {
      const idx = walls.findIndex(w => w.id === selectedWallId);
      if (idx !== -1) {
         const selectedWall = walls[idx];
         let newWall = resizeWallByLength(selectedWall, len);
         newWall = resizeWallByAngle(newWall, angle);
         const height = Number(wallHeightInput) || 3000;
         
         const dx = newWall.endNode[0] - selectedWall.endNode[0];
         const dy = newWall.endNode[1] - selectedWall.endNode[1];
         
         const updatedWalls = [...walls];
         updatedWalls[idx] = {
             ...selectedWall,
             endNode: newWall.endNode,
             height: height,
             isSemiWall: isSemiWall
         };
         
         // Recursively shift all subsequent walls to maintain shape connectivity
         for (let i = idx + 1; i < updatedWalls.length; i++) {
             updatedWalls[i] = {
                 ...updatedWalls[i],
                 startNode: [updatedWalls[i].startNode[0] + dx, updatedWalls[i].startNode[1] + dy],
                 endNode: [updatedWalls[i].endNode[0] + dx, updatedWalls[i].endNode[1] + dy]
             };
         }
         
         setWalls(updatedWalls);
         toast.success("Zapisano wymiary i zachowano kształt");
      }
    }
  };

  const applyDoorEdits = () => {
     if (!selectedDoorId) return;
     const dw = Number(doorWidthInput);
     const dh = Number(doorHeightInput);
     const dist = Number(doorDistanceInput);
     
     if (!isNaN(dw) && !isNaN(dh) && !isNaN(dist)) {
        updateDoor(selectedDoorId, { width: dw, height: dh, distanceFromStart: dist });
        toast.success("Zapisano wymiary drzwi");
     }
  };

  return (
    <div className="h-screen flex bg-gray-950 text-white overflow-hidden font-sans">
      
      {/* Sidebar Tool Panel */}
      <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col z-10 shadow-xl">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Kreator Pomieszczenia
          </h1>
          <p className="text-sm text-gray-400 mt-1">Narysuj rzut 2D z góry</p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-8">
          
          {/* Tool Selector */}
          <div>
            <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">Narzędzia</h2>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => { setMode("select"); stopDrawing(); }}
                className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all ${mode === "select" ? "bg-blue-600/20 text-blue-400 border border-blue-500/50" : "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-transparent"}`}
              >
                <MousePointer2 className="w-5 h-5 mb-1" />
                <span className="text-[10px]">Wybierz</span>
              </button>
              <button 
                onClick={() => { setMode("draw"); setSelectedWallId(null); }}
                className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all ${mode === "draw" ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/50" : "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-transparent"}`}
              >
                <Ruler className="w-5 h-5 mb-1" />
                <span className="text-[10px]">Rysuj</span>
              </button>
              <button 
                onClick={() => { setMode("add-door"); stopDrawing(); }}
                disabled={walls.length === 0}
                className={`p-3 rounded-lg flex flex-col items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed ${mode === "add-door" ? "bg-amber-600/20 text-amber-400 border border-amber-500/50" : "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-transparent"}`}
              >
                <DoorOpen className="w-5 h-5 mb-1" />
                <span className="text-[10px]">Drzwi</span>
              </button>
            </div>
          </div>

          {/* Properties Panel */}
          {selectedWallId ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                 <h2 className="text-sm font-semibold flex items-center gap-2">
                   <Settings className="w-4 h-4 text-blue-400" />
                   Właściwości Ściany
                 </h2>
                 <button onClick={() => setWalls(walls.filter(w => w.id !== selectedWallId))} className="text-red-400 hover:text-red-300 transition-colors p-1" title="Usuń ścianę">
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Długość (mm)</label>
                  <input 
                    type="number"
                    value={wallLengthInput}
                    onChange={(e) => setWallLengthInput(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Kąt (°)</label>
                  <input 
                    type="number"
                    value={wallAngleInput}
                    onChange={(e) => setWallAngleInput(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Wysokość (mm)</label>
                  <input 
                    type="number"
                    value={wallHeightInput}
                    onChange={(e) => setWallHeightInput(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                
                <label className="flex items-center gap-3 p-3 bg-gray-950/50 border border-gray-800 rounded-lg cursor-pointer hover:border-gray-700 transition-all">
                  <input 
                    type="checkbox" 
                    checked={isSemiWall}
                    onChange={(e) => setIsSemiWall(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-700 text-blue-500 bg-gray-900 focus:ring-blue-500 focus:ring-offset-gray-900"
                  />
                  <div>
                    <span className="block text-sm font-medium">Pół-ściana (Murek)</span>
                    <span className="block text-xs text-gray-500">Zmniejsza wysokość w widoku 3D</span>
                  </div>
                </label>

                <button 
                  onClick={applyWallEdits}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                >
                  Zastosuj Zmiany
                </button>
              </div>

              {/* Doors on this wall */}
              {doors.filter(d => d.wallId === selectedWallId).length > 0 && (
                <div className="pt-4 mt-4 border-t border-gray-800">
                   <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                     Drzwi na ścianie
                   </h3>
                   <div className="space-y-2">
                     {doors.filter(d => d.wallId === selectedWallId).map(door => (
                       <div key={door.id} className="flex items-center justify-between p-2 bg-gray-950 rounded border border-gray-800">
                          <span className="text-xs text-gray-300">Szer: {door.width}mm</span>
                          <button onClick={() => removeDoor(door.id)} className="text-red-400 hover:text-red-300 p-1">
                             <Trash2 className="w-3 h-3" />
                          </button>
                       </div>
                     ))}
                   </div>
                </div>
              )}

            </motion.div>
          ) : selectedDoorId ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                 <h2 className="text-sm font-semibold flex items-center gap-2">
                   <Settings className="w-4 h-4 text-amber-500" />
                   Edytor Drzwi
                 </h2>
                 <button onClick={() => { removeDoor(selectedDoorId); setSelectedDoorId(null); }} className="text-red-400 hover:text-red-300 transition-colors p-1" title="Usuń drzwi">
                   <Trash2 className="w-4 h-4" />
                 </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Szerokość (mm)</label>
                  <input 
                    type="number"
                    value={doorWidthInput}
                    onChange={(e) => setDoorWidthInput(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Wysokość (mm)</label>
                  <input 
                    type="number"
                    value={doorHeightInput}
                    onChange={(e) => setDoorHeightInput(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Dystans od rogu (mm)</label>
                  <input 
                    type="number"
                    value={doorDistanceInput}
                    onChange={(e) => setDoorDistanceInput(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
                <button 
                  onClick={applyDoorEdits}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-sm font-medium transition-colors"
                >
                  Zastosuj Zmiany
                </button>
              </div>
            </motion.div>
          ) : (
             <div className="text-center p-6 border border-dashed border-gray-800 rounded-lg opacity-50">
               <MousePointer2 className="w-8 h-8 mx-auto text-gray-500 mb-2" />
               <p className="text-sm text-gray-400">Wybierz ścianę by edytować wymiary</p>
             </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-800 bg-gray-950/50">
           <button 
             onClick={() => setSetupComplete(true)}
             disabled={walls.length === 0}
             className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-lg shadow-lg flex items-center justify-center gap-2 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
           >
             <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
             Przejdź do 3D
           </button>
        </div>
      </div>

      {/* Editor Canvas Area */}
      <div className="flex-1 relative bg-[#0f1115] bg-[radial-gradient(#2a2d39_1px,transparent_1px)] [background-size:20px_20px]">
         
         {/* Modes Helper notification */}
         <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-gray-700/50 text-sm shadow-xl flex items-center gap-3">
            {mode === "draw" && (
              <>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Klikaj punktowo by narysować ściany. Podwójnie puste aby zakończyć.</span>
              </>
            )}
            {mode === "select" && (
              <>
                <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
                <span>Kliknij ścianę aby dostosować jej długość.</span>
              </>
            )}
            {mode === "add-door" && (
              <>
                <span className="flex h-2 w-2 rounded-full bg-amber-500"></span>
                <span>Wybierz nakładaną ścianę, by wstawić drzwi lub otwór.</span>
              </>
            )}
         </div>

         {/* SVG Canvas for drawing */}
         <svg 
           ref={canvasRef}
           className={`w-full h-full cursor-crosshair ${mode === "select" ? "cursor-default" : ""}`}
           onPointerDown={handlePointerDown}
           onPointerMove={handlePointerMove}
           onPointerUp={handlePointerUp}
           onPointerLeave={handlePointerUp}
           onContextMenu={(e) => { e.preventDefault(); stopDrawing(); }}
         >
            {/* Draw current line in progress */}
            {currentLine && (() => {
               const dx = currentLine.end[0] - currentLine.start[0];
               const dy = currentLine.end[1] - currentLine.start[1];
               const rawAngle = Math.atan2(dy, dx);
               const degrees = normalizeAngle(rawAngle * (180 / Math.PI));
               
               return (
                 <g>
                   <line 
                     x1={currentLine.start[0]} y1={currentLine.start[1]} 
                     x2={currentLine.end[0]} y2={currentLine.end[1]} 
                     stroke="#10b981" strokeWidth="3" strokeDasharray="5,5" 
                     className="opacity-70 pointer-events-none"
                   />
                   
                   {/* Live Angle Indicator */}
                   <rect 
                     x={currentLine.end[0] + 15} y={currentLine.end[1] - 25} 
                     width="40" height="20" rx="4" 
                     fill="#0f1115" stroke="#10b981" strokeWidth="1" 
                     className="opacity-90 pointer-events-none"
                   />
                   <text 
                     x={currentLine.end[0] + 35} y={currentLine.end[1] - 11} 
                     fontSize="10" fill="#10b981" textAnchor="middle" fontWeight="bold"
                     className="pointer-events-none"
                   >
                     {Math.round(degrees)}°
                   </text>
                 </g>
               )
            })()}

            {/* Draw committed walls */}
            {walls.map((wall, idx) => {
              const dx = wall.endNode[0] - wall.startNode[0];
              const dy = wall.endNode[1] - wall.startNode[1];
              const cx = wall.startNode[0] + dx / 2;
              const cy = wall.startNode[1] + dy / 2;
              const angle = Math.atan2(dy, dx) * 180 / Math.PI;
              
              const isSelected = selectedWallId === wall.id;
              
              const wallColor = isSelected ? "#3b82f6" : wall.isSemiWall ? "#8b5cf6" : "#e2e8f0";
              const strokeWidth = isSelected ? 6 : 4;

              return (
                <g key={wall.id} onClick={(e) => handleWallClick(e, wall.id)} style={{ cursor: mode === "select" || mode === "add-door" ? "pointer" : "crosshair" }}>
                   {/* Invisible wider line for easier clicking */}
                   <line 
                      x1={wall.startNode[0]} y1={wall.startNode[1]} 
                      x2={wall.endNode[0]} y2={wall.endNode[1]} 
                      stroke="transparent" strokeWidth="20" 
                   />
                   
                   {/* Main Wall Line */}
                   <line 
                      x1={wall.startNode[0]} y1={wall.startNode[1]} 
                      x2={wall.endNode[0]} y2={wall.endNode[1]} 
                      stroke={wallColor} strokeWidth={strokeWidth} strokeLinecap="round"
                      className="transition-colors drop-shadow-md"
                   />

                   {/* Distance Text Wrapper (rotated parallel to wall) */}
                   <g transform={`translate(${cx}, ${cy}) rotate(${angle})`}>
                      <rect 
                        x="-20" y="-12" width="40" height="14" rx="4" 
                        fill="#0f1115" stroke={wallColor} strokeWidth="1" 
                        className="opacity-90"
                      />
                      <text x="0" y="-3" fontSize="8" fill="#e2e8f0" textAnchor="middle" fontWeight="bold">
                         {Math.round(distance(wall.startNode, wall.endNode) * 10)}
                      </text>
                   </g>

                   {/* Node indicator */}
                   <circle cx={wall.startNode[0]} cy={wall.startNode[1]} r="4" fill={isSelected ? "#3b82f6" : "#64748b"} />
                   {idx === walls.length - 1 && (
                     <circle cx={wall.endNode[0]} cy={wall.endNode[1]} r="4" fill={isSelected ? "#3b82f6" : "#64748b"} />
                   )}

                   {/* Draw doors on this wall */}
                   {doors.filter(d => d.wallId === wall.id).map((door, doorIdx) => {
                      // Calculate physical position on line
                      const wallLenPx = distance(wall.startNode, wall.endNode);
                      const t = (door.distanceFromStart / 10) / wallLenPx;
                      const doorX = wall.startNode[0] + dx * t;
                      const doorY = wall.startNode[1] + dy * t;
                      const doorWidthPx = door.width / 10;
                      
                      return (
                        <g 
                          key={door.id} 
                          transform={`translate(${doorX}, ${doorY}) rotate(${angle})`}
                          onPointerDown={(e) => {
                             if (mode === "select") {
                               e.stopPropagation();
                               setDraggedDoorId(door.id);
                               setSelectedDoorId(door.id);
                               setSelectedWallId(null);
                             }
                          }}
                          style={{ cursor: mode === "select" ? "ew-resize" : "inherit" }}
                        >
                          {/* Invisible larger hit area for grabbing */}
                          <rect x={-5} y="-15" width={doorWidthPx + 10} height="30" fill="transparent" />
                          {/* Visible Door */}
                          <rect x={0} y="-4" width={doorWidthPx} height="8" fill={selectedDoorId === door.id ? "#fcd34d" : "#0f1115"} stroke={selectedDoorId === door.id ? "#f59e0b" : "#b45309"} strokeWidth="2" rx="1" />
                        </g>
                      )
                   })}
                </g>
              )
            })}
         </svg>
      </div>

    </div>
  );
}
