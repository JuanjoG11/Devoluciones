const fs = require('fs');

const rawFile = 'js/data/carnicos_raw.txt';
const jsFile = 'js/data/carnicos_products.js';

const rawContent = fs.readFileSync(rawFile, 'utf8');
const lines = rawContent.split('\n').filter(l => l.trim() !== '');

const products = lines.map(line => {
    const parts = line.split(/\t+| {2,}/).map(s => s.trim());
    if (parts.length >= 3) {
        const code = parts[0];
        const name = parts[1];
        const priceStr = parts[2].replace('$', '').replace(/\./g, '').trim();
        const price = parseInt(priceStr) || 0;
        return { code, name, price, organization: 'TYM', category: 'carnicos' };
    }
    return null;
}).filter(p => p !== null);

const jsOutput = `export const CARNICOS_PRODUCTS_LIST = ${JSON.stringify(products, null, 4)};`;

fs.writeFileSync(jsFile, jsOutput);
console.log(`Successfully parsed ${products.length} products into carnicos_products.js`);
