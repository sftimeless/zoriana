# Zoriana — full method

The app's "Data & method" sheet gives the short version. This is the long one, moved here on November 15, 2026 so the sheet stays readable. The README adds the data sources, the checks and their numbers.

## Visibility

Body center above the sampled local terrain horizon. Craters, ridges and lunar curvature affect visibility. Eclipses of the Sun by Earth are included: when Earth’s disc moves in front of the Sun’s, the Sun counts as hidden and the globe dims, using the same JPL positions (plain geometry of two discs; Earth’s atmosphere, which makes the real shadow about 2% larger, is ignored). Antenna constraints, solar-array geometry and usable power are not modeled. Terrain off compares the same ephemerides against a flat reference horizon. The Sun and Earth tiles and the stay summary also say how much of each disc clears the skyline: the Sun is about 0.53° wide from the Moon and Earth about 1.9° (sizes taken from the JPL distance), and each is treated as a plain circle of even brightness cut by the skyline across its width. Near the poles the Sun can stay partly showing for many hours. Sunlit and Earth-in-view hours, the ranking and the comparison still count the centre of the body.

## Libration & orbit

Horizons computes each position for an observer fixed to the lunar surface at your coordinates, so the Moon’s libration and orbital variations are already included in the Sun and Earth angles shown here. No atmospheric refraction is applied because the Moon has no atmosphere.

## Sampling

Hourly JPL positions for the 30 days after the landing date, interpolated against the terrain horizon every five minutes. Durations, countdowns and crossings are estimates; short events and unresolved obstacles can be missed. Mission totals begin at the selected landing date and hour (UTC). Dates from 1950 to 2099 are accepted.

## Lunar day & comparison

The lunar-day chart covers 30 days, slightly more than one 29.5-day cycle of lunar day and night. Its bars score each possible landing day by the sunlit hours of the selected stay; “best” means most sunlit hours, with Earth visibility as the tie-break, and is not a mission recommendation. A longest stretch marked “≥” touches the edge of the 30-day window and may continue beyond it. Comparison options are a site on a landing date, aligned by mission time; differences are shown against the first option. The ranking table computes the same stay totals for every listed site on the selected date. “Sun and Earth together” counts time when both body centres are above the selected horizon at once. It is a geometric overlap, not a power or link budget. “Best landing time” searches every hour of the 30 days for the stay with the most hours of Sun and Earth together, with more sunlight as the tie-break.

## Benchmark

For the Apollo 11 landing (20 July 1969), this app gives a Sun elevation of 10.7° and azimuth of 88.8° at 20:15 UTC. The Apollo Lunar Surface Journal lists 10.65° and 88.81° at touchdown, 20:17:39 UTC. A second check used NASA’s table of Sun angles for all six Apollo landings (Apollo Lunar Surface Journal, “Working on the Moon: Thermal Environment”): across 12 landing and end-of-last-moonwalk cases this app is within 0.7° in elevation and 2.6° in azimuth, and its level-horizon sunrises fall 22 to 73 minutes from the table’s. That table and the Journal’s own JPL-based Apollo 11 figure differ from each other by about 0.35°, so the table is a looser yardstick. Working back from each pair of angles to the point where the Sun is overhead shows where the two part ways: the table’s point is a steady 0.42° east of JPL’s (about 50 minutes of Sun motion) and up to 1.8° off in latitude, reaching 2.0° from the lunar equator, where the Sun can never be more than about 1.6°. So the gap lies in the table’s Sun position, not in the sites or the terrain. These are checks of the Sun-angle chain, not a validation of terrain or timing everywhere. The terrain side was checked against NASA’s long-term average-visibility maps at ten polar points (eight in the south, two in the north): over 347 days from January 2026 the app’s share of time with any Sun in view differs from NASA’s by 3 percentage points on average, and its Earth share by 2. Nine of the ten are within 5 points. The exception is a knife-edge ridge beside Shackleton, where the app gives 84% and NASA’s pixel 68%, with NASA’s own neighbouring pixels running from 51% to 85%. So totals are good to a few points on ordinary ground and much less certain on sharp ridges, and a single sunrise or sunset time at a grazing angle can move by hours. Eclipses were checked against the two lunar eclipses of 2026: at seven sites the app’s partial phases fall inside the published first and last penumbral contacts, its total phases inside the published umbral contacts, and on March 3 every site is in totality throughout the published whole-Moon totality (11:04 to 12:03 UTC). The same check against NASA’s eclipse tables for all twelve lunar eclipses from 2026 to 2030 is consistent throughout, with each site’s eclipse centred within 14 minutes of NASA’s time. The “next eclipse” named on the site card comes from those NASA tables (2026 to 2035).

## Permanent shadow

The blue patches near both poles are NASA’s LOLA maps of permanently shadowed regions (products LPSR_75S and LPSR_75N, 120 m grid, from 75° to each pole; method in Mazarico et al. 2011), averaged to 240 m for display. NASA worked them out from LOLA terrain; this app only draws them and looks each site up in them, counting a cell as shadowed when at least half of it is. Lower latitudes are not covered. They are separate from the live shadow layer, which is coarser, so the two can disagree at edges. Permanent shadow does not prove ice is present.

## Where to land

The Map layers menu (the ring-shaped button) offers three maps drawn within 15° of each pole: the share of time, over many years, that some part of the Sun’s disc is above the terrain; the same for Earth; and the two multiplied together as a rough score. They are NASA’s LOLA average-visibility maps (AVGVISIB_75S and 75N, with their Earth versions), averaged from 120 m to 480 m cells. Brighter is better, and each map fades in over the range shown in its legend. The site card’s “Long-term average” reads the same maps, and “Find best spot within 15 km” takes the twenty best-scoring, well-separated cells nearby, runs each through the full calculation for your landing time and stay, and drops a pin on the one with the most Sun and Earth together for those dates. In the Earth view, ground outside the polar maps is drawn from plain geometry instead: blue where Earth is above level ground at the selected time, and a brighter band within about 8° of the edge of the near side, where the Moon’s rocking makes Earth rise and set. These are long-term averages over a 480 m cell, counted when any part of the disc shows; they do not replace the hour-by-hour calculation for your date, and the score is not a measured overlap of Sun and Earth. NASA’s maps end 15° from each pole, so the heat map fades out over the last five degrees rather than stopping at a hard edge. The last choice in the same menu is a slope layer within 10° of each pole, from NASA’s LOLA 80 m terrain: amber where a 320 m cell averages 5° to 10° over a 160 m baseline, red above 10°. It is a caution about steep ground, not a hazard map; rocks and small craters are far below its scale. The best-spot finder prefers candidates on ground gentler than 10°.

## Terrain & location

LOLA elevation grids. Planetocentric latitude, east-positive longitude, a 1,737.4 km reference radius and an observer 2 m above the sampled surface. Select a site for its data resolution. Named pins are exploration points, not certified landing sites.

## Place names

Search, pin descriptions and the name given to terrain that hides the Sun or Earth use the IAU and USGS list of 9,087 named lunar features. Each feature is known only by its centre and diameter, so “inside” and “near the rim of” treat it as a circle: a fair description for craters, and only used for seas and mountains when the point is well inside. Long thin features such as rilles are searchable but never used to name a place. JPL Horizons places surface sites in the same mean-Earth lunar frame as NASA’s terrain (it reports MEAN_ME). The map labels the largest named features in view and adds smaller ones as you zoom in.

## Map

The gold and blue lines from a selected site point toward the Sun and Earth at the chosen time. They are drawn dashed when the body is hidden by terrain or below the horizon. Their length is illustrative. Two dashed markers show where the Sun and Earth are directly overhead; the Earth marker wanders around the centre of the near side as the Moon librates. Earth itself is drawn in its true direction at its true size and at its JPL distance for the chosen time (it varies between roughly 356,000 and 407,000 km), lit by the same Sun, using NASA Blue Marble imagery (December, cloud-free) turned to show the face that points at the Moon at the chosen time. That turn comes from Earth’s rotation angle and the IAU model of the Moon’s rotation, which matches the JPL Sun directions used here to within about 0.15°. Its night side is drawn faintly so the globe stays readable when it is a thin crescent; clouds, city lights and seasonal changes are not shown. In Satellite mode, or whenever the Sunlight layer is off, Earth shows the plain imagery with no lighting, just as the Moon does. The Sun is drawn in its true direction at its true apparent size but far closer than it really is. Both come from the same JPL positions and distances as everything else; Earth’s is shifted from the site to the Moon’s centre.

## Landing view

A tilted camera orbits the selected site over a true-scale terrain mesh (no vertical exaggeration). South of 86.6°S it is built in the browser from the 160 m grid used by the shadow layer, within about 48 km of the site. Everywhere else the server sends a grid of heights for that site (`/api/terrain-patch`), each read from the finest LOLA grid that covers the point: 513 × 513 points, about 590 m apart over 300 km from the 474 m global grid, or about 270 m apart over 140 km within 10° of a pole from the 40 m and 80 m polar grids. Until that arrives, and if it fails, the mesh uses the coarse 3.8 km grid. The status line under the map names the spacing in use. Drag to change heading and tilt; the compass shows north. A faint camera-side fill keeps relief readable in shadow and is not sunlight. The view is illustrative; site metrics use the finer horizon model. Away from the poles (within 78° of the equator) the ground near the site also takes fine detail from NASA Moon Trek’s tiles of the LRO wide-angle camera mosaic, about 100 m per pixel, fetched from NASA when the view opens. Only the fine texture is used, so broad tone still comes from the 8K mosaic; like that mosaic it has the lighting of the day it was photographed baked in. If the tiles cannot be loaded the view keeps the 8K mosaic.

## Rendering

8K NASA CGI Moon Kit mosaic with a downsampled LOLA relief texture. Full elevation grids are processed separately for site visibility. The Sunlight layer traces rays toward the JPL Sun through LOLA elevations on a curved Moon. Ridges and crater walls cast moving shadows. For responsive interaction, visual elevations are averaged to 160 m south of 85°S and 3.8 km elsewhere; shadow masks refine after time scrubbing stops (about 300 m polar pixels and 5.3 km equatorial pixels). Sparse ray steps up to 500 km, height bias and map sampling can miss small obstacles or narrow shadows. This is approximate visual coverage, separate from the finer site horizon calculations. The mosaic contains some baked lighting which cannot move. Satellite defaults to unlit imagery; use the Sun button to show sunlight in any mode.

## Conventions

| Item | What the app uses |
|---|---|
| Time | UTC on screen. JPL Horizons returns UT, which differs from UTC by under a second; the app samples every five minutes. |
| Latitude | Planetocentric, positive north, decimal degrees. |
| Longitude | Positive east, −180° to 180°, decimal degrees. Search also accepts 0° to 360° east and hemisphere letters ("89.5S 45E"). |
| Frame | The Moon's mean-Earth frame. JPL Horizons reports MEAN_ME for surface sites, and the LOLA grids and the Apollo coordinates use the same frame. |
| Reference radius | 1,737.4 km. Elevations are heights above that sphere. |
| Observer | The terrain height at the site plus 2 m. |
| Ephemeris | Whatever JPL Horizons names in its reply, which the app passes on in its answers (`request.ephemeris`). DE441 on November 15, 2026. |
| Angles | Elevation above a level horizon; azimuth in degrees clockwise from north. "Above terrain" is elevation minus the skyline angle in that direction. No refraction: the Moon has no air. |
| Map projections | Polar grids are polar stereographic, as published by NASA's PDS (0° longitude up in the south, down in the north); the global grids are simple cylindrical. Tests in `tests/terrain.test.mjs` and `tests/psr.test.mjs` check pixel positions at both poles and across the date line. |

## Reproduce a result

Every answer can be rebuilt from one request to the app and one to JPL.

1. Ask the app: `GET /api/ephemeris?lat=-84.6&lon=31&date=2026-11-15&reference=0`. The reply has:
   - `version`: the app version that made it (also written into every CSV export);
   - `request`: exactly what was asked of JPL Horizons (centre, site coordinates and height, quantities, step, airless, time scale, ephemeris);
   - `sun` and `earth`: 745 hourly rows of time (ms, UTC), azimuth, elevation and range;
   - `terrain`: the skyline as 1,440 angles and distances (every 0.25°, out to 300 km), the site's height, the grid used, the share of samples read from each grid, and the slope.
2. To check the positions independently, send JPL the request in `request` yourself, at any step you like. `scripts/check-convergence.mjs` does this at 10-minute steps and compares.
3. For any moment, interpolate the body's azimuth and elevation between the hourly rows, look up the skyline angle at that azimuth (linear between neighbours), and subtract. Positive means in view. The app repeats this every five minutes and places each rise and set where a straight line between neighbouring tests crosses zero.
4. `scripts/check-convergence.mjs` reruns the windows with finer time steps and thinner skylines and writes `data/convergence-check.json`. On November 15, 2026 the totals at three sites were identical to 0.01 h for steps of 15, 5, 2 and 1 minutes, and the interpolation was within 0.00003° of JPL.

## Fly-by

A fly-by is a camera pass over the Landing view: it starts high, turns once around the place while coming down to a low pass, then climbs away, in 50 seconds at normal speed (it can be paused, and played at half or double speed). Nothing new is calculated for it. The ground is the Landing view's true-scale LOLA mesh, the picture is NASA's imagery, and the light and shadows are the ones calculated for the time on the clock.

- How low the camera goes depends on how fine the ground is under it: 42 km from the place it is looking at on the 590 m mesh, 22 km on the 270 m mesh, 16 km on the 160 m mesh. The camera is kept at least 1.5 km above the mesh under it.
- A fly-by started from a site card keeps your date and time, and says so if it is night there. The four listed fly-bys (Shackleton, Tycho, Copernicus, the Apollo 11 site) are for looking, so they move the landing time to a moment in the next 30 days when the Sun is up and 10° to 30° high there, or to its highest point if it never gets that high, and say what they changed it to. Feature positions come from the IAU list.
- It is a visual aid. Detail finer than the mesh, such as boulders and small craters, is in the imagery but not in the relief, and the imagery carries the lighting of the day it was photographed.

### Fly-by captions

Each fly-by shows one plain sentence per stage, and a second line of numbers for anyone who wants them. The second line follows the same "numbers" switch as the site card, so it is on by default on a computer and off on a phone, and the "123" button on the fly-by bar changes it. There is no separate version for planners, teachers and the public: everyone gets the sentence, and the numbers are one tap away.

| Stage | Sentence | Numbers |
|---|---|---|
| Approach | What the place is: the IAU name, kind and size of a named feature; a mission site's type and description; or where a pin is | Coordinates, elevation, the mesh spacing in use |
| Low pass | What the ground does: a crater's depth and central rise, or the relief around a site | The heights behind it, and the slope at the site |
| Climb out | What a lander would get: the stay summary for the landing time shown | The countdown to the next change with its "±", and the geometry-only caution |

- Everything except the three name origins is read from data already in the app: the IAU feature list, the LOLA mesh on screen, and the JPL-based stay figures.
- Crater figures are measured from the mesh on screen, not looked up. The rim is the middle value of the highest point found in each of 72 directions between 0.75 and 1.25 crater radii; the floor is the height that one fifth of the inner half lies below; the central high point is the highest ground within a quarter radius, reported only when it rises more than 600 m above the floor and stays below the rim. On November 15, 2026 this gave 4.7 km for Tycho (rim +1,290 m, floor −3,420 m, central high point 2.3 km above the floor) and 4.0 km for Shackleton, close to commonly published depths of about 4.7 km and 4.2 km.
- For a site or pin that is not a crater, the sentence is the difference between the lowest and highest ground within about 30 km.
- "Named for…" is given only for Shackleton, Tycho and Copernicus, from the origin field of the IAU Gazetteer of Planetary Nomenclature.

## Apollo 11 replay

A separate full-screen view (site card of Apollo 11, the "Mission replay" row, or `?replay=apollo11`). It is loaded only when opened and shares no state with the planning tools.

**Real.** The time of every event is from NASA SP-4029 (Apollo 11 timeline). The positions of the Moon and the Sun, and the path of the S-IVB third stage from 18 minutes after its burn toward the Moon, are JPL Horizons vectors (`public/assets/apollo11.json`, made by `scripts/prepare-apollo11.mjs`). The spacecraft rode that stage, then flew beside it, until 4 h 40 min into the flight, so for that stretch the path shown is the reconstructed real one. The landing site is the LRO-derived position used elsewhere in the app, the splashdown point is NASA's (NSSDC: 13°19′N, 169°9′W), and the launch pad is Pad 39A. Earth and Moon are turned with the Earth rotation angle and the IAU lunar rotation model, as elsewhere in the app.

**Rebuilt.** Everything between those anchors is calculated in `src/mission/apollo11.mjs` as unpowered two-body flight that passes through them at the published times: the climb (straight up for the first twelve seconds, then leaning over along a great circle to the point of orbit insertion, with height and distance over the ground following the shape of the real climb: 66 km up and 93 km out when the first stage is spent) and the parking orbit (fitted to the plane and timing of the real S-IVB path), the coast out and the coast home (Lambert arcs around Earth joined to hyperbolas around the Moon), a circular lunar orbit over the landing site, and smooth curves for the descent, ascent, rendezvous and re-entry. Checked against published figures in `tests/mission.test.mjs`: parking orbit 185.9 km and 88.2 min; 10.84 km/s at 321 km when the burn toward the Moon ends; 111 km at lunar arrival; 15.2 km where the powered descent starts; 11.03 km/s at 122 km on return; two-hour lunar orbits; no jump where one stretch hands over to the next. Speeds and heights on screen come from this reconstruction, so they are close, not exact. The speed is not shown during the climb to orbit, where the rebuilt climb is slower than the real one early on.

**Drawn.** The Saturn V, command and service module, lunar module, parachutes and launch tower are original simplified shapes built in code (`src/mission/models.mjs`) from published overall dimensions. They are at true size close up; from far away they are enlarged so they can be seen, and a note on screen gives the factor. The factor is worked out from where the camera is in the same frame and eased, so it does not jump while the vehicle is moving fast. The ground detail at the landing site, engine flames and the re-entry glow are illustrative. Launch Complex 39A is drawn in the same way (`launchComplex` in `models.mjs`): the raised hardstand with its flame trench and ramp, the mobile launcher platform, the red umbilical tower with nine swing arms and a crane, storage spheres, and the Vehicle Assembly Building 5.5 km away, from the pad's commonly published layout and overall sizes. The ground around it (`src/mission/ground.mjs`) is a drawn picture of the lie of the land, with the Atlantic shore just east of the pad, lagoons to the west and the crawlerway arriving from the south, laid over the globe at three sizes. It is not a survey and it fades out as the rocket leaves it behind.

**Approximate or simplified.** The point where the cabin met the atmosphere is an approximate position about 2,800 km short of splashdown, not taken from a table. Mid-course corrections, the two-burn shape of the lunar orbit before it was rounded off, vehicle attitudes and the rendezvous manoeuvres are simplified. Figures in the captions other than times (masses, speeds, sizes) are the commonly published values, rounded.

**Lines in the whole-route view.** Blue is the way out and orange the way home (rebuilt). The pale ring is one real lap of the Moon round the Earth from JPL Horizons, brighter over the days of the flight. The thin white line that carries on past the Moon is the real path of the spent third stage, which swung by the Moon into an orbit round the Sun; JPL's table for it ends on July 20, and so does the line.

**Small thrusters, window view and the sea.** Each ship's clusters of attitude thrusters show a flame when they would have been firing: steadily where a ship moves off, closes in or settles its propellant before a burn, and in short bursts where it is holding or changing its attitude. The times of the manoeuvres are the timeline's; which thruster fires in which burst is a fixed made-up pattern, not flight data. The window view puts the eye beside the cabin, or at the lander's forward window, inside a drawn window frame. The sea at splashdown, the foam and the parachutes settling on the water are illustrative.

**Controls.** Guided (the whole flight in about five minutes, slowing for each event), real time, or 10 to 10,000 times faster; four cameras (guided, follow, window, whole route); 27 steps with a timeline, previous and next, and an option to stop at each step.
