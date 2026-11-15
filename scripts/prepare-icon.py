#!/usr/bin/env python3
"""Make the app's icon files from the team's official icon image.

The source is a 1254 x 1254 picture of a rounded-square icon on a white canvas, made with an AI
image tool. This script crops it to the rounded square, makes the corners transparent, adds the
visible "AI-generated" mark (shortened to "AI" on the small sizes, where the full words would be unreadable) that NASA Space Apps requires on AI-generated images, and writes the
three sizes the app uses. Nothing in the artwork is redrawn.

Usage: python3 scripts/prepare-icon.py "/path/to/icon source.png"
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
    """A dark pill with white text along the bottom edge, drawn at the final size so it stays sharp."""
    image = icon.resize((size, size), Image.LANCZOS); scale = 4
    layer = Image.new('RGBA', (size * scale, size * scale), (0, 0, 0, 0)); draw = ImageDraw.Draw(layer)
    f = font(round(size * scale * (.2 if len(text) < 4 else .085)))
    left, top, right, bottom = draw.textbbox((0, 0), text, font=f); tw, th = right - left, bottom - top
    pad_x, pad_y = th * .55, th * .38; w, h = tw + 2 * pad_x, th + 2 * pad_y
    x = (size * scale - w) / 2; y = size * scale * (.97 if len(text) < 4 else .955) - h
    draw.rounded_rectangle((x, y, x + w, y + h), radius=h / 2, fill=(0, 0, 0, 205))
    draw.text((x + pad_x - left, y + pad_y - top), text, font=f, fill=(255, 255, 255, 255))
    image.alpha_composite(layer.resize((size, size), Image.LANCZOS)); return image

if __name__ == '__main__':
    icon = squircle(Image.open(sys.argv[1]))
    for size, name, text in ((512, 'icon-512.png', 'AI-generated'), (192, 'icon-192.png', 'AI'), (64, 'favicon.png', 'AI')):
        marked(icon, size, text).save(OUT / name, optimize=True); print('wrote', name)
