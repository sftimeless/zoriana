# Zoriana — 90-question product and scientific audit (second run)

**Date:** November 15, 2026 (UTC). **Product tested:** the live site, https://zoriana.fly.dev/, version 1.0.0. The first run, made the same day at commit `2b6e535`, is in this file's history. Between the two runs all ten fixes it proposed were made and deployed; this run re-tests against them.

**Naming.** The brief calls the product "Luna Maps by Zoriana". That name appears nowhere in the app, the site or the documents; the app's title is "Zoriana — Lunar Landing Site Navigator".

**How it was tested.**

- **[UI]** The live site in the desktop app's built-in Chromium browser at 1440 × 900, by real clicks and by reading the page. Example unless stated otherwise: landing 2026-11-15 12:00 UTC, 3-day stay, terrain on.
- **[SIM]** Safari on a simulated iPhone 17 Pro (iOS 26.5), by touch, on the live site and the local build.
- **[API]** Direct requests to the app's `/api/ephemeris` endpoint and to JPL Horizons.
- **[AUDIT]** The convergence check, now in the repository as `scripts/check-convergence.mjs`.
- **[CODE]** and **[DOC]** Read from the repository; cited where used.

Every row whose status or wording changed was exercised again on the live site in this run. Rows that did not change were spot-checked through the same pages (site card, comparison, ranking, search, date change, map controls) and keep their first-run evidence.

**Status key.** WORKING: implemented, exercised, and the result is supported. PARTIAL: part of the question is answered, or the answer exists but is hard to find. NOT IMPLEMENTED: the function does not exist. A sub-claim that could not be tested is marked in its row.

**Scope key.** CORE: the challenge's firm requirement and the things its text says the tool should let people do. ENABLER: needed for a core result to be found, trusted or reproduced. OPTIONAL: beyond the challenge.

**Not tested:** a real phone, desktop Safari, Android, a projector, a screen reader, keyboard-only use, copying to the clipboard (the test browser blocks it), downloading a CSV, and the app's behavior while JPL is unavailable. The walkthroughs are expert reviews. No user research was done.

---

## What changed since the first run

| # | Fix proposed | Its acceptance test | Result on the live site |
|---|---|---|---|
| 1 | One clock, at the landing time, with the year | A link with `hour=20` opens at 20:00 with the year visible | Met: "20:00 · Jul 20, 1969 · UTC · past", "T+0 h · landing", Sun 10.6° |
| 2 | Named pins, finer coordinates | Two pins 1 km apart show different names and coordinates | Met: "Pin A · 89.450°S 137.310°W", "Pin B · 89.417°S 137.310°W" |
| 3 | 48 h stay; outages and overlaps listed | A 48 h stay lists each Sun outage and each "both" window | Met: "No sunlight: Nov 15 12:00 to Nov 17 11:54 (1 d 23 h)"; "Sun and Earth together: …" |
| 4 | Stale statements; conventions | One table names frame, longitude sign, radius, DE441, UT | Met: table in `METHOD.md`, "Conventions" in the sheet; the two stale lines corrected |
| 5 | Version, recipe, convergence test | API and CSV include a version; a script reproduces the check | Met: `version` 1.0.0 and a `request` block in every answer; `scripts/check-convergence.mjs`. CSV read in code, not downloaded |
| 6 | Coordinates in and out | The card's own coordinate text pastes into search and works | Met for search ("84.6000° S 31.0000° E" gives "Go to -84.6000, 31.0000"). Copy not confirmed: the test browser blocks the clipboard |
| 7 | Photograph or calculation; past or future | A label names what is drawn; the date says past, today or future | Met on desktop. The map label is not shown on phones; the stay line carries past or future on both |
| 8 | Shorter card; legend; units | On a phone the first screen shows name, sentence and countdown | Met: name, one-sentence answer and the countdown's first line fit; numbers start folded on phones |
| 9 | Touch targets; pin by touch | Controls at least 44 px; long-press drops a pin | Mostly met: stay buttons 50 × 44, toggles 44 high; map tool buttons are 40 high with a 52-wide touch strip so the column clears the sheet; press and hold drops a pin |
| 10 | Minimum unbroken window; thresholds | "At least 6 h of Earth from landing" returns arrival times | Met: "Land between Nov 16 15:26 and Dec 1 01:38 (14 d 10 h); or between Dec 13 16:11 and Dec 15 06:00"; ranking minimums left 9 of 18 |

Also added on the way: a "+12 h" step in the comparison; each option's elevation on its comparison card; the share of skyline samples read from each terrain grid; three explainers (how to read the app, dark patches, why the Moon is slow) and "Show me" buttons on three of them.

---

## A. Executive assessment

**Does it balance simplicity and scientific depth?** Yes, more clearly than in the first run. A site now opens with one sentence ("Nov 15, 12:00 UTC: the Sun is up but terrain hides it, and Earth is up but terrain hides it. Over the 3 d stay: Sunlit for about 24 of 72 hours…") and a countdown. The numbers sit one button away, and on phones they start folded. The scientific side gained a version stamp, the exact JPL request in every answer, a conventions table and a repeatable convergence check. Of the 90 questions, 72 work, 17 are partial and 1 is not implemented (first run: 45, 42 and 3). No question exposed a wrong core result in either run.

**Most serious usability obstacle now: comparison is still numbers only.** Two options can be compared by hours, Sun height, slope and elevation, but their sky charts cannot be seen side by side, the chart's height scale changes from site to site, and two dates at one site cannot be shown as two pictures (E13, E27, P14). The first run's obstacle, the two clocks, is resolved.

**Most serious scientifically supported limitation: single event times at grazing angles (unchanged).** Totals are well supported: within 3 percentage points of NASA's long-term maps on average across a year at ten polar points, and independent of the time step. Individual rise and set times near the poles carry a "±" of hours; the one comparison with a real lander's sunset is 1.1 to 2.2 hours off and unexplained; the worst validation point is 15.8 points from NASA's map. The app states all three.

**Verified scientific errors: none.** The two stale statements in `METHOD.md` found in the first run are corrected.

---

## B. Ninety-question acceptance matrix

### Totals

| Audience | Level | Working | Partial | Not implemented | First run (W / P / N) |
|---|---|---|---|---|---|
| Mission planners | Easy | 7 | 3 | 0 | 6 / 4 / 0 |
| Mission planners | Likely | 9 | 1 | 0 | 4 / 5 / 1 |
| Mission planners | Difficult | 8 | 2 | 0 | 6 / 4 / 0 |
| **Mission planners** | **all 30** | **24** | **6** | **0** | 16 / 13 / 1 |
| Educators | Easy | 9 | 1 | 0 | 6 / 4 / 0 |
| Educators | Likely | 7 | 2 | 1 | 4 / 5 / 1 |
| Educators | Difficult | 5 | 5 | 0 | 3 / 7 / 0 |
| **Educators** | **all 30** | **21** | **8** | **1** | 13 / 16 / 1 |
| General public | Easy | 9 | 1 | 0 | 7 / 3 / 0 |
| General public | Likely | 8 | 2 | 0 | 5 / 5 / 0 |
| General public | Difficult | 10 | 0 | 0 | 4 / 5 / 1 |
| **General public** | **all 30** | **27** | **3** | **0** | 16 / 13 / 1 |
| **All** | **90** | **72** | **17** | **1** | 45 / 42 / 3 |

| Scope | Questions | Working | Partial | Not implemented | First run (W / P / N) |
|---|---|---|---|---|---|
| Core challenge | 30 | 29 | 1 | 0 | 26 / 4 / 0 |
| Core enabler | 35 | 27 | 8 | 0 | 15 / 20 / 0 |
| Optional extension | 25 | 16 | 8 | 1 | 4 / 18 / 3 |

Core-challenge questions not fully working: P14.

Still partial (17): M06, M08, M10, M16, M26, M27, E04, E12, E13, E22, E23, E26, E27, E28, P10, P14, P19. Not implemented: E18.

Moved to working since the first run (27): M05, M11, M12, M15, M18, M19, M21, M29, E03, E05, E10, E14, E16, E20, E25, E30, P02, P07, P11, P17, P20, P21, P23, P24, P25, P27, P29. No row moved down.

### Mission planners

| ID | Status | Scope | Workflow and verified result | Issue | Smallest improvement |
|---|---|---|---|---|---|
| M01 | WORKING | ENABLER | Right-click the Moon (or press and hold on a phone). Card read "Pin A · 6.4810° S 33.1633° E"; elevation and grid lower down; the comparison card now prints "elevation +1,955 m". [UI] | On the site card, elevation is still near the bottom. Four decimals imply more precision than a 474 m grid supports. | Show elevation beside the coordinates. |
| M02 | WORKING | CORE | Select a site. Sun tile at IM-4: "3.3° · Blocked by terrain · Above terrain −4.1° · Disk showing 0%". [UI] | Sound: JPL angle against LOLA skyline. "Above terrain" is clear once learned. | None needed. |
| M03 | WORKING | CORE | Earth tile, same instant: "2.1° · Earth partly hidden · 2% showing · Above terrain −0.8°". [UI] | Sound. The status counts the center; the disk share is shown beside it. | None needed. |
| M04 | WORKING | CORE | Tile "Azimuth 77.5°" (tooltip: clockwise from north); sentence "to the east-northeast"; gold line on the globe; Sun dot on the sky chart. [UI] | None. | None needed. |
| M05 | WORKING (was partial) | CORE | Clock reads "12:00 · Nov 15, 2026 · UTC · past" with "T+0 h · landing". A link for hour 20 on 1969-07-20 opens at "20:00 · Jul 20, 1969". The sheet says times are UTC (JPL’s UT). [UI] | The answer sentence gives the date without the year ("Jul 20, 20:00 UTC"). | Add the year to that sentence when it is not the current year. |
| M06 | PARTIAL | ENABLER | Right-click nearby, or type coordinates in any common form ("89.5S 45E", "84.6000° S 31.0000° E", "-89.45 222.69"): a new pin with the same date, hour, stay and comparison. [UI] | Still no drag or nudge; moving a pin means making another one, with the next letter. | A small "move pin" nudge. |
| M07 | WORKING | CORE | Compare on Pin A, drop Pin B, Compare: both stay on the map and in the panel, named and with coordinates to three decimals. [UI] | Letters follow the order pins first appear, so a shared link can letter them differently. | None needed. |
| M08 | PARTIAL | ENABLER | Label above the map: "Calculated sunlight and shadows · JPL Sun, LOLA terrain", or "NASA imagery · no lighting added" with the Sunlight button off; a note appears on each switch; permanent shadow is blue; an explainer covers it. [UI] | The label is not shown on phones. On the map itself, calculated shade and dark rock still look alike until toggled. | Show the label on phones too. |
| M09 | WORKING | CORE | Changed 2026-11-15 to 2027-02-01: countdown, tiles, stay totals, lunar-day chart, timeline labels and link all changed together. [UI] | Comparison options keep their own dates (by design). | None needed. |
| M10 | PARTIAL | OPTIONAL | Select the coordinates: the app offers "-84.6000, 31.0000 (latitude, east longitude, in degrees)", which search reads back. [UI] | The test browser blocks the clipboard, so the copy itself was not confirmed; the note with the same text appeared instead. | Confirm in an ordinary browser. |
| M11 | WORKING (was partial) | CORE | Stay choices are 24 h, 48 h, 3 d, 7 d. IM-4, 48 h: "No sunlight: Nov 15 12:00 to Nov 17 11:54 (1 d 23 h)". [UI] | Lists show the first four stretches, then "and N more". | None needed. |
| M12 | WORKING (was partial) | ENABLER | "Find landing times with at least 6 h of Earth in view" at IM-4: "Land between Nov 16 15:26 and Dec 1 01:38 (14 d 10 h); or between Dec 13 16:11 and Dec 15 06:00", with "Use Nov 16 16:00". [UI] | Counts the center of Earth; looks 30 days ahead; a stretch still going at day 30 is cut there (stated). | None needed. |
| M13 | WORKING | CORE | Pin A and Pin B 1 km apart on the Shackleton ridge: 72.0 h sunlit, 28.0 h Earth against 17.1 h and 0.0 h; slope 2.7° against 9.7°; elevation +1,955 m against +1,907 m. [UI] | Resolved by the 40 m grid near the pole; at mid-latitudes (474 m) a 1 km move is two cells. | None needed. |
| M14 | WORKING | CORE | Banner: "17 h 54 m until sunrise · Nov 17, 11:54 UTC ± 48 min" and "Earthset in 14 d 13 h · Dec 1, 07:38 UTC ± 2 h". [UI] | Sound, with stated sensitivity. | None needed. |
| M15 | WORKING (was partial) | CORE | "Sun and Earth together: Nov 17 11:54 to Nov 18 12:00 (1 d 0 h)" under the totals. [UI] | None. | None needed. |
| M16 | PARTIAL | ENABLER | Ranking orders the listed sites and can be limited to a minimum; each site’s finder gives arrival times for an unbroken stretch of Sun and Earth together. [UI] | Still no single search over sites and times together; pins are not ranked. | Run the finder across the ranked sites. |
| M17 | WORKING | CORE | A "+12 h" Delay button: Pin A at 12:00 Nov 15 against 00:00 Nov 16 gives Earth 28.0 h to 40.0 h (+12.0). [UI] | None. | None needed. |
| M18 | WORKING (was not implemented) | OPTIONAL | Ranking: "Only sites with at least 24 h sunlit and 40 h of Earth" left 9 of 18. [UI] | Totals over the stay, not unbroken hours; listed sites only. | None needed. |
| M19 | WORKING (was partial) | ENABLER | "At touchdown: no sunlight, Earth out of view, so no direct line home at first." [UI] | None. | None needed. |
| M20 | WORKING | ENABLER | Baseline stays first; Delay adds variants beside it; Open returns to any option; the link stores all of them. [UI] | Stay length and terrain on/off apply to every option at once. Four options at most. | None needed for the challenge. |
| M21 | WORKING (was partial) | ENABLER | Sheet entry "Conventions"; METHOD.md has a conventions table (time, latitude, longitude, frame, radius, observer, ephemeris, angles, projections). [UI][DOC] | None. | None needed. |
| M22 | WORKING | CORE | Every answer now carries a "request" block: observer table, center coord@301, site coordinates and height, airless, 1 h, UT, ephemeris DE441 (read from JPL’s reply). [API] | None. | None needed. |
| M23 | WORKING | CORE | Rays every 0.25° to 300 km on a curved Moon, bilinear sampling, grid tiers 40 m / 80 m / 474 m / 1.9 km; the API returns all 1,440 skyline angles and distances. [API][CODE terrain-worker.mjs] | Limits are written down. Angular step is fixed. | None needed. |
| M24 | WORKING | ENABLER | Totals count the center; the card adds "full Sun 22.0 h, at least part of it 26.2 h" and "first light Nov 17, 09:50 UTC, then full disk 14:05". [UI] | Sound and stated. The headline number is the center rule. | None needed. |
| M25 | WORKING | ENABLER | "Earth partly hidden · 2% showing"; Earth hours count the center. [UI] | Sound and stated. | None needed. |
| M26 | PARTIAL | ENABLER | ± beside each time for a 0.1° skyline change. Audit run: coarsening the skyline from 0.25° to 2° moved Earthrise at IM-4 by 20 min. [UI][AUDIT] | No sensitivity to position error or grid resolution in the app. Against NASA maps the worst point is 15.8 points off. | Add a "what if the pin is 100 m off" check for polar sites. |
| M27 | PARTIAL | ENABLER | "scripts/check-convergence.mjs" is in the repository: totals identical to 0.01 h for 15, 5, 2 and 1 min steps at three sites; interpolation within 0.00003° of JPL. [DOC][AUDIT] | The skyline can only be thinned, not refined below 0.25°, so angular convergence is a trend, not a limit. | A finer skyline option on the server. |
| M28 | WORKING | ENABLER | Terrain row: "Skyline samples: 24% from the 40 m grid, 71% from the 80 m grid, 5% from the 1.9 km grid". [UI] | None. | None needed. |
| M29 | WORKING (was partial) | ENABLER | Answers carry "version" (1.0.0) and the JPL request; METHOD.md has "Reproduce a result"; the CSV adds the version and the three window columns. [API][DOC][CODE] | The CSV was read in code, not downloaded in this run. | None needed. |
| M30 | WORKING | CORE | Every stay panel: "Geometry only. Sunlight is not usable power, Earth in view is not a working radio link, and nothing here assesses landing safety." [UI] | No power or link model is offered, and none is claimed. | None needed. |

### Educators

| ID | Status | Scope | Workflow and verified result | Issue | Smallest improvement |
|---|---|---|---|---|---|
| E01 | WORKING | ENABLER | Filter "South Pole", or search "south pole": "Shackleton region · Near the lunar south pole". [UI] | None. | None needed. |
| E02 | WORKING | CORE | Sunlight layer shades the night side and terrain shadows; label "Terrain shadows · NASA LOLA". [UI] | No on-map words that dark means night or shadow. | As M08. |
| E03 | WORKING (was partial) | ENABLER | Under the sky chart: "The line across the chart is this site’s horizon: where its ground meets the sky…". Also in "How to read this app". [UI] | None. | None needed. |
| E04 | PARTIAL | OPTIONAL | Measured at 1440 × 900: labels 11 px, notes 12.5 px, stay buttons 12.5 px; headline values 24 px. [UI] | Small labels will be hard to read on a projector. Not tried on one. | A large-text mode, or honor browser zoom in the layout. |
| E05 | WORKING (was partial) | OPTIONAL | "Hide the numbers" folds azimuth, disk share, distances and data rows; phones start folded ("Show the numbers: angles, distances, data sources"). [UI][SIM] | The caution line and plain sentences always stay, by design. | None needed. |
| E06 | WORKING | CORE | Slider and Play move the clock, the tiles, the sky chart, the Sun and Earth lines and the shadows. Play moved 30 h to 50 h in 2.5 s. [UI] | None. | None needed. |
| E07 | WORKING | ENABLER | Pick an earlier landing date; the site stays selected. [UI] | The slider only runs forward from landing (0 to 720 h). | A "one day back" step next to the date. |
| E08 | WORKING | ENABLER | "Blocked by terrain … hidden by terrain 360 m away … which rises to 7.4°" against "Below horizon" at night; explainer on permanent shadow. [UI] | None. | None needed. |
| E09 | WORKING | CORE | Gold is Sun, blue is Earth: lines labeled "Sun 1.8°" and "Earth 3.7°", two tiles, two chart dots. [UI] | None. | None needed. |
| E10 | WORKING (was partial) | ENABLER | "How to read this app", now first in the list, explains UTC, T+, "3 d", elevation and azimuth; the clock shows the year. [UI] | It starts closed. "147.8M km" is not glossed. | None needed. |
| E11 | WORKING | CORE | As M13: ridge 72.0 h sunlit, the point 1 km away 17.1 h. [UI] | None. | None needed. |
| E12 | PARTIAL | OPTIONAL | The shadow layer moved between Nov 24 and Nov 29 at the south pole. [UI] | About 300 m cells at the poles and coarser elsewhere; the picture does not mark when a chosen point enters shadow (the countdown does). | A marker on the timeline when the selected point changes state. |
| E13 | PARTIAL | ENABLER | Two pins compared by hours, Sun height, slope and now elevation ("+1,955 m" against "+1,907 m"). [UI] | The two sky charts still cannot be seen together. | Show both sky charts. |
| E14 | WORKING (was partial) | OPTIONAL | Explainer "Why does so little change in an hour?": a lunar day is 29.5 Earth days; the Sun moves its own width each hour. [UI] | None. | None needed. |
| E15 | WORKING | CORE | Globe, "Sky from the surface" chart and Landing view all show the same site and time. [UI] | None. | None needed. |
| E16 | WORKING (was partial) | OPTIONAL | Explainer "Is that dark patch a shadow?" separates dark rock, night and shadow, with a button that switches the calculated sunlight off and on. [UI] | None. | None needed. |
| E17 | WORKING | CORE | Shackleton point, Nov 20: Sun "Blocked by terrain", Earth "in view". Griffin point, Nov 15: 72.0 h sunlit, 0.0 h Earth. [UI] | None. | None needed. |
| E18 | NOT IMPLEMENTED | OPTIONAL | No note or prediction field. [UI] | Workaround: a shared link and the comparison. | A free-text note saved in the link. |
| E19 | WORKING | ENABLER | Share link carries site, date, hour, timeline position, stay, terrain, view, layers and comparison. [UI] | Clipboard from a real click not checked. | None needed. |
| E20 | WORKING (was partial) | OPTIONAL | The same explainer ends: "That is also why one photograph cannot choose a landing time." Date comparison shows it (Earth 28.0 h to 40.0 h). [UI] | None. | None needed. |
| E21 | WORKING | OPTIONAL | Explainer "Can you see Earth from everywhere on the Moon?"; Earth view layer; countdown to Earthrise. [UI] | None. | None needed. |
| E22 | PARTIAL | OPTIONAL | Any date 1950 to 2099; the new explainer says polar seasons move the Sun about 1.5° either way over a year. [UI] | Still 30 days at a time; no view across a year. | A 12-month strip of sunlit share for polar sites. |
| E23 | PARTIAL | OPTIONAL | The note names the one obstruction that decides it, with distance and height. [UI] | The chart does not separate near and far terrain (the API has distances). | Shade the skyline by distance. |
| E24 | WORKING | CORE | "How was this worked out?": "3.3° is below 7.4°, so the Sun is hidden." [UI] | None. | None needed. |
| E25 | WORKING (was partial) | ENABLER | METHOD.md "Reproduce a result" gives the request and the three steps; the script repeats the JPL comparison. [DOC][AUDIT] | No classroom worksheet. | None needed. |
| E26 | PARTIAL | OPTIONAL | The map label now says the shadows are calculated; METHOD.md says they are coarser than the site numbers. [UI][DOC] | The coarseness is still not said beside the map. | Add "approximate" to the label. |
| E27 | PARTIAL | OPTIONAL | Sky chart at any site. [UI] | Its height axis changes with the site (16° at IM-4, 66° at Apollo 11). | A fixed-scale switch. |
| E28 | PARTIAL | OPTIONAL | Terrain on/off shows real skyline against none. README gives a worked example (best pixel 90%, best cell 63%). [UI][DOC] | No way to switch grid resolution. | Let the API take a coarser grid for comparison. |
| E29 | WORKING | ENABLER | "± 48 min", "± 2 h" beside times, with a tooltip and a sentence in the sheet. [UI] | It is a sensitivity to 0.1° of skyline, not a statistical error. | None needed; keep the wording. |
| E30 | WORKING (was partial) | ENABLER | Sheet entry "Measured, modeled or drawn" sorts terrain and imagery, NASA’s models, the app’s calculations and the illustrative parts. [UI] | Not tagged row by row on the card. | None needed. |

### General public

| ID | Status | Scope | Workflow and verified result | Issue | Smallest improvement |
|---|---|---|---|---|---|
| P01 | WORKING | ENABLER | The Moon fills the screen; title "Zoriana — Lunar Landing Site Navigator"; "Pick a site. Pick a date. See your Sun and Earth windows." [UI] | The name "Luna Maps" appears nowhere in the app. | Decide the name; no code needed. |
| P02 | WORKING (was partial) | ENABLER | "New here? How to read this app" is first in the list: colors, solid and dashed lines, blue patches, pins, and the words used. [UI] | It starts closed. | None needed. |
| P03 | WORKING | CORE | Tap a marker; right-click; or press and hold on a phone: "Pin dropped…", then "Pin A · Custom lunar coordinates · in Mare Fecunditatis". [UI][SIM] | None. | None needed. |
| P04 | WORKING | ENABLER | Scroll or pinch, zoom buttons, "Whole Moon". [UI][SIM] | None. | None needed. |
| P05 | WORKING | ENABLER | "Whole Moon" button and the app icon. [UI] | None. | None needed. |
| P06 | WORKING | CORE | Date picker, "Now", lunar-day bars, Delay buttons. [UI] | None. | None needed. |
| P07 | WORKING (was partial) | ENABLER | Clock: "· past", "· now" or "· future", with the year; the stay line says "a stay in the future". [UI] | On phones the word beside the clock is hidden; the stay line still says it. | None needed. |
| P08 | WORKING | ENABLER | "Tycho" and "tranquil" found; no match gives "No matching place. Try latitude, longitude…". [UI] | Topics such as "far side" find nothing. | None needed. |
| P09 | WORKING | CORE | "Sun: up at 1.8° but hidden by terrain 1.9 km away to the northeast, which rises to 6.9°." [UI] | None. | None needed. |
| P10 | PARTIAL | ENABLER | In Safari on a simulated iPhone: stay buttons 50 × 44, terrain toggle 44 high, tool buttons 40 high with a wider touch strip; press and hold drops a pin; numbers start folded. [SIM][UI] | No real phone was used. Grabbing the sheet handle while its content is coasting still scrolls instead of collapsing. | Try on real phones. |
| P11 | WORKING (was partial) | OPTIONAL | A pin’s first sentence says sunlit, hidden by terrain or below the horizon; the dark-patch explainer covers dark rock. [UI] | None. | None needed. |
| P12 | WORKING | OPTIONAL | Earth view layer; Earth column in the ranking; countdown to Earthrise. [UI] | None. | None needed. |
| P13 | WORKING | CORE | Slider in quarter hours, or Play; the site stays selected. [UI] | None. | None needed. |
| P14 | PARTIAL | CORE | Same site on two dates in the comparison: numbers and bars side by side. [UI] | Not two pictures. | Optional: a before/after picture. |
| P15 | WORKING | OPTIONAL | Explainer "Why land near the south pole?" in the app. [UI] | None. | None needed. |
| P16 | WORKING | CORE | Map style "Landing" keeps the site and time (link "view=landing"). [UI] | None. | None needed. |
| P17 | WORKING (was partial) | OPTIONAL | Explainers now end in "Show me the south pole", "Show me the Earth view" and "Switch the calculated sunlight off and on"; "Show me the Earth view" turned the layer on. [UI] | Three starting points, not a guided tour. | None needed. |
| P18 | WORKING | ENABLER | Share copies a link that reopens site, date, time, view and layers. [UI] | Clipboard from a real click not checked. | None needed. |
| P19 | PARTIAL | ENABLER | Bad date: "Choose a valid date between 1950 and 2099."; unmapped areas say so. [UI] | The message for a JPL outage ("JPL unavailable for this option…") was read in code, not seen live. | None needed. |
| P20 | WORKING (was partial) | ENABLER | The card opens with one sentence and the countdown; on phones the numbers are folded until asked for. [UI][SIM] | None. | None needed. |
| P21 | WORKING (was partial) | OPTIONAL | Explainer: "a ridge can look bright in the picture while the calculation says it is in shadow now." [UI] | None. | None needed. |
| P22 | WORKING | OPTIONAL | Explainer: "Earth hangs almost still in its sky… a band about 8° wide… where Earth slowly rises and sets over a month." [UI] | None. | None needed. |
| P23 | WORKING (was partial) | OPTIONAL | Sheet: positions "hold for every date offered; what limits a prediction is the terrain grid, not how far ahead it is." [UI] | None. | None needed. |
| P24 | WORKING (was partial) | OPTIONAL | Earth explainer: "The far side is not the dark side… The night side is whichever half is turned away from the Sun." [UI] | None. | None needed. |
| P25 | WORKING (was partial) | ENABLER | Map label "Calculated sunlight and shadows · JPL Sun, LOLA terrain" or "NASA imagery · no lighting added"; sheet entry "Measured, modeled or drawn". [UI] | The label is hidden on phones; a note appears when switching. | As M08. |
| P26 | WORKING | CORE | Pin A and Pin B 1 km apart: 72.0 h against 17.1 h of sunlight; each pin’s note names what blocks it. [UI] | None. | None needed. |
| P27 | WORKING (was not implemented) | OPTIONAL | Explainer: "A photo you have seen elsewhere can differ from the app for the same reasons: another date, another viewing angle, or detail finer than the terrain data here." [UI] | A general explanation; no outside picture can be loaded. | None needed. |
| P28 | WORKING | CORE | "Earth: up at 2.1° but hidden by terrain 5.0 km away to the northwest, which rises to 2.9°"; "Terrain off" shows the smooth-Moon answer. [UI] | None. | None needed. |
| P29 | WORKING (was partial) | OPTIONAL | Explainer: "The same place can therefore be sunlit on one date and dark two weeks later with no weather involved." IM-4: 24.1 h of Sun from Nov 15, none from Feb 1. [UI] | None. | None needed. |
| P30 | WORKING | CORE | Tags "Most sunlight", "Longest Earth view"; the caution line; no site is called safe. [UI] | None. | None needed. |

---

## C. Fifteen deep-dive evaluations

### Mission planners

**M05 — What time am I analyzing, and in which standard? WORKING (was partial).**
- **Workflow:** open any site or link; read the timeline panel.
- **Output:** "12:00 · Nov 15, 2026 · UTC · past", "Mission time T+0 h · landing", "Landing date · UTC", "Hour 12:00". Opening with no date in the link shows the present hour ("· now").
- **Science:** JPL's table is in UT and uses DE441; the sheet now says "Times are UTC (JPL's UT)". The two differ by under a second.
- **Limitation:** the one-sentence answer prints its date without the year.

**M13 — Ridge against a point 1 km downslope. WORKING.**
- **Workflow:** drop a pin, press Compare, drop a second pin, press Compare.
- **Output:** "Pin A · 89.450°S 137.310°W": sunlit 72.0 h, Earth 28.0 h, slope 2.7° over 80 m, elevation +1,955 m. "Pin B · 89.417°S 137.310°W": 17.1 h (−54.9), 0.0 h (−28.0), slope 9.7°, elevation +1,907 m.
- **Science:** both use the 40 m south-pole grid, so 1 km is 25 cells. At mid-latitudes the grid is 474 m.
- **Limitation:** none for this question.

**M22 — Are the angles for the surface point? WORKING.**
- **Evidence:** every answer now carries the request made to JPL: observer table, center `coord@301`, site coordinates "31,-84.6,5.0416…" (east longitude, latitude, height in km), airless, hourly, UT, ephemeris DE441 as named in JPL's own reply. The convergence script sends the same request at 10-minute steps and finds the app's interpolation within 0.00003°.

**M27 — Do the windows converge as sampling is refined? PARTIAL.**
- **Workflow:** `node scripts/check-convergence.mjs` (writes `data/convergence-check.json`).

| Site | Time step 15, 5, 2, 1 min | Skyline every 0.5°, 1°, 2° instead of 0.25° |
|---|---|---|
| IM-4 point (80 m grid) | Sun 24.10 h, Earth 44.56 h at every step; next changes 11:54 and 15:26 at every step | Sun unchanged; Earth 44.50, 44.30, 44.22 h; Earthrise 15:29, 15:41, 15:46 |
| Blue Moon Pathfinder 1 point (40 m) | Sun 72.00 h, Earth 27.99 h at every step | unchanged |
| Apollo 11 (474 m) | Sun 343.66 h of 360 at every step; sunset Nov 29 19:39 | unchanged to 1°; 343.64 h and 19:38 at 2° |

- **Reading:** the answer does not depend on the time step. It depends weakly on the skyline's angular step.
- **Limitation:** 0.25° is the finest the server traces, so the angular test thins the skyline; it cannot refine it. That keeps this row partial.

**M29 — Can another researcher reproduce a result? WORKING (was partial).**
- **Workflow:** one request to `/api/ephemeris`; then the recipe in `METHOD.md`, "Reproduce a result".
- **Output:** `version` 1.0.0; the `request` block; 745 hourly rows each for the Sun and Earth; the 1,440-point skyline with distances; site height; grid; the share of samples from each grid ("24% from the 40 m grid, 71% from the 80 m grid, 5% from the 1.9 km grid" at IM-4); slope.
- **Also:** CSV exports now carry the version and three columns of time stretches (no sunlight, Earth out of view, both together).
- **Limitation:** the CSV was read in code, not downloaded, in this run.

### Educators

**E08 — Terrain shadow against lunar night. WORKING.**
- **Output:** "the Sun is up but terrain hides it" (status "Blocked by terrain", note "hidden by terrain 360 m away to the east-northeast (on Mons Mouton), which rises to 7.9°") against "the Sun is below the horizon" for the same site on February 1, 2027.

**E12 — Watching a shadow cross a crater. PARTIAL (unchanged).**
- **Output:** the drawn shadows move with the timeline; the label now reads "Calculated sunlight and shadows · JPL Sun, LOLA terrain".
- **Limitation:** the picture is a coarser calculation than the site numbers (about 300 m cells at the poles) and does not mark when one chosen point enters shadow; the countdown does.

**E24 — Predicting from elevation and skyline. WORKING.**
- **Output:** "Where the Sun is… 2.7° above level ground, toward the east-northeast… LOLA terrain reaches 7.9° in that direction, from ground 360 m away. Compare. 2.7° is below 7.9°, so the Sun is hidden." The chart caption now defines the horizon.

**E27 — Solar paths at different latitudes on one scale. PARTIAL (unchanged).**
- **Limitation:** the sky chart's height scale still follows the site (16° at IM-4, 66° at Apollo 11) and two charts cannot be shown together.

**E29 — Why a time has a range. WORKING.**
- **Output:** "Sunrise in 1 d 23 h · Nov 17, 11:54 UTC ± 48 min"; the sheet explains it is how far the time moves if the skyline is 0.1° off.

### General public

**P02 — What do the colors and symbols mean? WORKING (was partial).**
- **Workflow:** open "New here? How to read this app", the first item under the filters.
- **Output:** "Gold is always the Sun and blue is always Earth: the two lines from a site point toward them, solid when the site can see them and dashed when it cannot. Blue patches near the poles are ground that never gets sunlight…", then the words horizon, elevation, above terrain, azimuth, UTC, T+ and "3 d".
- **Limitation:** it starts closed.

**P03 — I tapped somewhere; where am I? WORKING.**
- **Output:** right-click, or press and hold on a phone: "Pin A · Custom lunar coordinates · in Mare Fecunditatis", then "this spot is sunlit, and Earth is in view."

**P10 — Is it comfortable on a phone? PARTIAL.**
- **Output (simulator):** stay buttons 50 × 44 px; terrain toggle 44 high; date field's label 44 high; tool buttons 40 high with a wider invisible touch strip; press and hold drops a pin; the card opens on the answer with numbers folded; "Now" stays on screen.
- **Limitation:** no real phone was used in this audit. Grabbing the sheet's handle while its content is still coasting scrolls instead of collapsing; a second drag works.

**P25 — Photograph, visualization or prediction? WORKING (was partial).**
- **Output:** label "Calculated sunlight and shadows · JPL Sun, LOLA terrain", or "NASA imagery · no lighting added"; switching shows "Showing NASA's imagery with no lighting added. Any shading left is in the photographs or is dark rock." The sheet sorts everything into measured, NASA's models, calculated here, and drawn for clarity.
- **Limitation:** the label is hidden on phones; the note on switching is not.

**P30 — Trade-offs without a safety claim. WORKING.**
- **Output:** comparison tags, plain sentences and, on every stay panel, "nothing here assesses landing safety".

---

## D. First-time experience (expert walkthroughs)

| | Mission planner | 13-year-old | Adult, no astronomy |
|---|---|---|---|
| Tries first | The list, then IM-4 | Spins the Moon, taps a marker | Reads the tagline, taps a marker |
| Finds the control? | Yes: list, Compare, Method, finder | Yes: markers, Play, "Show me" buttons | Yes: markers, "How to read" |
| May misunderstand | That the "±" is a sensitivity, not an error bar | Why two hours of Play change so little (an explainer now answers) | "Above terrain −5.2°" once numbers are shown |
| Time to a useful result | About 15 seconds to totals, outage times and a countdown | About 10 seconds to "this spot is sunlit" | About 10 seconds to the one-sentence answer |
| After a mistake | Close the card; options stay in the comparison | "Whole Moon" recovers the view | Same |
| Steps that could go | Re-dropping a pin to move it | Scrolling to the lower explainers | None obvious |
| Explained at the right level? | Yes, with depth on request | Yes | Yes |
| One change that helps most | Sky charts side by side in the comparison | A year-long view near the poles | Real-phone testing |

The times in the table are the auditor's estimates from doing each task, not measurements of real users.

**Hidden complexity.** None is required to get an answer: no coordinates, azimuth or ephemeris knowledge is needed, and the time model is now a single clock that starts at landing. Advanced users still meet two fixed limits: a skyline step that cannot be changed, and four stay lengths.

---

## E. Scientific credibility assessment

| Area | What is implemented | Evidence | Open point |
|---|---|---|---|
| Coordinates | Planetocentric latitude, east-positive longitude, 1,737.4 km radius, mean-Earth frame; input in several forms | Conventions table in `METHOD.md`; `tests/coords.test.mjs`; projection tests | Global and polar grids may differ slightly at their joins (stated). |
| Sun and Earth positions | JPL Horizons observer tables for the surface point and height, airless, DE441, hourly, interpolated | `request` block in every answer; convergence script (0.00003°); Apollo 11 within 0.06° | None found. |
| Terrain skyline | Rays every 0.25° to 300 km on a curved Moon; 40 m, 80 m, 474 m and 1.9 km grids; shares of each now reported | API; card; `tests/terrain.test.mjs` | Angular step fixed; features smaller than the grid are missed (stated). |
| Timing | Five-minute tests between hourly positions; crossings interpolated | `scripts/check-convergence.mjs`: identical to 0.01 h from 15 min to 1 min | None found. |
| Visibility rule | Center above skyline for totals and windows; disk share beside it; eclipses counted | Card; finder note; disk and eclipse tests | Headline numbers use the center rule (stated). |
| Coverage | Any point; grid and its share named per site; polar maps say where they stop | Live | None found. |
| Uncertainty | "±" on rise and set times for 0.1° of skyline | Live; `crossingSpread` | A sensitivity, not an error bar; no position or resolution term. |
| Reproducibility | Versioned answers and exports; JPL request; recipe; scripts; data hashes | This run rebuilt the windows from the API alone | CSV download not exercised. |

**Independent validation on record** (from the repository's scripts and result files):

- Apollo 11 touchdown Sun elevation within 0.06° of the published JPL-based figure. Opening the app at 20:00 UTC that day shows 10.6°; the published figure for 20:17:39 is 10.65°.
- Twelve Apollo Sun-angle cases against NASA's older table: within 0.7° in elevation, 2.57° in azimuth.
- Ten polar points over 347 days against NASA's long-term maps: Sun 3.1 percentage points apart on average (15.8 at worst), Earth 2.3 (4.5 at worst).
- Twelve eclipses, 2026 to 2030: mid-eclipse within 14 minutes of NASA's list.
- Blue Ghost Mission 1: end of totality on March 14, 2025 at 08:30 UTC, matching Firefly's photograph time. Sunset two days later: 1.1 to 2.2 hours later than Firefly's account.
- Convergence (new): time step and hourly interpolation, as in section C.

**Untested concerns, not errors:** the Blue Ghost sunset gap; knife-edge ridges; registration at the joins between grids; dates near 1950 and 2099; a polar sunrise or sunset time against an outside source.

---

## F. Interface simplification: done and remaining

| First-run friction | Now |
|---|---|
| Two clocks; timeline opened 12 h after landing | One clock at the landing time, with year and past/now/future |
| A long card to scroll for one sentence | The sentence and countdown come first; numbers fold away |
| Reading two bars to find overlap times | Outage and overlap times are listed; a finder gives arrival times |
| Explainers that said which button to press | Three of them have a "Show me" button |
| Retyping coordinates | Search reads the card's own format; the card offers the pair as text |
| **Remaining** | |
| Moving a pin means dropping another | A drag or nudge |
| Comparing skies means opening each option in turn | Sky charts side by side, on one scale |

The hierarchy now in place: (1) the one-sentence answer and countdown; (2) the blocker sentence and the listed times; (3) the numbers, behind one button on phones; (4) "How was this worked out?", the sheet, `METHOD.md`, the API and the scripts. The caution line stays at level 1.

---

## G. What is still worth doing

No P0 or P1 items remain: nothing found is a scientific defect or blocks a core workflow.

| # | Priority | User problem | Questions | Where | Size |
|---|---|---|---|---|---|
| 1 | P2 | No real-phone or desktop-Safari test; handle drag during coasting scrolls | P10 | testing; `src/main.js` sheet code | Small to medium |
| 2 | P2 | The map label is hidden on phones | M08, P25, E26 | `src/style.css` | Small |
| 3 | P2 | Sky charts cannot be compared; scale varies by site | E13, E27, P14 | sky chart, comparison | Medium |
| 4 | P2 | Copy to clipboard and CSV download not confirmed in an ordinary browser | M10, M29 | testing | Small |
| 5 | P3 | No drag or nudge for a pin | M06 | pin handling | Small |
| 6 | P3 | No joint search over sites and times; pins not ranked | M16 | ranking, finder | Medium |
| 7 | P3 | No sensitivity to position error; skyline cannot be refined below 0.25° | M26, M27 | server, `terrain-worker.mjs` | Medium |
| 8 | P3 | Small text on a projector | E04 | `src/style.css` | Small |
| 9 | P3 | No view across a year; no near/far shading of the skyline; no grid switch; no notes | E22, E23, E28, E18 | several | Medium each |
| 10 | P3 | The outage message for JPL has not been seen live | P19 | testing | Small |

---

## H. Three demonstration scenarios

Each uses only what was run in this audit.

**General public — an unfamiliar place and its lighting.**
1. Open the site. Press and hold the Moon on a phone, or right-click on a computer.
2. Read: "Pin A · Custom lunar coordinates · in Mare Fecunditatis", then "this spot is sunlit, and Earth is in view. Over the 3 d stay: Sunlit for the whole stay. Earth in view throughout."
3. Open "Is that dark patch a shadow?" and press "Switch the calculated sunlight off and on" to see the bare imagery.
- **Missing:** nothing needed for this walkthrough.

**Education — two nearby places over time.**
1. Type "-89.45, -137.31" in search, go, press Compare. Type "-89.417, -137.31", go, press Compare.
2. Read Pin A against Pin B: 72.0 h of sunlight against 17.1 h; Earth 28.0 h against none; slope 2.7° against 9.7°; elevation +1,955 m against +1,907 m.
3. Open Pin B: "this spot is sunlit, and Earth is below the horizon… Earth never in view, so no direct line to Earth."
4. Press "+12 h" on Pin A: Earth rises from 28.0 h to 40.0 h.
- **Missing:** the two sky charts cannot be seen together; there is nowhere to record a prediction.

**Science — two site-and-date options and the evidence.**
1. With Pin A at 12:00 Nov 15 and at 00:00 Nov 16 in the comparison, read the difference (+12.0 h of Earth).
2. Open "How was this worked out?" for the three numbers behind the current state, and the terrain row for the share of each grid.
3. In "Find landing times", ask for 24 h of Sun and Earth together: at IM-4 the app answers "Land between Nov 17 11:54 and Nov 28 15:32 (11 d 3 h)".
4. Request `/api/ephemeris?lat=-89.45&lon=-137.31&date=2026-11-15&reference=0`, read `version` and `request`, and follow "Reproduce a result" in `METHOD.md`; run `scripts/check-convergence.mjs`.
- **Missing:** the skyline cannot be recomputed at a finer step; the CSV download was not exercised here.

---

## I. Final verdict

1. **Can a first-time user understand it in about 30 seconds?** Yes. The Moon, the list, the line "Pick a site. Pick a date. See your Sun and Earth windows", and one clock. An expert judgment, not a measured one.
2. **Can someone with no astronomy background get a useful answer without training?** Yes. One tap gives "the Sun is up but terrain hides it, and Earth is up but terrain hides it", then the stay in a sentence and a countdown. On a phone the numbers stay out of the way until asked for.
3. **Can a student learn something real by experimenting?** Yes. Two pins 1 km apart differ by 55 hours of sunlight in three days, the app names the terrain responsible, and five explainers answer the questions that follow. Missing: side-by-side sky charts and a place for predictions.
4. **Can a scientist reproduce and evaluate the core results?** Yes for the calculation: versioned answers, the exact JPL request, a written recipe and a repeatable convergence check. The evidence for individual event times is still thin: one real lander, with one match and one unexplained gap.
5. **The three most important improvements now:**
   - Test on real phones and in desktop Safari, and show the "calculated or imagery" label on phones.
   - Let two skies be compared directly: side by side, on one scale.
   - Add more outside checks of single rise and set times, and a sensitivity to position error near the poles.

**Can one interface deliver all three experiences?** Yes. In this run the child's, the adult's and the teacher's experiences work from the same screen, and the scientist's no longer depends on reading the code. What remains is verification on real devices and deeper comparison tools, not missing core function.
