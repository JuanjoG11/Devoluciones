
import { db } from './js/data.js';

async function verify() {
    const username = '1004700767';
    console.log(`Verifying user: ${username}`);

    const user = await db.getUserByUsername(username);
    if (user) {
        console.log(`User found: ${user.name}`);
        console.log(`Organization: ${user.organization}`);

        // Search for regular product
        const regularProducts = await db.searchProducts('ALPINITO', 'TYM', username);
        console.log(`Regular products found: ${regularProducts.length}`);

        // Search for meat product ( ZENÚ product code '1012544' )
        const meatProducts = await db.searchProducts('ZENU', 'TYM', username);
        console.log(`Meat products found: ${meatProducts.length}`);

        if (regularProducts.length > 0 && meatProducts.length === 0) {
            console.log("SUCCESS: Product filtering is working correctly for David.");
        } else {
            console.log("FAILURE: Product filtering is NOT working correctly.");
        }
    } else {
        console.log("FAILURE: User not found.");
    }
}

verify();
