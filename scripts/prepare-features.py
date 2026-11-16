#!/usr/bin/env python3
"""Turn the IAU/USGS list of named lunar features into the compact file the app searches.

Source: "Planetary Nomenclature of the Moon" center points (IAU and USGS Astrogeology, public
domain), MOON_nomenclature_center_pts.zip from https://planetarynames.wr.usgs.gov/GIS_Downloads,
unpacked into data/iau/extracted/. Output: public/assets/features.json, one entry per feature:
[name, latitude, east longitude (-180 to 180), diameter in km, kind, origin]. The origin is the IAU's own note on
what the name means or whom it honors; lettered satellite craters share their parent's and carry none.

Usage: python3 -I scripts/prepare-features.py
"""
import json, pathlib, struct

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'data/iau/extracted/MOON_nomenclature_center_pts.dbf'
KINDS = {'Satellite Feature': 'Satellite crater', 'Astronaut-named features': 'Astronaut-named feature'}

def read_dbf(path):
    with open(path, 'rb') as f:
        count, header_length, record_length = struct.unpack('<xxxxIHH', f.read(32)[:12])
        fields = []
        while True:
            d = f.read(32)
            if d[0] == 0x0d: break
            fields.append((d[:11].split(b'\0')[0].decode(), d[16]))
        f.seek(header_length)
        for _ in range(count):
            record, position, row = f.read(record_length), 1, {}
            for name, length in fields:
                row[name] = record[position:position + length].decode('utf-8', 'replace').strip(); position += length
            yield row

features = []
for row in read_dbf(SOURCE):
    if row['approval'] != 'Adopted by IAU': continue
    lon = float(row['center_lon']); lon = lon - 360 if lon > 180 else lon
    kind = KINDS.get(row['type'], row['type'].split(',')[0])
    entry = [row['clean_name'] or row['name'], round(float(row['center_lat']), 4), round(lon, 4), round(float(row['diameter']), 1), kind]
    if row['type'] != 'Satellite Feature' and row['origin']: entry.append(row['origin'])
    features.append(entry)
features.sort(key=lambda f: -f[3])
(ROOT / 'public/assets/features.json').write_text(json.dumps(features, ensure_ascii=False, separators=(',', ':')))
print(len(features), 'features;', 'largest:', features[0][:4], '; example:', next(f for f in features if f[0] == 'Shackleton'))
