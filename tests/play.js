// quick transcript runner: node tests/play.js desi "msg1" "msg2 || batched second" ...
const { Brain, resolveConfig } = require('../chatbot.js');
const N = require('../niches.js');
const id = process.argv[2];
const now = process.env.NOW ? new Date(process.env.NOW) : new Date(2026, 9, 1, 15, 0);
const b = new Brain(resolveConfig(N[id]), { seed: 7, otherNames: Object.keys(N).filter(k => k !== id).map(k => N[k].name) });
let t = now.getTime();
for (const turn of process.argv.slice(3)) {
  const batch = turn.split(' || ').map(s => s.startsWith('{') ? { action: JSON.parse(s) } : { text: s });
  const r = b.handle(batch, new Date(t)); t += 60000;
  console.log('\n\x1b[33mYOU:\x1b[0m ' + turn);
  r.bubbles.forEach(x => {
    console.log('\x1b[36mBOT:\x1b[0m ' + x.text);
    (x.cards || []).forEach(c => console.log('   [card ' + c.type + '] ' + (c.type === 'cart' ? c.lines.map(l => l.qty + 'x ' + l.name).join(', ') + ' | total ' + c.total : c.type === 'summary' ? JSON.stringify(c.sections.map(s => s.rows)) + ' ' + JSON.stringify(c.contact) : c.type === 'menu' ? c.items.map(i => i.name).join(', ') : c.type === 'confirmed' ? c.records.map(r => r.ref).join(',') : c.type)));
    if (x.chips && x.chips.length) console.log('   chips: ' + x.chips.map(c => c.label).join(' | '));
  });
  if (r.events.length) console.log('   events: ' + r.events.map(e => e.type || 'cancel').join(','));
}
