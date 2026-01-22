import { db } from './js/data.js';

async function test() {
    console.log("--- TEST 1: Restricted User (Brandon) Searching for Zenu ---");
    const r1 = await db.searchProducts('zenu', 'TYM', '1010159801');
    console.log(`Results found: ${r1.length}`);
    if (r1.length > 0) console.log(`First result: ${r1[0].name}`);

    console.log("\n--- TEST 2: Regular TYM User (Jhon Wilson) Searching for Zenu ---");
    const r2 = await db.searchProducts('zenu', 'TYM', '1002730727');
    console.log(`Results found: ${r2.length}`);

    console.log("\n--- TEST 3: Restricted User (Brandon) Searching for Alpina ---");
    const r3 = await db.searchProducts('alpina', 'TYM', '1010159801');
    console.log(`Results found: ${r3.length}`);

    console.log("\n--- TEST 4: Regular TYM User (Jhon Wilson) Searching for Alpina ---");
    const r4 = await db.searchProducts('alpina', 'TYM', '1002730727');
    console.log(`Results found: ${r4.length}`);
}

test();
