#!/usr/bin/env python3
"""Turn NASA's LOLA permanently-shadowed-region map into the mask the app draws.

Source: LRO LOLA GDR, lpsr_75s_120m_201608.img (PDS Geosciences Node), a 7624 x 7624 grid in
south polar stereographic projection at 120 m per pixel covering 75°S to the pole. Each sample is
+20000 (permanently shadowed) or -20000 (not). This script averages 2 x 2 blocks into an 8-bit
PNG at 240 m per pixel, so each output pixel is the shadowed share of that cell (0-255). The
orientation is unchanged: 0° longitude toward the top, 90°E to the right.

Usage: python3 scripts/prepare-psr.py
"""
import hashlib, json, pathlib
import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'data/lola_psr_75s_120m/lpsr_75s_120m_201608.img'
OUTPUT = ROOT / 'public/assets/psr-south-240m.png'
SIZE, BLOCK = 7624, 2

raw = np.fromfile(SOURCE, dtype='<i2')
assert raw.size == SIZE * SIZE, 'unexpected file size'
values = set(np.unique(raw).tolist())
assert values <= {-20000, 20000}, f'unexpected sample values {values}'
shadow = (raw.reshape(SIZE, SIZE) > 0).astype(np.float32)
n = SIZE // BLOCK
mask = shadow.reshape(n, BLOCK, n, BLOCK).mean(axis=(1, 3))
Image.fromarray(np.round(mask * 255).astype(np.uint8), 'L').save(OUTPUT, optimize=True)

km2 = shadow.sum() * 0.12 * 0.12
summary = {
    'source': 'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/extras/illumination/img/lpsr_75s_120m_201608.img',
    'sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'sourceGridMeters': 120, 'maskGridMeters': 120 * BLOCK, 'maskSize': n,
    'extentKm': SIZE * 0.12, 'northLimitDegrees': -75,
    'shadowedAreaKm2': round(float(km2)),
    'output': str(OUTPUT.relative_to(ROOT)),
}
print(json.dumps(summary, indent=1))
