import { Font } from "@react-pdf/renderer";

let registered = false;
let registeredServer = false;

// react-pdf's built-in fonts (Helvetica, Times-Roman...) don't include Polish
// diacritics (ą, ć, ę, ł, ń, ó, ś, ź, ż), so text with them renders with
// missing/garbled glyphs unless a font with full Latin Extended coverage is
// registered explicitly.
export function registerPdfFonts() {
  if (registered) return;
  Font.register({
    family: "Lato",
    fonts: [
      { src: "/fonts/Lato-Regular.ttf", fontWeight: "normal" },
      { src: "/fonts/Lato-Bold.ttf", fontWeight: "bold" },
    ],
  });
  registered = true;
}

// Server-side rendering (e.g. the monthly email cron) has no origin to
// resolve a "/fonts/..." URL against, so it reads the same files straight
// off disk instead.
export function registerPdfFontsServer() {
  if (registeredServer) return;
  const path = require("node:path") as typeof import("node:path");
  Font.register({
    family: "Lato",
    fonts: [
      {
        src: path.join(process.cwd(), "public/fonts/Lato-Regular.ttf"),
        fontWeight: "normal",
      },
      {
        src: path.join(process.cwd(), "public/fonts/Lato-Bold.ttf"),
        fontWeight: "bold",
      },
    ],
  });
  registeredServer = true;
}
