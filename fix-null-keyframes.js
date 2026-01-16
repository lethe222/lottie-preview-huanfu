/**
 * 修复 Lottie JSON 中 to 和 ti 为 null 的问题
 *
 * 问题：压缩工具错误地将 to: [0,0,0] 和 ti: [0,0,0] 转换为 null
 * 这会导致 iOS 和 Android 的 Lottie 播放器崩溃
 *
 * 解决方案：
 * 1. 删除值为 null 的 to 和 ti 字段（Lottie 规范允许省略这些字段）
 * 2. 或者将 null 替换为 [0,0,0]（保持原始语义）
 */

import fs from 'fs';
import path from 'path';

function fixNullKeyframes(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => fixNullKeyframes(item));
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    // 如果是关键帧对象中的 to 或 ti 字段且值为 null
    if ((key === 'to' || key === 'ti') && value === null) {
      // 方案1：直接删除（推荐，因为 [0,0,0] 表示无切线影响）
      // 不添加这个字段到 result
      continue;

      // 方案2：替换为 [0,0,0]（如果需要保持字段存在）
      // result[key] = [0, 0, 0];
    } else {
      result[key] = fixNullKeyframes(value);
    }
  }

  return result;
}

function fixLottieFile(inputPath, outputPath) {
  console.log(`读取文件: ${inputPath}`);

  const data = fs.readFileSync(inputPath, 'utf-8');
  const lottieData = JSON.parse(data);

  console.log('修复 null 值...');
  const fixed = fixNullKeyframes(lottieData);

  console.log(`写入修复后的文件: ${outputPath}`);
  fs.writeFileSync(outputPath, JSON.stringify(fixed), 'utf-8');

  const originalSize = data.length;
  const fixedSize = JSON.stringify(fixed).length;

  console.log(`\n修复完成！`);
  console.log(`原始大小: ${(originalSize / 1024).toFixed(2)} KB`);
  console.log(`修复后大小: ${(fixedSize / 1024).toFixed(2)} KB`);
  console.log(`减少: ${((originalSize - fixedSize) / 1024).toFixed(2)} KB`);
}

// 使用示例
const inputFile = process.argv[2] || './test/双11首页弹窗 (1).json';
const outputFile = process.argv[3] || './test/双11首页弹窗-fixed.json';

try {
  fixLottieFile(inputFile, outputFile);
} catch (error) {
  console.error('错误:', error.message);
  process.exit(1);
}
