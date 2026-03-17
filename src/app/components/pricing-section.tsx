import { motion } from "motion/react";
import { Info } from "lucide-react";

export function PricingSection() {
  return (
    <section id="cennik" className="py-32 px-6">
      <div className="container mx-auto max-w-4xl border border-white/20 bg-white/5 backdrop-blur-md rounded-3xl p-8 md:p-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-full mb-6">
            <Info className="w-8 h-8 text-blue-400" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6">
            Zasady Wyceny
          </h2>
          
          <p className="text-xl md:text-2xl text-white/80 leading-relaxed mb-8 max-w-2xl mx-auto">
            Sugerowana cena wyliczona w naszym kreatorze ma charakter orientacyjny.
          </p>
          
          <div className="p-6 md:p-8 rounded-2xl bg-black/40 border border-white/10 text-left md:text-center text-white/70">
            <p className="text-lg">
              Ostateczny koszt realizacji projektu może się nieznacznie różnić w zależności od:
            </p>
            <ul className="mt-4 space-y-2 inline-block text-left text-white/90">
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Indywidualnych wymiarów i nietypowych warunków pomieszczenia (krzywizny, wypusty).</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span>Wybranych materiałów i niestandardowych akcesoriów.</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-pink-400" />
                <span>Kosztów montażu i logistyki uzgadnianych indywidualnie.</span>
              </li>
            </ul>
          </div>
          
        </motion.div>
      </div>
    </section>
  );
}
