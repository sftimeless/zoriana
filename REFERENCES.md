# Zoriana — references for the project submission form

Paste-ready text for three fields of the NASA Space Apps 2026 project page. Everything the app ships or depends on is listed here. Update this file if anything is added, especially new artwork.

Last checked against the code on November 14, 2026.

---

## Field: NASA Data

- **NASA/JPL Horizons System** (API). Sun and Earth apparent azimuth and elevation for an observer on the lunar surface at the chosen coordinates and height, hourly, airless model. Queried live by the app's server for every site and date. https://ssd.jpl.nasa.gov/horizons/ · API documentation: https://ssd-api.jpl.nasa.gov/doc/horizons.html
- **LRO LOLA polar elevation model, LDEM_85S_40M V2.0** (NASA PDS Geosciences Node). 40 m south-polar grid used for the terrain horizon at sites south of 85°S, and averaged to 160 m for the shadow layer and landing-view terrain. https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/ldem_85s_40m.lbl
- **LRO LOLA polar elevation model, LDEM_80S_80M V2.0** (NASA PDS Geosciences Node). 80 m grid from 80°S to the pole, used for the terrain horizon and surface slope at sites between 80°S and 85°S. https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/ldem_80s_80m.lbl
- **LRO LOLA global elevation, LDEM_16 float TIFF** (NASA Scientific Visualization Studio, CGI Moon Kit). 16 pixels per degree; used for the terrain horizon elsewhere and for distant terrain, and averaged to 3.8 km for the shadow layer and landing-view terrain. https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_16.tif
- **LRO LROC color mosaic, 8K** (NASA Scientific Visualization Studio, CGI Moon Kit, Ernie Wright). Globe imagery. https://svs.gsfc.nasa.gov/4720/ · file: https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_8k.tif
- **Apollo by the Numbers (NASA SP-4029)**. Apollo 11 and Apollo 17 landing coordinates. https://www.nasa.gov/wp-content/uploads/static/history/SP-4029/Apollo_11a_Summary.htm · https://www.nasa.gov/wp-content/uploads/static/history/SP-4029/Apollo_17a_Summary.htm
- **LROC, "Firefly Blue Ghost Landing Region"** (NASA/GSFC/Arizona State University). Blue Ghost Mission 1 landing coordinates, 18.56°N 61.81°E. https://www.lroc.im-ldi.com/images/1400

- **LROC QuickMap** and **NASA Moon Trek**: every site card links out to the same location in both tools. The app does not read data from them. https://quickmap.lroc.im-ldi.com/ · https://trek.nasa.gov/moon/

---

## Field: Space Agency Partner Data and Other References

**Space Agency Partner information**
- **JAXA**, SLIM mission page (DARTS). Landing target coordinates, 13.3160°S 25.2510°E. https://darts.isas.jaxa.jp/en/missions/slim
- **ISRO**, Chandrayaan-3 landing site (Statio Shiv Shakti), 69.373°S 32.319°E, taken from the IAU-named feature as summarized at https://en.wikipedia.org/wiki/Statio_Shiv_Shakti
- These are site locations only. No partner datasets are used.

**Other coordinate sources**
- IM-1 Odysseus landing site, 80.13°S 1.44°E (Malapert A): https://en.wikipedia.org/wiki/IM-1
- Shackleton region (89.5°S, 0°E) and Malapert region (85.95°S, 0°E) are exploration points chosen by the team. They are not mission landing sites.

**Software**
- Three.js 0.181.2 (MIT License), including its OrbitControls and Line2 add-ons. https://threejs.org/
- Vite 7.3.8 (MIT License), development server and bundler. https://vite.dev/
- Node.js 25.9 runtime (22.12 or later required).
- Python 3 with NumPy and Pillow, used once by `scripts/prepare-terrain.py` to convert the NASA elevation files into the app's grids.
- macOS `sips`, used once to convert the NASA color mosaic from TIFF to JPEG.

**Fonts, icons and images**
- Fonts: the device's system font. No font files are downloaded or bundled.
- Interface icons: original SVG drawings in `index.html`. The mission icons (Apollo Lunar Module, IM-1, Blue Ghost, Chandrayaan-3, SLIM) were drawn after looking at general reference pictures of each spacecraft; no artwork was traced, copied or included.
- App icon: `public/assets/icon.svg`, a placeholder drawn in code on November 14, 2026. **Update this line when the final icon is made.** If the final icon is AI-generated it needs a visible watermark.
- No photographs, music, video or third-party artwork are included in the app.

**Design inspiration**
- The layout takes general inspiration from everyday map and navigation apps. No third-party design assets, icons, fonts or code were copied.

---

## Field: Use of AI tools (the form calls this "Super Intelligence (SI)")

Yes. AI coding assistants were used to write code under the team's direction:

- **OpenAI Codex**: first build of the app, the terrain horizon model, and the terrain shadow layer.
- **Anthropic Claude Code**: the map-style interface, landing view, site list, date comparison and lunar-day view, the 80°S terrain tier and slope, links to QuickMap and Moon Trek, icons, added unit tests, and this reference list.

The acknowledgment appears in the app's "Data & method" sheet, in a `meta` tag in `index.html`, in `package.json`, in source file headers, and in `README.md`.

No AI-generated images, video or audio are included in the app. The placeholder app icon is an SVG written as code with AI assistance.

The project idea, the choice of challenge, and the decisions about what to build were the team's. **Team: add one line here describing who did what.**

---

## Before submitting, confirm

- [ ] Final icon is listed above, was made during the hackathon, and carries a watermark if AI-generated.
- [ ] Any image used in the demo video or slides is listed here and watermarked if AI-generated. This includes the pictures in `Zoriana/`, which are dated November 13 and are not used by the app.
- [ ] Team member names and contributions are filled in.
- [ ] Demo is 30 seconds or less (video) or 7 slides or fewer, in English, at a public link.
- [ ] Project link is public and needs no login.
