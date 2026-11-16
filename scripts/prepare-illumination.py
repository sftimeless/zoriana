#!/usr/bin/env python3
"""Turn NASA's LOLA polar illumination maps into the images the app draws and reads.

Sources (LRO LOLA GDR, PDS Geosciences Node, extras/illumination/img), all 7624 x 7624 grids in
polar stereographic projection at 120 m per pixel, covering 75 degrees to each pole:

  lpsr_75{s,n}_120m_201608.img            permanently shadowed regions (+20000 shadowed, -20000 not)
  avgvisib_75{s,n}_120m_201608.img        share of time any part of the Sun's disk is visible (DN x 0.00004)
  avgvisib_75{s,n}_120m_201608_earth.img  the same for Earth's disk

Outputs in public/assets, orientation unchanged (south: 0 deg longitude up; north: 0 deg down;
90 deg E to the right in both):

  psr-{south,north}-240m.png   8-bit, 2 x 2 block average: the shadowed share of each 240 m cell
  heat-{south,north}-480m.webp lossless RGB, 4 x 4 blocks: R = mean Sun share, G = mean Earth share,
                               B = highest Sun share among the 16 source pixels, each x 255

Usage: python3 scripts/prepare-illumination.py
"""
import hashlib, json, pathlib
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = 'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/extras/illumination/img/'
OUT = ROOT / 'public/assets'
SIZE = 7624
FILES = {
    'south': {'psr': 'data/lola_psr_75s_120m/lpsr_75s_120m_201608.img',
              'sun': 'data/lola_illumination/avgvisib_75s_120m_201608.img',
              'earth': 'data/lola_illumination/avgvisib_75s_120m_201608_earth.img'},
    'north': {'psr': 'data/lola_illumination/lpsr_75n_120m_201608.img',
              'sun': 'data/lola_illumination/avgvisib_75n_120m_201608.img',
              'earth': 'data/lola_illumination/avgvisib_75n_120m_201608_earth.img'},
}

def read(path):
    raw = np.fromfile(ROOT / path, dtype='<i2')
    assert raw.size == SIZE * SIZE, f'unexpected size for {path}'
    return raw.reshape(SIZE, SIZE)

def blocks(grid, block):
    n = SIZE // block
    return grid.reshape(n, block, n, block)

summary = {}
for pole, files in FILES.items():
    psr = read(files['psr'])
    assert set(np.unique(psr).tolist()) <= {-20000, 20000}
    shadow = (psr > 0).astype(np.float32)
    Image.fromarray(np.round(blocks(shadow, 2).mean(axis=(1, 3)) * 255).astype(np.uint8), 'L').save(OUT / f'psr-{pole}-240m.png', optimize=True)

    sun = read(files['sun']).astype(np.float32) * 4e-5
    earth = read(files['earth']).astype(np.float32) * 4e-5
    assert 0 <= sun.min() and sun.max() <= 1 and 0 <= earth.min() and earth.max() <= 1
    to8 = lambda a: np.round(a * 255).astype(np.uint8)
    rgb = np.dstack([to8(blocks(sun, 4).mean(axis=(1, 3))), to8(blocks(earth, 4).mean(axis=(1, 3))), to8(blocks(sun, 4).max(axis=(1, 3)))])
    Image.fromarray(rgb, 'RGB').save(OUT / f'heat-{pole}-480m.webp', lossless=True, quality=90, method=6)

    summary[pole] = {
        'sources': {kind: {'url': BASE + pathlib.Path(path).name, 'sha256': hashlib.sha256((ROOT / path).read_bytes()).hexdigest()} for kind, path in files.items()},
        'shadowedAreaKm2': round(float(shadow.sum() * 0.0144)),
        'highestSunShare': round(float(sun.max()), 3),
        'medianSunShare': round(float(np.median(sun[::4, ::4])), 3),
        'outputs': [f'public/assets/psr-{pole}-240m.png', f'public/assets/heat-{pole}-480m.webp'],
    }
print(json.dumps(summary, indent=1))
(ROOT / 'data/illumination-manifest.json').write_text(json.dumps({'gridMeters': 120, 'size': SIZE, 'extentKm': SIZE * 0.12, 'coversDegreesFromPole': 15, **summary}, indent=1) + '\n')
