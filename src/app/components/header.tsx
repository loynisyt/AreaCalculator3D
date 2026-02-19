import { motion } from "motion/react";

interface HeaderProps {
  // Removed darkMode props - always dark now
}

export function Header({}: HeaderProps) {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/10 border-b border-white/20"
    >
      <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="text-2xl font-bold tracking-tight"
        >
          InteriorVision 3D
        </motion.div>

        <div className="flex items-center gap-8">
          <motion.a
            href="#kalkulator"
            whileHover={{ scale: 1.05 }}
            className="hover:text-blue-400 transition-colors"
          >
            Kalkulator
          </motion.a>
          <motion.a
            href="#funkcje"
            whileHover={{ scale: 1.05 }}
            className="hover:text-blue-400 transition-colors"
          >
            Funkcje
          </motion.a>
          <motion.a
            href="#cennik"
            whileHover={{ scale: 1.05 }}
            className="hover:text-blue-400 transition-colors"
          >
            Cennik
          </motion.a>
        </div>
      </nav>
    </motion.header>
  );
}