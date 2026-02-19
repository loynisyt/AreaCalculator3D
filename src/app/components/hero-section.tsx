import { motion } from "motion/react";

export function HeroSection() {
  return (
    <section className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-5xl">
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-8"
        >
          Projektuj bez granic
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl mb-12 text-white/80 dark:text-white/90"
        >
          Twórz profesjonalne wizualizacje 3D wnętrz w czasie rzeczywistym
        </motion.p>

        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            const calculator = document.getElementById("kalkulator");
            calculator?.scrollIntoView({ behavior: "smooth" });
          }}
          className="relative px-12 py-5 text-lg font-semibold rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-2xl cursor-pointer"
          style={{
            boxShadow:
              "0 0 40px rgba(59, 130, 246, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.2)",
          }}
        >
          <motion.span
            animate={{
              boxShadow: [
                "0 0 20px rgba(59, 130, 246, 0.4)",
                "0 0 40px rgba(168, 85, 247, 0.6)",
                "0 0 20px rgba(59, 130, 246, 0.4)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-2xl pointer-events-none"
          />
          <a href="/kalkulator" className="relative z-10">
            Otwórz Kreator 3D
          </a>
        </motion.button>
      </div>
    </section>
  );
}