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

    // We want to replace paths based on hooks that moved

    // 1. Manager: useManagerUI
    if (content.match(/['"](.*)hooks\/useManagerUI['"]/g)) {
        content = content.replace(/(['"])(.*)hooks\/useManagerUI(['"])/g, '$1$2pages/Manager/hooks/useManagerUI$3');
        changed = true;
    }

    // 2. Dashboard: useDashboardEvents, useClassroomTimer
    if (content.match(/['"](.*)hooks\/useDashboardEvents['"]/g)) {
        content = content.replace(/(['"])(.*)hooks\/useDashboardEvents(['"])/g, '$1$2pages/Dashboard/hooks/useDashboardEvents$3');
        changed = true;
    }
    if (content.match(/['"](.*)hooks\/useClassroomTimer['"]/g)) {
        content = content.replace(/(['"])(.*)hooks\/useClassroomTimer(['"])/g, '$1$2pages/Dashboard/hooks/useClassroomTimer$3');
        changed = true;
    }

    // 3. ExamReader: useExamManager
    if (content.match(/['"](.*)hooks\/useExamManager['"]/g)) {
        content = content.replace(/(['"])(.*)hooks\/useExamManager(['"])/g, '$1$2pages/ExamReader/hooks/useExamManager$3');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated paths in ${file}`);
        totalChanged++;
    }
});

console.log(`\nHooks migration completed. Total files modified: ${totalChanged}`);
