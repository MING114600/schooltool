/**
 * 計算洗牌後的座位表
 * @param {string} mode - 洗牌模式
 * @param {Array} students - 學生列表
 * @param {Object} layout - 教室佈局
 * @param {Object} lockedAssignments - 鎖定的座位
 * @returns {Object} 新的 seats 物件
 */
export const calculateShuffledSeats = (mode, students, layout, lockedAssignments) => {
    const { rows, cols, voidSeats } = layout;
    const currentVoidSeats = voidSeats || [];
    
    // 過濾出未鎖定的學生作為候選池
    const lockedStudentIds = new Set(Object.values(lockedAssignments));
    const allStudents = students.filter(s => !lockedStudentIds.has(s.id));
    
    let pool = [];
    let boys = [];
    let girls = [];
    let highPerformers = []; // 成績前段班
    let lowPerformers = [];  // 成績後段班

    const newSeats = { ...lockedAssignments }; // 從鎖定的座位開始

    // 1. 準備學生池 (Pool)
    if (mode.startsWith('performance_')) {
        // --- 成績相關模式 ---
        
        if (mode === 'performance_s_shape') {
            // ✅ 修改：S型 (低分靠前)
            // 改為升冪排序 (Low -> High)，這樣 pool[0] (低分) 會被填入 Row 0 (黑板前)
            pool = [...allStudents].sort((a, b) => {
                const scoreA = parseFloat(a.performance) || 0;
                const scoreB = parseFloat(b.performance) || 0;
                return scoreA - scoreB; // 升序：分數低的在前面
            });
        } else if (mode === 'performance_checker') {
            // 梅花座：先依成績降序 (高 -> 低) 分群
            const sortedByPerformance = [...allStudents].sort((a, b) => {
                const scoreA = parseFloat(a.performance) || 0;
                const scoreB = parseFloat(b.performance) || 0;
                return scoreB - scoreA; // 降序
            });
            // 切成兩半
            const mid = Math.ceil(sortedByPerformance.length / 2);
            highPerformers = sortedByPerformance.slice(0, mid).sort(() => Math.random() - 0.5); // 內部打亂
            lowPerformers = sortedByPerformance.slice(mid).sort(() => Math.random() - 0.5);  // 內部打亂
        }

    } else if (mode === 'random' || mode === 'group_vertical' || mode === 'group_cluster') {
       if (mode === 'random') {
          pool = allStudents.sort(() => Math.random() - 0.5);
       } else if (mode === 'group_cluster') {
          // Cluster 模式：依組別排序 (數字由小到大)
          pool = allStudents.sort((a, b) => {
              const gA = parseInt(a.group) || 999;
              const gB = parseInt(b.group) || 999;
              return gA - gB;
          });
       } else {
          // Vertical 模式：依組別排序 (字串/數字混合)
          pool = allStudents.sort((a, b) => {
            const gA = a.group || '999';
            const gB = b.group || '999';
            return gA.localeCompare(gB, undefined, { numeric: true, sensitivity: 'base' });
          });
       }
    } else {
       // 性別相關模式
       boys = allStudents.filter(s => s.gender === 'M').sort(() => Math.random() - 0.5);
       girls = allStudents.filter(s => s.gender === 'F' || !s.gender).sort(() => Math.random() - 0.5); 
    }

    // 2. 執行演算法
    
    // --- A. 依成績 S 型排列 (Performance S-Shape) ---
    if (mode === 'performance_s_shape') {
        let studentIdx = 0;
        // 遍歷邏輯：y (縱向/列) 從 0 (前) 到 cols-1 (後)
        for (let y = 0; y < cols; y++) {
            // S型折返：偶數排從左到右，奇數排從右到左
            const isEvenRow = (y % 2 === 0);
            const xStart = isEvenRow ? 0 : rows - 1;
            const xEnd = isEvenRow ? rows : -1;
            const xStep = isEvenRow ? 1 : -1;

            for (let x = xStart; x !== xEnd; x += xStep) {
                const key = `${y}-${x}`;
                if (currentVoidSeats.includes(key) || lockedAssignments[key]) continue;

                if (studentIdx < pool.length) {
                    newSeats[key] = pool[studentIdx].id;
                    studentIdx++;
                }
            }
        }
    }
    // --- B. 依成績梅花座 (Performance Checker) ---
    else if (mode === 'performance_checker') {
        for (let r = 0; r < cols; r++) {
            for (let c = 0; c < rows; c++) {
              const key = `${r}-${c}`;
              if (currentVoidSeats.includes(key) || lockedAssignments[key]) continue;
              
              let studentToSit = null;
              // 規則：(r+c) 為偶數放高分群，奇數放低分群
              if ((r + c) % 2 === 0) {
                  studentToSit = highPerformers.length > 0 ? highPerformers.pop() : lowPerformers.pop();
              } else {
                  studentToSit = lowPerformers.length > 0 ? lowPerformers.pop() : highPerformers.pop();
              }
              
              if (studentToSit) newSeats[key] = studentToSit.id;
            }
        }
    }
    // --- C. 智慧島嶼分組 (BFS Cluster) ---
    else if (mode === 'group_cluster') {
        const grid = Array(cols).fill(null).map(() => Array(rows).fill(false));
        for (let y = 0; y < cols; y++) {
            for (let x = 0; x < rows; x++) {
                const key = `${y}-${x}`;
                if (!currentVoidSeats.includes(key)) grid[y][x] = true;
            }
        }

        const visited = new Set();
        const clusters = [];
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]]; 

        for (let y = 0; y < cols; y++) {
            for (let x = 0; x < rows; x++) {
                const key = `${y}-${x}`;
                if (grid[y][x] && !visited.has(key)) {
                    const currentCluster = [];
                    const queue = [[y, x]];
                    visited.add(key);
                    currentCluster.push(key);

                    while (queue.length > 0) {
                        const [cy, cx] = queue.shift();
                        for (const [dy, dx] of directions) {
                            const ny = cy + dy;
                            const nx = cx + dx;
                            const nKey = `${ny}-${nx}`;
                            if (ny >= 0 && ny < cols && nx >= 0 && nx < rows && grid[ny][nx] && !visited.has(nKey)) {
                                visited.add(nKey);
                                queue.push([ny, nx]);
                                currentCluster.push(nKey);
                            }
                        }
                    }
                    clusters.push(currentCluster);
                }
            }
        }

        clusters.sort((a, b) => {
            const getCenter = (cluster) => {
                let sumY = 0, sumX = 0;
                cluster.forEach(k => {
                    const [y, x] = k.split('-').map(Number);
                    sumY += y; sumX += x;
                });
                return [sumY / cluster.length, sumX / cluster.length];
            };
            const [ay, ax] = getCenter(a);
            const [by, bx] = getCenter(b);
            if (Math.abs(ay - by) > 1.5) return ay - by;
            return ax - bx;
        });

        const studentsByGroup = {};
        pool.forEach(s => {
            const g = s.group || 'unknown';
            if (!studentsByGroup[g]) studentsByGroup[g] = [];
            studentsByGroup[g].push(s);
        });

        clusters.forEach((clusterSeats, index) => {
            const targetGroup = (index + 1).toString();
            const groupStudents = studentsByGroup[targetGroup] || [];
            const shuffledGroupStudents = groupStudents.sort(() => Math.random() - 0.5);
            
            let studentIdx = 0;
            for (const seatKey of clusterSeats) {
                if (lockedAssignments[seatKey]) continue;
                if (studentIdx < shuffledGroupStudents.length) {
                    newSeats[seatKey] = shuffledGroupStudents[studentIdx].id;
                    studentIdx++;
                }
            }
        });

    } 
    // --- D. 垂直分組 (Group Vertical) ---
    else if (mode === 'group_vertical') {
        const studentsByGroup = {};
        pool.forEach(s => {
            const g = s.group || 'unknown';
            if (!studentsByGroup[g]) studentsByGroup[g] = [];
            studentsByGroup[g].push(s);
        });

        for (let x = 0; x < rows; x++) {
            const targetGroup = (x + 1).toString();
            const groupStudents = studentsByGroup[targetGroup] || [];
            const shuffledGroupStudents = groupStudents.sort(() => Math.random() - 0.5);
            
            let studentIdx = 0;
            for (let y = 0; y < cols; y++) {
                const key = `${y}-${x}`;
                if (currentVoidSeats.includes(key) || lockedAssignments[key]) continue;
                
                if (studentIdx < shuffledGroupStudents.length) {
                    newSeats[key] = shuffledGroupStudents[studentIdx].id;
                    studentIdx++;
                }
            }
        }
    } 
    // --- E. 一般/性別模式 ---
    else {
      for (let r = 0; r < cols; r++) {
        for (let c = 0; c < rows; c++) {
          const key = `${r}-${c}`;
          if (currentVoidSeats.includes(key) || lockedAssignments[key]) continue;
          let studentToSit = null;
          
          if (mode === 'random') {
             studentToSit = pool.pop();
          } else {
             if (mode === 'row_gender') { 
                 if (r % 2 === 0) studentToSit = boys.length > 0 ? boys.pop() : girls.pop(); 
                 else studentToSit = girls.length > 0 ? girls.pop() : boys.pop(); 
             } else if (mode === 'col_gender') { 
                 if (c % 2 === 0) studentToSit = boys.length > 0 ? boys.pop() : girls.pop(); 
                 else studentToSit = girls.length > 0 ? girls.pop() : boys.pop(); 
             } else if (mode === 'checker') { 
                 if ((r + c) % 2 === 0) studentToSit = boys.length > 0 ? boys.pop() : girls.pop(); 
                 else studentToSit = girls.length > 0 ? girls.pop() : boys.pop(); 
             }
             if (!studentToSit) {
                if (boys.length > 0) studentToSit = boys.pop();
                else if (girls.length > 0) studentToSit = girls.pop();
             }
          }
          if (studentToSit) newSeats[key] = studentToSit.id;
        }
      }
    }
    
    return newSeats;
};