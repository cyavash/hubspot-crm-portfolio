import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const errors = [];
let checked = 0;
async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'themes', 'wordpress'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (/\.(html|css)$/.test(entry.name)) files.push(full);
  }
  return files;
}
for (const file of await walk(root)) {
  const text = await readFile(file, 'utf8');
  const refs = file.endsWith('.html')
    ? [...text.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(m => m[1])
    : [...text.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m => m[1]);
  for (const ref of refs) {
    if (/^(?:[a-z]+:|\/\/|\{)/i.test(ref)) continue;
    const [resource, fragment] = ref.split('#');
    const target = path.resolve(path.dirname(file), decodeURIComponent(resource.split('?')[0] || path.basename(file)));
    checked++;
    try {
      if (!(await stat(target)).isFile()) throw new Error('not a file');
      if (fragment && target.endsWith('.html')) {
        const destination = await readFile(target, 'utf8');
        const ids = [...destination.matchAll(/(?:id|name)=["']([^"']+)["']/g)].map(m => m[1]);
        if (!ids.includes(decodeURIComponent(fragment))) throw new Error('missing anchor');
      }
    } catch (error) {
      errors.push(path.relative(root, file) + ': ' + ref + ' (' + error.message + ')');
    }
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else console.log('Static audit passed: ' + checked + ' local asset, page and anchor references.');
