# Zoriana

Lunar landing site navigator for the NASA Space Apps Challenge 2026 ("Lunar Landing Site Navigator"), started fresh on November 14, 2026. See FRESH_START.md for provenance and disclosed prior research.

Team Zoriana: Christian Munoz, and Iryna Khoroshavina Munoz (overall design and how the app is used).

**Live app: https://zoriana.fly.dev/** · Demo slides: [demo/zoriana-demo.pdf](demo/zoriana-demo.pdf) · Form text: [SUBMISSION.md](SUBMISSION.md) · References: [REFERENCES.md](REFERENCES.md)

## Run locally

Requires Node 22.12+ (Node 25.9 used for validation).

```sh
npm install
npm run dev
```

Open http://127.0.0.1:4174. On this Mac, double-click `Start Zoriana.command`.

`npm test` verifies the Horizons parser, time interpolation, visibility integration, and coordinate transforms. `npm run build` bundles the frontend. The built frontend still needs the `/api/ephemeris` backend, which is the same Node server.

The NASA terrain grids are too large for git. `data/terrain-manifest.json` lists each file's source URL and SHA-256; download them into `data/` and run `python3 scripts/prepare-terrain.py` before starting the server.

## Run in production and deploy

`npm run build && npm start` serves the built app from `dist/` with `NODE_ENV=production`. In that mode the server needs no npm packages, listens on `PORT` (default 4174) on all interfaces, sends gzip copies of files that have a `.gz` twin, answers `/healthz`, limits each visitor to 400 API requests per five minutes, loads the terrain grids at start-up (about 375 MB of LOLA terrain with the north-polar grid), and then fetches today's data (UTC) for the 18 curated sites, again whenever the date changes, so visitors share those answers instead of each waiting in the one-at-a-time JPL queue.

The public copy runs on Fly.io from the `Dockerfile` and `fly.toml` in this repository: one always-on shared-CPU machine with 1 GB of memory in San Jose (the server holds about 375 MB of LOLA terrain in memory; the machine showed about 600 MB in use and 387 MB available on November 15, 2026). Deploy with `fly deploy --ha=false` from a checkout that has the terrain files in `data/`. Measured on November 15, 2026: a site that has not been requested before answers in about 1 second (terrain horizon under 1 second, plus two JPL Horizons requests).

## First-build features

- Draggable lunar globe, scroll/pinch zoom, touch rotation, north-up reset.
- Freshly downloaded 8K NASA mosaic with a LOLA-derived visual bump map.
- Explore, Landing and Satellite modes. Landing tilts the camera over the selected site with true-scale LOLA relief (see Navigator interface); Satellite shows unlit reference imagery. None of these is a ground-level panorama.
- Search historic locations/regions, enter latitude and east longitude, or drop a custom pin: right-click the Moon (long-press on touch screens), or use the pin tool and click.
- Compare two places in two clicks: Shift-click (or right-click) a marker to add it to the comparison, or Shift-click the bare Moon to pin that spot and add it.
- Live Sun and Earth apparent azimuth/elevation and distance from NASA/JPL Horizons for the exact coordinates, at DEM elevation plus a two-meter observer height.
- Thirty-one-day hourly series from the landing date (one full lunar day plus room for a landing hour), interactive time interpolation/playback over the 30 days after landing, and side-by-side comparison of up to four site-and-date options.
- "Sun and Earth together": the time when both body centers are above the selected horizon at once, shown on the site card, in the comparison and in the ranking (`together` and `stayMetrics` in `src/windows.mjs`). It is a geometric overlap, not a power or link budget.
- Permanently shadowed regions at both poles, drawn in blue from NASA's LOLA maps, with a per-site "Permanent shadow" fact (inside one, or how far the nearest is).
- A where-to-land heat map from NASA's long-term average Sun and Earth visibility maps, a long-term average for each polar site, and a button that finds the best spot within 15 km for the chosen landing time and stay.
- Search across the 9,087 IAU-named lunar features; pins and blocking terrain are described by the named feature they fall in.
- Eclipses of the Sun by Earth, counted in every sunlight figure and shown on the globe, and a slope layer near both poles.
- Past missions show their full landing date, with a "See it at touchdown" button that sets the date and hour to the real landing time. Future missions show only the announced year, because no landing date has been published.
- The best landing hour in the next 30 days for Sun and Earth together, a step-by-step "How was this worked out?" under each sky chart, and a global Earth view showing where Earth is up and where it rises and sets.
- Sun and Earth as discs: each tile shows how much of the disc clears the skyline, and the stay summary gives hours of full Sun, hours with any Sun, and the next first light and full disc.
- Mission durations of 24, 48, 72, or 168 hours from the chosen landing date and hour (UTC), with a terrain-aware horizon toggle. Under the totals the stay is also written out as times: when there is no sunlight, when Earth is out of view, and when both are available together.
- The timeline opens at the landing time (T+0), so the clock and the Sun and Earth angles first shown are those for the landing date and hour chosen; the clock shows the year. A visit with no date in the link opens on the present hour. Share links written before this change that carry no `t` value now open at the landing time instead of twelve hours after it.
- Search reads coordinates in the common forms: `-89.5, 45`, `89.5S 45E`, `84.6000° S 31.0000° E` (as the site card prints them) and east longitudes from 0° to 360°. Selecting a site's coordinates copies them as `latitude, east longitude`.
- Each site card opens with the answer in a sentence and its countdown; the numbers (azimuth, disc share, distances, data sources) can be folded away with one button, and start folded on phones. The caution line and the plain sentences always stay.
- "Find landing times" lists the arrival times after which sunlight, Earth view or both hold without a break for the hours you ask for (`arrivalWindows` in `src/windows.mjs`). The ranking can be limited to sites with at least a chosen number of sunlit and Earth-view hours.
- **Fly-by**: a camera pass over any site or pin, on true-scale LOLA terrain with NASA imagery and the sunlight calculated for the chosen time. It can be paused and played at half or double speed. Four are listed to start from: Shackleton, Tycho, Copernicus and the Apollo 11 site. During the flight, captions say what the place is, what the ground does (a crater's depth is measured from the terrain on screen) and what a lander would get there; a "123" button shows the numbers behind each one. See "Fly-by" in `METHOD.md`.
- **Apollo 11 replay**: the whole July 1969 flight in 3D, from the pad to the Moon and back, in 27 steps with captions. Guided, follow, window and whole-route cameras; guided pace, real time, or up to 10,000 times faster. Event times are NASA's, the Moon, Sun and third-stage path are JPL's, and the rest of the path is rebuilt between them (see METHOD.md, "Apollo 11 replay"). Open it from the Apollo 11 site card, the "Mission replay" row, or `/?replay=apollo11`.
- The Landing view's terrain is now finer away from the far south: the server sends a 513 × 513 grid of heights per site (`GET /api/terrain-patch?lat=…&lon=…`, 16-bit meters), about 590 m apart from the 474 m global grid, or about 270 m apart near the poles from the 40 m and 80 m grids (`src/patch-grid.mjs`, `getPatch` in `terrain-service.mjs`).
- On a phone, press and hold the Moon to drop a pin.
- Every answer from the server and every CSV export carries the app version; the server's answers also say exactly what was asked of JPL Horizons and which ephemeris JPL used. `METHOD.md` has a conventions table and a "Reproduce a result" recipe, and `scripts/check-convergence.mjs` repeats the sampling checks.
- Pins you drop are named Pin A, Pin B and so on, in the order they first appear, and the comparison prints their coordinates to three decimals (about 30 m) so that nearby pins can be told apart.
- Browser/session caches and a serialized, bounded-cache JPL service. Network failures never substitute synthetic observations.

## Scientific scope

This is an exploratory planning prototype. Body-center elevations are compared with the reference horizon, with no atmosphere. The terrain-aware model described below includes eclipses of the Sun by Earth (see "Eclipses") but does not include Earth ground-station visibility, antenna link budgets, solar-array orientation, battery capacity, or thermal models. Sun-above-horizon duration is not usable power and Earth-above-horizon duration is not a guaranteed communication window. Hourly interpolation can miss short events; near-pole local terrain is especially important.

NASA's CGI mosaic is optimized for aesthetics, including polar gap filling. It is not a quantitative terrain product. A separate quantitative DEM-based skyline drives site visibility; the globe relief is downsampled for rendering. Do not treat regional exploration pins as safe landing sites.

## Sources and attribution

- NASA Scientific Visualization Studio, CGI Moon Kit, Ernie Wright: https://svs.gsfc.nasa.gov/4720/
- Color texture: NASA LRO/LROC 2019 8K map, downloaded anew on November 14, 2026; TIFF converted to JPEG with macOS sips. https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_8k.tif
- Visual bump map: NASA LOLA-derived low-resolution map, downloaded anew. https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_3_8bit.jpg
- Earth imagery: NASA Blue Marble: Next Generation with topography and bathymetry, December 2004 (`world.topo.bathy.200412.3x5400x2700.jpg`, NASA Earth Observatory, Reto Stöckli), downloaded November 14, 2026 and resized to 2048×1024 with macOS sips as `public/assets/earth-blue-marble-2k.jpg`. https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography-bathymetry/december/world.topo.bathy.200412.3x5400x2700.jpg
- NASA/JPL Horizons observer ephemerides: https://ssd.jpl.nasa.gov/horizons/ and https://ssd-api.jpl.nasa.gov/doc/horizons.html
- Three.js (MIT) and Vite (MIT); exact versions in package-lock.json.
- Typography uses the system font stack (no web fonts are downloaded). Interface icons are original inline SVG drawings.
- App icon: the team's official icon, supplied on November 14, 2026 (source file dated that evening). `public/assets/icon-512.png`, `icon-192.png` and `favicon.png` are that image cropped to its rounded square, given transparent corners and resized with Pillow; nothing was redrawn (`scripts/prepare-icon.py`). The icon was made with ChatGPT (OpenAI), an AI image tool, so each copy carries a visible "AI" mark in its lower-right corner, as the organizers' guide requires for AI-generated images. Clicking the icon in the app also says so, as do the method sheet, the page metadata and the demo's first slide.

License: the code is under the MIT License (see LICENSE). That license does not cover the NASA data and imagery in `public/assets/` and `demo/img/`, which remain under NASA's own terms (generally free to use with credit), or the app icon.

NASA imagery does not imply NASA endorsement. AI coding assistance: OpenAI Codex (first build, terrain and shadow model) and Anthropic Claude Code (map-style interface redesign and landing view on November 14, 2026). No code or assets were copied from the earlier Zoriana project.

Apollo Lunar Module coordinates (Apollo 11, 12, 14, 15, 16 and 17) come from NASA's NSSDC table "Apollo Landing Site Coordinates" (LRO-derived, planetocentric mean-Earth/polar-axis frame, DE421; last updated March 6, 2017): https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html

Other curated site coordinates (rounded published values; verify against the primary source before citing them):
- IM-1 Odysseus, 80.13°S 1.44°E (Malapert A): https://en.wikipedia.org/wiki/IM-1
- Blue Ghost Mission 1, 18.56°N 61.81°E (Mare Crisium): https://www.lroc.im-ldi.com/images/1400
- Chandrayaan-3, 69.373°S 32.319°E (Statio Shiv Shakti): https://en.wikipedia.org/wiki/Statio_Shiv_Shakti
- SLIM, 13.3160°S 25.2510°E (JAXA target point; touchdown was about 55 m away): https://darts.isas.jaxa.jp/en/missions/slim
- IM-2 Athena, 84.7906°S 29.1957°E (Mons Mouton, landed 2025): https://en.wikipedia.org/wiki/IM-2 ; LROC lists the intended site as 84.78°S 29.13°E at https://www.lroc.asu.edu/images/1401

Future mission targets (checked November 14, 2026). These missions have announced a region, not a landing point. Each entry uses the center of the named feature, or a published candidate point, and the app shows a note saying so:
- Blue Moon Pathfinder Mission 1 (Blue Origin, planned 2027), Shackleton connecting ridge: candidate point "Site 001", 89.45°S 222.69°E, from Boazman et al. 2022, Planetary Science Journal 3:275. Mission: https://en.wikipedia.org/wiki/Blue_Moon_Pathfinder_Mission_1
- Griffin Mission One (Astrobotic, CLPS, planned early 2027), Nobile region: center of Nobile crater, 85.28°S 53.27°E. https://en.wikipedia.org/wiki/Griffin_Mission_One and https://en.wikipedia.org/wiki/Nobile_(crater)
- IM-4 (Intuitive Machines, CLPS, planned 2027), Mons Mouton plateau: center of Mons Mouton, 84.6°S 31.0°E. https://en.wikipedia.org/wiki/IM-4 and https://en.wikipedia.org/wiki/Mons_Mouton
- IM-3 Trinity (Intuitive Machines, CLPS, planned early 2027), Reiner Gamma: center of the swirl, 7.5°N 59.0°W. https://en.wikipedia.org/wiki/IM-3 and https://en.wikipedia.org/wiki/Reiner_Gamma
- Blue Ghost Mission 3 (Firefly, CLPS, planned 2028), Mons Gruithuisen Gamma: center of the dome, 36.56°N 40.72°W. https://en.wikipedia.org/wiki/Mons_Gruithuisen_Gamma
- Not listed: Blue Ghost Mission 2 (far side, no coordinates found) and Artemis IV (no landing site selected).
- Schedules and targets change. Re-check them before relying on these entries.

## Navigator interface

The interface takes its inspiration from everyday map and navigation apps, so a first-time user can read it without training. All layout, icons and code are original to this project:

- **Phone layout**: the planner becomes a bottom sheet with three heights. Drag its handle, tap the handle to step through the heights, or pull the content down from its top to shrink it and see more of the Moon.
- **Status rail** (left): mission clock for the selected time, an Earth-link indicator and a sunlight indicator for the selected site, and shortcuts to search, comparison and the method sheet. The indicators are binary (body center above or below the selected horizon); they are not link-budget or power estimates.
- **Site list and place card**: sites are grouped as South Pole, Future, CLPS, International and Apollo. Future entries are announced target regions for planned missions and carry an "approximate" note. The place card leads with a next-event banner: a countdown to the next sunrise, sunset, Earthrise or Earthset at that site, followed by the other body's next event. Icons are original drawings: a shadowed crater (South Pole), a solar-panel lander (CLPS), a flag (International), and a Lunar Module front view (Apollo). Missions have their own icons: a tall tower on wide legs (the Nova-C landers: IM-1, IM-2, IM-3, IM-4), a low wide body with a dish (Blue Ghost missions), a box with a rover ramp (Chandrayaan-3), a panel-covered box with a dome (SLIM), a tall ribbed column under a wider top deck (Blue Moon Pathfinder, the Mark 1 lander) and a wide flat deck carrying a payload (Griffin). Future missions keep their lander's icon in the Future group's green. They were drawn after looking at general reference pictures of each spacecraft (supplied by the team for Apollo and SLIM, Wikipedia article photographs for the others; the Blue Moon icon follows a NASA photograph of the Mark 1 lander); nothing was traced or copied. No mission patches or agency insignia are used.
- **Sight lines**: gold and blue lines on the globe point from the selected site toward the Sun and Earth at the selected time, dashed when the body is hidden. Their length follows the zoom level and has no physical meaning.
- **Sun and Earth in space**: two dashed markers show where the Sun and Earth are directly overhead at the selected time (the sub-solar and sub-Earth points; hover for coordinates). Earth is drawn in its true direction at its true size and at its JPL distance for the selected time (357,629 to 404,670 km in the 30 days from November 15, 2026), lit by the same Sun, so its apparent size and phase are right. It carries NASA Blue Marble imagery (December, cloud-free) turned to show the face that points at the Moon at the selected time; that turn uses Earth's rotation angle and the IAU model of the Moon's rotation (`src/earth-orientation.mjs`), which reproduces the JPL sub-solar points to within 0.15° over 30 days. Earth follows the map modes the same way the Moon does: in Explore and Landing it is lit by the modeled Sun and shows its phase; in Satellite, or with the Sunlight layer off, it shows the plain NASA imagery with no lighting. When lit, the night side is drawn faintly, not physically, so a thin crescent stays readable. Clouds, city lights and seasons are not shown. The Sun is drawn in its true direction and apparent size but much closer than it really is. Positions come from the same JPL Horizons angles as the site data; Earth's position is shifted from the site to the Moon's center using the JPL range for that hour (`centeredPosition` in `src/ephemeris.mjs`). The site card shows the distance from the site to Earth and to the Sun. The landing view opens facing Earth and tilts far enough to bring it into frame when it is above the horizon (up to 85° from vertical); if a site is opened before its data arrives, the camera turns to Earth once it is known unless you have already moved it. The Face Earth and Face Sun buttons do the same for either body.
- **Sky from the surface**: 360° terrain horizon with the current Sun and Earth positions and dotted paths over the selected stay.
- **Timeline**: the scrubber sits on two bands (gold = sunlit, blue = Earth in view) for the 30 days after landing, with the stay length marked.
- **Rank landing sites**: one click (the orange button on the rail, or "Rank all sites" in the list) ranks every listed site, or one group, for the selected landing date and stay. Columns: hours with the Sun and Earth up together, sunlit hours, Earth-in-view hours, and the Sun's average elevation while the site is sunlit. Select a heading to sort by it, a site to open it, or the plus button to add it to the comparison. Rows fill in as each site's data arrives; the first ranking of all sites takes about half a minute because the JPL requests run one at a time, and repeats are instant. It ranks geometry only.
- **Plain-language help**: each site card states in words where the Sun and Earth are and what hides them ("hidden by terrain 360 m away to the east-northeast, which rises to 7.9°"), summarizes the stay in a sentence, and carries a line saying the results are geometry, not power, a radio link or landing safety. The site list has three short explainers: how to read the app, why the south pole, and why some craters never see the Sun. The 30-day summary lists each Earth outage and the longest one.
- **Share and export**: the address bar always holds the current view (site or pin, landing date and hour, time, stay, terrain setting, map mode and comparison options), so a link reopens it; **Share** and **Copy link** copy it. The comparison and the ranking each export to CSV with coordinates, landing time, stay, horizon model, the three hour totals, Sun height, elevation, slope and data source. Code: `writeUrl` / `restoreFromUrl` in `src/main.js`, `src/export.mjs`.
- **Landing date and hour**: dates from 1950 to 2099 are accepted, and a landing hour (UTC) sets when the stay begins. The time slider now spans the 30 days after landing; playback advances one hour per step.
- **Benchmark**: for the Apollo 11 landing the app gives Sun elevation 10.7°, azimuth 88.8° at 20:15 UTC on 1969-07-20; the Apollo Lunar Surface Journal lists 10.65°, 88.81° at touchdown (20:17:39 UTC). https://www.nasa.gov/history/alsj/alsj-EarthSun_AltAz.html
- **Comparison**: up to four options, each a site on a landing date, so the same site can be compared across dates as well as against other sites. Options are aligned by mission time with a shared cursor. The first option is the baseline and the others show their difference in sunlit and Earth-visible hours. Each option has three bands: sunlit, Earth in view, and both together (green). "Most sunlight", "Longest Earth view" and "Most Sun + Earth" tags appear when one option is strictly ahead. Each card states the stay in a sentence, shows the Sun's average height and the site's slope, and can add the same site 1, 3, 7, 14 or 30 days later in one click.
- **Lunar day ahead**: a 30-day chart for the selected site (a lunar day and night last about 29.5 days). Bands show sunlit and Earth-in-view periods; bars score every possible landing day by the sunlit hours of the selected stay. Selecting a day moves the landing date. The summary lists the sunlit share, the longest sunlit and dark stretches (marked "≥" when they run past the window), peak Sun elevation, and the most sunlit landing day for the stay (Earth visibility is the tie-break). Logic: `src/windows.mjs`, tested in `tests/windows.test.mjs`.
- **Open in QuickMap / Moon Trek**: every site card links to the same location in the two NASA map tools named by the challenge, using each tool's south-polar projection poleward of 80° latitude. Link formats were checked against the live sites on November 14, 2026 (south-polar and mid-latitude cases; the north-polar form follows the same pattern and was not opened). Code: `src/links.mjs`.
- **Choose Map**: Explore, Landing and Satellite.
- **Landing view**: a tilted camera orbits the selected site, facing Earth by default so the blue sight line runs up the screen. Drag to change heading and tilt; the compass rotates to show north, and two buttons turn the view to face Earth or the Sun. The ground under the camera is a round, soft-edged, true-scale mesh (no vertical exaggeration) built in the browser from the same averaged LOLA grids as the shadow layer: 160 m spacing within about 48 km of sites south of 86.6°S, 3.8 km spacing within about 260 km elsewhere. It uses the same traced shadow masks as the globe, plus a faint camera-side fill light so relief stays readable in shadow; that fill is not sunlight. Imagery stays at the 8K mosaic resolution (about 1.3 km per pixel at the equator, stretched near the poles), so close views are soft. The mesh is illustrative; site metrics still use the finer server-side horizon model. Code: `src/surface-patch.mjs`.

## Terrain-aware upgrade

Visibility now compares Sun/Earth body centers with a sampled local LOLA terrain skyline. JPL observer altitude uses the DEM elevation plus 2 meters. The terrain toggle compares those same observations against the reference horizon. Comparisons use the same selected model.

- South of 85°S: PDS LOLA LDEM_85S_40M V2.0, 40-meter polar stereographic grid (spacing at the pole), half-meter height units relative to 1,737,400 meters. Source: https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/ldem_85s_40m.lbl
- North of 80°N: PDS LOLA LDEM_80N_80M, 80-meter polar stereographic grid (0° longitude points down the image; the south-polar grids point it up). Optional in the same way as the 80°S grid. Its orientation was confirmed against the global grid: 61 m RMS difference over 4,000 points, against 1,160 m with the other orientation. Source: https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/ldem_80n_80m.lbl
- From 80°S to 85°S: PDS LOLA LDEM_80S_80M V2.0, 80-meter polar stereographic grid, same units and reference radius. Optional: when `data/lola_80s_80m/ldem_80s_80m.img` is absent this band falls back to the global grid. It feeds site horizons and slope only; the shadow layer and landing-view relief still use the 160 m (south of 85°S) and 3.8 km grids. Source: https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/ldem_80s_80m.lbl
- Everywhere else (between 80°S and 80°N): PDS LOLA LDEM_64, a global grid of 64 pixels per degree (474 m at the equator), half-meter height units, 530 MB. The server reads only the part of the file around the site (about 11° each way), so memory use stays small. Optional: when `data/lola_global_64/ldem_64.img` is absent this falls back to the 1.9 km grid below. Its orientation was confirmed against that grid: 65 m RMS difference over 3,000 points. Source: https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/ldem_64.img
- Fallback and terrain beyond the window: quantitative NASA SVS LOLA LDEM_16 float TIFF, 16 pixels per degree (about 1.9 km north/south spacing). TIFF kilometer heights are converted to half-meter signed integers; the scientific data is not taken from the decorative bump image.
- Skyline: great-circle rays every 0.25°, out to 300 km, including lunar curvature. Radial samples adapt to raster spacing and distance. Bilinear raster and angular interpolation can miss small or narrow ridges. Coarse global results are particularly limited; grid spacing is not an accuracy guarantee.
- Slope: a central difference across one grid cell either side of the site (80 m baseline south of 85°S, 160 m from 80°S to 85°S, 948 m elsewhere, or 3.8 km, labeled regional, if the 474 m grid is not installed). It describes the DEM at that scale; rocks, small craters and lander-scale hazards are not resolved. Check: the IM-1 site reads 11.5° over 160 m, in line with the roughly 12° slope reported for that landing site.
- Events: five-minute terrain-clearance samples made from hourly JPL positions. Disc shares are reported for the selected site (see "Sun and Earth as discs"); hour totals, the ranking and the comparison count body centers. Eclipses are evaluated separately (see "Eclipses"). No ground-station or link-budget guarantees.
- JPL Horizons reports `MEAN_ME (high precision)` as the lunar frame for surface sites (checked November 15, 2026), the same mean-Earth frame as the LOLA products and the Apollo coordinates.
- The global and polar products use different versions of the lunar mean-Earth frame and resolutions; small registration differences and coarse/fine boundary discontinuities remain possible. This is an exploratory model, not a validated landing-safety tool.

The other listed engineering factors remain out of scope. The Sunlight layer now renders approximate terrain-cast shadows; the local horizon chart and site metrics use finer, separate calculations.

`python3 scripts/prepare-terrain.py` regenerates derived grids and the separate small rendering texture from the downloaded NASA inputs. `data/terrain-manifest.json` records source URLs, units and SHA-256 hashes. `node scripts/check-terrain.mjs` checks projection consistency at sample locations and cached computation timing.

Performance: terrain computations live in a Node worker and are cached by location across dates. The browser receives only compact horizon profiles. Rendering stops after camera damping settles, labels use CSS transforms, pixel ratio is capped at 1.5, and the large panel avoids backdrop blur. The 8K color texture is retained.

For an opt-in browser check, open http://127.0.0.1:4174/?diagnostics=1 and choose “Run 6-second motion check”. This animates orbit and zoom and reports actual rendered frames with GPU completion waits, not just requestAnimationFrame callbacks. GPU waits add benchmark overhead and do not run in normal use. Run it in native Safari to obtain Safari-specific evidence.

## Permanently shadowed regions

The map button with the half-filled circle shows or hides NASA's maps of ground that never receives direct sunlight, at both poles. It is on by default and is carried in share links (`psr=off` when hidden). It is hidden while a heat map is showing.

- Sources: LRO LOLA products LPSR_75S_120M_201608 and LPSR_75N_120M_201608 (data set LRO-L-LOLA-4-GDR-V1.0, created September 2016), 7624 × 7624 binary grids at 120 m per pixel in polar stereographic projection covering 75° to each pole. Method: Mazarico et al. 2011, Icarus 211, 1066–1081. https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/extras/illumination/img/
- `python3 scripts/prepare-illumination.py` averages 2 × 2 blocks into `public/assets/psr-south-240m.png` and `psr-north-240m.png` (3812 × 3812, 240 m cells, each pixel the shadowed share of its cell). Source hashes are recorded in `data/illumination-manifest.json`.
- Drawing: `src/psr.mjs` adds a tint to the globe, satellite and landing-view materials, looked up per pixel from the surface direction. In the south image 0° longitude points up; in the north image it points down.
- Site fact: the app reads a 24 km window of the mask around the site. A cell counts as shadowed when at least half of it is. The card says "Yes", or "No" with the distance to the nearest shadowed cell, or "Not mapped here" more than 15° from a pole.
- Checks: the floors of Shackleton, Haworth, Shoemaker, Faustini and Cabeus (south) and of Hermite A and Nansen F (north) read as shadowed; the Malapert massif point and a Shackleton ridge point do not. NASA's Earth-visibility maps confirm the orientation: the near-side half of each polar map is the half with Earth in view.
- Limits: within 15° of each pole only. The maps are NASA's long-term result and do not depend on the date you pick; the live shadow layer is a separate, coarser calculation, so the two can disagree at edges. A permanently shadowed spot is not proof of ice.

## Uncertainty on rise and set times

Beside each sunrise, sunset, Earthrise and Earthset time in the countdown banner the app now shows a "±": how much the time would move if the skyline at that point were 0.1° higher or lower (`crossingSpread` in `src/windows.mjs`). 0.1° is about what the terrain grids can miss: a 50 m rise 30 km away. On open ground at low latitudes this is around ± 12 minutes; where the Sun or Earth slides along a ridge near a pole it can be hours or days, and the app says so. It is a sensitivity figure, not a statistical error bar.

## Check against a real lander

`scripts/check-event-times.mjs` compares single event times with what Firefly's Blue Ghost Mission 1 reported from 18.56°N 61.81°E in March 2025 (results in `data/event-check.json`).

- **Eclipse of March 14, 2025.** Firefly photographed the diamond ring, the Sun about to come out from behind Earth, "around 3:30 am CDT" (08:30 UTC). The app ends totality at this site at 08:30 UTC, in five-minute steps. Firefly's first look at the eclipse was around 05:30 UTC; the app starts covering the Sun at 05:05. All four of the app's times fall where they should against the published contact times for the Moon as a whole.
- **Sunset of March 16, 2025.** Firefly said the lander "operated just over 5 hours into the lunar night with the final data received around 6:15 pm CDT" (23:15 UTC), so its night began shortly before 18:15 UTC. The app has the Sun starting to be covered at 19:20, its center setting at 19:48 UTC (± 12 min) and the last light at 20:25: 1.1 to 2.2 hours later than Firefly's figure. JPL's sub-solar point, a separate route, puts the center of the Sun on a smooth Moon's horizon at 20:10, so the Sun-position chain is not the cause. At 18:15 the Sun's center was still 0.9° above a smooth horizon. Either Firefly counted night from when the low Sun stopped being useful to the lander, or ground near the lander, smaller than the 474 m grid can show, hid it early. We do not know which, and report the difference as found.

The full method text that used to sit in the app's method sheet is in `METHOD.md`.

## Where-to-land heat map

The map button with the concentric rings opens a **Map layers** menu: Off, Average sunlight, Average Earth view, Sun × Earth score and Slope, each with a one-line description. On a first visit the icon buttons show their names for a few seconds; after that the names appear on hover. Share links carry it (`heat=sun`, `earth` or `both`).

- Sources: LRO LOLA products AVGVISIB_75S_120M_201608 and AVGVISIB_75N_120M_201608, and their `_EARTH` versions (same data set and directory as above). Each value is the share of time steps, in NASA's long-term simulation, in which any part of the Sun's (or Earth's) disc was visible from that 120 m pixel.
- `scripts/prepare-illumination.py` averages 4 × 4 blocks into `public/assets/heat-south-480m.webp` and `heat-north-480m.webp` (1906 × 1906, lossless): red = mean Sun share, green = mean Earth share, blue = the highest Sun share among the 16 source pixels. They are downloaded only when the heat map or a polar site needs them (about 5 MB each).
- NASA's maps end 15° from each pole. The heat map fades out over the last five degrees (75° to 80°) instead of stopping on a hard circle, which looked like a disc pasted on the Moon.
- Drawing: one color per map (yellow, blue, green) whose strength fades in over the range in the legend (sunlight 15% to 55%, Earth 10% to 90%, score 0.08 to 0.48). At 480 m, ordinary polar ground is sunlit about 40% of the time and the best 1% of cells about 50%, so shadowed ground stays clear, ordinary ground is tinted and the best ground glows. Within 5° of the south pole the score's 95th percentile is 0.20 and its 99.9th is 0.47; farther out, open near-side plains score about 0.45 because Earth is always in view there.
- Site card: "Long-term average" gives the Sun and Earth shares for the site's cell. "Find best spot within 15 km" works in two steps: `topCells` in `src/psr.mjs` picks the twenty best-scoring cells within 15 km that are at least 1.4 km apart, then each is run through the full calculation for the chosen landing time and stay, and the one with the most hours of Sun and Earth together gets a pin. If none beats the current site, the app says so.
- Earth view: outside the polar maps the Earth map is plain geometry, not NASA's product: a blue wash where Earth is above level ground at the selected time, and a brighter band within about 8° of the edge of the mean near side, where libration makes Earth rise and set.
- Limits: long-term averages over a 480 m cell, counted when any part of the disc shows. They say nothing about a particular date, which is what the rest of the app is for. The score multiplies two averages; it is a guide to where to look, not a measured overlap. A small peak can be diluted by its cell: the best 120 m pixel reads 90%, the best 480 m cell 63%.

## Sun and Earth as discs

`src/disc.mjs` measures how much of the Sun's or Earth's disc is above the skyline. The angular radius comes from the JPL distance (Sun about 0.27°, Earth about 0.95°). The disc is cut into 15 vertical strips and each strip is compared with the terrain horizon at its own azimuth, so a ridge to one side hides only that side. The disc is a plain circle of even brightness (no limb darkening), sampled every five minutes.

- Tiles: "Disc showing" percentage for the Sun and for Earth; the status reads "partly hidden" while the share is between 0 and 100%.
- Stay summary: hours with the full Sun, hours with at least part of it, and the next two limb events (first light, full disc, start of covering, last light).
- CSV exports carry `sun_full_disc_hours` and `sun_any_disc_hours`.
- Sunlit and Earth-in-view hours, the 30-day bands, the ranking and the comparison still count the center of the body. Example: at the Shackleton region point from November 15, 2026 the Sun's center rises on November 24 at 02:35 UTC, while the first edge shows at about 20:45 on November 23 and the full disc is not clear until about 20:35 on November 24.

## Benchmark against published Apollo Sun angles

`node scripts/benchmark-apollo.mjs` (with the server running) compares the app's Sun elevation and azimuth with NASA's table "Solar Phase Angles during the Apollo Lunar Stays" in the Apollo Lunar Surface Journal's "Working on the Moon: Thermal Environment" page, for the landing and the end of the last moonwalk of Apollo 11, 12, 14, 15, 16 and 17. Results are saved in `data/benchmark-apollo.json`.

- 12 angle cases: largest elevation difference 0.7°, largest azimuth difference 2.57°.
- 6 sunrises (level horizon, Sun's center): 22 to 73 minutes from the table's times.
- For Apollo 11 the Journal's JPL-based touchdown figure (10.65°, 88.81° at 20:17:39 UTC) and this app (10.71°, 88.81° at 20:18) agree to 0.06°, while the table gives 10.3°, 88.1°. The table is rounded to 0.1° and how it was computed is not stated, so we treat it as a looser yardstick.
- Where the difference comes from: the script works back from each pair of angles to the point on the Moon where the Sun is overhead. The table's point is a steady 0.42° east of JPL's (0.35° to 0.47°, about 50 minutes of Sun motion, which accounts for the elevation and sunrise offsets) and between 1.79° south and 1.80° north of it. The table's point reaches 2.01° from the lunar equator, where the Sun can never be more than about 1.6° (JPL's largest value in these cases is 1.56°). That latitude error is what produces the azimuth gaps of about 2° at Apollo 14, 15 and 16. So the difference lies in the Sun position the table used, not in the sites or in this app. How the table was computed is not stated on the page.

## Check against NASA's long-term maps

`node scripts/validate-illumination.mjs` (with the server running and NASA's maps in `data/`) asks the app for the share of time that any part of the Sun's, and of Earth's, disc is above its own terrain skyline over 347 days from January 1, 2026 (about one cycle of lunar seasons), at ten polar points, and compares it with NASA's AVGVISIB 120 m pixel at the same place. Results are saved in `data/validation-illumination.json`.

| Point | Sun: app | Sun: NASA (neighbors) | Earth: app | Earth: NASA (neighbors) |
|---|---|---|---|---|
| Shackleton region | 11.7% | 12.1% (12–14) | 42.5% | 46.8% (46–48) |
| Blue Moon Pathfinder 1 point | 83.5% | 67.7% (51–85) | 50.8% | 52.3% (44–58) |
| Best spot near Shackleton | 51.0% | 46.4% (37–71) | 53.9% | 56.7% (52–57) |
| Malapert region | 44.1% | 44.0% (40–44) | 100.0% | 100.0% |
| Griffin Mission One point | 34.4% | 35.8% (36–36) | 26.6% | 29.9% (30–30) |
| IM-2 Athena | 45.9% | 46.8% (43–47) | 93.6% | 93.1% (79–93) |
| IM-4 point | 32.1% | 33.9% (27–36) | 57.9% | 62.1% (59–64) |
| IM-1 Odysseus | 40.1% | 35.6% (34–40) | 100.0% | 100.0% |
| North pole rim point (89.3°N 125°E) | 7.6% | 8.0% (3–10) | 2.5% | 0.9% (0–6) |
| 86°N 30°E | 23.2% | 22.2% (18–24) | 54.6% | 50.2% (40–54) |

- Sun: mean absolute difference 3.1 percentage points, largest 15.8. Earth: mean 2.3, largest 4.5.
- Nine of the ten Sun values are within 5 points. The exception is the knife-edge ridge beside Shackleton, where NASA's own neighboring 120 m pixels run from 51% to 85%; the app's 84% lies inside that range.
- The two are not the same calculation: the app uses 40 m and 80 m terrain with an observer 2 m up and one year; NASA used a 120 m grid and a longer period. Agreement to a few points on ordinary ground is the claim; on sharp ridges a result depends on exactly where the point is.
- This checks long-run totals. It does not check individual rise and set times, which at grazing angles can move by hours with small changes in terrain or height.

## Place names

`python3 -I scripts/prepare-features.py` turns the IAU and USGS "Planetary Nomenclature of the Moon" center points (public domain, 9,087 features) into `public/assets/features.json`. The map labels the largest named features in view and adds smaller ones as you zoom in (22 labels at most, never over a site's own label). `src/features.mjs` searches the list and names places: a point takes the smallest round feature whose circle reaches it ("inside Shackleton", "near the rim of Malapert A", "on Mons Mouton"). Seas and mountains are used only when the point is well inside their circle, and long thin features such as rilles are never used, because a center and a diameter describe them poorly. When terrain hides the Sun or Earth, the app works out where that terrain is, names it if a feature covers it, and marks it on the map when zoomed in.

## Sharper imagery in the Landing view

The globe uses one 8K image (about 1.3 km per pixel at the equator), which is soft when zoomed in. When the Landing view opens on a site within 78° of the equator, `src/surface-patch.mjs` fetches a 9 × 9 block of 256-pixel tiles of the LRO wide-angle camera global mosaic from NASA Moon Trek (zoom level 8, about 83 m per pixel at the equator; the mosaic's native scale is about 100 m), covering roughly 190 km around the site.

- Only fine detail is taken from the tiles: each pixel's brightness relative to a blurred copy of the same mosaic (about 5 km) multiplies the 8K image. Broad tone and tint stay those of the 8K image, so the detailed area does not show as a patch. (Using the tiles directly made a visibly darker square; matching average brightness still left dark seas, because the two mosaics differ in contrast.)
- The tiles are requested from `trek.nasa.gov` by the visitor's browser, about 2 MB per site. Nothing is shown until all 81 have arrived; if any fails, the view keeps the 8K image.
- Near the poles this is not used: the mosaic is equirectangular, stretched there, and mostly in shadow.
- Like the 8K image, the mosaic carries the lighting of the day it was photographed. The app's own shadows are drawn on top of it.

## Eclipses

A few times a year Earth passes in front of the Sun as seen from the Moon (a lunar eclipse seen from Earth), and a site loses sunlight for hours whatever its terrain. `src/eclipse.mjs` works this out from the positions already loaded for the site: the angle between the centers of the Sun and Earth, their apparent sizes from the JPL distances, and the share of the Sun's disc that Earth covers.

- The Sun's center counts as hidden while it is behind Earth's disc, exactly as if Earth's edge were part of the skyline. That flows into sunlit hours, the timeline bands, the ranking, the comparison and the best landing time. The disc share is reduced by the covered part.
- The site card shows "Eclipse: Earth covers 42% of the Sun" or "Eclipsed by Earth", the countdown reads "until eclipse by Earth" and "until end of eclipse", "Lunar day ahead" lists each eclipse in the 30 days, and the globe dims by the covered share.
- Directions are interpolated as vectors between hourly samples, so the result holds near the zenith.
- Check against the published contact times of the two 2026 lunar eclipses (times UTC):

  | Eclipse | Published | App, by site |
  |---|---|---|
  | March 3, 2026 (total) | penumbral 08:44 to 14:23; umbral 09:50 to 13:17; whole Moon in totality 11:04 to 12:03 | Apollo 11: 09:30 to 14:00, total 10:35 to 12:50. Apollo 17: 09:30 to 14:05, total 10:35 to 13:00. South pole point: 09:30 to 13:30, total 10:55 to 12:05. North pole point: 09:20 to 14:00, total 10:20 to 12:55. |
  | August 28, 2026 (partial, 93%) | penumbral 01:23 to 07:02; umbral 02:33 to 05:52 | South pole point: 01:55 to 06:40, total 03:00 to 05:30. Apollo 11: 02:15 to 06:40, total 03:30 to 05:25. Far side 0°N 180°E: 02:00 to 06:20, total 03:15 to 05:05. North pole point: 02:15 to 06:05, never total (96% at most). |

  Every site's partial phase lies inside the penumbral contacts and every total phase inside the umbral contacts; on March 3 every site is total throughout the whole-Moon totality; and in the partial eclipse one end of the Moon (the north) is never fully covered, as a 93% eclipse requires. Site times are to the nearest five minutes.
- Beyond 2026: the calculation is the same for any date from 1950 to 2099. `node scripts/check-eclipses.mjs` runs it at three sites (Apollo 11, a south-pole point, a north-pole point) for every lunar eclipse in NASA's tables from 2026 to 2030, twelve in all, and saves the result in `data/eclipse-check.json`. All twelve are consistent: the four total eclipses hide the Sun completely at every site; the four partial ones touch every site and hide it completely at some; the four penumbral ones hide it completely nowhere and miss some sites altogether (July 18, 2027, the slightest, misses all three). Where a site sees the eclipse, its middle is within 14 minutes of NASA's time of greatest eclipse.
- "Lunar day ahead" also names the next eclipse on NASA's list (2026 to 2035, `src/eclipse-catalog.mjs`) with a button that jumps to it. The list only points to the date; what the site sees is always computed.
- Limits: two round discs. Earth's atmosphere makes the real shadow about 2% larger and lets some red light through, neither of which is modeled.

## Slope layer

The last step of the heat-map button draws slope within 10° of each pole (`heat=slope` in share links).

- `python3 scripts/prepare-slope.py` computes slope from NASA's LOLA 80 m polar grids (LDEM_80S_80M and LDEM_80N_80M) by central differences over a 160 m baseline, then reduces it to 320 m cells: the mean and the steepest slope in each cell, stored in `public/assets/slope-south-320m.webp` and `slope-north-320m.webp` (about 4 MB each, fetched when the layer is first shown).
- Amber marks cells averaging 5° to 10°, red above 10°; gentler ground is left clear. The layer fades out between 84° and 80° latitude.
- Checks: the IM-1 site reads 11.5° in the map and 11.5° on its site card; IM-4 8.8° (card 9.5° at the point); the Blue Moon Pathfinder 1 point 2.0° (card 2.7°). In the south 29% of cells are under 5° and 38% over 10°; the median is 7.9°.
- The best-spot finder uses each candidate's own slope from the server and puts ground gentler than 10° first; its message gives the slope.
- Limits: a 160 m baseline says nothing about rocks, small craters or lander-scale roughness. This is a caution about steep ground, not a hazard assessment.

## Interactive terrain shadows

Use the ☀ button in any map mode, scrub the time slider, or press Play. Explore and Landing default to sunlight; Satellite defaults to unlit imagery. No extra planning controls are required.

The GPU traces rays toward the current JPL Sun vector through quantitative LOLA heights on the curved Moon. This produces occlusion behind crater walls and ridges, beyond surface-normal lighting. Two cached masks cover the globe and the south pole. Their generation is coalesced after timeline input, uses a smaller preview during playback, and refines after 280 ms without a time change. Orbit/zoom reuses the masks; idle rendering remains off. Memory is bounded to the current masks, with no growing time-series texture cache.

Visual elevation grids average the full data to 2880×1440 globally (3.8 km north/south spacing) and 1896×1896 south of 85°S (160 m spacing). Settled shadow masks are 2048×1024 globally (~5.3 km equatorial pixels) and 1024×1024 over the 303.36 km polar square (~296 m). Preview masks use half these dimensions. Thus visual shadow coverage is not 40 m precision and may disagree near boundaries with the finer site metric. The ray trace uses up to 128 growing steps, a 500 km limit, and small height biases (8 m polar / 50 m global) to suppress self-intersection. Small obstacles, narrow ridges and finite solar-disk penumbrae are unresolved. Source mosaic lighting cannot be removed completely.

The diagnostics route also offers **Check shadow geometry**: it reads actual GPU results for 16 real-terrain fixtures and compares them with independent uniformly sampled CPU rays. This is a projection/occlusion regression check, not scientific certification.
