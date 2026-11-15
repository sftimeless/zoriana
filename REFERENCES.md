# Zoriana — references for the project submission form

Paste-ready text for three fields of the NASA Space Apps 2026 project page. Everything the app ships or depends on is listed here. Update this file if anything is added, especially new artwork.

Last checked against the code on November 14, 2026.

---

## Field: NASA Data

- **NASA/JPL Horizons System** (API). Sun and Earth apparent azimuth, elevation and distance for an observer on the lunar surface at the chosen coordinates and height, hourly, airless model. Queried live by the app's server for every site and date. https://ssd.jpl.nasa.gov/horizons/ · API documentation: https://ssd-api.jpl.nasa.gov/doc/horizons.html
- **LRO LOLA polar elevation model, LDEM_85S_40M V2.0** (NASA PDS Geosciences Node). 40 m south-polar grid used for the terrain horizon at sites south of 85°S, and averaged to 160 m for the shadow layer and landing-view terrain. https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/ldem_85s_40m.lbl
- **LRO LOLA polar elevation model, LDEM_80S_80M V2.0** (NASA PDS Geosciences Node). 80 m grid from 80°S to the pole, used for the terrain horizon and surface slope at sites between 80°S and 85°S. https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/ldem_80s_80m.lbl
- **LRO LOLA global elevation, LDEM_16 float TIFF** (NASA Scientific Visualization Studio, CGI Moon Kit). 16 pixels per degree; used for the terrain horizon elsewhere and for distant terrain, and averaged to 3.8 km for the shadow layer and landing-view terrain. https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_16.tif
- **LRO LOLA permanently shadowed regions map, LPSR_75S_120M_201608** (NASA PDS Geosciences Node; LOLA team, Goddard Space Flight Center; data set LRO-L-LOLA-4-GDR-V1.0). 120 m south-polar grid, 75°S to the pole, marking ground that never receives direct sunlight. Averaged to 240 m and drawn as the blue permanent-shadow layer, and read for each site's "Permanent shadow" fact. https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/extras/illumination/img/lpsr_75s_120m_201608.lbl · method: Mazarico, Neumann, Smith, Zuber and Torrence (2011), "Illumination conditions of the lunar polar regions using LOLA topography", Icarus 211, 1066–1081.
- **Apollo Lunar Surface Journal, "Working on the Moon: Thermal Environment"** (NASA). Table of Sun elevation and azimuth during the six Apollo surface stays, used only to check the app's Sun angles (`scripts/benchmark-apollo.mjs`). https://www.nasa.gov/wp-content/uploads/static/history/alsj/WOTM/WOTM-ThermalEnvrnmnt.html
- **LRO LROC color mosaic, 8K** (NASA Scientific Visualization Studio, CGI Moon Kit, Ernie Wright). Globe imagery. https://svs.gsfc.nasa.gov/4720/ · file: https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_8k.tif
- **Blue Marble: Next Generation with topography and bathymetry, December 2004** (NASA Earth Observatory, Reto Stöckli). Earth imagery for the globe shown in the Moon's sky, resized to 2048×1024. https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography-bathymetry/december/world.topo.bathy.200412.3x5400x2700.jpg
- **Apollo Landing Site Coordinates** (NASA NSSDC, LRO-derived, updated March 6, 2017). Lunar Module coordinates for Apollo 11, 12, 14, 15, 16 and 17. https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html
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
- IM-2 Athena landing site, 84.7906°S 29.1957°E (Mons Mouton): https://en.wikipedia.org/wiki/IM-2 ; intended site per LROC: https://www.lroc.asu.edu/images/1401
- Future mission targets (approximate; announced regions, not landing points):
  - Blue Moon Pathfinder Mission 1, Shackleton connecting ridge, candidate point "Site 001" 89.45°S 222.69°E: Boazman et al. 2022, Planetary Science Journal 3:275; https://en.wikipedia.org/wiki/Blue_Moon_Pathfinder_Mission_1
  - Griffin Mission One, Nobile crater centre 85.28°S 53.27°E: https://en.wikipedia.org/wiki/Griffin_Mission_One ; https://en.wikipedia.org/wiki/Nobile_(crater)
  - IM-4, Mons Mouton centre 84.6°S 31.0°E: https://en.wikipedia.org/wiki/IM-4 ; https://en.wikipedia.org/wiki/Mons_Mouton
  - IM-3, Reiner Gamma centre 7.5°N 59.0°W: https://en.wikipedia.org/wiki/IM-3 ; https://en.wikipedia.org/wiki/Reiner_Gamma
  - Blue Ghost Mission 3, Mons Gruithuisen Gamma centre 36.56°N 40.72°W: https://en.wikipedia.org/wiki/Mons_Gruithuisen_Gamma
- Shackleton region (89.5°S, 0°E) and Malapert region (85.95°S, 0°E) are exploration points chosen by the team. They are not mission landing sites.

**Software**
- Three.js 0.181.2 (MIT License), including its OrbitControls and Line2 add-ons. https://threejs.org/
- Vite 7.3.8 (MIT License), development server and bundler. https://vite.dev/
- Node.js 25.9 runtime (22.12 or later required).
- Python 3 with NumPy and Pillow, used by `scripts/prepare-terrain.py` to convert the NASA elevation files into the app's grids, by `scripts/prepare-psr.py` to make the permanent-shadow mask, and by `scripts/prepare-icon.py` to crop, resize and mark the app icon (the mark is set in the macOS system font Helvetica).
- Fly.io (hosting for the public copy of the app, https://zoriana.fly.dev/) and Docker (the container image it runs from).
- Google Chrome, run headless to capture the app screenshots in the demo slides and to print the slides to PDF.
- macOS `sips`, used once to convert the NASA color mosaic from TIFF to JPEG and once to resize the Blue Marble image.
- IAU WGCCRE rotation elements for the Moon (pole and prime-meridian series) and the IAU Earth rotation angle, implemented in `src/earth-orientation.mjs` to orient the Earth image.

**Fonts, icons and images**
- Fonts: the app uses the device's system font; no font files are downloaded or bundled. The demo slides use Space Grotesk and Inter from Google Fonts (both SIL Open Font License). https://fonts.google.com/specimen/Space+Grotesk · https://fonts.google.com/specimen/Inter
- Demo slides (`demo/zoriana-demo.pdf`, source `demo/slides.html`): seven slides whose pictures are screenshots of the running app (`demo/img/`) and the app icon. No stock photos or third-party artwork.
- Interface icons: original SVG drawings in `index.html`. The mission icons (Apollo Lunar Module, Nova-C, Blue Ghost, Chandrayaan-3, SLIM, Blue Moon, Griffin) were drawn after looking at general reference pictures of each spacecraft; no artwork was traced, copied or included.
- App icon: the team's official icon, supplied on November 14, 2026 (source image dated November 14, 2026, 7:44 pm Pacific). The app ships three copies of it (`public/assets/icon-512.png`, `icon-192.png`, `favicon.png`), cropped to the rounded square with transparent corners and resized; nothing was redrawn. The icon is an AI-generated image made with ChatGPT (OpenAI). Each copy carries a visible mark: "AI-generated" on the 512 px file, and "AI" on the 192 px and 64 px files, where the full words would be unreadable.
- Apart from the NASA Moon mosaic and NASA Blue Marble Earth image listed above, no photographs, music, video or third-party artwork are included in the app.

**Design inspiration**
- The layout takes general inspiration from everyday map and navigation apps. No third-party design assets, icons, fonts or code were copied.

---

## Field: Use of AI tools (the form calls this "Super Intelligence (SI)")

Yes. AI coding assistants were used to write code under the team's direction:

- **OpenAI Codex**: first build of the app, the terrain horizon model, and the terrain shadow layer.
- **OpenAI ChatGPT**: generated the app icon image (see below).
- **Anthropic Claude Code**: the map-style interface, landing view, site list, date comparison and lunar-day view, the 80°S terrain tier and slope, links to QuickMap and Moon Trek, icons, the permanent-shadow layer, the Sun and Earth disc measure, the Apollo benchmark script, the production server mode and deployment files, the demo slides, added unit tests, and this reference list.

The acknowledgment appears in the app's "Data & method" sheet, in a `meta` tag in `index.html`, in `package.json`, in source file headers, and in `README.md`.

**AI-generated image:** the app icon was made with ChatGPT (OpenAI). It carries a visible "AI-generated" or "AI" mark wherever it appears (the app, the browser tab and the demo slides), and the app's "Data & method" sheet and page metadata say so. No other image, video or audio in the app or the demo is AI-generated: the rest are NASA data products, screenshots of the app, and SVG icons written as code.

The project idea, the choice of challenge, and the decisions about what to build were the team's. **Team: add one line here describing who did what.**

---

## Before submitting, confirm

- [x] The AI image tool used for the icon is named above (ChatGPT). The visible AI mark is on the icon.
- [ ] Any image used in the demo video or slides is listed here and watermarked if AI-generated. This includes the pictures in `Zoriana/`, which are dated November 13 and are not used by the app.
- [ ] Team member names and contributions are filled in.
- [x] Demo: 7 slides, in English, at https://github.com/sftimeless/zoriana/blob/main/demo/zoriana-demo.pdf (public once the repository is public).
- [x] Project link: https://zoriana.fly.dev/ (public, no login).
- [ ] Open both links in a private browser window before submitting.
