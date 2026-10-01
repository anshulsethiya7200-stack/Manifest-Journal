import zlib
import struct
import math
import os

def create_png(width, height, get_pixel_func):
    """
    Generate an RGBA PNG using standard library zlib and struct.
    """
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type 0 (None)
        for x in range(width):
            r, g, b, a = get_pixel_func(x, y, width, height)
            raw_data.extend((int(r), int(g), int(b), int(a)))
    
    compressed = zlib.compress(bytes(raw_data), 9)
    
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    
    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff)
    png.extend(struct.pack('>I', len(ihdr_data)))
    png.extend(b'IHDR')
    png.extend(ihdr_data)
    png.extend(ihdr_crc)
    
    # IDAT
    idat_crc = struct.pack('>I', zlib.crc32(b'IDAT' + compressed) & 0xffffffff)
    png.extend(struct.pack('>I', len(compressed)))
    png.extend(b'IDAT')
    png.extend(compressed)
    png.extend(idat_crc)
    
    # IEND
    iend_crc = struct.pack('>I', zlib.crc32(b'IEND') & 0xffffffff)
    png.extend(struct.pack('>I', 0))
    png.extend(b'IEND')
    png.extend(iend_crc)
    
    return bytes(png)

def render_logo(x, y, w, h, maskable=False):
    # Normalized coords [0, 1]
    nx = x / (w - 1)
    ny = y / (h - 1)
    
    if maskable:
        # Full bleed gradient, scaled inner logo
        # Shift coords to inner safe zone
        cx = (nx - 0.5) / 0.78 + 0.5
        cy = (ny - 0.5) / 0.78 + 0.5
    else:
        cx = nx
        cy = ny

    # Base background: Royal Electric Blue squircle
    # Distance from center for squircle: (|x|^4 + |y|^4)^(1/4)
    dx = (nx - 0.5) * 2.0
    dy = (ny - 0.5) * 2.0
    
    # Squircle radius
    dist_sq = (abs(dx)**4 + abs(dy)**4)**0.25
    
    if not maskable and dist_sq > 0.94:
        # Transparent outside squircle
        edge = max(0.0, min(1.0, (1.0 - dist_sq) / 0.06))
        if edge <= 0:
            return (0, 0, 0, 0)
        alpha_mult = edge
    else:
        alpha_mult = 1.0

    # Gradient: from top left #1954f5 to bottom right #061f96
    t = (nx + ny) * 0.5
    r_bg = int(25 * (1 - t) + 6 * t)
    g_bg = int(84 * (1 - t) + 31 * t)
    b_bg = int(245 * (1 - t) + 150 * t)

    # Now render features in (cx, cy) coords
    # Check 4-point golden star around (0.5, 0.28)
    star_cx = 0.5
    star_cy = 0.28
    sdx = abs(cx - star_cx)
    sdy = abs(cy - star_cy)
    
    # Star curve: |sdx|^0.5 + |sdy|^0.5 <= radius^0.5
    star_r = 0.12
    # Astroid formula for 4-pointed star
    if (sdx**0.6 + sdy**0.6) < (star_r**0.6):
        # Golden star
        star_t = math.sqrt(sdx*sdx + sdy*sdy) / star_r
        sr = 255
        sg = int(245 * (1 - star_t) + 215 * star_t)
        sb = int(120 * (1 - star_t) + 30 * star_t)
        return (sr, sg, sb, int(255 * alpha_mult))
    
    # Check Star Glow
    star_dist = math.sqrt(sdx*sdx + sdy*sdy)
    if star_dist < 0.16:
        glow_factor = (1.0 - star_dist / 0.16) * 0.35
        r_bg = min(255, int(r_bg + (255 - r_bg) * glow_factor))
        g_bg = min(255, int(g_bg + (235 - g_bg) * glow_factor))
        b_bg = min(255, int(b_bg + (100 - b_bg) * glow_factor))

    # Open Journal Book in lower half: cy from 0.48 to 0.78, cx from 0.20 to 0.80
    book_w = 0.32
    if 0.48 <= cy <= 0.78 and abs(cx - 0.5) <= book_w:
        side = (cx - 0.5) / book_w  # -1 (left) to 1 (right)
        v_pos = (cy - 0.48) / 0.30  # 0 (top) to 1 (bottom)
        
        # Arch curvature for open pages
        page_curve = 0.04 * (1.0 - side*side)
        if (v_pos >= page_curve) and (v_pos <= 0.95 + page_curve * 0.5):
            # Inside book pages!
            # Crease in center
            if abs(side) < 0.03:
                return (215, 222, 235, int(255 * alpha_mult))
            
            # Right page: draw pen if around side = 0.45, v_pos = 0.35 to 0.75
            p_dx = side - 0.42
            p_dy = v_pos - 0.52
            # Rotate pen ~ -15 deg
            rot_x = p_dx * 0.96 + p_dy * 0.26
            rot_y = -p_dx * 0.26 + p_dy * 0.96
            if abs(rot_x) < 0.025 and abs(rot_y) < 0.18:
                # Pen body: navy blue with gold tip
                if rot_y > 0.12:
                    return (255, 215, 0, int(255 * alpha_mult)) # Gold tip
                return (11, 40, 180, int(255 * alpha_mult))     # Navy blue pen
            
            # Ruled lines on left page (side < -0.15)
            if side < -0.12 and abs(side) < 0.85:
                line_y1 = abs(v_pos - 0.32)
                line_y2 = abs(v_pos - 0.48)
                line_y3 = abs(v_pos - 0.64)
                if line_y1 < 0.015 or line_y2 < 0.015 or line_y3 < 0.015:
                    return (138, 172, 245, int(255 * alpha_mult))
            
            # White page with slight ambient gradient
            page_shade = int(255 - 15 * abs(side))
            return (page_shade, page_shade, page_shade, int(255 * alpha_mult))

    return (r_bg, g_bg, b_bg, int(255 * alpha_mult))

targets = [
    ('/public/icons/icon-48.png', 48, False),
    ('/public/icons/icon-72.png', 72, False),
    ('/public/icons/icon-96.png', 96, False),
    ('/public/icons/icon-128.png', 128, False),
    ('/public/icons/icon-192.png', 192, False),
    ('/public/icons/icon-512.png', 512, False),
    ('/public/icons/badge-72.png', 72, False),
    ('/public/icons/shortcut-journal.png', 192, False),
    ('/public/icons/shortcut-script.png', 192, False),
    ('/public/icons/shortcut-goals.png', 192, False),
    ('/public/icons/icon-maskable-192.png', 192, True),
    ('/public/icons/icon-maskable-512.png', 512, True),
    ('/public/apple-touch-icon.png', 180, False),
    ('/public/pwa-192x192.png', 192, False),
    ('/public/pwa-512x512.png', 512, False),
    ('/public/pwa-maskable-512x512.png', 512, True),
]

os.makedirs('/public/icons', exist_ok=True)

for path, size, maskable in targets:
    png_bytes = create_png(size, size, lambda x, y, w, h: render_logo(x, y, w, h, maskable))
    with open(path, 'wb') as f:
        f.write(png_bytes)
    print(f"Created {path} ({size}x{size})")

print("All PNG icons created successfully!")
