const {readFile, mkdir, writeFile} = require('node:fs/promises');
const path = require('node:path');

async function run() {
  const source = JSON.parse(await readFile('src/scripts/data/mao-ni-boss-new.json', 'utf8'));
  const urls = [...new Set([...source.rows.map(row => row.roomImageSourceUrl), source.campusImageSourceUrl].filter(Boolean))];
  await mkdir('public/room-images', {recursive: true});
  for (const url of urls) {
    const id = new URL(url).pathname.split('/')[3];
    const response = await fetch(`https://lh3.googleusercontent.com/d/${id}=w1600`, {signal: AbortSignal.timeout(60000)});
    if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) throw new Error(`${id}: not JPEG`);
    const output = path.join('public/room-images', `${id}.jpg`);
    await writeFile(output, bytes);
    console.log(JSON.stringify({id, bytes: bytes.length, output}));
  }
}
run().catch(error => {console.error(error.message); process.exitCode = 1;});
