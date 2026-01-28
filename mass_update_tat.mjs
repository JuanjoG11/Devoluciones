import fs from 'fs';

function parsePrice(str) {
    if (!str || str.includes('-')) return 0;
    let cleaned = str.replace(/\$|\s/g, '');
    cleaned = cleaned.replace(/\./g, '');
    cleaned = cleaned.replace(',', '.');
    return Math.round(parseFloat(cleaned));
}

const SUPABASE_URL = 'https://olrfvydwyndqquxmtuho.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9scmZ2eWR3eW5kcXF1eG10dWhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MDE3NDUsImV4cCI6MjA4MzQ3Nzc0NX0.ui2jMr8-rG-bsFgeSea6ZpYks6utVClVGcQLq9Ptxn8';

async function main() {
    console.log('Reading raw data chunks...');
    let rawContent = '';
    for (let i = 1; i <= 5; i++) {
        rawContent += fs.readFileSync(`./tat_raw_part${i}.txt`, 'utf8');
    }

    const lines = rawContent.split(/\r?\n/).filter(l => l.trim().length > 0);
    const updates = {};

    lines.forEach(line => {
        const parts = line.split('\t');
        if (parts.length >= 3) {
            const code = parts[0].trim();
            const name = parts[1].trim();
            const priceStr = parts[parts.length - 1].trim();
            updates[code] = { name, price: parsePrice(priceStr) };
        }
    });

    const productsToUpsert = Object.keys(updates).map(code => ({
        code: code,
        name: updates[code].name,
        price: updates[code].price,
        search_string: `${code} ${updates[code].name}`.toLowerCase()
    }));

    console.log(`Parsed ${productsToUpsert.length} unique products.`);

    // 1. Update Supabase
    console.log(`Upserting to Supabase...`);
    const chunkSize = 50;
    for (let i = 0; i < productsToUpsert.length; i += chunkSize) {
        const chunk = productsToUpsert.slice(i, i + chunkSize);
        const response = await fetch(`${SUPABASE_URL}/rest/v1/products?on_conflict=code`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates,return=representation'
            },
            body: JSON.stringify(chunk)
        });
        if (!response.ok) {
            console.error(`Error in chunk ${i}:`, await response.text());
        } else {
            const data = await response.json();
            console.log(`Chunk ${i} upserted. Affected: ${data.length}`);
        }
    }

    // 2. Update seed_data.js
    console.log('Updating seed_data.js...');
    const formattedLines = Object.keys(updates).map(code => {
        const up = updates[code];
        const formattedPrice = `$ ${up.price.toLocaleString('de-DE')} `;
        return `${code}\t${up.name}\t ${formattedPrice}`;
    });
    const finalSeed = `export const RAW_INVENTORY_PARTS = [\n    \`${formattedLines.join('\n')}\`\n];\n`;
    fs.writeFileSync('./js/seed_data.js', finalSeed);

    // 3. Update data.js version to v10
    console.log('Updating data.js version to v10...');
    let dataContent = fs.readFileSync('./js/data.js', 'utf8');
    dataContent = dataContent.replace(/const version = 'v\d+';/, "const version = 'v10';");
    fs.writeFileSync('./js/data.js', dataContent);

    console.log('All updates complete.');
}

main().catch(console.error);
