import { motion } from "motion/react";
import { Send } from "lucide-react";
import { useState, FormEvent } from "react";

export function Footer() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Mock submission
    console.log("Form submitted:", formData);
    alert("Dziękujemy za wiadomość! Skontaktujemy się wkrótce.");
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <footer className="relative py-20 px-6 backdrop-blur-2xl bg-white/5 dark:bg-black/20 border-t border-white/10">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Skontaktuj się z nami
          </h2>
          <p className="text-white/70 dark:text-white/80">
            Masz pytania? Jesteśmy tutaj, aby pomóc
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Imię i nazwisko"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
              className="w-full bg-transparent pb-3 text-lg outline-none placeholder:text-white/40 border-b-2 border-white/20 focus:border-blue-400 transition-colors duration-300"
              required
            />
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500"
              initial={{ width: "0%" }}
              animate={{ width: focusedField === "name" ? "100%" : "0%" }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="relative">
            <input
              type="email"
              placeholder="Adres email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              className="w-full bg-transparent pb-3 text-lg outline-none placeholder:text-white/40 border-b-2 border-white/20 focus:border-blue-400 transition-colors duration-300"
              required
            />
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500"
              initial={{ width: "0%" }}
              animate={{ width: focusedField === "email" ? "100%" : "0%" }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="relative">
            <textarea
              placeholder="Wiadomość"
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              onFocus={() => setFocusedField("message")}
              onBlur={() => setFocusedField(null)}
              rows={4}
              className="w-full bg-transparent pb-3 text-lg outline-none placeholder:text-white/40 border-b-2 border-white/20 focus:border-blue-400 transition-colors duration-300 resize-none"
              required
            />
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500"
              initial={{ width: "0%" }}
              animate={{ width: focusedField === "message" ? "100%" : "0%" }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-2xl"
          >
            <span className="text-lg font-semibold">Wyślij wiadomość</span>
            <Send className="w-5 h-5" />
          </motion.button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 pt-8 border-t border-white/10 text-center text-white/50"
        >
          <p>© 2026 InteriorVision 3D. Wszystkie prawa zastrzeżone.</p>
        </motion.div>
      </div>
    </footer>
  );
}
