# Zoriana

Fresh NASA Space Apps 2026 lunar landing-site explorer, started November 14, 2026. See FRESH_START.md for provenance and disclosed prior research.

## Run locally

Requires Node 22.12+ (Node 25.9 used for validation).

```sh
npm install
npm run dev
```

Open http://127.0.0.1:4174. On this Mac, double-click `Start Zoriana.command`.

`npm test` verifies the Horizons parser, time interpolation, visibility integration, and coordinate transforms. `npm run build` bundles the frontend. The built frontend still needs the `/api/ephemeris` backend; this is a local development app, not a deployed service.

## First-build features

- Draggable lunar globe, scroll/pinch zoom, touch rotation, north-up reset.
- Freshly downloaded 8K NASA mosaic with a LOLA-derived visual bump map.
- Explore, Landing and Satellite modes. Landing tilts the camera over the selected site with true-scale LOLA relief (see Navigator interface); Satellite shows unlit reference imagery. None of these is a ground-level panorama.
- Search historic locations/regions, enter latitude and east longitude, or drop a custom pin: right-click the Moon (long-press on touch screens), or use the pin tool and click.
- Live Sun and Earth apparent azimuth/elevation and distance from NASA/JPL Horizons for the exact coordinates, at DEM elevation plus a two-meter observer height.
- Thirty-one-day hourly series from the landing date (one full lunar day plus room for a landing hour), interactive time interpolation/playback over the 30 days after landing, and side-by-side comparison of up to four site-and-date options.
- "Sun and Earth together": the time when both body centres are above the selected horizon at once, shown on the site card, in the comparison and in the ranking (`together` and `stayMetrics` in `src/windows.mjs`). It is a geometric overlap, not a power or link budget.
- Mission durations of 24, 72, or 168 hours from the chosen landing date and hour (UTC), with a terrain-aware horizon toggle.
- Browser/session caches and a serialized, bounded-cache JPL service. Network failures never substitute synthetic observations.

## Scientific scope

This is an exploratory planning prototype. Body-center elevations are compared with the reference horizon, with no atmosphere. The terrain-aware model described below does not include eclipses, Earth ground-station visibility, antenna link budgets, solar-array orientation, battery capacity, or thermal models. Sun-above-horizon duration is not usable power and Earth-above-horizon duration is not a guaranteed communication window. Hourly interpolation can miss short events; near-pole local terrain is especially important.

NASA's CGI mosaic is optimized for aesthetics, including polar gap filling. It is not a quantitative terrain product. A separate quantitative DEM-based skyline drives site visibility; the globe relief is downsampled for rendering. Do not treat regional exploration pins as safe landing sites.

## Sources and attribution

- NASA Scientific Visualization Studio, CGI Moon Kit, Ernie Wright: https://svs.gsfc.nasa.gov/4720/
- Color texture: NASA LRO/LROC 2019 8K map, downloaded anew on November 14, 2026; TIFF converted to JPEG with macOS sips. https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_8k.tif
- Visual bump map: NASA LOLA-derived low-resolution map, downloaded anew. https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_3_8bit.jpg
- Earth imagery: NASA Blue Marble: Next Generation with topography and bathymetry, December 2004 (`world.topo.bathy.200412.3x5400x2700.jpg`, NASA Earth Observatory, Reto Stöckli), downloaded November 14, 2026 and resized to 2048×1024 with macOS sips as `public/assets/earth-blue-marble-2k.jpg`. https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography-bathymetry/december/world.topo.bathy.200412.3x5400x2700.jpg
- NASA/JPL Horizons observer ephemerides: https://ssd.jpl.nasa.gov/horizons/ and https://ssd-api.jpl.nasa.gov/doc/horizons.html
- Three.js (MIT) and Vite (MIT); exact versions in package-lock.json.
- Typography uses the system font stack (no web fonts are downloaded). Interface icons are original inline SVG drawings.
- App icon: `public/assets/icon.svg`, a placeholder mark drawn in code on November 14, 2026. The earlier bitmap icon (dated November 13) was removed from the app. Replacement artwork must be made during the hackathon, and AI-generated images need a visible watermark.

NASA imagery does not imply NASA endorsement. AI coding assistance: OpenAI Codex (first build, terrain and shadow model) and Anthropic Claude Code (map-style interface redesign and landing view on November 14, 2026). No code or assets were copied from the earlier Zoriana project.

Apollo Lunar Module coordinates (Apollo 11, 12, 14, 15, 16 and 17) come from NASA's NSSDC table "Apollo Landing Site Coordinates" (LRO-derived, planetocentric mean-Earth/polar-axis frame, DE421; last updated March 6, 2017): https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html

Other curated site coordinates (rounded published values; verify against the primary source before citing them):
- IM-1 Odysseus, 80.13°S 1.44°E (Malapert A): https://en.wikipedia.org/wiki/IM-1
- Blue Ghost Mission 1, 18.56°N 61.81°E (Mare Crisium): https://www.lroc.im-ldi.com/images/1400
- Chandrayaan-3, 69.373°S 32.319°E (Statio Shiv Shakti): https://en.wikipedia.org/wiki/Statio_Shiv_Shakti
- SLIM, 13.3160°S 25.2510°E (JAXA target point; touchdown was about 55 m away): https://darts.isas.jaxa.jp/en/missions/slim
- IM-2 Athena, 84.7906°S 29.1957°E (Mons Mouton, landed 2025): https://en.wikipedia.org/wiki/IM-2 ; LROC lists the intended site as 84.78°S 29.13°E at https://www.lroc.asu.edu/images/1401

Future mission targets (checked November 14, 2026). These missions have announced a region, not a landing point. Each entry uses the centre of the named feature, or a published candidate point, and the app shows a note saying so:
- Blue Moon Pathfinder Mission 1 (Blue Origin, planned 2027), Shackleton connecting ridge: candidate point "Site 001", 89.45°S 222.69°E, from Boazman et al. 2022, Planetary Science Journal 3:275. Mission: https://en.wikipedia.org/wiki/Blue_Moon_Pathfinder_Mission_1
- Griffin Mission One (Astrobotic, CLPS, planned early 2027), Nobile region: centre of Nobile crater, 85.28°S 53.27°E. https://en.wikipedia.org/wiki/Griffin_Mission_One and https://en.wikipedia.org/wiki/Nobile_(crater)
- IM-4 (Intuitive Machines, CLPS, planned 2027), Mons Mouton plateau: centre of Mons Mouton, 84.6°S 31.0°E. https://en.wikipedia.org/wiki/IM-4 and https://en.wikipedia.org/wiki/Mons_Mouton
- IM-3 Trinity (Intuitive Machines, CLPS, planned early 2027), Reiner Gamma: centre of the swirl, 7.5°N 59.0°W. https://en.wikipedia.org/wiki/IM-3 and https://en.wikipedia.org/wiki/Reiner_Gamma
- Blue Ghost Mission 3 (Firefly, CLPS, planned 2028), Mons Gruithuisen Gamma: centre of the dome, 36.56°N 40.72°W. https://en.wikipedia.org/wiki/Mons_Gruithuisen_Gamma
- Not listed: Blue Ghost Mission 2 (far side, no coordinates found) and Artemis IV (no landing site selected).
- Schedules and targets change. Re-check them before relying on these entries.

## Navigator interface

The interface takes its inspiration from everyday map and navigation apps, so a first-time user can read it without training. All layout, icons and code are original to this project:

- **Status rail** (left): mission clock for the selected time, an Earth-link indicator and a sunlight indicator for the selected site, and shortcuts to search, comparison and the method sheet. The indicators are binary (body center above or below the selected horizon); they are not link-budget or power estimates.
- **Site list and place card**: sites are grouped as South Pole, Future, CLPS, International and Apollo. Future entries are announced target regions for planned missions and carry an "approximate" note. The place card leads with a next-event banner: a countdown to the next sunrise, sunset, Earthrise or Earthset at that site, followed by the other body's next event. Icons are original drawings: a shadowed crater (South Pole), a solar-panel lander (CLPS), a flag (International), and a Lunar Module front view (Apollo). Missions have their own icons: a tall tower on wide legs (the Nova-C landers: IM-1, IM-2, IM-3, IM-4), a low wide body with a dish (Blue Ghost missions), a box with a rover ramp (Chandrayaan-3), a panel-covered box with a dome (SLIM), a tall ribbed column under a wider top deck (Blue Moon Pathfinder, the Mark 1 lander) and a wide flat deck carrying a payload (Griffin). Future missions keep their lander's icon in the Future group's green. They were drawn after looking at general reference pictures of each spacecraft (supplied by the team for Apollo and SLIM, Wikipedia article photographs for the others; the Blue Moon icon follows a NASA photograph of the Mark 1 lander); nothing was traced or copied. No mission patches or agency insignia are used.
- **Sight lines**: gold and blue lines on the globe point from the selected site toward the Sun and Earth at the selected time, dashed when the body is hidden. Their length follows the zoom level and has no physical meaning.
- **Sun and Earth in space**: two dashed markers show where the Sun and Earth are directly overhead at the selected time (the sub-solar and sub-Earth points; hover for coordinates). Earth is drawn in its true direction at its true size and at its JPL distance for the selected time (357,629 to 404,670 km in the 30 days from November 15, 2026), lit by the same Sun, so its apparent size and phase are right. It carries NASA Blue Marble imagery (December, cloud-free) turned to show the face that points at the Moon at the selected time; that turn uses Earth's rotation angle and the IAU model of the Moon's rotation (`src/earth-orientation.mjs`), which reproduces the JPL sub-solar points to within 0.15° over 30 days. Earth follows the map modes the same way the Moon does: in Explore and Landing it is lit by the modelled Sun and shows its phase; in Satellite, or with the Sunlight layer off, it shows the plain NASA imagery with no lighting. When lit, the night side is drawn faintly, not physically, so a thin crescent stays readable. Clouds, city lights and seasons are not shown. The Sun is drawn in its true direction and apparent size but much closer than it really is. Positions come from the same JPL Horizons angles as the site data; Earth's position is shifted from the site to the Moon's centre using the JPL range for that hour (`centredPosition` in `src/ephemeris.mjs`). The site card shows the distance from the site to Earth and to the Sun. The landing view opens facing Earth and tilts far enough to bring it into frame when it is above the horizon (up to 85° from vertical); if a site is opened before its data arrives, the camera turns to Earth once it is known unless you have already moved it. The Face Earth and Face Sun buttons do the same for either body.
- **Sky from the surface**: 360° terrain horizon with the current Sun and Earth positions and dotted paths over the selected stay.
- **Timeline**: the scrubber sits on two bands (gold = sunlit, blue = Earth in view) for the 30 days after landing, with the stay length marked.
- **Rank landing sites**: one click (the orange button on the rail, or "Rank all sites" in the list) ranks every listed site, or one group, for the selected landing date and stay. Columns: hours with the Sun and Earth up together, sunlit hours, Earth-in-view hours, and the Sun's average elevation while the site is sunlit. Select a heading to sort by it, a site to open it, or the plus button to add it to the comparison. Rows fill in as each site's data arrives; the first ranking of all sites takes about half a minute because the JPL requests run one at a time, and repeats are instant. It ranks geometry only.
- **Plain-language help**: each site card states in words where the Sun and Earth are and what hides them ("hidden by terrain 360 m away to the east-northeast, which rises to 7.9°"), summarises the stay in a sentence, and carries a line saying the results are geometry, not power, a radio link or landing safety. The site list has three short explainers: how to read the app, why the south pole, and why some craters never see the Sun. The 30-day summary lists each Earth outage and the longest one.
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
- From 80°S to 85°S: PDS LOLA LDEM_80S_80M V2.0, 80-meter polar stereographic grid, same units and reference radius. Optional: when `data/lola_80s_80m/ldem_80s_80m.img` is absent this band falls back to the global grid. It feeds site horizons and slope only; the shadow layer and landing-view relief still use the 160 m (south of 85°S) and 3.8 km grids. Source: https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/ldem_80s_80m.lbl
- Elsewhere and for distant terrain: quantitative NASA SVS LOLA LDEM_16 float TIFF, 16 pixels per degree (about 1.9 km north/south spacing). TIFF kilometer heights are converted to half-meter signed integers; the scientific data is not taken from the decorative bump image.
- Skyline: great-circle rays every 0.25°, out to 300 km, including lunar curvature. Radial samples adapt to raster spacing and distance. Bilinear raster and angular interpolation can miss small or narrow ridges. Coarse global results are particularly limited; grid spacing is not an accuracy guarantee.
- Slope: a central difference across one grid cell either side of the site (80 m baseline south of 85°S, 160 m from 80°S to 85°S, 3.8 km elsewhere, where it is labelled regional). It describes the DEM at that scale; rocks, small craters and lander-scale hazards are not resolved. Check: the IM-1 site reads 11.5° over 160 m, in line with the roughly 12° slope reported for that landing site.
- Events: five-minute terrain-clearance samples made from hourly JPL positions; partial Sun/Earth disks and eclipses are not evaluated. No ground-station or link-budget guarantees.
- The global and polar products use different versions of the lunar mean-Earth frame and resolutions; small registration differences and coarse/fine boundary discontinuities remain possible. This is an exploratory model, not a validated landing-safety tool.

Eclipses and the other listed engineering factors remain out of scope. The Sunlight layer now renders approximate terrain-cast shadows; the local horizon chart and site metrics use finer, separate calculations.

`python3 scripts/prepare-terrain.py` regenerates derived grids and the separate small rendering texture from the downloaded NASA inputs. `data/terrain-manifest.json` records source URLs, units and SHA-256 hashes. `node scripts/check-terrain.mjs` checks projection consistency at sample locations and cached computation timing.

Performance: terrain computations live in a Node worker and are cached by location across dates. The browser receives only compact horizon profiles. Rendering stops after camera damping settles, labels use CSS transforms, pixel ratio is capped at 1.5, and the large panel avoids backdrop blur. The 8K color texture is retained.

For an opt-in browser check, open http://127.0.0.1:4174/?diagnostics=1 and choose “Run 6-second motion check”. This animates orbit and zoom and reports actual rendered frames with GPU completion waits, not just requestAnimationFrame callbacks. GPU waits add benchmark overhead and do not run in normal use. Run it in native Safari to obtain Safari-specific evidence.

## Interactive terrain shadows

Use the ☀ button in any map mode, scrub the time slider, or press Play. Explore and Landing default to sunlight; Satellite defaults to unlit imagery. No extra planning controls are required.

The GPU traces rays toward the current JPL Sun vector through quantitative LOLA heights on the curved Moon. This produces occlusion behind crater walls and ridges, beyond surface-normal lighting. Two cached masks cover the globe and the south pole. Their generation is coalesced after timeline input, uses a smaller preview during playback, and refines after 280 ms without a time change. Orbit/zoom reuses the masks; idle rendering remains off. Memory is bounded to the current masks, with no growing time-series texture cache.

Visual elevation grids average the full data to 2880×1440 globally (3.8 km north/south spacing) and 1896×1896 south of 85°S (160 m spacing). Settled shadow masks are 2048×1024 globally (~5.3 km equatorial pixels) and 1024×1024 over the 303.36 km polar square (~296 m). Preview masks use half these dimensions. Thus visual shadow coverage is not 40 m precision and may disagree near boundaries with the finer site metric. The ray trace uses up to 128 growing steps, a 500 km limit, and small height biases (8 m polar / 50 m global) to suppress self-intersection. Small obstacles, narrow ridges and finite solar-disk penumbrae are unresolved. Source mosaic lighting cannot be removed completely.

The diagnostics route also offers **Check shadow geometry**: it reads actual GPU results for 16 real-terrain fixtures and compares them with independent uniformly sampled CPU rays. This is a projection/occlusion regression check, not scientific certification.
