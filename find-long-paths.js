const fs = require('fs');
const path = require('path');

// Configuration
const MAX_PATH_LENGTH = 260; // Windows default path length limit
const IGNORE_DIRS = ['.git']; // Only ignore .git
const ROOT_DIR = '.';

function getAllFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      try {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          if (!IGNORE_DIRS.includes(file)) {
            fileList = getAllFiles(filePath, fileList);
          }
        } else {
          fileList.push({
            path: filePath,
            length: filePath.length
          });
        }
      } catch (err) {
        console.log(`Error accessing: ${path.join(dir, file)}`);
      }
    });
  } catch (err) {
    console.log(`Error reading directory: ${dir}`);
  }
  
  return fileList;
}

try {
  console.log('Scanning for long file paths (including node_modules)...');
  console.log('This may take a while for large projects...');
  
  const allFiles = getAllFiles(ROOT_DIR);
  
  // Sort by path length (descending)
  const sortedFiles = allFiles.sort((a, b) => b.length - a.length);
  
  // Get top 20 longest paths
  const longestPaths = sortedFiles.slice(0, 20);
  
  console.log('\n20 Longest file paths:');
  longestPaths.forEach((file, index) => {
    console.log(`${index + 1}. Length: ${file.length} chars - ${file.path}`);
    if (file.length > MAX_PATH_LENGTH) {
      console.log(`   ⚠️ EXCEEDS ${MAX_PATH_LENGTH} CHARACTER LIMIT!`);
    }
  });
  
  // Count files exceeding limit
  const exceedingLimit = sortedFiles.filter(file => file.length > MAX_PATH_LENGTH);
  if (exceedingLimit.length > 0) {
    console.log(`\n⚠️ Found ${exceedingLimit.length} files exceeding the ${MAX_PATH_LENGTH} character limit.`);
    
    // Show the first 5 exceeding files
    console.log('\nSample of files exceeding limit:');
    exceedingLimit.slice(0, 5).forEach((file, index) => {
      console.log(`${index + 1}. Length: ${file.length} chars - ${file.path}`);
    });
    
    // Group by directory to find problematic areas
    const dirCounts = {};
    exceedingLimit.forEach(file => {
      const dir = path.dirname(file.path);
      const baseDir = dir.split(path.sep)[1] || dir; // Get first directory level
      dirCounts[baseDir] = (dirCounts[baseDir] || 0) + 1;
    });
    
    console.log('\nProblematic directories:');
    Object.entries(dirCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([dir, count]) => {
        console.log(`- ${dir}: ${count} files`);
      });
  } else {
    console.log('\n✅ No files exceed the path length limit.');
  }
  
} catch (error) {
  console.error('Error scanning files:', error);
}