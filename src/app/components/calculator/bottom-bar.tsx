import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Download, FileImage } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface BottomBarProps {
  totalArea: number;
  totalPrice: number;
  furnitureCount: number;
  onExportPDF: () => void;
  onExportImage: () => void;
}

export function BottomBar({
  totalArea,
  totalPrice,
  furnitureCount,
  onExportPDF,
  onExportImage,
}: BottomBarProps) {
  const [animatedPrice, setAnimatedPrice] = useState(0);

  useEffect(() => {
    let start = animatedPrice;
    const end = totalPrice;
    const duration = 500;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const current = start + (end - start) * progress;
      setAnimatedPrice(Math.round(current));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [totalPrice]);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="h-24 bg-gray-900/95 backdrop-blur-xl border-t border-white/10 flex items-center justify-between px-8"
    >
      <div className="flex items-center gap-12">
        <div>
          <div className="text-sm text-gray-400">Powierzchnia zabudowy</div>
          <div className="text-2xl font-bold text-white">
            {totalArea.toFixed(2)} m²
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-400">Liczba elementów</div>
          <div className="text-2xl font-bold text-blue-400">
            {furnitureCount}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-400">Suma</div>
          <div className="text-3xl font-bold text-green-400">
            {animatedPrice.toLocaleString("pl-PL")} PLN
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onExportImage}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          <FileImage className="w-5 h-5" />
          Eksportuj jako obraz
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onExportPDF}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <Download className="w-5 h-5" />
          Eksportuj PDF
        </motion.button>
      </div>
    </motion.div>
  );
}