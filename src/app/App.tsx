// React Router DOM is the browser‑focused bundle; using the core
// package directly leads to inexplicable runtime failures (e.g. the
// `TypeError: Cannot read properties of undefined (reading 'S')` seen in
// the console).
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";

export default function App() {
  return <RouterProvider router={router} />;
}
