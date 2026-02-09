const fs = require('fs');
try {
    const data = JSON.parse(fs.readFileSync('c:/Users/tiend/Documents/tenisymas/product_sample_utf8.json', 'utf8'));
    const categories = new Set(data.map(p => p.category));
    console.log(JSON.stringify(Array.from(categories).sort()));
} catch (err) {
    console.error('Error:', err.message);
}
