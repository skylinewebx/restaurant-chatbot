// Quick regression for the latest bug list: node tests/quick.js
const { Brain, resolveConfig } = require('../chatbot.js');
const N = require('../niches.js');
let pass = 0, fail = 0;
function chat(now) {
  const b = new Brain(resolveConfig(N.demo), { seed: 5 }); let t = now.getTime();
  return { b, say: m => { const r = b.handle([{ text: m }], new Date(t)); t += 60000; const x = { text: r.bubbles.map(z => z.text).join('\n'), chips: r.bubbles.flatMap(z => z.chips || []), r }; if (process.argv.includes('-v')) console.log('  > ' + m + '\n    ' + x.text.replace(/\n+/g, ' ⏎ ')); return x; } };
}
function ok(cond, name, info) { if (cond) pass++; else { fail++; console.log('FAIL: ' + name + (info ? '\n   ' + String(info).slice(0, 300) : '')); } }
const SCOPE = /can't help with that/;
const cart = c => c.b.state.flows.order ? c.b.state.flows.order.items.map(l => l.qty + 'x' + l.id).join(',') : '';
const D = new Date(2026, 9, 1, 15, 0); // Thu 3 PM

let c = chat(D), e = c.say('hi');
ok(e.text === 'Hi! 👋 Welcome to the Demo Chatbot for Restaurants. How may I help you today?', 'welcome text', e.text);
ok(e.chips.map(x => x.label).join('|') === 'Menu|Order|Reserve a Table|Hours|Location', 'welcome buttons');

c = chat(D);
e = c.say('I want biryani'); ok(/Total: \$/.test(e.text) && cart(c) === '1xchicken-biryani', 'biryani added', e.text);
e = c.say('pickup'); ok((e.text.match(/240 Ward St/g) || []).length === 1 && !/closed right now/i.test(e.text), 'pickup address once', e.text);
ok(/ready in 20–25 minutes/.test(e.text) && /Mon–Sat, 11 AM–11 PM/.test(e.text), 'pickup line');
for (const [m, want] of [['also add a coke', '1xchicken-biryani,1xsoft-drink'], ['add a dessert', null], ['make it 2 biryani', '2xchicken-biryani,1xsoft-drink'], ['one more naan', '2xchicken-biryani,1xsoft-drink,1xbutter-naan'], ['and a cheesecake too', '2xchicken-biryani,1xsoft-drink,1xbutter-naan,1xnew-york-cheesecake']]) {
  e = c.say(m); ok(!SCOPE.test(e.text), 'in scope: ' + m, e.text);
  if (want) ok(cart(c) === want && /Total: \$/.test(e.text), 'cart after ' + m, cart(c) + ' | ' + e.text);
}
const seen = new Set(); let dup = false;
c = chat(D); ['2 biryani', 'pickup', 'add a coke', 'add a dessert', 'one more naan'].forEach(m => { const t = c.say(m).text; t.split('\n\n').forEach(p => { if (seen.has(p)) dup = p; seen.add(p); }); });
ok(!dup, 'no repeated paragraph across replies', dup);

c = chat(D); c.say('2 biryani'); e = c.say('delivery');
ok(/30–45 minutes/.test(e.text) && /street address/i.test(e.text), 'delivery asks street', e.text);
e = c.say('350 5th Ave'); ok(/ZIP/.test(e.text), 'asks ZIP', e.text);
e = c.say('10001'); ok(/name/i.test(e.text), 'asks name', e.text);
e = c.say('Sara'); ok(/phone, email, or both/.test(e.text), 'asks contact', e.text);

c = chat(D); e = c.say('reserve a table saturday 3pm for 4'); const R = c.b.state.flows.reserve;
ok(R && R.time === 900 && R.date === '2026-10-03' && R.guests === 4 && !/closed|booked/i.test(e.text), 'saturday 3pm accepted', e.text);
c = chat(D); e = c.say('table sunday 8pm'); ok(e.text === "Sorry, we're closed on Sundays. We're open Mon–Sat, 11 AM–11 PM." && !e.chips.length, 'sunday one line', e.text);
c = chat(new Date(2026, 9, 1, 8, 0)); e = c.say('table for 2 tomorrow at 7pm'); ok(!/closed/i.test(e.text), 'future booking checked against that day, not now', e.text);
c = chat(new Date(2026, 9, 1, 8, 0)); c.say('1 margherita for pickup'); e = c.say('asap'); ok(!/closed right now/i.test(e.text), 'asap before opening', e.text);

for (const p of ['+92 300 1234567', '0300-1234567', '(555) 123-4567', '555.123.4567', '+44 20 7946 0958']) {
  c = chat(D); c.say('2 fries for pickup'); c.say('5pm'); c.say('Sara'); c.say('phone'); e = c.say(p);
  ok(c.b.state.customer.phone && !/doesn't look|can't read/.test(e.text), 'phone accepted ' + p, e.text);
}
c = chat(D); c.say('2 fries for pickup'); c.say('5pm'); c.say('Sara'); c.say('phone');
const r1 = c.say('abc').text, r2 = c.say('123').text, r3 = c.say('12').text;
ok(!c.b.state.customer.phone && r1 !== r2 && r2 !== r3 && /555/.test(r1) && /\(212\) 555-0188/.test(r3), 'junk phones rejected, different messages', [r1, r2, r3].join(' || '));

c = chat(D); e = c.say('where are you located');
ok(e.text === '📍 240 Ward St, 35th Street, New York, NY 10001' && e.r.bubbles[0].cards.some(x => x.label === 'Get directions'), 'location only', e.text);
e = c.say('what are your hours'); ok(e.text === '🕐 Mon–Sat: 11 AM – 11 PM · Sun: Closed', 'hours only', e.text);
ok(!/phone|email|name/i.test(c.say('menu').text), 'menu: no contact ask');

c = chat(new Date(2026, 9, 1, 19, 0)); c.say('2 biryani and a mango lassi for pickup'); c.say('8pm'); c.say('Sara Khan'); c.say('both'); c.say('+92 300 1234567 sara@example.com');
e = c.say('confirm'); ok(/Sara/.test(e.text) && /call or email you/.test(e.text) && /Enjoy your evening!/.test(e.text), 'closing', e.text);
ok(e.r.bubbles[1] && e.r.bubbles[1].text === 'Anything else I can help with?', 'anything else once');
e = c.say('thanks'); ok(/Enjoy your evening/.test(e.text), 'goodbye', e.text);
e = c.say('bye'); ok(e.r.bubbles.length === 0, 'stops after goodbye');
ok(SCOPE.test(c.say('who won the world cup').text), 'out of scope still works');

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
