import hashlib, json
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parent.parent
im = Image.open(root / 'assets/compass-idle.png')
assert im.mode == 'RGBA' and im.size == (1536, 1024)
hashes = []
for row in range(4):
    for col in range(6):
        frame = im.crop((col*256, row*256, (col+1)*256, (row+1)*256))
        alpha = frame.getchannel('A')
        for box in [(0,0,256,1),(0,255,256,256),(0,0,1,256),(255,0,256,256)]:
            assert alpha.crop(box).getextrema() == (0,0)
        hashes.append(hashlib.sha256(frame.tobytes()).hexdigest())
assert len(set(hashes)) == 24
print('PASS: RGBA 1536x1024, 24 unique 256x256 frames; all outer edges fully transparent.')
