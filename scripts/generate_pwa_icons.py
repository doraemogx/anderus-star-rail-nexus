"""Generate PWA launch icons without external dependencies."""
from pathlib import Path
import math,struct,zlib
ROOT=Path(__file__).resolve().parents[1]/"assets"/"pwa"
ROOT.mkdir(parents=True,exist_ok=True)
def write_png(size):
  rows=[]
  for y in range(size):
    row=bytearray([0])
    for x in range(size):
      d=math.hypot(x/size-.39,y/size-.27)
      f=max(0,1.0-d)
      c=[int(6+21*f),int(15+35*f),int(30+59*f)]
      px=x*512/size;py=y*512/size
      # Tall tapered astral compass spikes, using barycentric point-in-polygon.
      def inside(poly):
        sign=None
        for i in range(len(poly)):
          x1,y1=poly[i];x2,y2=poly[(i+1)%len(poly)]
          cross=(px-x1)*(y2-y1)-(py-y1)*(x2-x1)
          if abs(cross)<.001:continue
          this=cross>0
          if sign is None:sign=this
          elif sign!=this:return False
        return True
      big=[(256,89),(288,224),(423,256),(288,288),(256,423),(224,288),(89,256),(224,224)]
      small=[(256,171),(272,240),(341,256),(272,272),(256,341),(240,272),(171,256),(240,240)]
      # winding includes concave star; even-odd ray crossing
      def polygon(points):
        yes=False
        for i in range(len(points)):
          ax,ay=points[i];bx,by=points[i-1]
          if (ay>py)!=(by>py) and px<(bx-ax)*(py-ay)/(by-ay)+ax:yes=not yes
        return yes
      if polygon(big):c=[230,192,121]
      if polygon(small):c=[11,29,52]
      if (px-256)**2+(py-256)**2<8**2:c=[255,235,171]
      row.extend(c)
    rows.append(row)
  raw=b''.join(rows)
  def chunk(tag,data):
    return struct.pack('>I',len(data))+tag+data+struct.pack('>I',zlib.crc32(tag+data)&0xffffffff)
  png=b'\x89PNG\r\n\x1a\n'
  png+=chunk(b'IHDR',struct.pack('>IIBBBBB',size,size,8,2,0,0,0))
  png+=chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b'')
  out=ROOT/f'icon-{size}.png';out.write_bytes(png)
  print(str(out),len(png))
for size in [192,512]:write_png(size)
