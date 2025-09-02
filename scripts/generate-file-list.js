const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

async function getFiles(dir) {
    const subdirs = await readdir(dir);
    const files = await Promise.all(subdirs.map(async (subdir) => {
        const res = path.resolve(dir, subdir);
        return (await stat(res)).isDirectory() ? getFiles(res) : res;
    }));
    return files.flat();
}

async function generateFileList() {
    const publicDir = path.join(__dirname, '..', 'public');
    const outputFile = path.join(publicDir, 'file-list.json');
    
    const files = await getFiles(publicDir);
    
    // Group files by directory
    const fileList = files.reduce((acc, filePath) => {
        const relativePath = path.relative(publicDir, filePath);
        const dirName = path.dirname(relativePath);
        const fileName = path.basename(relativePath);
        
        // Skip the file-list.json itself
        if (fileName === 'file-list.json') return acc;
        
        const dirKey = dirName === '.' ? '' : `${dirName}/`;
        
        if (!acc[dirKey]) {
            acc[dirKey] = [];
        }
        
        acc[dirKey].push(fileName);
        return acc;
    }, {});
    
    // Sort files in each directory
    Object.keys(fileList).forEach(dir => {
        fileList[dir].sort();
    });
    
    // Write to file
    fs.writeFileSync(outputFile, JSON.stringify(fileList, null, 2));
    console.log(`Generated file list with ${files.length} files in ${Object.keys(fileList).length} directories`);
}

generateFileList().catch(console.error);
