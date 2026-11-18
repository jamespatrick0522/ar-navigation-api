require('dotenv/config');
const {Client} = require('pg');
const assert = require('node:assert/strict');

async function run() {
  const client = new Client({connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15000});
  await client.connect();
  try {
    const {rows} = await client.query(`
      SELECT r.id, r.room_code, r.room_name, r.image_url, r.cover_image_url,
        (SELECT count(*)::int FROM room_gallery g WHERE g.room_id=r.id) AS gallery_count
      FROM rooms r WHERE r.room_code IN ('GIRLS-DORM','BOYS-DORM','NURSING-BUILDING-AND-ROOMS')
      ORDER BY r.id
    `);
    assert.equal(rows.length, 3);
    assert.equal(rows.find(row => row.room_code === 'GIRLS-DORM').id, 68);
    assert.equal(rows.find(row => row.room_code === 'BOYS-DORM').id, 67);
    const nursing = rows.find(row => row.room_code === 'NURSING-BUILDING-AND-ROOMS');
    assert.equal(nursing.image_url, null);
    assert.equal(nursing.cover_image_url, null);
    assert.equal(nursing.gallery_count, 0);
    console.log(JSON.stringify(rows, null, 2));
  } finally {
    await client.end();
  }
}
run().catch(error => {console.error(error.message); process.exitCode = 1;});
