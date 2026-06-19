const fs = require('fs');
const path = require('path');

const dailyDir = path.resolve(__dirname, '..', 'daily');

const files = fs.readdirSync(dailyDir).filter(f => f.endsWith('.txt'));

const entries = files
  .map(file => {
    const raw = fs.readFileSync(path.join(dailyDir, file), 'utf-8');
    const lines = raw.split(/\r?\n/);
    const title = lines[0] ? lines[0].trim() : '(untitled)';
    const content = lines.slice(1).join('\n').trim();
    const date = path.basename(file, '.txt');
    return { date, title, content, file };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

fs.writeFileSync(
  path.join(dailyDir, 'manifest.json'),
  JSON.stringify(entries, null, 2),
  'utf-8'
);

console.log(`Built manifest with ${entries.length} entries → daily/manifest.json`);
