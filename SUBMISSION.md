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

**What we built**

Zoriana is an interactive lunar exploration and landing-site analysis application designed to help people understand where and when conditions may favor a Moon landing. It brings together lunar geography, terrain, sunlight, and Earth visibility in an intuitive, map-style interface.

Users can:

- Explore the Moon: Navigate a 3D lunar globe with 18 curated locations, including the six Apollo landing sites, recent CLPS, ISRO and JAXA missions, announced future targets, and two south-pole exploration points. Search by coordinates or drop a pin anywhere.
- Investigate any date: Select dates between 1950 and 2099 to examine the Sun's and Earth's apparent elevation, direction, and visibility relative to the local terrain horizon.
- Analyze mission windows: Calculate sunlit hours, Earth-visible hours, and periods when both conditions overlap for stays of 1, 2, 3, or 7 days. Explore visibility charts covering the 30 days following landing.
- Compare alternatives: Rank the curated sites for a selected date and mission duration, compare up to four location-and-date scenarios, export results to CSV, and share views through links.
- Explore the lunar poles: View NASA permanently shadowed region maps, long-term illumination and Earth-visibility heat maps, and search for more favorable locations within 15 kilometers of a selected site.
- Experience the terrain: Use the Landing view and 50-second fly-bys to explore lunar terrain at true scale, with lighting corresponding to the selected time.
- Learn through exploration: Follow the Apollo 11 mission through a 27-step, captioned 3D replay.

**How it works**

Zoriana combines astronomical ephemerides with lunar elevation data to determine whether the Sun and Earth appear above the local terrain horizon.

A Node.js server queries NASA/JPL Horizons for the apparent positions and distances of the Sun and Earth as observed from the selected lunar location. Calculations are sampled hourly across a 31-day period.

The application constructs a local terrain horizon using elevation data from NASA's Lunar Orbiter Laser Altimeter (LOLA). Terrain resolution varies by region: 40-meter and 80-meter grids near the lunar poles, and 474-meter global terrain data elsewhere.

The terrain-horizon calculation samples surrounding elevations out to 300 kilometers while accounting for the Moon's curvature. The application then compares the apparent elevation of the Sun or Earth against the calculated terrain-horizon angle in the corresponding direction.

The 3D globe, terrain visualization, lighting, and Landing view are rendered using Three.js.

**Scientific validation**

We tested Zoriana against published NASA references, historical lunar missions, and observed spacecraft events.

- Apollo landing comparisons: For Apollo 11, the calculated solar elevation differs from the JPL-based value reported in the Apollo Lunar Surface Journal by 0.06°. Across all six Apollo landing sites, calculated solar elevations are within 0.7° of NASA's older published reference table.
- Lunar polar illumination: At ten selected polar locations, Zoriana's estimated annual sunlight fractions differ from NASA's long-term illumination maps by about 3 percentage points on average.
- Firefly Blue Ghost Mission 1: During the March 14, 2025 lunar eclipse, Firefly's Blue Ghost lander observed the Sun emerging from behind Earth at about 08:30 UTC. Zoriana's calculation places the end of totality at that location at 08:30 UTC. For the lander's sunset two days later, Zoriana predicts the event 1 to 2 hours later than Firefly's reported observation. We document this discrepancy rather than presenting the model as perfectly accurate.
- Automated testing: The project includes 99 automated tests covering its scientific calculations and related functionality.

These comparisons provide useful validation evidence, but they do not establish uniform accuracy across every location, terrain model, or supported date.

**Benefits and intended impact**

Near the lunar south pole, the Sun remains close to the horizon. A ridge or crater rim can significantly change how long a location receives sunlight or maintains direct visibility of Earth. Two sites separated by only a few kilometers may experience substantially different conditions.

Zoriana makes these relationships easier to investigate. A student can discover why a crater remains dark. An educator can demonstrate how sunlight changes over time. A mission planner can perform an initial comparison of candidate sites and dates.

Our goal is to make lunar science more accessible while providing transparent, reproducible information for exploratory mission analysis.

**What makes Zoriana creative**

One scientific foundation, three ways to explore.

Zoriana combines the familiarity of an everyday mapping application with scientific analysis. Users can search, select locations, change dates, and compare results without first learning specialized scientific software.

The application offers three experiences:

- Explore: Discover lunar geography and interesting locations through approachable explanations.
- Learn: Investigate scientific questions through guided activities and experiments that use the application's actual calculations.
- Plan: Examine landing-site conditions, comparisons, rankings, and supporting scientific information.

A contextual astronaut guide, also named Zoriana, helps visitors understand unfamiliar terminology and interpret the map. The application also provides explanations for 9,087 named lunar features, making scientific geography more approachable.

Rather than building separate tools for different audiences, we designed one application that progressively reveals additional scientific detail.

**Design considerations and limitations**

Scientific transparency was a central design principle. Zoriana evaluates geometric visibility. It does not model every factor necessary for a real lunar mission. Specifically:

- Sunlight availability does not guarantee usable electrical power.
- Direct Earth visibility does not guarantee a functioning communications link.
- Favorable illumination and visibility do not establish landing safety.

The application identifies NASA source data and distinguishes externally supplied information from its own calculated results. Approximate future landing locations are identified as approximate.

We also prioritized accessibility for people unfamiliar with lunar science through plain-language explanations, a first-visit guide, and responsive layouts.

We followed the Space Apps requirements concerning original artwork, NASA branding, external resources, and AI-use disclosure. The ChatGPT-generated application icon includes a visible AI indicator.

**Tools and technologies**

- JavaScript: Node.js server and browser application.
- Three.js: Interactive lunar globe, terrain visualization, and 3D rendering.
- Vite: Frontend development and build tooling.
- Python, NumPy, and Pillow: Scientific data preparation and image processing.
- Docker and Fly.io: Application packaging and hosting.
- NASA/JPL Horizons: Solar and terrestrial astronomical ephemerides.
- NASA LOLA: Lunar terrain elevation data.
- NASA Lunar Reconnaissance Orbiter: Lunar imagery and related scientific resources.

AI-assisted development tools, including OpenAI Codex and Anthropic Claude Code, contributed to coding, debugging, research, and development under the team's direction. The application icon was generated using ChatGPT and is visibly identified as AI-generated.

**Source code and references**

The complete source code, scientific methodology, validation documentation, and reference materials are publicly available: https://github.com/sftimeless/zoriana

Zoriana is an exploratory scientific and educational tool, not a certified operational lunar landing-planning system.

---

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
