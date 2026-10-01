const fs = require('fs');
let s = fs.readFileSync(__dirname + '/../chatbot.js', 'utf8');
let n = fs.readFileSync(__dirname + '/../niches.js', 'utf8');
n = n.split(String.raw`['steak cook|how cook steak|medium rare|steak temperature|how do you cook',`).join(String.raw`['steak cook|steak cooked|how cook steak|medium rare|steak temperature|how do you cook|well done|rare steak',`);
fs.writeFileSync(__dirname + '/../niches.js', n);
const P = [
[String.raw`if (/\b(beer|wine|cocktail|alcohol|liquor|drink|vodka|whiskey|rum|tequila|bourbon|margarita|mojito|martini|21|age|old)\b/.test(c.text)`,
 String.raw`if (/\b(beer|wine|cocktail|alcohol|liquor|drink|vodka|whiskey|rum|tequila|bourbon|margarita|mojito|martini|shot)s?\b|\b(21|age|old)\b/.test(c.text)`],
[String.raw`    if (c.opsOK && !S.flows.order) { self.start('order'); c.started = c.started || 'order'; }`,
 String.raw`    if (c.opsOK && c.ops.every(function (o) { return o.ids.length === 1 && self.menu.byId[o.ids[0]].tags.indexOf('alc') >= 0; })) { c.opsOK = false; if (!T.minorReply) c.ops.forEach(function (o) { T.alc.push(self.menu.byId[o.ids[0]]); }); understood = true; }
    if (c.opsOK && !S.flows.order) { self.start('order'); c.started = c.started || 'order'; }`]
];
let bad = 0;
for (const [a, b] of P) { if (!s.includes(a)) { console.log('MISSING:', a.slice(0, 100)); bad++; } else s = s.split(a).join(b); }
fs.writeFileSync(__dirname + '/../chatbot.js', s);
console.log(bad ? bad + ' missing' : 'all applied');
