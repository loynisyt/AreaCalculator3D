// Plik: src/fonts/roboto.ts
// this module simply re‑exports the base64 string provided by the
// `roboto-base64` package. the upstream package is a small webpack build
// that embeds the font data directly as base64 constants.

// using `import * as` ensures compatibility with both CJS and ESM outputs.
import * as robotoPackage from "roboto-base64";

// the `normal` export contains the regular Roboto font encoded as base64.
// TypeScript doesn't know the shape, so assert to string.
export const robotoBase64: string = (robotoPackage as any).normal;

// we also offer a loader function for symmetry with older code. callers can
// simply await it but it resolves synchronously.
export async function loadRobotoBase64(): Promise<string> {
  return robotoBase64;
}
