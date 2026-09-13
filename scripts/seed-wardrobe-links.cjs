const path = require('node:path');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: path.join(__dirname, '..', 'apps', 'api', '.env') });

const items = [
  {
    name: 'Quần dù gió jogger APT Unisex', category: 'BOTTOM', color: 'Đen', style: 'STREETWEAR', minTemp: 20, maxTemp: 33, waterproof: false, windResistant: true,
    purchaseUrl: 'https://shopee.vn/Qu%C3%A2%CC%80n-Du%CC%80-Gio%CC%81-Nam-N%C6%B0%CC%83-Tu%CC%81i-H%C3%B4%CC%A3p-APT-Unisex-Qu%C3%A2%CC%80n-Jogger-%C3%94%CC%81ng-R%C3%B4%CC%A3ng-Ch%E1%BA%A5t-Li%E1%BB%87u-D%C3%B9-Nh%E1%BA%B9-Co-Gia%CC%83n-i.697931037.42404073785?xptdk=ec166745-5031-45e5-bfbe-c7270008b02b',
  },
  {
    name: 'Quần bò suông Relaxed Jeans PATTERN PQ025', category: 'BOTTOM', color: 'Denim', style: 'CASUAL', minTemp: 18, maxTemp: 31, waterproof: false, windResistant: false,
    purchaseUrl: 'https://shopee.vn/Qu%E1%BA%A7n-B%C3%B2-Su%C3%B4ng-Relaxed-Jeans-Basic-3-M%C3%A0u-PATTERN-PQ025-i.111639450.29656105257',
  },
  {
    name: 'Quần corduroy straight fit PATTERN PQ044', category: 'BOTTOM', color: 'Nâu', style: 'MINIMAL', minTemp: 16, maxTemp: 28, waterproof: false, windResistant: false,
    purchaseUrl: 'https://shopee.vn/Qu%E1%BA%A7n-Corduroy-Straight-Fit-PATTERN-V%E1%BA%A3i-G%C3%A2n-T%C4%83m-%E1%BB%90ng-%C4%90%E1%BB%A9ng-PQ044-i.111639450.45951791268',
  },
];
const knownProductImages = new Map([
  ['https://shopee.vn/Qu%E1%BA%A7n-B%C3%B2-Su%C3%B4ng-Relaxed-Jeans-Basic-3-M%C3%A0u-PATTERN-PQ025-i.111639450.29656105257', 'https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-mai4a44cfni9c1'],
  ['https://shopee.vn/Qu%E1%BA%A7n-Corduroy-Straight-Fit-PATTERN-V%E1%BA%A3i-G%C3%A2n-T%C4%83m-%E1%BB%90ng-%C4%90%E1%BB%A9ng-PQ044-i.111639450.45951791268', 'https://down-vn.img.susercontent.com/file/vn-11134207-820l4-mh9zv05mzevgc7'],
]);

async function productImage(purchaseUrl) {
  try {
    const response = await fetch(purchaseUrl, { headers: { 'user-agent': 'MoodGarden/1.0 product-preview', accept: 'text/html' }, signal: AbortSignal.timeout(8000) });
    const html = await response.text();
    return html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i)?.[1];
  } catch { return undefined; }
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const user = await client.query('SELECT id FROM users WHERE username = $1', ['emsidt']);
    if (!user.rowCount) throw new Error('Không tìm thấy tài khoản emsidt.');
    let created = 0, images = 0;
    for (const item of items) {
      const exists = await client.query('SELECT 1 FROM wardrobe_items WHERE user_id = $1 AND purchase_url = $2', [user.rows[0].id, item.purchaseUrl]);
      const imageUrl = await productImage(item.purchaseUrl) ?? knownProductImages.get(item.purchaseUrl);
      if (exists.rowCount) {
        if (imageUrl) { await client.query('UPDATE wardrobe_items SET image_url = $1, updated_at = NOW() WHERE user_id = $2 AND purchase_url = $3', [imageUrl, user.rows[0].id, item.purchaseUrl]); images += 1; }
        continue;
      }
      await client.query(
        'INSERT INTO wardrobe_items (id, user_id, name, category, color, style, min_temp, max_temp, waterproof, wind_resistant, purchase_url, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3::"ClothingCategory", $4, $5::"ClothingStyle", $6, $7, $8, $9, $10, NOW(), NOW())',
        [user.rows[0].id, item.name, item.category, item.color, item.style, item.minTemp, item.maxTemp, item.waterproof, item.windResistant, item.purchaseUrl],
      );
      if (imageUrl) { await client.query('UPDATE wardrobe_items SET image_url = $1 WHERE user_id = $2 AND purchase_url = $3', [imageUrl, user.rows[0].id, item.purchaseUrl]); images += 1; }
      created += 1;
    }
    console.log(`Wardrobe links ready: ${created} added, ${images} product images updated.`);
  } finally {
    await client.end();
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
