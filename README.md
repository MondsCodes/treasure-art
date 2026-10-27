# Treasure Fatile, art portfolio

A calm, image-first portfolio for [Treasure Fatile](https://www.instagram.com/insidetreasureshead/), a visual artist based in Toronto.

It is a plain static site (HTML, CSS and a little JavaScript), so there is nothing to install to view it and it can be hosted for free on GitHub Pages.

## Pages

| Page | What it shows |
| --- | --- |
| `index.html` | Home: one work fills the screen, with its title and year in the corner. An arrow (or a slow timer, or a swipe on phones) moves to the next. |
| `works.html` | All works grouped by year (newest first), with filters for **Studio** (paint, fabric, print, paper) and **Digital** (Procreate), and for each year. |
| `about.html` | Portrait, bio, group exhibitions by year, links to the CV and artist statement, Instagram. |
| `cv.html` | Her CV: education, exhibitions, curatorial projects, awards and work experience. |
| `statement.html` | Her artist statement, beside *The Enlightenment*. |

Click any artwork to open it full screen with its title, year, medium and size. Use the arrow keys or swipe to move between works, and Esc or the back button to close.

Filters can be linked to directly, e.g. `works.html?year=2024`, `works.html?category=digital` or `works.html?category=studio&year=2025`. A single work can be linked with `#its-slug`, e.g. `works.html#wait-and-pray`.

## Preview it

Double-click `index.html`, or from this folder run:

```sh
python3 -m http.server 8000
```

and open <http://localhost:8000>.

## Editing

**Artworks:** everything about each work (title, year, medium, size, Studio/Digital) is in [`assets/js/data.js`](assets/js/data.js). `HERO` at the bottom picks the works shown full screen on the home page: `wide` ones for laptops, `tall` ones for phones, each with a `focus` saying which part to keep in view when the screen trims the edges. The names "Studio" and "Digital" can be changed in `CATEGORIES`.

**About text, exhibitions and links:** these are written directly in [`about.html`](about.html).

**CV and artist statement:** written directly in [`cv.html`](cv.html) and [`statement.html`](statement.html). The CV page leaves out her phone number and email; add them there if she wants them public.

**After changing any CSS or JS file:** raise the `?v=` number on the `<link>` and `<script>` lines at the top of every HTML file (e.g. `?v=4` to `?v=5`). Otherwise phones that visited recently can keep an old copy for a few minutes and show a broken page.

### Adding or replacing images

Images live in `source-images/`, named after the work's `images` entry in `data.js` (e.g. `wait-and-pray.jpg`). JPG, PNG and WebP all work. After adding or replacing any, rebuild the web versions:

```sh
pip install pillow
python3 scripts/build_images.py
```

This makes small, medium and large WebP copies in `assets/img/art/` so phones only download what they need, records each image's shape so nothing is ever stretched or cropped, and makes the blurred colour previews shown while images load.

To add a new work: drop the image into `source-images/`, add an entry to `WORKS` in `data.js`, and run the script. A work with two images is shown side by side as a diptych.

## Putting it online (GitHub Pages)

1. In the repository on GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**.
2. Choose the `main` branch and `/ (root)`, then save.
3. After a minute the site is live at `https://<your-username>.github.io/treasure-art/`.

If you later use a custom domain, change `og:image` in the three HTML files to the full address (e.g. `https://treasurefatile.com/assets/img/og.jpg`) so link previews on social media show the artwork.

## Notes

- Images and details come from the "Website Sorting" document. *UAC 1978* was rotated upright to match how it appears in the document.
- Group exhibitions on the About page come from the Group Exhibitions section of her CV.
- Fonts are Cormorant Garamond and DM Sans (SIL Open Font License), stored in `assets/fonts/` so the site never depends on Google. Cormorant covers the Yoruba diacritics in titles like *Ọ̀rẹ́ Ìyàwó*.
- Motion is slow and gentle. Visitors who switch on "reduce motion" on their device get the same site without the animation.
