const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'js/data/tym_products.js');

if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
}

const rawContent = fs.readFileSync(filePath, 'utf8');

const codesToRemove = new Set([
    "AJ007", "AJ012", "AJ100", "AJ101", "AJ102", "AJ103", "AJ104", "AJ105",
    "BQ001", "BQ003", "BUENAM005", "BUENAM015", "BUENAM018", "BUENAM022",
    "CI014", "CI017", "CL011", "D500", "D501", "DE001", "DE002", "DE022", "DE023",
    "DG039", "DG073", "DG076", "DG1000", "DG1002", "DG1003", "DG1004", "DG122", "DG123", "DG139", "DG142", "DG170", "DG183", "DG189", "DG194", "DG195", "DG196", "DG197", "DG198", "DG199", "DG208", "DG219", "DG221", "DG223", "DG228", "DG231", "DG234", "DG240", "DG242", "DG245",
    "DK001", "DN023", "DN027", "DN028", "DN030", "DN049", "DN062", "DN078", "DN082", "DN089", "DN090", "DN091", "DN098", "DN200", "DN205", "DN207", "DN209", "DN210", "DN211", "DN215", "DN216", "DN217",
    "DT004", "DT008", "DT009", "DT023", "DT050", "DT069", "DT076", "DT087", "DT088", "DT093", "DT097", "DT098", "DT100", "DT101", "DT102", "DT103", "DT104", "DT108", "DT111", "DT113", "DT116", "DT119", "DT202", "DT203", "DT216", "DT218", "DT220", "DT222", "DT228", "DT233", "DT234", "DT239",
    "GR003", "GR004", "GR006", "GR007", "GR008",
    "H1004", "H1011", "H1013", "H1056", "H1058", "H1059", "H1062", "H1067", "H1071", "H1080", "H1081", "H1082", "H1083", "H1084", "H1085", "H1120", "H3035", "H3041", "H3047", "H3060", "H3061", "H3063", "H700", "H701", "H730", "H731", "H783", "H913", "H914", "H924", "H933", "H971",
    "M1000", "M1001", "M1002", "M1003", "M1011", "M1060", "M1071", "M1074", "M1075", "M1076", "M1080", "M1083", "M1086", "M1088", "M1089", "M1101", "M1102", "M1103", "M1104", "M1111", "M1112", "M1113", "M1114", "M1115", "M1120", "M1121", "M1122", "M1123", "M1124", "M1138", "M1139", "M500", "M501", "M503", "M509", "M510", "M511", "M512", "M514", "M515", "M526", "M527", "M547", "M548", "M550", "M563", "M564", "M565", "M566", "M567", "M568", "M569", "M570", "M571", "M572", "M573", "M574", "M577", "M580", "M619", "M620", "M621", "M622", "M661", "M677", "M678", "M685", "M708", "M709", "M811", "M812", "M813", "M814", "M817", "M818", "M821", "M823", "M825", "M827", "M845", "M849", "M850", "M851", "M852", "M853", "M854", "M855", "M857", "M861", "M864", "M866", "M868", "M869", "M870", "M871", "M872", "M875", "M877", "M878", "M880", "M898", "M899", "M939", "M940", "M941", "M967", "M973", "M975", "M976", "M977", "M978", "M979", "M998", "M999",
    "OFD052", "OFD089", "OFD090", "OFD091", "OFD092", "OFD093", "OFD094", "OFD102", "OFD103", "OFD104", "OFD112", "OFD113", "OFD114", "OFD117", "OFD118", "OFD119", "OFD124", "OFD125", "OFD126", "OFD127",
    "OG024", "OG025", "OG027", "OG029", "OG037", "OG054", "OG088", "OG089", "OG090", "OG094", "OG095", "OG096", "OG097", "OG100", "OG102", "OG103", "OG104", "OG105", "OG107", "OG108",
    "PESTO002", "PESTO011", "PESTO013", "PESTO027", "PESTO028", "PESTO034", "PESTO035", "PESTO036", "PESTO046", "PESTO047", "PESTO048", "PESTO049",
    "PINA021", "PINA024", "PINA029", "PINA044", "PINA045",
    "PN022", "PN088", "PN090", "PN1000", "PN1002", "PN1003", "PN112", "PN135", "PN136", "PN137", "PN147",
    "PR031", "PR060", "PR062", "PR081",
    "PRI003", "PRI004",
    "Q1037", "Q1038", "Q1056", "Q1057", "Q1059", "Q1060", "Q1068", "Q1069", "Q1073", "Q1074", "Q1086", "Q1107", "Q1175", "Q1176", "Q1179", "Q1180", "Q1189", "Q1191", "Q1198", "Q1199", "Q1204", "Q1237", "Q1261", "Q1264", "Q1268", "Q1272", "Q1292", "Q1318", "Q1320", "Q1321", "Q345", "Q346", "Q393", "Q429", "Q501", "Q518", "Q905", "Q907", "Q916", "Q917", "Q960", "Q961",
    "QK103", "QK126", "QK139", "QK164", "QK166", "QK185",
    "RA022", "RA025", "RA026",
    "RICAV001", "RICAV003", "RICAV005", "RICAV006",
    "SC001", "SC004", "SC005", "SC006", "SC007", "SC008", "SC009", "SC013", "SC019", "SC023", "SC024", "SC025", "SC026", "SC027", "SC035", "SC040", "SC047", "SC050", "SC052", "SC070", "SC077", "SC078", "SC450",
    "SN782074", "SN782093",
    "TUNA001", "TUNA002", "TUNA003", "TUNA010", "TUNA011", "TUNA014", "TUNA015", "TUNA017", "TUNA018", "TUNA019", "TUNA020", "TUNA021", "TUNA022", "TUNA023", "TUNA024", "TUNA025", "TUNA026", "TUNA027", "TUNA028", "TUNA029", "TUNA030",
    "UNI001", "UNI002", "UNI005", "UNI006", "UNI007", "UNI008", "UNI011", "UNI014", "UNI016", "UNI017", "UNI018", "UNI019", "UNI025", "UNI026", "UNI027", "UNI029", "UNI030", "UNI031", "UNI032", "UNI033", "UNI034", "UNI035"
]);

const lines = rawContent.split('\n');
const newLines = [];
let count = 0;

for (const line of lines) {
    const codeMatch = line.match(/code:\s*["'](.*?)["']/);
    if (codeMatch) {
        const code = codeMatch[1].trim();
        if (codesToRemove.has(code)) {
            count++;
            continue;
        }
    }
    newLines.push(line);
}

fs.writeFileSync(filePath, newLines.join('\n'));
console.log(`Successfully removed ${count} products.`);
