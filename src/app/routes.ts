// use the DOM-aware build of React Router to avoid missing DOM utils
import { createBrowserRouter } from "react-router-dom";
import LandingPage from "./pages/landing-page";
import CalculatorPage from "./pages/calculator-page";
import DebugPage from "./pages/debug-page";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/kalkulator",
    Component: CalculatorPage,
  },
  {
    path: "/debug",
    Component: DebugPage,
  },
]);