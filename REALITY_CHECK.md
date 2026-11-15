# Zoriana — 30-question product reality check (third run)

Evaluated November 15, 2026 (UTC) on the public site https://zoriana.fly.dev/ with live JPL Horizons data, at the build deployed after commit `32ed970` plus the eclipse list and one fix made during this run.

**Score: 30 working, 0 partial, 0 not implemented, 0 unverified.** Earlier runs, kept in this file's git history: first run 12 working, 14 partial, 4 not implemented; second run 22 working, 8 partial.

**Who ran it.** The same AI assistant that wrote most of the code, so this is not an outside audit. Every "answer given" below is text read from the live site during this run. "Working" means the question gets a supported answer; each entry still lists what the answer does not cover.

**Naming.** The brief calls the product "Luna Maps by Zoriana". That name appears nowhere in the code, the site or the documents. The app's title is "Zoriana — Lunar Landing Site Navigator".

**How it was tested.** The desktop app's built-in Chromium browser against the live site, plus direct requests to its API. Example unless stated otherwise: landing date 2026-11-15, 3-day stay, terrain on, timeline at 12:00 UTC. 73 unit tests pass (`npm test`). Not tested: Safari and a real phone.

**Status key.** WORKING: implemented, exercised, gives a supported result. PARTIAL: some of the question is answered. NOT IMPLEMENTED: the function does not exist. UNVERIFIED: may exist, not confirmed.

---

## 1. Executive verdict

Zoriana meets NASA's one firm requirement (show where the Sun and Earth sit relative to the horizon at a chosen site and date) with live JPL ephemerides and real LOLA terrain, and it covers every optional idea in the brief: curated past and future sites, side-by-side comparison, any date from 1950 to 2099, countdowns, stay metrics, 3D and tilted views, playback, and plain-language explanations for newcomers.

Beyond the brief it now answers "where" for whole regions (NASA's long-term maps, a best-spot finder checked against the chosen dates, permanent shadow and slope layers), "when" down to the hour, and it accounts for eclipses. Its results have been checked against four outside sources: published Apollo Sun angles, NASA's long-term illumination maps, the published contact times of the 2026 eclipses, and NASA's eclipse list through 2030.

It remains a first-pass planning and teaching tool, and says so on every stay panel: geometry only, not power, not a radio link, not landing safety. The honest weak points are: no error bar on an individual sunrise, sunset or outage time; 1.9 km terrain between 80°S and 80°N; results on knife-edge ridges that depend on the exact point; a best-spot search that checks six candidates rather than every cell; and no test yet on Safari or a real phone.

---

## 2. Scorecard

| # | Audience | Question (short) | Status | Evidence | Primary gap |
|---|---|---|---|---|---|
| 1 | Planner | Where to land near the south pole | WORKING | Ranking; heat map; date-checked best spot; slope | Best spot checks six candidates, not every cell |
| 2 | Planner | When to land | WORKING | Best landing day and hour | 30 days ahead only |
| 3 | Planner | How long is sunlight | WORKING | Stay totals, 30-day facts, disc times, eclipses | Not usable power |
| 4 | Planner | Earth outages | WORKING | Outage list with start, end, length | Line of sight is not a link |
| 5 | Planner | Delay by 3, 7, 14 days | WORKING | Delay buttons in comparison | Four options at most |
| 6 | Planner | Compare three sites | WORKING | Comparison cards, CSV | Totals, not hour-by-hour differences |
| 7 | Planner | What terrain blocks the Sun | WORKING | Distance, direction, height, IAU name, map marker | Named only where an IAU feature covers the spot |
| 8 | Planner | Longest darkness | WORKING | "Longest darkness" | Capped at 30 days |
| 9 | Planner | Reliability | WORKING | Method sheet; four outside checks | No error bar on individual event times |
| 10 | Planner | Save, export, share | WORKING | Share link, two CSV exports | No saved projects |
| 11 | Educator | Why the south pole | WORKING | Explainer; "Why here" on future sites | Short text |
| 12 | Educator | Why permanent shadow | WORKING | Explainer; shadow map at both poles | — |
| 13 | Educator | Sun's position in the sky | WORKING | Tiles, sky chart, sight line | Flat strip chart, not a dome |
| 14 | Educator | Earth from everywhere? | WORKING | Explainer; Earth view on the whole globe | Level-ground geometry outside the polar maps |
| 15 | Educator | Why neighbours differ | WORKING | Blocking note; terrain toggle | Reason is per site, not in the comparison |
| 16 | Educator | Advance time | WORKING | Play; 30-day slider | One speed |
| 17 | Educator | Apollo 11, July 20, 1969 | WORKING | "See it at touchdown"; matches published angle | Regional terrain only |
| 18 | Educator | Plan own missions | WORKING | Pins, dates, compare, share | Pins cannot be renamed |
| 19 | Educator | Change the date | WORKING | Date field, day bars, best-time button | — |
| 20 | Educator | Understand the method | WORKING | "How was this worked out?" steps | Method sheet is long (12,000 characters) |
| 21 | Public | Explore like a maps app | WORKING | Rotate, zoom, pin, tilt; 9,087 names; labels; 100 m detail | Globe image itself is 1.3 km per pixel |
| 22 | Public | Historic landing sites | WORKING | Six Apollo sites with full dates | — |
| 23 | Public | Terrain and horizon of a point | WORKING | Sky chart, elevation, slope | 1.9 km terrain between 80°S and 80°N |
| 24 | Public | See Earth at a time | WORKING | Earth tile with disc share | — |
| 25 | Public | Permanently shadowed regions | WORKING | Shadow layer, both poles | Within 15° of the poles |
| 26 | Public | Sunlight right now | WORKING | "Now"; lit globe; Sun overhead | Snaps to the hour |
| 27 | Public | Future missions and why | WORKING | Five targets with a purpose line each | Positions approximate |
| 28 | Public | Where to see an Earthrise | WORKING | Earthrise band; explainer; per-site countdown | Band is level-ground geometry |
| 29 | Public | Differences between locations | WORKING | Ranking of all sites; four map layers | First ranking of a new date takes time |
| 30 | Public | Simple trade-off explanation | WORKING | Sentences on card and comparison | One sentence per option, no verdict |

**Totals: WORKING 30 · PARTIAL 0 · NOT IMPLEMENTED 0 · UNVERIFIED 0.**

---

## 3. What the app is today (Phase 1)

| Area | What exists | Where |
|---|---|---|
| Architecture | One Node server and a single-page Three.js client, deployed on Fly.io (one 1 GB machine). | `server.mjs`, `src/main.js`, `Dockerfile`, `fly.toml` |
| API | `GET /api/ephemeris?lat&lon&date&reference`: 31 days of hourly Sun and Earth azimuth, elevation and distance, plus the site's terrain horizon. | `server.mjs` |
| Ephemerides | Live NASA/JPL Horizons observer tables per site and date: apparent, airless, observer at DEM elevation + 2 m, in the mean-Earth lunar frame. Cached in memory; today's data for the 18 sites is fetched at start-up ("18/18 sites in 12 s" in the live log). Nothing precomputed or mocked. | `server.mjs`, `src/ephemeris.mjs` |
| Terrain horizon | Computed on the server from LOLA elevation: a ray every 0.25° out to 300 km on a curved Moon. | `src/terrain-math.mjs`, `terrain-worker.mjs` |
| Terrain data | 40 m south of 85°S; 80 m from 80°S to 85°S and north of 80°N; 1.9 km elsewhere. | `terrain-worker.mjs`, `data/terrain-manifest.json` |
| Visibility | Body centre above the terrain horizon and, for the Sun, outside Earth's disc; sampled every 5 minutes between hourly JPL points. Disc share reported alongside. | `src/terrain-math.mjs`, `src/disc.mjs`, `src/eclipse.mjs` |
| NASA map layers | Permanent shadow, long-term average Sun and Earth visibility (drawn and looked up, not computed here), and slope computed from the 80 m grids; all within 10° to 15° of each pole. | `src/psr.mjs`, `scripts/prepare-illumination.py`, `scripts/prepare-slope.py` |
| Sites and names | 18 curated points in five groups; search across 9,087 IAU-named features; coordinates; pins; map labels. | `src/sites.mjs`, `src/features.mjs` |
| Date and time | Landing date 1950-01-01 to 2099-12-24, landing hour, 30-day slider in 15-minute steps. | `index.html`, `server.mjs` |
| Comparison and ranking | Up to four site-and-date options; ranking of all listed sites. Both export CSV. | `src/main.js:834,872,919` |
| Imagery | One 8K NASA mosaic on the globe; in the Landing view, fine detail from NASA Moon Trek's 100 m tiles within 78° of the equator. | `src/surface-patch.mjs` |
| Tests | 73 unit tests: windows and sentences (18), terrain and horizon (11), polar maps (9), ephemeris (8), disc (6), eclipses (5), place names (4), Earth orientation (4), links (4), shadows (3), CSV (1). Three separate scripts compare results with outside sources; they need the server and are not part of `npm test`. | `tests/*.mjs`, `scripts/benchmark-apollo.mjs`, `scripts/validate-illumination.mjs`, `scripts/check-eclipses.mjs` |

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
- **How:** orange **Rank landing sites** rail button; the ring-shaped map button (Average sunlight, Average Earth view, Sun × Earth score, Slope); on a polar site card, **Find best spot within 15 km**.
- **Answer given:** Ranking, 3 d from Nov 15 (Sun + Earth / Sunlit / Earth / Sun height): IM-2 Athena 65.8 / 65.8 / 72.0 h / 3.7°; Blue Moon Pathfinder 1 16.0 / 72.0 / 16.0 h / 1.2°; IM-4 12.1 / 12.1 / 32.6 h / 5.0°; Griffin Mission One 0.0 / 72.0 / 0.0 h; Malapert 0.0 / 0.0 / 72.0 h; Shackleton 0.0 / 0.0 / 0.0 h. Shackleton point long-term: "Sun 12% · Earth 47%". Best spot from there: "Checked 6 spots for your 3 d stay from Nov 15. This one, 12.7 km away, has 13.1 h of Sun and Earth together and 72.0 h of sunlight, on a 4.4° slope (long-term: Sun 49%, Earth 56%)."
- **Evidence:** `renderRanking` (`src/main.js:872`), `setHeat` (`:159`), best-spot handler (`:176`), `topCells` (`src/psr.mjs`), `tests/psr.test.mjs`.
- **Limits:** The map layers are long-term averages over 480 m cells. The best-spot finder checks six candidates for the chosen dates, not every cell. Slope is at a 160 m scale; rocks and small craters are not resolved.
- **Smallest fix:** Science: rank every cell of an area for the chosen dates.

**2. When should we land? — WORKING**
- **How:** site card → **Lunar day ahead**: bars, **Most sunlit landing day**, **Best landing time** with **Use this time**.
- **Answer given:** IM-4: "Most sunlit landing day for a 3 d stay: Nov 18 · 72.0 h sunlit · 72.0 h Earth"; "Best landing time for Sun and Earth together: Nov 17 12:00 UTC · 72.0 h together · 72.0 h sunlit".
- **Evidence:** `renderLunar` (`src/main.js:768`), `landingDays`, `bestLandingDay`, `bestLandingTime` (`src/windows.mjs`), `tests/windows.test.mjs`.
- **Limits:** Hourly starts within 30 days of the chosen date; a geometric criterion.

**3. How long will we have sunlight? — WORKING**
- **Answer given:** IM-4: "Sunrise in 1 d 23 h · Nov 17, 11:54 UTC"; sunlit "≈ 12.1 h · 17%"; "Sunlit, next 30 days 41% · 12.2 d"; "Longest sunlight 12 d 3 h from Nov 17"; "full Sun 10.0 h, at least part of it 14.2 h. Next: first light Nov 17, 09:50 UTC, then full disc Nov 17, 14:05 UTC"; "Eclipses by Earth: None in these 30 days · Next on NASA's list: Feb 20, 2027".
- **Evidence:** `updateBanner` (`src/main.js:619`), `refreshMetrics` (`:654`), `visibleHours` (`src/ephemeris.mjs`), `src/disc.mjs`, `src/eclipse.mjs`.
- **Limits:** Sunlight is not usable power.

**4. When will Earth be obstructed, and for how long? — WORKING**
- **Answer given:** IM-4: "1 d 3 h until Earthrise · Nov 16, 15:26 UTC"; "Earth out of view: Nov 15 00:00 to Nov 16 15:26 (1 d 15 h); Dec 1 07:38 to Dec 13 16:11 (12 d 8 h)"; "Longest Earth outage 12 d 8 h from Dec 1"; Earth in view 53% of 30 days.
- **Evidence:** `segments`, `gaps`, `longest` (`src/windows.mjs`).
- **Limits:** Earth's centre; not a communications assessment.

**5. Delay by 3, 7 or 14 days — WORKING**
- **Answer given:** Malapert region, 3 d stay (sunlit / Earth / both): Nov 15 baseline 0.0 / 72.0 / 0.0 h, "No direct sunlight during the stay. Earth in view throughout."; Nov 18 71.9 / 72.0 / 71.9 h; Nov 22 72.0 / 72.0 / 72.0 h, tagged "Most sunlight", "Most Sun + Earth"; Nov 29 65.6 / 72.0 / 65.6 h. Delay buttons: +1 d, +3 d, +7 d, +14 d, +30 d.
- **Evidence:** `addOption`, `renderComparison` (`src/main.js:822,834`).
- **Limits:** Four options at most.

**6. Compare three sites on the same dates — WORKING**
- **Answer given** (Nov 15, 3 d): Malapert 0.0 / 72.0 / 0.0 h ("Longest Earth view"); Blue Moon Pathfinder 1 72.0 / 16.0 / 16.0 h ("Most sunlight", "Most Sun + Earth", Sun height avg 1.2°, slope 2.7° over 80 m, approximate location); IM-4 12.1 / 32.6 / 12.1 h (Sun height avg 5.0°, slope 9.5° over 160 m). CSV export: one header and three rows, with full-disc and any-disc hours, elevation, slope and terrain source.
- **Evidence:** `renderComparison` (`src/main.js:834`), `toCsv` (`src/export.mjs`).
- **Limits:** Totals and bands, no hour-by-hour difference view.

**7. Which terrain features obstruct the Sun? — WORKING**
- **Answer given:** IM-4: "Sun: up at 2.7° but hidden by terrain 360 m away to the east-northeast (on Mons Mouton), which rises to 7.9°. Earth: up at 1.5° but hidden by terrain 5.0 km away to the northwest (on Mons Mouton), which rises to 2.9°." Shackleton point: "hidden by terrain 2.2 km away to the east-southeast, which rises to 7.8°" (no IAU feature covers that spot, so no name).
- **Evidence:** `obstructionAt`, `destination` (`src/terrain-math.mjs`), `placeName` (`src/features.mjs`), `setBlocker` (`src/main.js:348`).
- **Limits:** Features are treated as circles; a name appears only where one covers the blocking point.

**8. Longest period without direct sunlight — WORKING**
- **Answer given:** IM-4: "Longest darkness ≥ 15 d 8 h from Nov 29". A pin on Shackleton's floor: sunlit 0% of 30 days.
- **Limits:** Capped at 30 days; "≥" marks a stretch that runs past the window.

**9. How reliable are the predictions? — WORKING**
- **How:** **Method** (twelve sections), and the last line of every stay panel.
- **Answer given:** Stay panel: "Geometry only… Totals agree with NASA's long-term maps to a few percentage points on ordinary ground; times at grazing angles are approximate." The Benchmark section reports four outside checks: Apollo 11 Sun angle within 0.06° of the JPL-based published figure; all six Apollo landings within 0.7° of NASA's older table, whose own Sun position accounts for the rest; yearly Sun and Earth visibility at ten polar points within 3.1 and 2.3 percentage points of NASA's long-term maps on average; and eclipses consistent with published contact times and with NASA's list for all twelve eclipses from 2026 to 2030.
- **Evidence:** `index.html` method sheet; `data/benchmark-apollo.json`, `data/validation-illumination.json`, `data/eclipse-check.json`.
- **Limits:** No individual terrain-blocked sunrise, sunset or outage time has been checked against an outside source, and none carries an error bar. One of ten validation points (a knife-edge ridge) differs from NASA's pixel by 16 points.
- **Smallest fix:** Science: one published terrain-blocked event time to compare against, if it exists.

**10. Save, export or share — WORKING**
- **Answer given:** **Share** wrote `?site=apollo11&date=1969-07-20&hour=20&t=0.25` and showed "The address bar now holds a link to this view. Copy it from there to share." Comparison CSV exported with columns from site and coordinates to source.
- **Evidence:** `writeUrl`, `restoreFromUrl` (`src/main.js:935,947`), `tests/export.test.mjs`.
- **Limits:** No saved projects. Clipboard copy from a real click was not verified (the test browser refuses clipboard access).

### Audience 2: Educators

**11. Why the south pole? — WORKING.** Explainer "Why land near the south pole?" in the site list; future sites carry a "Why here" line (IM-4: "…high ground near the south pole, the kind of terrain crewed landings are being planned for."). Limit: short text.

**12. Why permanent shadow? — WORKING.** Explainer "Why do some craters never see the Sun?"; a pin on Shackleton's floor reads "Permanent shadow: Yes, NASA maps this spot as never sunlit", long-term "Sun 0%", and the app's own 30 days give 0% sunlit. A north-polar pin in Hermite A reads the same.

**13. Where is the Sun in the sky? — WORKING.** Apollo 11 at touchdown: Sun 10.7°, azimuth 88.8°, "Sunlit", disc 100%; "Sun: 11.3° clear of the terrain to the east." Limit: the chart is a flat strip.

**14. Can Earth be seen from everywhere? — WORKING.** Explainer "Can you see Earth from everywhere on the Moon?"; Earth view legend "poles: long-term · elsewhere: Earth up now · band: Earth rises and sets"; pin at 0°N 180°E: Earth −85.7°, "Earth stays out of view through Dec 16", 0% of 30 days. Limit: level-ground geometry outside the polar maps.

**15. Why do nearby places differ? — WORKING.** Blue Moon Pathfinder 1 point and Shackleton point, both at 89.5°S: 72.0 h against 0.0 h of sunlight in the same three days; IM-4's note names the blocking terrain; **Terrain off** changes IM-4 from 12.1 h to 72.0 h sunlit. Limit: the reason is on each site's card, not in the comparison.

**16. Advance time and watch shadows — WORKING.** 2.5 seconds of **Play** moved the clock from 12:00 Nov 15 to 08:00 Nov 16; the slider covers 720 hours in quarter-hour steps. Limit: one speed.

**17. Apollo 11 on July 20, 1969 — WORKING.** The site reads "Apollo landing site · July 20, 1969" with a button "See it at touchdown: Jul 20, 1969, 20:18 UTC". Pressing it set 1969-07-20, hour 20, clock 20:15: Sun 10.7° at azimuth 88.8°, Earth 59.2° up at 387,950 km, "Sunlit for the whole stay. Earth in view throughout." Published: 10.65° and 88.81° at 20:17:39. Limit: terrain there is the 1.9 km grid.

**18. Plan and compare own missions — WORKING.** Typing `-84.5, 30` offers "Go to -84.5, 30"; pins load full results, join the ranking, compare and share. Limit: pins cannot be renamed.

**19. Change the landing date — WORKING.** Date field, **Now**, day bars, **Use this date**, **Use this time**, and "go to it" for the next eclipse (opened 2027-02-18 with the clock on February 20, where Apollo 11 reads "Eclipse: Earth covers 34% of the Sun").

**20. Understand how the results arise — WORKING.** **How was this worked out?** at IM-4: "Where the Sun is. NASA/JPL Horizons puts it 2.7° above level ground, toward the east-northeast, at Nov 15, 12:00 UTC. How high the ground is that way. NASA's LOLA terrain reaches 7.9° in that direction, from ground 360 m away. Compare. 2.7° is below 7.9°, so the Sun is hidden… The app repeats this test every five minutes for 30 days." Limit: text, not a diagram; the method sheet has grown to about 12,000 characters.

### Audience 3: General public

**21. Explore like a maps app — WORKING.** Drag, zoom, right-click to pin, Explore / Landing / Satellite, a sheet on phones that stepped through 78, 325 and 620 px. Search: "Tycho" → Tycho (crater, 85 km) and satellites; "mare ser" → Mare Serenitatis. Labels: the whole-Moon view showed Mare Australe, Mare Tranquillitatis, Mare Fecunditatis; the Landing view at Apollo 15 showed Rimae Fresnel, Aristillus, Autolycus, Theaetetus, and loaded 81 NASA Moon Trek tiles. Limits: the globe image is 1.3 km per pixel; fine detail appears only in the Landing view within 78° of the equator and needs NASA's tile server; labels cannot be clicked.

**22. Historic human landing sites — WORKING.** Apollo 11, 12, 14, 15, 16 and 17, each with its full landing date, a touchdown button and links to QuickMap and Moon Trek.

**23. Terrain and horizon of a point — WORKING.** IM-4: +5,040 m, "9.5° over 160 m", "NASA LOLA · 80 m south-polar grid". North-polar pin: "25.8° over 160 m", "NASA LOLA · 80 m north-polar grid". Apollo 11: "0.9° regional, over 3.8 km", 1.9 km grid. Limit: coarse terrain between 80°S and 80°N.

**24. Could I see Earth at a date and time? — WORKING.** IM-4, Nov 15 12:00 UTC: Earth 1.5°, "Blocked by terrain", −1.4° above terrain, disc 0%, 403,806 km. Apollo 11 in 1969: 59.2°, "Earth in view".

**25. Where are the permanently shadowed regions? — WORKING.** Blue patches at both poles. Shackleton floor pin: "Yes". Hermite A pin (north): "Yes". Shackleton point: "No, nearest is 2.3 km away". Apollo 11: "Not mapped here, NASA's maps cover within 15° of each pole".

**26. Where is sunlight right now? — WORKING.** **Now** set 09:00 Nov 15; "Sun is directly overhead at 1.6°S 109.9°E"; "Earth is directly overhead at 2.9°N 3.1°W". Limit: snaps to the hour.

**27. Future missions and why — WORKING.** Five targets with year, operator, an "Approximate" note and a "Why here" line. Limit: positions are approximate; the year is all that has been announced.

**28. Where could I see an Earthrise? — WORKING.** The explainer names the band around the edge of the near side and the poles; the Earth view draws it; per site with terrain, IM-4 reads "1 d 3 h until Earthrise · Nov 16, 15:26 UTC". Limit: the band is level-ground geometry.

**29. How do conditions change between locations? — WORKING.** Ranking of all 18 for Nov 15, 3 d: Blue Ghost M1, Chandrayaan-3 and Apollo 17 at 72.0 h of Sun and Earth together; Apollo 11 71.2 h; IM-2 Athena 65.8 h; SLIM 64.3 h; Apollo 16 52.8 h; Blue Moon Pathfinder 1 16.0 h; Apollo 15 12.9 h; IM-4 12.1 h; eight sites 0.0 h.

**30. A simple explanation of the trade-offs — WORKING.** IM-4: "Sunlit for about 12 of 72 hours. Earth in view for about 33 of 72 hours. Both at once for about 12 hours." Each stay panel ends with the geometry-only caution. Limit: one sentence per option; the app does not choose for you.

---

## 5. The five core NASA questions

| | Answers it today? | Defensible basis? | Clear to a newcomer? | Inspectable by an expert? | Reproducible? | Separates favorable from safe? |
|---|---|---|---|---|---|---|
| **WHERE** | Yes: ranking, four map layers, date-checked best spot | App's own calculation, plus NASA's long-term maps, checked against each other | Mostly; the layers need their legends read | Yes: method sheet, scripts, source hashes | Yes: share link, CSV | Yes: caution line; slope shown and preferred, not certified |
| **WHEN** | Best day and best hour within 30 days | Yes for what it computes | Yes | Yes | Yes | Yes |
| **SUNLIGHT** | Windows, totals, disc times, longest dark, eclipses | JPL plus LOLA skyline plus Earth's disc; four outside checks | Yes: countdown and sentence | Yes | Yes | Yes: "not usable power" |
| **EARTH** | Outages with start, end, length; Earthrise band | Same model; Earth's centre for totals | Yes | Yes | Yes | Yes: "not a working radio link" |
| **COMPARE** | Four options, deltas, tags, CSV | Yes | Yes | Yes | Yes | Yes |

**Scientific correctness versus presentation.** Sun and Earth directions are as good as JPL Horizons. Year-long totals agree with NASA's long-term maps to about 3 percentage points on average. What is still ahead of the evidence: event times shown to the minute with no uncertainty beside them, and results on sharp ridges.

---

## 6. Scientific integrity review

- **Coordinate conventions.** Planetocentric latitude, east-positive longitude, 1,737.4 km sphere throughout. Polar map orientation is unit-tested for both poles and was confirmed against NASA's Earth-visibility maps and, for the north terrain grid, against the global grid (61 m RMS against 1,160 m the other way).
- **Lunar reference frames.** JPL Horizons reports `MEAN_ME (high precision)` for surface sites, the same mean-Earth frame as the LOLA products and Apollo coordinates. The global and polar LOLA products are different releases of it; small offsets remain possible.
- **Time.** UTC as returned by Horizons. NASA's eclipse list is in Terrestrial Dynamical Time, about 70 s ahead of UTC; it is used only to point to a date. The Earth-picture orientation uses a fixed TT−UTC of 69.184 s, about 30 s off in 1969, which affects only how the Earth image is turned.
- **Ephemerides.** Live Horizons, apparent and airless, at DEM height plus 2 m. Hourly samples are interpolated linearly for the Sun and Earth tiles; eclipse geometry interpolates direction vectors, which holds near the zenith.
- **Terrain and horizon.** 0.25° azimuth steps to 300 km. Narrow ridges between rays and features below the grid size can be missed. The observer is 2 m above the surface.
- **Illumination and shadow.** Site numbers use the fine skyline; the drawn shadow layer is coarser, so picture and numbers can disagree at edges.
- **Eclipses.** Two round discs from the site's own JPL positions. Checked against the published contact times of both 2026 eclipses and against NASA's list for all twelve eclipses from 2026 to 2030 (each site's mid-eclipse within 14 minutes of NASA's time of greatest eclipse). Earth's atmosphere, which enlarges the real shadow by about 2%, is ignored.
- **Earth visibility.** Line of sight to Earth's centre for hours; disc share reported separately. No ground stations, antennas or relays.
- **Long-term maps.** NASA's values count any part of the disc as visible and are averaged to 480 m. The validation script asks the app for the same quantity over 347 days: Sun mean absolute difference 3.1 percentage points (largest 15.8, on a knife-edge ridge where NASA's neighbouring pixels span 51% to 85%); Earth 2.3 (largest 4.5).
- **Slope.** A 160 m baseline from 80 m grids, reduced to 320 m cells. Not a hazard measure.
- **Imagery.** The Landing view's fine detail comes from a mosaic photographed under its own lighting; only its fine texture is used. It can show shadows that do not match the chosen date.
- **Dates.** 1950 to 2099 accepted; exercised for 1969–1972 and 2026–2030.
- **Caching and placeholders.** Results are cached in memory by site, date and height. Nothing is precomputed except NASA's maps and the slope map. If JPL or terrain is unavailable the app shows an error rather than a substitute.
- **Site positions.** Future targets are feature centres or candidate points, flagged "Approximate" in the card, ranking and CSV. Landing dates for past missions come from NASA's Apollo table and each mission's published arrival time.
- **Place names.** Features are circles from a centre and a diameter; seas and mountains are named only well inside the circle, and linear features never.

---

## 7. Three people, first five minutes

**Mission planner.** Opens the ranking, opens IM-4, reads the blocking note and outage list, presses **Use this time**, adds two delays, exports CSV, turns on the slope layer, opens Method. Understands at once: the totals, the timeline bands, the terrain source per site. Likely confusion: long-term percentages beside 30-day ones; why the best spot is "best of six"; no uncertainty beside times. Detail level: about right; the method sheet is now long.

**13-year-old.** Spins the Moon, reads the names, taps Apollo 11, presses **See it at touchdown**, presses Play, drops a pin, cycles the map layers. Understands at once: gold is Sun, blue is Earth, the countdown, the touchdown button. Likely confusion: "above terrain" versus "elevation"; five map layers on one button with no menu; the strip-shaped sky chart.

**Curious adult.** Sees a labelled Moon and a clock, taps a site, reads one sentence. Understands at once: sunlit or not, Earth in view or not. Likely confusion: what the column of icon buttons does; what "3 d" means; how much text sits below the tiles.

**Improvements that help all three:** a small menu with names for the map layers instead of one button to press repeatedly; labels on the icon buttons at first use; a shorter method sheet with the detail moved to the README.

---

## 8. Prioritized improvements

1. **An outside check of one terrain-blocked event time**, and an uncertainty note beside times.
2. **A named menu for the map layers** and labels on the icon buttons.
3. **Rank every cell of an area for a chosen date**, rather than six candidates.
4. **Finer terrain between 80°S and 80°N.**
5. **Test on Safari and on phones**, including the draggable sheet that was fixed after a report from a real phone.
6. **Shorten the method sheet.**

---

## What could not be verified

- Safari and a real phone.
- Copying a share link to the clipboard from a real click.
- The Landing view when NASA's tile server is slow or unavailable (by design it keeps the 8K image).
- Eclipses after 2030 and dates outside 1969–1972 and 2026–2030.
- Behaviour with many real visitors; one load test from one laptop passed earlier.

## Found during this run

- A pin opened from a share link read "Custom lunar coordinates" even when it sat inside a named feature, because the link was read before the list of names had loaded. Fixed during this run: such pins are now described once the names arrive.
- The test browser's pane was hidden for part of the run, and the map does not redraw while hidden, so map labels had to be re-checked with a screenshot. This affects testing, not visitors.
