import { Jimp } from 'jimp';

const src = 'C:/Users/ASUS/Downloads/Gemini_Generated_Image_4grs8e4grs8e4grs.png';
const dest = 'src/assets/mascot.png';

const image = await Jimp.read(src);

const width = image.width;
const height = image.height;
const threshold = 220;

function isWhitish(color) {
  const r = (color >>> 24) & 0xff;
  const g = (color >>> 16) & 0xff;
  const b = (color >>> 8) & 0xff;
  return r >= threshold && g >= threshold && b >= threshold;
}

const visited = new Uint8Array(width * height);
const queue = [];

// Seed BFS from all four corners
for (const [sx, sy] of [[0,0],[width-1,0],[0,height-1],[width-1,height-1]]) {
  const idx = sy * width + sx;
  if (!visited[idx] && isWhitish(image.getPixelColor(sx, sy))) {
    queue.push(sx, sy);
    visited[idx] = 1;
  }
}

while (queue.length > 0) {
  const y = queue.pop();
  const x = queue.pop();
  image.setPixelColor(0x00000000, x, y);

  for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
    const nidx = ny * width + nx;
    if (visited[nidx]) continue;
    if (!isWhitish(image.getPixelColor(nx, ny))) continue;
    visited[nidx] = 1;
    queue.push(nx, ny);
  }
}

await image.write(dest);
console.log(`Saved to ${dest}`);
