const fs = require('fs');
const path = require('path');

const srcHtml = path.resolve(__dirname, '../dist/index.html');
const destLib = path.resolve(__dirname, '../functions/lib/index.html');
const destSrc = path.resolve(__dirname, '../functions/src/index.html');

if (fs.existsSync(srcHtml)) {
  const content = fs.readFileSync(srcHtml, 'utf8');
  fs.mkdirSync(path.dirname(destLib), { recursive: true });
  fs.writeFileSync(destLib, content);
  fs.mkdirSync(path.dirname(destSrc), { recursive: true });
  fs.writeFileSync(destSrc, content);
  console.log('Successfully copied dist/index.html to functions/lib/ and functions/src/');
} else {
  console.warn('dist/index.html not found, skipping copy to functions.');
}
