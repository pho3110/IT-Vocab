import fs from 'node:fs/promises';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const pdfPath = process.argv[2];
if (!pdfPath) throw new Error('Usage: node scripts/extract-workbook.mjs <workbook.pdf>');
const bytes = new Uint8Array(await fs.readFile(pdfPath));
const doc = await getDocument({ data: bytes, useSystemFonts: true }).promise;
const ranges = [[6, 9], [15, 19], [26, 29], [37, 40], [47, 49], [56, 59], [67, 69], [75, 78]];
const entries = [];
let lessonId, current;
const complete = term => /\((?:n|v|adj|adv|prep|phr|phr v|v phr|n phr|n pl)\)(?:\s*\[[^\]]*\])?$/.test(term);
for (const [first, last] of ranges) {
  for (let pageNumber = first; pageNumber <= last; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines = [];
    for (const item of content.items.filter(item => item.str?.trim() && item.transform[5] > 55 && item.transform[4] < 450 && !/^(Unit \d|DEFINITION|TRANSLATION)/.test(item.str.trim()))) {
      const y = item.transform[5], x = item.transform[4];
      let line = lines.find(line => Math.abs(line.y - y) < 0.35);
      if (!line) { line = { y, left: [], right: [] }; lines.push(line); }
      (x < 170 ? line.left : line.right).push({ x, text: item.str.trim() });
    }
    lines.sort((a, b) => b.y - a.y);
    for (const line of lines) {
      line.left = line.left.sort((a, b) => a.x - b.x).map(x => x.text).join(' ').trim();
      line.right = line.right.sort((a, b) => a.x - b.x).map(x => x.text).join(' ').trim();
    }
    const starts = [];
    for (const line of lines) {
      const heading = line.left.match(/^Lesson\s+(\d)\s*([ABCD])\s*:/);
      if (heading) { lessonId = `${heading[1]}${heading[2]}`; current = null; starts.push({ y: line.y, heading: true }); continue; }
      if (!line.left || /^(WORD|PART |Unit |DEFINITION|TRANSLATION|Write the)/.test(line.left)) continue;
      if (/^\[/.test(line.left) && current) { current.rawTerm += ' ' + line.left; continue; }
      if (!current || complete(current.rawTerm)) {
        current = { lessonId, rawTerm: line.left, definition: '', page: pageNumber, y: line.y };
        entries.push(current); starts.push({ y: line.y + 5.5, entry: current });
      } else current.rawTerm += ' ' + line.left;
    }
    starts.sort((a, b) => b.y - a.y);
    for (const line of lines.filter(line => line.right)) {
      const start = starts.filter(start => line.y <= start.y).at(-1);
      const target = start?.heading ? null : start?.entry ?? entries.at(-starts.filter(s => s.entry).length - 1);
      if (target) target.definition += (target.definition ? ' ' : '') + line.right;
    }
  }
  current = null;
}
const result = entries.map(({ y, rawTerm, ...entry }) => {
  const match = rawTerm.match(/\s*\((n|v|adj|adv|prep|phr|phr v|v phr|n phr|n pl)\)(?:\s*\[[^\]]*\])?$/);
  return { ...entry, term: match ? rawTerm.slice(0, match.index).trim() : rawTerm, partOfSpeech: match?.[1] ?? '', rawTerm };
});
// The PDF itself places these term fragments in the preceding definition cell.
// Repair the layout without losing the original extracted spelling for auditing.
function find(lesson, term) { return result.find(row => row.lessonId === lesson && row.term === term); }
for (const [lesson, previous, fragment, term, corrected] of [
  ['1B', 'service centre', 'supply cloud', 'computing', 'supply cloud computing'],
  ['2B', 'video camera', 'virtual reality', 'goggles', 'virtual reality goggles'],
  ['2D', 'DIMM slot', 'Ethernet', 'connector', 'Ethernet connector'],
]) {
  const preceding = find(lesson, previous), row = find(lesson, term);
  if (!preceding.definition.endsWith(fragment)) throw new Error(`PDF layout changed: ${term}`);
  preceding.definition = preceding.definition.slice(0, -fragment.length).trim();
  row.term = corrected;
  row.extractionNote = `Term prefix ${fragment} recovered from the preceding definition cell.`;
}
for (const [lesson, term, embedded, partOfSpeech] of [
  ['3C', 'electronic version', 'remotely', 'adv'],
  ['4B', 'input device', 'jam', 'n'],
]) {
  const row = find(lesson, term), marker = ` ${embedded} (${partOfSpeech}) `;
  const offset = row.definition.indexOf(marker);
  if (offset < 0) throw new Error(`Missing embedded glossary term ${embedded}`);
  const definition = row.definition.slice(offset + marker.length);
  row.definition = row.definition.slice(0, offset);
  result.splice(result.indexOf(row) + 1, 0, { lessonId: lesson, term: embedded, definition, partOfSpeech, page: row.page, rawTerm: `${embedded} (${partOfSpeech})`, extractionNote: 'Separate vocabulary entry embedded in the preceding definition cell in the PDF.' });
}
find('4B', 'graphic design').definition = find('4B', 'graphic design').definition.replace('an d', 'and');
await fs.mkdir('content', { recursive: true });
await fs.writeFile('content/workbook-extracted.json', JSON.stringify(result, null, 2) + '\n');
for (const id of [...new Set(result.map(x => x.lessonId))]) console.log(id, result.filter(x => x.lessonId === id).map(x => x.term).join(' | '));
console.log('TOTAL', result.length);
