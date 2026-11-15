# Zoriana — text for the NASA Space Apps 2026 project page

Paste-ready drafts for the project form. The NASA Data, Partner Data and AI fields are in [REFERENCES.md](REFERENCES.md). Edit freely: this is your project's voice, not a fixed script.

---

## Project Name

Zoriana

## High-Level Project Summary

Zoriana is a map-style web app for choosing where and when to land on the Moon. Pick a site and a date, and it shows when that spot has sunlight (power) and a clear line to Earth (communications), hour by hour for a full lunar day. It combines live Sun and Earth positions from NASA/JPL Horizons with real lunar terrain from the Lunar Orbiter Laser Altimeter, so a ridge or crater rim that blocks the Sun or Earth is accounted for. One click ranks 18 past and planned landing sites, and up to four site-and-date options can be compared side by side. This matters most at the lunar south pole, where the Sun never climbs more than a few degrees and terrain decides whether a lander has power and a link home.

## Link to Project Demo

https://github.com/sftimeless/zoriana/blob/main/demo/zoriana-demo.pdf

(7 slides. Raw file: https://raw.githubusercontent.com/sftimeless/zoriana/main/demo/zoriana-demo.pdf)

## Link to Final Project

https://zoriana.fly.dev/

Source code: https://github.com/sftimeless/zoriana

## Detailed Project Description

**What it does**

- Shows a 3D Moon you can turn and zoom, with 18 curated sites: the six Apollo landings, recent CLPS, ISRO and JAXA landings, announced future targets, and two south-pole exploration points. You can also search coordinates or right-click to drop a pin anywhere.
- For any site and landing date from 1950 to 2099, reports the Sun's and Earth's elevation and direction, whether each is above the local terrain, and what is blocking it ("hidden by terrain 2.2 km away to the east-southeast").
- Totals sunlit hours, Earth-in-view hours and hours with both at once for a 1, 3 or 7-day stay, and charts all 30 days after landing.
- Ranks every listed site for the chosen date and stay, and compares up to four site-and-date options side by side. Results export to CSV and any view can be shared as a link.
- Landing view: a tilted camera over the site with true-scale terrain, facing Earth.
- Draws NASA's maps of permanently shadowed regions at both poles and says whether a site is inside one.
- Where-to-land heat map: NASA's long-term average sunlight and Earth visibility near the poles, plus a button that finds the best spot within 15 km of any polar site.
- Shows Earth in the lunar sky at its true size, distance and phase.

**How it works**

A small Node.js server asks NASA/JPL Horizons for the apparent position and distance of the Sun and Earth as seen from the exact site, hourly for 31 days. It builds the site's skyline from LOLA elevation data (40 m and 80 m grids near the south pole, a global grid elsewhere) by sampling terrain out to 300 km in every direction on a curved Moon. The browser compares the two: a body is visible when it clears the skyline. The Sun and Earth are also measured as discs, so the app can report first light and full Sun separately. The globe, terrain shadows and landing view are drawn with Three.js.

**How we checked it**

- For the Apollo 11 landing the app's Sun elevation matches the Apollo Lunar Surface Journal's JPL-based figure to 0.06°.
- Across all six Apollo landings it is within 0.7° in elevation of NASA's older published table.
- The floors of Shackleton, Haworth, Shoemaker, Faustini and Cabeus craters read as permanently shadowed; nearby ridges do not.
- The differences from that older table trace to the Sun position it used (it places the Sun up to 2.0° from the lunar equator, more than is physically possible), not to the app.
- 60 automated tests cover the ephemeris parsing, visibility maths, terrain projection, polar maps, disc geometry and exports.

**Benefits and what we hope to achieve**

Anyone, from a student to a mission planner doing a first pass, can see in seconds why one south-pole site gets days of sunlight while a spot a few kilometres away gets none, and how that changes with the landing date. The app is honest about its limits: it is geometry only. Sunlight is not usable power, Earth in view is not a working radio link, and nothing here assesses landing safety. Positions for future missions are approximate and labelled so.

**What comes next**

Eclipses, relay satellites, slope and hazard layers for landing safety, and a search over whole regions for a chosen date rather than long-term averages.

**Tools, languages and software**

JavaScript (Node.js server, browser client), Three.js, Vite, Python with NumPy and Pillow for data preparation, Docker and Fly.io for hosting. Data: NASA/JPL Horizons, LRO LOLA elevation, permanently-shadowed-region and average-visibility maps, LRO LROC imagery, NASA Blue Marble. Full list with links in REFERENCES.md.

---

## Before you submit

- [ ] Open the demo link and the app link in a private browser window to confirm neither asks for a login.
- [ ] Paste the three reference fields from REFERENCES.md.
- [ ] Optional: request a web filter classification for zoriana.fly.dev (FortiGuard form mentioned in the organisers' guide) so judges on filtered networks can open it.
