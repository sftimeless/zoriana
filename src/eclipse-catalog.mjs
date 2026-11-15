// Lunar eclipses 2026-2035, from NASA's eclipse tables (Fred Espenak, NASA GSFC):
// https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2021.html and LEdecade2031.html.
// Each is a moment when Earth passes in front of the Sun as seen from the Moon. `greatest` is the
// time of greatest eclipse in Terrestrial Dynamical Time, which runs a little over a minute ahead
// of UTC in these years. `kind` is how the eclipse looks from Earth: Total (the whole Moon enters
// Earth's full shadow), Partial (part of it does), or Penumbral (the Moon only enters the outer
// shadow, so only some places on the Moon see the Sun partly covered, and none see it fully hidden).
// The list is used only to point to the next eclipse; what a site actually sees is computed from
// JPL positions in eclipse.mjs.
export const LUNAR_ECLIPSES=[
 ['2026-03-03','11:34:52','Total'],['2026-08-28','04:14:04','Partial'],
 ['2027-02-20','23:14:06','Penumbral'],['2027-07-18','16:04:09','Penumbral'],['2027-08-17','07:14:59','Penumbral'],
 ['2028-01-12','04:14:13','Partial'],['2028-07-06','18:20:57','Partial'],['2028-12-31','16:53:15','Total'],
 ['2029-06-26','03:23:22','Total'],['2029-12-20','22:43:12','Total'],
 ['2030-06-15','18:34:34','Partial'],['2030-12-09','22:28:51','Penumbral'],
 ['2031-05-07','03:52:02','Penumbral'],['2031-06-05','11:45:17','Penumbral'],['2031-10-30','07:46:45','Penumbral'],
 ['2032-04-25','15:14:51','Total'],['2032-10-18','19:03:40','Total'],
 ['2033-04-14','19:13:51','Total'],['2033-10-08','10:56:23','Total'],
 ['2034-04-03','19:06:59','Penumbral'],['2034-09-28','02:47:37','Partial'],
 ['2035-02-22','09:06:12','Penumbral'],['2035-08-19','01:12:15','Partial']
].map(([date,greatest,kind])=>({date,greatest,kind,time:Date.parse(`${date}T${greatest}Z`)}));

// The first listed eclipse after a moment, or null past the end of the list.
export const nextListedEclipse=time=>LUNAR_ECLIPSES.find(e=>e.time>time)??null;
