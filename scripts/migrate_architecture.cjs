const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(filePath));
        } else {
            if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
                results.push(filePath);
            }
        }
    });
    return results;
}

const files = walk('d:/schooltool/ClassroomTools/src');

let totalChanged = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // We want to replace quotes to handle both types
    // Using a regex with global and multiline flags

    // 1. replace 'utils/constants' => 'constants'
    if (content.match(/['"](.*)utils\/constants['"]/g)) {
        content = content.replace(/(['"])(.*)utils\/constants(['"])/g, '$1$2constants$3');
        changed = true;
    }

    // 2. replace 'utils/patchNotesData' => 'data/patchNotesData'
    if (content.match(/['"](.*)utils\/patchNotesData['"]/g)) {
        content = content.replace(/(['"])(.*)utils\/patchNotesData(['"])/g, '$1$2data/patchNotesData$3');
        changed = true;
    }

    // 3. convert services
    const services = ['audioService', 'backupService', 'googleDriveService', 'googlePickerService', 'idbService', 'examDatabase'];
    services.forEach(service => {
        const regex = new RegExp(`(['"])(.*)utils/${service}(['"])`, 'g');
        if (content.match(regex)) {
            content = content.replace(regex, `$1$2services/${service}$3`);
            changed = true;
        }
    });

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated paths in ${file}`);
        totalChanged++;
    }
});

console.log(`\nMigration completed. Total files modified: ${totalChanged}`);
