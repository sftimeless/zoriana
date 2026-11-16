# Zoriana — references for the project submission form

Paste-ready text for three fields of the NASA Space Apps 2026 project page. Everything the app ships or depends on is listed here. Update this file if anything is added, especially new artwork.

Last checked against the code on November 14, 2026.

---

## Field: NASA Data

- **NASA/JPL Horizons System** (API). Sun and Earth apparent azimuth, elevation and distance for an observer on the lunar surface at the chosen coordinates and height, hourly, airless model. Queried live by the app's server for every site and date. https://ssd.jpl.nasa.gov/horizons/ · API documentation: https://ssd-api.jpl.nasa.gov/doc/horizons.html
- **LRO LOLA polar elevation model, LDEM_85S_40M V2.0** (NASA PDS Geosciences Node). 40 m south-polar grid used for the terrain horizon at sites south of 85°S, and averaged to 160 m for the shadow layer and landing-view terrain. https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/ldem_85s_40m.lbl
- **LRO LOLA polar elevation model, LDEM_80S_80M V2.0** (NASA PDS Geosciences Node). 80 m grid from 80°S to the pole, used for the terrain horizon and surface slope at sites between 80°S and 85°S. https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/ldem_80s_80m.lbl
- **LRO LOLA polar elevation model, LDEM_80N_80M** (NASA PDS Geosciences Node). 80 m grid from 80°N to the pole, used for the terrain horizon and surface slope at north-polar sites and, with LDEM_80S_80M, for the slope layer. https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/ldem_80n_80m.lbl
- **LRO LOLA global elevation, LDEM_64** (NASA PDS Geosciences Node). 64 pixels per degree (474 m at the equator); used for the terrain horizon and surface slope at every site between 80°S and 80°N. https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/ldem_64.img
- **LRO LOLA global elevation, LDEM_16 float TIFF** (NASA Scientific Visualization Studio, CGI Moon Kit). 16 pixels per degree; used as the fallback terrain grid and for distant terrain, and averaged to 3.8 km for the shadow layer and landing-view terrain. https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_16.tif
- **LRO LOLA permanently shadowed regions maps, LPSR_75S_120M_201608 and LPSR_75N_120M_201608** (NASA PDS Geosciences Node; LOLA team, Goddard Space Flight Center; data set LRO-L-LOLA-4-GDR-V1.0). 120 m polar grids from 75° to each pole, marking ground that never receives direct sunlight. Averaged to 240 m and drawn as the blue permanent-shadow layer, and read for each site's "Permanent shadow" fact. https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/extras/illumination/img/ · method: Mazarico, Neumann, Smith, Zuber and Torrence (2011), "Illumination conditions of the lunar polar regions using LOLA topography", Icarus 211, 1066–1081.
- **LRO LOLA average visibility maps, AVGVISIB_75S_120M_201608 and AVGVISIB_75N_120M_201608, with their _EARTH versions** (same source and directory). The share of time, in NASA's long-term simulation, that any part of the Sun's or Earth's disk is visible from each 120 m pixel. Averaged to 480 m and used for the where-to-land heat map, each polar site's long-term average, and the "Find best spot within 15 km" button.
- **NASA Eclipse Web Site, lunar eclipse tables 2021–2030 and 2031–2040** (Fred Espenak, NASA GSFC). Dates, times of greatest eclipse and types of the 23 lunar eclipses from 2026 to 2035, used to point to the next eclipse and to check the app's eclipse calculation. https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2021.html · https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2031.html
- **Firefly Aerospace, "Firefly Aerospace Successfully Completes 14 Days of Surface Operations on the Moon"** (March 17, 2025), and reporting of Firefly's eclipse images (SpacePolicyOnline, March 14, 2025). The times Blue Ghost Mission 1 saw the March 14, 2025 eclipse end and stopped operating after sunset on March 16, used only to check the app's event times (`scripts/check-event-times.mjs`). https://fireflyspace.com/news/firefly-aerospace-successfully-completes-14-days-of-surface-operations-on-the-moon · https://spacepolicyonline.com/news/fireflys-dazzling-images-of-earth-eclipsing-the-sun/ · contact times: https://en.wikipedia.org/wiki/March_2025_lunar_eclipse
- **IAU Gazetteer of Planetary Nomenclature, feature origins** (USGS Astrogeology Science Center, for the IAU). Who three craters are named for, quoted in fly-by captions: Shackleton https://planetarynames.wr.usgs.gov/Feature/5450 · Tycho https://planetarynames.wr.usgs.gov/Feature/6163 · Copernicus https://planetarynames.wr.usgs.gov/Feature/1296
- **Apollo Lunar Surface Journal, "Working on the Moon: Thermal Environment"** (NASA). Table of Sun elevation and azimuth during the six Apollo surface stays, used only to check the app's Sun angles (`scripts/benchmark-apollo.mjs`). https://www.nasa.gov/wp-content/uploads/static/history/alsj/WOTM/WOTM-ThermalEnvrnmnt.html
- **LRO LROC Wide Angle Camera global mosaic, about 100 m per pixel** (NASA/GSFC/Arizona State University), served as map tiles by **NASA Moon Trek** (NASA Solar System Treks, JPL). Fetched by the visitor's browser for fine surface detail in the Landing view. https://trek.nasa.gov/moon/ · tiles: https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/WMTSCapabilities.xml
- **LRO LROC color mosaic, 8K** (NASA Scientific Visualization Studio, CGI Moon Kit, Ernie Wright). Globe imagery. https://svs.gsfc.nasa.gov/4720/ · file: https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_8k.tif
- **Blue Marble: Next Generation with topography and bathymetry, December 2004** (NASA Earth Observatory, Reto Stöckli). Earth imagery for the globe shown in the Moon's sky, resized to 2048×1024. https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography-bathymetry/december/world.topo.bathy.200412.3x5400x2700.jpg
- **Apollo Landing Site Coordinates** (NASA NSSDC, LRO-derived, updated March 6, 2017). Lunar Module coordinates for Apollo 11, 12, 14, 15, 16 and 17. https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html
- **LROC, "Firefly Blue Ghost Landing Region"** (NASA/GSFC/Arizona State University). Blue Ghost Mission 1 landing coordinates, 18.56°N 61.81°E. https://www.lroc.im-ldi.com/images/1400

- **NASA SP-2000-4029, "Apollo by the Numbers: A Statistical Reference", Apollo 11 timeline** (Richard W. Orloff, NASA History Division). The ground elapsed time of every event in the Apollo 11 replay, from liftoff to splashdown, including the planting of the flag and the unveiling of the plaque during the moonwalk. https://www.nasa.gov/wp-content/uploads/static/history/SP-4029/Apollo_11i_Timeline.htm
- **NASA NSSDC Master Catalog, Apollo 11 Command and Service Module (1969-059A)**. The splashdown point (13°19′N, 169°9′W), its distance from the recovery ship USS Hornet (24 km), and the launch, landing and splashdown times quoted in the replay's captions. https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059A
- **NASA/JPL Horizons System, vector tables for July 16 to 25, 1969**: the Moon (301) and the Sun (10) relative to Earth's center, and the Apollo 11 S-IVB third stage (Horizons spacecraft -399110, a trajectory reconstruction by D. R. Adamo) from 18 minutes after its burn toward the Moon. Also one whole lap of the Moon around the Earth (July 7 to August 3, 1969, every 6 hours), drawn as the Moon's orbit. Fetched once by `scripts/prepare-apollo11.mjs` and stored in `public/assets/apollo11.json`; the replay reads that file and does not query JPL. https://ssd.jpl.nasa.gov/horizons/
- **LROC QuickMap** and **NASA Moon Trek**: every site card links out to the same location in both tools. The app reads no data from QuickMap; from Moon Trek it reads only the imagery tiles listed above. https://quickmap.lroc.im-ldi.com/ · https://trek.nasa.gov/moon/

---

## Field: Space Agency Partner Data and Other References

**Place names**
- **Planetary Nomenclature of the Moon** (International Astronomical Union and USGS Astrogeology Science Center; public domain). Center points, diameters and kinds of 9,087 named lunar features, used for search, pin descriptions and naming the terrain that hides the Sun or Earth. https://planetarynames.wr.usgs.gov/GIS_Downloads The list's "origin" note for each name (what it means or whom it honors) is what the guide quotes when a name is clicked.

**Space Agency Partner information**
- **JAXA**, SLIM mission page (DARTS). Landing target coordinates, 13.3160°S 25.2510°E. https://darts.isas.jaxa.jp/en/missions/slim
- **ISRO**, Chandrayaan-3 landing site (Statio Shiv Shakti), 69.373°S 32.319°E, taken from the IAU-named feature as summarized at https://en.wikipedia.org/wiki/Statio_Shiv_Shakti
- These are site locations only. No partner datasets are used.

**Other coordinate sources**
- IM-1 Odysseus landing site, 80.13°S 1.44°E (Malapert A): https://en.wikipedia.org/wiki/IM-1
- IM-2 Athena landing site, 84.7906°S 29.1957°E (Mons Mouton): https://en.wikipedia.org/wiki/IM-2 ; intended site per LROC: https://www.lroc.asu.edu/images/1401
- Landing dates and touchdown times shown for past missions (UTC): Apollo from NASA's Apollo Lunar Surface Journal table cited above; IM-1 (February 22, 2024, 23:23), IM-2 (March 6, 2025, 17:28), Blue Ghost Mission 1 (March 2, 2025, 08:34), Chandrayaan-3 (August 23, 2023, 12:33) and SLIM (January 19, 2024, 15:20) from each mission's Wikipedia page. Future missions show only the year their operators have announced.
- Published contact times used to check the eclipse calculation: https://en.wikipedia.org/wiki/March_2026_lunar_eclipse and https://en.wikipedia.org/wiki/August_2026_lunar_eclipse
- The one-line purpose shown for each future mission paraphrases its Wikipedia summary (IM-3, IM-4, Griffin Mission One, Blue Moon Pathfinder Mission 1) and NASA's description of the Lunar-VISE payload for the Gruithuisen domes.
- Future mission targets (approximate; announced regions, not landing points):
  - Blue Moon Pathfinder Mission 1, Shackleton connecting ridge, candidate point "Site 001" 89.45°S 222.69°E: Boazman et al. 2022, Planetary Science Journal 3:275; https://en.wikipedia.org/wiki/Blue_Moon_Pathfinder_Mission_1
  - Griffin Mission One, Nobile crater center 85.28°S 53.27°E: https://en.wikipedia.org/wiki/Griffin_Mission_One ; https://en.wikipedia.org/wiki/Nobile_(crater)
  - IM-4, Mons Mouton center 84.6°S 31.0°E: https://en.wikipedia.org/wiki/IM-4 ; https://en.wikipedia.org/wiki/Mons_Mouton
  - IM-3, Reiner Gamma center 7.5°N 59.0°W: https://en.wikipedia.org/wiki/IM-3 ; https://en.wikipedia.org/wiki/Reiner_Gamma
  - Blue Ghost Mission 3, Mons Gruithuisen Gamma center 36.56°N 40.72°W: https://en.wikipedia.org/wiki/Mons_Gruithuisen_Gamma
- Shackleton region (89.5°S, 0°E) and Malapert region (85.95°S, 0°E) are exploration points chosen by the team. They are not mission landing sites.

**Software**
- Three.js 0.181.2 (MIT License), including its OrbitControls and Line2 add-ons. https://threejs.org/
- Vite 7.3.8 (MIT License), development server and bundler. https://vite.dev/
- Node.js 25.9 runtime (22.12 or later required).
- Python 3 with NumPy and Pillow, used by `scripts/prepare-terrain.py` to convert the NASA elevation files into the app's grids, by `scripts/prepare-illumination.py` to make the permanent-shadow and heat-map images, and by `scripts/prepare-icon.py` to crop, resize and mark the app icon, and by `scripts/prepare-features.py` to make the named-feature list.
- Fly.io (hosting for the public copy of the app, https://zoriana.fly.dev/) and Docker (the container image it runs from).
- Google Chrome, run headless to capture the app screenshots in the demo slides and to print the slides to PDF.
- macOS `sips`, used once to convert the NASA color mosaic from TIFF to JPEG and once to resize the Blue Marble image.
- IAU WGCCRE rotation elements for the Moon (pole and prime-meridian series) and the IAU Earth rotation angle, implemented in `src/earth-orientation.mjs` to orient the Earth image.

**Fonts, icons and images**
- Fonts: the app uses the device's system font; no font files are downloaded or bundled. The demo slides use Space Grotesk and Inter from Google Fonts (both SIL Open Font License). https://fonts.google.com/specimen/Space+Grotesk · https://fonts.google.com/specimen/Inter
- Demo slides (`demo/zoriana-demo.pdf`, source `demo/slides.html`): seven slides whose pictures are screenshots of the running app (`demo/img/`) and the app icon. No stock photos or third-party artwork.
- Interface icons: original SVG drawings in `index.html`. The mission icons (Apollo Lunar Module, Nova-C, Blue Ghost, Chandrayaan-3, SLIM, Blue Moon, Griffin) were drawn after looking at general reference pictures of each spacecraft; no artwork was traced, copied or included.
- App icon: the team's official icon, supplied on November 14, 2026 (source image dated November 14, 2026, 7:44 pm Pacific). The app ships three copies of it (`public/assets/icon-512.png`, `icon-192.png`, `favicon.png`), cropped to the rounded square with transparent corners and resized; nothing was redrawn. The icon is an AI-generated image made with ChatGPT (OpenAI). Each copy carries a visible "AI" mark in its lower-right corner, set in the macOS system font Helvetica.
- Apart from the NASA Moon mosaic and NASA Blue Marble Earth image listed above, no photographs, music, video or third-party artwork are included in the app.

**Design inspiration**
- The layout takes general inspiration from everyday map and navigation apps. No third-party design assets, icons, fonts or code were copied.
- The Apollo 11 replay's vehicles and its Launch Complex 39A are original simplified drawings made in code. Public diagrams of the Saturn V and Apollo spacecraft, and NASA photographs of Apollo 11 on the pad, were looked at for general reference to proportions and layout; none is reproduced, traced or included in the app.

---

## Field: Use of AI tools (the form calls this "Super Intelligence (SI)")

Yes. AI coding assistants were used to write code under the team's direction:

- **OpenAI Codex**: first build of the app, the terrain horizon model, and the terrain shadow layer.
- **OpenAI ChatGPT**: generated the app icon image (see below).
- **Anthropic Claude Code**: the map-style interface, Landing view, site list, date comparison and lunar-day view, the 80°S terrain tier and slope, links to QuickMap and Moon Trek, icons, the permanent-shadow layer, the Sun and Earth disk measure, the where-to-land heat map and best-spot finder, named-feature search and map labels, sharper Landing-view imagery, eclipses, the slope layer, the north-polar terrain tier, the check against NASA's long-term maps, the phone bottom sheet, the Apollo benchmark script, the production server mode and deployment files, the demo slides, added unit tests, and this reference list. Also the Apollo 11 replay: the reconstruction of the flight path between the NASA and JPL anchors, the 3D drawings of the vehicles (shapes built in code from published overall dimensions; no NASA logos, patches or markings), the cameras and the captions.
- **The guide (November 15, 2026)**: Zoriana the guide, her welcome, tours and explanations, and the small astronaut picture, which is drawn in code (an SVG) and is not the output of an image generator, were written with Claude Code. The idea of a guide named Zoriana, of a first-time tour, and of asking visitors who they are came from Iryna Khoroshavina Munoz after her first run through the app.
- **Independent reviews (November 15, 2026)**: OpenAI Codex made one read-only review of the repository and OpenAI ChatGPT reviewed the demo slides. Neither changed any file; each finding was checked against the code and fixed with Claude Code (see VERIFICATION.md).

The acknowledgment appears in the app's "Data & method" sheet, in a `meta` tag in `index.html`, in `package.json`, in source file headers, and in `README.md`.

**AI-generated image:** the app icon was made with ChatGPT (OpenAI). It carries a visible "AI" mark in its lower-right corner wherever it appears (the app, the browser tab and the demo's first slide). The app also says so when the icon is clicked and in its "Data & method" sheet and page metadata. No other image, video or audio in the app or the demo is AI-generated: the rest are NASA data products, screenshots of the app, and SVG icons written as code.

The project idea, the choice of challenge, and the decisions about what to build were the team's. Team Zoriana is two people. Christian Munoz chose the challenge, directed the work, reviewed the results and made the content decisions. Iryna Khoroshavina Munoz helped with the overall design and with how the app is used.

---

## Before submitting, confirm

- [x] The AI image tool used for the icon is named above (ChatGPT).
- [x] The icon carries a visible AI mark in its lower-right corner.
- [ ] Any image used in the demo video or slides is listed here and watermarked if AI-generated. This includes the pictures in `Zoriana/`, which are dated November 13 and are not used by the app.
- [x] Team member names and contributions are filled in for both members (edit the line above if the wording should differ).
- [x] Demo: 7 slides, in English, at https://github.com/sftimeless/zoriana/blob/main/demo/zoriana-demo.pdf (public once the repository is public).
- [x] Project link: https://zoriana.fly.dev/ (public, no login).
- [ ] Open both links in a private browser window before submitting.
