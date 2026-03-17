import { lazy, Suspense } from "react";
import { Toaster } from "sonner";
import { SimpleConfigurator } from "../components/simple-configurator";
import { useProjectStore } from "../store/project-store";
import { RoomSetup2D } from "../components/room-setup/room-setup-2d";
import { StartMenu } from "../components/room-setup/start-menu";

// Lazy load the 3D configurator
const Configurator3D = lazy(() =>
  import("../components/configurator3d/configurator-3d").then((module) => ({
    default: module.Configurator3D,
  }))
);

export default function CalculatorPage() {
  const isSetupComplete = useProjectStore((state) => state.isSetupComplete);
  const startMode = useProjectStore((state) => state.startMode);

  return (
    <>
      <Suspense fallback={<SimpleConfigurator />}>
        {isSetupComplete ? <Configurator3D /> : startMode === "menu" ? <StartMenu /> : <RoomSetup2D />}
      </Suspense>
      <Toaster position="top-right" richColors />
    </>
  );
}
