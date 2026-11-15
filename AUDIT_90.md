# Zoriana — 90-question product and scientific audit

**Date:** November 15, 2026 (UTC). **Product tested:** the live site, https://zoriana.fly.dev/, at commit `2b6e535`. **Nothing was edited, deployed or committed during this audit.** The only file written is this report.

**Naming.** The brief calls the product "Luna Maps by Zoriana". That name appears nowhere in the app, the site or the documents; the app's title is "Zoriana — Lunar Landing Site Navigator".

**How it was tested.**

- **[UI]** The live site in the desktop app's built-in Chromium browser at 1440 × 900, by real clicks and by reading the page. Example unless stated otherwise: landing 2026-11-15 12:00 UTC, 3-day stay, terrain on.
- **[SIM]** Safari on a simulated iPhone 17 Pro (iOS 26.5), by touch, earlier the same day.
- **[API]** Direct requests to the app's `/api/ephemeris` endpoint and to JPL Horizons.
- **[AUDIT]** A script written for this audit and kept outside the repository. It reruns the app's own functions with finer time steps and coarser skylines, and compares the app's hourly interpolation with JPL at 10-minute steps.
- **[CODE]** and **[DOC]** Read from the repository; cited where used.
- NASA's challenge page was read in full on the day.

**Status key.** WORKING: implemented, exercised in this audit, and the result is supported. PARTIAL: part of the question is answered, or the answer exists but is hard to find. NOT IMPLEMENTED: the function does not exist. A sub-claim that could not be tested is marked "not checked" in its row.

**Scope key.** CORE: the challenge's one firm requirement (Sun and Earth relative to the horizon at a chosen site and date) and the things its text lists as what the tool should let people do (compare sites and dates, time remaining, key metrics). ENABLER: needed for a core result to be found, trusted or reproduced. OPTIONAL: beyond the challenge.

**Not tested:** a real phone, desktop Safari, Android, a projector, a screen reader, keyboard-only use, copying to the clipboard from a real click, and the app's behaviour while JPL is unavailable. These walkthroughs are expert reviews. No user research was done.

---

## A. Executive assessment

**Does it balance simplicity and scientific depth?** Mostly yes. The first thing a visitor gets is a plain sentence ("Sunlit for about 24 of 72 hours. Earth in view for about 45 of 72 hours."). The same card then gives angles, clearances, disc shares, the grid used and a three-step "How was this worked out?". One request to the API returns every number behind a result, including the full 1,440-point skyline. Of the 90 questions, 45 work, 42 are partial and 3 are not implemented. No question exposed a wrong core result.

**Most serious usability obstacle: there are two times on screen and the app opens on the less obvious one.** The landing time and the moment being shown are different things. The timeline starts 12 hours after landing, so a link for landing hour 20:00 opens with the clock reading 08:00 the next day, and the Sun angle shown is for that later moment. The large clock has no year. The auditor misread this twice during testing. It affects M05, P07, E10 and every first reading of a shared link.

**Most serious scientifically supported limitation: single event times at grazing angles.** Totals are well supported: across a year at ten polar points the app is within 3 percentage points of NASA's long-term maps on average. Individual rise and set times are less so. Near the poles the app's own "±" reaches hours. The one comparison with a real lander's sunset (Blue Ghost, March 16, 2025) is 1.1 to 2.2 hours later than the lander's account, unexplained. The worst validation point is 15.8 points from NASA's map, on a sharp ridge. The app states all three.

**Verified scientific errors found in this audit: none.** Two statements in `METHOD.md` are out of date (see section E).

---

## B. Ninety-question acceptance matrix

### Totals

| Audience | Level | Working | Partial | Not implemented |
|---|---|---|---|---|
| Mission planners | Easy | 6 | 4 | 0 |
| Mission planners | Likely | 4 | 5 | 1 |
| Mission planners | Difficult | 6 | 4 | 0 |
| **Mission planners** | **all 30** | **16** | **13** | **1** |
| Educators | Easy | 6 | 4 | 0 |
| Educators | Likely | 4 | 5 | 1 |
| Educators | Difficult | 3 | 7 | 0 |
| **Educators** | **all 30** | **13** | **16** | **1** |
| General public | Easy | 7 | 3 | 0 |
| General public | Likely | 5 | 5 | 0 |
| General public | Difficult | 4 | 5 | 1 |
| **General public** | **all 30** | **16** | **13** | **1** |
| **All** | **90** | **45** | **42** | **3** |

| Scope | Questions | Working | Partial | Not implemented |
|---|---|---|---|---|
| Core challenge | 30 | 26 | 4 | 0 |
| Core enabler | 35 | 15 | 20 | 0 |
| Optional extension | 25 | 4 | 18 | 3 |

Core-challenge questions not fully working: M05, M11, M15, P14. Every one is a partial; none is missing.

### Mission planners

| ID | Status | Scope | Workflow and verified result | Issue | Smallest improvement |
|---|---|---|---|---|---|
| M01 | WORKING | ENABLER | Right-click the Moon (or Drop a pin). Card read "10.2339° S 45.7843° E", "Surface elevation −2,897 m", "NASA LOLA · 474 m global grid". [UI] | Elevation sits near the bottom of a long card. Four decimals (about 3 m) imply more precision than a 474 m grid supports. | Show elevation beside the coordinates; round to the grid. |
| M02 | WORKING | CORE | Select a site. Sun tile at IM-4: "3.3° · Blocked by terrain · Above terrain −4.1° · Disc showing 0%". [UI] | Sound: JPL angle against LOLA skyline. "Above terrain" is clear once learned. | None needed. |
| M03 | WORKING | CORE | Earth tile, same instant: "2.1° · Earth partly hidden · 2% showing · Above terrain −0.8°". [UI] | Sound. The status counts the centre; the disc share is shown beside it. | None needed. |
| M04 | WORKING | CORE | Tile "Azimuth 71.5°"; sentence "to the east-northeast"; gold line on the globe; Sun dot on the sky chart (N E S W N). [UI] | The tile does not say azimuth runs clockwise from north. | Add "from north, clockwise" to the azimuth label tooltip. |
| M05 | PARTIAL | CORE | Clock shows "18:00 · Nov 16 · UTC", "Mission time T+1 d 6 h", plus "Landing date · UTC" and Hour. [UI] | Two times on screen: landing time and the moment being shown. The timeline opens 12 h after landing, so a link with hour 20 shows 08:00 next day. The big clock has no year. JPL returns UT; the app says UTC (under 1 s apart). | Open the timeline at landing (T+0); show the year; one line "Showing 12 h after landing". |
| M06 | PARTIAL | ENABLER | Right-click nearby or type "-89.5, 45": new pin, same date, hour, stay and comparison (verified). [UI] | No drag or nudge. "89.5S 45E" is rejected although the card prints coordinates that way. | Accept N/S/E/W input; add a small "move pin" nudge. |
| M07 | WORKING | CORE | Compare on pin 1, drop pin 2, Compare: both stay on the map and in the panel (up to four). [UI] | Both are called "Dropped pin"; the panel prints coordinates to 0.1°. | Name pins A, B, C and print three decimals. |
| M08 | PARTIAL | ENABLER | Sunlight button switches "Terrain shadows · NASA LOLA" to "NASA / LRO · imagery"; Satellite style is unlit; permanent shadow is blue. [UI] | Needs a toggle; nothing on the map says "dark here is calculated shadow". The mosaic has its own baked lighting. | A small chip naming what is drawn: "Calculated sunlight" or "NASA imagery, unlit". |
| M09 | WORKING | CORE | Changed 2026-11-15 to 2027-02-01: countdown, tiles, stay totals, lunar-day chart, timeline labels and link all changed together. [UI] | Comparison options keep their own dates (by design). | None needed. |
| M10 | PARTIAL | OPTIONAL | No copy button. Share copies a link holding "site=-10.2339,45.7843"; CSV has latitude_deg and longitude_deg_east. [UI][CODE src/main.js:939] | The convention (east-positive, decimal degrees) is only explicit in the CSV header. | Tap the coordinates to copy "lat, east lon" with the convention named. |
| M11 | PARTIAL | CORE | Stay choices are 24 h, 3 d, 7 d. Countdown gives the next sunset or sunrise with ±; timeline shows Sun and Earth bars; "Longest darkness" is listed. [UI] | No 48 h stay. Earth outages are listed with times; sunlight interruptions are not. | Custom stay length; list Sun outages the way Earth outages are listed. |
| M12 | PARTIAL | ENABLER | "Best landing time" finds the hour with most Sun and Earth together; Earth outages are listed with start and end. [UI] | No way to ask for "at least 6 continuous hours of Earth after landing". | A minimum-continuous-window finder over the 30 days. |
| M13 | WORKING | CORE | Two pins 1 km apart on the Shackleton ridge, same landing time: 72.0 h sunlit, 28.0 h Earth against 17.1 h and 0.0 h; slope 2.7° against 9.7°. [UI] | Resolved by the 40 m grid near the pole; at mid-latitudes (474 m) a 1 km move is two cells. Pin labels as M07. | As M07. |
| M14 | WORKING | CORE | Banner: "17 h 54 m until sunrise · Nov 17, 11:54 UTC ± 48 min" and "Earthset in 14 d 13 h · Dec 1, 07:38 UTC ± 2 h". [UI] | Sound, with stated sensitivity. | None needed. |
| M15 | PARTIAL | CORE | "Sun and Earth together ≈ 24.1 h · 33%"; the two bars on the timeline show when. [UI] | Overlap intervals are not listed as start and end times. | List the overlap windows under the total. |
| M16 | PARTIAL | ENABLER | Ranking orders the 18 listed sites by Sun + Earth for one landing time; each site card gives its own best landing time. [UI] | No joint search over sites and times; "best" is most hours, not longest unbroken stretch; pins are not ranked. | Add "longest unbroken" as a ranking column; include pins. |
| M17 | WORKING | CORE | Same site at 12:00 Nov 15 and 00:00 Nov 16: Earth 28.0 h to 40.0 h (+12.0), together +12.0, sunlit unchanged. [UI] | Delay buttons step in days; a 12 h shift needs the Hour menu, then Compare. | Add ±12 h to the Delay row. |
| M18 | NOT IMPLEMENTED | OPTIONAL | Ranking sorts and filters by category only. [UI] | No thresholds. | Minimum Sun and Earth hours as two filters on the ranking. |
| M19 | PARTIAL | ENABLER | Card: "Earth never in view, so no direct line to Earth"; outage list begins "Nov 15 12:00 to Nov 16 15:26". [UI] | Nothing flags the first hours after landing specifically. | A warning line when Earth is out of view at touchdown. |
| M20 | WORKING | ENABLER | Baseline stays first; Delay adds variants beside it; Open returns to any option; the link stores all of them. [UI] | Stay length and terrain on/off apply to every option at once. Four options at most. | None needed for the challenge. |
| M21 | PARTIAL | ENABLER | METHOD.md and README: planetocentric latitude, east-positive longitude, 1,737.4 km, JPL reports MEAN_ME; projection tests in tests/. [DOC][CODE] | Not in the in-app sheet. No single conventions table. Projection method is in code and tests, not prose. | One conventions table in METHOD.md, linked from the sheet. |
| M22 | WORKING | CORE | JPL Horizons observer table, centre "coord@301" at the site, height = terrain + 2 m (5.0416 km at IM-4), airless, DE441, UT. Re-requested directly in this audit. [API][CODE server.mjs:23] | Sound. Positions are for the surface point, not the Moon centre. | State DE441 and UT in the sheet. |
| M23 | WORKING | CORE | Rays every 0.25° to 300 km on a curved Moon, bilinear sampling, grid tiers 40 m / 80 m / 474 m / 1.9 km; the API returns all 1,440 skyline angles and distances. [API][CODE terrain-worker.mjs] | Limits are written down. Angular step is fixed. | None needed. |
| M24 | WORKING | ENABLER | Totals count the centre; the card adds "full Sun 22.0 h, at least part of it 26.2 h" and "first light Nov 17, 09:50 UTC, then full disc 14:05". [UI] | Sound and stated. The headline number is the centre rule. | None needed. |
| M25 | WORKING | ENABLER | "Earth partly hidden · 2% showing"; Earth hours count the centre. [UI] | Sound and stated. | None needed. |
| M26 | PARTIAL | ENABLER | ± beside each time for a 0.1° skyline change. Audit run: coarsening the skyline from 0.25° to 2° moved Earthrise at IM-4 by 20 min. [UI][AUDIT] | No sensitivity to position error or grid resolution in the app. Against NASA maps the worst point is 15.8 points off. | Add a "what if the pin is 100 m off" check for polar sites. |
| M27 | PARTIAL | ENABLER | Audit run: totals identical to 0.01 h for 15, 5, 2 and 1 min steps at three sites; hourly interpolation within 0.00003° of JPL at 10 min steps. [AUDIT] | No such test in the repository. The skyline cannot be refined below 0.25° without a server change. | Add the convergence script to scripts/ and a step parameter to the API. |
| M28 | WORKING | ENABLER | Every site names its grid; unmapped layers say "Not mapped here"; long-term average says "Polar regions only". [UI] | The share of skyline samples taken from the fine grid (24% at IM-4) is only in the API. | Show that share in the terrain row. |
| M29 | PARTIAL | ENABLER | One request returns the JPL rows, the full skyline, heights and model text; scripts and data hashes are in the repo; CSV export. [API][DOC] | No version or commit in the API or CSV. No written recipe. CSV has totals, not windows. | Add version and request settings to both; a one-page "reproduce this" note. |
| M30 | WORKING | CORE | Every stay panel: "Geometry only. Sunlight is not usable power, Earth in view is not a working radio link, and nothing here assesses landing safety." [UI] | No power or link model is offered, and none is claimed. | None needed. |

### Educators

| ID | Status | Scope | Workflow and verified result | Issue | Smallest improvement |
|---|---|---|---|---|---|
| E01 | WORKING | ENABLER | Filter "South Pole", or search "south pole": "Shackleton region · Near the lunar south pole". [UI] | None. | None needed. |
| E02 | WORKING | CORE | Sunlight layer shades the night side and terrain shadows; label "Terrain shadows · NASA LOLA". [UI] | No on-map words that dark means night or shadow. | As M08. |
| E03 | PARTIAL | ENABLER | "How to read this app" speaks of "the real skyline"; the sky chart draws the skyline and a 0° line. [UI] | No sentence says what a horizon is on the Moon. | One sentence in the sky-chart caption. |
| E04 | PARTIAL | OPTIONAL | Measured at 1440 × 900: labels 11 px, notes 12.5 px, stay buttons 12.5 px; headline values 24 px. [UI] | Small labels will be hard to read on a projector. Not tried on one. | A large-text mode, or honour browser zoom in the layout. |
| E05 | PARTIAL | OPTIONAL | Explainers and "How was this worked out?" start closed. [UI] | Azimuth, disc share, distance, slope and data rows are always shown. | Simple and Detailed views of the card. |
| E06 | WORKING | CORE | Slider and Play move the clock, the tiles, the sky chart, the Sun and Earth lines and the shadows. Play moved 30 h to 50 h in 2.5 s. [UI] | None. | None needed. |
| E07 | WORKING | ENABLER | Pick an earlier landing date; the site stays selected. [UI] | The slider only runs forward from landing (0 to 720 h). | A "one day back" step next to the date. |
| E08 | WORKING | ENABLER | "Blocked by terrain … hidden by terrain 360 m away … which rises to 7.4°" against "Below horizon" at night; explainer on permanent shadow. [UI] | None. | None needed. |
| E09 | WORKING | CORE | Gold is Sun, blue is Earth: lines labelled "Sun 1.8°" and "Earth 3.7°", two tiles, two chart dots. [UI] | None. | None needed. |
| E10 | PARTIAL | ENABLER | UTC, degrees and km are labelled. [UI] | "T+1 d 6 h", "3 d", "147.9M km", azimuth and UTC are not explained; the clock has no year. | Plain words on first use; tooltips. |
| E11 | WORKING | CORE | As M13: ridge 72.0 h sunlit, the point 1 km away 17.1 h. [UI] | Pin labels as M07. | As M07. |
| E12 | PARTIAL | OPTIONAL | The shadow layer moved between Nov 24 and Nov 29 at the south pole. [UI] | About 300 m cells at the poles and coarser elsewhere; the picture does not mark when a chosen point enters shadow (the countdown does). | A marker on the timeline when the selected point changes state. |
| E13 | PARTIAL | ENABLER | Two pins compared by hours, Sun height and slope. [UI] | Elevation is not on the comparison card (it is in the CSV). The two sky charts cannot be seen together. | Add elevation to the card; show both sky charts. |
| E14 | PARTIAL | OPTIONAL | Slider and Play advance 24 h. [UI] | The app does not say a lunar day lasts 29.5 Earth days (METHOD.md does). | One line under "Lunar day ahead". |
| E15 | WORKING | CORE | Globe, "Sky from the surface" chart and Landing view all show the same site and time. [UI] | None. | None needed. |
| E16 | PARTIAL | OPTIONAL | Sunlight off or Satellite shows the bare imagery; a pin reports "Sunlit" or "Blocked". [UI] | Nothing explains that the dark seas are dark rock. | One explainer: "Dark is not always shadow". |
| E17 | WORKING | CORE | Shackleton point, Nov 20: Sun "Blocked by terrain", Earth "in view". Griffin point, Nov 15: 72.0 h sunlit, 0.0 h Earth. [UI] | None. | None needed. |
| E18 | NOT IMPLEMENTED | OPTIONAL | No note or prediction field. [UI] | Workaround: a shared link and the comparison. | A free-text note saved in the link. |
| E19 | WORKING | ENABLER | Share link carries site, date, hour, timeline position, stay, terrain, view, layers and comparison. [UI] | Clipboard from a real click not checked. | None needed. |
| E20 | PARTIAL | OPTIONAL | Comparing dates shows the change (Earth 28.0 h to 40.0 h); the sheet says imagery "carries the lighting of the day it was photographed". [UI] | No prompt connects the two. | Add to the explainer in E16. |
| E21 | WORKING | OPTIONAL | Explainer "Can you see Earth from everywhere on the Moon?"; Earth view layer; countdown to Earthrise. [UI] | None. | None needed. |
| E22 | PARTIAL | OPTIONAL | Any date 1950 to 2099; long-term averages; explainer mentions the 1.5° tilt. [UI] | Only 30 days at a time; no view across a year. | A 12-month strip of sunlit share for polar sites. |
| E23 | PARTIAL | OPTIONAL | The note names the one obstruction that decides it, with distance and height. [UI] | The chart does not separate near and far terrain (the API has distances). | Shade the skyline by distance. |
| E24 | WORKING | CORE | "How was this worked out?": "3.3° is below 7.4°, so the Sun is hidden." [UI] | None. | None needed. |
| E25 | PARTIAL | ENABLER | The API gives every number; this audit matched JPL directly to 0.00003°. [API][AUDIT] | No worksheet or documented request for a class to follow. | As M29. |
| E26 | PARTIAL | OPTIONAL | METHOD.md says the drawn shadows are coarser than the site numbers and can disagree. [DOC] | Not said beside the map. | As M08. |
| E27 | PARTIAL | OPTIONAL | Sky chart at any site. [UI] | Its height axis changes with the site (16° at IM-4, 66° at Apollo 11). | A fixed-scale switch. |
| E28 | PARTIAL | OPTIONAL | Terrain on/off shows real skyline against none. README gives a worked example (best pixel 90%, best cell 63%). [UI][DOC] | No way to switch grid resolution. | Let the API take a coarser grid for comparison. |
| E29 | WORKING | ENABLER | "± 48 min", "± 2 h" beside times, with a tooltip and a sentence in the sheet. [UI] | It is a sensitivity to 0.1° of skyline, not a statistical error. | None needed; keep the wording. |
| E30 | PARTIAL | ENABLER | Sheet lists sources, what is modelled and what is not; REFERENCES.md lists every source. [UI][DOC] | Measured, NASA-modelled, app-calculated and illustrative items are not tagged where they appear. | Small tags on the card rows. |

### General public

| ID | Status | Scope | Workflow and verified result | Issue | Smallest improvement |
|---|---|---|---|---|---|
| P01 | WORKING | ENABLER | The Moon fills the screen; title "Zoriana — Lunar Landing Site Navigator"; "Pick a site. Pick a date. See your Sun and Earth windows." [UI] | The name "Luna Maps" appears nowhere in the app. | Decide the name; no code needed. |
| P02 | PARTIAL | ENABLER | "How to read this app", layer menu descriptions, heat-map legend, timeline legend. [UI] | The explainer is closed and below 18 sites. Marker colours and dashed lines are not explained in the app. | Move "How to read" to the top; add a three-line legend. |
| P03 | WORKING | CORE | Tap a marker, or drop a pin: "Custom lunar coordinates · inside Goclenius". [UI] | On a phone a tap does not drop a pin; the pin tool is needed. | Long-press to drop a pin on touch. |
| P04 | WORKING | ENABLER | Scroll or pinch, zoom buttons, "Whole Moon". [UI][SIM] | None. | None needed. |
| P05 | WORKING | ENABLER | "Whole Moon" button and the app icon. [UI] | None. | None needed. |
| P06 | WORKING | CORE | Date picker, "Now", lunar-day bars, Delay buttons. [UI] | None. | None needed. |
| P07 | PARTIAL | ENABLER | The date is shown and "Now" returns to today. [UI] | Nothing says past, today or future; the clock has no year. | A tag beside the date. |
| P08 | WORKING | ENABLER | "Tycho" and "tranquil" found; no match gives "No matching place. Try latitude, longitude…". [UI] | Topics such as "far side" find nothing. | None needed. |
| P09 | WORKING | CORE | "Sun: up at 1.8° but hidden by terrain 1.9 km away to the northeast, which rises to 6.9°." [UI] | None. | None needed. |
| P10 | PARTIAL | ENABLER | In Safari on a simulated iPhone: sheet drag, scroll, pinch, turning and menus work. [SIM] | Small targets: stay buttons 45 × 23 px, terrain toggle 79 × 24, date field 17 px high. Real phone not tried. | Raise touch targets to 44 px. |
| P11 | PARTIAL | OPTIONAL | A pin says "Sunlit" or "Blocked"; Sunlight off shows bare imagery. [UI] | As E16. | As E16. |
| P12 | WORKING | OPTIONAL | Earth view layer; Earth column in the ranking; countdown to Earthrise. [UI] | None. | None needed. |
| P13 | WORKING | CORE | Slider in quarter hours, or Play; the site stays selected. [UI] | None. | None needed. |
| P14 | PARTIAL | CORE | Same site on two dates in the comparison: numbers and bars side by side. [UI] | Not two pictures. | Optional: a before/after picture. |
| P15 | WORKING | OPTIONAL | Explainer "Why land near the south pole?" in the app. [UI] | Closed and low in the list. | As P02. |
| P16 | WORKING | CORE | Map style "Landing" keeps the site and time (link "view=landing"). [UI] | None. | None needed. |
| P17 | PARTIAL | OPTIONAL | Curated list with categories, four explainers, "Rank all sites". [UI] | Explainers tell you what to press instead of doing it. | Make each explainer end in a "Show me" button. |
| P18 | WORKING | ENABLER | Share copies a link that reopens site, date, time, view and layers. [UI] | Clipboard from a real click not checked. | None needed. |
| P19 | PARTIAL | ENABLER | Bad date: "Choose a valid date between 1950 and 2099."; unmapped areas say so. [UI] | The message for a JPL outage ("JPL unavailable for this option…") was read in code, not seen live. | None needed. |
| P20 | PARTIAL | ENABLER | One interface; a plain sentence leads each panel. [UI] | The card is long and technical rows are always open. | As E05. |
| P21 | PARTIAL | OPTIONAL | Sheet: "Imagery carries the lighting of the day it was photographed." [UI] | Not said where the mismatch is seen. | As M08. |
| P22 | WORKING | OPTIONAL | Explainer: "Earth hangs almost still in its sky… a band about 8° wide… where Earth slowly rises and sets over a month." [UI] | None. | None needed. |
| P23 | PARTIAL | OPTIONAL | Dates to 2099 are accepted. Evidence: JPL DE441; twelve eclipses to 2030 match NASA. [DOC] | The app says nothing about confidence in far dates. | One sentence in "How accurate". |
| P24 | PARTIAL | OPTIONAL | The Earth explainer covers the far side; the Sunlight and Earth layers show the two are different. [UI] | Never said in one sentence. | Add to the Earth explainer. |
| P25 | PARTIAL | ENABLER | Footer credits; label switches between "Terrain shadows · NASA LOLA" and "NASA / LRO · imagery"; the map chooser explains lit and unlit. [UI] | No tag per layer for photographed, calculated or illustrative. | As M08 and E30. |
| P26 | WORKING | CORE | As M13, plus each pin’s note naming what blocks the Sun or Earth. [UI] | Pin labels as M07. | As M07. |
| P27 | NOT IMPLEMENTED | OPTIONAL | Nothing compares the app with an outside image. [UI] | None. | An explainer paragraph only. |
| P28 | WORKING | CORE | "Earth: up at 2.1° but hidden by terrain 5.0 km away to the northwest, which rises to 2.9°"; "Terrain off" shows the smooth-Moon answer. [UI] | None. | None needed. |
| P29 | PARTIAL | OPTIONAL | IM-4: 24.1 h of Sun from Nov 15, none from Feb 1. [UI] | No plain reason given beside the result. | One line: "The Sun is below the horizon here for about two weeks at a time." |
| P30 | WORKING | CORE | Tags "Most sunlight", "Longest Earth view"; the caution line; no site is called safe. [UI] | None. | None needed. |

---

## C. Fifteen deep-dive evaluations

### Mission planners

**M05 — What time am I analysing, and in which standard? PARTIAL.**
- **Workflow:** open any site; read the timeline panel.
- **Output:** "18:00 · Nov 16 · UTC", "Mission time T+1 d 6 h", "Landing date · UTC 11/15/2026", "Hour 12:00".
- **Science:** JPL's table is headed "UT" and uses DE441; the app labels it UTC. The two differ by under a second, which is far below the five-minute sampling.
- **Limitation:** the clock shows the timeline moment, not the landing time, and the timeline opens at T+12 h. Opening `?site=apollo11&date=1969-07-20&hour=20` shows "08:00" and a Sun elevation of 16.7°, which is the value twelve hours after the requested landing hour. The clock has no year.
- **Evidence:** `index.html` (`#time` has `value="12"`); live reads above.

**M13 — Ridge against a point 1 km downslope. WORKING.**
- **Workflow:** drop a pin on the ridge, press Compare, drop a second pin, press Compare. Two clicks per site.
- **Output** (ridge at 89.45°S 137.31°W, second point at 89.417°S): sunlit 72.0 h against 17.1 h; Earth 28.0 h against 0.0 h; "Earth never in view, so no direct line to Earth"; slope 2.7° against 9.7° over 80 m. Differences are printed as "−54.9" and "−28.0".
- **Science:** both points use the 40 m south-pole grid, so a 1 km move is 25 cells. At mid-latitudes the grid is 474 m and the same comparison would rest on two cells.
- **Limitation:** both options are titled "Dropped pin" and their coordinates print as "89.5°S" and "89.4°S".

**M22 — Are the angles for the surface point? WORKING.**
- **Workflow:** none for the user; the sheet says "for the exact site and height".
- **Evidence:** `server.mjs:23` asks JPL Horizons for an observer table centred on `coord@301` at the site's longitude, latitude and height (terrain plus 2 m; 5.0416 km at the IM-4 point), with `APPARENT: 'AIRLESS'`. This audit sent the same request at 10-minute steps: JPL answered with centre "Moon (301) {source: DE441}", times in UT, and values within 0.00003° of the app's interpolation between hourly rows.
- **Limitation:** DE441 and UT are not named in the app's sheet.

**M27 — Do the windows converge as sampling is refined? PARTIAL.**
- **Workflow:** not available to a user.
- **Audit result** (72 h from Nov 15 12:00; Apollo 11 over 360 h):

| Site | Time step 15, 5, 2, 1 min | Skyline every 0.5°, 1°, 2° instead of 0.25° |
|---|---|---|
| IM-4 point (80 m grid) | Sun 24.10 h, Earth 44.56 h at every step; next changes 11:54 and 15:26 at every step | Sun unchanged; Earth 44.50, 44.30, 44.22 h; Earthrise 15:29, 15:41, 15:46 |
| Blue Moon Pathfinder 1 point (40 m) | Sun 72.00 h, Earth 27.99 h at every step | unchanged |
| Apollo 11 (474 m) | Sun 343.66 h of 360 at every step; sunset Nov 29 19:39 | unchanged to 1°; 343.64 h and 19:38 at 2° |

- **Reading:** the answer does not depend on the time step. It depends weakly on the skyline's angular step, and the trend from 2° to 0.25° suggests little is left to gain, but 0.25° is the finest the server offers.
- **Limitation:** this test is not in the repository, so it is not repeatable by others yet.

**M29 — Can another researcher reproduce a result? PARTIAL.**
- **Workflow:** `GET /api/ephemeris?lat=-84.6&lon=31&date=2026-11-15&reference=0`.
- **Output:** 745 hourly rows each for the Sun and Earth (time, azimuth, elevation, range); the skyline (1,440 angles and distances, step 0.25°, reach 300 km, observer 2 m); terrain height 5,039.6 m; grid name; slope and its baseline; how many samples were taken and what share came from the fine grid; model text.
- **Also available:** comparison and ranking CSV with 19 named columns; five check scripts in `scripts/`; SHA-256 hashes for the terrain files; a public repository.
- **Limitation:** neither the API nor the CSV carries a version or commit. There is no written recipe. The CSV has totals, not the windows themselves.

### Educators

**E08 — Terrain shadow against lunar night. WORKING.**
- **Workflow:** open the Shackleton point on Nov 20; then IM-4 on Feb 1, 2027.
- **Output:** "Sun: up at 1.8° but hidden by terrain 1.9 km away to the northeast, which rises to 6.9°" (status "Blocked by terrain"); and "−5.1° · Below horizon".
- **Science:** the two cases are separate tests in the code: the JPL elevation against zero, and against the skyline.
- **Limitation:** none for this question.

**E12 — Watching a shadow cross a crater. PARTIAL.**
- **Workflow:** zoom to the south pole with Sunlight on; drag the timeline.
- **Output:** the lit and shadowed ground changed between Nov 24 14:00 and Nov 29 14:00; the label read "Terrain shadows · NASA LOLA".
- **Science:** the picture is a separate, coarser calculation (about 300 m cells at the poles, about 5 km at the equator). `METHOD.md` says it "is approximate visual coverage, separate from the finer site horizon calculations".
- **Limitation:** the picture cannot say when one chosen point enters shadow; the countdown does. The two can disagree at edges, and the map does not say so.

**E24 — Predicting from elevation and skyline. WORKING.**
- **Workflow:** select a site; open "How was this worked out?".
- **Output:** "Where the Sun is. NASA/JPL Horizons puts it 3.3° above level ground, toward the east-northeast… How high the ground is that way. NASA's LOLA terrain reaches 7.4° in that direction, from ground 360 m away. Compare. 3.3° is below 7.4°, so the Sun is hidden."
- **Science:** these are the numbers the calculation uses (3.3 − 7.4 = −4.1, the "Above terrain" value on the tile).
- **Limitation:** none.

**E27 — Solar paths at different latitudes on one scale. PARTIAL.**
- **Workflow:** open the sky chart at two sites.
- **Output:** the chart's top is 16° at IM-4 and 66° at Apollo 11.
- **Limitation:** the scale follows the site, so two charts cannot be compared by eye, and they cannot be shown together.

**E29 — Why a time has a range. WORKING.**
- **Workflow:** read the countdown.
- **Output:** "Sunrise in 1 d 11 h · Nov 17, 11:54 UTC ± 48 min"; at Apollo 11 "± 12 min"; a tooltip and a sentence in the sheet explain that it is how far the time moves if the skyline is 0.1° higher or lower.
- **Science:** a sensitivity figure, honestly labelled. It does not include position error or grid resolution.

### General public

**P02 — What do the colours and symbols mean? PARTIAL.**
- **Workflow:** scroll past 18 sites to "How to read this app" and open it.
- **Output:** "Gold always means the Sun and blue always means Earth…".
- **Limitation:** the legend is closed and low on the page. Marker colours (purple, green, grey) and dashed lines are not explained in the app.

**P03 — I tapped somewhere; where am I? WORKING.**
- **Workflow:** right-click, or the pin tool then a click.
- **Output:** "Dropped pin · Custom lunar coordinates · inside Goclenius · 10.2339° S 45.7843° E", then the Sun and Earth state and a sentence. A second pin read "in Mare Fecunditatis".
- **Science:** names come from the IAU list by centre and diameter, and only for round features.
- **Limitation:** on a phone a plain tap does not drop a pin.

**P10 — Is it comfortable on a phone? PARTIAL.**
- **Workflow:** Safari on a simulated iPhone, by touch.
- **Output:** dragging the sheet, scrolling it, pinching, turning the globe and the Map layers menu all worked on single gestures.
- **Limitation:** stay buttons are 45 × 23 px, the terrain toggle 79 × 24, the date field 17 px high. If the sheet's content is flicked and the handle grabbed while it is still coasting, Safari scrolls instead of collapsing; a second drag works. No real phone was used.

**P25 — Photograph, visualisation or prediction? PARTIAL.**
- **Workflow:** watch the label above the map while pressing the Sunlight button; open the map chooser.
- **Output:** "Terrain shadows · NASA LOLA" becomes "NASA / LRO · imagery". The chooser says "Satellite shows the NASA imagery of both with no lighting."
- **Limitation:** the long-term maps ("NASA model"), the app's own calculation and the illustrative parts (line lengths, the Sun's distance) are not tagged where they are drawn.

**P30 — Trade-offs without a safety claim. WORKING.**
- **Workflow:** compare two sites.
- **Output:** tags "Longest Earth view" and "Most Sun + Earth"; "Sunlit for the whole stay. Earth in view for about 28 of 72 hours."; and on each stay panel "nothing here assesses landing safety".
- **Science:** no power, link or hazard claim is made anywhere that was read.

---

## D. First-time experience (expert walkthroughs)

| | Mission planner | 13-year-old | Adult, no astronomy |
|---|---|---|---|
| Tries first | The site list, then IM-4 | Spins the Moon, taps a marker | Reads the tagline, taps a marker |
| Finds the control? | Yes: list, Compare, Method | Yes: markers, Play | Yes: markers; the date field less so |
| May misunderstand | Which time the angles are for; which "Dropped pin" is which | "T+12 h"; why nothing changes in two hours of play | "Above terrain −4.1°"; "3 d" |
| Time to a useful result | About 20 seconds to totals and a countdown | About 10 seconds to "Sunlit" or "Blocked" | About 15 seconds to the stay sentence |
| After a mistake | Close the card; options stay in the comparison | "Whole Moon" recovers the view | Same |
| Steps that could go | Setting the Hour menu, then finding the clock is elsewhere | Scrolling for the explainers | Scrolling a long card for one sentence |
| Explained at the right level? | Yes, and deeper on request | Mostly; units are not glossed | The first sentence, yes; the tiles, no |
| One change that helps most | Open the timeline at landing time | Explainers that end in "Show me" | A short card with details folded |

The times in the table are the auditor's estimates from doing each task, not measurements of real users.

**Controls that make it harder than it needs to be:** the split between landing time and timeline time; a site card that is one long scroll; pins that share one name; explainers placed below the list.

**Hidden complexity.** A user does not need coordinates, azimuth, ephemerides or uncertainty to get an answer; one tap on a marker is enough, and comparing takes one button per option. The exception is time: the user must work out the landing-time and timeline model before the numbers make sense. Advanced users meet three fixed limits: stays of 24 h, 3 d or 7 d only; no thresholds; a skyline step that cannot be changed.

---

## E. Scientific credibility assessment

| Area | What is implemented | Evidence | Open point |
|---|---|---|---|
| Coordinates | Planetocentric latitude, east-positive longitude, 1,737.4 km radius. JPL reports the MEAN_ME frame for surface sites, the frame of the LOLA products. | `METHOD.md`; projection tests in `tests/` (both poles, both grid sizes, date line); grid orientation checks (61 m and 65 m RMS against the global grid) | No single conventions table. Global and polar products may differ slightly at their joins (README says so). |
| Sun and Earth positions | JPL Horizons observer tables for the surface point and height, airless, DE441, hourly, interpolated. | `server.mjs:23`; this audit's direct request (0.00003°); Apollo 11 touchdown within 0.06° of the published JPL-based figure | DE441 and UT not named in the app. |
| Terrain skyline | Rays every 0.25° to 300 km on a curved Moon; 40 m, 80 m, 474 m and 1.9 km grids; observer 2 m up. | API returns the skyline; `tests/terrain.test.mjs` (analytic depressed horizon, synthetic ridge, wrap through north) | Angular step fixed. Features smaller than the grid are missed, as stated. |
| Timing | Five-minute tests between hourly positions; crossings interpolated. | This audit: totals identical to 0.01 h from 15 min to 1 min steps | Not a test in the repository. |
| Visibility rule | Centre above skyline for totals; disc share shown beside it; eclipses by Earth counted as darkness. | Card text; `tests/disc.test.mjs`, `tests/eclipse.test.mjs` | The headline totals use the centre rule. |
| Coverage | Any point; grid named per site; polar maps say where they stop. | Live: "Not mapped here", "Polar regions only" | Share of skyline from the fine grid is API-only. |
| Uncertainty | "±" on rise and set times for 0.1° of skyline. | Live; `crossingSpread` in `src/windows.mjs` | A sensitivity, not an error bar; no position or resolution term. |
| Reproducibility | API with all intermediates; CSV; scripts; data hashes; public code. | This audit reran the windows from the API alone | No version stamp; no recipe. |

**Independent validation on record** (from the repository's scripts and result files; not rerun as part of this audit):

- Apollo 11 touchdown Sun elevation: within 0.06° of the Apollo Lunar Surface Journal's JPL-based figure.
- Twelve Apollo Sun-angle cases against NASA's older table: within 0.7° in elevation, 2.57° in azimuth. The remaining gap traces to that table's Sun position.
- Ten polar points over 347 days against NASA's long-term maps: Sun 3.1 percentage points apart on average (15.8 at worst), Earth 2.3 (4.5 at worst).
- Twelve eclipses, 2026 to 2030: mid-eclipse within 14 minutes of NASA's list.
- Blue Ghost Mission 1: end of totality on March 14, 2025 at 08:30 UTC, the time Firefly gave for its photograph. Sunset on March 16, 2025: the app is 1.1 to 2.2 hours later than Firefly's account.

**Verified errors:** none in results. **Documentation errors (verified):** `METHOD.md` still says the heat-map "button steps through three maps" (it is now a menu) and that "Find best spot" "takes the six best-scoring" cells (it now takes twenty).

**Untested concerns, not errors:** the Blue Ghost sunset gap; behaviour on knife-edge ridges; registration at the joins between grids; dates near 1950 and 2099; any sunrise or sunset time against an outside source at a polar site.

---

## F. Interface simplification opportunities

| Now | One interaction instead |
|---|---|
| Set date, set Hour, then notice the clock shows a different moment and move the slider | Timeline opens at the landing time; one clock |
| Drop a pin, read coordinates, retype them to move it | Drag the pin, or nudge it |
| Read the Sun bar and the Earth bar against each other to find overlap times | A listed set of "both" windows |
| Scroll a long card for the one sentence that answers the question | Sentence and countdown first; details folded |
| Open an explainer, read which button to press, find it | Explainer ends in "Show me" |

**Hierarchy to keep, with what the app already has at each level:**

1. **Immediate answer:** status word and the stay sentence ("Blocked by terrain"; "Sunlit for about 24 of 72 hours").
2. **Useful explanation:** the blocker sentence ("hidden by terrain 360 m away to the east-northeast, which rises to 7.4°") and the countdown with its "±".
3. **Scientific details:** elevation, azimuth, clearance, disc share, grid, slope, long-term average. These should fold by default on a phone, not disappear.
4. **Methods and evidence:** "How was this worked out?", the sheet, `METHOD.md`, the API and the scripts.

The caution line ("Geometry only…") belongs at level 1 and should stay there. One interface serves all three audiences; nothing found argues for separate apps.

---

## G. Prioritised fixes

No P0 items: no scientific defect was found in a demonstrated core result.

| # | Priority | User problem | Questions | Benefit | Where | Size | Acceptance test |
|---|---|---|---|---|---|---|---|
| 1 | P1 | The clock shows a moment 12 h after the landing time asked for, with no year | M05, P07, E10 | Removes the main source of misreading | `index.html` (`#time`), timeline code in `src/main.js` | Small | A link with `hour=20` opens with the clock at 20:00 and the year visible |
| 2 | P1 | Every custom pin is "Dropped pin"; comparison prints 0.1° | M07, M13, E11, E13, P26 | Nearby sites can be told apart | pin naming and comparison card in `src/main.js` | Small | Two pins 1 km apart show different names and coordinates |
| 3 | P1 | No 48 h stay; sunlight interruptions and overlap windows are not listed | M11, M15, M19 | Answers "when is sunlight interrupted" in words | stay control, `src/windows.mjs` | Medium | A 48 h stay lists each Sun outage and each "both" window with start and end |
| 4 | P2 | `METHOD.md` has two stale statements; conventions are scattered | M21, M22, E30 | Documents match the app | `METHOD.md`, sheet in `index.html` | Small | One table names frame, longitude sign, radius, DE441, UT |
| 5 | P2 | Results carry no version; no recipe; convergence not in the repo | M27, M29, E25 | A researcher can rerun and cite a result | `server.mjs`, `src/export.mjs`, `scripts/` | Small | API and CSV include a version; `scripts/check-convergence.mjs` reproduces section C |
| 6 | P2 | Typed "89.5S 45E" fails; no way to copy coordinates | M06, M10, M01 | No retyping | search parser, site card | Small | The card's own coordinate text pastes into search and works |
| 7 | P2 | Nothing on the map says photograph or calculation, or past or future | M08, E02, E16, E26, P21, P25, P07 | Stops the commonest misreading of a dark patch | map status label | Small | A chip reads "Calculated sunlight" or "NASA imagery, unlit", and the date shows "past", "today" or "future" |
| 8 | P2 | The card is long; legend and explainers are buried; units unexplained | E03, E05, E10, P02, P15, P20 | Simple first, depth on request | card layout, list order | Medium | On a phone the first screen shows name, sentence and countdown only |
| 9 | P2 | Small touch targets; no pin by touch | P10, P03 | Comfortable phone use | `src/style.css`, canvas touch handling | Small | Controls are at least 44 px; long-press drops a pin |
| 10 | P3 | Cannot ask for a minimum unbroken window or filter by thresholds | M12, M16, M18 | Turns browsing into search | `src/windows.mjs`, ranking | Medium | "At least 6 h of Earth from landing" returns arrival times |

**Later (P3):** fixed-scale and side-by-side sky charts (E27, E13); a year strip for polar sites (E22); notes in links (E18); a coarser-grid switch (E28); "Show me" buttons on explainers (P17).

---

## H. Three demonstration scenarios

Each uses only what was run in this audit.

**General public — an unfamiliar place and its lighting.**
1. Open the site. The Moon fills the screen.
2. Choose "South Pole" above the list and pick "Shackleton region". Set the date to November 20, 2026.
3. Read: "Sun: up at 1.8° but hidden by terrain 1.9 km away to the northeast, which rises to 6.9°. Earth: 2.2° clear of the terrain to the north." The countdown says sunrise is in 4 d 2 h, "± 2 h".
4. Drag the timeline to November 24 and watch the lit ground change.
- **Missing:** the app does not say in words why the Sun stays so low here unless the explainer lower down is opened.

**Education — two nearby places over time.**
1. Open `?site=-89.4500,-137.3100&date=2026-11-15&hour=12`, press Compare.
2. Type "-89.417, -137.31" in search, go, press Compare.
3. Read: 72.0 h of sunlight against 17.1 h; Earth 28.0 h against none; slope 2.7° against 9.7°.
4. Open each and read which terrain blocks the Sun.
- **Missing:** both are called "Dropped pin"; their sky charts cannot be seen together; there is nowhere to record a prediction.

**Science — two site-and-date options and the evidence.**
1. With the ridge point in the comparison, set Hour to 00:00 and the date to November 16, press Compare: Earth rises from 28.0 h to 40.0 h (+12.0). In this audit the same three options were opened from one link rather than clicked in one by one.
2. Open "How was this worked out?" for the three numbers behind the current state.
3. Press Export CSV for the 19-column table.
4. Request `/api/ephemeris?lat=-89.45&lon=-137.31&date=2026-11-15&reference=0` for the JPL rows and the 1,440-point skyline, and recompute.
- **Missing:** no version in the export; the windows themselves are not exported; the recomputation needs the repository's functions or one's own.

---

## I. Final verdict

1. **Can a first-time user understand it in about 30 seconds?** Yes for what it is and how to start: the Moon, a list of sites and the line "Pick a site. Pick a date. See your Sun and Earth windows." Less so for time, where two clocks cause misreading. This is an expert judgement, not a measured one.
2. **Can someone with no astronomy background get a useful answer without training?** Yes. One tap on a marker gives a sentence and a countdown. The tiles below it use terms that are not explained.
3. **Can a student learn something real by experimenting?** Yes. Moving a pin 1 km changed sunlight from 72.0 h to 17.1 h, and the app names the terrain responsible. The gaps are comparison aids: pin names, a shared chart scale, a place for predictions.
4. **Can a scientist reproduce and evaluate the core results?** Largely. This audit rebuilt the windows from the API alone, matched JPL to 0.00003°, and showed the totals do not depend on the time step. What is missing is a version stamp, a written recipe, and more than one outside check of a single event time.
5. **The three most important improvements:**
   - Make time unambiguous: open at the landing time, one clock, with the year.
   - Make comparison legible and complete: named pins, any stay length, listed outage and overlap windows.
   - Make reproduction a documented path: version in every export, a conventions table, the convergence test in the repository, and the stale lines in `METHOD.md` corrected.

**Can one interface deliver all three experiences?** Yes, on the evidence here. The child's and the adult's experience work today. The teacher's works with small frictions. The scientist's works for anyone willing to read the API and the code, and is one small documentation effort short of working for anyone else. None of the ten fixes is needed to meet the challenge; fixes 1 to 3 are the ones worth doing before a judge opens the app.

---

## After this audit — fixes 1 to 3, November 15, 2026

The audit above describes the app as it was at commit `2b6e535`. After it was reviewed, the first three fixes in section G were made, deployed and checked on the live site. The matrix above is left as written.

| Fix | Now, on the live site | Questions it moves |
|---|---|---|
| 1. One clock, at the landing time, with the year | A link for `apollo11`, 1969-07-20, hour 20 opens with "20:00 · Jul 20, 1969 · UTC" and "T+0 h · landing"; the Sun reads 10.6° (the published figure for touchdown at 20:17:39 is 10.65°). A visit with no date in the link opens on the present hour. | M05 to working; helps P07 and E10 |
| 2. Named pins, finer coordinates | Pins are "Pin A", "Pin B"… on the map, the card and the comparison. The two ridge points now read "Pin A · 89.450°S 137.310°W" and "Pin B · 89.417°S 137.310°W". | Removes the labelling issue in M07, M13, E11, E13, P26 |
| 3. 48 h stay; the stay written as times | Stay choices are 24 h, 48 h, 3 d, 7 d. Under the totals, for Pin A over 48 h: "No sunlight: never during this stay. Earth out of view: Nov 15 12:00 to Nov 17 08:00 (1 d 20 h). Sun and Earth together: Nov 17 08:00 to Nov 17 12:00 (3 h 59 m)." | M11 and M15 to working; helps M19 |

On a phone the year made the timeline row too wide and pushed "Now" off its edge; the repeated "UTC" beside the clock's date is now hidden below 480 px (it remains on the top bar and beside the landing date). Checked at 375 px in Chromium and in Safari on the simulated iPhone.

Share links made before this change that carry no `t` value now open at the landing time, not twelve hours after it.

Still open from section G: fixes 4 to 10, including the two stale statements in `METHOD.md`.
