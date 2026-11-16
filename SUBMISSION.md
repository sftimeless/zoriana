# Zoriana — text for the NASA Space Apps 2026 project page

Paste-ready drafts for the project form. The NASA Data, Partner Data and AI fields are in [REFERENCES.md](REFERENCES.md). Edit freely: this is your project's voice, not a fixed script.

---

## Project Name

Zoriana

## High-Level Project Summary

Zoriana is an interactive lunar map that helps people explore where and when to land on the Moon. Select a location and date to see, hour by hour across a full lunar day, when that spot has sunlight (needed for power) and a direct line to Earth (needed for communications).

Using Sun and Earth positions from NASA/JPL Horizons and terrain elevation data from NASA's Lunar Orbiter Laser Altimeter (LOLA), Zoriana accounts for how nearby ridges and crater rims can block sunlight or the view of Earth.

Users can rank 18 past and planned landing sites, compare up to four location-and-date options side by side, and choose one of three experiences, Explore, Learn or Plan, with help from Zoriana, our astronaut guide.

The lunar south pole makes these questions especially important. There the Sun stays close to the horizon, so even small terrain differences can decide whether a lander has light and a view of Earth.

Zoriana makes this accessible to curious explorers, educators and mission planners, and is open about its sources and its limits.

## Link to Project Demo

https://github.com/sftimeless/zoriana/blob/main/demo/zoriana-demo.pdf

(7 slides. Raw file: https://raw.githubusercontent.com/sftimeless/zoriana/main/demo/zoriana-demo.pdf)

## Link to Final Project

https://zoriana.fly.dev/

Source code: https://github.com/sftimeless/zoriana

## Detailed Project Description

**What it does**

- Shows a 3D Moon you can turn and zoom, with 18 curated sites: the six Apollo landings, recent CLPS, ISRO and JAXA landings, announced future targets, and two south-pole exploration points. You can also type coordinates in any common form, right-click to drop a pin anywhere, or press and hold on a phone. Pins are named Pin A, Pin B and so on.
- For any site and landing date from 1950 to 2099, reports the Sun's and Earth's elevation and direction, whether each is above the local terrain, and what is blocking it ("hidden by terrain 2.2 km away to the east-southeast").
- Opens each site with the answer in one sentence and a countdown to the next sunrise, sunset, Earthrise or Earthset; the numbers behind it can be folded away.
- Totals sunlit hours, Earth-in-view hours and hours with both at once for a 1, 2, 3 or 7-day stay, lists when sunlight and the view of Earth are interrupted, and charts all 30 days after landing.
- Ranks every listed site for the chosen date and stay, and compares up to four site-and-date options side by side. Results export to CSV and any view can be shared as a link.
- Three guided experiences on one map and one set of calculations. On a first visit Zoriana, a small astronaut, welcomes the visitor to the Moon and asks how they would like to explore. Explore the Moon is a short tour that teaches how to read the map ("Mare" is Latin for sea; the Sun and Earth lines show direction, not distance; the blue patches are permanent shadow, not water). Learn & Discover runs two experiments in which a student makes a guess, the app computes the real answer for two sites, the date is changed, and the result is explained. Clicking any of the 9,087 named features gives that name's own meaning or history from the IAU record. Plan a Mission shows all the numbers, keeps the guide out of the way, and offers an optional seven-step walkthrough of the analysis tools.
- Getting around: a poles-and-grid layer marks the north and south poles, the equator and a 30° grid; Shift-click two places to compare them without opening either; keep zooming in and the map drops into the Landing view of that spot. The corner clock shows the map's moment in your own time zone beside UTC.
- Landing view: a tilted camera over the site with true-scale terrain, facing Earth. Fly-by: a 50-second camera pass over any site, pin or named crater on that terrain, lit as the Sun lights it at the chosen time.
- Apollo 11 replay, for classrooms and the public: the whole 1969 flight in 3D from the pad to the Moon and back, in 27 captioned steps, with guided, follow, window and whole-route cameras, at a guided pace, in real time, or sped up. Event times are from NASA's timeline; the Moon, the Sun and the path of the rocket's third stage are from JPL Horizons; the rest of the path is rebuilt between them, and the app says which is which. The vehicles are original drawings made in code.
- Draws NASA's maps of permanently shadowed regions at both poles and says whether a site is inside one.
- Where-to-land heat map: NASA's long-term average sunlight and Earth visibility near the poles, plus a button that finds the best spot within 15 km of any polar site for your landing time and stay.
- Finds the best landing day and hour in the next 30 days, and the arrival times that give a chosen number of unbroken hours of sunlight, Earth view or both.
- Counts eclipses, when Earth passes in front of the Sun, and shows a slope layer near both poles.
- Search across the 9,087 IAU-named lunar features, and names the terrain that is blocking the Sun or Earth.
- Shows Earth in the lunar sky at its true size, distance and phase.

**How it works**

A small Node.js server asks NASA/JPL Horizons for the apparent position and distance of the Sun and Earth as seen from the exact site, hourly for 31 days (the 30-day planning window plus room for a landing hour later than 00:00). It builds the site's skyline from LOLA elevation data (40 m and 80 m grids near the south pole, 80 m near the north pole, a 474 m global grid elsewhere) by sampling terrain out to 300 km in every direction on a curved Moon. The browser compares the two: a body is visible when it clears the skyline. The Sun and Earth are also measured as disks, so the app can report first light and full Sun separately. The globe, terrain shadows and Landing view are drawn with Three.js.

**How we checked it**

- For the Apollo 11 landing the app's Sun elevation matches the Apollo Lunar Surface Journal's JPL-based figure to 0.06°.
- Across all six Apollo landings it is within 0.7° in elevation of NASA's older published table.
- The floors of Shackleton, Haworth, Shoemaker, Faustini and Cabeus craters read as permanently shadowed; nearby ridges do not.
- The differences from that older table trace to the Sun position it used (it places the Sun up to 2.0° from the lunar equator, more than is physically possible), not to the app.
- At ten polar points, the app's yearly share of sunlight differs from NASA's long-term illumination maps by about 3 percentage points on average (3.1; Earth visibility 2.3).
- The eclipse calculation reproduces the two lunar eclipses of 2026: every site's times fall inside the published contact times.
- Against a real lander: Firefly's Blue Ghost photographed the Sun coming out from behind Earth at about 08:30 UTC on March 14, 2025; the app ends totality at that site at 08:30. For the same lander's sunset two days later the app is 1 to 2 hours later than Firefly's account, and we say so.
- Each rise and set time carries a "±" showing how far it moves if the skyline is 0.1° off.
- The totals do not depend on the time step: at three sites they are identical to 0.01 h whether tested every 15, 5, 2 or 1 minutes, and the app's interpolation between hourly positions is within 0.00003° of JPL asked every 10 minutes (`scripts/check-convergence.mjs`).
- 99 automated tests cover the ephemeris parsing, visibility math, terrain projection, polar maps, place names, disk geometry, exports, and the Apollo 11 flight path and step list.

**Benefits and what we hope to achieve**

Anyone, from a student to a mission planner doing a first pass, can see in seconds why one south-pole site gets days of sunlight while a spot a few kilometers away gets none, and how that changes with the landing date. The app is honest about its limits: it is geometry only. Sunlight is not usable power, Earth in view is not a working radio link, and nothing here assesses landing safety. Positions for future missions are approximate and labeled so.

**What comes next**

Scanning a whole area for a chosen date, relay satellites for sites that cannot see Earth, and hazard maps of rocks and small craters.

**How it is creative**

- It feels like an everyday map app, so no training is needed: search, pins and a time bar.
- One set of calculations serves three audiences. Zoriana, a small astronaut guide, offers a tour of how to read the map, experiments where a guess is tested against the app's real numbers, or a quiet walkthrough of the planning tools.
- Every one of the 9,087 named features explains its own name, and the whole Apollo 11 flight can be replayed in 3D.

**What we considered**

- Honesty about limits: the app is geometry only, and says so wherever a number could be over-read.
- Real versus calculated: every NASA source is named, what the app works out itself is labeled as calculated, and approximate future sites are labeled approximate.
- Checking against published values and a real lander before trusting the output.
- People new to the Moon: plain words, a first-visit guide, and a phone layout.
- The Space Apps rules: original drawings, no NASA logos or mission patches, AI use disclosed, and the AI-made icon visibly marked.

**Tools, languages and software**

JavaScript (Node.js server, browser client), Three.js, Vite, Python with NumPy and Pillow for data preparation, Docker and Fly.io for hosting. Data: NASA/JPL Horizons, LRO LOLA elevation, permanently-shadowed-region and average-visibility maps, LRO LROC imagery, NASA Blue Marble. Full list with links in REFERENCES.md.

## Links as entered on the form

The form limits how many links each field takes, so the two link fields carry a shortened list. Every source, including the ones left out here, is in [REFERENCES.md](REFERENCES.md).

**NASA Data**

- NASA/JPL Horizons System: https://ssd.jpl.nasa.gov/horizons/
- JPL Horizons API documentation: https://ssd-api.jpl.nasa.gov/doc/horizons.html
- LRO LOLA polar elevation LDEM_85S_40M: https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/ldem_85s_40m.lbl
- LRO LOLA polar elevation LDEM_80S_80M: https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/ldem_80s_80m.lbl
- LRO LOLA polar elevation LDEM_80N_80M: https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/ldem_80n_80m.lbl
- LRO LOLA global elevation LDEM_64: https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/ldem_64.img
- LRO LOLA permanent shadow and average visibility maps: https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/extras/illumination/img/
- NASA SVS CGI Moon Kit (LROC color mosaic, LDEM_16 elevation): https://svs.gsfc.nasa.gov/4720/
- NASA Moon Trek (LROC WAC global mosaic tiles): https://trek.nasa.gov/moon/
- NASA Blue Marble: Next Generation, December 2004: https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography-bathymetry/december/world.topo.bathy.200412.3x5400x2700.jpg
- NASA NSSDC Apollo Landing Site Coordinates: https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html
- NASA NSSDC Apollo 11 Command and Service Module: https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059A
- NASA SP-2000-4029 Apollo 11 timeline: https://www.nasa.gov/wp-content/uploads/static/history/SP-4029/Apollo_11i_Timeline.htm
- Apollo Lunar Surface Journal, Thermal Environment: https://www.nasa.gov/wp-content/uploads/static/history/alsj/WOTM/WOTM-ThermalEnvrnmnt.html
- NASA Eclipse Web Site, lunar eclipses 2021–2030: https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2021.html
- NASA Eclipse Web Site, lunar eclipses 2031–2040: https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2031.html
- LROC, Firefly Blue Ghost Landing Region: https://www.lroc.im-ldi.com/images/1400
- LROC, IM-2 intended landing site: https://www.lroc.asu.edu/images/1401
- LROC QuickMap: https://quickmap.lroc.im-ldi.com/

**Space Agency Partner and Other Data** (26 rows, the form's limit)

- JAXA SLIM mission page (landing coordinates): https://darts.isas.jaxa.jp/en/missions/slim
- ISRO Chandrayaan-3 landing site, Statio Shiv Shakti: https://en.wikipedia.org/wiki/Statio_Shiv_Shakti
- IAU/USGS Planetary Nomenclature of the Moon: https://planetarynames.wr.usgs.gov/GIS_Downloads
- Firefly Aerospace, 14 days of surface operations on the Moon: https://fireflyspace.com/news/firefly-aerospace-successfully-completes-14-days-of-surface-operations-on-the-moon
- SpacePolicyOnline, Firefly's images of Earth eclipsing the Sun: https://spacepolicyonline.com/news/fireflys-dazzling-images-of-earth-eclipsing-the-sun/
- Wikipedia: IM-1 https://en.wikipedia.org/wiki/IM-1 · IM-2 https://en.wikipedia.org/wiki/IM-2 · IM-3 https://en.wikipedia.org/wiki/IM-3 · IM-4 https://en.wikipedia.org/wiki/IM-4 · Griffin Mission One https://en.wikipedia.org/wiki/Griffin_Mission_One · Blue Moon Pathfinder Mission 1 https://en.wikipedia.org/wiki/Blue_Moon_Pathfinder_Mission_1 · March 2025 lunar eclipse https://en.wikipedia.org/wiki/March_2025_lunar_eclipse · March 2026 lunar eclipse https://en.wikipedia.org/wiki/March_2026_lunar_eclipse · August 2026 lunar eclipse https://en.wikipedia.org/wiki/August_2026_lunar_eclipse (nine rows)
- Three.js (MIT License): https://threejs.org/
- Vite (MIT License): https://vite.dev/
- Node.js: https://nodejs.org/
- Python with NumPy and Pillow: https://www.python.org/
- Docker: https://www.docker.com/
- Fly.io (hosting): https://fly.io/
- Zoriana full reference list (every source, including those not listed here): https://github.com/sftimeless/zoriana/blob/main/REFERENCES.md
- Zoriana source code: https://github.com/sftimeless/zoriana
- Anthropic Claude Code (AI coding assistant): https://claude.com/claude-code
- OpenAI Codex (AI coding assistant): https://openai.com/codex/
- OpenAI ChatGPT (AI-generated app icon): https://chatgpt.com/
- Google Fonts, Space Grotesk and Inter (demo slides): https://fonts.google.com/

---

## Before you submit

- [ ] Open the demo link and the app link in a private browser window to confirm neither asks for a login.
- [ ] Paste the three reference fields from REFERENCES.md.
- [x] Both team members are on Team Zoriana on the Space Apps site (confirmed by the team on November 15).
- [ ] Optional: request a web filter classification for zoriana.fly.dev (FortiGuard form mentioned in the organizers' guide) so judges on filtered networks can open it.
