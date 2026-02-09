const fs = require('fs');
try {
    const content = fs.readFileSync('c:/Users/tiend/Documents/tenisymas/product_sample_utf8.json', 'utf8');
    const regex = /"category":"([^"]+)"/g;
    let match;
    const categories = new Set();
    while ((match = regex.exec(content)) !== null) {
        categories.add(match[1]);
    }
    console.log(JSON.stringify(Array.from(categories).sort()));
} catch (err) {
    console.error(err.message);
}
