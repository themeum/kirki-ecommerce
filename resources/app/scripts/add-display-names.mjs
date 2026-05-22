import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const targetDir = process.argv[2];
if (!targetDir) {
  console.error('Usage: node add-display-names.mjs <dir>');
  process.exit(1);
}

const dir = path.resolve(targetDir);

const walk = (d) => {
  let n = 0;
  for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
    const full = path.join(d, entry.name);
    if (entry.isDirectory()) {
      n += walk(full);
    } else if (/\.jsx$/.test(entry.name)) {
      let content = fs.readFileSync(full, 'utf8');
      const base = path.basename(entry.name, '.jsx');
      const pascal = base
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join('');

      const exportMatch = content.match(/export default (\w+);/);
      const name = exportMatch?.[1] || pascal;

      if (content.includes(`${name}.displayName`)) {
        continue;
      }

      const insert = `\n${name}.displayName = '${name}';\n`;
      if (content.match(/export default \w+;/)) {
        content = content.replace(/(export default \w+;)/, `${insert}$1`);
        fs.writeFileSync(full, content);
        n += 1;
      }
    }
  }
  return n;
};

console.log(`Added displayName to ${walk(dir)} files`);
