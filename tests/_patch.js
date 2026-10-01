const fs = require('fs');
let s = fs.readFileSync(__dirname + '/../chatbot.js', 'utf8');
const P = [
// B: cuisine names are never implicit dish heads ("thai" ≠ Pad Thai)
[String.raw`  var items = [], byId = {}, phrases = new Map(), cats = [];`,
String.raw`  var items = [], byId = {}, phrases = new Map(), cats = [];
  var cuisineWords = new Set(words(Object.keys(cfg.sections || {}).join(' ')));`],
[String.raw`        if (!GENERIC_HEADS.has(head) && head.length > 2 && !/^\d/.test(head)) add(head, it.id, false);`,
String.raw`        if (!GENERIC_HEADS.has(head) && !cuisineWords.has(head) && head.length > 2 && !/^\d/.test(head)) add(head, it.id, false);`],
// A + D: topic eligibility
[String.raw`      var ok = c.q || tp.score >= 2 || (c.stems.length <= 3 && !c.hasEnt && !c.started && !aw.field);`,
String.raw`      var freeText = /^(name|address|note|message|interests|eventType|occasion|budget)$/.test(aw.field || '');
      var ok = c.q || tp.score >= 2 || (c.stems.length <= 5 && !c.hasEnt && !c.started && !freeText);
      if (c.opsOK && !c.q) ok = false;`],
// C: "best seller in thai" is a question, not an order
[String.raw`    c.opsOK = c.ops.length > 0 && (!c.q || c.reqQ`,
String.raw`    var hardVerb = /\b(add|remove|delete|drop|make|change|swap|replace|take off|another|more|want|get|order|give|need|have)\b/.test(c.text) || c.ops.some(function (o) { return o.explicitQty; });
    c.opsOK = c.ops.length > 0 && !(c.topic && c.topic.score >= 2 && !hardVerb) && (!c.q || c.reqQ`],
// E: allergy wording
[String.raw`parts.push(this.fill('Our kitchen handles common allergens' + (cfg.allergens ? ' like ' + cfg.allergens : '') + ", please let our staff know so the kitchen can take care — we can't guarantee any dish is completely allergen-free."));`,
String.raw`parts.push(this.fill('Our kitchen handles common allergens' + (cfg.allergens ? ' like ' + cfg.allergens : '') + " — please let our staff know so the kitchen can take care. We can't guarantee any dish is completely allergen-free."));`],
// F: "do you have ramen" → the ramen dishes, not the whole section
[String.raw`    case 'menu': return this.showMenu(tp.cat, R);`,
String.raw`    case 'menu': if (c.mentions.length && (c.q || /\b(have|got|serve|sell)\b/.test(c.text))) return this.answerItemExists(c, R); return this.showMenu(tp.cat, R);`],
// G: spicy — spread across sections
[String.raw`      var sp = this.inSection(this.menu.items.filter(function (i) { return i.tags.indexOf('s') >= 0; }), c);`,
String.raw`      var sp = this.inSection(this.menu.items.filter(function (i) { return i.tags.indexOf('s') >= 0; }), c);
      if (!c.section) { var seen = {}, rr = [], rest = []; sp.forEach(function (i) { if (!seen[i.cat] && (i.tags.indexOf('s2') >= 0 || i.tags.indexOf('pop') >= 0)) { seen[i.cat] = 1; rr.push(i); } else rest.push(i); }); sp = rr.concat(rest); }`],
[String.raw`(hot.length ? 'The 🌶️🌶️ ones are the hottest. ' : '')`,
String.raw`(sp.slice(0, 6).some(function (i) { return i.tags.indexOf('s2') >= 0; }) ? 'The 🌶️🌶️ ones are the hottest. ' : '')`]
];
let bad = 0;
for (const [a, b] of P) { if (!s.includes(a)) { console.log('MISSING:', a.slice(0, 100)); bad++; } else s = s.split(a).join(b); }
fs.writeFileSync(__dirname + '/../chatbot.js', s);
console.log(bad ? bad + ' missing' : 'all applied');
