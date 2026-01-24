"""
Generate Avaia app icon
Creates a simple gradient icon with the letter A
"""

import subprocess
import os
import tempfile

def create_icon():
    """Create icon using system tools and SVG"""

    # SVG content for the icon
    svg_content = '''<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="228" fill="url(#bg)"/>
  <text x="512" y="700" font-family="SF Pro Display, -apple-system, sans-serif"
        font-size="600" font-weight="600" fill="white" text-anchor="middle">A</text>
</svg>'''

    # Create temp directory for iconset
    icon_dir = os.path.dirname(os.path.abspath(__file__))
    iconset_path = os.path.join(icon_dir, 'Avaia.iconset')
    os.makedirs(iconset_path, exist_ok=True)

    # Write SVG to temp file
    svg_path = os.path.join(tempfile.gettempdir(), 'avaia_icon.svg')
    with open(svg_path, 'w') as f:
        f.write(svg_content)

    # Icon sizes needed for icns
    sizes = [16, 32, 64, 128, 256, 512, 1024]

    print("Generating icon sizes...")

    # Try using qlmanage or sips to convert SVG to PNG
    # First create a 1024px PNG from SVG using rsvg-convert or similar
    png_1024 = os.path.join(tempfile.gettempdir(), 'avaia_1024.png')

    # Try different methods to convert SVG to PNG
    converted = False

    # Method 1: Try rsvg-convert (if installed via homebrew)
    try:
        subprocess.run(
            ['rsvg-convert', '-w', '1024', '-h', '1024', svg_path, '-o', png_1024],
            check=True, capture_output=True
        )
        converted = True
    except:
        pass

    # Method 2: Try using qlmanage
    if not converted:
        try:
            subprocess.run(
                ['qlmanage', '-t', '-s', '1024', '-o', tempfile.gettempdir(), svg_path],
                check=True, capture_output=True
            )
            ql_output = svg_path + '.png'
            if os.path.exists(ql_output):
                os.rename(ql_output, png_1024)
                converted = True
        except:
            pass

    # Method 3: Create a simple PNG using Python
    if not converted:
        print("Creating icon using Python...")
        try:
            from PIL import Image, ImageDraw, ImageFont

            # Create gradient background
            img = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)

            # Draw rounded rectangle with gradient simulation
            for y in range(1024):
                r = int(99 + (139 - 99) * y / 1024)
                g = int(102 + (92 - 102) * y / 1024)
                b = int(241 + (246 - 241) * y / 1024)
                draw.line([(0, y), (1024, y)], fill=(r, g, b, 255))

            # Create rounded corners mask
            mask = Image.new('L', (1024, 1024), 0)
            mask_draw = ImageDraw.Draw(mask)
            mask_draw.rounded_rectangle([(0, 0), (1024, 1024)], radius=228, fill=255)
            img.putalpha(mask)

            # Add letter A
            try:
                font = ImageFont.truetype('/System/Library/Fonts/SFNSDisplay.ttf', 600)
            except:
                try:
                    font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 600)
                except:
                    font = ImageFont.load_default()

            # Get text bounding box and center it
            bbox = draw.textbbox((0, 0), 'A', font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            x = (1024 - text_width) // 2
            y = (1024 - text_height) // 2 - 80

            draw.text((x, y), 'A', fill='white', font=font)

            img.save(png_1024)
            converted = True
        except ImportError:
            print("PIL not available, creating minimal icon...")

    # If still not converted, create a minimal placeholder
    if not converted:
        # Create a simple colored PNG using pure Python
        import struct
        import zlib

        def create_minimal_png(width, height, color):
            def png_chunk(chunk_type, data):
                chunk_len = len(data)
                chunk_crc = zlib.crc32(chunk_type + data)
                return struct.pack('>I', chunk_len) + chunk_type + data + struct.pack('>I', chunk_crc & 0xffffffff)

            # PNG signature
            signature = b'\x89PNG\r\n\x1a\n'

            # IHDR chunk
            ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
            ihdr = png_chunk(b'IHDR', ihdr_data)

            # IDAT chunk (image data)
            raw_data = b''
            for y in range(height):
                raw_data += b'\x00'  # filter type
                for x in range(width):
                    raw_data += bytes(color)

            compressed = zlib.compress(raw_data)
            idat = png_chunk(b'IDAT', compressed)

            # IEND chunk
            iend = png_chunk(b'IEND', b'')

            return signature + ihdr + idat + iend

        # Create purple icon
        png_data = create_minimal_png(1024, 1024, [99, 102, 241])
        with open(png_1024, 'wb') as f:
            f.write(png_data)
        converted = True

    if not converted:
        print("Could not create icon. Please provide icon.icns manually.")
        return False

    # Generate different sizes using sips
    print("Generating icon sizes with sips...")
    for size in sizes:
        # Standard resolution
        output = os.path.join(iconset_path, f'icon_{size}x{size}.png')
        subprocess.run(
            ['sips', '-z', str(size), str(size), png_1024, '--out', output],
            capture_output=True
        )

        # @2x resolution (for retina, where applicable)
        if size <= 512:
            output_2x = os.path.join(iconset_path, f'icon_{size}x{size}@2x.png')
            subprocess.run(
                ['sips', '-z', str(size * 2), str(size * 2), png_1024, '--out', output_2x],
                capture_output=True
            )

    # Convert iconset to icns
    icns_path = os.path.join(icon_dir, 'icon.icns')
    print(f"Creating {icns_path}...")
    result = subprocess.run(
        ['iconutil', '-c', 'icns', iconset_path, '-o', icns_path],
        capture_output=True
    )

    if result.returncode == 0:
        print(f"Icon created: {icns_path}")
        # Cleanup
        import shutil
        shutil.rmtree(iconset_path, ignore_errors=True)
        return True
    else:
        print(f"iconutil failed: {result.stderr.decode()}")
        return False


if __name__ == '__main__':
    create_icon()
