/*
  ARTWORK LIST: edit this file to add, remove or change works.

  Each work:
    slug        unique id used in links (lowercase, dashes, no spaces)
    title       shown on the site
    year        production year (works are grouped by this)
    category    "studio" or "digital" (see CATEGORIES below)
    medium      e.g. "Oil on canvas"
    dimensions  optional, e.g. "24 × 36 in"
    images      one or more image names from source-images/ (two = diptych shown side by side)

  The order here is the order on the home page.
  On the Works page they are grouped by year, newest first.
*/

window.SITE = {
  name: "Treasure Fatile",
  instagram: "insidetreasureshead",
};

window.CATEGORIES = {
  studio: { label: "Studio", blurb: "Paint, fabric, print & paper" },
  digital: { label: "Digital", blurb: "Painted in Procreate" },
};

window.WORKS = [
  {
    slug: "ore-iyawo",
    title: "Ọ̀rẹ́ Ìyàwó (Friends of the Bride)",
    year: 2024,
    category: "studio",
    medium: "Oil and stamped prints on canvas",
    dimensions: "48 × 36 in",
    images: ["ore-iyawo"],
  },
  {
    slug: "untitled-305",
    title: "Untitled 305 (Look at your Bride)",
    year: 2024,
    category: "studio",
    medium: "Oil and fabric on canvas",
    dimensions: "24 × 36 in",
    images: ["untitled-305"],
  },
  {
    slug: "most-coloured-most-visible",
    title: "Most Coloured, Most Visible",
    year: 2024,
    category: "studio",
    medium: "Oil on batik fabric affixed to wood",
    dimensions: "48 × 30 in",
    images: ["most-coloured-most-visible"],
  },
  {
    slug: "iyawo-rere",
    title: "Ìyàwó Rere (The Good Wife)",
    year: 2023,
    category: "studio",
    medium: "Oil and stamped prints on canvas",
    dimensions: "16 × 20 in",
    images: ["iyawo-rere"],
  },
  {
    slug: "wait-and-pray",
    title: "Wait and Pray",
    year: 2025,
    category: "studio",
    medium: "Oil and acrylic on dyed fabric",
    dimensions: "48 × 36 in",
    images: ["wait-and-pray"],
  },
  {
    slug: "daydream",
    title: "Daydream",
    year: 2023,
    category: "digital",
    medium: "Digital painting made in Procreate",
    images: ["daydream"],
  },
  {
    slug: "the-enlightenment",
    title: "The Enlightenment",
    year: 2024,
    category: "studio",
    medium: "Oil, acrylic and fabric on canvas",
    dimensions: "63 × 46.5 in",
    images: ["the-enlightenment"],
  },
  {
    slug: "something-smells-funny",
    title: "Something Smells Funny (Diptych)",
    year: 2023,
    category: "studio",
    medium: "Oil on canvas",
    dimensions: "8 × 10 in",
    images: ["something-smells-funny-1", "something-smells-funny-2"],
  },
  {
    slug: "untitled-2023-digital-i",
    title: "Untitled",
    year: 2023,
    category: "digital",
    medium: "Digital painting made in Procreate",
    images: ["untitled-2023-digital-i"],
  },
  {
    slug: "untitled-2025",
    title: "Untitled",
    year: 2025,
    category: "studio",
    medium: "Oil and fabric on canvas",
    dimensions: "48 × 60 in",
    images: ["untitled-2025"],
  },
  {
    slug: "mrs-fatile",
    title: "Mrs Fatile (Diptych)",
    year: 2024,
    category: "studio",
    medium: "Oil on canvas",
    dimensions: "11 × 14 in each",
    images: ["mrs-fatile"],
  },
  {
    slug: "daydream-ii",
    title: "Daydream II",
    year: 2023,
    category: "studio",
    medium: "Acrylic on canvas",
    dimensions: "16 × 20 in",
    images: ["daydream-ii"],
  },
  {
    slug: "untitled-2021",
    title: "Untitled",
    year: 2021,
    category: "digital",
    medium: "Acrylic on canvas, rendered in Procreate",
    images: ["untitled-2021"],
  },
  {
    slug: "untitled-2023-screenprint",
    title: "Untitled",
    year: 2023,
    category: "studio",
    medium: "Screenprint on Arnhem paper",
    dimensions: "22 × 15 in",
    images: ["untitled-2023-screenprint"],
  },
  {
    slug: "untitled-2023-digital-ii",
    title: "Untitled",
    year: 2023,
    category: "digital",
    medium: "Digital painting made in Procreate",
    images: ["untitled-2023-digital-ii"],
  },
  {
    slug: "uac-1978",
    title: "UAC 1978",
    year: 2024,
    category: "studio",
    medium: "Watercolour on paper",
    dimensions: "4 × 6 in",
    images: ["uac-1978"],
  },
];

/* Works that slowly rotate in the frame at the top of the home page. */
window.HERO = ["iyawo-rere", "the-enlightenment", "daydream-ii", "untitled-305"];
