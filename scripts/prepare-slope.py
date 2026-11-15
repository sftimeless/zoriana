#!/usr/bin/env python3
"""Make the polar slope maps the app draws, from NASA's LOLA 80 m polar elevation grids.

Sources: LDEM_80S_80M and LDEM_80N_80M (LRO LOLA GDR, PDS Geosciences Node), 7600 x 7600 grids of
heights in half-metres, polar stereographic, 80 m per pixel, covering 80 degrees to each pole.

Slope at each pixel is the steepest gradient from central differences across the two neighbours
either side (a 160 m baseline), the same baseline the site card uses between 80 and 85 degrees
south. The map is then reduced to 320 m cells (4 x 4 blocks):
  R = mean slope in the cell, G = steepest slope in the cell, each in quarter-degrees (0-255).
Orientation is unchanged (south: 0 deg longitude up; north: 0 deg down). The projection's scale
error at 80 degrees latitude is under 1% and is ignored.

Usage: python3 scripts/prepare-slope.py
"""
import json, pathlib
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SIZE, GRID, BLOCK = 7600, 80.0, 4
FILES = {'south': 'data/lola_80s_80m/ldem_80s_80m.img', 'north': 'data/lola_80n_80m/ldem_80n_80m.img'}

summary = {}
for pole, path in FILES.items():
    raw = np.fromfile(ROOT / path, dtype='<i2')
    assert raw.size == SIZE * SIZE, f'unexpected size for {path}'
    height = raw.reshape(SIZE, SIZE).astype(np.float32) * 0.5
    dx = np.zeros_like(height); dy = np.zeros_like(height)
    dx[:, 1:-1] = (height[:, 2:] - height[:, :-2]) / (2 * GRID)
    dy[1:-1, :] = (height[2:, :] - height[:-2, :]) / (2 * GRID)
    slope = np.degrees(np.arctan(np.hypot(dx, dy)))
    n = SIZE // BLOCK
    blocks = slope.reshape(n, BLOCK, n, BLOCK)
    encode = lambda a: np.clip(np.round(a * 4), 0, 255).astype(np.uint8)
    rgb = np.dstack([encode(blocks.mean(axis=(1, 3))), encode(blocks.max(axis=(1, 3))), np.zeros((n, n), np.uint8)])
    out = ROOT / f'public/assets/slope-{pole}-320m.webp'
    Image.fromarray(rgb, 'RGB').save(out, lossless=True, quality=90, method=6)
    mean = blocks.mean(axis=(1, 3))
    summary[pole] = {'source': path, 'output': str(out.relative_to(ROOT)), 'cells': n, 'cellMeters': GRID * BLOCK, 'baselineMeters': 2 * GRID,
                     'medianSlopeDegrees': round(float(np.median(mean)), 1),
                     'shareUnder5Degrees': round(float((mean < 5).mean()), 3), 'shareOver10Degrees': round(float((mean > 10).mean()), 3)}
print(json.dumps(summary, indent=1))
