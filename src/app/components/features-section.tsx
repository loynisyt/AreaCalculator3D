import { motion } from "motion/react";
import { FileText, Box, Ruler, Activity } from "lucide-react";
import { ReactNode } from "react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  delay: number;
}

function FeatureCard({ title, description, icon, delay }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.05, y: -10 }}
      className="relative group"
    >
      <motion.div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(168, 85, 247, 0.3))",
          filter: "blur(10px)",
        }}
      />
      
      <div className="relative backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/20 group-hover:border-blue-400/50 rounded-3xl p-8 transition-all duration-500">
        <motion.div
          whileHover={{ rotate: 360, scale: 1.2 }}
          transition={{ duration: 0.6 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400/20 to-purple-500/20 flex items-center justify-center mb-6 backdrop-blur-sm border border-white/30"
        >
          {icon}
        </motion.div>

        <h3 className="text-2xl font-bold mb-3 tracking-tight">{title}</h3>
        <p className="text-white/70 dark:text-white/80 leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

export function FeaturesSection() {
  const features = [
    {
      title: "Eksport PDF/JPG",
      description:
        "Zapisz swoje projekty w wysokiej rozdzielczości. Gotowe do prezentacji dla klientów.",
      icon: <FileText className="w-8 h-8 text-blue-400" />,
    },
    {
      title: "Wizualizer 3D",
      description:
        "Przeglądaj swoje projekty w czasie rzeczywistym. Rotuj, przybliżaj i eksploruj każdy detal.",
      icon: <Box className="w-8 h-8 text-purple-400" />,
    },
    {
      title: "Customizacja",
      description:
        "Wpisz własne wymiary pomieszczeń i dostosuj każdy element do swoich potrzeb.",
      icon: <Ruler className="w-8 h-8 text-pink-400" />,
    },
    {
      title: "Obliczanie Powierzchni",
      description:
        "Automatyczne wyliczanie metrażu i powierzchni ścian. Precyzyjne pomiary w m².",
      icon: <Activity className="w-8 h-8 text-cyan-400" />,
    },
  ];

  return (
    <section id="funkcje" className="py-32 px-6">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold tracking-tighter mb-6">
            Funkcje, które imponują
          </h2>
          <p className="text-xl text-white/70 dark:text-white/80 max-w-2xl mx-auto">
            Wszystko, czego potrzebujesz do tworzenia profesjonalnych
            wizualizacji w jednym miejscu
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}