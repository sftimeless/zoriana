"""Convert freshly downloaded NASA LOLA data without changing its heights."""
from pathlib import Path
import json, hashlib
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1]
a=np.asarray(Image.open(root/'data/ldem_16.tif'),dtype=np.float32)
assert a.shape==(2880,5760) and np.isfinite(a).all()
# NASA SVS LDEM float TIFF is kilometers relative to 1737.4 km; preserve 0.5m units.
raw=np.rint(a*2000).astype('<i2')
raw.tofile(root/'data/global-height.i16')
# A small separate GPU-only height texture. Scientific calculations use full grids.
visual=a.reshape(360,8,720,8).mean(axis=(1,3))*1000
visual.astype('<f4').tofile(root/'public/assets/terrain-visual.f32')
# Separate visual shadow grids; full-resolution site analysis is unchanged.
(a.reshape(1440,2,2880,2).mean(axis=(1,3))*1000).astype('<f4').tofile(root/'public/assets/shadow-global.f32')
polar=root/'data/ldem_85s_40m.img'
assert polar.stat().st_size==7584*7584*2
p=np.fromfile(polar,dtype='<i2').reshape(7584,7584).astype('f4')*.5
p.reshape(1896,4,1896,4).mean(axis=(1,3)).astype('<f4').tofile(root/'public/assets/shadow-south.f32')
manifest={'global':{'width':5760,'height':2880,'scaleMeters':0.5,'pixelsPerDegree':16,'source':'https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_16.tif'},'south':{'width':7584,'height':7584,'scaleMeters':0.5,'gridMeters':40,'source':'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/ldem_85s_40m.img'},'sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [root/'data/ldem_16.tif',polar]},'referenceRadiusMeters':1737400,'observerHeightMeters':2}
# Optional wider south-polar grid (80°S to the pole at 80 m). It is read as-is by terrain-worker.mjs.
wide=root/'data/lola_80s_80m/ldem_80s_80m.img'
if wide.exists():
    assert wide.stat().st_size==7600*7600*2
    manifest['south80']={'width':7600,'height':7600,'scaleMeters':0.5,'gridMeters':80,'path':'data/lola_80s_80m/ldem_80s_80m.img','source':'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/ldem_80s_80m.img','note':'Optional. Used directly by terrain-worker.mjs for site horizons and slope between 80°S and 85°S; not converted.'}
    manifest['sha256'][wide.name]=hashlib.sha256(wide.read_bytes()).hexdigest()
(root/'data/terrain-manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
print('Prepared quantitative global and south-pole LOLA grids; 720 x 360 visual texture is separate.')
