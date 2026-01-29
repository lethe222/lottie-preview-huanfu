import fs from 'fs';

const before = JSON.parse(fs.readFileSync('替换前2.json', 'utf-8'));
const after = JSON.parse(fs.readFileSync('替换后.json', 'utf-8'));

console.log('\n开始修复矢量图形结构...\n');

let fixedLayers = 0;

for (let i = 0; i < after.layers.length; i++) {
  const afterLayer = after.layers[i];
  const beforeLayer = before.layers[i];
  
  if (afterLayer.ty === 4 && beforeLayer && beforeLayer.ty === 4) {
    const afterShapes = afterLayer.shapes || [];
    const beforeShapes = beforeLayer.shapes || [];
    
    function countPaths(shapes) {
      let count = 0;
      for (const shape of shapes) {
        if (shape.ty === 'gr') {
          count += countPaths(shape.it || []);
        } else if (shape.ty === 'sh') {
          count++;
        }
      }
      return count;
    }
    
    const afterPathCount = countPaths(afterShapes);
    const beforePathCount = countPaths(beforeShapes);
    
    if (afterPathCount > beforePathCount * 2) {
      console.log(`修复图层 ${i}: ${afterLayer.nm || 'unnamed'}`);
      console.log(`  替换前路径数: ${beforePathCount}`);
      console.log(`  替换后路径数: ${afterPathCount}`);
      
      for (let j = 0; j < afterShapes.length && j < beforeShapes.length; j++) {
        if (afterShapes[j].ty === 'gr' && beforeShapes[j].ty === 'gr') {
          afterShapes[j].it = beforeShapes[j].it;
        }
      }
      
      fixedLayers++;
    }
  }
}

fs.writeFileSync('替换后-fixed-vector.json', JSON.stringify(after));

console.log(`\n修复完成!`);
console.log(`修复的图层数: ${fixedLayers}`);
console.log(`已保存到: 替换后-fixed-vector.json\n`);
