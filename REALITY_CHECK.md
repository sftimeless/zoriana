# Zoriana — 30-question product reality check (second run)

Evaluated November 15, 2026 (UTC morning) against commit `cdb9bb6`, on the public site https://zoriana.fly.dev/ with live JPL Horizons data.

**This is the second run.** The first, at commit `e105d83` on November 14, scored 12 working, 14 partial, 4 not implemented. It is kept in the git history of this file. This run scores **22 working, 8 partial, 0 not implemented, 0 unverified**.

**Who ran it.** The same AI assistant that wrote most of the code, so it is not an outside audit. To keep it honest, every "answer given" below is text read from the running site during this run, not recalled or taken from the documents, and where the app cannot answer, the entry says so.

**Naming.** The brief calls the product "Luna Maps by Zoriana". That name appears nowhere in the code, the site or the documents. The app's title is "Zoriana — Lunar Landing Site Navigator". This report evaluates that app.

**How it was tested.** The desktop app's built-in Chromium browser against the live site, plus direct requests to its API. Example unless stated otherwise: landing date 2026-11-15, 3-day stay, terrain on, timeline at 12:00 UTC. 60 unit tests pass (`npm test`). Not tested in this run: Safari, a real phone, slow graphics hardware.

**Status key.** WORKING: implemented, exercised, gives a supported result. PARTIAL: some of the question is answered. NOT IMPLEMENTED: the function does not exist. UNVERIFIED: may exist, not confirmed.

---

## 1. Executive verdict

Zoriana answers NASA's one firm requirement (show where the Sun and Earth sit relative to the horizon at a chosen site and date) with real ephemerides and real terrain, and it now covers almost all of the optional ideas in the brief: curated past and future sites, side-by-side comparison, any date from 1950 to 2099, countdowns, stay metrics, 3D and tilted views, playback, and plain-language text for newcomers. Since the first run it has gained a way to answer "where" beyond the curated list: NASA's long-term illumination maps drawn as a heat map, a best-spot finder, and permanent shadow maps at both poles.

It is a credible first-pass planning and teaching tool, and it says clearly that it is geometry only. It is not a mission tool. The main weaknesses are: the area search uses long-term averages rather than the chosen date; the best landing time is a day, not an hour; the terrain model has only one external check (Sun angles at Apollo sites) and none for terrain-blocked windows; terrain away from the south pole, including the whole north pole, is 1.9 km coarse; and place search knows only its 18 sites.

---

## 2. Scorecard

| # | Audience | Question (short) | Status | Evidence | Primary gap |
|---|---|---|---|---|---|
| 1 | Planner | Where to land near the south pole | WORKING | Ranking; heat map; best spot | Area search is long-term, not for the chosen date |
| 2 | Planner | When to land | PARTIAL | "Most sunlit landing day" | Recommends a day, not an hour; 30 days ahead only |
| 3 | Planner | How long is sunlight | WORKING | Stay totals, 30-day facts, disc times | Not usable power |
| 4 | Planner | Earth outages | WORKING | Outage list with start, end, length | Line of sight is not a link |
| 5 | Planner | Delay by 3, 7, 14 days | WORKING | Delay buttons in comparison | Four options at most |
| 6 | Planner | Compare three sites | WORKING | Comparison cards, CSV | Totals, not hour-by-hour differences |
| 7 | Planner | What terrain blocks the Sun | PARTIAL | Distance, direction, height of blocker | No feature names; not marked on the map |
| 8 | Planner | Longest darkness | WORKING | "Longest darkness" | Capped at 30 days |
| 9 | Planner | Reliability | PARTIAL | Method sheet, Apollo benchmark | No error bars; terrain windows not validated |
| 10 | Planner | Save, export, share | WORKING | Share link, two CSV exports | No saved projects |
| 11 | Educator | Why the south pole | WORKING | Explainer in the site list | Three sentences only |
| 12 | Educator | Why permanent shadow | WORKING | Explainer; shadow map | — |
| 13 | Educator | Sun's position in the sky | WORKING | Tiles, sky chart, sight line | Flat strip chart, not a dome |
| 14 | Educator | Earth from everywhere? | PARTIAL | Pins; Earth heat map near poles | No far-side shading; one pin at a time |
| 15 | Educator | Why neighbours differ | WORKING | Blocking note; terrain toggle | Reason is per site, not in the comparison |
| 16 | Educator | Advance time | WORKING | Play; 30-day slider | No speed control |
| 17 | Educator | Apollo 11, July 20, 1969 | WORKING | Loads; matches published angle | Regional terrain only |
| 18 | Educator | Plan own missions | WORKING | Pins, dates, compare, share | Pins cannot be named |
| 19 | Educator | Change the date | WORKING | Date field, day bars | — |
| 20 | Educator | Understand the method | PARTIAL | "How to read this app"; terrain toggle | No step-by-step walk-through; method sheet is technical |
| 21 | Public | Explore like a maps app | PARTIAL | Rotate, zoom, pin, tilt | Search knows 18 sites; no named features |
| 22 | Public | Historic landing sites | WORKING | Six Apollo sites | Crewed sites only from Apollo, as expected |
| 23 | Public | Terrain and horizon of a point | WORKING | Sky chart, elevation, slope | 1.9 km terrain outside 80°S |
| 24 | Public | See Earth at a time | WORKING | Earth tile with disc share | — |
| 25 | Public | Permanently shadowed regions | WORKING | Shadow layer, both poles | Within 15° of the poles |
| 26 | Public | Sunlight right now | WORKING | "Now"; lit globe; Sun overhead | Snaps to the hour |
| 27 | Public | Future missions and why | PARTIAL | Five targets with notes | Positions approximate; purpose per mission not given |
| 28 | Public | Where to see an Earthrise | PARTIAL | Countdown per site; Earth heat map | No search for where; no explanation |
| 29 | Public | Differences between locations | WORKING | Ranking of all sites; heat map | First ranking of a new date takes time |
| 30 | Public | Simple trade-off explanation | WORKING | Sentences on card and comparison | One sentence per option, no verdict |

**Totals: WORKING 22 · PARTIAL 8 · NOT IMPLEMENTED 0 · UNVERIFIED 0.**

---

## 3. What the app is today (Phase 1)

| Area | What exists | Where |
|---|---|---|
| Architecture | One Node server and a single-page Three.js client. Deployed on Fly.io (one 1 GB machine). | `server.mjs`, `src/main.js`, `Dockerfile`, `fly.toml` |
| API | `GET /api/ephemeris?lat&lon&date&reference`: 31 days of hourly Sun and Earth azimuth, elevation and distance, plus the site's terrain horizon. | `server.mjs:35,95` |
| Ephemerides | Live NASA/JPL Horizons observer tables per site and date: apparent, airless, observer at DEM elevation + 2 m. Nothing precomputed or mocked. Cached in memory; today's data for the 18 sites is fetched at start-up. | `server.mjs:18,45`, `src/ephemeris.mjs:2` |
| Terrain horizon | Computed on the server from LOLA elevation: a ray every 0.25° out to 300 km on a curved Moon. | `src/terrain-math.mjs:65`, `terrain-worker.mjs:12` |
| Terrain data | 40 m grid south of 85°S; 80 m from 80°S to 85°S; 1.9 km everywhere else, including the north pole. | `terrain-worker.mjs`, `data/terrain-manifest.json` |
| Visibility | Body centre above the terrain horizon, sampled every 5 minutes between hourly JPL points. Disc share reported alongside. | `src/terrain-math.mjs:59`, `src/disc.mjs:31` |
| Long-term maps | NASA LOLA permanent-shadow and average-visibility maps (120 m source) within 15° of each pole, drawn and looked up; not computed by the app. | `src/psr.mjs`, `scripts/prepare-illumination.py` |
| Sites | 18 curated points in five groups, search by name or coordinates, pins. | `src/sites.mjs:9`, `src/main.js:476,504` |
| Date and time | Landing date 1950-01-01 to 2099-12-24, landing hour, 30-day slider in 15-minute steps. | `index.html:246`, `server.mjs:95` |
| Comparison and ranking | Up to four site-and-date options; ranking of all listed sites. Both export CSV. | `src/main.js:702,740,787` |
| Tests | 60 unit tests: parsing and interpolation (8), terrain and horizon (10), windows and sentences (16), polar maps (8), disc (6), Earth orientation (4), links (4), shadows (3), CSV (1). A separate script compares Sun angles with NASA's Apollo values; it needs the server and is not part of `npm test`. | `tests/*.mjs`, `scripts/benchmark-apollo.mjs` |

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

**1. Where should we land? — WORKING**
- **How:** orange **Rank landing sites** rail button; the ring-shaped **Where-to-land heat map** button; on a polar site card, **Find best spot within 15 km**.
- **Answer given:** Ranking, 3 d from Nov 15 (Sun + Earth / Sunlit / Earth / Sun height): IM-2 Athena 65.8 / 65.8 / 72.0 h / 3.7°; Blue Moon Pathfinder 1 16.0 / 72.0 / 16.0 h / 1.2°; IM-4 12.1 / 12.1 / 32.6 h / 5.0°; Griffin Mission One 0.0 / 72.0 / 0.0 h; Malapert 0.0 / 0.0 / 72.0 h; Shackleton 0.0 / 0.0 / 0.0 h. Shackleton point long-term: "Sun 12% · Earth 47%". Best spot from there: "Best within 15 km: Sun 50% and Earth 56% of the time, 12.3 km away", a pin at 89.8084°S 51.7098°E whose own 30-day figures read "Sunlit 60% · 17.9 d", Earth in view 47%.
- **Evidence:** `renderRanking` (`src/main.js:740`), `setHeat` (`:154`), best-spot handler (`:169`), `bestCell` (`src/psr.mjs:46`), tests `tests/psr.test.mjs`, `tests/windows.test.mjs`.
- **Limits:** The heat map and best-spot finder use NASA's long-term averages over 480 m cells, not the chosen date: the suggested pin above gets 0 h of sunlight in the first three days from Nov 15. The score is two averages multiplied, not a measured overlap. Slope and hazards are not part of it.
- **Smallest fix:** Science: run the app's own date-specific calculation over a grid of points near a site and rank them.

**2. When should we land? — PARTIAL**
- **How:** site card → **Lunar day ahead** bars and **Most sunlit landing day**; **Hour** selector on the timeline.
- **Answer given:** IM-4: "Most sunlit landing day for a 3 d stay: Nov 18 · 72.0 h sunlit · 72.0 h Earth". Shackleton point: Nov 25.
- **Evidence:** `renderLunar` (`src/main.js:648`), `landingDays`, `bestLandingDay` (`src/windows.mjs:41,51`).
- **Limits:** The search steps by whole days at the chosen landing hour; it does not recommend an hour. It looks 30 days ahead. "Best" is most sunlit hours, with Earth hours as tie-break.
- **Smallest fix:** Science: search landing hours as well, and offer "most Sun and Earth together" as the criterion.

**3. How long will we have sunlight? — WORKING**
- **How:** banner countdown; **Surface stay** → **Sunlit time**; **Lunar day ahead** → **Longest sunlight**.
- **Answer given:** IM-4: "Sunrise in 1 d 23 h · Nov 17, 11:54 UTC"; sunlit "≈ 12.1 h · 17%" of the stay; "Sunlit, next 30 days 41% · 12.2 d"; "Longest sunlight 12 d 3 h from Nov 17". Disc: "full Sun 10.0 h, at least part of it 14.2 h. Next: first light Nov 17, 09:50 UTC, then full disc Nov 17, 14:05 UTC."
- **Evidence:** `updateBanner` (`src/main.js:520`), `refreshMetrics` (`:553`), `visibleHours` (`src/ephemeris.mjs:28`), `discSeries` (`src/disc.mjs:31`), `tests/disc.test.mjs`.
- **Limits:** Sunlight is not usable power. The disc is a plain circle of even brightness.
- **Smallest fix:** None required.

**4. When will Earth be obstructed, and for how long? — WORKING**
- **How:** banner; blue band on the timeline; **Lunar day ahead** → outage list.
- **Answer given:** IM-4: "1 d 3 h until Earthrise · Nov 16, 15:26 UTC"; "Earth out of view: Nov 15 00:00 to Nov 16 15:30 (1 d 15 h); Dec 1 07:40 to Dec 13 16:15 (12 d 8 h)"; "Longest Earth outage 12 d 8 h from Dec 1"; Earth in view 53% of 30 days.
- **Evidence:** `renderLunar` (`src/main.js:648`), `gaps`, `longest` (`src/windows.mjs:25,33`).
- **Limits:** The banner gives 15:26 and the list 15:30 for the same Earthrise, because the list rounds to five-minute samples. Uses Earth's centre for the hours. Not a communications assessment.
- **Smallest fix:** Presentation: use the interpolated time in the list.

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

**7. Which terrain features obstruct the Sun? — PARTIAL**
- **How:** site card → note under **Sky from the surface**.
- **Answer given:** IM-4: "Sun: up at 2.7° but hidden by terrain 360 m away to the east-northeast, which rises to 7.9°. Earth: up at 1.5° but hidden by terrain 5.0 km away to the northwest, which rises to 2.9°."
- **Evidence:** `obstructionAt` (`src/terrain-math.mjs:53`), `refreshMetrics` (`src/main.js:553`), `tests/terrain.test.mjs`.
- **Limits:** Distance, direction and height, but no feature name, and the blocker is not marked on the map. The distance is that of the highest point along that bearing, at 0.25° steps.
- **Smallest fix:** Presentation: mark the blocking point on the map. Data: a named-feature list.

**8. Longest period without direct sunlight — WORKING**
- **Answer given:** IM-4: "Longest darkness ≥ 15 d 8 h from Nov 29". A far-side pin at 0°N 180°E: "15 d 8 h from Nov 16". Shackleton point: "≥ 14 d 0 h from Nov 30".
- **Evidence:** `gaps`, `longest` (`src/windows.mjs:25,33`).
- **Limits:** Capped at 30 days; "≥" marks a stretch that runs past the window.
- **Smallest fix:** Science: a longer series for a year-long search.

**9. How reliable are the predictions? — PARTIAL**
- **How:** **Method** on the site card or the grey rail button.
- **Answer given:** Eleven sections: Visibility, Libration & orbit, Sampling, Lunar day & comparison, Benchmark, Permanent shadow, Where to land, Terrain & location, Map, Landing view, Rendering. The benchmark section reports the Apollo 11 match and the comparison with NASA's Apollo table.
- **Evidence:** `index.html:261`, `README.md`, `VERIFICATION.md`, `data/benchmark-apollo.json`, `data/terrain-manifest.json`, `data/illumination-manifest.json`.
- **Limits:** Datasets, resolutions and assumptions are stated, but no result carries an error bar. The only external check is of Sun angles at flat Apollo sites. No terrain-blocked sunrise, sunset or Earth outage has been compared with an independent source.
- **Smallest fix:** Science: compare the app's sunlit share at a few polar points over a full year with NASA's average-visibility value for the same pixel, and report the difference.

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

**14. Can Earth be seen from everywhere? — PARTIAL**
- **Answer given:** Pin at 0°N 180°E: Earth −85.7°, "Below horizon", "Earth stays out of view through Dec 16", Earth in view 0% of 30 days. Apollo 11: Earth 59.2° up. The Earth heat map shows how visibility varies, but only within 15° of the poles.
- **Evidence:** `dropPinAt` (`src/main.js:476`), `updateBodies` (`:263`).
- **Limits:** Away from the poles the answer is found one pin at a time. No shading of the hemisphere that never sees Earth; no explanation of why Earth barely moves in the lunar sky.
- **Smallest fix:** Presentation: shade the far side from the Earth-overhead point, with one sentence of explanation.

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

**20. Understand how the results arise — PARTIAL**
- **Answer given:** "How to read this app": "Gold always means the Sun and blue always means Earth… A site needs the Sun above the surrounding ground for solar power, and Earth above it for a direct radio line home…". The terrain toggle shows the effect of terrain directly.
- **Evidence:** `index.html:85,261`.
- **Limits:** No step-by-step "Sun angle, then skyline, then result" walk-through. The method sheet runs to about 8,300 characters of technical text.
- **Smallest fix:** Presentation: a three-step illustrated explainer beside the sky chart.

### Audience 3: General public

**21. Explore like a maps app — PARTIAL**
- **Answer given:** Drag, zoom, right-click to pin, Explore / Landing / Satellite, a draggable sheet on phones. Search "apollo" lists all six; "Tycho" returns "No matching place. Try latitude, longitude…".
- **Evidence:** search (`src/main.js:504`), `setMode` (`:636`), sheet (`:448`).
- **Limits:** Search knows only the 18 sites. No named craters, seas or mountains. Imagery is soft when zoomed in.
- **Smallest fix:** Data: add the IAU list of major named features to search and labels.

**22. Historic human landing sites — WORKING**
- **Answer given:** The Apollo group lists Apollo 11, 12, 14, 15, 16 and 17, each with data and links to QuickMap and Moon Trek.
- **Evidence:** `src/sites.mjs:9`.

**23. Terrain and horizon of a point — WORKING**
- **Answer given:** IM-4: +5,040 m, slope "9.5° over 160 m", "NASA LOLA · 80 m south-polar grid", a 360° skyline chart. A north-polar pin (87.8°N 47.1°W): slope "22.8° regional, over 3.8 km", "NASA LOLA · 1.9 km global grid".
- **Evidence:** `computeHorizon`, `slopeAt` (`src/terrain-math.mjs:65,25`), `enterSurface` (`src/main.js:399`).
- **Limits:** Outside 80°S, and at the whole north pole, terrain is 1.9 km coarse.
- **Smallest fix:** Data: add the LOLA north-polar elevation grids.

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

**27. Future missions and why — PARTIAL**
- **Answer given:** Five targets: Blue Moon Pathfinder 1, Griffin Mission One, IM-4, IM-3 Trinity, Blue Ghost Mission 3, each with year, operator and a note such as "Approximate. The mission names the Mons Mouton plateau; this is the centre of Mons Mouton, not an announced landing point."
- **Evidence:** `src/sites.mjs:9`, sources in `README.md`.
- **Limits:** Positions are approximate and several come from Wikipedia. The only "why" is the general south-pole explainer; the reasons for Reiner Gamma and Gruithuisen are not given.
- **Smallest fix:** Presentation: one sentence of purpose per mission.

**28. Where could I see an Earthrise? — PARTIAL**
- **Answer given:** Per site: IM-4 "1 d 3 h until Earthrise · Nov 16, 15:26 UTC". The Earth heat map marks polar ground where Earth is in view only part of the time, which is where it rises and sets.
- **Evidence:** `updateBanner` (`src/main.js:520`).
- **Limits:** No search for the next Earthrise across places, and no sentence explaining that it happens only near the edge of the near side and the poles.
- **Smallest fix:** Presentation: one explanatory sentence; label the Earth heat map's in-between zone.

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
| **WHERE** | Yes, three ways: ranking, heat map, best spot | Ranking: yes. Heat map: NASA's own long-term product. Score: a rough product of two averages | Mostly; the heat map needs its legend read | Yes: method sheet, source hashes | Yes: share link, CSV | Yes: "geometry only" line; slope shown but not scored |
| **WHEN** | A best day within 30 days; no best hour | Yes for what it computes | Yes: bars and one line | Yes | Yes | Yes |
| **SUNLIGHT** | Yes: windows, totals, disc times, longest dark | Yes: JPL plus LOLA skyline; Sun angles checked at Apollo sites | Yes: countdown and sentence | Yes | Yes | Yes: "not usable power" |
| **EARTH** | Yes: outages listed with start, end, length | Yes, same model; Earth's centre for totals | Yes | Yes | Yes | Yes: "not a working radio link" |
| **COMPARE** | Yes: four options, deltas, tags, CSV | Yes | Yes: sentences per option | Yes | Yes | Yes |

**Scientific correctness versus presentation.** The Sun and Earth directions are as good as JPL Horizons. The weakest scientific link is terrain: fine near the south pole (40 m), coarse elsewhere, and unvalidated for blocked windows. Presentation is ahead of validation: the interface states results to the minute and tenth of an hour without an uncertainty beside them.

---

## 6. Scientific integrity review

- **Coordinate conventions.** Planetocentric latitude, east-positive longitude, 1,737.4 km sphere throughout (`src/terrain-math.mjs`, `src/psr.mjs`). Polar map orientation is unit-tested for both poles and was confirmed against NASA's Earth-visibility maps.
- **Lunar reference frames.** The LOLA products and Apollo coordinates are in the mean-Earth/polar-axis frame. **Not verified:** which lunar body-fixed frame Horizons uses for a surface site given as longitude, latitude and height. A mismatch between mean-Earth and principal-axis frames would shift a site by under a kilometre: negligible on the 1.9 km grid, but several cells on the 40 m grid.
- **Time.** All times are UTC as returned by Horizons; the interface labels them UTC. The Earth-picture orientation uses a fixed TT−UTC of 69.184 s, which is about 30 s off in 1969; that affects only how the Earth image is turned, not any number.
- **Ephemerides.** Live Horizons, apparent and airless, at DEM height plus 2 m. Hourly samples are interpolated linearly; near the zenith (a far-side pin peaked at 88.6°) azimuth interpolation is poor, which affects the sight line's direction only.
- **Terrain and horizon.** 0.25° azimuth steps to 300 km. Narrow ridges between rays and small features below the grid size can be missed. The observer is 2 m above the surface; a lander's mast or array height would change grazing events.
- **Illumination and shadow.** Site numbers use the fine skyline; the drawn shadow layer uses 160 m (south pole) or 3.8 km grids, so the picture and the numbers can disagree at edges. Eclipses are not evaluated.
- **Earth visibility.** Line of sight to Earth's centre for hours; disc share reported separately. No ground stations, antennas or relays.
- **Long-term maps.** NASA's values count any part of the disc as visible, and the app averages them to 480 m. They are not comparable one-to-one with the app's 30-day, centre-based figures (Shackleton point: 12% long-term against 22% for the next 30 days).
- **Dates.** 1950 to 2099 accepted; only 1969–1972 and 2026 have been exercised. Nothing suggests other dates fail, but they were not tested.
- **Resolution and coverage.** 40 m south of 85°S, 80 m to 80°S, 1.9 km elsewhere. The north pole has fine shadow and visibility maps but only the coarse elevation grid, so the app's own windows there are much rougher than the maps drawn beside them.
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

1. **Validate terrain-blocked results** against an independent source (NASA's average visibility over a year at a few polar pixels) and publish the difference. This is the largest gap between what the app displays and what it has shown to be true.
2. **Date-specific area search**: rank a grid of points around a site with the app's own calculation, so "where" matches the chosen date.
3. **Best landing hour**, and "most Sun and Earth together" as a criterion.
4. **North-polar elevation grids**, so the north pole's numbers match its maps.
5. **Named features** in search and on the map.
6. **Far-side shading and a sentence on Earthrise**.
7. **Confirm the Horizons lunar frame** and note it in the method sheet.
8. **Small presentation fixes**: interpolated times in the outage list; label the map buttons; a purpose line per future mission.

---

## What could not be verified

- Safari and a real phone. The phone sheet was fixed after a report from the team's own phone and re-checked only at phone size in Chromium.
- Copying a share link to the clipboard from a real click.
- The GPU shadow geometry check recorded in `VERIFICATION.md` was not repeated.
- Dates outside 1969–1972 and 2026.
- Which continents face the Moon on the Earth globe: unit-tested, not checked by eye.
- Behaviour with many real visitors; one load test from one laptop passed.

## Defects found during this run

- The Earthrise time in the banner (15:26) and in the outage list (15:30) differ by up to five minutes because the list uses sampled times.
- No others. The stale comparison card noted in the first run is gone.
