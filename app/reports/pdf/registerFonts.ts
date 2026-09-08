import { Font } from "@react-pdf/renderer";

let registered = false;

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
