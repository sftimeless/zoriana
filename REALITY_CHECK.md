# Zoriana — 30-question product reality check

Evaluated November 14, 2026 (evening, Pacific) against commit `e105d83`, running locally at `http://127.0.0.1:4174` with live JPL Horizons data.

**Since this review.** Phase 1 fixes were applied the same evening and change the answers to questions 4, 5, 7, 11, 12, 15, 20, 22, 27 and 30: plain-language sentences, the blocking-terrain note, Earth outage list, a +3 d button, all six Apollo sites, "approximate" flags in the ranking, a geometry-not-safety line, and three short explainers. Phase 2 then added a share link and CSV export (question 10), dates back to 1950 (question 17: Apollo 11 on 20 July 1969 now loads), a landing hour (question 2) and a 30-day time slider (question 16). Phase 3 added NASA's permanently shadowed regions map as a layer and a per-site fact, a Sun and Earth disc measure with first light and full disc times (the limit noted under the sunrise question), and a second benchmark against NASA's Apollo Sun-angle table. Later the same weekend the app was deployed publicly and gained north-pole shadow maps, a where-to-land heat map with a best-spot finder (the "cannot search an area" limit noted under the ranking question), and a draggable sheet on phones. The findings below describe the app as it was at commit `e105d83`.

**Naming.** The brief calls the product "Luna Maps by Zoriana". That name appears nowhere in the code or documents. The app's title is "Zoriana — Lunar Landing Site Navigator" (`index.html:10`). This report evaluates that app.

**How this was tested.** Every answer below was produced by the running app in the desktop app's built-in Chromium browser on November 14–15, 2026 UTC, or by its own API, unless marked otherwise. Example date: landing date 2026-11-15, 3-day stay, terrain on, timeline at 12:00 UTC. 42 unit tests pass (`npm test`). Not tested: Safari, touch devices, slow graphics hardware.

**Status key.** WORKING: implemented, exercised, gives a supported result. PARTIAL: some of the question is answered. NOT IMPLEMENTED: the function does not exist. UNVERIFIED: may exist, not confirmed.

---

## What the app is (Phase 1 findings)

| Area | What exists today | Where |
|---|---|---|
| Architecture | One Node server (Vite middleware + one API route) and a single-page client using Three.js. Local only; not deployed. | `server.mjs`, `src/main.js`, `index.html` |
| API | `GET /api/ephemeris?lat&lon&date&reference`. Returns 30 days of hourly Sun and Earth azimuth, elevation and distance for that site, plus its terrain horizon. | `server.mjs:27–40` |
| Ephemerides | Live NASA/JPL Horizons observer tables, queried per site and date. Apparent, airless, from a surface site at DEM elevation + 2 m. No precomputed or mock positions. | `server.mjs:8–24`, `src/ephemeris.mjs:2` |
| Terrain horizon | Computed on the server from LOLA elevation: rays every 0.25° of azimuth out to 300 km on a curved Moon. | `src/terrain-math.mjs:58`, `terrain-worker.mjs:12–16` |
| Terrain data | 40 m grid south of 85°S; 80 m grid from 80°S to 85°S; 1.9 km grid everywhere else. | `terrain-worker.mjs`, `data/terrain-manifest.json` |
| Visibility | Body centre above the terrain horizon, sampled every 5 minutes between hourly JPL points. | `src/terrain-math.mjs:52`, `src/ephemeris.mjs:28,39` |
| Site list | 14 curated points in five groups, plus search by name, typed coordinates, and pins. | `src/main.js:37–52,378–387,406` |
| Date and time | Landing date 2000-01-01 to 2099-12-24; a 7-day time slider in 15-minute steps; 30 days of data per load. | `index.html:223,229`, `server.mjs:30` |
| Comparison | Up to four site-and-date options, with differences against the first. | `src/main.js:565–612` |
| Ranking | Every listed site for one date and stay, sortable by four measures. | `src/main.js:614–651` |
| 3D views | Globe with traced terrain shadows; tilted landing view over true-scale relief; Sun and Earth drawn in their real directions. | `src/terrain-shadows.mjs`, `src/surface-patch.mjs`, `src/main.js:188,324` |
| Tests | 42 unit tests on parsing, interpolation, horizon geometry, shadows, window logic, links and Earth orientation. None compares a full site result with an independent published value. | `tests/*.mjs` |

**Date limits, checked through the API:**

| Request date | Result |
|---|---|
| 1969-07-20 | Rejected: "Choose valid lunar coordinates and a date from 2000–2099." |
| 1999-12-31 | Rejected |
| 2000-01-01 | 721 hourly rows, to 2000-01-31 |
| 2099-12-24 | 721 hourly rows, to 2100-01-23 |
| 2100-01-01 | Rejected |

**Mandatory versus optional in NASA's brief.** Only one objective is stated without "may consider": display the positions of the Sun and Earth relative to the horizon at a selected site on a chosen date. Everything else (curated sites, comparison, date flexibility, countdowns, metrics, 2D/3D views, animation, serving several skill levels) is listed as something a solution may include.

---

## Audience 1: Mission planners

### 1. Where should we land? Which south-pole locations offer favorable sunlight and Earth visibility?
- **A. Status:** PARTIAL
- **B. How:** Orange **Rank landing sites** button on the left rail (or **Rank all sites** in the list) → **South Pole** or **Future** chip.
- **C. Answer given** (3 d stay from 2026-11-15, terrain included):

  | Site | Sun + Earth | Sunlit | Earth | Sun height |
  |---|---|---|---|---|
  | Blue Moon Pathfinder 1 | 16.0 h | 72.0 h | 16.0 h | 1.2° |
  | IM-4 | 12.1 h | 12.1 h | 32.6 h | 5.0° |
  | Griffin Mission One | 0.0 h | 72.0 h | 0.0 h | 4.9° |
  | Malapert region | 0.0 h | 0.0 h | 72.0 h | — |
  | Shackleton region | 0.0 h | 0.0 h | 0.0 h | — |

- **D. Evidence:** `renderRanking` (`src/main.js:617`), `stayMetrics` (`src/windows.mjs:74`), tests `tests/windows.test.mjs:28,35`.
- **E. Limits:** It ranks only the points already in the list (seven near the south pole) plus one selected pin. It cannot search an area or show a map of good regions. The three future targets are feature centres, not announced landing points, and the ranking rows do not say so.
- **F. Smallest fix:** Presentation: mark approximate rows in the ranking. Science: an area scan (grid of points around the pole, ranked) or an illumination overlay.

### 2. When should we land? What dates and times are favorable?
- **A. Status:** PARTIAL
- **B. How:** Open a site → **Lunar day ahead** section → read the bars and **Best landing day**; click a day to move the **Landing date**.
- **C. Answer given:** Malapert region, from 2026-11-15: "Best landing day for a 3 d stay: Nov 19 · 72.0 h sunlit · 72.0 h Earth". Day bars: Nov 18: 71.9 h, Nov 22: 72.0 h, Nov 29: 65.6 h sunlit.
- **D. Evidence:** `renderLunar` (`src/main.js:530`), `landingDays`, `bestLandingDay` (`src/windows.mjs:41,51`), tests `tests/windows.test.mjs:17,23`.
- **E. Limits:** Dates only: every stay starts at 00:00 UTC, so it cannot recommend a time of day. The window is 30 days from the chosen date. "Best" means most sunlit hours, with Earth hours as the tie-break.
- **F. Smallest fix:** Presentation: rename to "Most sunlit landing day". Science: allow a start hour; let the best-day search use the combined Sun-and-Earth measure.

### 3. How long will we have sunlight at a selected location?
- **A. Status:** WORKING
- **B. How:** Open a site → banner countdown; **Surface stay** (24 h / 3 d / 7 d) → **Sunlit time**; **Lunar day ahead** → **Longest sunlight**.
- **C. Answer given:** Malapert region, landing 2026-11-18: "13 d 5 h until sunset · Dec 1, 17:33 UTC"; Sunlit time "≈ 71.9 h · 100%" of a 3 d stay; longest sunlight "13 d 17 h from Nov 18".
- **D. Evidence:** `updateBanner` (`src/main.js:422`), `refreshMetrics` (`:455`), `visibleHours`, `nextCrossing` (`src/ephemeris.mjs:28,39`), test `tests/ephemeris.test.mjs:10`.
- **E. Limits:** Uses the Sun's centre, not its 0.5°-wide disc, so near the pole real sunrise and sunset can differ by hours. Sunlight is not usable power; the app says so in the method sheet only.
- **F. Smallest fix:** Science: treat the Sun as a disc (report first and last light). Presentation: none needed.

### 4. When will Earth become obstructed, and how long will line-of-sight interruptions last?
- **A. Status:** PARTIAL
- **B. How:** Open a site → banner (next Earthrise or Earthset) → blue band on the timeline → **Earth in view** total.
- **C. Answer given:** IM-4 point, 2026-11-15 12:00 UTC: Earth elevation 1.5°, "Blocked by terrain", above terrain −1.4°; "1 d 3 h until Earthrise · Nov 16, 15:26 UTC"; Earth in view "≈ 32.6 h · 45%" of the stay and 53% of the next 30 days.
- **D. Evidence:** `updateBanner` (`src/main.js:422`), `lanes` (`:410`), `clearanceSeries` (`src/terrain-math.mjs:52`).
- **E. Limits:** The app shows the next change and the totals, and the bands show outages visually, but it never lists each interruption with a start, end and length. The 30-day summary gives longest stretches for sunlight only. Line of sight is not a working radio link.
- **F. Smallest fix:** Presentation: add "Longest Earth outage" and a list of outages, using the existing `gaps` and `longest` functions.

### 5. What happens if a planned landing is delayed by 3, 7, or 14 days?
- **A. Status:** WORKING
- **B. How:** Open a site → **Compare** → on the card press **+7 d** and **+14 d**; for 3 days click the fourth bar in **Lunar day ahead** (or change **Landing date**) and press **Compare** again.
- **C. Answer given:** Malapert region, 3 d stay:

  | Landing | Sunlit | Earth | Both | Versus baseline |
  |---|---|---|---|---|
  | Nov 15 (baseline) | 0.0 h | 72.0 h | 0.0 h | |
  | Nov 18 (+3 d) | 71.9 h | 72.0 h | 71.9 h | +71.9 h sunlit |
  | Nov 22 (+7 d) | 72.0 h | 72.0 h | 72.0 h | +72.0 h, tagged "Most sunlight" |
  | Nov 29 (+14 d) | 65.6 h | 72.0 h | 65.6 h | +65.6 h |

- **D. Evidence:** `addOption`, `renderComparison` (`src/main.js:568,580`), `shiftDate` (`:567`), shift buttons (`:584`).
- **E. Limits:** No **+3 d** button (the buttons are +1, +7, +14, +30). Four options is the limit, so baseline plus three delays fills it. The fourth card sits below the fold of the panel.
- **F. Smallest fix:** Presentation: add a +3 d button.

### 6. Can we compare three candidate sites over identical mission dates?
- **A. Status:** WORKING
- **B. How:** Open each site and press **Compare** (or press **+** on rows in the ranking).
- **C. Answer given** (all landing 2026-11-15, 3 d): Malapert region 0.0 / 72.0 / 0.0 h (baseline, "Longest Earth view"); Blue Moon Pathfinder 1 72.0 / 16.0 / 16.0 h ("Most sunlight", "Most Sun + Earth"); IM-4 12.1 / 32.6 / 12.1 h. Columns are sunlit / Earth / both.
- **D. Evidence:** `renderComparison` (`src/main.js:580`), `index.html:199`.
- **E. Limits:** Totals and bands only; Sun elevation and slope are not in the comparison. Nothing can be exported.
- **F. Smallest fix:** Presentation: add Sun height and slope to each card.

### 7. Which terrain features obstruct the Sun at a selected location?
- **A. Status:** PARTIAL
- **B. How:** Open a site → **Sky from the surface** chart (terrain outline with the Sun on it) → Sun tile state and **Above terrain** → **Landing** view to look at the ground.
- **C. Answer given:** IM-4 point, 2026-11-15 12:00 UTC: Sun elevation 2.7°, "Blocked by terrain", above terrain −5.2°. The app's API holds more than the screen shows: at the Sun's azimuth (77.5°) the horizon is 7.9° high and the blocking terrain is 0.4 km away.
- **D. Evidence:** `drawSky` (`src/main.js:441`), `computeHorizon` returns `angles` and `distances` (`src/terrain-math.mjs:58`), test `tests/terrain.test.mjs:9`.
- **E. Limits:** The app shows that terrain blocks the Sun and by how many degrees, but not what or where the obstruction is. The distance to it is computed and never displayed. No feature names exist in the app.
- **F. Smallest fix:** Presentation: show "blocked by terrain X km away toward bearing Y" from the existing `distances`, and mark that point on the map.

### 8. What is the longest continuous period without direct sunlight?
- **A. Status:** WORKING
- **B. How:** Open a site → **Lunar day ahead** → **Longest darkness**.
- **C. Answer given:** Malapert region from 2026-11-18: "15 d 22 h from Dec 1". From 2026-11-15 the same stretch reads "≥ 13 d 6 h" because it runs past the window. IM-4 point: "≥ 15 d 8 h from Nov 29".
- **D. Evidence:** `renderLunar` (`src/main.js:530`), `gaps`, `longest` (`src/windows.mjs:25,33`), tests `tests/windows.test.mjs:15,16`.
- **E. Limits:** Capped at the 30 days after the landing date; a stretch touching the edge is shown with "≥". It cannot find the worst case across a year.
- **F. Smallest fix:** Science: fetch a longer series (the server already takes a day count constant) for a year-long search.

### 9. How reliable are our predictions?
- **A. Status:** PARTIAL
- **B. How:** **Method** on the site card, or the grey **Data and method** rail button.
- **C. Answer given:** Eight sections: Visibility, Libration & orbit, Sampling, Lunar day & comparison, Terrain & location, Map, Landing view, Rendering. For Apollo 11 it states "NASA LOLA · 1.9 km global grid. Observer −1919.5 m above the 1,737.4 km reference radius (2 m above the DEM). Horizon sampled every 0.25° to 300 km…".
- **D. Evidence:** `index.html:237–252`, `README.md`, `VERIFICATION.md`, `data/terrain-manifest.json` (sources and checksums).
- **E. Limits:** Datasets, resolutions and assumptions are stated; uncertainty is not quantified. No result is checked against an independent published value inside the test suite.
- **F. Smallest fix:** Science: add two or three benchmark cases (published illumination fractions or mission-reported sunset times) as tests and show the comparison in the method sheet.

### 10. Can users save, export, or share results?
- **A. Status:** NOT IMPLEMENTED
- **B. How:** There is no control for it. A search of every button and link for export, share, save, download, copy or print found none.
- **C. Answer given:** None. The address stays `http://127.0.0.1:4174/` whatever is selected, so a view cannot be bookmarked or sent. Reloading the page clears the comparison.
- **D. Evidence:** No `localStorage`, `history`, clipboard or download code in `src/main.js`. The only outbound links are **QuickMap ↗** and **Moon Trek ↗** (`index.html:162`).
- **E. Limits:** A planner cannot hand a result to a colleague except by screenshot.
- **F. Smallest fix:** Missing function: put site, date, stay and comparison in the address, and add a CSV export of the comparison and ranking.

---

## Audience 2: Educators

### 11. Why is NASA interested in the lunar south pole?
- **A. Status:** NOT IMPLEMENTED
- **B. How:** Nowhere. The words "ice", "water", "permanent" and "why" do not appear in the app's interface.
- **C. Answer given:** None.
- **D. Evidence:** Text search of the rendered page; `index.html`.
- **E. Limits:** The app shows conditions; it never explains motivation.
- **F. Smallest fix:** Presentation: a short "Why the south pole?" note on the South Pole group or first-run card.

### 12. Why do some craters remain in permanent or near-permanent shadow?
- **A. Status:** PARTIAL
- **B. How:** Open **Shackleton region** → Sun tile and sky chart; press **Play**; switch to **Landing**.
- **C. Answer given:** A demonstration, not an explanation: on 2026-11-15 the Sun is 1.4° above the horizontal but 6.4° below the local terrain, "Blocked by terrain", with 0.0 h of sunlight in the stay. The landing view shows the crater in shadow.
- **D. Evidence:** `drawSky` (`src/main.js:441`), terrain shadows (`src/terrain-shadows.mjs`), `tests/shadows.test.mjs:11`.
- **E. Limits:** No text explains the low Sun angle or the Moon's small tilt. "Permanent" cannot be shown: the app looks 30 days ahead at most.
- **F. Smallest fix:** Presentation: one sentence under the sky chart when the Sun is above the horizontal but below terrain.

### 13. Where would the Sun appear in the sky from a selected location and date?
- **A. Status:** WORKING
- **B. How:** Open a site, set **Landing date** and the time slider → Sun tile, **Sky from the surface**, gold line on the map.
- **C. Answer given:** Apollo 11, 2026-11-15 12:00 UTC: Sun elevation 5.1°, azimuth 91.6°, 5.7° above terrain, "Sunlit", 147.8 million km away.
- **D. Evidence:** `refreshMetrics` (`src/main.js:455`), `drawSky` (`:441`), `updateBeams` (`:129`), `tests/ephemeris.test.mjs:4,9`.
- **E. Limits:** The chart is a flat strip (azimuth against elevation), not a dome, and labels directions N E S W only.
- **F. Smallest fix:** None required.

### 14. Can Earth be seen from everywhere on the Moon?
- **A. Status:** PARTIAL
- **B. How:** Drop pins in different places (right-click, or type coordinates such as `0, 180`) and read the Earth tile; look for the **Earth overhead** marker on the globe.
- **C. Answer given:** Pin at 0°N 180°E: Earth elevation −85.7°, "Below horizon", "Earth stays out of view through Dec 15", Earth in view 0% of 30 days. Apollo 11: Earth 63.0° up, in view throughout.
- **D. Evidence:** `dropPinAt` (`src/main.js:378`), `updateBodies` (`:188`), `tests/ephemeris.test.mjs:12`.
- **E. Limits:** The answer has to be discovered one pin at a time. There is no shading of the far side and no explanation of why Earth barely moves in the lunar sky.
- **F. Smallest fix:** Presentation: shade the hemisphere where Earth is below the horizon (a great circle around the Earth-overhead point).

### 15. Why might two nearby locations receive different amounts of sunlight?
- **A. Status:** PARTIAL
- **B. How:** Compare two nearby sites, then toggle **Terrain on / off**.
- **C. Answer given:** Blue Moon Pathfinder 1 point and Shackleton region are both at 89.5°S: 72.0 h against 0.0 h of sunlight in the same three days. Turning terrain off on the IM-4 point changes sunlit time from 12.1 h to 72.0 h.
- **D. Evidence:** `$('#terrain-toggle').onclick` (`src/main.js:491`), `renderComparison` (`:580`).
- **E. Limits:** The cause (elevation and surrounding ridges) is shown through numbers and horizon charts, never stated in words.
- **F. Smallest fix:** Presentation: a one-line reason in the comparison, such as "higher ground" or "blocked from the east", built from elevation and the horizon profile.

### 16. Can students advance time and observe changes in illumination and shadows?
- **A. Status:** WORKING
- **B. How:** **Play** button or drag the time slider.
- **C. Answer given:** At Apollo 11, 2.5 seconds of play moved the clock from 12:00 to 17:00 and the Sun from 5.1° to 7.6°; the map status read "Terrain shadows · updating".
- **D. Evidence:** `$('#play').onclick` (`src/main.js:507`), `$('#time').oninput` (`:505`), `src/terrain-shadows.mjs`.
- **E. Limits:** The slider covers 7 days, not a full lunar day; no speed control. The shadow layer is coarser than the site numbers (160 m near the pole, 3.8 km elsewhere).
- **F. Smallest fix:** Presentation: extend the slider to 30 days, since the data is already loaded.

### 17. Can students explore the Apollo 11 landing site on July 20, 1969?
- **A. Status:** NOT IMPLEMENTED
- **B. How:** Selecting Apollo 11 works; setting the date does not.
- **C. Answer given:** Entering 1969-07-20 shows "Choose a valid date between 2000 and 2099." and restores the previous date. The API returns HTTP 400 for the same date.
- **D. Evidence:** Date input limits (`index.html:223`), server date check (`server.mjs:30`).
- **E. Limits:** No Apollo mission date is reachable.
- **F. Smallest fix:** Missing function, small: widen the date check and input range to cover the 1960s. JPL Horizons supports those dates; this was not tested.

### 18. Can students plan and compare their own hypothetical missions?
- **A. Status:** WORKING
- **B. How:** Right-click the Moon (or type `lat, lon`) → set **Landing date** and stay → **Compare**; repeat for another pin or date.
- **C. Answer given:** A pin typed as `-84.5, 30` loaded terrain, angles, a countdown and stay totals, and was compared with named sites in an earlier check (`VERIFICATION.md`). A right-click pin landed at 19.99°S 56.25°E and loaded normally.
- **D. Evidence:** `dropPinAt`, `contextmenu` handler (`src/main.js:378,387`), search (`:406`), `addOption` (`:568`).
- **E. Limits:** Every pin is called "Dropped pin" and cannot be renamed. Only the selected pin joins the ranking. Nothing is saved.
- **F. Smallest fix:** Presentation: let pins be named.

### 19. What happens when students change the landing date?
- **A. Status:** WORKING
- **B. How:** **Landing date** field, **Now**, or click a day in **Lunar day ahead**.
- **C. Answer given:** Malapert region changed from 0.0 h sunlit (Nov 15) to 71.9 h (Nov 18), and the banner from "2 d 12 h until sunrise" to "13 d 5 h until sunset".
- **D. Evidence:** `applyDate` (`src/main.js:509`), `$('#lunar-days').onclick` (`:556`).
- **E. Limits:** Each change reloads from JPL (a few seconds). Comparison options keep their own dates, which is correct but not explained.
- **F. Smallest fix:** None required.

### 20. Can students understand how terrain, geography and calculations produce the results?
- **A. Status:** PARTIAL
- **B. How:** **Terrain on / off**; the sky chart; **Method**.
- **C. Answer given:** The terrain toggle is the clearest lesson (12.1 h becomes 72.0 h). The method sheet explains the calculation in technical language.
- **D. Evidence:** `index.html:237–252`.
- **E. Limits:** The method sheet is written for engineers. Nothing walks a student through "Sun angle, then horizon, then result".
- **F. Smallest fix:** Presentation: a three-step plain-language explainer beside the sky chart.

---

## Audience 3: General public

### 21. Can I explore the Moon like a maps app?
- **A. Status:** PARTIAL
- **B. How:** Drag to rotate, scroll to zoom, **Choose map** for Explore / Landing / Satellite, the search box, right-click to pin.
- **C. Answer given:** Dragging and scrolling moved the Apollo 11 pin across the screen and changed "View altitude" from 5,560 km to 3,358 km. Searching "Tycho" returns "No matching place. Try latitude, longitude…".
- **D. Evidence:** OrbitControls setup (`src/main.js:96`), `setMode` (`:518`), search (`:406`).
- **E. Limits:** Search knows only the 14 listed sites; no craters, seas or mountains are named or labelled. Imagery is soft when zoomed in (about 1.3 km per pixel).
- **F. Smallest fix:** Data: add a list of major named features to search and labels.

### 22. Can I locate historical human landing sites?
- **A. Status:** PARTIAL
- **B. How:** **Apollo** chip, or search "apollo".
- **C. Answer given:** Two results: Apollo 11 and Apollo 17. Each opens with data and links to QuickMap and Moon Trek.
- **D. Evidence:** `sites` (`src/main.js:37–52`).
- **E. Limits:** Apollo 12, 14, 15 and 16 are missing.
- **F. Smallest fix:** Data: add four entries.

### 23. Can I select a point and understand its terrain and local horizon?
- **A. Status:** WORKING
- **B. How:** Right-click a point → site card → **Sky from the surface**, **Surface elevation**, **Surface slope** → **Landing** view.
- **C. Answer given:** Malapert region: elevation +4,757 m, slope 10.3° over 80 m, 40 m south-pole grid, with a 360° horizon outline. IM-4 point: +5,040 m, 9.5° over 160 m.
- **D. Evidence:** `computeHorizon`, `slopeAt` (`src/terrain-math.mjs:58,25`), `enterSurface` (`src/main.js:324`), tests `tests/terrain.test.mjs:8,18`.
- **E. Limits:** Outside 80°S the terrain grid is 1.9 km, so slope is regional and the horizon misses local hills. Between 80°S and 85°S the 3D relief is coarser than the numbers.
- **F. Smallest fix:** Science: finer terrain away from the pole (for example the 59 m LOLA–Kaguya model).

### 24. Could I see Earth from that location at a selected date and time?
- **A. Status:** WORKING
- **B. How:** Open or pin a site → Earth tile, and the antenna icon on the left rail.
- **C. Answer given:** Malapert region, 2026-11-15 12:00 UTC: Earth 1.1° up, 4.2° above terrain, "Earth in view", 403,819 km away. IM-4 point at the same time: 1.5° up but "Blocked by terrain".
- **D. Evidence:** `refreshMetrics` (`src/main.js:455`), `horizonAt` (`src/terrain-math.mjs:46`).
- **E. Limits:** Uses Earth's centre; Earth is about 2° wide, so "in view" can mean half a disc. Not a communications assessment.
- **F. Smallest fix:** None required for the public; state "centre of Earth" in the tile tooltip.

### 25. Where are the Moon's permanently shadowed regions?
- **A. Status:** NOT IMPLEMENTED
- **B. How:** No layer, list or label exists.
- **C. Answer given:** None. The shadow layer shows shadows at one moment only.
- **D. Evidence:** No such data in `public/assets` or `data/`; no code path.
- **E. Limits:** A user could mistake the current shadows for permanent ones.
- **F. Smallest fix:** Missing data: add NASA's LOLA permanently-shadowed-region map as an overlay.

### 26. Where is sunlight reaching the Moon right now?
- **A. Status:** WORKING
- **B. How:** Press **Now**; look at the globe and the **Sun overhead** marker.
- **C. Answer given:** At 2026-11-15 03:00 UTC: "Sun is directly overhead at 1.6°S 112.9°E"; the globe is lit from that side with terrain shadows; "Earth is directly overhead at 3.2°N 2.8°W".
- **D. Evidence:** `$('#today').onclick` (`src/main.js:511`), `updateLight`, `updateBodies` (`:504,188`), `tests/earth-orientation.test.mjs:10`.
- **E. Limits:** "Now" snaps to the current hour, not the minute. The base image has some lighting baked in.
- **F. Smallest fix:** None required.

### 27. Where might future missions land, and why are those regions interesting?
- **A. Status:** PARTIAL
- **B. How:** **Future** chip.
- **C. Answer given:** Five entries: Blue Moon Pathfinder 1, Griffin Mission One, IM-4, IM-3 Trinity, Blue Ghost Mission 3, each with a planned year, operator, and an "Approximate" note such as "this is the centre of Mons Mouton, not an announced landing point."
- **D. Evidence:** `sites` (`src/main.js:37–52`), note element (`index.html:91`), sources in `README.md`.
- **E. Limits:** Where: approximate, and sourced mostly from Wikipedia. Why: never explained.
- **F. Smallest fix:** Presentation: one sentence of purpose per mission.

### 28. Where could I observe an Earthrise above the local terrain?
- **A. Status:** PARTIAL
- **B. How:** Open a site → banner; in **Landing** view the camera faces Earth.
- **C. Answer given:** IM-4 point: "1 d 3 h until Earthrise · Nov 16, 15:26 UTC", computed against real terrain. The landing view draws Earth above the horizon when it is up.
- **D. Evidence:** `updateBanner` (`src/main.js:422`), `tiltToShow`, `framing` (`:297,309`).
- **E. Limits:** It answers "when, at this site", not "where on the Moon". It does not say that Earthrise only happens near the edge of the near side.
- **F. Smallest fix:** Science: a search over sites for the next Earthrise. Presentation: a sentence explaining where Earthrise can occur.

### 29. How do sunlight, terrain and Earth visibility change between locations?
- **A. Status:** WORKING
- **B. How:** **Rank landing sites** with **All**; sort by each column.
- **C. Answer given:** For 2026-11-15, 3 d: Blue Ghost M1, Chandrayaan-3 and Apollo 17 have 72.0 h of Sun and Earth together; Apollo 11 71.2 h; IM-2 Athena 65.8 h; SLIM 64.3 h; Blue Moon Pathfinder 1 16.0 h; IM-4 12.1 h; five sites 0.0 h. Sorted by Sun height, Blue Ghost M1 leads at 50.3°.
- **D. Evidence:** `renderRanking`, `drawRanking` (`src/main.js:617,632`).
- **E. Limits:** The first full ranking takes about half a minute. Terrain detail differs by region, which the table does not show.
- **F. Smallest fix:** Presentation: show each row's terrain grid.

### 30. Can I plan a hypothetical landing and get a simple explanation of the trade-offs?
- **A. Status:** PARTIAL
- **B. How:** Pin a site, choose a date and stay, **Compare**.
- **C. Answer given:** Numbers and tags: "Most sunlight", "Longest Earth view", "Most Sun + Earth", and differences such as "+72.0" and "−56.0".
- **D. Evidence:** `renderComparison` (`src/main.js:580`).
- **E. Limits:** No sentence explains the trade-off. A newcomer must interpret "72.0 h / 16.0 h / 16.0 h" alone.
- **F. Smallest fix:** Presentation: generate one sentence per option from the existing numbers, for example "Sunlit the whole stay, but Earth is in view for only 16 of 72 hours."

---

## What could not be verified

- Safari, touch gestures (including long-press to pin), and performance on weak graphics hardware.
- The GPU shadow check ("16 of 16 agree") recorded in `VERIFICATION.md` was run in an earlier session and not repeated here.
- North-polar links to QuickMap and Moon Trek were never opened.
- Whether dates before 2000 work once the limits are widened.
- Which continents face the Moon on the Earth globe: confirmed by unit tests, not by eye.

## A defect found during this review

When the last comparison option is removed, the panel hides but its last card stays in the page (`renderComparison`, `src/main.js:581`). It is invisible to users and harmless, but it is stale content.
