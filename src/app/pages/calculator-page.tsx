import { lazy, Suspense } from "react";
import { Toaster } from "sonner";
import { SimpleConfigurator } from "../components/simple-configurator";

// Lazy load the 3D configurator
const Configurator3D = lazy(() =>
  import("../components/configurator3d/configurator-3d").then((module) => ({
    default: module.Configurator3D,
  }))
);

export default function CalculatorPage() {
  return (
    <>
      <Suspense fallback={<SimpleConfigurator />}>
        <Configurator3D />
      </Suspense>
      <Toaster position="top-right" richColors />
    </>
  );
}
