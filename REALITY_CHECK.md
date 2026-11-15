# Zoriana — 30-question product reality check (second run, updated after fixes)

Evaluated November 15, 2026 (UTC morning) on the public site https://zoriana.fly.dev/ with live JPL Horizons data: first against commit `cdb9bb6`, then again for the changed answers after the fixes that followed.

**This is the second run.** The first, at commit `e105d83` on November 14, scored 12 working, 14 partial, 4 not implemented. It is kept in the git history of this file. The second run scored 22 working, 8 partial. The eight partial items and the four new findings were then worked on, and the affected questions were re-tested on the live site. **Current score: 30 working, 0 partial, 0 not implemented, 0 unverified.** Entries changed by the fixes are marked "(re-tested after fixes)".

**Who ran it.** The same AI assistant that wrote most of the code, so it is not an outside audit. To keep it honest, every "answer given" below is text read from the running site during this run, not recalled or taken from the documents, and where the app cannot answer, the entry says so.

**Naming.** The brief calls the product "Luna Maps by Zoriana". That name appears nowhere in the code, the site or the documents. The app's title is "Zoriana — Lunar Landing Site Navigator". This report evaluates that app.

**How it was tested.** The desktop app's built-in Chromium browser against the live site, plus direct requests to its API. Example unless stated otherwise: landing date 2026-11-15, 3-day stay, terrain on, timeline at 12:00 UTC. 72 unit tests pass (`npm test`). Not tested in this run: Safari, a real phone, slow graphics hardware.

**Status key.** WORKING: implemented, exercised, gives a supported result. PARTIAL: some of the question is answered. NOT IMPLEMENTED: the function does not exist. UNVERIFIED: may exist, not confirmed.

---

## 1. Executive verdict

Zoriana answers NASA's one firm requirement (show where the Sun and Earth sit relative to the horizon at a chosen site and date) with real ephemerides and real terrain, and it now covers almost all of the optional ideas in the brief: curated past and future sites, side-by-side comparison, any date from 1950 to 2099, countdowns, stay metrics, 3D and tilted views, playback, and plain-language text for newcomers. Since the first run it has gained a way to answer "where" beyond the curated list: NASA's long-term illumination maps drawn as a heat map, a best-spot finder, and permanent shadow maps at both poles.

It is a credible first-pass planning and teaching tool, and it says clearly that it is geometry only. It is not a mission tool. After the fixes, the best-spot finder checks its candidates against the chosen dates, the app recommends a landing hour as well as a day, search covers 9,087 IAU-named features, the north pole has 80 m terrain, and the terrain model has been checked against NASA's long-term maps (within 3 percentage points on average at ten polar points). The map now labels named features and the Landing view takes fine detail from NASA's 100 m imagery. The remaining weaknesses are: individual rise and set times at grazing angles carry no error bar; terrain between 80°S and 80°N is 1.9 km coarse; and sharp ridges can differ a lot from NASA's pixel.

---

## 2. Scorecard

| # | Audience | Question (short) | Status | Evidence | Primary gap |
|---|---|---|---|---|---|
| 1 | Planner | Where to land near the south pole | WORKING | Ranking; heat map; date-checked best spot | Best spot checks six candidates, not every cell |
| 2 | Planner | When to land | WORKING | Best landing day and hour | 30 days ahead only |
| 3 | Planner | How long is sunlight | WORKING | Stay totals, 30-day facts, disc times | Not usable power |
| 4 | Planner | Earth outages | WORKING | Outage list with start, end, length | Line of sight is not a link |
| 5 | Planner | Delay by 3, 7, 14 days | WORKING | Delay buttons in comparison | Four options at most |
| 6 | Planner | Compare three sites | WORKING | Comparison cards, CSV | Totals, not hour-by-hour differences |
| 7 | Planner | What terrain blocks the Sun | WORKING | Distance, direction, height, IAU name, map marker | Named only where an IAU feature covers the spot |
| 8 | Planner | Longest darkness | WORKING | "Longest darkness" | Capped at 30 days |
| 9 | Planner | Reliability | WORKING | Method sheet; Apollo and NASA-map checks | No error bar on individual event times |
| 10 | Planner | Save, export, share | WORKING | Share link, two CSV exports | No saved projects |
| 11 | Educator | Why the south pole | WORKING | Explainer in the site list | Three sentences only |
| 12 | Educator | Why permanent shadow | WORKING | Explainer; shadow map | — |
| 13 | Educator | Sun's position in the sky | WORKING | Tiles, sky chart, sight line | Flat strip chart, not a dome |
| 14 | Educator | Earth from everywhere? | WORKING | Earth view on the whole globe; explainer | Level-ground geometry outside the polar maps |
| 15 | Educator | Why neighbours differ | WORKING | Blocking note; terrain toggle | Reason is per site, not in the comparison |
| 16 | Educator | Advance time | WORKING | Play; 30-day slider | No speed control |
| 17 | Educator | Apollo 11, July 20, 1969 | WORKING | Loads; matches published angle | Regional terrain only |
| 18 | Educator | Plan own missions | WORKING | Pins, dates, compare, share | Pins cannot be named |
| 19 | Educator | Change the date | WORKING | Date field, day bars | — |
| 20 | Educator | Understand the method | WORKING | "How was this worked out?" steps; explainers | Method sheet itself is still technical |
| 21 | Public | Explore like a maps app | WORKING | Rotate, zoom, pin, tilt; search of 9,087 names; place labels; 100 m imagery in Landing view | Globe imagery itself stays 1.3 km per pixel |
| 22 | Public | Historic landing sites | WORKING | Six Apollo sites | Crewed sites only from Apollo, as expected |
| 23 | Public | Terrain and horizon of a point | WORKING | Sky chart, elevation, slope | 1.9 km terrain between 80°S and 80°N |
| 24 | Public | See Earth at a time | WORKING | Earth tile with disc share | — |
| 25 | Public | Permanently shadowed regions | WORKING | Shadow layer, both poles | Within 15° of the poles |
| 26 | Public | Sunlight right now | WORKING | "Now"; lit globe; Sun overhead | Snaps to the hour |
| 27 | Public | Future missions and why | WORKING | Five targets with a purpose line each | Positions approximate |
| 28 | Public | Where to see an Earthrise | WORKING | Earthrise band on the globe; explainer; per-site countdown | Band is level-ground geometry |
| 29 | Public | Differences between locations | WORKING | Ranking of all sites; heat map | First ranking of a new date takes time |
| 30 | Public | Simple trade-off explanation | WORKING | Sentences on card and comparison | One sentence per option, no verdict |

**Totals: WORKING 30 · PARTIAL 0 · NOT IMPLEMENTED 0 · UNVERIFIED 0.** (Second run before fixes: 22 and 8. First run: 12, 14 and 4 not implemented.)

---

## 3. What the app is today (Phase 1)

| Area | What exists | Where |
|---|---|---|
| Architecture | One Node server and a single-page Three.js client. Deployed on Fly.io (one 1 GB machine). | `server.mjs`, `src/main.js`, `Dockerfile`, `fly.toml` |
| API | `GET /api/ephemeris?lat&lon&date&reference`: 31 days of hourly Sun and Earth azimuth, elevation and distance, plus the site's terrain horizon. | `server.mjs:35,95` |
| Ephemerides | Live NASA/JPL Horizons observer tables per site and date: apparent, airless, observer at DEM elevation + 2 m. Nothing precomputed or mocked. Cached in memory; today's data for the 18 sites is fetched at start-up. | `server.mjs:18,45`, `src/ephemeris.mjs:2` |
| Terrain horizon | Computed on the server from LOLA elevation: a ray every 0.25° out to 300 km on a curved Moon. | `src/terrain-math.mjs:65`, `terrain-worker.mjs:12` |
| Terrain data | 40 m grid south of 85°S; 80 m from 80°S to 85°S and north of 80°N; 1.9 km everywhere else. | `terrain-worker.mjs`, `data/terrain-manifest.json` |
| Visibility | Body centre above the terrain horizon, sampled every 5 minutes between hourly JPL points. Disc share reported alongside. | `src/terrain-math.mjs:59`, `src/disc.mjs:31` |
| Long-term maps | NASA LOLA permanent-shadow and average-visibility maps (120 m source) within 15° of each pole, drawn and looked up; not computed by the app. | `src/psr.mjs`, `scripts/prepare-illumination.py` |
| Sites and names | 18 curated points in five groups, search by name or coordinates across 9,087 IAU-named features, pins. | `src/sites.mjs`, `src/features.mjs`, `src/main.js` |
| Date and time | Landing date 1950-01-01 to 2099-12-24, landing hour, 30-day slider in 15-minute steps. | `index.html:246`, `server.mjs:95` |
| Comparison and ranking | Up to four site-and-date options; ranking of all listed sites. Both export CSV. | `src/main.js:702,740,787` |
| Tests | 72 unit tests: parsing and interpolation (8), terrain and horizon (11), windows and sentences (18), polar maps (9), disc (6), place names (4), eclipses (4), Earth orientation (4), links (4), shadows (3), CSV (1). Two separate scripts compare results with outside sources (NASA's Apollo Sun angles; NASA's long-term visibility maps); they need the server and are not part of `npm test`. | `tests/*.mjs`, `scripts/benchmark-apollo.mjs`, `scripts/validate-illumination.mjs` |

**Date limits, checked on the live API in this run:**

| Request date | Result |
|---|---|
| 1949-12-31 | Rejected: "Choose valid lunar coordinates and a date from 1950–2099." |
| 1950-01-01 | 745 hourly rows, to 1950-02-01 |
| 1969-07-20 | 745 hourly rows, to 1969-08-20 |
| 2099-12-24 | 745 hourly rows, to 2100-01-24 |
| 2100-01-01 | Rejected |

**Mandatory versus optional in NASA's brief.** One objective is stated without "may consider": display the positions of the Sun and Earth relative to the horizon at a selected site on a chosen date. Everything else is listed as something a solution may include.

---

## 4. The 30 questions

### Audience 1: Mission planners

**1. Where should we land? — WORKING (re-tested after fixes)**
- **How:** orange **Rank landing sites** rail button; the ring-shaped **Where-to-land heat map** button; on a polar site card, **Find best spot within 15 km**.
- **Answer given:** Ranking, 3 d from Nov 15 (Sun + Earth / Sunlit / Earth / Sun height): IM-2 Athena 65.8 / 65.8 / 72.0 h / 3.7°; Blue Moon Pathfinder 1 16.0 / 72.0 / 16.0 h / 1.2°; IM-4 12.1 / 12.1 / 32.6 h / 5.0°; Griffin Mission One 0.0 / 72.0 / 0.0 h; Malapert 0.0 / 0.0 / 72.0 h; Shackleton 0.0 / 0.0 / 0.0 h. Shackleton point long-term: "Sun 12% · Earth 47%". Best spot from there: "Checked 6 spots for your 3 d stay from Nov 15. This one, 12.7 km away, has 13.1 h of Sun and Earth together and 72.0 h of sunlight (long-term: Sun 49%, Earth 56%)", a pin at 89.7475°S 57.8043°E.
- **Evidence:** `renderRanking`, `setHeat`, best-spot handler (`src/main.js`), `topCells` (`src/psr.mjs`), tests `tests/psr.test.mjs`, `tests/windows.test.mjs`.
- **Limits:** The heat map itself is NASA's long-term average over 480 m cells. The best-spot finder now checks its candidates for the chosen landing time and stay, but only the six most promising cells, not every cell. The score is two averages multiplied. Slope and hazards are not part of it.
- **Smallest fix:** Science: rank every cell of a region for the chosen dates.

**2. When should we land? — WORKING (re-tested after fixes)**
- **How:** site card → **Lunar day ahead** bars, **Most sunlit landing day** and **Best landing time**; **Use this time** sets the date and hour.
- **Answer given:** IM-4: "Most sunlit landing day for a 3 d stay: Nov 18 · 72.0 h sunlit · 72.0 h Earth" and "Best landing time for Sun and Earth together: Nov 17 12:00 UTC · 72.0 h together · 72.0 h sunlit". Pressing **Use this time** set the date to 2026-11-17 and the hour to 12, and the stay read "Sunlit for the whole stay. Earth in view throughout."
- **Evidence:** `renderLunar` (`src/main.js`), `landingDays`, `bestLandingDay`, `bestLandingTime` (`src/windows.mjs`), `tests/windows.test.mjs`.
- **Limits:** Searches hourly starts within 30 days of the chosen date. The criterion is geometric (most hours with both in view), not a mission optimum.
- **Smallest fix:** None required.

**3. How long will we have sunlight? — WORKING**
- **How:** banner countdown; **Surface stay** → **Sunlit time**; **Lunar day ahead** → **Longest sunlight**.
- **Answer given:** IM-4: "Sunrise in 1 d 23 h · Nov 17, 11:54 UTC"; sunlit "≈ 12.1 h · 17%" of the stay; "Sunlit, next 30 days 41% · 12.2 d"; "Longest sunlight 12 d 3 h from Nov 17". Disc: "full Sun 10.0 h, at least part of it 14.2 h. Next: first light Nov 17, 09:50 UTC, then full disc Nov 17, 14:05 UTC."
- **Evidence:** `updateBanner` (`src/main.js:520`), `refreshMetrics` (`:553`), `visibleHours` (`src/ephemeris.mjs:28`), `discSeries` (`src/disc.mjs:31`), `tests/disc.test.mjs`.
- **Limits:** Sunlight is not usable power. The disc is a plain circle of even brightness.
- **Smallest fix:** None required.

**4. When will Earth be obstructed, and for how long? — WORKING (re-tested after fixes)**
- **How:** banner; blue band on the timeline; **Lunar day ahead** → outage list.
- **Answer given:** IM-4: "1 d 3 h until Earthrise · Nov 16, 15:26 UTC"; "Earth out of view: Nov 15 00:00 to Nov 16 15:26 (1 d 15 h); Dec 1 07:38 to Dec 13 16:11 (12 d 8 h)"; "Longest Earth outage 12 d 8 h from Dec 1"; Earth in view 53% of 30 days.
- **Evidence:** `renderLunar` (`src/main.js`), `segments`, `gaps`, `longest` (`src/windows.mjs`).
- **Limits:** Uses Earth's centre for the hours. Not a communications assessment. The banner and the list now give the same time (they differed by up to five minutes before the fix).
- **Smallest fix:** None required.

**5. Delay by 3, 7 or 14 days — WORKING**
- **How:** **Compare**, then **+3 d**, **+7 d**, **+14 d** on the card.
- **Answer given:** Malapert region, 3 d stay:

  | Landing | Sunlit | Earth | Both | Sentence |
  |---|---|---|---|---|
  | Nov 15 (baseline) | 0.0 h | 72.0 h | 0.0 h | "No direct sunlight during the stay. Earth in view throughout." |
  | Nov 18 | 71.9 h | 72.0 h | 71.9 h | "Sunlit for about 72 of 72 hours…" |
  | Nov 22 | 72.0 h | 72.0 h | 72.0 h | tagged "Most sunlight", "Most Sun + Earth" |
  | Nov 29 | 65.6 h | 72.0 h | 65.6 h | "Sunlit for about 66 of 72 hours…" |

- **Evidence:** `addOption`, `renderComparison` (`src/main.js:690,702`).
- **Limits:** Four options is the limit.
- **Smallest fix:** None required.

**6. Compare three sites on the same dates — WORKING**
- **Answer given** (Nov 15, 3 d; sunlit / Earth / both): Malapert 0.0 / 72.0 / 0.0 h (baseline, "Longest Earth view"); Blue Moon Pathfinder 1 72.0 / 16.0 / 16.0 h ("Most sunlight", "Most Sun + Earth", Sun height avg 1.2°, slope 2.7° over 80 m, approximate location); IM-4 12.1 / 32.6 / 12.1 h (Sun height avg 5.0°, slope 9.5° over 160 m).
- **Evidence:** `renderComparison` (`src/main.js:702`); CSV export (`:787`).
- **Limits:** Totals and bands; no hour-by-hour difference view.
- **Smallest fix:** None required.

**7. Which terrain features obstruct the Sun? — WORKING (re-tested after fixes)**
- **How:** site card → note under **Sky from the surface**; a diamond marker on the map when zoomed in.
- **Answer given:** IM-4: "Sun: up at 2.7° but hidden by terrain 360 m away to the east-northeast (on Mons Mouton), which rises to 7.9°. Earth: up at 1.5° but hidden by terrain 5.0 km away to the northwest (on Mons Mouton), which rises to 2.9°." Shackleton region point: "hidden by terrain 2.2 km away to the east-southeast, which rises to 7.8°" (no IAU feature covers that spot, so no name is given).
- **Evidence:** `obstructionAt`, `destination` (`src/terrain-math.mjs`), `placeName` (`src/features.mjs`), `setBlocker` (`src/main.js`), `tests/features.test.mjs`.
- **Limits:** A name appears only where an IAU-named round feature covers the blocking point; features are treated as circles. The marker shows only when zoomed in far enough to stand apart from the site's pin.
- **Smallest fix:** None required.

**8. Longest period without direct sunlight — WORKING**
- **Answer given:** IM-4: "Longest darkness ≥ 15 d 8 h from Nov 29". A far-side pin at 0°N 180°E: "15 d 8 h from Nov 16". Shackleton point: "≥ 14 d 0 h from Nov 30".
- **Evidence:** `gaps`, `longest` (`src/windows.mjs:25,33`).
- **Limits:** Capped at 30 days; "≥" marks a stretch that runs past the window.
- **Smallest fix:** Science: a longer series for a year-long search.

**9. How reliable are the predictions? — WORKING (re-tested after fixes)**
- **How:** **Method** on the site card or the grey rail button; the last line of every **Surface stay** panel.
- **Answer given:** Twelve sections including Benchmark and Place names. Benchmark now reports two outside checks: Sun angles at the Apollo sites, and the terrain model against NASA's long-term maps ("differs from NASA's by 3 percentage points on average… Nine of the ten are within 5 points. The exception is a knife-edge ridge beside Shackleton, where the app gives 84% and NASA's pixel 68%"). The stay panel ends "Totals agree with NASA's long-term maps to a few percentage points on ordinary ground; times at grazing angles are approximate."
- **Evidence:** `index.html` method sheet, `scripts/validate-illumination.mjs`, `data/validation-illumination.json`, `data/benchmark-apollo.json`.
- **Limits:** The check is of year-long totals at ten points. No individual sunrise, sunset or outage time has been checked against an outside source, and no time carries an error bar.
- **Smallest fix:** Science: compare one terrain-blocked event time with a published value, if one can be found.

**10. Save, export or share — WORKING**
- **Answer given:** **Share** put the view in the address: `?site=apollo11&date=1969-07-20&hour=20&t=0.25&stay=24`, and showed "The address bar now holds a link to this view. Copy it from there to share." (the automated browser refused clipboard access, so the fallback appeared). **Export CSV** on the ranking produced 20 lines with columns for coordinates, landing time, stay, horizon model, sunlit, Earth, combined, full-disc and any-disc hours, Sun height, elevation, slope, terrain data, approximate flag and source.
- **Evidence:** `writeUrl`, `restoreFromUrl` (`src/main.js:803,815`), `toCsv` (`src/export.mjs:2`), `tests/export.test.mjs`.
- **Limits:** No saved projects or accounts. Copying to the clipboard from a real click was not verified.
- **Smallest fix:** None required.

### Audience 2: Educators

**11. Why the south pole? — WORKING**
- **Answer given:** List explainer "Why land near the south pole?": "Craters near the Moon's south pole are thought to hold water ice and other resources scientists want to study… Near the pole the Sun never climbs more than a few degrees above the horizon, so mountains and crater rims decide…"
- **Evidence:** `index.html:85`.
- **Limits:** A short note, visible only in the site list.

**12. Why permanent shadow? — WORKING**
- **Answer given:** Explainer "Why do some craters never see the Sun?": "The Moon is tilted only about 1.5°, so at its poles the Sun circles just above the horizon all year… The floor of a deep crater sits below its own rim, and a Sun that low can never clear it." A pin on Shackleton's floor reads "Permanent shadow: Yes, NASA maps this spot as never sunlit", long-term "Sun 0%", and the app's own 30 days give 0% sunlit.
- **Evidence:** `index.html:85`, `psrAt` (`src/main.js:127`).

**13. Where is the Sun in the sky? — WORKING**
- **Answer given:** Apollo 11, July 20, 1969, 20:15 UTC: Sun 10.7°, azimuth 88.8°, "Sunlit", disc 100%; "Sun: 11.3° clear of the terrain to the east."
- **Evidence:** `refreshMetrics`, `drawSky` (`src/main.js:553,539`), `tests/ephemeris.test.mjs`.
- **Limits:** The chart is a flat strip of direction against height.

**14. Can Earth be seen from everywhere? — WORKING (re-tested after fixes)**
- **How:** the list explainer "Can you see Earth from everywhere on the Moon?"; press the heat-map button twice for the Earth view; or drop pins.
- **Answer given:** Explainer: "No. The Moon always keeps the same face toward Earth, so Earth hangs almost still in its sky. On the near side Earth is always up; on the far side it is never seen…". Earth view legend: "poles: long-term · elsewhere: Earth up now · band: Earth rises and sets"; the near side is washed blue, the far side is not. Pin at 0°N 180°E: Earth −85.7°, "Earth stays out of view through Dec 16".
- **Evidence:** `addPolarOverlay` (`src/psr.mjs`), `index.html:85`.
- **Limits:** Outside the polar maps the Earth view is level-ground geometry for the selected time; local terrain is only in the per-site numbers.
- **Smallest fix:** None required.

**15. Why do nearby places differ? — WORKING**
- **Answer given:** Blue Moon Pathfinder 1 point and Shackleton point, both at 89.5°S: 72.0 h against 0.0 h of sunlight in the same three days. IM-4's note names the cause (terrain 360 m away to the east-northeast rising to 7.9°). Turning **Terrain off** on IM-4 changes sunlit time from 12.1 h to 72.0 h.
- **Evidence:** terrain toggle (`src/main.js:608`), `obstructionAt`.
- **Limits:** The reason appears on each site's card, not in the comparison.

**16. Advance time and watch shadows — WORKING**
- **Answer given:** 2.5 seconds of **Play** moved the clock from 12:00 Nov 15 to 08:00 Nov 16 and the map read "Terrain shadows · updating". The slider covers 720 hours in quarter-hour steps.
- **Evidence:** play handler (`src/main.js:624`), `src/terrain-shadows.mjs`.
- **Limits:** One speed. The shadow layer is coarser than the site numbers.

**17. Apollo 11 on July 20, 1969 — WORKING**
- **Answer given:** Sun 10.7° at azimuth 88.8° at 20:15 UTC; Earth 59.2° up, 387,950 km away; "Sunlit for the whole stay. Earth in view throughout." Elevation −1,922 m. The Apollo Lunar Surface Journal gives 10.65° and 88.81° at touchdown (20:17:39).
- **Evidence:** date range (`index.html:246`, `server.mjs:95`), `data/benchmark-apollo.json`.
- **Limits:** Terrain there is the 1.9 km grid; slope "0.9° regional, over 3.8 km".

**18. Plan and compare own missions — WORKING**
- **Answer given:** Typing `-84.5, 30` offers "Go to -84.5, 30"; a pin loads full results, joins the ranking (19 rows with a pin selected) and can be compared and shared by link.
- **Evidence:** search (`src/main.js:504`), `dropPinAt` (`:476`), `addOption` (`:690`).
- **Limits:** Pins are all called "Dropped pin".

**19. Change the landing date — WORKING**
- **Answer given:** Malapert: Nov 15 "No direct sunlight during the stay"; Nov 18 "Sunlit for about 72 of 72 hours".
- **Evidence:** `applyDate` (`src/main.js:626`).

**20. Understand how the results arise — WORKING (re-tested after fixes)**
- **How:** site card → **How was this worked out?** under the sky chart; the list explainers; **Terrain on / off**.
- **Answer given:** IM-4: "Where the Sun is. NASA/JPL Horizons puts it 2.7° above level ground, toward the east-northeast, at Nov 15, 12:00 UTC. How high the ground is that way. NASA's LOLA terrain reaches 7.9° in that direction, from ground 360 m away. Compare. 2.7° is below 7.9°, so the Sun is hidden." followed by "The app repeats this test every five minutes for 30 days…".
- **Evidence:** `refreshMetrics` (`src/main.js`), `index.html`.
- **Limits:** The steps are text, not a diagram. The method sheet itself is still long and technical.
- **Smallest fix:** None required.

### Audience 3: General public

**21. Explore like a maps app — WORKING (re-tested after fixes)**
- **Answer given:** Drag, zoom, right-click to pin, Explore / Landing / Satellite, a draggable sheet on phones. Search covers IAU names: "Tycho" returns Tycho (crater, 85 km across) and its satellite craters; "copern" returns Copernicus; "mare ser" returns Mare Serenitatis. The map now labels features as you move: the whole-Moon view shows Mare Tranquillitatis, Mare Fecunditatis and Mare Nubium; the Landing view at Apollo 15 shows Montes Apenninus, Mons Hadley, Rimae Fresnel and Conon. In that Landing view 81 NASA Moon Trek tiles loaded and Hadley Rille is resolved.
- **Evidence:** `searchFeatures` (`src/features.mjs`), `placeFeatureNames` (`src/main.js`), `loadDetail` (`src/surface-patch.mjs`), `tests/features.test.mjs`.
- **Limits:** The globe's own image is still about 1.3 km per pixel; the sharper imagery appears only in the Landing view, within 78° of the equator, and needs NASA's tile server to answer. Labels cannot be clicked.
- **Smallest fix:** None required.

**22. Historic human landing sites — WORKING**
- **Answer given:** The Apollo group lists Apollo 11, 12, 14, 15, 16 and 17, each with data and links to QuickMap and Moon Trek.
- **Evidence:** `src/sites.mjs:9`.

**23. Terrain and horizon of a point — WORKING (re-tested after fixes)**
- **Answer given:** IM-4: +5,040 m, slope "9.5° over 160 m", "NASA LOLA · 80 m south-polar grid", a 360° skyline chart. A north-polar pin (87.8°N 47.1°W): slope "25.8° over 160 m", "NASA LOLA · 80 m north-polar grid" (it read "22.8° regional, over 3.8 km" on the 1.9 km grid before the fix).
- **Evidence:** `computeHorizon`, `slopeAt`, `northPolarPixel` (`src/terrain-math.mjs`), `terrain-worker.mjs`, `enterSurface` (`src/main.js`).
- **Limits:** Between 80°S and 80°N terrain is 1.9 km coarse.
- **Smallest fix:** Data: a finer mid-latitude model.

**24. Could I see Earth at a date and time? — WORKING**
- **Answer given:** IM-4, Nov 15 12:00 UTC: Earth 1.5°, "Blocked by terrain", −1.4° above terrain, disc 0%, 403,806 km. Apollo 11 in 1969: 59.2°, "Earth in view".
- **Evidence:** `refreshMetrics` (`src/main.js:553`), `horizonAt` (`src/terrain-math.mjs:46`).

**25. Where are the permanently shadowed regions? — WORKING**
- **Answer given:** Blue patches at both poles (button on by default). Shackleton floor pin: "Yes". Hermite A pin in the north: "Yes". Shackleton region point: "No, nearest is 2.3 km away". Apollo 11: "Not mapped here, NASA's maps cover within 15° of each pole".
- **Evidence:** `addPolarOverlay` (`src/psr.mjs:68`), `psrAt` (`src/main.js:127`), `tests/psr.test.mjs`.
- **Limits:** NASA's maps, not the app's calculation; within 15° of each pole.

**26. Where is sunlight right now? — WORKING**
- **Answer given:** **Now** set 07:00 Nov 15; "Sun is directly overhead at 1.6°S 110.9°E"; "Earth is directly overhead at 3.0°N 3.0°W"; the globe is lit from that side with terrain shadows.
- **Evidence:** today handler (`src/main.js:628`), `updateBodies` (`:263`).
- **Limits:** Snaps to the hour.

**27. Future missions and why — WORKING (re-tested after fixes)**
- **Answer given:** Five targets, each with year, operator, an "Approximate" note and now a purpose line, for example IM-4: "Why here: An Intuitive Machines delivery for NASA's CLPS programme to high ground near the south pole, the kind of terrain crewed landings are being planned for."
- **Evidence:** `src/sites.mjs`, sources in `README.md` and `REFERENCES.md`.
- **Limits:** Positions are approximate. The purpose lines paraphrase encyclopedia summaries and are one sentence each.
- **Smallest fix:** None required.

**28. Where could I see an Earthrise? — WORKING (re-tested after fixes)**
- **Answer given:** The explainer says where: "there is a band about 8° wide around the edge of the near side, and near the poles, where Earth slowly rises and sets over a month. That band is the only place an Earthrise can be watched from the ground." The Earth view draws that band on the globe. Per site, with terrain: IM-4 "1 d 3 h until Earthrise · Nov 16, 15:26 UTC".
- **Evidence:** `addPolarOverlay` (`src/psr.mjs`), `updateBanner` (`src/main.js`), `index.html:85`.
- **Limits:** The band is level-ground geometry around the mean near-side edge; whether a particular spot sees it depends on local terrain, which the per-site countdown includes.
- **Smallest fix:** None required.

**29. How do conditions change between locations? — WORKING**
- **Answer given:** Ranking of all 18 for Nov 15, 3 d: Blue Ghost M1, Chandrayaan-3 and Apollo 17 at 72.0 h of Sun and Earth together; Apollo 11 71.2 h; IM-2 Athena 65.8 h; SLIM 64.3 h; Apollo 16 52.8 h; Blue Moon Pathfinder 1 16.0 h; Apollo 15 12.9 h; IM-4 12.1 h; eight sites 0.0 h.
- **Evidence:** `renderRanking` (`src/main.js:740`).
- **Limits:** Terrain detail differs by region and the table does not show it (the CSV does).

**30. A simple explanation of the trade-offs — WORKING**
- **Answer given:** IM-4 card: "Sunlit for about 12 of 72 hours. Earth in view for about 33 of 72 hours. Both at once for about 12 hours." Comparison cards carry the same kind of sentence and tags, and every stay panel ends "Geometry only. Sunlight is not usable power, Earth in view is not a working radio link, and nothing here assesses landing safety."
- **Evidence:** `staySentence` (`src/windows.mjs:91`), `tests/windows.test.mjs`.
- **Limits:** One sentence per option; the app does not say which option it would choose.

---

## 5. The five core NASA questions

| | Answers it today? | Defensible basis? | Clear to a newcomer? | Inspectable by an expert? | Reproducible? | Separates favorable from safe? |
|---|---|---|---|---|---|---|
| **WHERE** | Yes, three ways: ranking, heat map, date-checked best spot | Ranking and best spot: the app's own calculation. Heat map: NASA's long-term product | Mostly; the heat map needs its legend read | Yes: method sheet, source hashes | Yes: share link, CSV | Yes: "geometry only" line; slope shown but not scored |
| **WHEN** | A best day and a best hour within 30 days | Yes for what it computes | Yes: bars and one line | Yes | Yes | Yes |
| **SUNLIGHT** | Yes: windows, totals, disc times, longest dark | Yes: JPL plus LOLA skyline; Sun angles checked at Apollo sites | Yes: countdown and sentence | Yes | Yes | Yes: "not usable power" |
| **EARTH** | Yes: outages listed with start, end, length | Yes, same model; Earth's centre for totals | Yes | Yes | Yes | Yes: "not a working radio link" |
| **COMPARE** | Yes: four options, deltas, tags, CSV | Yes | Yes: sentences per option | Yes | Yes | Yes |

**Scientific correctness versus presentation.** The Sun and Earth directions are as good as JPL Horizons. Terrain is the weaker link: 40 m near the south pole, 80 m near the north, coarse in between. Year-long totals now agree with NASA's long-term maps to about 3 percentage points on average, but individual event times are still shown to the minute without an uncertainty beside them, and on sharp ridges a result depends heavily on the exact point.

---

## 6. Scientific integrity review

- **Coordinate conventions.** Planetocentric latitude, east-positive longitude, 1,737.4 km sphere throughout (`src/terrain-math.mjs`, `src/psr.mjs`). Polar map orientation is unit-tested for both poles and was confirmed against NASA's Earth-visibility maps.
- **Lunar reference frames.** The LOLA products and Apollo coordinates are in the mean-Earth/polar-axis frame, and JPL Horizons reports `MEAN_ME (high precision)` for a surface site (checked November 15, 2026), so the site positions and the terrain share a frame. The global and polar LOLA products are different releases of that frame; small offsets between them remain possible.
- **Time.** All times are UTC as returned by Horizons; the interface labels them UTC. The Earth-picture orientation uses a fixed TT−UTC of 69.184 s, which is about 30 s off in 1969; that affects only how the Earth image is turned, not any number.
- **Ephemerides.** Live Horizons, apparent and airless, at DEM height plus 2 m. Hourly samples are interpolated linearly; near the zenith (a far-side pin peaked at 88.6°) azimuth interpolation is poor, which affects the sight line's direction only.
- **Terrain and horizon.** 0.25° azimuth steps to 300 km. Narrow ridges between rays and small features below the grid size can be missed. The observer is 2 m above the surface; a lander's mast or array height would change grazing events.
- **Illumination and shadow.** Site numbers use the fine skyline; the drawn shadow layer uses 160 m (south pole) or 3.8 km grids, so the picture and the numbers can disagree at edges. Eclipses of the Sun by Earth are now evaluated geometrically and were checked against the two 2026 lunar eclipses; Earth's atmosphere is ignored.
- **Earth visibility.** Line of sight to Earth's centre for hours; disc share reported separately. No ground stations, antennas or relays.
- **Long-term maps.** NASA's values count any part of the disc as visible, and the app averages them to 480 m. They are not comparable one-to-one with the app's 30-day, centre-based figures (Shackleton point: 12% long-term against 22% for the next 30 days).
- **Dates.** 1950 to 2099 accepted; only 1969–1972 and 2026 have been exercised. Nothing suggests other dates fail, but they were not tested.
- **Resolution and coverage.** 40 m south of 85°S, 80 m from 80°S to 85°S and north of 80°N, 1.9 km elsewhere. The north-polar grid's orientation was confirmed against the global grid (61 m RMS difference, against 1,160 m the other way round).
- **Validation.** Year-long Sun and Earth visibility at ten polar points was compared with NASA's AVGVISIB maps: mean absolute difference 3.1 and 2.3 percentage points, largest 15.8 at a knife-edge ridge where NASA's own neighbouring pixels span 51% to 85%.
- **Place names.** Features are circles from a centre and a diameter; seas and mountains are named only well inside the circle, and linear features never.
- **Caching and placeholders.** Results are cached in memory by site, date and height; nothing is precomputed except NASA's long-term maps, and no placeholder values exist. If JPL or terrain is unavailable the app shows an error rather than a substitute.
- **Site positions.** Future targets are feature centres or candidate points, flagged "Approximate" in the card, ranking and CSV.

---

## 7. Three people, first five minutes

**Mission planner.** Opens the ranking, sorts by Sun + Earth, opens IM-4, reads the blocking note and outage list, adds two delays to the comparison, exports CSV, opens Method. Understands at once: the three totals, the timeline bands, the terrain source per site. Likely confusion: the best-spot pin showing no sunlight on the chosen date; long-term percentages beside 30-day ones; no uncertainty. Detail level: right, short of validation.

**13-year-old.** Spins the Moon, taps Apollo 11, presses Play, right-clicks to drop a pin, turns on the heat map. Understands at once: gold is Sun, blue is Earth, the countdown. Likely confusion: "above terrain" versus "elevation"; the strip-shaped sky chart; why the far side never sees Earth. Detail level: slightly too much text below the tiles; the explainers are hidden in the list view.

**Curious adult.** Sees a Moon with labelled pins and a clock, taps a site, reads one sentence. Understands at once: sunlit or not, Earth in view or not, the countdown. Likely confusion: what the map buttons do (a column of icons with no labels); what "3 d" stay means; nothing to search for except the listed sites.

**Improvements that help all three:** label the map buttons on first use; put a one-line "what am I looking at" above the tiles; add named features to search; show an uncertainty note beside times.

---

## 8. Prioritized improvements

Done since the second run: validation against NASA's long-term maps; date-checked best spot; best landing hour; north-polar terrain; named features in search and blocking notes; Earth view with the Earthrise band and an explainer; the Horizons frame confirmed; exact outage times; a purpose line per future mission; a step-by-step explanation.

Still open, in order:

1. **An outside check of one terrain-blocked event time**, and an uncertainty note beside times.
2. **Rank every cell of a region for a chosen date**, rather than six candidates.
3. **Finer terrain between 80°S and 80°N.**
4. **Label the map buttons** for first-time visitors.

Added after this list was first written: eclipses of the Sun by Earth (in every sunlight figure and on the globe), and a slope layer near both poles with slope as a preference in the best-spot finder.

---

## What could not be verified

- Safari and a real phone. The phone sheet was fixed after a report from the team's own phone and re-checked only at phone size in Chromium.
- Copying a share link to the clipboard from a real click.
- The GPU shadow geometry check recorded in `VERIFICATION.md` was not repeated.
- Dates outside 1969–1972 and 2026.
- Which continents face the Moon on the Earth globe: unit-tested, not checked by eye.
- Behaviour with many real visitors; one load test from one laptop passed.

## Defects found during this run

- The Earthrise time in the banner (15:26) and in the outage list (15:30) differed by up to five minutes; fixed, both now read 15:26.
- No others. The stale comparison card noted in the first run is gone.
