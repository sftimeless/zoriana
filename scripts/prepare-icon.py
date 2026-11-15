#!/usr/bin/env python3
"""Make the app's icon files from the team's official icon image.

The source is a 1254 x 1254 picture of a rounded-square icon on a white canvas, made with ChatGPT,
an AI image tool. This script crops it to the rounded square, makes the corners transparent, adds
the visible mark that NASA Space Apps requires on AI-generated images in the lower-right corner
(the letters "AI", the same on every size), and writes the three sizes the app uses. Nothing in the artwork is redrawn.
Pass --no-mark to write the files without the mark.

Usage: python3 scripts/prepare-icon.py "/path/to/icon source.png" [--no-mark]
"""
import pathlib, sys
from PIL import Image, ImageDraw, ImageFont

OUT = pathlib.Path(__file__).resolve().parent.parent / 'public/assets'
CX, CY, HALF, RADIUS = 624.75, 630.25, 526.0, 253.0   # measured outline of the rounded square
FONTS = ['/System/Library/Fonts/Helvetica.ttc', '/System/Library/Fonts/Supplemental/Arial Bold.ttf']

def font(size):
    for path in FONTS:
        try: return ImageFont.truetype(path, size, index=1 if path.endswith('.ttc') else 0)
        except OSError: pass
    return ImageFont.load_default(size)

def squircle(src):
    box = (round(CX - HALF), round(CY - HALF), round(CX + HALF), round(CY + HALF))
    crop = src.convert('RGB').crop(box); w, h = crop.size; s = 4
    mask = Image.new('L', (w * s, h * s), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w * s - 1, h * s - 1), radius=RADIUS * s, fill=255)
    crop = crop.convert('RGBA'); crop.putalpha(mask.resize((w, h), Image.LANCZOS)); return crop

def marked(icon, size, text):
    """A dark pill with white text in the lower-right corner, drawn at the final size so it stays sharp."""
    image = icon.resize((size, size), Image.LANCZOS); scale = 4; full = size * scale
    layer = Image.new('RGBA', (full, full), (0, 0, 0, 0)); draw = ImageDraw.Draw(layer)
    f = font(round(full * (.17 if len(text) < 4 else .075)))
    left, top, right, bottom = draw.textbbox((0, 0), text, font=f); tw, th = right - left, bottom - top
    pad_x, pad_y = th * .5, th * .36; w, h = tw + 2 * pad_x, th + 2 * pad_y
    x = full * .93 - w; y = full * .925 - h          # tucked inside the rounded corner
    draw.rounded_rectangle((x, y, x + w, y + h), radius=h / 2, fill=(0, 0, 0, 215))
    draw.text((x + pad_x - left, y + pad_y - top), text, font=f, fill=(255, 255, 255, 255))
    image.alpha_composite(layer.resize((size, size), Image.LANCZOS)); return image

if __name__ == '__main__':
    icon = squircle(Image.open(sys.argv[1]))
    for size, name, text in ((512, 'icon-512.png', 'AI'), (192, 'icon-192.png', 'AI'), (64, 'favicon.png', 'AI')):
        image = icon.resize((size, size), Image.LANCZOS) if '--no-mark' in sys.argv else marked(icon, size, text)
        image.save(OUT / name, optimize=True); print('wrote', name)
    # Browsers also look for these two at the site root, whatever the page's own links say.
    small = marked(icon, 64, 'AI') if '--no-mark' not in sys.argv else icon.resize((64, 64), Image.LANCZOS)
    small.save(OUT.parent / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)]); print('wrote favicon.ico')
    touch = marked(icon, 180, 'AI') if '--no-mark' not in sys.argv else icon.resize((180, 180), Image.LANCZOS)
    background = Image.new('RGBA', touch.size, (0, 0, 0, 255)); background.alpha_composite(touch)
    background.convert('RGB').save(OUT.parent / 'apple-touch-icon.png', optimize=True); print('wrote apple-touch-icon.png')
