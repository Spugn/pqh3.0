"""
HOW TO USE:
`python deserialize.py <import_path> <export_path>`

REQUIRED DEPENDENCIES:
- lz4       `pip install lz4`
- Pillow    `pip install Pillow`
- decrunch  `pip install decrunch`
- UnityPack (provided), the version from `pip install unitypack` causes issues i cant be bothered to debug
"""

import sys
from io import BytesIO
from vendor.UnityPack import unitypack

def open_texture2d(import_path, export_path, is_still):
    with open(import_path, 'rb') as f:
        bundle = unitypack.load(f)
        for asset in bundle.assets:
            for id, object in asset.objects.items():
                if object.type == 'Texture2D':
                    data = object.read()
                    try:
                        from PIL import ImageOps
                    except ImportError:
                        print('ImportError')
                        continue
                    try:
                        image = data.image
                    except NotImplementedError:
                        print('\tNotImplementedError')
                        continue
                    if image is None:
                        print('\tEmpty Image')
                        continue
                    if is_still == True:
                        if not "still_unit_" in data.name:
                            # getting rid of fx_tx_ stuff or maybe other junk
                            continue
                        if "_mask" in data.name or "_effect" in data.name:
                            # stills have 3 or more parts, the plain image + mask + effect + maybe more
                            # if this is the effect/mask then ignore
                            continue
                    img = ImageOps.flip(image)
                    output = BytesIO()
                    img.save(output, format='png')

                    with open(export_path, 'wb') as fi:
                        fi.write(output.getvalue())
                        print('<DESERIALIZE>', import_path, '->', export_path)

                    if is_still:
                        # leave early just in case theres more images that i didnt catch
                        # mostly betting on that the still we need is the first asset
                        break


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print('Not enough arguments.')
        sys.exit()
    open_texture2d(sys.argv[1], sys.argv[2], sys.argv[3])
