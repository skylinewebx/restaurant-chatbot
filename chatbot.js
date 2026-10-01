/*!
 * Food & Restaurant AI Chatbot — one engine, one config per niche (niches.js)
 * Skyline Web Co
 *
 * Demo page:   index.html?niche=desi&name=My%20Place&city=Chicago&phone=(312)%20555-0100
 * Embed:       <script src="https://YOUR-SITE.netlify.app/chatbot.js" data-niche="desi" data-name="Business Name"></script>
 *              optional: data-city, data-phone, data-open="true",
 *                        data-webhook="https://…"  (confirmed bookings/orders are POSTed there as JSON)
 *
 * The widget lives in a Shadow DOM, so the host site's CSS can never break it.
 * No API key: replies come from the rule-based intent engine below (synonyms, typo
 * tolerance, keyword scoring). See "CLAUDE API HOOK" in Brain#handle to plug in an LLM.
 */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.FoodChatbot = api; if (typeof document !== 'undefined') api._autoInit(); }
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
'use strict';

var CURRENT_SCRIPT = (typeof document !== 'undefined' && document.currentScript) || null;

/* ═══════════════════════ 1. DATE / TIME / TEXT HELPERS ═══════════════════════ */
var DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
var DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var MON_RE = '(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)';
var WD_RE = '(sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|tues|wed|thu|thur|thurs|fri|sat)';

function pad(n) { return (n < 10 ? '0' : '') + n; }
function sod(d) { var x = new Date(d.getTime()); x.setHours(0, 0, 0, 0); return x; }
function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
function dkey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function kdate(k) { var p = k.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function at(key, mins) { var d = kdate(key); d.setMinutes(mins); return d; }
function dayDiff(a, b) { return Math.round((sod(b) - sod(a)) / 864e5); }
function fmtDate(d) { if (typeof d === 'string') d = kdate(d); return DAY_SHORT[d.getDay()] + ', ' + MON_SHORT[d.getMonth()] + ' ' + d.getDate(); }
function fmtTime(m) { m = ((m % 1440) + 1440) % 1440; var h = Math.floor(m / 60), mi = m % 60, ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + pad(mi) + ' ' + ap; }
function fmtT(m) { return fmtTime(m).replace(':00', ''); }
function money(n) { return '$' + (Math.round(n * 100) / 100).toFixed(2); }
function monIdx(s) { return ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(s.slice(0, 3)); }
function wdIdx(s) { return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(s.slice(0, 3)); }
function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function deacc(s) { return String(s).normalize ? String(s).normalize('NFD').replace(/[̀-ͯ]/g, '') : String(s); }
function words(s) { return deacc(String(s).toLowerCase()).replace(/&/g, ' and ').replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9 ]+/g, ' ').trim().split(/\s+/).filter(Boolean); }
function stem(w) {
  if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + 'y';
  if (w.length > 4 && /(ches|shes|xes|sses)$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && /s$/.test(w) && !/(ss|us|is)$/.test(w)) return w.slice(0, -1);
  return w;
}
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function lc1(s) { return s ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
function titleCase(s) { return s.toLowerCase().replace(/(^|[\s'-])([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); }); }
function joinList(a, conj) { a = a.filter(Boolean); if (a.length < 2) return a[0] || ''; return a.slice(0, -1).join(', ') + ' ' + (conj || 'and') + ' ' + a[a.length - 1]; }
function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
function lev(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  var pp = null, prev = [], cur, i, j;
  for (j = 0; j <= b.length; j++) prev[j] = j;
  for (i = 1; i <= a.length; i++) {
    cur = [i]; var best = i;
    for (j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (pp && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], pp[j - 2] + 1);
      if (cur[j] < best) best = cur[j];
    }
    if (best > max) return max + 1;
    pp = prev; prev = cur;
  }
  return prev[b.length];
}

/* hours "12:00-22:30,17:00-01:00" → {mon:[[720,1350],[1020,1500]], …} (close may exceed 1440) */
function parseHours(h) {
  var out = {};
  DAY_KEYS.forEach(function (k) {
    out[k] = [];
    var s = (h && h[k] || '').trim();
    if (!s || /closed/i.test(s)) return;
    s.split(',').forEach(function (r) {
      var p = r.split('-').map(function (t) { var q = t.trim().split(':'); return (+q[0]) * 60 + (+q[1] || 0); });
      out[k].push([p[0], p[1] <= p[0] ? p[1] + 1440 : p[1]]);
    });
  });
  return out;
}

/* ═══════════════════════ 2. LANGUAGE DATA ═══════════════════════ */
var SLANG = {
  tmrw: 'tomorrow', tmr: 'tomorrow', tmrrw: 'tomorrow', tmro: 'tomorrow', tomoro: 'tomorrow', tomorow: 'tomorrow', tommorow: 'tomorrow', tommorrow: 'tomorrow', tomorrw: 'tomorrow', '2morrow': 'tomorrow', '2moro': 'tomorrow', '2mrw': 'tomorrow',
  '2nite': 'tonight', tonite: 'tonight', '2night': 'tonight', tnite: 'tonight', tonigt: 'tonight', '2day': 'today', tdy: 'today', tody: 'today',
  pls: 'please', plz: 'please', plss: 'please', plzz: 'please', pleas: 'please', u: 'you', ya: 'you', ur: 'your', r: 'are', thx: 'thanks', thnx: 'thanks', thanx: 'thanks', tnx: 'thanks', ty: 'thanks', tysm: 'thanks', tq: 'thanks',
  eve: 'evening', evng: 'evening', nite: 'night', ppl: 'people', ppls: 'people', pax: 'people', ppl8: 'people', n: 'and', '&': 'and', abt: 'about', bday: 'birthday', 'b-day': 'birthday', anniv: 'anniversary',
  rsvp: 'reservation', rez: 'reservation', resv: 'reservation', reservaton: 'reservation', resrvation: 'reservation', hrs: 'hours', addr: 'address', wat: 'what', wut: 'what', wht: 'what', wanna: 'want to', gonna: 'going to', gimme: 'give me', lemme: 'let me',
  k: 'ok', kk: 'ok', okay: 'ok', okey: 'ok', oky: 'ok', yeah: 'yes', yep: 'yes', yup: 'yes', yea: 'yes', ye: 'yes', yass: 'yes', nah: 'no', nope: 'no', naw: 'no', cuz: 'because', coz: 'because', b4: 'before', nxt: 'next', frm: 'from', thru: 'through',
  msg: 'message', num: 'number', no_: 'no', tel: 'phone', ph: 'phone', mob: 'mobile', veggie: 'vegetarian', vego: 'vegetarian', gf: 'gluten free', nyc: 'new york', pic: 'picture', delivry: 'delivery', dlivery: 'delivery', delievery: 'delivery', pikup: 'pickup', 'pick-up': 'pickup', takout: 'takeout', 'take-out': 'takeout',
  sat: 'sat', w: 'with', bc: 'because', rn: 'right now', asap: 'asap', idk: 'i do not know', btw: 'by the way', pp: 'people', ppls8: 'people', hv: 'have', hve: 'have', wid: 'with', de: 'the', da: 'the'
};
var NUMW = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };

var COMMON = new Set(('a about above after again against all almost alone along already also always am among an and another any anyone anything anywhere are around as ask asked at away back bad be because been before being below best better between big bit both bring bringing but buy by call called came can cannot come coming could day days did do does doing done down during each early eat eating either else end enough even evening ever every everyone everything fine first for found free friend friends from full get gets getting give given go goes going good got great guy guys had half happy has have having he hear hello help her here hey hi him his hmm hold home hope how however i if im in into is it its just keep kind know last late later least left less let like little long look looking lot lots love made make many may maybe me mean might mind mine more morning most much must my myself name near need needs never new next nice night no none nor not nothing now of off often ok okay old on once one only open or other our ours out over own part people perhaps place please plus pm am put quick quite rather ready real really right said same saw say see seem seen she should show since so some someone something sometimes soon sorry still such sure take tell than thank thanks that the their them then there these they thing things think this those though through time to today together tomorrow tonight too two under until up upon us use used very wait want wanted wants was way we week well went were what whatever when where whether which while who whole whom whose why will wish with within without wonder would yes yet you your yours yourself ' +
  'water wine beer drink drinks food foods eat meal meals lunch dinner breakfast brunch dessert desserts sweet salt salty sour spicy hot cold warm chicken beef lamb goat mutton fish rice bread cheese sauce salad soup cake cakes coffee tea milk sugar vegetable vegetables veg meat pork egg eggs nut nuts side sides order orders table tables seat seats book booking cancel change add remove price prices cost money cash card pay paid delivery deliver pickup kids kid child children family birthday party event events wedding office work car park parking street road avenue apt floor house phone email number address zip code city town world cup won game weather news president capital country music movie song joke story poem write translate stock market man woman wife husband mom dad mother father son daughter sister brother boyfriend girlfriend partner husband friend baby small large medium extra plain double single fresh fried grilled baked roasted mixed special classic house regular big tiny huge lot yummy delicious tasty best favorite favourite popular recommend recommended famous menu dish dishes plate bowl cup glass bottle can slice piece pieces portion size sizes weight pound kg inch message note name names outside inside indoor outdoor window bar booth patio seating reservation reservations reserve dine dining guests guest person persons minutes minute hours hour second seconds am pm oclock weekend weekday week month year date dates morning afternoon evening night noon midnight early late soon asap sure maybe fine cool awesome amazing lovely nice perfect correct right wrong okay alright yeah hmm um uh oh wow great good bad terrible allergy allergic gluten dairy peanut peanuts vegan vegetarian halal kosher spicy mild medium hot').split(/\s+/));

var DOMAIN = ('reservation reservations reserve booking delivery deliver delivered pickup takeout takeaway tomorrow tonight today monday tuesday wednesday thursday friday saturday sunday january february march april june july august september october november december birthday anniversary outdoor outside indoor inside patio terrace allergic allergy allergies allergen allergens gluten vegetarian vegan halal spicy catering cater available availability evening afternoon morning menu hours location address parking payment dessert desserts children people guests persons minimum cancel order please thanks hello private event wedding corporate chocolate vanilla strawberry message email phone number both weekend lunch dinner breakfast brunch opening closing directions wheelchair accessible confirm recommend popular signature combo combos deals special specials seating occasion anniversary graduation quote budget interested interests address apartment').split(/\s+/);

/* concept tags used to suggest the "closest" item when a dish isn't on the menu */
var DISH_HINTS = {
  'biryani': 'rice spicy', 'pulao': 'rice', 'fried rice': 'rice', 'paella': 'rice seafood', 'risotto': 'rice', 'karahi': 'curry spicy', 'curry': 'curry', 'korma': 'curry', 'tikka masala': 'curry', 'butter chicken': 'curry', 'vindaloo': 'curry spicy', 'nihari': 'curry', 'haleem': 'curry', 'daal': 'lentil', 'dal': 'lentil',
  'naan': 'bread', 'roti': 'bread', 'paratha': 'bread', 'pita': 'bread', 'garlic bread': 'bread', 'bagel': 'bread', 'croissant': 'pastry', 'pad thai': 'noodles', 'ramen': 'noodles soup', 'pho': 'noodles soup', 'lo mein': 'noodles', 'chow mein': 'noodles', 'udon': 'noodles', 'noodles': 'noodles',
  'spaghetti': 'pasta', 'pasta': 'pasta', 'lasagna': 'pasta', 'mac and cheese': 'pasta cheese', 'sushi': 'fish rice', 'sashimi': 'fish', 'poke': 'fish rice', 'fish and chips': 'fish fried', 'pizza': 'pizza cheese', 'calzone': 'pizza cheese', 'burger': 'burger', 'hamburger': 'burger', 'cheeseburger': 'burger cheese',
  'hot dog': 'sandwich', 'sandwich': 'sandwich', 'wrap': 'wrap', 'taco': 'wrap', 'burrito': 'wrap', 'quesadilla': 'wrap cheese', 'nachos': 'snack cheese', 'enchilada': 'wrap', 'fajita': 'grill', 'shawarma': 'wrap grill', 'falafel': 'veggie fried', 'hummus': 'dip', 'kebab': 'grill', 'kabab': 'grill', 'gyro': 'wrap grill',
  'steak': 'grill beef', 'ribs': 'grill', 'brisket': 'grill beef', 'wings': 'fried chicken', 'fried chicken': 'fried chicken', 'dumplings': 'dumpling', 'momos': 'dumpling', 'dim sum': 'dumpling', 'spring roll': 'fried', 'samosa': 'fried snack', 'salad': 'salad', 'soup': 'soup', 'fries': 'fried side', 'onion rings': 'fried side',
  'ice cream': 'frozen dessert', 'gelato': 'frozen dessert', 'milkshake': 'shake dessert', 'cake': 'cake dessert', 'cheesecake': 'cake dessert', 'brownie': 'dessert', 'cookie': 'dessert', 'cupcake': 'cake dessert', 'donut': 'pastry dessert', 'pie': 'dessert', 'tiramisu': 'dessert', 'baklava': 'dessert', 'churros': 'dessert fried', 'mochi': 'dessert', 'waffle': 'dessert', 'pancakes': 'breakfast', 'omelette': 'breakfast egg',
  'coke': 'soda', 'coca cola': 'soda', 'pepsi': 'soda', 'sprite': 'soda', 'fanta': 'soda', 'soda': 'soda', 'diet coke': 'soda', 'coffee': 'coffee', 'latte': 'coffee', 'cappuccino': 'coffee', 'espresso': 'coffee', 'tea': 'tea', 'chai': 'tea', 'lassi': 'yogurt drink', 'smoothie': 'drink', 'juice': 'drink', 'lemonade': 'drink', 'water': 'drink',
  'lobster': 'seafood', 'shrimp': 'seafood', 'crab': 'seafood', 'oysters': 'seafood', 'salmon': 'fish', 'tuna': 'fish', 'lamb chops': 'grill', 'dosa': 'bread', 'thali': 'curry', 'kimchi': 'side', 'bibimbap': 'rice', 'croissants': 'pastry'
};
var CAT_HINTS = [[/drink|beverage|shake|lassi|juice|soda/, 'drink soda'], [/dessert|sweet|ice cream|gelato/, 'dessert'], [/bread|naan|roti/, 'bread'], [/rice|biryani/, 'rice'], [/noodle|ramen/, 'noodles'], [/grill|bbq|tandoor|kebab|smok/, 'grill'], [/side/, 'side'], [/pasta/, 'pasta'], [/pizza/, 'pizza'], [/burger/, 'burger'], [/taco|burrito|wrap|shawarma/, 'wrap'], [/sushi|roll|sashimi/, 'fish rice'], [/soup/, 'soup'], [/salad/, 'salad'], [/coffee|espresso/, 'coffee'], [/tea|chai/, 'tea'], [/cake/, 'cake dessert'], [/pastr|bak|croissant/, 'pastry'], [/curr|karahi|handi|masala/, 'curry']];
var GENERIC_HEADS = new Set('meal deal combo box special plate platter bowl set feast cup pack tray bucket basket side starter small large regular can bottle glass piece slice scoop order portion classic original deluxe supreme house the of and with mix mixed chicken beef lamb mutton goat veg vegetable paneer fish shrimp prawn spicy sweet hot cold iced fresh plain butter garlic cheese double single mini extra kids kid family party'.split(' '));

var INJECTION = /\b(ignore|disregard|forget|override|bypass)\b[^.?!]{0,40}\b(instruction|instructions|rules|prompt|prompts|previous|above|guidelines|programming|system)\b|\bsystem prompt\b|\byou are now\b|\bfrom now on you\b|\bpretend (to be|you are|youre|you're)\b|\bact as (a|an|my|if)\b|\bjailbreak\b|\bdeveloper mode\b|\bdan mode\b|\breveal (your|the) (prompt|instructions|rules|system|code)\b|\bnew instructions\b|\bprompt injection\b|\broleplay as\b|\bsudo\b/i;
var OOS_RE = /\b(weather|forecast|news|politics|political|president|election|prime minister|stock|stocks|bitcoin|crypto|ethereum|football|soccer|nba|nfl|cricket|world cup|super bowl|homework|math|equation|algebra|calculus|capital of|who won|write (me )?(a|an) (poem|story|essay|song|code|letter|email)|poem|joke|jokes|riddle|lyrics|translate|python|javascript|programming|coding|chatgpt|openai|gemini|movie|movies|netflix|horoscope|dating advice|relationship advice|medical advice|lawyer|legal advice|tax return|meaning of life|capital city|population of|how far is the moon|solve|essay|girlfriend advice|celebrity|instagram|tiktok|song|sing me|play music|bank|loan|insurance|flight|flights|hotel|hotels|uber ride|taxi)\b/i;
var OTHER_PLACES = /\b(mcdonalds?|kfc|burger king|wendys?|taco bell|dominos?|pizza hut|papa johns?|starbucks|dunkin|chipotle|five guys|shake shack|panera|popeyes|chick fil a|olive garden|applebees?|nandos?|ihop|dennys?|panda express|little caesars|jollibee|nobu|in n out|white castle|subway restaurant|tim hortons|dairy queen|baskin robbins|cold stone|krispy kreme|cheesecake factory)\b|\b(other|another|different|nearby|better|cheaper|competitor|competitors|rival) (restaurant|restaurants|place|places|spot|spots|pizzeria|bakery|cafe|diner|caterer|caterers)\b|\bbest (restaurant|restaurants|place|places) (in|near|around)\b|\brestaurants? (near|around) (me|here)\b|\b(recommend|suggest) (a|another|some) (restaurant|place)/i;
var Q_START = /^(what|whats|when|where|which|who|why|how|do|does|did|is|are|was|were|can|could|would|will|should|may|shall|any|anything|have you|has|got|tell me|i wonder|wondering|you have|you guys have|u have)\b/;
var REQ_RE = /\b(can|could|may|would) (i|we|you)( please)? (get|have|order|book|reserve|grab|add|make|place|take|do|remove|change|cancel|put|set)\b|\b(i|we) (would like|will have|will take|want|wanna|need|would love|am looking|are looking|d like)\b|\blet me (get|have|order|book)\b/;
var RESERVE_RE = /\b(table|tables|reservation|reservations|reserve|reserved|book|booking|dine in|dinein|sit down|seat us|seats for|a seat)\b/;
var ORDER_RE = /\b(order|ordering|deliver|delivery|delivered|takeout|take out|takeaway|take away|carryout|carry out|to go|checkout|my cart)\b/;
var CAKE_RE = /\b(cakes?|cupcakes?|custom cake|cake order)\b/;
var CATER_RE = /\b(cater|catering|caterer|party trays?|office lunch|corporate lunch|food for (an|our|my) (event|party|office|wedding))\b/;
var EVENT_RE = /\b(private (event|party|function|area|space)|buyout|buy out|rent (the|your) (place|restaurant|space|venue)|host (a|our|my) (party|event))\b/;

/* allergen codes used in niches.js */
var ALLERGENS = { G: 'gluten', D: 'dairy', E: 'egg', N: 'tree nuts', P: 'peanuts', S: 'soy', SE: 'sesame', F: 'fish', SH: 'shellfish' };
var ALLERGEN_WORDS = [[/\bpeanuts?\b/, ['P']], [/\b(tree nuts?|nuts?|almonds?|cashews?|walnuts?|pistachios?|pecans?|hazelnuts?)\b/, ['N', 'P']], [/\b(dairy|milk|lactose|cheese|butter|cream)\b/, ['D']], [/\b(gluten|wheat|celiac|coeliac)\b/, ['G']], [/\beggs?\b/, ['E']], [/\b(soy|soya)\b/, ['S']], [/\bsesame\b/, ['SE']], [/\b(shellfish|shrimp|prawns?|crab|lobster)\b/, ['SH']], [/\bfish\b/, ['F']]];
var TAG_LABEL = { v: 'Vegetarian', vg: 'Vegan', h: 'Halal', s: 'Spicy', s2: 'Very spicy', gf: 'Gluten-free', pop: 'Popular', k: 'Kids', new: 'New', alc: '21+', nuts: 'Contains nuts', dairy: 'Dairy' };
var SEAT_LABEL = { indoor: 'Indoor', outdoor: 'Outdoor', booth: 'Booth', window: 'Window table', bar: 'Bar / counter', private: 'Private dining room', any: 'No preference' };

/* ═══════════════════════ 3. MENU INDEX ═══════════════════════ */
function slug(s) { return deacc(String(s).toLowerCase()).replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
function buildMenu(cfg) {
  var items = [], byId = {}, phrases = new Map(), cats = [];
  var cuisineWords = new Set(words(Object.keys(cfg.sections || {}).join(' ')));
  function add(p, id, explicit) {
    var k = words(p).map(stem).join(' ');
    if (!k) return;
    var e = phrases.get(k);
    if (!e) { e = { x: [], i: [] }; phrases.set(k, e); }
    var arr = explicit ? e.x : e.i;
    if (arr.indexOf(id) < 0) arr.push(id);
  }
  (cfg.menu || []).forEach(function (sec) {
    cats.push(sec.cat);
    sec.items.forEach(function (a) {
      var it = { id: slug(a[0]), name: a[0], price: a[1], tags: (a[2] || '').split(/\s+/).filter(Boolean), al: (a[3] || '').split(/\s+/).filter(Boolean), desc: a[4] || '', aka: (a[5] || '').split('|').map(function (s) { return s.trim(); }).filter(Boolean), cat: sec.cat };
      var hay = (it.name + ' ' + it.desc + ' ' + it.cat).toLowerCase(), con = [];
      Object.keys(DISH_HINTS).forEach(function (k) { if (new RegExp('\\b' + k + 's?\\b').test(hay)) con = con.concat(DISH_HINTS[k].split(' ')); });
      CAT_HINTS.forEach(function (h) { if (h[0].test(it.cat.toLowerCase())) con = con.concat(h[1].split(' ')); });
      it.concepts = uniq(con);
      items.push(it); byId[it.id] = it;
      add(it.name, it.id, true);
      it.aka.forEach(function (p) { add(p, it.id, true); });
      var w = words(it.name).map(stem);
      if (w.length > 1) {
        var head = w[w.length - 1];
        if (!GENERIC_HEADS.has(head) && !cuisineWords.has(head) && head.length > 2 && !/^\d/.test(head)) add(head, it.id, false);
        var tail = w.slice(1).join(' '); if (w.length > 2 || (!GENERIC_HEADS.has(tail) && !cuisineWords.has(tail))) add(tail, it.id, false);
        if (w.length > 2) add(w.slice(-2).join(' '), it.id, false);
      }
    });
  });
  return { items: items, byId: byId, phrases: phrases, cats: cats };
}

/* common Q&As — each niche supplies its own answer in cfg.facts (some have defaults) */
var COMMON_FAQ = [
  ['wifi', 'wifi|wi fi|internet|wireless|wifi password'],
  ['wheelchair', 'wheelchair|accessible|accessibility|ramp|disabled|disability|stroller|step free|elevator'],
  ['pets', 'dog|pet|pet friendly|service animal|puppy'],
  ['dress', 'dress code|dress|attire|what to wear|what should i wear|smart casual|jeans'],
  ['giftcards', 'gift card|giftcard|voucher|gift certificate|e gift'],
  ['loyalty', 'loyalty|reward|point|punch card|stamp card|membership|loyalty program'],
  ['alcohol', 'alcohol|byob|wine|beer|liquor|cocktail|corkage|liquor license|bring my own wine|bring our own wine|serve alcohol'],
  ['cancelPolicy', 'cancellation policy|cancel policy|no show|deposit|cancellation fee|reschedule|change my reservation'],
  ['late', 'running late|late for|hold table|hold my table|hold the table|grace period|arrive late|be late|we are late'],
  ['music', 'live music|music|tv|sport|game on|screen|dj|karaoke|watch the game'],
  ['birthday', 'birthday perk|birthday special|birthday dessert|birthday free|free dessert|bring cake|bring our own cake|bring my own cake|bring a cake|cake fee|cakeage|cake cutting|candle|sing happy birthday|decoration|balloon|decorate'],
  ['wait', 'wait time|walk in|walkin|busy|queue|how long wait|crowded|rush|peak|long line|wait list|waitlist'],
  ['discount', 'discount|coupon|promo|promo code|student discount|military discount|senior discount|first order discount'],
  ['restroom', 'restroom|bathroom|toilet|washroom|changing table'],
  ['jobs', 'job|hiring|career|work here|work for you|apply|vacancy|position open|job opening'],
  ['tip', 'tip|tipping|gratuity|service charge|service fee'],
  ['nutrition', 'calorie|nutrition|nutritional|macro|protein|keto|low carb|healthy|healthiest'],
  ['recipe', 'recipe|secret recipe|how do you make|how you make|teach me']
];
var FACT_DEFAULTS = {
  restroom: 'Yes, we have clean restrooms for guests, including an accessible one.',
  jobs: "We're always happy to meet great people! Drop your resume at the counter or email it to {email}.",
  tip: "Tipping is always appreciated but never required. For parties of 8 or more, an 18% service charge is added to the bill.",
  recipe: "Our recipes are a well-kept family secret 😉 — but we're happy to tell you what's in any dish if you have dietary questions.",
  nutrition: "We don't publish full nutrition facts yet, but our staff can walk you through ingredients and lighter options.",
  wifi: 'Yes, we have free Wi-Fi for guests — just ask your server for the password.',
  wheelchair: 'Yes, we have step-free access and an accessible restroom.',
  pets: 'Service animals are always welcome. Pets are welcome in our outdoor area if we have one.',
  dress: 'No dress code — come as you are!',
  giftcards: 'Yes! Gift cards are available at the counter in any amount.',
  loyalty: "We don't have a loyalty program right now, but keep an eye out — it's coming soon.",
  alcohol: "We don't serve alcohol.",
  cancelPolicy: "No deposit is needed for regular tables. If plans change, just let us know as early as you can.",
  late: 'We hold tables for 15 minutes. If you are running late, give us a quick call at {phone} and we will do our best.',
  music: 'We keep soft background music playing — it is a relaxed spot to talk.',
  birthday: "Celebrating? Let us know when you book and we'll make it special — you're welcome to bring your own cake.",
  wait: 'Walk-ins are welcome! Weekends from 7–9 PM get busy, so a reservation is a good idea then.',
  discount: 'Keep an eye on our deals and combos — they are the best value on the menu.'
};

/* structured topics: kw alternatives separated by "|", all words in an alternative must be present */
var TOPICS = [
  { id: 'hours', kw: 'hour|opening hour|open|opening|close|closing|closed|timing|what time open|what time close|open late|late night|open today|open now|still open|business hour|when open|open on|open till|open until|what time do you' },
  { id: 'location', kw: 'where~|address|location|located|direction|find you|subway|train|landmark|map|how get there|how to get there|near you|cross street|which street' },
  { id: 'contact', kw: 'phone number|your phone|your number|call you|contact|email address|your email|reach you|speak someone|talk someone|human|real person|manager|staff member|speak to person|talk to person' },
  { id: 'parking', kw: 'parking|park|garage|valet|parking lot' },
  { id: 'payment', kw: 'pay|payment|card|credit|debit|cash|apple pay|google pay|amex|visa|mastercard|venmo|zelle|split bill|split check|contactless|pay online' },
  { id: 'delivery', kw: 'deliver|delivery|delivery area|delivery fee|delivery charge|minimum order|minimum|zone|doordash|ubereat|uber eat|grubhub|seamless|deliver to|area do you deliver|delivery radius' },
  { id: 'deliveryTime', kw: 'how long delivery|delivery time|how long deliver|delivery take|how long take|how long order|how fast|eta|how long food|how long it take' },
  { id: 'pickup', kw: 'pickup|pick up|takeout|carryout|collect|curbside|take away|takeaway' },
  { id: 'seating', kw: 'outdoor|outside|patio|terrace|seating|indoor|booth|sit outside|capacity|how many seat|big table|large table|rooftop|garden|window seat|table size|how many people fit|seat' },
  { id: 'kids', kw: 'kid|kids menu|child|children|high chair|baby|family friendly|toddler|booster' },
  { id: 'privateEvents', kw: 'private|party room|private dining|buyout|host party|host event|large group|big group|event space|group booking' },
  { id: 'reservationInfo', kw: 'reservation|reserve|book|booking|take reservation|need reservation|walk in or reservation', flow: 'reserve' },
  { id: 'halal', kw: 'halal|zabiha|zabihah|pork|kosher|haram|lard' },
  { id: 'veg', kw: 'vegetarian|vegan|plant based|meatless|meat free|no meat|veggie option|veg option|veg dish|veg item' },
  { id: 'gf', kw: 'gluten free|gluten|celiac|coeliac|wheat free' },
  { id: 'spicy', kw: 'spicy|spice|heat|mild|how hot|spice level|not spicy|too spicy|hot', item: true },
  { id: 'best', kw: 'best|recommend|recommendation|popular|signature|famous|must try|favorite|favourite|speciality|specialty|good here|chef special|bestseller|best seller|what should i get|what should i order|what is good|what good' },
  { id: 'deals', kw: 'deal|combo|offer|special offer|happy hour|lunch special|family meal|bundle|value meal|promotion|special' },
  { id: 'menu', kw: 'menu|dish|what do you serve|what do you have|food option|option|what you got|full menu|category|what kind of food|type of food|cuisine|what food' },
  { id: 'price', kw: 'price|cost|how much|pricing|expensive|cheap|affordable|charge', item: true },
  { id: 'itemInfo', kw: 'what is|what in|ingredient|describe|tell me about|made with|made of|contain|come with|serve with|how big|portion|what does come|explain', item: true, needItem: true },
  { id: 'catering', kw: 'catering|cater|party tray|office lunch|feed people', flow: 'catering' },
  { id: 'cakes', kw: 'cake|custom cake|birthday cake|wedding cake|cupcake|cake order', flow: 'cake' },
  { id: 'tax', kw: 'tax|sales tax' },
  { id: 'bot', kw: 'are you bot|are you human|are you real|are you ai|who are you|what are you|robot|chatbot|are you person' },
  { id: 'cart', kw: 'my cart|in my cart|order so far|my total|total|what did i order|show cart|view cart|review order|what in my order|my order so far' },
  { id: 'orderStatus', kw: 'where my order|order status|track order|track my order|when will my order|is my order ready|status of my order' }
];

function parseKw(kw) {
  return kw.split('|').map(function (alt) {
    var weak = /~$/.test(alt); alt = alt.replace(/~$/, '');
    return { w: alt.trim().split(/\s+/).map(stem), weak: weak };
  });
}

/* ═══════════════════════ 4. REPLY BUILDER ═══════════════════════ */
function Reply(b) { this.b = b; this.ans = []; this.acks = []; this.errs = []; this.q = null; this.cards = []; this.chips = null; this.after = []; this.events = []; this.silent = false; this.scoped = false; this.gib = false; }
Reply.prototype.say = function (t) { if (t && this.ans.indexOf(t) < 0) this.ans.push(t); };
Reply.prototype.card = function (c) { if (c) this.cards.push(c); };
Reply.prototype.done = function () {
  var b = this.b, bubbles = [];
  if (this.silent) return { bubbles: [], events: this.events };
  if (this.hoursOnly) return { bubbles: [{ text: this.hoursOnly, cards: [], chips: [] }], events: this.events };
  var parts = this.ans.concat(this.acks, this.errs);
  if (this.q) parts.push(this.q);
  if (!parts.length && !this.cards.length && !this.after.length) {
    if (this.scoped) return { bubbles: [{ text: b.fill(b.cfg.scopeLine || "Sorry, I can't help with that. Feel free to ask me anything about {name}! 😊"), cards: [], chips: [] }], events: this.events };
    return { bubbles: [{ text: "Sorry, I didn't quite catch that. Could you rephrase?", cards: [], chips: [] }], events: this.events };
  }
  if (parts.length || this.cards.length) bubbles.push({ text: parts.join('\n\n'), cards: this.cards, chips: this.chips || [] });
  this.after.forEach(function (x) { bubbles.push(x); });
  return { bubbles: bubbles, events: this.events };
};

var FLOW_FIELDS = {
  reserve: ['date', 'time', 'guests', 'seating', 'occasion', 'note'],
  order: ['items', 'mode', 'address', 'time'],
  cake: ['flavor', 'size', 'message', 'date', 'time'],
  catering: ['date', 'guests', 'eventType', 'budget', 'interests'],
  event: ['date', 'guests', 'time', 'occasion']
};
var FLOW_TITLE = { reserve: 'Table reservation', order: 'Order', cake: 'Custom cake', catering: 'Catering request', event: 'Private event inquiry' };

function freshState() {
  return { flows: {}, active: [], customer: { name: null, phone: null, email: null, pref: null }, awaiting: null, pending: null, errors: {}, lastErr: {}, picks: {}, done: [], review: false, ended: false, lastFlow: null, lastItem: null, tmp: null, greeted: false };
}

/* ═══════════════════════ 5. THE BRAIN ═══════════════════════ */
function Brain(cfg, opts) {
  opts = opts || {};
  this.cfg = cfg;
  this.rand = opts.seed != null ? mulberry32(opts.seed) : Math.random;
  this.hours = parseHours(cfg.hours);
  this.menu = buildMenu(cfg);
  this.state = opts.state || freshState();
  this.now = new Date();
  this.otherNames = (opts.otherNames || []).map(function (n) { return words(n).join(' '); }).filter(Boolean);
  var self = this;
  // vocabulary for typo correction
  var vocab = new Set();
  this.menu.phrases.forEach(function (v, k) { k.split(' ').forEach(function (w) { vocab.add(w); }); });
  DOMAIN.forEach(function (w) { vocab.add(w); vocab.add(stem(w)); });
  Object.keys(DISH_HINTS).forEach(function (k) { k.split(' ').forEach(function (w) { vocab.add(w); }); });
  (cfg.cakes ? cfg.cakes.flavors : []).forEach(function (f) { words(f).forEach(function (w) { vocab.add(w); }); });
  this.menu.cats.forEach(function (c) { words(c).forEach(function (w) { vocab.add(stem(w)); }); });
  this.vocab = vocab;
  this.vocabList = Array.from(vocab).filter(function (w) { return w.length >= 4 && !/\d/.test(w); });
  this.fixCache = {};
  // topics + FAQs
  this.topics = TOPICS.map(function (t) { return { id: t.id, alts: parseKw(t.kw), flow: t.flow, item: t.item, needItem: t.needItem, kind: 'topic' }; });
  COMMON_FAQ.forEach(function (f) {
    var a = (cfg.facts && cfg.facts[f[0]]) || FACT_DEFAULTS[f[0]];
    if (a) self.topics.push({ id: 'fact:' + f[0], alts: parseKw(f[1]), answer: a, kind: 'faq' });
  });
  (cfg.faqs || []).forEach(function (f, i) { self.topics.push({ id: 'faq:' + i, alts: parseKw(f[0]), answer: f[1], kind: 'faq', bonus: 0.5 }); });
  this.menu.cats.forEach(function (c) { self.topics[self.topics.findIndex(function (t) { return t.id === 'menu'; })].alts.push({ w: words(c).filter(function (w) { return w !== 'and'; }).map(stem), weak: false, cat: c, sec: true }); });
  this.lastSeat = (cfg.reservations && cfg.reservations.last) || 60;
  // cuisine sections (one venue, many kitchens): phrase → menu category
  this.sections = [];
  var menuTopic = this.topics.filter(function (t) { return t.id === 'menu'; })[0];
  Object.keys(cfg.sections || {}).forEach(function (cat) {
    (cat.toLowerCase() + '|' + cfg.sections[cat]).split('|').forEach(function (p) {
      var w = words(p).filter(function (x) { return x !== 'and' && x !== 'food'; });
      if (!w.length) return;
      self.sections.push({ cat: cat, w: w.join(' ') });
      menuTopic.alts.push({ w: w.map(stem), weak: false, cat: cat, sec: true });
    });
  });
  this.sections.sort(function (a, b) { return b.w.length - a.w.length; });
}
var B = Brain.prototype;

B.fill = function (s) {
  var c = this.cfg;
  return String(s).replace(/\{name\}/g, c.name).replace(/\{city\}/g, c.city).replace(/\{phone\}/g, c.phone).replace(/\{email\}/g, c.email).replace(/\{address\}/g, this.addr());
};
B.addr = function () { var c = this.cfg; return c.street + ', ' + c.city + (c.customCity ? '' : ', ' + c.state + ' ' + c.zip); };
B.pick = function (key, arr) {
  var last = this.state.picks[key], opts = arr.length > 1 ? arr.filter(function (x) { return x !== last; }) : arr;
  var v = opts[Math.floor(this.rand() * opts.length)];
  this.state.picks[key] = v;
  return v;
};
B.first = function () { var n = this.state.customer.name; return n ? n.split(' ')[0] : ''; };

/* ── text prep ── */
B.fuzzy = function (t) {
  if (t.length < 4 || /[^a-z]/.test(t) || COMMON.has(t) || this.vocab.has(t) || this.vocab.has(stem(t))) return t;
  if (this.fixCache[t] !== undefined) return this.fixCache[t];
  var best = t, bd = 99, max = t.length >= 7 ? 2 : 1;
  for (var i = 0; i < this.vocabList.length; i++) {
    var v = this.vocabList[i];
    if (v[0] !== t[0] || Math.abs(v.length - t.length) > max) continue;
    var d = lev(t, v, max);
    if (d < bd) { bd = d; best = v; }
  }
  if (bd > max) best = t;
  this.fixCache[t] = best;
  return best;
};
B.prep = function (raw) {
  var self = this;
  var s = ' ' + deacc(String(raw)).toLowerCase() + ' ';
  s = s.replace(/[’‘`´]/g, "'").replace(/[“”]/g, '"');
  s = s.replace(/(\d),(\d{3})\b/g, '$1$2');
  s = s.replace(/\bw\/o\b/g, ' without ').replace(/\bw\//g, ' with ');
  s = s.replace(/(\d)\s*(a\.m\.?|p\.m\.?|am\b|pm\b)/g, function (m, d, ap) { return d + (ap.charAt(0) === 'a' ? 'am' : 'pm') + ' '; });
  s = s.replace(/(^|[^$\d.])(\d{1,2})\.(\d{2})(?=\s*(am|pm)|\s|$)/g, '$1$2:$3');
  s = s.replace(/(\d+(?:\.\d+)?)\s*(kgs?|kilos?|kilograms?)\b/g, '$1kg').replace(/(\d+(?:\.\d+)?)\s*(lbs?|pounds?)\b/g, '$1lb').replace(/(\d+)\s*("|inch(es)?\b)/g, '$1inch');
  s = s.replace(/\b(i'm|im)\b/g, 'i am').replace(/\bi've\b/g, 'i have').replace(/\bi'd\b/g, 'i would').replace(/\bi'll\b/g, 'i will').replace(/\bwe're\b/g, 'we are').replace(/\bwe'll\b/g, 'we will').replace(/\bwe'd\b/g, 'we would').replace(/\byou're\b/g, 'you are').replace(/\b(can't|cant)\b/g, 'can not').replace(/\bwon't\b/g, 'will not').replace(/\b(don't|dont)\b/g, 'do not').replace(/\b(doesn't|doesnt)\b/g, 'does not').replace(/\b(isn't|isnt)\b/g, 'is not').replace(/\b(aren't|arent)\b/g, 'are not').replace(/\b(didn't|didnt)\b/g, 'did not').replace(/\blet's\b/g, 'let us');
  s = s.replace(/\b(what|where|when|how|who|that|there|it|here)'s\b/g, '$1 is').replace(/\b(whats|wheres|hows|thats|theres)\b/g, function (m) { return m.slice(0, -1) + ' is'; }).replace(/\bits\b/g, 'it is');
  s = s.replace(/'s\b/g, '').replace(/'/g, '');
  s = s.replace(/([a-z])-(?=[a-z])/g, '$1 ').replace(/([a-z])-(?=[a-z])/g, '$1 ');
  s = s.replace(/\?/g, ' ? | ').replace(/[!;\n]+/g, ' | ').replace(/,/g, ' | ').replace(/\.(?=\s|$)/g, ' | ');
  s = s.replace(/[^a-z0-9:\/$@#%|?.\- ]+/g, ' ');
  // slang, number words, typo fix
  var toks = s.split(/\s+/).filter(Boolean).map(function (t) {
    if (SLANG[t] !== undefined) return SLANG[t];
    return t;
  }).join(' ').split(/\s+/);
  toks = toks.map(function (t, i) {
    if (NUMW[t] !== undefined) {
      if (t === 'one' && /^(no|any|some|every|the|that|this|which)$/.test(toks[i - 1] || '')) return t;
      return String(NUMW[t]);
    }
    return self.fuzzy(t);
  });
  s = ' ' + toks.join(' ') + ' ';
  s = s.replace(/\b(20|30|40|50|60|70|80|90) ([1-9])\b/g, function (m, a, b) { return String(+a + +b); });
  s = s.replace(/\b(\d{1,2}) hundred( and)?( (\d{1,2}))?\b/g, function (m, a, x, y, b) { return String(+a * 100 + (+b || 0)); });
  s = s.replace(/\ba hundred( and)?( (\d{1,2}))?\b/g, function (m, x, y, b) { return String(100 + (+b || 0)); });
  // clause splitting
  s = s.replace(/\b(and also|also|plus also|as well as|and then|oh and|by the way|but also)\b/g, ' | ');
  s = s.replace(/\b(and|but|plus) (?=(do|does|is|are|can|could|what|when|where|which|how|will|would|i|we|my|please|book|reserve|order|remove|delete|add|make|change|cancel|it is|call|email|text|you|any)\b)/g, ' | ');
  return s.split('|').map(function (p) {
    var q = /\?/.test(p);
    var t = p.replace(/\?/g, ' ').replace(/\s+/g, ' ').trim();
    return { text: t, q: q };
  }).filter(function (c) { return c.text; });
};

/* ── entity parsers ── */
B.ymd = function (yStr, mon, day) {
  var today = sod(this.now);
  if (mon < 0 || mon > 11 || day < 1 || day > 31) return { err: 'invalid' };
  var y = yStr ? +String(yStr).trim() : today.getFullYear();
  if (y < 100) y += 2000;
  var d = new Date(y, mon, day);
  if (d.getMonth() !== mon) return { err: 'invalid' };
  if (d < today) {
    if (yStr) return { err: 'past' };
    if (dayDiff(d, today) <= 60) return { err: 'past' };
    d = new Date(y + 1, mon, day);
    if (d.getMonth() !== mon) return { err: 'invalid' };
  }
  return { d: d, key: dkey(d) };
};
B.parseDate = function (t, awaiting) {
  var today = sod(this.now), m;
  function mk(d, x) { var o = { d: d, key: dkey(d) }; if (x) for (var k in x) o[k] = x[k]; return o; }
  if (/\bday after tomorrow\b/.test(t)) return mk(addDays(today, 2));
  if (/\btomorrow\b/.test(t)) return mk(addDays(today, 1), { night: /\b(night|evening)\b/.test(t) });
  if (/\b(today|tonight|this evening|this afternoon|this morning|later today|same day)\b/.test(t)) return mk(today, { night: /\b(tonight|this evening)\b/.test(t) });
  if ((m = /\bin (\d+|a) (day|days|week|weeks)\b/.exec(t))) { var n = m[1] === 'a' ? 1 : +m[1]; return mk(addDays(today, /week/.test(m[2]) ? n * 7 : n)); }
  if (/\bnext week\b/.test(t) && !new RegExp('\\b' + WD_RE + '\\b').test(t)) return mk(addDays(today, 7));
  if ((m = new RegExp('\\b' + MON_RE + '\\.? (\\d{1,2})(st|nd|rd|th)?( \\d{4})?\\b').exec(t))) return this.ymd(m[4], monIdx(m[1]), +m[2]);
  if ((m = new RegExp('\\b(\\d{1,2})(st|nd|rd|th)? (of )?' + MON_RE + '( \\d{4})?\\b').exec(t))) return this.ymd(m[5], monIdx(m[4]), +m[1]);
  if ((m = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/.exec(t))) return this.ymd(m[1], +m[2] - 1, +m[3]);
  if ((m = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/.exec(t))) return this.ymd(m[3], +m[1] - 1, +m[2]);
  if ((m = new RegExp('(^|\\s)(this |next |coming |on |for |by |until )?(the )?' + WD_RE + '\\b').exec(t))) {
    var w = m[4], pre = (m[2] || '').trim();
    var before = t.slice(0, m.index + m[1].length).trim().split(' ').pop();
    if (!(w === 'sat' && /^(i|we|he|she|they|and|was|were)$/.test(before)) && !(w === 'sun' && /^(the|in)$/.test(before))) {
      var diff = (wdIdx(w) - today.getDay() + 7) % 7;
      if (pre === 'next' && diff === 0) diff = 7;
      return mk(addDays(today, diff), { night: /\b(night|evening)\b/.test(t) });
    }
  }
  if (/\b(this |the )?weekend\b/.test(t)) { var dd = (6 - today.getDay() + 7) % 7; return mk(addDays(today, dd)); }
  if ((m = /\b(?:on )?the (\d{1,2})(st|nd|rd|th)\b/.exec(t)) || (m = /\bon (\d{1,2})(st|nd|rd|th)\b/.exec(t)) || (awaiting && (m = /^(\d{1,2})(st|nd|rd|th)?$/.exec(t.trim())))) {
    var day = +m[1], mon = today.getMonth(), y = today.getFullYear();
    if (day < today.getDate()) { mon++; if (mon > 11) { mon = 0; y++; } }
    return this.ymd(String(y), mon, day);
  }
  return null;
};
B.periodOf = function (t) {
  if (/\b(breakfast|morning)\b/.test(t)) return 'morning';
  if (/\b(lunch|afternoon|midday)\b/.test(t)) return 'afternoon';
  if (/\b(late night|late)\b/.test(t)) return 'late';
  if (/\b(evening|dinner|tonight|night|supper)\b/.test(t)) return 'evening';
  return null;
};
B.parseTime = function (t, c, awaiting) {
  var m, h = null, mi = 0, ap = null;
  if (/\b(asap|as soon as possible|right now|right away|immediately|now)\b/.test(t) && !/\b(open|closed) now\b|\bnow open\b|\bis it open\b/.test(t)) return { asap: true };
  if (/\b(noon|midday)\b/.test(t) && !/\bafternoon\b/.test(t)) return { mins: 720 };
  if (/\bmidnight\b/.test(t)) return { mins: 1440 };
  if ((m = /\b(\d{1,2}):(\d{2})\s?(am|pm)?\b/.exec(t))) { h = +m[1]; mi = +m[2]; ap = m[3] || null; }
  else if ((m = /\b(\d{1,2})(am|pm)\b/.exec(t))) { h = +m[1]; ap = m[2]; }
  else if ((m = /\b(half past|quarter past|quarter to) (\d{1,2})\b/.exec(t))) { h = +m[2]; mi = m[1] === 'half past' ? 30 : m[1] === 'quarter past' ? 15 : -15; }
  else if ((m = /\b(at|around|by|about|arround|arnd|@|before|after|say)\s+(\d{1,2})(\s?o ?clock|ish)?\b(?!\s*(people|persons|person|guests|guest|pax|ppl|of us|adults|kids|children|seats|kg|lb|inch|days|day|weeks|minutes|mins|hours|hrs|dollars|usd|pieces|pcs|orders|slices|items|\/|-\d|th\b|st\b|nd\b|rd\b))/.exec(t))) { h = +m[2]; }
  else if ((m = /\b(\d{1,2})\s?(o ?clock|ish)\b/.exec(t))) { h = +m[1]; }
  else if (awaiting && (m = /^(\d{1,2})$/.exec(t.trim()))) { h = +m[1]; }
  if (h === null) { var p = this.periodOf(t); return p ? { period: p } : null; }
  if (h > 24 || mi > 59 || (ap && (h > 12 || h === 0))) return { err: 'invalid' };
  var mins;
  if (ap) mins = ((h % 12) + (ap === 'pm' ? 12 : 0)) * 60 + mi;
  else if (h > 12 || h === 0) mins = h * 60 + mi;
  else {
    var am = (h % 12) * 60 + mi, pm = ((h % 12) + 12) * 60 + mi;
    if (h === 12) am = 12 * 60 + mi;
    var per = this.periodOf(t) || (c && c.date && c.date.night ? 'evening' : null);
    if (per === 'evening' || per === 'late') mins = pm;
    else if (per === 'morning') mins = am;
    else if (this.cfg.morning && h >= 6 && h <= 11) mins = am;
    else mins = h === 12 ? am : (h <= 11 && h >= 1 ? pm : am);
    if (!ap && h >= 1 && h <= 11 && per == null && !this.cfg.morning) {
      // if only the morning option is inside service hours, use it
      var anyPm = this.openAnyDay(pm), anyAm = this.openAnyDay(am);
      if (anyAm && !anyPm) mins = am;
    }
  }
  if (mins < 0) mins += 1440;
  return { mins: mins };
};
B.openAnyDay = function (mins) {
  var h = this.hours;
  return DAY_KEYS.some(function (k) { return h[k].some(function (r) { return mins >= r[0] && mins <= r[1]; }); });
};
B.parseGuests = function (t, ctx, awaiting) {
  var m, n = null;
  if ((m = /\b(\d{1,4}) ?(people|persons|person|guests|guest|pax|ppl|adults|adult|of us|diners|heads|covers|folks|attendees|seats|pp|employees|staff)\b/.exec(t))) {
    n = +m[1];
    var k = /\b(\d{1,2}) (kids|children|child|kid|toddlers|babies)\b/.exec(t);
    if (k && /adult/.test(m[2])) n += +k[1];
  }
  else if ((m = /\b(table|tables|reservation|booking|seating|room|space|party|group|family|dinner|lunch|brunch|breakfast|event|catering|cater|food) (for|of) (\d{1,4})\b(?!\s*(am|pm|:|oclock|ish|kg|lb|inch|dollars|usd|minutes|mins|hours|%|th\b|st\b|nd\b|rd\b))/.exec(t))) n = +m[3];
  else if ((m = /\bfor (\d{1,4})\b(?!\s*(st |nd |rd |th )?(of )?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|\s*(am|pm|:|oclock|ish|kg|lb|inch|dollars|usd|minutes|mins|hours|%|th\b|st\b|nd\b|rd\b|\/))/.exec(t)) && ctx) n = +m[1];
  else if (/\b(just me|only me|myself|table for one|party of one|just one person)\b/.test(t)) n = 1;
  else if (/\b(2 of us|the 2 of us|me and my \w+|my (wife|husband|partner|girlfriend|boyfriend|fiance|fiancee|date) and (i|me)|me and (her|him))\b/.test(t)) n = 2;
  else if (awaiting && (m = /^(\d{1,4})( total)?$/.exec(t.trim()))) n = +m[1];
  return n;
};
B.parseSeating = function (t) {
  if (/\b(no preference|anywhere|any table|whatever|does not matter|either is fine|either one|either|any is fine|do not mind|dont mind|no pref|any seat|anything is fine|any)\b/.test(t)) return 'any';
  if (/\bprivate (dining )?room\b/.test(t)) return 'private';
  if (/\b(outdoor|outdoors|outside|patio|terrace|garden|sidewalk|al fresco|alfresco|open air|rooftop|courtyard)\b/.test(t)) return 'outdoor';
  if (/\b(indoor|indoors|inside|dining room)\b/.test(t)) return 'indoor';
  if (/\bbooth\b/.test(t)) return 'booth';
  if (/\bwindow\b/.test(t)) return 'window';
  if (/\b(bar seat|at the bar|bar seating|counter|chef counter|sushi bar|the bar)\b/.test(t)) return 'bar';
  return null;
};
B.parseOccasion = function (t, awaiting) {
  if (/\b(birthday|bday|turning \d+)\b/.test(t)) return 'Birthday';
  if (/\banniversary\b/.test(t)) return 'Anniversary';
  if (/\b(proposal|propose|proposing)\b/.test(t)) return 'Proposal';
  if (/\bengagement\b/.test(t)) return 'Engagement';
  if (/\bgraduation\b/.test(t)) return 'Graduation';
  if (/\b(date night|romantic|valentine)\b/.test(t)) return 'Date night';
  if (/\b(business|client|clients|work dinner|work lunch|meeting|corporate|team dinner|team lunch|office)\b/.test(t)) return 'Business';
  if (/\b(baby shower|bridal shower|shower)\b/.test(t)) return 'Shower';
  if (/\b(reunion|farewell|retirement|promotion|celebration|celebrating|holiday party|christmas|eid|diwali|thanksgiving|new year)\b/.test(t)) return 'Celebration';
  if (awaiting && /\b(no|nope|none|nothing|just dinner|just lunch|just dining|just eating|nothing special|no occasion|not really|regular|casual|just food|just a meal|family dinner|just because)\b/.test(t)) return 'None';
  return null;
};
B.parseSize = function (t) {
  if (!this.cfg.cakes) return null;
  var sizes = this.cfg.cakes.sizes, m, kg = null;
  if ((m = /\b(\d+(?:\.\d+)?)kg\b/.exec(t))) kg = +m[1];
  else if ((m = /\b(\d+(?:\.\d+)?)lb\b/.exec(t))) kg = +m[1] * 0.4536;
  else if (/\bhalf (a )?(kg|kilo)\b/.test(t)) kg = 0.5;
  else if ((m = /\b(\d{1,2})inch\b/.exec(t))) { var inch = +m[1]; var s0 = sizes.filter(function (s) { return s.inch === inch; })[0]; return s0 ? s0.key : { err: inch }; }
  else if ((m = /\b(\d) tier/.exec(t))) { var tier = sizes.filter(function (s) { return s.tier === +m[1]; })[0]; return tier ? tier.key : { err: m[1] + ' tier' }; }
  else if ((m = /\b(small|medium|large|big)\b/.exec(t)) && /\bcake|size\b/.test(t)) { var idx = { small: 0, medium: 1, large: 2, big: 2 }[m[1]]; return sizes[Math.min(idx, sizes.length - 1)].key; }
  else if ((m = /\b(?:serves?|feeds?|for) (\d{1,3})\b/.exec(t)) && /\bcake\b/.test(t)) { var ppl = +m[1]; var fit = sizes.filter(function (s) { return s.serves >= ppl; })[0]; return fit ? fit.key : { err: ppl + ' people' }; }
  if (kg == null) return null;
  var exact = sizes.filter(function (s) { return s.kg && Math.abs(s.kg - kg) < 0.15; })[0];
  return exact ? exact.key : { err: (Math.round(kg * 10) / 10) + ' kg' };
};
B.matchFlavor = function (t) {
  if (!this.cfg.cakes) return null;
  var best = null, bl = 0;
  this.cfg.cakes.flavors.forEach(function (f) {
    var w = words(f).filter(function (x) { return x !== 'and' && x !== 'cake'; });
    var hit = w.filter(function (x) { return new RegExp('\\b' + x + '\\b').test(t); }).length;
    if (hit && hit === w.length && hit > bl) { best = f; bl = hit; }
    else if (!best && w.length > 1 && hit >= 1 && new RegExp('\\b' + w[0] + '\\b').test(t) && hit > bl) { best = f; bl = hit - 0.5; }
  });
  return best;
};
B.parseEventType = function (t) {
  var map = [[/\bwedding|nikah|walima|reception\b/, 'Wedding'], [/\b(mehndi|mehendi|sangeet)\b/, 'Mehndi / Sangeet'], [/\b(corporate|office|company|business|work|conference|team)\b/, 'Corporate'], [/\b(birthday|bday)\b/, 'Birthday'], [/\bgraduation\b/, 'Graduation'], [/\b(baby shower|bridal shower|shower)\b/, 'Shower'], [/\b(engagement)\b/, 'Engagement'], [/\b(anniversary)\b/, 'Anniversary'], [/\b(holiday|christmas|eid|diwali|thanksgiving|new year)\b/, 'Holiday party'], [/\b(family|reunion|get together|gathering|house party)\b/, 'Family gathering'], [/\b(funeral|memorial)\b/, 'Memorial'], [/\b(fundraiser|charity|gala)\b/, 'Fundraiser / gala']];
  for (var i = 0; i < map.length; i++) if (map[i][0].test(t)) return map[i][1];
  return null;
};
B.parseBudget = function (t) {
  var m;
  if ((m = /\$\s?(\d+(?:\.\d+)?)\s?(k)?\s*(per|a|\/)\s*(person|head|guest|plate|pp)\b/.exec(t)) || (m = /\b(\d+(?:\.\d+)?)\s?(k)?\s*(dollars?|usd|bucks)?\s*(per|a|\/)\s*(person|head|guest|plate)\b/.exec(t))) return '$' + m[1] + ' per guest';
  if ((m = /\b(under|below|less than|max|maximum|up to|around|about|roughly|approx|approximately)?\s*\$\s?(\d+(?:\.\d+)?)\s?(k)?\b/.exec(t)) || (m = /\b(under|below|less than|max|maximum|up to|around|about|roughly|approx|approximately)?\s*(\d+(?:\.\d+)?)\s?(k|dollars|usd|bucks)\b/.exec(t))) {
    var v = +m[2] * (m[3] === 'k' ? 1000 : 1);
    if (v < 50) return null;
    var pre = m[1] ? cap(m[1].replace('approx', 'about')) + ' ' : '';
    var r2 = /(?:-|to)\s*\$?\s?(\d+(?:\.\d+)?)\s?(k)?\b/.exec(t.slice(m.index + m[0].length, m.index + m[0].length + 14));
    if (r2) return '$' + v.toLocaleString('en-US') + '–$' + (+r2[1] * (r2[2] ? 1000 : 1)).toLocaleString('en-US');
    return pre + '$' + v.toLocaleString('en-US');
  }
  if (/\b(flexible|not sure|no budget|open|depends|whatever it takes|unsure|do not know)\b/.test(t)) return 'Flexible';
  return null;
};

/* ── menu mention & cart operations ── */
B.findMentions = function (stems) {
  var out = [], i = 0, P = this.menu.phrases;
  while (i < stems.length) {
    var hit = null;
    for (var L = Math.min(5, stems.length - i); L >= 1; L--) {
      var e = P.get(stems.slice(i, i + L).join(' '));
      if (e) { hit = { start: i, end: i + L, ids: e.x.length ? e.x : e.i }; break; }
    }
    if (hit) { out.push(hit); i = hit.end; } else i++;
  }
  return out;
};
var REMOVE_W = /^(remove|delete|drop|minus|cancel|without|scratch|skip|no|less|rid|out|off|nix)$/;
var ADD_W = /^(add|plus|another|more|extra|want|get|have|order|need|take|grab|include|throw|give)$/;
var SET_W = /^(make|change|update|only|just|instead|set|switch)$/;
var QTY_FILL = /^(of|more|extra|order|orders|plate|plates|portion|portions|piece|pieces|pc|pcs|the|x|serving|servings|large|small|regular|can|cans|bottle|bottles|glass|glasses|cup|cups|slice|slices|box|boxes|dozen|additional|pack|packs)$/;
B.cartOps = function (c) {
  var st = c.stems, ms = c.mentions, ops = [], op = null, prevEnd = 0;
  var swap = /\b(swap|replace|switch|exchange|change)\b/.test(c.text) && /\b(with|for|to|instead)\b/.test(c.text) && ms.length >= 2;
  var insteadOf = /\binstead of\b/.test(c.text) && ms.length >= 2;
  for (var i = 0; i < ms.length; i++) {
    var m = ms[i], seg = st.slice(prevEnd, m.start), qty = null, verb = null;
    for (var j = seg.length - 1; j >= 0; j--) {
      var w = seg[j];
      if (!verb && REMOVE_W.test(w)) verb = 'remove';
      if (!verb && (w === 'take' && seg[j + 1] === 'off')) verb = 'remove';
      if (!verb && SET_W.test(w)) verb = 'set';
      if (!verb && ADD_W.test(w)) verb = 'add';
    }
    // quantity: nearest number within 3 tokens before, skipping fillers
    var k = seg.length - 1, steps = 0;
    while (k >= 0 && steps < 4) {
      var tk = seg[k];
      if (/^\d{1,3}$/.test(tk)) { qty = +tk; break; }
      if (/^x?\d{1,3}x?$/.test(tk)) { qty = +tk.replace(/x/g, ''); break; }
      if (tk === 'a' || tk === 'an' || tk === 'another') { qty = 1; break; }
      if (tk === 'couple' || tk === 'pair') { qty = 2; break; }
      if (tk === 'dozen') { qty = (seg[k - 1] === 'half') ? 6 : 12; if (/^\d+$/.test(seg[k - 1] || '')) qty = 12 * +seg[k - 1]; break; }
      if (!QTY_FILL.test(tk)) break;
      k--; steps++;
    }
    var after = st.slice(m.end, (ms[i + 1] ? ms[i + 1].start : st.length));
    if (qty == null && after.length && /^x?\d{1,3}$/.test(after[0])) qty = +after[0].replace('x', '');
    if (qty == null && after[0] === 'x' && /^\d{1,3}$/.test(after[1] || '')) qty = +after[1];
    if ((verb === 'set' || /\bto$/.test(after.slice(0, 1).join(''))) && after[0] === 'to' && /^\d{1,3}$/.test(after[1] || '')) { qty = +after[1]; verb = 'set'; }
    if (verb === 'set' && qty == null && /^\d{1,3}$/.test(after[0] || '')) qty = +after[0];
    if (/\binstead\b/.test(after.join(' ')) && verb !== 'remove') verb = verb || 'set';
    if (verb) op = verb;
    var type = op || 'add';
    if (type === 'set' && !/\b(make|change|update|set|instead|only|just)\b/.test(c.text)) type = 'add';
    ops.push({ type: type, ids: m.ids, qty: qty, explicitQty: qty != null });
    prevEnd = m.end;
  }
  if (swap && ops.length >= 2) { ops[0].type = 'swapOut'; ops[1].type = 'swapIn'; }
  // "X instead of Y": Y (the second mention) goes out, X comes in
  if (insteadOf && ops.length >= 2) { ops[0].type = 'swapIn'; ops[1].type = 'swapOut'; }
  return ops;
};
B.unknownDishes = function (c) {
  var out = [], t = ' ' + c.text + ' ', covered = new Set();
  c.mentions.forEach(function (m) { for (var i = m.start; i < m.end; i++) covered.add(i); });
  var self = this;
  Object.keys(DISH_HINTS).sort(function (a, b) { return b.length - a.length; }).forEach(function (k) {
    var re = new RegExp(' ' + k + '(s|es)? ');
    var mm = re.exec(t);
    if (!mm) return;
    // is it covered by a menu mention?
    var before = t.slice(0, mm.index).trim(), idx = before ? before.split(' ').length : 0, n = k.split(' ').length, cov = false;
    for (var i = idx; i < idx + n; i++) if (covered.has(i)) cov = true;
    if (cov) return;
    if (out.some(function (o) { return o.indexOf(k) >= 0 || k.indexOf(o) >= 0; })) return;
    if (self.cfg.cakes && /cake/.test(k)) return;
    out.push(k);
  });
  return out;
};
B.closest = function (dish, n) {
  var con = (DISH_HINTS[dish] || '').split(' ').filter(Boolean), items = this.menu.items;
  var scored = items.map(function (it) { var s = 0; con.forEach(function (x) { if (it.concepts.indexOf(x) >= 0) s += (x === con[0] ? 2 : 1); }); return { it: it, s: s }; }).filter(function (x) { return x.s > 0; });
  scored.sort(function (a, b) { return b.s - a.s || (b.it.tags.indexOf('pop') >= 0) - (a.it.tags.indexOf('pop') >= 0); });
  var res = scored.slice(0, n || 2).map(function (x) { return x.it; });
  if (!res.length) res = this.signature().slice(0, n || 2);
  return res;
};
B.signature = function () {
  var self = this, out = (this.cfg.signature || []).map(function (n) { return self.menu.byId[slug(n)]; }).filter(Boolean);
  if (!out.length) out = this.menu.items.filter(function (i) { return i.tags.indexOf('pop') >= 0; });
  return out;
};

/* ── clause analysis ── */
B.analyze = function (cl, S) {
  var t = cl.text, cfg = this.cfg, aw = S.awaiting || {};
  var c = { text: t, raw: cl.text };
  c.q = cl.q || Q_START.test(t);
  c.stems = t.split(' ').filter(Boolean).map(stem);
  c.set = new Set(c.stems);
  c.reqQ = REQ_RE.test(t);
  c.flowKw = EVENT_RE.test(t) ? 'event' : CATER_RE.test(t) ? 'catering' : (cfg.cakes && CAKE_RE.test(t) && !/\bcake (cutting|fee)\b|bring (our|my|a|your) own cake|\bbring a cake\b/.test(t)) ? 'cake' : RESERVE_RE.test(t) ? 'reserve' : ORDER_RE.test(t) ? 'order' : null;
  c.cakeWord = CAKE_RE.test(t);
  c.date = this.parseDate(t, aw.field === 'date');
  c.time = this.parseTime(t, c, aw.field === 'time');
  c.period = this.periodOf(t);
  var guestCtx = !!(c.flowKw && c.flowKw !== 'order' && c.flowKw !== 'cake') || /\b(people|guests|party)\b/.test(t) || aw.field === 'guests';
  c.guests = this.parseGuests(t, guestCtx, aw.field === 'guests');
  c.seating = this.parseSeating(t);
  if (c.seating === 'any' && aw.field !== 'seating') c.seating = null;
  c.occasion = this.parseOccasion(t, aw.field === 'occasion');
  c.mode = /\b(deliver|delivery|delivered|bring it|send it)\b/.test(t) ? 'delivery' : /\b(pickup|pick up|pick it up|takeout|take out|takeaway|take away|carryout|carry out|collect|to go|come get|come and get)\b/.test(t) ? 'pickup' : null;
  var zm = t.match(/(^|[^$\d.\/])\b(\d{5})\b(?!\s*(people|guests|persons|dollars|usd|kg|lb))/g) || [];
  c.zips = /^(phone|both|email)$/.test(aw.field || '') ? [] : zm.map(function (z) { return z.replace(/\D/g, ''); });
  c.badZip = !c.zips.length && (/\b(zip|zipcode|postal)\b/.test(t) || aw.field === 'zip' || /\bdeliver(y)? to \d/.test(t)) && /\b\d{3,4}\b|\b\d{6,9}\b/.test(t);
  c.mentions = this.findMentions(c.stems);
  c.unknown = this.unknownDishes(c);
  c.ops = this.cartOps(c);
  c.greet = /^(hi|hello|hey|hiya|howdy|yo|salam|salaam|assalamualaikum|asalamualaikum|assalam o alaikum|aoa|good (morning|afternoon|evening)|namaste|hola|sup|greetings|hii+|helo|heyy+)\b/.test(t);
  c.thanks = /\b(thanks|thank you|thank u|cheers|appreciate it|much appreciated|grateful|shukriya|jazakallah)\b/.test(t);
  c.bye = /\b(bye|goodbye|good bye|see you|see ya|cya|take care|good night|talk later|catch you later|khuda hafiz|allah hafiz|peace out)\b/.test(t);
  var YES = '(yes|sure|ok|alright|all right|absolutely|definitely|of course|please do|sounds good|sounds great|perfect|great|correct|that is right|that is correct|right|confirm|confirmed|go ahead|do it|book it|place it|looks good|looks great|lgtm|y|yes please|yup|yeah|please|cool|awesome|fine|good|exactly|yess)';
  var NO = '(no|nope|not really|no thanks|no thank you|nothing|none|that is all|that is it|all good|i am good|we are good|nothing else|no more|all set|n|not now|i am fine|nah|no need|we are fine|i am done|done|that will be all|that is everything)';
  c.yesOnly = new RegExp('^' + YES + '( ' + YES + ')*( (thanks|thank you|thx))?$').test(t);
  c.yesStart = new RegExp('^' + YES + '\\b').test(t);
  c.noOnly = new RegExp('^' + NO + '( ' + NO + ')*( (thanks|thank you|thx|bye|goodbye))*$').test(t);
  c.noStart = new RegExp('^' + NO + '\\b').test(t);
  c.confirmWord = /\b(confirm|book it|place it|place the order|place my order|lock it in|looks good|looks great|that is correct|all correct|go ahead|submit|finalize|finalise)\b/.test(t);
  c.edit = /^(edit|change|modify|update|fix|wrong|mistake|i want to change|i need to change|can i change)\b/.test(t) || /\b(make a change|change something|edit (it|my|the))\b/.test(t);
  c.cancel = /\b(cancel|cancell?ation|call it off|call off|nevermind|never mind|forget it|scrap it|scrap that)\b/.test(t);
  c.startOver = /\b(start over|start again|restart|reset|new chat|from scratch|begin again|start a new|clear everything)\b/.test(t);
  c.checkout = /\b(checkout|check out|that is all|that is it|done ordering|nothing else|ready to order|place order|place the order|that will be all|that is everything|i am done|we are done|finish order|complete order|that is my order)\b/.test(t);
  c.pref = /\bboth\b/.test(t) ? 'both' : (/\b(email|e mail|mail)\b/.test(t) && !/\b(phone|call|text|number)\b/.test(t)) ? 'email' : (/\b(phone|call|text|sms|number|whatsapp|cell|mobile)\b/.test(t) && !/\bemail\b/.test(t)) ? 'phone' : null;
  c.size = this.parseSize(t);
  c.flavor = this.matchFlavor(t);
  c.eventType = this.parseEventType(t);
  c.budget = this.parseBudget(t);
  var otherN = this.otherNames.some(function (n) { return n && (' ' + t + ' ').indexOf(' ' + n + ' ') >= 0; });
  c.other = OTHER_PLACES.test(t) || otherN;
  c.oos = OOS_RE.test(t) || c.other;
  c.allergens = [];
  ALLERGEN_WORDS.forEach(function (a) { if (a[0].test(t)) c.allergens = c.allergens.concat(a[1]); });
  c.allergens = uniq(c.allergens);
  c.allergy = /\b(allerg\w*|intoleran\w*|anaphyla\w*|epipen|celiac|coeliac)\b/.test(t) || (c.allergens.length > 0 && /\b(free|contain|contains|safe|without|traces?|cross contamination|have any)\b/.test(t) && !(c.allergens.length === 1 && c.allergens[0] === 'G' && !c.mentions.length && !c.unknown.length));
  c.avail = /\b(free|available|availability|openings?|slots?|fully booked|booked up|any (tables?|space|room|spots?)|what times?|which times?)\b/.test(t) && !c.allergens.length && !/\b(free (delivery|dessert|wifi|wi fi|parking|refill|refills|drink|meal|food|item|cake|coffee)|gluten free|sugar free|dairy free|nut free|feel free|free of charge|hands free)\b/.test(t) && (!!c.date || !!c.period || /\b(table|tables|tonight|slot|slots|spots?|weekend|reservation|what times?|which times?|openings?)\b/.test(t));
  c.section = this.detectSection(t);
  c.spiceNote = /\b(extra|more|very|super|less|not too|not so|medium|mild|no) (spicy|spice|hot)\b|\b(make it|make them|make that|make the \w+( \w+)?) (mild|medium|hot)\b|\b(mild|medium) please\b/.test(t) ? (/\b(less|not too|not so|mild|no)\b/.test(t) ? 'Mild' : /\bmedium\b/.test(t) ? 'Medium' : 'Extra spicy') : null;
  c.topic = this.scoreTopic(c);
  c.gib = this.isGib(c);
  c.hasEnt = !!(c.date || c.time || c.guests || c.ops.length || c.seating || c.zips.length || c.mode || c.size || c.flavor);
  return c;
};
B.scoreTopic = function (c) {
  var best = null;
  for (var i = 0; i < this.topics.length; i++) {
    var tp = this.topics[i], sc = 0, hits = 0, cat = null;
    for (var j = 0; j < tp.alts.length; j++) {
      var a = tp.alts[j];
      if (!a.w.length) continue;
      var ok = a.w.every(function (w) { return c.set.has(w); });
      if (a.w.length > 1 && ok) { var joined = ' ' + c.stems.join(' ') + ' '; if (joined.indexOf(' ' + a.w.join(' ') + ' ') < 0 && a.w.length > 3) ok = false; }
      if (ok) { var s = a.weak ? 0.5 : a.sec ? a.w.length - 0.1 : a.w.length; if (a.cat) cat = a.cat; if (s > sc) sc = s; if (!a.sec) hits++; }
    }
    if (!sc) continue;
    sc += 0.25 * (hits - 1) + (tp.bonus || 0);
    if (tp.needItem && !c.mentions.length) continue;
    if (!best || sc > best.score) best = { t: tp, score: sc, cat: cat };
  }
  return best;
};
B.isGib = function (c) {
  var toks = c.text.split(' ').filter(function (w) { return /^[a-z]+$/.test(w); });
  if (!toks.length) return false;
  var self = this;
  var weird = toks.filter(function (w) {
    if (COMMON.has(w) || self.vocab.has(w) || self.vocab.has(stem(w)) || w.length < 3) return false;
    return !/[aeiouy]/.test(w) || /[bcdfghjklmnpqrstvwxz]{5,}/.test(w) || /(.)\1\1/.test(w) || /(asdf|sdfg|dfgh|fghj|ghjk|hjkl|qwer|tyui|yuio|uiop|zxcv|xcvb|cvbn|vbnm|qwe|asd|zxc|jkj|kjk|hjh|fgf|lkj|dsa|jfk|jdj|fjf|dkd)/.test(w) || (w.length >= 6 && (w.match(/[aeiouy]/g) || []).length / w.length < 0.2);
  });
  return weird.length >= Math.ceil(toks.length * 0.5);
};

/* ── contact extraction (raw text) ── */
B.extractEmails = function (raw, awaiting) {
  var valid = [], spans = [], bad = false, m;
  var re = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}\b/g;
  while ((m = re.exec(raw))) { var e = m[0].toLowerCase(); if (!/\.\./.test(e) && !/^\./.test(e)) { valid.push(e); spans.push(m[0]); } else { bad = true; spans.push(m[0]); } }
  var rest = raw;
  spans.forEach(function (s) { rest = rest.split(s).join(' '); });
  var atTok = rest.match(/\S*@\S*/g);
  if (atTok) { bad = true; atTok.forEach(function (s) { spans.push(s); }); }
  if (!valid.length && awaiting) {
    var sp = /([a-z0-9._%+-]+)\s+(?:at|\(at\)|\[at\])\s+([a-z0-9-]+)\s+(?:dot|\.)\s+([a-z]{2,})/i.exec(rest);
    if (sp) { valid.push((sp[1] + '@' + sp[2] + '.' + sp[3]).toLowerCase()); spans.push(sp[0]); bad = false; }
    else if (/\b[a-z0-9._-]+\.(com|net|org|co|io|edu|us)\b/i.test(rest) || /\b(gmail|yahoo|hotmail|outlook|icloud|aol)\b/i.test(rest)) { bad = true; var tk = rest.match(/\S*(\.(com|net|org|co|io|edu|us)|gmail|yahoo|hotmail|outlook|icloud|aol)\S*/i); if (tk) spans.push(tk[0]); }
  }
  return { valid: valid, bad: bad && !valid.length, spans: spans };
};
B.extractPhones = function (raw, context, strict) {
  var valid = [], spans = [], bad = false, m;
  var re = /(\+?\d[\d\s().-]{5,}\d)/g;
  while ((m = re.exec(raw))) {
    var s = m[1], d = s.replace(/\D/g, '');
    if (d.length < 7) { if (context && d.length >= 4 && (strict || !/^\d{5}$/.test(d))) { bad = true; spans.push(s); } continue; }
    if (/^\d{1,2}[./-]\d{1,2}([./-]\d{2,4})?$/.test(s.trim()) || /^\d{4}-\d{1,2}-\d{1,2}$/.test(s.trim())) continue;
    if (d.length === 11 && d[0] === '1') d = d.slice(1);
    var ok = (d.length === 10 && /^[2-9]\d{2}[2-9]/.test(d) && !/^(\d)\1+$/.test(d) && d !== '1234567890' && d !== '0123456789') || (/^\+/.test(s.trim()) && d.length >= 8 && d.length <= 15);
    if (ok) { valid.push(d.length === 10 ? '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6) : '+' + d); spans.push(s); }
    else { bad = true; spans.push(s); }
  }
  if (!valid.length && context) {
    var sh = raw.match(/\b\d{3,6}\b/);
    if (sh && (strict || !/^\d{5}$/.test(sh[0]))) { bad = true; spans.push(sh[0]); }
  }
  return { valid: valid, bad: bad && !valid.length, spans: spans };
};
var NOT_NAME = new Set(('allergic looking interested hungry vegetarian vegan here fine good ok okay not sure trying planning going coming celebrating from a an the in at on with lactose gluten diabetic pregnant new back ready done just also calling asking wondering bringing ordering booking hoping visiting staying thinking so very really too the table order book reserve reservation delivery pickup menu want wants please hi hello hey yes no thanks thank cancel tomorrow today tonight monday tuesday wednesday thursday friday saturday sunday people guests guest phone email both call text number address zip and for is my name of to it this that there what when where who how can could would will do does halal spicy mild outdoor indoor patio booth birthday anniversary cake catering event party private deliver pickup food dinner lunch breakfast table tables coke drink drinks water add remove change edit confirm sure yeah yep nope nah help need get have like love some any one two three four five six seven eight nine ten evening morning afternoon night noon asap now later minutes hours hour am pm').split(' '));
B.validName = function (s) {
  var raw = String(s).trim().replace(/[.,!]+$/, '');
  if (!raw || /\d|@/.test(raw)) return null;
  var w = words(raw);
  if (!w.length || w.length > 4) return null;
  var self = this;
  if (w.some(function (x) { return NOT_NAME.has(x) || self.menu.phrases.has(stem(x)) || DISH_HINTS[x]; })) return null;
  if (this.isGib({ text: w.join(' ') })) return null;
  if (w.join('').length < 2) return null;
  return titleCase(w.join(' '));
};
B.extractName = function (raw, awaiting) {
  var m = /\b(?:my name is|my name's|name is|name's|names|name:|i am|i'm|im|this is|it's|its|under the name|under the name of|put it under|book it under|under|call me)\s+([A-Za-z][A-Za-z'\-]+(?:\s+[A-Za-z][A-Za-z'\-]+){0,3})/i.exec(raw);
  if (!m) return null;
  var lead = m[0].toLowerCase(), strong = /name|under/.test(lead);
  var parts = m[1].split(/\s+/), keep = [];
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i].toLowerCase();
    if (NOT_NAME.has(p) || /^(and|from|here|please|for|with|at|on|to|my|we|i|table|order)$/.test(p)) break;
    if (!strong && !awaiting && !/^[A-Z]/.test(parts[i])) break;
    keep.push(parts[i]);
    if (keep.length >= 3) break;
  }
  if (!keep.length) return null;
  return this.validName(keep.join(' '));
};

/* ── hours & availability ── */
B.dayRanges = function (key) { return this.hours[DAY_KEYS[kdate(key).getDay()]] || []; };
B.openAt = function (dt) {
  var key = dkey(dt), m = dt.getHours() * 60 + dt.getMinutes(), i, r;
  var rs = this.dayRanges(key);
  for (i = 0; i < rs.length; i++) { r = rs[i]; if (m >= r[0] && m < r[1]) return { key: key, r: r, mins: m }; }
  var y = dkey(addDays(dt, -1)); rs = this.dayRanges(y);
  for (i = 0; i < rs.length; i++) { r = rs[i]; if (m + 1440 >= r[0] && m + 1440 < r[1]) return { key: y, r: r, mins: m + 1440 }; }
  return null;
};
B.rangesText = function (rs) { return rs.map(function (r) { return fmtT(r[0]) + '–' + fmtT(r[1]); }).join(' & '); };
B.hoursRows = function () {
  var order = [1, 2, 3, 4, 5, 6, 0], rows = [], self = this;
  order.forEach(function (d) {
    var txt = self.hours[DAY_KEYS[d]].length ? self.rangesText(self.hours[DAY_KEYS[d]]) : 'Closed';
    var last = rows[rows.length - 1];
    if (last && last.txt === txt) { last.to = d; } else rows.push({ from: d, to: d, txt: txt });
  });
  return rows.map(function (r) { return [DAY_SHORT[r.from] + (r.to !== r.from ? '–' + DAY_SHORT[r.to] : ''), r.txt]; });
};
B.nextOpen = function () {
  var today = sod(this.now);
  for (var i = 0; i < 8; i++) {
    var key = dkey(addDays(today, i)), rs = this.dayRanges(key);
    for (var j = 0; j < rs.length; j++) if (at(key, rs[j][0]) > this.now) return (i === 0 ? 'today' : i === 1 ? 'tomorrow' : 'on ' + DAY_FULL[kdate(key).getDay()]) + ' at ' + fmtT(rs[j][0]);
  }
  return 'soon';
};
B.dayWord = function (key, mins) { var n = dayDiff(this.now, kdate(key)); return n === 0 ? (mins >= 1020 ? 'tonight' : 'today') : n === 1 ? 'tomorrow' : 'on ' + fmtDate(key); };
B.slots = function (key) {
  var out = [], last = this.lastSeat;
  this.dayRanges(key).forEach(function (r) { for (var t = Math.ceil(r[0] / 30) * 30; t <= r[1] - last; t += 30) out.push(t); });
  return out;
};
B.isFull = function (key, t) {
  var d = kdate(key).getDay(), peak = (d === 5 || d === 6) && t >= 1110 && t <= 1230;
  return hash(this.cfg.id + key + ':' + t) % 100 < (peak ? 45 : 22);
};
B.future = function (key, t, lead) { return at(key, t) >= new Date(this.now.getTime() + (lead || 30) * 60000); };
B.freeSlots = function (key) { var self = this; return this.slots(key).filter(function (t) { return self.future(key, t) && !self.isFull(key, t); }); };
B.nearestFree = function (key, t, n) {
  var free = this.freeSlots(key).slice().sort(function (a, b) { return Math.abs(a - t) - Math.abs(b - t) || a - b; });
  return free.slice(0, n || 2).sort(function (a, b) { return a - b; });
};
B.checkTableTime = function (key, mins, noFull) {
  var rs = this.dayRanges(key), last = this.lastSeat;
  if (!rs.length) return { err: 'closed' };
  var inR = function (m) { return rs.some(function (r) { return m >= r[0] && m <= r[1] - last; }); };
  if (!inR(mins) && inR(mins + 1440)) mins += 1440;
  if (!inR(mins)) return { err: 'closed', mins: mins };
  if (!this.future(key, mins)) return { err: 'past', mins: mins };
  if (!noFull && this.isFull(key, Math.floor(mins / 30) * 30)) return { full: true, mins: mins, alts: this.nearestFree(key, mins, 2) };
  return { ok: true, mins: mins };
};
B.lead = function (mode) { var d = this.cfg.delivery || {}; return mode === 'delivery' ? (d.mins || 45) : (d.prep || 20); };
B.asapOK = function (mode) { var ready = new Date(this.now.getTime() + this.lead(mode) * 60000); var o = this.openAt(this.now); return !!(o && this.openAt(ready)); };
B.orderTimes = function (mode, n) {
  var out = [], start = new Date(this.now.getTime() + this.lead(mode) * 60000);
  start.setMinutes(Math.ceil(start.getMinutes() / 30) * 30, 0, 0);
  for (var i = 0; i < 48 * 4 && out.length < n; i++) {
    var dt = new Date(start.getTime() + i * 30 * 60000), o = this.openAt(dt);
    if (o && o.mins <= o.r[1] - 15) out.push({ key: dkey(dt), mins: dt.getHours() * 60 + dt.getMinutes() });
  }
  return out;
};
B.checkOrderTime = function (key, mins, mode) {
  var dt = at(key, mins), lead = this.lead(mode);
  if (dayDiff(this.now, dt) > 7) return { err: 'far' };
  if (dt < new Date(this.now.getTime() + (lead - 5) * 60000)) { var nx = this.orderTimes(mode, 1)[0]; return { err: dt < this.now ? 'past' : 'tooSoon', sug: nx }; }
  var o = this.openAt(dt);
  if (!o || o.mins > o.r[1] - 15) return { err: 'closed' };
  return { ok: true };
};
B.cakeEarliest = function () {
  var lead = (this.cfg.cakes && this.cfg.cakes.lead) || 48, min = new Date(this.now.getTime() + lead * 3600000), today = sod(this.now);
  for (var i = 0; i < 14; i++) {
    var key = dkey(addDays(today, i)), rs = this.dayRanges(key);
    if (rs.some(function (r) { return at(key, r[1] - 60) >= min; })) return key;
  }
  return dkey(addDays(today, 3));
};
B.cakeTimes = function (key) {
  var lead = (this.cfg.cakes && this.cfg.cakes.lead) || 48, min = new Date(this.now.getTime() + lead * 3600000), out = [];
  this.dayRanges(key).forEach(function (r) { for (var t = Math.ceil((r[0] + 60) / 60) * 60; t <= Math.min(r[1] - 60, 20 * 60); t += 60) if (at(key, t) >= min) out.push(t); });
  return out;
};

/* ── flows ── */
B.newFlow = function (f) {
  return { reserve: { guests: null, date: null, time: null, seating: null, occasion: null, note: null, noteAsked: false, noteWanted: false },
    order: { items: [], mode: null, address: null, zip: null, time: null },
    cake: { flavor: null, size: null, message: null, date: null, time: null },
    catering: { date: null, guests: null, eventType: null, budget: null, interests: null },
    event: { date: null, guests: null, time: null, occasion: null } }[f];
};
B.start = function (f) {
  var S = this.state;
  if (!S.flows[f]) { S.flows[f] = this.newFlow(f); S.active.push(f); this.T.started.push(f); }
  S.review = false; S.ended = false; S.lastFlow = f; S.pending = null;
  return S.flows[f];
};
B.drop = function (f) { var S = this.state; delete S.flows[f]; var i = S.active.indexOf(f); if (i >= 0) S.active.splice(i, 1); };
B.setF = function (flow, field, val) {
  var S = this.state, F = S.flows[flow], T = this.T;
  if (!F) return;
  var old = F[field];
  F[field] = val; S.lastFlow = flow; T.anySet = true;
  T.set[flow] = T.set[flow] || [];
  if (T.set[flow].indexOf(field) < 0) T.set[flow].push(field);
  if (old != null && old !== '' && JSON.stringify(old) !== JSON.stringify(val) && !(field === 'time' && old && old.tentative)) T.changed.push({ flow: flow, field: field });
  else if (S.editing && S.editing.flow === flow && S.editing.field === field) T.changed.push({ flow: flow, field: field });
  if (S.editing && S.editing.flow === flow && S.editing.field === field) S.editing = null;
  if (S.errors[field]) S.errors[field] = 0;
};
B.firstMissing = function () {
  var S = this.state, C = S.customer, cfg = this.cfg;
  var order = S.active.filter(function (f) { return this.T && this.T.started.indexOf(f) >= 0; }, this).concat(S.active.filter(function (f) { return !(this.T && this.T.started.indexOf(f) >= 0); }, this));
  for (var a = 0; a < order.length; a++) {
    var f = order[a], F = S.flows[f], fl = FLOW_FIELDS[f];
    for (var i = 0; i < fl.length; i++) {
      var k = fl[i];
      if (f === 'reserve' && k === 'seating') { if (F.seating == null && ((cfg.seating && cfg.seating.options) || []).length < 2) F.seating = 'any'; if (F.seating == null) return { flow: f, field: k }; continue; }
      if (f === 'reserve' && k === 'note') { if (cfg.noteOffer !== false && /Birthday|Anniversary|Proposal|Engagement|Graduation|Celebration/.test(F.occasion || '') && F.note == null) return { flow: f, field: 'note' }; continue; }
      if (f === 'order' && k === 'items') { if (!F.items.length) return { flow: f, field: k }; continue; }
      if (f === 'order' && k === 'mode' && F.mode == null && !this.allZips().length) F.mode = 'pickup';
      if (f === 'order' && k === 'address') { if (F.mode !== 'delivery') continue; if (!F.zip && F.address) return { flow: f, field: 'zip' }; if (!F.address) return { flow: f, field: 'address' }; continue; }
      if (k === 'time' && F.time && F.time.tentative) return { flow: f, field: k };
      if (F[k] == null) return { flow: f, field: k };
    }
  }
  if (!S.active.length) return null;
  if (!C.name) return { flow: '*', field: 'name' };
  if (!C.phone && !C.email) return { flow: '*', field: C.pref === 'phone' ? 'phone' : C.pref === 'email' ? 'email' : C.pref === 'both' ? 'both' : 'contactPref' };
  if (C.pref === 'both') { if (!C.phone) return { flow: '*', field: 'phone' }; if (!C.email) return { flow: '*', field: 'email' }; }
  return null;
};
B.zone = function (zip) { var zs = (this.cfg.delivery && this.cfg.delivery.zones) || []; for (var i = 0; i < zs.length; i++) if (zs[i].zips.indexOf(zip) >= 0) return zs[i]; return null; };
B.allZips = function () { var out = []; ((this.cfg.delivery && this.cfg.delivery.zones) || []).forEach(function (z) { out = out.concat(z.zips); }); return out; };
B.totals = function () {
  var F = this.state.flows.order; if (!F) return null;
  var self = this, lines = F.items.map(function (l) { var it = self.menu.byId[l.id]; return { id: l.id, name: it.name, qty: l.qty, price: it.price, note: l.note || '', total: Math.round(it.price * l.qty * 100) / 100 }; });
  var sub = lines.reduce(function (s, l) { return s + l.total; }, 0), tax = Math.round(sub * (this.cfg.tax || 0) * 100) / 100;
  var z = F.mode === 'delivery' && F.zip ? this.zone(F.zip) : null, fee = z ? z.fee : 0;
  return { lines: lines, subtotal: sub, tax: tax, fee: fee, total: Math.round((sub + tax + fee) * 100) / 100, zone: z, mode: F.mode };
};
B.cartCard = function () { var t = this.totals(); return t ? { type: 'cart', title: 'Your order', lines: t.lines, subtotal: t.subtotal, tax: t.tax, fee: t.fee, total: t.total, taxRate: this.cfg.tax, mode: t.mode } : null; };
B.blocker = function () {
  var S = this.state, F = S.flows.order;
  if (!F || F.mode !== 'delivery' || !F.zip) return null;
  var t = this.totals();
  if (t.zone && t.subtotal < t.zone.min) return { msg: 'Delivery to ' + F.zip + ' has a ' + money(t.zone.min) + ' minimum, and your subtotal is ' + money(t.subtotal) + '. Would you like to add ' + money(t.zone.min - t.subtotal) + ' more, or switch to pickup?', chips: [{ label: 'Browse menu', text: 'Menu' }, { label: 'Switch to pickup', action: { type: 'set', flow: 'order', field: 'mode', value: 'pickup' } }] };
  return null;
};

/* ── validation feedback ── */
var ERR_R = { past: 'that date has already passed', invalid: "that isn't a real date", closed: "we're closed that day", far: "that's too far ahead", notice: "that's a little too soon for us", full: "we're fully booked that day", tpast: 'that time has already passed', tclosed: "we're not open then", tinvalid: "that isn't a valid time", ttooSoon: "that's a little too soon", tnotice: "that's under our notice period", zout: "we don't deliver there yet", zformat: 'a ZIP code needs 5 digits' };
var ERR_AGAIN = {
  phone: ["That one still doesn't look like a valid number — mind double-checking it?", "Sorry, I still can't read that as a phone number. Could you try again with the area code?", "Hmm, still not quite right — a US number has 10 digits.", "That number doesn't seem to work either. One more try?"],
  email: ["That email still doesn't look right — could you check the spelling?", "Hmm, I still can't use that address. Does it have an @ and something like .com?", "Sorry, that one doesn't work either — mind trying again?", "Still not quite right. Could you type the full email address?"],
  date: ["That date won't work either — {r}. Which other day suits you?", "Sorry, {r}. Is there another day that works?", "Hmm, {r} too. Could you try a different date?", "Still no luck — {r}. Another day, maybe?"],
  time: ["That time won't work either — {r}. Could you pick another?", "Sorry, {r}. Any other time that suits you?", "Hmm, {r} too — maybe one of the times below?", "Still not quite — {r}. Another time?"],
  guests: ["Just the number of guests works — for example, 4.", "Sorry, I still didn't catch the party size. How many people?", "How many guests in total? A number is perfect."],
  qty: ["That quantity is still too high for an online order — up to 50 per item works.", "Sorry, 50 per item is our online limit. Want to adjust it?", "Still over our limit, I'm afraid — up to 50 each, please."],
  zip: ["That ZIP won't work either — {r}. Want to try another, or switch to pickup?", "Sorry, {r}. Another ZIP code, or pickup instead?", "Hmm, {r} as well. Pickup is always an option!"],
  name: ["Sorry, I still need a name — just your first name is fine.", "Hmm, that doesn't look like a name either. What should I call you?", "Could you type just the name for the booking?"],
  address: ['I still need a street address with the building number — like "350 5th Ave, Apt 4B".', "Sorry, I couldn't find a street address in that. Could you try again with the number and street?", "Hmm, that doesn't look like an address yet — number, street and apartment, please."],
  size: ["We only make the sizes below — which one works?", "Sorry, that size isn't available. Pick one of these?", "Our sizes are listed below — which would you like?"]
};
B.hoursRuleLine = function (kind, key) {
  var cfg = this.cfg, self = this;
  var closed = DAY_KEYS.map(function (k, i) { return self.hours[k].length ? null : DAY_FULL[i] + 's'; }).filter(Boolean);
  var line = this.fill(cfg.hoursLine || '');
  if (kind === 'day') {
    var day = key ? DAY_FULL[kdate(key).getDay()] + 's' : joinList(closed);
    return this.pick('hrsDay', ["Sorry, we're closed on " + day + '. ' + line, "We're closed on " + day + ", I'm afraid. " + line]);
  }
  return this.pick('hrsTime', ["Sorry, that's outside our opening hours. " + line, "Sorry, we're not open at that time. " + line]);
};
B.err = function (field, code, R, x) {
  var S = this.state, cfg = this.cfg; x = x || {};
  if (cfg.hoursRule && code === 'closed' && (field === 'date' || field === 'time')) { R.hoursOnly = this.hoursRuleLine(field === 'date' ? 'day' : 'time', x.key); R.errField = field; return false; }
  var n = (S.errors[field] || 0) + 1; S.errors[field] = n;
  var msg;
  if (n === 1) {
    var ex = fmtDate(addDays(sod(this.now), 5)).replace(/^\w+, /, '');
    var F = {
      phone: "Hmm, that phone number doesn't look quite right. Could you share a 10-digit number with the area code, like (212) 555-0147?",
      email: "That email address doesn't look quite right. Could you double-check it? It should look like name@example.com.",
      name: 'Hmm, that doesn\'t look like a name. What name should I put this under? (e.g. "Sara Khan")',
      qty: "We can do up to 50 of any item per online order. For bigger quantities, our catering team can help — just ask!",
      guests: code === 'zero' ? "I'll need at least one guest 😊 How many people are coming — for example, 4?" : code === 'min' ? x.msg : 'How many people will be joining? Just a number, like 4, works great.',
      size: x.msg,
      address: 'I\'ll need the street address with the building number — for example, "245 W 29th St, Apt 4B, ' + (this.allZips()[0] || cfg.zip) + '".'
    }[field];
    if (field === 'date') {
      F = { past: 'That date has already passed — could you pick an upcoming day, like this Saturday or ' + ex + '?',
        invalid: "Hmm, that isn't a real calendar date. Could you try another, like " + ex + '?',
        closed: x.msg || "We're closed that day, I'm afraid. Could you pick another day?",
        far: x.msg || "That's a bit too far ahead for us to book right now — could you choose a date within the next 90 days?",
        notice: x.msg, full: x.msg }[code];
    }
    if (field === 'time') {
      F = { past: (x.t != null ? fmtTime(x.t) + ' has already passed' : 'That time has already passed') + '. Could you pick a later time' + (x.sug != null ? ', like ' + fmtTime(x.sug) : '') + '?',
        closed: x.msg || "We're not open at that time. Could you pick a time during our opening hours?",
        invalid: "That time doesn't look quite right. Could you give me a time like 7:30 PM?",
        tooSoon: x.msg, notice: x.msg, far: 'We take orders up to 7 days ahead — could you pick an earlier day?' }[code];
    }
    if (field === 'zip') F = code === 'out' ? x.msg : 'That ZIP code doesn\'t look quite right — US ZIP codes have 5 digits, like ' + (this.allZips()[0] || cfg.zip) + '.';
    msg = F;
  } else {
    var pool = ERR_AGAIN[field] || ["Sorry, that still doesn't work. Could you try again?"];
    var r = ERR_R[(field === 'time' ? 't' : field === 'zip' ? 'z' : '') + code] || ERR_R[code] || "that doesn't work";
    msg = this.pick('err:' + field, pool).replace('{r}', r);
    if (msg === S.lastErr[field]) msg = this.pick('err:' + field, pool).replace('{r}', r);
  }
  if (n >= 3) msg += ' ' + this.pick('err3', ["If it's easier, you can call us at {phone} and we'll sort it out.", 'You can also reach our team directly at {phone}.', "Or give us a ring at {phone} — we're happy to help."]);
  msg = this.fill(msg);
  S.lastErr[field] = msg;
  R.errs.push(msg); R.errField = field;
  if (x.chips) R.chips = x.chips;
  return false;
};
B.dateChips = function (flow, fromKey, n) {
  var out = [], d = fromKey ? kdate(fromKey) : sod(this.now), self = this, guard = 0;
  while (out.length < (n || 5) && guard++ < 30) {
    var key = dkey(d), ok = this.dayRanges(key).length > 0;
    if (flow === 'reserve' && ok) ok = this.freeSlots(key).length > 0;
    if (ok) { var diff = dayDiff(this.now, d); out.push({ label: diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : DAY_SHORT[d.getDay()] + ' ' + d.getDate(), action: { type: 'date', flow: flow, date: key } }); }
    d = addDays(d, 1);
  }
  return out;
};
B.setDate = function (flow, res, R) {
  var S = this.state, F = S.flows[flow], cfg = this.cfg, self = this;
  if (!F) return;
  if (res.err) return this.err('date', res.err, R, { chips: this.dateChips(flow) });
  var key = res.key, d = kdate(key), diff = dayDiff(this.now, d), day = DAY_FULL[d.getDay()];
  var openDays = DAY_KEYS.map(function (k, i) { return self.hours[k].length ? DAY_SHORT[i] : null; }).filter(Boolean);
  var closedMsg = "We're closed on " + day + 's, I\'m afraid. Could you pick another day? We\'re open ' + joinList(openDays) + '.';
  if (flow === 'reserve' || flow === 'order') {
    if (!this.dayRanges(key).length) return this.err('date', 'closed', R, { key: key, msg: closedMsg, chips: this.dateChips(flow) });
    if (diff > (flow === 'order' ? 7 : 90)) return this.err('date', 'far', R, { msg: flow === 'order' ? 'We take orders up to a week ahead — could you pick an earlier day?' : null, chips: this.dateChips(flow) });
    if (flow === 'reserve' && diff === 0 && !this.freeSlots(key).length) return this.err('date', 'full', R, { msg: (this.slots(key).some(function (t) { return self.future(key, t); }) ? "We're fully booked for the rest of today, sorry!" : "We're past our last seating for today.") + ' Would another day work?', chips: this.dateChips(flow, dkey(addDays(d, 1))) });
    if (flow === 'reserve' && !this.freeSlots(key).length) return this.err('date', 'full', R, { msg: "We're fully booked on " + fmtDate(key) + ', sorry! Could another day work?', chips: this.dateChips(flow, dkey(addDays(d, 1))) });
  }
  if (flow === 'event' || flow === 'catering') {
    var lead = flow === 'event' ? ((cfg.events && cfg.events.lead) || 2) : ((cfg.catering && cfg.catering.lead) || 3);
    if (diff < lead) { var e = dkey(addDays(sod(this.now), lead)); return this.err('date', 'notice', R, { msg: (flow === 'event' ? 'Private events' : 'Catering orders') + ' need at least ' + lead + " days' notice, so " + (diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : fmtDate(key)) + ' is a little too soon. The earliest I can do is ' + fmtDate(e) + ' — would that work?', chips: this.dateChips(flow, e, 4) }); }
    if (diff > 365) return this.err('date', 'far', R, { msg: 'We book events up to a year ahead — could you choose a date before ' + fmtDate(addDays(sod(this.now), 365)) + '?' });
    if (flow === 'event' && !this.dayRanges(key).length) return this.err('date', 'closed', R, { key: key, msg: closedMsg });
  }
  if (flow === 'cake') {
    if (!this.dayRanges(key).length) return this.err('date', 'closed', R, { key: key, msg: closedMsg, chips: this.dateChips('cake', this.cakeEarliest(), 4) });
    var earliest = this.cakeEarliest();
    if (key < earliest) { var ready = this.cfg.cakes.readyMade ? ' ' + this.cfg.cakes.readyMade : ''; return this.err('date', 'notice', R, { msg: "Custom cakes need at least 48 hours' notice, so " + (diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : fmtDate(key)) + ' is a little too soon. The earliest pickup I can offer is ' + fmtDate(earliest) + ' — would that work?' + ready, chips: this.dateChips('cake', earliest, 4) }); }
    if (diff > 90) return this.err('date', 'far', R, { chips: this.dateChips('cake', earliest, 4) });
  }
  this.setF(flow, 'date', key);
  // re-check a time given earlier
  if (F.time != null && typeof F.time === 'object' && F.time.tentative) this.setTime(flow, F.time.mins, R, true);
  else if (F.time != null && (flow === 'reserve' || flow === 'event') && typeof F.time === 'number') this.setTime(flow, F.time, R, true);
};
B.setTime = function (flow, mins, R, recheck) {
  var S = this.state, F = S.flows[flow], self = this;
  if (!F) return;
  if (flow === 'order') {
    var key = (this.T.orderDate) || dkey(this.now);
    var r0 = this.checkOrderTime(key, mins, F.mode);
    if (r0.err) {
      if (r0.err === 'past' && !this.T.orderDate && dayDiff(this.now, addDays(sod(this.now), 0)) === 0) {
        var r1 = this.checkOrderTime(dkey(addDays(sod(this.now), 1)), mins, F.mode);
        if (r1.ok && mins < 360) { this.setF('order', 'time', { key: dkey(addDays(sod(this.now), 1)), mins: mins }); return; }
      }
      var chipsO = this.orderTimes(F.mode, 5).map(function (x) { return { label: (x.key !== dkey(self.now) ? DAY_SHORT[kdate(x.key).getDay()] + ' ' : '') + fmtT(x.mins), action: { type: 'otime', date: x.key, mins: x.mins } }; });
      var rs = this.dayRanges(key);
      return this.err('time', r0.err === 'tooSoon' ? 'tooSoon' : r0.err, R, { t: mins, sug: r0.sug ? r0.sug.mins : null, msg: r0.err === 'tooSoon' ? 'We need about ' + this.lead(F.mode) + ' minutes to get it ready, so the earliest is ' + (r0.sug ? fmtTime(r0.sug.mins) : 'a little later') + '. Does that work?' : r0.err === 'closed' ? (rs.length ? "We're open " + this.rangesText(rs) + ' ' + this.dayWord(key) + ', so ' + fmtTime(mins) + " won't work. Could you pick a time in that window?" : "We're closed " + this.dayWord(key) + '. Could you pick another time?') : null, chips: chipsO });
    }
    this.setF('order', 'time', { key: key, mins: mins });
    return;
  }
  if (!F.date) { F.time = { tentative: true, mins: mins }; this.T.anySet = true; return; }
  if (flow === 'cake') {
    var min = new Date(this.now.getTime() + ((this.cfg.cakes && this.cfg.cakes.lead) || 48) * 3600000), o = this.openAt(at(F.date, mins));
    var times = this.cakeTimes(F.date).map(function (t) { return { label: fmtT(t), action: { type: 'set', flow: 'cake', field: 'time', value: t } }; });
    if (!o) { F.time = null; return this.err('time', 'closed', R, { msg: "We're open " + this.rangesText(this.dayRanges(F.date)) + ' on ' + fmtDate(F.date) + ', so ' + fmtTime(mins) + " won't work for pickup. Could you pick a time in that window?", chips: times }); }
    if (at(F.date, mins) < min) { F.time = null; return this.err('time', 'notice', R, { msg: "Custom cakes need 48 hours' notice, so " + fmtTime(mins) + ' on ' + fmtDate(F.date) + ' is a touch too soon. ' + (times.length ? 'Any of these times work?' : 'Could we do a later day?'), chips: times }); }
    this.setF('cake', 'time', mins); return;
  }
  // reserve / event
  var r = this.checkTableTime(F.date, mins, flow === 'event');
  var chips = this.freeSlots(F.date).slice(0, 8).map(function (t) { return { label: fmtT(t), action: { type: 'slot', date: F.date, mins: t, flow: flow } }; });
  if (r.err) {
    F.time = null;
    var rs2 = this.dayRanges(F.date);
    return this.err('time', r.err, R, { t: mins, sug: (this.freeSlots(F.date)[0]), msg: r.err === 'closed' ? "We're open " + this.rangesText(rs2) + ' ' + this.dayWord(F.date) + ' (last seating ' + fmtT(rs2[rs2.length - 1][1] - this.lastSeat) + '), so ' + fmtTime(mins) + " won't work. Could you pick a time in that window — for example " + (chips[0] ? chips[0].label : fmtT(rs2[0][0])) + '?' : null, chips: chips });
  }
  if (r.full) {
    F.time = null;
    this.T.fullNote = true;
    R.errs.push(this.pick('full', ['{t} is fully booked ' + this.dayWord(F.date) + ', but ' + joinList(r.alts.map(fmtT), 'and') + (r.alts.length > 1 ? ' are' : ' is') + ' open — would ' + (r.alts.length > 1 ? 'either' : 'that') + ' work?', 'Ah, {t} is already taken ' + this.dayWord(F.date) + '. The closest free times are ' + joinList(r.alts.map(fmtT), 'and') + '.']).replace('{t}', fmtTime(r.mins)));
    R.errField = 'time';
    R.chips = r.alts.map(function (t) { return { label: fmtT(t), action: { type: 'slot', date: F.date, mins: t, flow: flow } }; }).concat(chips.filter(function (c) { return r.alts.indexOf(c.action.mins) < 0; }).slice(0, 4));
    return;
  }
  this.setF(flow, 'time', r.mins);
  this.T.timeOk = flow;
};
B.setGuests = function (flow, n, R) {
  var S = this.state, cfg = this.cfg;
  if (!n || n <= 0) return this.err('guests', 'zero', R);
  if (flow === 'reserve' && cfg.reservations && n > cfg.reservations.max) {
    var old = S.flows.reserve; this.drop('reserve');
    var E = this.start('event');
    ['date', 'occasion'].forEach(function (k) { if (old && old[k] != null && E[k] == null) E[k] = old[k]; });
    if (old && typeof old.time === 'number') E.time = old.time;
    this.T.converted = n;
    flow = 'event';
  }
  var evMax = (cfg.events && cfg.events.max) || 60;
  if (flow === 'event' && n > evMax && cfg.catering) {
    var oldE = S.flows.event; this.drop('event');
    var Cf = this.start('catering'); if (oldE && oldE.date) Cf.date = oldE.date;
    this.T.toCatering = n; flow = 'catering';
  }
  if (flow === 'catering' && cfg.catering && n < cfg.catering.min) return this.err('guests', 'min', R, { msg: 'Our catering starts at ' + cfg.catering.min + ' guests. For a smaller group, our regular menu for pickup or delivery is perfect — or tell me a bigger headcount.' });
  this.setF(flow, 'guests', n);
};
B.target = function (field, ctx) {
  var S = this.state, uses = function (f) { return FLOW_FIELDS[f].indexOf(field) >= 0; };
  if (ctx && S.flows[ctx] && uses(ctx)) return ctx;
  var aw = S.awaiting;
  if (aw && aw.field === field && S.flows[aw.flow]) return aw.flow;
  var act = S.active.slice().reverse(), i;
  for (i = 0; i < act.length; i++) if (uses(act[i]) && S.flows[act[i]][field] == null) return act[i];
  for (i = 0; i < act.length; i++) if (uses(act[i])) return act[i];
  return null;
};

/* ── cart ── */
B.applyOps = function (ops, R) {
  var S = this.state, T = this.T, F = this.start('order'), self = this;
  ops = ops.slice().sort(function (a, b) { return (a.type === 'swapOut' ? 0 : 1) - (b.type === 'swapOut' ? 0 : 1); });
  ops.forEach(function (op) {
    if (op.ids.length > 1) { T.ambig.push(op); return; }
    var id = op.ids[0], it = self.menu.byId[id], idx = F.items.findIndex(function (l) { return l.id === id; }), line = F.items[idx], q = op.qty;
    if (q != null && q > 50) { self.err('qty', 'max', R); return; }
    S.lastItem = id;
    if (it.tags.indexOf('alc') >= 0 && (op.type === 'add' || op.type === 'swapIn' || op.type === 'set')) { T.alc.push(it); return; }
    if (op.type === 'add' || op.type === 'swapIn') {
      if (q == null) q = op.type === 'swapIn' && T.swapQty ? T.swapQty : 1;
      if (q === 0) return;
      if (line) { if (line.qty + q > 50) { self.err('qty', 'max', R); return; } line.qty += q; } else F.items.push({ id: id, qty: q });
      T.added.push([q, it]);
    } else if (op.type === 'remove' || op.type === 'swapOut') {
      if (!line) { if (op.type === 'remove') T.notIn.push(it); return; }
      if (op.type === 'swapOut') T.swapQty = line.qty;
      if (q == null || q >= line.qty || op.type === 'swapOut') { F.items.splice(idx, 1); T.removed.push([null, it]); }
      else { line.qty -= q; T.removed.push([q, it]); }
    } else if (op.type === 'note') {
      if (!line) { F.items.push({ id: id, qty: 1, note: op.note }); T.added.push([1, it]); }
      else line.note = op.note;
      T.notes.push([op.note, it]);
    } else if (op.type === 'set') {
      if (q == null) q = 1;
      if (q === 0) { if (line) { F.items.splice(idx, 1); T.removed.push([null, it]); } return; }
      if (line) line.qty = q; else F.items.push({ id: id, qty: q });
      T.updated.push([q, it]);
    }
    T.cartChanged = true; T.anySet = true;
  });
};

/* ── asking for the next field ── */
var ASK = {
  'reserve.guests': ['How many guests will be joining?', 'How many people should I set the table for?', 'How many will be in your party?'],
  'reserve.date': ['What date would you like to come in?', 'Which day works best for you?', 'What day should I book it for?'],
  'reserve.occasion': ['Are you celebrating anything special?', 'Is it a special occasion?'],
  'reserve.note': ['How lovely! 🎉 Would you like me to add a note for our staff — like a candle on dessert or a special message?'],
  'order.mode': ['Would you like that for pickup or delivery?', 'Is this for pickup or delivery?'],
  'order.address': ["What's the delivery address? Include the street, apartment number and ZIP code.", 'Where should we deliver it? Street, apartment and ZIP code, please.'],
  'order.zip': ["And what's the ZIP code for that address?"],
  'cake.flavor': ['Which flavor would you like?', 'What flavor should we bake?'],
  'cake.size': ['What size should it be?', 'Which size would you like?'],
  'cake.message': ['What should we write on the cake? (Or tap "No message".)'],
  'catering.date': ["What's the date of your event?", 'When is the event?'],
  'catering.guests': ['How many guests are you expecting?', 'Roughly how many guests will there be?'],
  'catering.eventType': ['What kind of event is it?', "What's the occasion?"],
  'catering.budget': ['Do you have a budget range in mind?', "What's your rough budget for the food?"],
  'catering.interests': ['Any dishes you\'re most interested in? (e.g. "{sig}", or "chef\'s choice")'],
  'event.date': ['What date are you planning the event for?', 'Which date is the event?'],
  'event.guests': ['How many guests are you expecting?'],
  'event.time': ['What time would you like it to start?'],
  'event.occasion': ["What's the occasion?", 'What are you celebrating?'],
  '*.name': ['What name should I put this under?', 'May I have your name, please?', 'Who should I put this under?'],
  '*.contactPref': ["What's the best way to reach you: phone, email, or both?"],
  '*.phone': ["What's the best phone number to reach you?", 'What number can we reach you on?'],
  '*.email': ["What's your email address?", 'Which email should we use?'],
  '*.both': ["Great — what's your phone number and email address?"]
};
B.askField = function (m, R) {
  var S = this.state, T = this.T, cfg = this.cfg, self = this, F = S.flows[m.flow], key = m.flow + '.' + m.field, q = null, chips = null;
  var today = dkey(this.now);
  if (key === 'reserve.time' || key === 'event.time') {
    if (T.availChips) return;
    var free = this.freeSlots(F.date);
    if (m.flow === 'event') free = this.slots(F.date).filter(function (t) { return self.future(F.date, t); });
    if (!free.length) { q = "We're fully booked " + this.dayWord(F.date) + ' — could another day work?'; F.date = null; chips = this.dateChips(m.flow); }
    else {
      var per = T.period, pick = free;
      if (per) { var win = { morning: [0, 720], afternoon: [720, 1020], evening: [1020, 1320], late: [1260, 3000] }[per]; var f2 = free.filter(function (t) { return t >= win[0] && t < win[1]; }); if (f2.length) pick = f2; }
      if (pick.length > 8) { var dinner = pick.filter(function (t) { return t >= 1050; }); pick = (dinner.length >= 6 && !per ? dinner : pick).slice(0, 8); }
      q = this.pick('ask:time', ["Here's what's open " + this.dayWord(F.date) + ' — tap a time or type your own:', 'These times are free ' + this.dayWord(F.date) + '. Which works for you?']);
      chips = pick.map(function (t) { return { label: fmtT(t), action: { type: 'slot', date: F.date, mins: t, flow: m.flow } }; });
    }
  } else if (key === 'order.time') {
    var asap = this.asapOK(F.mode), d = cfg.delivery || {};
    var ts = this.orderTimes(F.mode, 5);
    chips = (asap ? [{ label: 'ASAP', action: { type: 'otime', asap: true } }] : []).concat(ts.map(function (x) { return { label: (x.key !== today ? DAY_SHORT[kdate(x.key).getDay()] + ' ' : '') + fmtT(x.mins), action: { type: 'otime', date: x.key, mins: x.mins } }; }));
    q = asap ? 'When would you like it? ASAP is about ' + (F.mode === 'delivery' ? d.time : d.pickup) + ', or pick a later time:' : "We're closed right now, so let's schedule it — which time works for you?";
  } else if (key === 'reserve.seating') {
    var opts = cfg.seating.options;
    q = opts.length > 3 ? 'Where would you like to sit — indoors, on the ' + (cfg.seating.outdoorLabel || 'patio').toLowerCase().replace(/^outdoor /, '') + ', at the bar, or in our private dining room?' : opts.indexOf('outdoor') >= 0 ? this.pick('ask:seat', ['Would you prefer indoor or outdoor seating?', 'Inside or out on the patio — any preference?']) : 'Any seating preference?';
    chips = opts.map(function (o) { return { label: o === 'outdoor' ? (cfg.seating.outdoorLabel || 'Outdoor') : SEAT_LABEL[o], action: { type: 'set', flow: 'reserve', field: 'seating', value: o } }; }).concat([{ label: 'No preference', action: { type: 'set', flow: 'reserve', field: 'seating', value: 'any' } }]);
  } else if (key === 'reserve.note' && F.noteWanted) {
    q = 'What would you like the note to say?';
  } else if (key === 'cake.date') {
    var e = this.cakeEarliest();
    q = "When would you like to pick it up? Custom cakes need 48 hours' notice, so the earliest is " + fmtDate(e) + '.';
    chips = this.dateChips('cake', e, 4);
  } else if (key === 'cake.time') {
    var ct = this.cakeTimes(F.date);
    q = 'What time would you like to pick it up on ' + fmtDate(F.date) + '?';
    chips = ct.slice(0, 8).map(function (t) { return { label: fmtT(t), action: { type: 'set', flow: 'cake', field: 'time', value: t } }; });
  } else {
    var pool = ASK[key] || ASK['*.' + m.field] || ['Could you tell me the ' + m.field + '?'];
    if (key === 'catering.interests' && cfg.catering && cfg.catering.interestsQ) pool = [cfg.catering.interestsQ];
    if (m.field === 'name' && S.active.length === 1 && S.active[0] === 'order') pool = ['What name should we put on the order?', 'And what name is the order under?'];
    q = this.pick('ask:' + key, pool).replace('{sig}', this.signature().slice(0, 2).map(function (i) { return i.name.toLowerCase(); }).join(' and '));
    if (key === 'reserve.guests') chips = ['2', '3', '4', '6'].map(function (n) { return { label: n, text: n }; });
    if (key === 'reserve.date' || key === 'event.date' || key === 'catering.date') chips = this.dateChips(m.flow, m.flow === 'reserve' ? null : dkey(addDays(sod(this.now), m.flow === 'event' ? ((cfg.events && cfg.events.lead) || 2) : ((cfg.catering && cfg.catering.lead) || 3))), 5);
    if (key === 'reserve.occasion' || key === 'event.occasion') chips = ['Birthday', 'Anniversary', 'Business', m.flow === 'event' ? 'Other celebration' : 'Just dining'].map(function (o) { return { label: o, text: o === 'Just dining' ? 'no occasion' : o }; });
    if (key === 'reserve.note') chips = [{ label: 'Yes, add a note', text: 'yes' }, { label: 'No thanks', text: 'no thanks' }];
    if (key === 'order.mode') chips = [{ label: 'Pickup', text: 'Pickup' }, { label: 'Delivery', text: 'Delivery' }];
    if (key === 'order.items') { q = this.pick('ask:items', ['What would you like to order? You can type something like "' + this.example() + '", or browse the menu below.', 'What can I get for you? Just type the dishes (e.g. "' + this.example() + '") or tap a section.']); chips = this.menu.cats.map(function (c) { return { label: c, action: { type: 'menu', cat: c } }; }); }
    if (key === 'cake.flavor') chips = cfg.cakes.flavors.map(function (f) { return { label: f, action: { type: 'set', flow: 'cake', field: 'flavor', value: f } }; });
    if (key === 'cake.size') chips = cfg.cakes.sizes.map(function (s) { return { label: s.label + ' · ' + money(s.price), action: { type: 'set', flow: 'cake', field: 'size', value: s.key } }; });
    if (key === 'cake.message') chips = [{ label: 'No message', text: 'no message' }, { label: 'Happy Birthday!', text: '"Happy Birthday!"' }];
    if (key === 'catering.eventType') chips = ['Wedding', 'Corporate', 'Birthday', 'Family gathering', 'Other'].map(function (o) { return { label: o, text: o === 'Other' ? 'other event' : o + ' event' }; });
    if (key === 'catering.budget') chips = ['Under $1,000', '$1,000–$3,000', '$3,000–$6,000', '$6,000+', 'Not sure yet'].map(function (o) { return { label: o, action: { type: 'set', flow: 'catering', field: 'budget', value: o === 'Not sure yet' ? 'Flexible' : o } }; });
    if (key === 'catering.interests') chips = [{ label: "Chef's choice", action: { type: 'set', flow: 'catering', field: 'interests', value: "Chef's choice" } }].concat(this.signature().slice(0, 3).map(function (i) { return { label: i.name, action: { type: 'set', flow: 'catering', field: 'interests', value: i.name } }; }));
    if (m.field === 'contactPref') chips = ['Phone', 'Email', 'Both'].map(function (o) { return { label: o, text: o.toLowerCase() }; });
  }
  if (R.ans.length && q && !R.errs.length) q = this.pick('bridge', ['Now, ', 'Back to your ' + this.flowNoun(m.flow) + ' — ', 'Meanwhile, ']) + lc1(q);
  if (T.clarify) return;
  R.q = q; if (chips) R.chips = chips;
};
B.flowNoun = function (fl) { var S = this.state; var f = fl && fl !== '*' ? fl : S.active[S.active.length - 1]; return { reserve: 'booking', order: 'order', cake: 'cake order', catering: 'catering request', event: 'event inquiry' }[f] || 'booking'; };
B.example = function () {
  var sig = this.signature(), a = sig[0] || this.menu.items[0], drinks = this.menu.items.filter(function (i) { return /drink|beverage|shake|lassi|tea|coffee/i.test(i.cat); }), b = drinks[0] || sig[1] || this.menu.items[1];
  return '2 ' + a.name.toLowerCase() + ' and 1 ' + b.name.toLowerCase();
};

/* ── compose acknowledgements + next question ── */
B.next = function (R) {
  var S = this.state, T = this.T;
  if (T.noNext) return;
  this.composeAcks(R);
  if (!S.active.length) { S.awaiting = null; return; }
  if (T.clarify) return;
  var m = this.firstMissing();
  if (m) {
    S.awaiting = m; S.review = false;
    if (m.flow === 'reserve' && m.field === 'note') S.flows.reserve.noteAsked = true;
    if (R.errs.length && (R.errField === m.field || R.errField === 'time' && m.field === 'time')) { return; }
    if (R.errs.length && R.errField && R.errField !== m.field && /^(phone|email|zip|qty)$/.test(R.errField)) return;
    this.askField(m, R);
    return;
  }
  var bl = this.blocker();
  if (bl) { S.awaiting = { flow: 'order', field: 'items' }; R.q = bl.msg; R.chips = bl.chips; return; }
  S.awaiting = null;
  if (!S.review || T.anySet || T.changed.length || T.forceSummary) {
    S.review = true;
    R.card(this.summaryCard());
    R.q = this.pick('sum', ["Here's your summary — tap Confirm if everything looks right, or Edit to change anything.", 'Please take a quick look below. Tap Confirm to finish, or Edit if anything needs changing.', "All the details are below — just hit Confirm if they look good, or Edit to change something."]);
  } else if (!R.ans.length && !R.acks.length) {
    R.q = this.pick('sum2', ["Just tap Confirm on the summary when you're ready, or Edit to change anything.", 'Whenever you\'re ready, hit Confirm above — or tell me what to change.']);
  }
};
B.fieldLabel = function (flow, field) {
  return ({ guests: 'guests', date: 'date', time: 'time', seating: 'seating', occasion: 'occasion', note: 'note', mode: 'pickup/delivery', address: 'address', zip: 'ZIP', flavor: 'flavor', size: 'size', message: 'message', eventType: 'event type', budget: 'budget', interests: 'menu interests' })[field] || field;
};
B.fieldValue = function (flow, field) {
  if (flow === '*') return this.state.customer[field] || '';
  var F = this.state.flows[flow], v = F && F[field], cfg = this.cfg;
  if (v == null) return '';
  if (field === 'date') return fmtDate(v);
  if (field === 'time') return typeof v === 'number' ? fmtTime(v) : v.asap ? 'ASAP' : v.mins != null ? (v.key && v.key !== dkey(this.now) ? fmtDate(v.key) + ', ' : '') + fmtTime(v.mins) : '';
  if (field === 'seating') return v === 'outdoor' ? (cfg.seating.outdoorLabel || 'Outdoor') : SEAT_LABEL[v] || v;
  if (field === 'size') { var s = cfg.cakes.sizes.filter(function (x) { return x.key === v; })[0]; return s ? s.label : v; }
  if (field === 'mode') return v === 'delivery' ? 'Delivery' : 'Pickup';
  return String(v);
};
B.composeAcks = function (R) {
  var S = this.state, T = this.T, cfg = this.cfg, self = this, acks = [], first = this.first();
  var nm = function (x) { return (x[0] ? x[0] + ' × ' : 'the ') + x[1].name; };
  if (T.added.length || T.removed.length || T.updated.length) {
    var bits = [];
    if (T.removed.length) bits.push('removed ' + joinList(T.removed.map(nm)));
    if (T.added.length) bits.push('added ' + joinList(T.added.map(function (x) { return x[0] + ' × ' + x[1].name; })));
    if (T.updated.length) bits.push('updated ' + joinList(T.updated.map(function (x) { return x[1].name + ' to ' + x[0]; })));
    acks.push(this.pick('cartAck', ['Done — ', 'Got it — ', 'Sure thing — ', 'Perfect — ']) + joinList(bits) + '.');
    if (S.flows.order && S.flows.order.items.length) R.card(this.cartCard());
    else if (S.flows.order) acks.push('Your cart is empty now — what would you like instead?');
  }
  if (T.notes.length) { acks.push(joinList(T.notes.map(function (x) { return 'your ' + x[1].name + ' will be ' + (x[0] === 'Mild' ? 'made mild' : x[0] === 'Medium' ? 'medium-spicy' : 'extra spicy 🌶️'); })).replace(/^y/, 'Got it — y') + '.'); if (!T.added.length && !T.removed.length && !T.updated.length && S.flows.order) R.card(this.cartCard()); }
  if (T.alc.length && !T.minorReply) acks.push((S.minor ? "Sorry, alcohol is only for guests 21+ with a valid ID, so I can't add the " : 'Bar drinks are dine-in only and for guests 21+ with a valid ID, so I can\'t add the ') + joinList(uniq(T.alc).map(function (i) { return i.name; })) + ' to an order — but our mocktails, like the Virgin Mojito or Mango Chili Spritz, can be added anytime! 🍹');
  if (T.notIn.length) acks.push("There's no " + joinList(T.notIn.map(function (i) { return i.name; }), 'or') + ' in your order right now.');
  if (T.ambig.length) {
    var op = T.ambig[0], items = op.ids.map(function (id) { return self.menu.byId[id]; });
    T.clarify = true;
    R.q = 'Which one would you like — ' + joinList(items.map(function (i) { return i.name + ' (' + money(i.price) + ')'; }), 'or') + '?';
    R.chips = items.map(function (i) { return { label: i.name, action: { type: op.type === 'remove' ? 'remove' : 'add', id: i.id, qty: op.qty || 1 } }; });
  }
  if (T.converted) acks.push('For a group of ' + T.converted + ", we'd love to host you as a private event! 🎉 I'll take a few details and our events team will follow up personally.");
  if (T.toCatering) acks.push(T.toCatering + ' guests is more than our dining room holds, so this sounds like a job for our catering team — I\'ll take the details for a quote.');
  // changes to existing values
  var changed = T.changed.filter(function (c) { return c.field !== 'items'; });
  if (changed.length) acks.push('Updated — ' + joinList(changed.map(function (c) { return self.fieldLabel(c.flow, c.field) + ': ' + self.fieldValue(c.flow, c.field); })) + '.');
  var isCh = function (f, k) { return changed.some(function (c) { return c.flow === f && c.field === k; }); };
  var set = function (f, k) { return (T.set[f] || []).indexOf(k) >= 0 && !isCh(f, k); };
  var Rv = S.flows.reserve;
  if (Rv && (set('reserve', 'guests') || set('reserve', 'date') || set('reserve', 'time'))) {
    var s = 'a table' + (Rv.guests ? ' for ' + Rv.guests : '') + (Rv.date ? ' ' + (dayDiff(this.now, kdate(Rv.date)) === 0 && Rv.time >= 1020 ? 'tonight' : this.dayWord(Rv.date)) : '') + (typeof Rv.time === 'number' ? ' at ' + fmtTime(Rv.time) : '');
    var op2 = this.pick('rAck', ['Lovely', 'Great', 'Perfect', 'Wonderful']) + (T.nameSet && first ? ', ' + first : '');
    acks.push(T.timeOk === 'reserve' ? op2 + '! Good news — ' + s + ' is available.' : op2 + ' — ' + s + '.');
  }
  if (Rv && set('reserve', 'seating')) acks.push({ outdoor: 'Outdoors it is — enjoy the fresh air! 🌿', indoor: "Indoors it is — cozy!", booth: "A booth it is — I'll request one for you.", window: "I'll request a window table for you.", bar: "Counter seats it is — great for watching the kitchen!", any: "No problem — we'll find you a great spot." }[Rv.seating]);
  if (Rv && Rv.seating === 'outdoor' && set('reserve', 'seating') && cfg.seating.outdoorNote) acks.push(cfg.seating.outdoorNote);
  if (Rv && set('reserve', 'occasion') && Rv.occasion === 'Anniversary') acks.push('Happy anniversary! 💕');
  if (Rv && set('reserve', 'note') && Rv.note) acks.push("I'll pass that note on to our team. 📝");
  var O = S.flows.order;
  if (O && set('order', 'mode')) acks.push(O.mode === 'delivery' ? (O.zip ? '' : 'Delivery it is!') : 'Pickup it is — you\'ll find us at ' + this.cfg.street + '.');
  if (O && set('order', 'address') && O.address) acks.push('Got it — delivering to ' + O.address + (O.zip && O.address.indexOf(O.zip) < 0 ? ', ' + O.zip : '') + '.');
  if (O && set('order', 'zip')) { var z = this.zone(O.zip); if (z) acks.push('Great news — we deliver to ' + O.zip + ' (' + money(z.fee) + ' delivery fee, ' + money(z.min) + ' minimum).'); }
  if (O && set('order', 'time') && O.time) acks.push(O.time.asap ? "We'll have it " + (O.mode === 'delivery' ? 'at your door in about ' + cfg.delivery.time : 'ready in about ' + cfg.delivery.pickup) + '.' : (O.mode === 'delivery' ? 'Delivery' : 'Pickup') + ' set for ' + (O.time.key !== dkey(this.now) ? fmtDate(O.time.key) + ' at ' : '') + fmtTime(O.time.mins) + '.');
  var Ck = S.flows.cake;
  if (Ck && (set('cake', 'flavor') || set('cake', 'size'))) acks.push((Ck.size ? this.fieldValue('cake', 'size') + ' ' : 'A ') + (Ck.flavor ? Ck.flavor.toLowerCase() + ' ' : '') + 'cake — yum! 🎂');
  if (Ck && set('cake', 'message') && Ck.message) acks.push('We\'ll pipe "' + Ck.message + '" on top.');
  if (Ck && set('cake', 'date') && !set('cake', 'time')) acks.push('Pickup on ' + fmtDate(Ck.date) + ' works.');
  var Ct = S.flows.catering;
  if (Ct && (set('catering', 'guests') || set('catering', 'date')) && !T.toCatering) acks.push('Catering' + (Ct.guests ? ' for ' + Ct.guests + ' guests' : '') + (Ct.date ? ' on ' + fmtDate(Ct.date) : '') + " — we'd love to help!");
  var Ev = S.flows.event;
  if (Ev && !T.converted && (set('event', 'guests') || set('event', 'date'))) acks.push('A private event' + (Ev.guests ? ' for ' + Ev.guests + ' guests' : '') + (Ev.date ? ' on ' + fmtDate(Ev.date) : '') + ' — exciting!');
  if (T.contact.length) acks.push(this.pick('cAck', ["Got it — we'll reach you at ", 'Perfect, I have ', 'Thanks! Noted: ']) + joinList(T.contact) + '.');
  else if (T.nameSet && first && !acks.some(function (a) { return a && a.indexOf(first) >= 0; })) acks.push(this.pick('nAck', ['Thanks, ' + first + '!', 'Nice to meet you, ' + first + '!']));
  acks.filter(Boolean).forEach(function (a) { if (R.acks.indexOf(a) < 0) R.acks.push(a); });
};

/* ── summary / confirm / records ── */
B.section = function (f) {
  var F = this.state.flows[f], self = this, cfg = this.cfg, rows = [];
  var row = function (k, label) { var v = self.fieldValue(f, k); if (v) rows.push([label, v]); };
  if (f === 'reserve') { row('guests', 'Guests'); row('date', 'Date'); row('time', 'Time'); row('seating', 'Seating'); if (F.occasion && F.occasion !== 'None') row('occasion', 'Occasion'); if (F.note) row('note', 'Note for staff'); return { title: 'Table reservation', rows: rows }; }
  if (f === 'order') {
    var t = this.totals();
    rows.push(['Type', F.mode === 'delivery' ? 'Delivery' : 'Pickup']);
    if (F.mode === 'delivery') rows.push(['Address', (F.address || '') + (F.zip && (F.address || '').indexOf(F.zip) < 0 ? ', ' + F.zip : '')]); else rows.push(['Pickup at', cfg.street]);
    rows.push(['Time', F.time && F.time.asap ? 'ASAP (about ' + (F.mode === 'delivery' ? cfg.delivery.time : cfg.delivery.pickup) + ')' : this.fieldValue('order', 'time')]);
    return { title: F.mode === 'delivery' ? 'Delivery order' : 'Pickup order', rows: rows, lines: t.lines, subtotal: t.subtotal, tax: t.tax, fee: t.fee, total: t.total };
  }
  if (f === 'cake') { row('flavor', 'Flavor'); row('size', 'Size'); rows.push(['Message', F.message ? '"' + F.message + '"' : 'No message']); row('date', 'Pickup date'); row('time', 'Pickup time'); var s = cfg.cakes.sizes.filter(function (x) { return x.key === F.size; })[0]; if (s) rows.push(['Price', money(s.price) + ' (pay at pickup)']); return { title: 'Custom cake', rows: rows }; }
  if (f === 'catering') { row('date', 'Event date'); row('guests', 'Guests'); row('eventType', 'Event'); row('budget', 'Budget'); row('interests', 'Cuisines / menu'); return { title: 'Catering request', rows: rows }; }
  if (f === 'event') { row('date', 'Date'); row('guests', 'Guests'); row('time', 'Start time'); row('occasion', 'Occasion'); return { title: 'Private event inquiry', rows: rows }; }
};
B.contactRows = function () { var C = this.state.customer, rows = [['Name', C.name]]; if (C.phone) rows.push(['Phone', C.phone]); if (C.email) rows.push(['Email', C.email]); return rows; };
B.summaryCard = function () {
  var self = this;
  return { type: 'summary', title: 'Please review', sections: this.state.active.map(function (f) { return self.section(f); }), contact: this.contactRows(), buttons: [{ label: 'Edit', action: { type: 'edit' } }, { label: 'Confirm', action: { type: 'confirm' }, primary: true }] };
};
B.ref = function () { var ini = words(this.cfg.name).filter(function (w) { return w !== 'the' && w !== 'and'; }).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase() || 'FC'; return ini + '-' + (1000 + Math.floor(this.rand() * 9000)); };
B.record = function (f) {
  var S = this.state, F = S.flows[f], cfg = this.cfg, sec = this.section(f), ref = this.ref(), line = '', ics = null, title = sec.title, self = this;
  if (f === 'reserve') { line = 'your table for ' + F.guests + ' ' + this.dayWord(F.date, F.time) + ' at ' + fmtTime(F.time) + ' is booked'; ics = { start: at(F.date, F.time), mins: 90, title: 'Table for ' + F.guests + ' at ' + cfg.name }; }
  if (f === 'event') { line = 'your private event inquiry for ' + F.guests + ' guests on ' + fmtDate(F.date) + ' is in, and our events team will be in touch within 24 hours'; ics = { start: at(F.date, F.time), mins: 180, title: 'Private event at ' + cfg.name + ' (pending)' }; }
  if (f === 'order') {
    var t = this.totals();
    var when = F.time.asap ? (F.mode === 'delivery' ? 'arriving in about ' + cfg.delivery.time : 'ready in about ' + cfg.delivery.pickup) : (F.mode === 'delivery' ? 'arriving ' : 'ready ') + (F.time.key !== dkey(this.now) ? 'on ' + fmtDate(F.time.key) + ' ' : '') + 'at ' + fmtTime(F.time.mins);
    line = 'your ' + (F.mode === 'delivery' ? 'delivery' : 'pickup') + ' order #' + ref + ' (' + money(t.total) + ') is in, ' + when;
  }
  if (f === 'cake') { line = 'your ' + this.fieldValue('cake', 'size').replace(/ \(.*\)/, '') + ' ' + F.flavor.toLowerCase() + ' cake will be ready for pickup on ' + fmtDate(F.date) + ' at ' + fmtTime(F.time); ics = { start: at(F.date, F.time), mins: 30, title: 'Cake pickup at ' + cfg.name }; }
  if (f === 'catering') line = 'your catering request for ' + F.guests + ' guests on ' + fmtDate(F.date) + ' is in';
  return { type: f, ref: ref, title: title, line: line, rows: sec.rows, lines: sec.lines, total: sec.total, customer: JSON.parse(JSON.stringify(S.customer)), data: JSON.parse(JSON.stringify(F)), created: this.now.toISOString(), status: 'confirmed', ics: ics ? { start: ics.start.getTime(), mins: ics.mins, title: ics.title, location: this.addr(), desc: 'Ref ' + ref + ' · ' + cfg.phone } : null, business: cfg.name, niche: cfg.id };
};
B.confirm = function (R) {
  var S = this.state, C = S.customer, self = this, first = this.first();
  var recs = S.active.map(function (f) { return self.record(f); });
  recs.forEach(function (r) { S.done.push({ type: r.type, ref: r.ref, line: r.line, status: 'confirmed' }); R.events.push(r); });
  var how = C.phone && C.email ? "We'll call or email you to confirm." : C.phone ? "We'll call you at " + C.phone + ' to confirm.' : "We'll email you at " + C.email + ' to confirm.';
  var types = recs.map(function (r) { return r.type; });
  var extra = types.indexOf('catering') >= 0 ? ' ' + ((this.cfg.catering && this.cfg.catering.closing) || 'Our catering manager will send you a quote.') : '';
  var wish = this.dayWish();
  var text = this.pick('close', ['All set', 'Wonderful', "You're all set", 'Perfect']) + (first ? ', ' + first : '') + '! ' + cap(joinList(recs.map(function (r) { return r.line; }))) + '.' + extra + ' ' + how + ' ' + wish;
  R.card({ type: 'confirmed', records: recs.map(function (r) { return { title: r.title, ref: r.ref, rows: r.rows, lines: r.lines, total: r.total, ics: r.ics }; }) });
  R.ans = [text]; R.acks = []; R.errs = []; R.q = null; R.chips = [];
  S.flows = {}; S.active = []; S.review = false; S.awaiting = null;
  R.after.push({ text: 'Anything else I can help with?', cards: [], chips: [] });
  S.pending = { type: 'anything_else' };
  this.T.noNext = true;
};
B.dayWish = function () { var h = this.now.getHours(); return h < 12 ? 'Have a great day! 😊' : h < 17 ? 'Have a lovely afternoon! 😊' : 'Enjoy your evening! 😊'; };
B.goodbye = function (R) {
  var S = this.state, first = this.first(), w = this.dayWish().replace(' 😊', ' 👋');
  var t = this.pick('bye', ['Thanks for chatting with us', 'It was a pleasure helping you', 'Thanks so much']) + (first ? ', ' + first : '') + '! ' + w;
  if (S.active.length) t = 'No problem! Just so you know, your ' + this.flowNoun() + " isn't placed yet — message me anytime to finish it. " + w;
  R.ans = [t]; R.q = null; R.chips = [];
  S.ended = true; S.pending = null; S.awaiting = null;
  this.T.noNext = true;
};
B.handleCancel = function (c, R) {
  var S = this.state, t = c.text, self = this;
  var which = /\b(order|cart|food|delivery|pickup)\b/.test(t) ? 'order' : /\b(reservation|booking|table)\b/.test(t) ? 'reserve' : /\bcake\b/.test(t) ? 'cake' : /\bcatering\b/.test(t) ? 'catering' : /\b(event|party)\b/.test(t) ? 'event' : null;
  var noun = { order: 'order', reserve: 'reservation', cake: 'cake order', catering: 'catering request', event: 'event inquiry' };
  var act = which ? (S.flows[which] ? [which] : []) : S.active.slice();
  if (act.length) {
    act.forEach(function (f) { self.drop(f); });
    S.review = false; S.awaiting = null;
    R.say(this.pick('cxl', ["No problem — I've cancelled that " + noun[act[0]] + '. Nothing was placed.', 'Done — that ' + noun[act[0]] + " is cancelled, and nothing was sent to the kitchen."]) + (S.active.length ? '' : ' Is there anything else I can help you with?'));
    return;
  }
  var d = S.done.filter(function (x) { return x.status === 'confirmed' && (!which || x.type === which); }).pop();
  if (d) {
    d.status = 'cancelled';
    R.events.push({ cancel: true, ref: d.ref, type: d.type });
    var C = S.customer;
    R.say('Done — your ' + noun[d.type] + ' #' + d.ref + ' has been cancelled. ' + (C.phone && C.email ? "We'll call or email you to confirm." : C.phone ? "We'll call you to confirm." : "We'll email you to confirm.") + ' Anything else I can help with?');
    return;
  }
  R.say(this.fill("I don't see an active " + (which ? noun[which] : 'order or booking') + ' in this chat. If you placed it another way, just call us at {phone} and we\'ll sort it out.'));
};
B.editPrompt = function (R) {
  var S = this.state, self = this, chips = [];
  S.active.forEach(function (f) {
    FLOW_FIELDS[f].forEach(function (k) {
      if (f === 'reserve' && k === 'note') return;
      if (f === 'order' && k === 'address' && S.flows.order.mode !== 'delivery') return;
      if (f === 'order' && k === 'items') { chips.push({ label: 'Items', action: { type: 'editField', flow: f, field: k } }); return; }
      chips.push({ label: cap(self.fieldLabel(f, k)), action: { type: 'editField', flow: f, field: k } });
    });
  });
  chips.push({ label: 'Name', action: { type: 'editField', flow: '*', field: 'name' } }, { label: 'Contact', action: { type: 'editField', flow: '*', field: 'contact' } });
  R.say(this.pick('edit', ['Of course! What would you like to change? You can type it (like "make it 6 people" or "change the time to 8:30") or tap below.', 'Sure — what needs changing? Tap a detail below or just tell me.']));
  R.chips = chips.slice(0, 10);
  this.T.noNext = true;
};

/* ── topic answers ── */
B.itemsOf = function (c) {
  var self = this, ids = [];
  c.mentions.forEach(function (m) { ids = ids.concat(m.ids); });
  if (!ids.length && /\b(it|that|this|them|they)\b/.test(c.text) && this.state.lastItem) ids = [this.state.lastItem];
  return uniq(ids).map(function (id) { return self.menu.byId[id]; }).filter(Boolean);
};
B.menuCard = function (title, items) { return { type: 'menu', title: title, items: items.map(function (i) { var tags = i.tags.slice(); if (i.al.indexOf('N') >= 0 || i.al.indexOf('P') >= 0) tags.push('nuts'); if (i.al.indexOf('D') >= 0) tags.push('dairy'); return { id: i.id, name: i.name, price: i.price, desc: i.desc, tags: tags }; }) }; };
B.detectSection = function (t) {
  var x = ' ' + t + ' ';
  for (var i = 0; i < this.sections.length; i++) if (x.indexOf(' ' + this.sections[i].w + ' ') >= 0 || x.indexOf(' ' + this.sections[i].w + 's ') >= 0) return this.sections[i].cat;
  return null;
};
B.inSection = function (list, c) { if (!c.section) return list; var f = list.filter(function (i) { return i.cat === c.section; }); return f.length ? f : list; };
B.answer = function (tp, c, R) {
  var id = tp.t.id, cfg = this.cfg, S = this.state, self = this, items = this.itemsOf(c), d = cfg.delivery || {};
  if (tp.t.kind === 'faq') { R.say(this.fill(tp.t.answer)); return; }
  switch (id) {
    case 'hours': {
      if (c.date && !c.date.err) { var rs = this.dayRanges(c.date.key); R.say(rs.length ? cap(this.dayWord(c.date.key)) + " we're open " + this.rangesText(rs) + '.' : "We're closed on " + DAY_FULL[kdate(c.date.key).getDay()] + 's — we open again ' + this.nextOpen() + '.'); return; }
      if (/\b(now|right now|currently|still|yet|at the moment|today|tonight)\b/.test(c.text)) {
        var o = this.openAt(this.now);
        R.say(o ? 'Yes, we\'re open right now until ' + fmtT(o.r[1]) + '!' : "We're closed right now — we open again " + this.nextOpen() + '.');
        return;
      }
      R.say(cfg.hoursNote ? this.fill(cfg.hoursNote) : this.pick('hrs', ['Here are our opening hours:', 'Our hours are below:']));
      R.card({ type: 'info', title: 'Opening hours', rows: this.hoursRows() });
      return;
    }
    case 'location': R.say(this.fill("We're at {address}." + (cfg.directions ? ' ' + cfg.directions : ''))); R.card({ type: 'link', label: 'Open in Google Maps', url: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(this.addr() + ' ' + cfg.name) }); return;
    case 'contact': R.say(this.fill("You can call us at {phone} or email {email} — we'd love to hear from you!")); return;
    case 'parking': R.say(this.fill(cfg.parking)); return;
    case 'payment': R.say(this.fill(cfg.payments)); return;
    case 'delivery': {
      var zip = c.zips[0];
      if (zip) {
        var z = this.zone(zip);
        if (z) {
          R.say('Yes! We deliver to ' + zip + ' — ' + money(z.fee) + ' delivery fee, ' + money(z.min) + ' minimum, and it usually takes ' + d.time + '.');
          var O = S.flows.order;
          if (O && O.mode !== 'pickup' && !O.zip) { if (!O.mode) this.setF('order', 'mode', 'delivery'); this.setF('order', 'zip', zip); }
          else if (!O) R.chips = [{ label: 'Start a delivery order', text: 'I want to order for delivery to ' + zip }];
        } else {
          R.say(this.fill('Sorry, ' + zip + " is outside our delivery area. We deliver to " + joinList(this.allZips()) + '. Pickup is always available at ' + cfg.street + '.'));
          R.chips = [{ label: 'Order for pickup', text: 'I want to order for pickup' }];
        }
        return;
      }
      var zs = d.zones || [], fees = zs.map(function (x) { return x.fee; }), mins = zs.map(function (x) { return x.min; });
      R.say(zs.length ? 'We deliver to ' + joinList(this.allZips()) + ', with delivery fees from ' + money(Math.min.apply(null, fees)) + ' and a ' + money(Math.min.apply(null, mins)) + ' minimum. ' + (d.note ? this.fill(d.note) : 'Just tell me your ZIP and I\'ll check!') : this.fill(d.note || "We don't offer delivery right now, but pickup is quick and easy."));
      return;
    }
    case 'deliveryTime': R.say('Delivery usually takes ' + d.time + ', and pickup orders are ready in about ' + d.pickup + '.'); return;
    case 'pickup': R.say('Pickup is easy — orders are usually ready in about ' + d.pickup + ", and you'll find us at " + cfg.street + '.' + (S.flows.order ? '' : ' Want me to start a pickup order?')); if (!S.flows.order) R.chips = [{ label: 'Start a pickup order', text: 'I want to order for pickup' }]; return;
    case 'seating': R.say(this.fill(cfg.seating.text)); return;
    case 'kids': { if (/\b(vegan|vegetarian|veg|veggie|plant based)\b/.test(c.text)) return this.answer({ t: { id: 'veg', kind: 'topic' } }, c, R); R.say(this.fill(cfg.kids)); var k = this.menu.items.filter(function (i) { return i.tags.indexOf('k') >= 0; }); if (k.length) R.card(this.menuCard('Kids menu', k)); return; }
    case 'privateEvents': R.say(this.fill(cfg.privateEvents)); if (!S.flows.event) R.chips = [{ label: 'Plan a private event', text: 'I want to plan a private event' }]; return;
    case 'reservationInfo':
      if (!cfg.reservations) { R.say(this.fill(cfg.noReserve)); R.chips = [{ label: 'Get a catering quote', text: 'catering quote' }]; return; }
      R.say(this.fill(cfg.reservations.text || ('Yes, we take reservations for 1–' + cfg.reservations.max + ' guests, and we host larger groups as private events. Walk-ins are welcome too!')) + (S.flows.reserve ? '' : ' Want me to book a table?'));
      if (!S.flows.reserve) R.chips = [{ label: 'Book a table', text: 'Book a table' }];
      return;
    case 'halal': {
      items = items.filter(function (i) { return c.mentions.some(function (m) { return m.ids.indexOf(i.id) >= 0; }); });
      if (items.length) {
        var it = items[0];
        if (it.tags.indexOf('v') >= 0 || it.tags.indexOf('vg') >= 0) R.say('Our ' + it.name + ' is vegetarian, so there\'s no meat in it at all. ' + this.fill(cfg.halal));
        else if (it.tags.indexOf('h') >= 0 || cfg.allHalal) R.say('Yes — our ' + it.name + ' is halal. ' + this.fill(cfg.halal));
        else R.say('Our ' + it.name + " isn't made with halal-certified meat. " + this.fill(cfg.halal));
      } else R.say(this.fill(cfg.halal));
      return;
    }
    case 'veg': {
      var vegan = /\b(vegan|plant based)\b/.test(c.text), forKids = /\b(kid|kids|child|children|toddler|little one|little ones)\b/.test(c.text);
      var list = this.inSection(this.menu.items.filter(function (i) { return vegan ? i.tags.indexOf('vg') >= 0 : (i.tags.indexOf('v') >= 0 || i.tags.indexOf('vg') >= 0); }), c);
      if (forKids && !items.length) {
        var kl = list.filter(function (i) { return i.tags.indexOf('s') < 0 && !/bar|drink|coffee/i.test(i.cat) && (i.tags.indexOf('k') >= 0 || /kids|dessert|bakery|italian|american|japanese|thai|indian|mexican|middle/i.test(i.cat)); });
        kl.sort(function (a, b) { return (b.tags.indexOf('k') >= 0) - (a.tags.indexOf('k') >= 0); });
        R.say(vegan ? 'Here are vegan dishes kids usually love — all mild, no spice. Our kitchen can also make kids portions of most of them.' : 'Here are vegetarian dishes kids usually love — all mild, no spice. We can do half portions of most of them, too.');
        if (kl.length) R.card(this.menuCard(vegan ? 'Vegan picks for kids' : 'Veggie picks for kids', kl.slice(0, 6)));
        return;
      }
      if (items.length) { var iv = items[0]; R.say(iv.tags.indexOf('vg') >= 0 ? 'Yes — our ' + iv.name + ' is vegan! 🌱' : iv.tags.indexOf('v') >= 0 ? 'Our ' + iv.name + ' is vegetarian' + (vegan ? ' (but not vegan — it contains dairy or egg).' : '. 🌱') : 'Our ' + iv.name + " isn't vegetarian, I'm afraid." + (list.length ? ' Try the ' + list[0].name + ' instead!' : '')); return; }
      R.say(this.fill(cfg.veg));
      if (list.length) R.card(this.menuCard(vegan ? 'Vegan picks' : 'Vegetarian picks', list.slice(0, 8)));
      return;
    }
    case 'gf': { var g = this.menu.items.filter(function (i) { return i.tags.indexOf('gf') >= 0; }); R.say(this.fill(cfg.glutenFree) + ' ' + this.fill("Our kitchen does handle wheat flour, so please let our staff know so the kitchen can take care.")); if (g.length) R.card(this.menuCard('Gluten-free picks', g.slice(0, 8))); return; }
    case 'spicy': {
      if (items.length) { var is = items[0]; R.say(is.tags.indexOf('s') >= 0 ? 'Yes — our ' + is.name + ' has a good kick 🌶️. ' + this.fill(cfg.spice) : 'Our ' + is.name + ' is on the mild side. ' + this.fill(cfg.spice)); return; }
      var sp = this.inSection(this.menu.items.filter(function (i) { return i.tags.indexOf('s') >= 0; }), c);
      if (!c.section) { var seen = {}, rr = [], rest = []; sp.forEach(function (i) { if (!seen[i.cat] && (i.tags.indexOf('s2') >= 0 || i.tags.indexOf('pop') >= 0)) { seen[i.cat] = 1; rr.push(i); } else rest.push(i); }); sp = rr.concat(rest); }
      var hot = sp.filter(function (i) { return i.tags.indexOf('s2') >= 0; });
      R.say((c.section ? 'In our ' + c.section + ' section, the spicy dishes are the ' : 'Our spicy dishes include the ') + joinList(sp.slice(0, 6).map(function (i) { return i.name + (i.tags.indexOf('s2') >= 0 ? ' 🌶️🌶️' : ''); })) + '. ' + (sp.slice(0, 6).some(function (i) { return i.tags.indexOf('s2') >= 0; }) ? 'The 🌶️🌶️ ones are the hottest. ' : '') + this.fill(cfg.spice));
      if (sp.length) R.card(this.menuCard('Spicy picks', sp.slice(0, 6)));
      return;
    }
    case 'best': {
      if (c.section) { var pop = this.menu.items.filter(function (i) { return i.cat === c.section; }); var p2 = pop.filter(function (i) { return i.tags.indexOf('pop') >= 0; }); pop = uniq(p2.concat(pop)).slice(0, 3); R.say('In our ' + c.section + ' section, the best sellers are the ' + joinList(pop.map(function (i) { return i.name; })) + (p2.length === 1 ? ' — the ' + p2[0].name + ' is the most popular.' : '.')); R.card(this.menuCard(c.section + ' favorites', pop)); return; }
      var sig = this.signature(); R.say(this.fill(cfg.best || ('Our guests\' favorites are the ' + joinList(sig.map(function (i) { return i.name; })) + '.'))); R.card(this.menuCard('Guest favorites', sig)); return; }
    case 'deals': { var dl = this.menu.items.filter(function (i) { return /deal|combo|special|bundle|platter|feast|set/i.test(i.cat); }); R.say(this.fill(cfg.dealsText || 'Here are our current deals and combos:')); if (dl.length) R.card(this.menuCard('Deals & combos', dl)); return; }
    case 'menu': if (c.mentions.length && (c.q || /\b(have|got|serve|sell)\b/.test(c.text))) return this.answerItemExists(c, R); return this.showMenu(tp.cat, R);
    case 'price': {
      if (c.section) { var kwds = c.text.split(' ').filter(function (w) { return w.length > 3 && !/price|cost|much|your|what/.test(w); }); var fam = this.menu.items.filter(function (i) { return i.cat === c.section && kwds.some(function (w) { return i.name.toLowerCase().indexOf(w) >= 0; }); }); if (fam.length > 1) items = fam; }
      if (items.length) { R.say(cap(joinList(items.slice(0, 5).map(function (i) { return 'the ' + i.name + ' is ' + money(i.price); }))) + '.'); R.card(this.menuCard('', items.slice(0, 4))); return; }
      var ps = this.inSection(this.menu.items.filter(function (i) { return !/drink|beverage|dessert|side|kid|bread|extra|bar/i.test(i.cat) || c.section === i.cat; }), c).map(function (i) { return i.price; });
      R.say((c.section ? 'Dishes in our ' + c.section + ' section run ' : 'Most of our dishes run ') + money(Math.min.apply(null, ps)) + '–' + money(Math.max.apply(null, ps)) + ', plus tax. Want to see the menu?');
      if (c.section) { R.card(this.menuCard(c.section, this.menu.items.filter(function (i) { return i.cat === c.section; }))); return; } R.chips = [{ label: 'Show menu', text: 'Menu' }];
      return;
    }
    case 'itemInfo': {
      var ii = items.slice(0, 2);
      R.say(ii.map(function (i) { var tg = i.tags.filter(function (x) { return /^(v|vg|h|s|gf)$/.test(x); }).map(function (x) { return TAG_LABEL[x].toLowerCase(); }); return 'Our ' + i.name + ' (' + money(i.price) + '): ' + lc1(i.desc) + (tg.length ? ' It\'s ' + joinList(tg) + '.' : ''); }).join(' '));
      R.card(this.menuCard('', ii)); return;
    }
    case 'catering': R.say(this.fill(cfg.catering ? cfg.catering.text : "We don't offer catering at the moment.")); if (cfg.catering && !S.flows.catering) R.chips = [{ label: 'Get a catering quote', text: 'catering quote' }]; return;
    case 'cakes':
      if (cfg.cakes) { R.say(this.fill(cfg.cakes.text)); if (!S.flows.cake) R.chips = [{ label: 'Order a custom cake', text: 'I want to order a custom cake' }]; }
      else { var cl = this.closest('cake', 2); R.say(this.fill(cfg.noCakes || "We don't make custom cakes, but you're welcome to bring your own.") + (cl.length ? ' For something sweet here, try our ' + joinList(cl.map(function (i) { return i.name; }), 'or') + '.' : '')); if (cl.length) R.card(this.menuCard('', cl)); }
      return;
    case 'tax': R.say('Sales tax is ' + +(cfg.tax * 100).toFixed(3) + '%, and it\'s added to your order total.'); return;
    case 'bot': R.say(this.fill("I'm {name}'s virtual assistant 🤖 — I can help with the menu, orders and reservations. For anything else, our team is at {phone}.")); return;
    case 'cart': { var O2 = S.flows.order; if (O2 && O2.items.length) { R.say("Here's your order so far:"); R.card(this.cartCard()); } else R.say('Your cart is empty right now — want to see the menu?'); return; }
    case 'orderStatus': { var dn = S.done.filter(function (x) { return x.type === 'order' && x.status === 'confirmed'; }).pop(); R.say(dn ? this.fill('Your order #' + dn.ref + ' is confirmed — ' + dn.line.replace(/^your .*? is in, /, '') + '. For live updates, call us at {phone}.') : this.fill("I don't see an order placed in this chat yet. If you ordered another way, call us at {phone} for an update.")); return; }
  }
};
B.showMenu = function (cat, R) {
  var self = this;
  if (cat) {
    var its = this.menu.items.filter(function (i) { return i.cat === cat; });
    var cm = /menu|deals|drinks|kids|bar/i.test(cat) ? cat : cat + ' menu';
    R.say(this.pick('menuCat', ["Here's our " + cm + ' — tap Add on anything you like:', 'Our ' + cm + ', coming right up! Tap Add to put something in your order.']));
    R.card(this.menuCard(cat, its));
  } else {
    R.say(this.pick('menu', ["Here's our menu! Tap a section to browse, or just tell me what you're craving.", 'Happy to show you! Pick a section below, or type any dish to add it.']));
    R.card(this.menuCard('Guest favorites', this.signature()));
  }
  R.chips = this.menu.cats.filter(function (c) { return c !== cat; }).map(function (c) { return { label: c, action: { type: 'menu', cat: c } }; });
  this.T.menuChips = true;
};
B.answerItemExists = function (c, R) {
  var items = this.itemsOf(c), self = this;
  if (c.mentions.some(function (m) { return m.ids.length > 1; })) {
    R.say('Yes! We have ' + joinList(items.map(function (i) { return i.name + ' (' + money(i.price) + ')'; })) + '.'); R.card(this.menuCard('', items)); return;
  }
  if (items.length) { var i = items[0]; R.say('Yes, we do! Our ' + i.name + ' is ' + money(i.price) + ' — ' + lc1(i.desc)); R.card(this.menuCard('', items.slice(0, 3))); return; }
  this.answerUnknown(c, R);
};
B.answerUnknown = function (c, R) {
  var self = this, cfg = this.cfg, cards = [];
  c.unknown.slice(0, 2).forEach(function (dish) {
    var cl = self.closest(dish, 2);
    if (dish === 'cake' || dish === 'cupcake' || dish === 'cheesecake' && !cl.length) { R.say(self.fill(cfg.noCakes || "We don't make custom cakes, but you're welcome to bring your own.") + (cl.length ? ' For something sweet here, try our ' + joinList(cl.map(function (i) { return i.name; }), 'or') + '.' : '')); }
    else R.say('We don\'t have ' + dish + ' on our menu, I\'m afraid' + (cl.length ? ' — the closest we have is ' + joinList(cl.map(function (i) { return 'the ' + i.name + ' (' + money(i.price) + ')'; }), 'or') + '.' : '.'));
    cards = cards.concat(cl);
  });
  if (cards.length) R.card(this.menuCard('You might like', uniq(cards)));
};
B.answerAllergy = function (cls, R) {
  var self = this, cfg = this.cfg, al = [], items = [], unknown = [], parts = [];
  cls.forEach(function (c) { al = al.concat(c.allergens); items = items.concat(self.itemsOf(c)); unknown = unknown.concat(c.unknown); });
  al = uniq(al); items = uniq(items); unknown = uniq(unknown);
  var alName = al.length ? joinList(uniq(al.map(function (a) { return ALLERGENS[a]; })), 'or') : null;
  unknown.slice(0, 1).forEach(function (d) { var cl = self.closest(d, 2); parts.push('We don\'t have ' + d + ' on our menu' + (cl.length ? ' — the closest dishes are the ' + joinList(cl.map(function (i) { return i.name; }), 'and') + '.' : '.')); items = items.concat(cl); });
  var clean = [];
  items.slice(0, 3).forEach(function (it) {
    var has = it.al.filter(function (a) { return al.indexOf(a) >= 0; });
    if (!al.length) parts.push('Our ' + it.name + (it.al.length ? ' contains ' + joinList(it.al.map(function (a) { return ALLERGENS[a]; })) + '.' : " doesn't list any major allergens in its recipe."));
    else if (has.length) parts.push('Our ' + it.name + ' contains ' + joinList(has.map(function (a) { return ALLERGENS[a]; })) + ", so I'd skip that one.");
    else clean.push(it.name);
  });
  if (clean.length) parts.push((clean.length > 1 ? 'The ' + joinList(clean) + ' have' : 'Our ' + clean[0] + ' has') + ' no ' + alName + ' in the recipe.');
  if (!items.length && al.length) {
    var pool = this.signature().concat(this.menu.items);
    var safe = uniq(pool).filter(function (i) { return !i.al.some(function (a) { return al.indexOf(a) >= 0; }) && !/drink|beverage/i.test(i.cat); }).slice(0, 4);
    if (safe.length) parts.push('Dishes made without ' + alName + ' include the ' + joinList(safe.map(function (i) { return i.name; })) + '.');
    items = safe;
  }
  if (!items.length && !al.length) parts.push('Just let me know which dish or allergen you\'re asking about and I\'ll share what\'s in it.');
  parts.push(this.fill('Our kitchen handles common allergens' + (cfg.allergens ? ' like ' + cfg.allergens : '') + " — please let our staff know so the kitchen can take care. We can't guarantee any dish is completely allergen-free."));
  R.say(parts.join(' '));
  if (items.length) R.card(this.menuCard('', items.slice(0, 4)));
};
B.answerAvail = function (c, R) {
  var S = this.state, cfg = this.cfg, self = this;
  if (!cfg.reservations) { R.say(this.fill(cfg.noReserve)); return; }
  if (c.date && c.date.err) { this.err('date', c.date.err, R); return; }
  var key = (c.date && c.date.key) || (S.flows.reserve && S.flows.reserve.date) || dkey(this.now);
  var per = c.period || (c.date && c.date.night ? 'evening' : null);
  if (!this.dayRanges(key).length) { if (cfg.hoursRule) { R.hoursOnly = this.hoursRuleLine('day', key); return; } R.say("We're closed on " + DAY_FULL[kdate(key).getDay()] + 's — we open again ' + this.nextOpen() + '.'); return; }
  var free = this.freeSlots(key);
  var win = per && { morning: [0, 720], afternoon: [720, 1020], evening: [1020, 1320], late: [1260, 3000] }[per];
  var inWin = win ? free.filter(function (t) { return t >= win[0] && t < win[1]; }) : free;
  var dw = this.dayWord(key);
  if (!inWin.length) {
    R.say(cap(dw) + (per ? ' ' + per : '') + " is fully booked, I'm afraid." + (free.length ? ' We do have ' + joinList(free.slice(0, 4).map(fmtT)) + ' open that day.' : ' Could another day work?'));
    inWin = free.slice(0, 6);
  } else {
    R.say(this.pick('avail', [cap(dw) + (per ? ' in the ' + per : '') + ' we have tables free at ' + joinList(inWin.slice(0, 6).map(fmtT)) + '. Tap one to grab it!', 'Good news — ' + dw + (per ? ' ' + per : '') + ' we still have ' + joinList(inWin.slice(0, 6).map(fmtT)) + ' open. Want one of those?']));
  }
  if (inWin.length) { R.chips = inWin.slice(0, 8).map(function (t) { return { label: fmtT(t), action: { type: 'slot', date: key, mins: t } }; }); this.T.availChips = true; }
  if (S.flows.reserve && !S.flows.reserve.date && c.date && !c.date.err) this.setF('reserve', 'date', key);
};

/* ── main entry ── */
var ADDR_RE = /\b\d{1,5}[a-z]?\s+(?:[A-Za-z0-9.'-]+\s+){0,4}(?:st|street|ave|avenue|rd|road|blvd|boulevard|ln|lane|dr|drive|pl|place|way|broadway|ct|court|pkwy|parkway|ter|terrace|sq|square|hwy|highway|plaza|walk|loop|row)\b\.?(?:,?\s*(?:apt|apartment|unit|suite|ste|#|fl|floor)\.?\s*#?[A-Za-z0-9-]+)?(?:,?\s*[A-Za-z .]+)?(?:,?\s*\b\d{5}\b)?/i;

B.handle = function (batch, now) {
  this.now = now || new Date();
  this.T = { started: [], set: {}, changed: [], added: [], removed: [], updated: [], notes: [], alc: [], notIn: [], ambig: [], contact: [], loose: {}, anySet: false };
  var R = new Reply(this), self = this, texts = [];
  /* ─────────────────────────── CLAUDE API HOOK ───────────────────────────
   * To use Claude instead of (or on top of) this rule engine, send the batched
   * text plus a system prompt built from `this.cfg` (menu, hours, policies) and
   * `this.state` to YOUR OWN server endpoint, which calls the Anthropic Messages
   * API (never put an API key in browser code), e.g.:
   *
   *   const res = await fetch('/api/chat', { method: 'POST',
   *     body: JSON.stringify({ niche: this.cfg.id, text: texts.join('\n'), state: this.state }) });
   *   // server: anthropic.messages.create({ model: 'claude-sonnet-5-5', system, messages })
   *
   * Keep the validation, availability and booking logic below as tools the model
   * calls, so prices, hours and time slots always come from the config.
   * ─────────────────────────────────────────────────────────────────────── */
  batch.forEach(function (m) { if (m.action) self.act(m.action, R); else if (m.text && String(m.text).trim()) texts.push(String(m.text).trim()); });
  if (texts.length) this.understand(texts.join('\n'), R);
  else this.next(R);
  return R.done();
};
B.setOrderAsap = function (R) {
  var F = this.state.flows.order, self = this;
  if (this.asapOK(F.mode)) { this.setF('order', 'time', { asap: true }); return; }
  var nx = this.orderTimes(F.mode, 5);
  this.err('time', 'closed', R, { msg: "We're closed right now, so ASAP isn't possible" + (nx[0] ? ' — the earliest we can do is ' + (nx[0].key !== dkey(this.now) ? fmtDate(nx[0].key) + ' at ' : '') + fmtTime(nx[0].mins) + '. Would that work?' : '.'), chips: nx.map(function (x) { return { label: (x.key !== dkey(self.now) ? DAY_SHORT[kdate(x.key).getDay()] + ' ' : '') + fmtT(x.mins), action: { type: 'otime', date: x.key, mins: x.mins } }; }) });
};
B.setZip = function (zip, R) {
  var O = this.state.flows.order;
  if (!O) return;
  if (O.mode === 'pickup') return;
  if (!this.allZips().length) { R.say(this.fill(this.cfg.delivery.note || "We don't offer delivery, but pickup is quick and easy.")); if (!O.mode) this.setF('order', 'mode', 'pickup'); return; }
  if (!O.mode) this.setF('order', 'mode', 'delivery');
  var z = this.zone(zip);
  if (!z) { O.zip = null; return this.err('zip', 'out', R, { msg: this.fill("Sorry, we don't deliver to " + zip + ' yet. We cover ' + joinList(this.allZips()) + '. Would you like to switch to pickup, or try another address?'), chips: [{ label: 'Switch to pickup', action: { type: 'set', flow: 'order', field: 'mode', value: 'pickup' } }] }); }
  this.setF('order', 'zip', zip);
};
B.setName = function (nm) {
  var C = this.state.customer;
  if ((C.name && C.name !== nm) || (this.state.editing && this.state.editing.field === 'name')) { this.T.changed.push({ flow: '*', field: 'name' }); this.state.editing = null; }
  C.name = nm; this.T.nameSet = true; this.state.errors.name = 0;
};
B.clearField = function (flow, field, R) {
  var S = this.state, C = S.customer, F = S.flows[flow];
  S.editing = { flow: flow, field: field };
  if (flow === '*') { if (field === 'name') C.name = null; else { C.phone = null; C.email = null; C.pref = null; } }
  else if (F) {
    if (flow === 'order' && field === 'items') { R.say('Sure — tell me what to add or remove, like "remove the ' + (F.items[0] ? this.menu.byId[F.items[0].id].name.toLowerCase() : 'drink') + '" or "add 2 more".'); R.card(this.cartCard()); this.T.noNext = true; S.review = false; S.awaiting = { flow: 'order', field: 'items' }; return; }
    if (flow === 'order' && field === 'mode') { F.mode = null; F.zip = null; F.address = null; }
    else if (flow === 'reserve' && field === 'occasion') { F.occasion = null; F.note = null; F.noteWanted = false; }
    else F[field] = null;
  }
  S.review = false;
};
B.act = function (a, R) {
  var S = this.state;
  switch (a.type) {
    case 'slot': {
      var f = a.flow || (S.flows.event && S.flows.event.time == null ? 'event' : 'reserve');
      if (f === 'reserve' && !this.cfg.reservations) return;
      this.start(f);
      if (S.flows[f].date !== a.date) this.setDate(f, { key: a.date }, R);
      if (S.flows[f].date === a.date) this.setTime(f, a.mins, R);
      break;
    }
    case 'date': this.start(a.flow); this.setDate(a.flow, { key: a.date }, R); break;
    case 'otime': if (S.flows.order) { if (a.asap) this.setOrderAsap(R); else { this.T.orderDate = a.date; this.setTime('order', a.mins, R); } } break;
    case 'set':
      if (!S.flows[a.flow]) this.start(a.flow);
      if (a.flow === 'cake' && a.field === 'time') this.setTime('cake', a.value, R);
      else this.setF(a.flow, a.field, a.value);
      break;
    case 'add': this.applyOps([{ type: 'add', ids: [a.id], qty: a.qty || 1 }], R); break;
    case 'remove': if (S.flows.order) this.applyOps([{ type: 'remove', ids: [a.id], qty: a.qty || null }], R); break;
    case 'menu': this.showMenu(a.cat, R); break;
    case 'start': this.start(a.flow); break;
    case 'confirm': if (S.review && S.active.length) this.confirm(R); break;
    case 'edit': if (S.active.length) this.editPrompt(R); break;
    case 'editField': this.clearField(a.flow, a.field, R); break;
  }
};
B.greeting = function () {
  var first = this.first();
  return this.pick('hi', ['Hi' + (first ? ' ' + first : ' there') + '! 👋 How can I help you today?', 'Hello' + (first ? ' ' + first : '') + '! 😊 What can I do for you today?', 'Hey' + (first ? ' ' + first : '') + '! Great to see you. What can I get started for you?']);
};
B.welcome = function () {
  var cfg = this.cfg;
  var t = cfg.welcome || ('Hi there! 👋 Welcome to {name}' + (cfg.tagline ? ' — ' + lc1(cfg.tagline.replace(/\.$/, '')) : '') + '. I can show you our menu, take your order for pickup or delivery' + (cfg.reservations ? ', or book you a table' : '') + '. What can I get started for you?');
  return this.fill(t);
};

B.understand = function (raw, R) {
  var S = this.state, cfg = this.cfg, self = this, T = this.T, C = S.customer;
  if (INJECTION.test(raw)) { R.scoped = true; T.noNext = true; return; }
  var aw = S.awaiting || {};
  var em = this.extractEmails(raw, aw.field === 'email' || aw.field === 'both');
  var phoneCtx = /^(phone|both)$/.test(aw.field || '') || /\b(phone|number|cell|mobile|call me|text me|reach me|contact me)\b/i.test(raw);
  var ph = this.extractPhones(raw, phoneCtx, /^(phone|both)$/.test(aw.field || ''));
  var cleaned = raw;
  em.spans.concat(ph.spans).forEach(function (s) { if (s) cleaned = cleaned.split(s).join(' '); });
  var quoted = /["“]([^"”]{1,80})["”]/.exec(raw);
  var addrM = ADDR_RE.exec(cleaned);
  var nameX = this.extractName(cleaned, aw.field === 'name');
  var chName = /\b(?:change|update|correct)\s+(?:the\s+|my\s+)?name\s+(?:to|as)\s+([A-Za-z][A-Za-z' -]{1,40})/i.exec(cleaned);
  if (chName) nameX = this.validName(chName[1]) || nameX;
  var cls = this.prep(cleaned).map(function (c) { return self.analyze(c, S); });
  var understood = !!(em.valid.length || ph.valid.length);
  var any = function (k) { return cls.some(function (c) { return c[k]; }); };
  var isQ = cls.some(function (c) { return c.q; });
  var plain = cleaned.replace(/\s+/g, ' ').trim();
  var hasOther = cls.some(function (c) { return !c.oosUsed && (c.topic || c.unknown.length || c.mentions.length || c.allergy || c.avail || c.greet || c.thanks || c.flowKw); });

  // age: alcohol is 21+ only
  var ageM = /\b(?:i am|i'm|im|i’m|am)\s+(?:only\s+)?(\d{1,2})\b(?!\s*(?:people|guests|persons|of us|pm|am|:|kg|lb|inch|th|st|nd|rd|\/))|\b(\d{1,2})\s*(?:years? old|yrs? old|yo)\b/i.exec(raw);
  var ageNum = ageM ? +(ageM[1] || ageM[2]) : null;
  if (ageNum != null && ageNum < 21) S.minor = true;
  if (ageNum != null && ageNum >= 21) S.minor = false;
  if (/\b(under ?age|under 21|not 21|minor)\b/i.test(raw)) S.minor = true;
  var alcWord = /\b(beer|beers|wine|wines|cocktail|cocktails|alcohol|alcoholic|liquor|vodka|whiskey|whisky|rum|tequila|bourbon|margarita|margaritas|mojito|martini|drunk|booze|shots?)\b/i.test(raw) && !/\b(virgin|mocktail|non ?alcoholic|alcohol free)\b/i.test(raw);
  if (S.minor && alcWord && !this.T.minorReply) {
    var mocks = this.menu.items.filter(function (i) { return i.cat === 'Bar' && i.tags.indexOf('alc') < 0; });
    R.say(this.pick('minor', ["Sorry, alcohol is only served to guests 21+ with a valid ID. But you're very welcome to try our mocktails — the Virgin Mojito and Mango Chili Spritz are favorites! 🍹", "I'm sorry, we can only serve alcohol to guests 21 and over with a valid ID. Our mocktails are just as fun, though — how about a Berry Nojito? 🍹"]));
    if (mocks.length) R.card(this.menuCard('Mocktails', mocks));
    this.T.minorReply = true;
  }
  // after a goodbye: stay quiet on more thanks/bye, answer anything real
  if (S.ended) {
    if (!understood && cls.every(function (c) { return c.thanks || c.bye || c.noOnly || c.yesOnly; })) { R.silent = true; T.noNext = true; return; }
    S.ended = false;
  }
  // out-of-scope clauses are ignored when mixed with real questions
  cls.forEach(function (c) {
    if (c.oos && !c.flowKw && !c.mentions.length && !c.allergy && !(c.topic && c.topic.score >= 2 && !c.other)) c.used = c.oosUsed = true;
    if (c.other) c.used = c.oosUsed = true;
  });
  if (cls.length && cls.every(function (c) { return c.oosUsed; }) && !understood) { R.scoped = true; T.noNext = true; return; }

  if (any('startOver')) {
    S.flows = {}; S.active = []; S.review = false; S.awaiting = null; S.pending = null; S.errors = {};
    R.say(this.pick('fresh', ["No problem — let's start fresh! What can I help you with?", 'Sure, clean slate! What would you like to do?']));
    T.noNext = true; return;
  }
  // cancellations
  var cx = cls.filter(function (c) { return c.cancel && !c.used && !c.ops.length && !/\b(policy|fee|deposit|charge)\b/.test(c.text); });
  if (cx.length) { this.handleCancel(cx[0], R); cx.forEach(function (c) { c.used = true; }); understood = true; }

  // 1) which flows is the guest asking for?
  var ctx = null;
  cls.forEach(function (c) {
    if (c.used) return;
    var f = c.flowKw;
    c.ctx = f || ctx; if (f) ctx = f;
    if (!f) return;
    var req;
    if (f === 'reserve') req = !c.q || c.reqQ || !!(c.guests || (c.date && !c.avail) || (c.time && c.time.mins != null));
    else if (f === 'order') req = (!c.q && (c.ops.length > 0 || /\b(order|deliver|delivery|delivered|takeout|take out|takeaway|to go|carryout)\b/.test(c.text)) && !/\b(where|status|track)\b/.test(c.text)) || c.reqQ;
    else req = !c.q || c.reqQ || !!(c.guests || c.date || c.size || c.flavor);
    if (f === 'reserve' && /\b(policy|walk in|walk ins|walkin)\b/.test(c.text)) req = false;
    if (f === 'order' && c.topic && /^(cart|orderStatus|deliveryTime|payment|tax)$/.test(c.topic.t.id) && !c.ops.length) req = false;
    if (f === 'order' && aw.field === 'interests') req = false;
    if (!req) return;
    c.started = f; understood = true;
    if (f === 'reserve' && !cfg.reservations) { T.noReserve = true; if (cfg.catering && (c.guests || 0) >= cfg.catering.min) { self.start('catering'); c.ctx = 'catering'; } return; }
    self.start(f);
  });
  cls.forEach(function (c) {
    if (c.used) return;
    var hardVerb = /\b(add|remove|delete|drop|make|change|swap|replace|take off|another|more|want|get|order|give|need|have)\b/.test(c.text) || c.ops.some(function (o) { return o.explicitQty; });
    c.opsOK = c.ops.length > 0 && !(c.topic && !hardVerb) && (!c.q || c.reqQ || /\b(add|remove|delete|drop|make|change|swap|replace|take off|another|more)\b/.test(c.text)) && c.ctx !== 'cake' && c.ctx !== 'catering' && !(aw.field === 'interests' && !c.flowKw) && !(S.flows.cake && /^(flavor|size|message)$/.test(aw.field || '') && !c.flowKw) && !c.allergy;
    if (c.opsOK && c.ops.every(function (o) { return o.type === 'remove' || o.type === 'swapOut'; }) && !S.flows.order) { c.opsOK = false; T.notIn = T.notIn.concat(c.ops.map(function (o) { return self.menu.byId[o.ids[0]]; })); understood = true; }
    if (c.opsOK && c.ops.every(function (o) { return o.ids.length === 1 && self.menu.byId[o.ids[0]].tags.indexOf('alc') >= 0; })) { c.opsOK = false; if (!T.minorReply) c.ops.forEach(function (o) { T.alc.push(self.menu.byId[o.ids[0]]); }); understood = true; }
    if (c.opsOK && !S.flows.order) { self.start('order'); c.started = c.started || 'order'; }
  });

  // 2) details
  cls.forEach(function (c) {
    if (c.used) return;
    if (c.cakeWord && !cfg.cakes && !c.flowKw) return;
    var ctx = c.ctx;
    if (c.guests != null) { var fg = self.target('guests', ctx === 'order' ? null : ctx); if (fg) { self.setGuests(fg, c.guests, R); understood = true; } else if (!c.q) T.loose.guests = c.guests; }
    // "make it 5" / "actually 6 people"
    var mk = /\b(?:make it|make that|change it to|actually|now)\s+(\d{1,2})\b(?!\s*(am|pm|:|\d|th|st|nd|rd))/.exec(c.text);
    if (mk && c.guests == null && !c.ops.length && !c.time) {
      var lf = S.lastFlow;
      if (lf && /reserve|event|catering/.test(lf) && S.flows[lf]) { self.setGuests(lf, +mk[1], R); understood = true; }
      else if (S.flows.order && S.lastItem) { self.applyOps([{ type: 'set', ids: [S.lastItem], qty: +mk[1] }], R); understood = true; }
    }
    if (c.date && !(c.avail && !S.flows.reserve && !c.started)) {
      var fd = self.target('date', ctx === 'order' ? null : ctx);
      if (ctx === 'order' && S.flows.order) { if (c.date.err) self.err('date', c.date.err, R); else { T.orderDate = c.date.key; S.flows.order.day = c.date.key; } understood = true; }
      else if (fd) { self.setDate(fd, c.date, R); understood = true; }
      else if (S.flows.order && !S.flows.cake) { if (!c.date.err) { T.orderDate = c.date.key; S.flows.order.day = c.date.key; } understood = true; }
      else if (!c.avail && !c.q) T.loose.date = c.date;
    }
    var tm = c.time;
    if (!tm && !c.mentions.length) { var mv = /\b(move|push|change|switch|reschedule|make)\b.*\bto (\d{1,2})(:\d{2})?\b(?!\s*(people|guests|persons|ppl|of us))/.exec(c.text); if (mv && (S.flows.reserve || S.flows.event || S.flows.order)) tm = self.parseTime('at ' + mv[2] + (mv[3] || ''), c); }
    if (tm) {
      if (tm.err) { if (S.active.length) { self.err('time', 'invalid', R); understood = true; } }
      else if (tm.asap) { if (S.flows.order && (ctx === 'order' || !ctx || aw.flow === 'order')) { self.setOrderAsap(R); understood = true; } }
      else if (tm.mins != null) {
        var ft = (ctx === 'order' && S.flows.order) ? 'order' : self.target('time', ctx);
        if (!ft && S.flows.order) ft = 'order';
        if (ft) { if (ft === 'order') T.orderDate = T.orderDate || S.flows.order.day; self.setTime(ft, tm.mins, R); understood = true; }
        else if (!c.q) T.loose.time = tm.mins;
      } else if (tm.period) { T.period = tm.period; if (S.active.length) understood = true; }
    }
    if (c.seating && !(c.q && !c.reqQ)) {
      if (S.flows.reserve) {
        var opts = (cfg.seating && cfg.seating.options) || [];
        if (c.seating !== 'any' && opts.indexOf(c.seating) < 0) { R.say(self.fill(c.seating === 'outdoor' ? (cfg.seating.noOutdoor || "We don't have outdoor seating, I'm afraid — but our dining room is lovely.") : "We don't have " + SEAT_LABEL[c.seating].toLowerCase() + " seating, but I'll note your preference.")); if (c.seating !== 'outdoor') self.setF('reserve', 'seating', 'any'); }
        else self.setF('reserve', 'seating', c.seating);
        understood = true;
      } else if (!c.q) T.loose.seating = c.seating;
    }
    if (c.occasion && ctx !== 'cake' && ctx !== 'catering') {
      var fo = S.flows.event && (ctx === 'event' || !S.flows.reserve) ? 'event' : S.flows.reserve ? 'reserve' : null;
      if (fo) { self.setF(fo, 'occasion', c.occasion); understood = true; }
    }
    if (S.flows.catering && (ctx === 'catering' || aw.flow === 'catering')) {
      if (c.eventType || (c.occasion && c.occasion !== 'None')) { self.setF('catering', 'eventType', c.eventType || c.occasion); understood = true; }
      if (c.budget) { self.setF('catering', 'budget', c.budget); understood = true; }
    }
    if (c.mode && S.flows.order && ctx !== 'cake' && !c.q) {
      if (c.mode === 'delivery' && !self.allZips().length) { R.say(self.fill(cfg.delivery.note || "We don't offer delivery, but pickup is quick and easy.") + " I've set your order up for pickup."); self.setF('order', 'mode', 'pickup'); }
      else if (S.flows.order.mode !== c.mode) self.setF('order', 'mode', c.mode);
      understood = true;
    }
    if (c.zips.length && S.flows.order && !c.q) { self.setZip(c.zips[0], R); understood = true; }
    else if (c.badZip && S.flows.order && (/^(zip|address)$/.test(aw.field || '') || S.flows.order.mode === 'delivery')) { self.err('zip', 'format', R); understood = true; }
    if (S.flows.cake && (ctx === 'cake' || aw.flow === 'cake' || !c.flowKw)) {
      if (c.flavor) { self.setF('cake', 'flavor', c.flavor); understood = true; }
      if (c.size) {
        if (typeof c.size === 'string') self.setF('cake', 'size', c.size);
        else self.err('size', 'bad', R, { msg: 'We make ' + joinList(cfg.cakes.sizes.map(function (s) { return s.label; }), 'or') + ' cakes — which of those would you like?', chips: cfg.cakes.sizes.map(function (s) { return { label: s.label + ' · ' + money(s.price), action: { type: 'set', flow: 'cake', field: 'size', value: s.key } }; }) });
        understood = true;
      }
      if (quoted && S.flows.cake.message == null && (/\b(write|say|says|saying|message|on it|on top)\b/.test(c.text) || aw.field === 'message')) { self.setF('cake', 'message', quoted[1].trim()); understood = true; }
    }
    if (c.opsOK && c.spiceNote) c.ops.forEach(function (o) { if (o.type === 'set' || (o.type === 'add' && !o.explicitQty && S.flows.order && S.flows.order.items.some(function (l) { return o.ids.length === 1 && l.id === o.ids[0]; }))) { o.type = 'note'; o.note = c.spiceNote; } });
    if (c.opsOK) { self.applyOps(c.ops, R); understood = true; }
    if (c.opsOK && c.spiceNote) c.ops.forEach(function (o) { if (o.type === 'add' && o.ids.length === 1) { var ln = S.flows.order.items.filter(function (l) { return l.id === o.ids[0]; })[0]; if (ln) ln.note = c.spiceNote; } });
  });

  // 3) contact details
  if (ph.valid.length) { if (C.phone !== ph.valid[0]) { if (C.phone) T.changed.push({ flow: '*', field: 'phone' }); C.phone = ph.valid[0]; T.contact.push(C.phone); } S.errors.phone = 0; }
  if (em.valid.length) { if (C.email !== em.valid[0]) { if (C.email) T.changed.push({ flow: '*', field: 'email' }); C.email = em.valid[0]; T.contact.push(C.email); } S.errors.email = 0; }
  var prefC = cls.filter(function (c) { return c.pref && !c.used; })[0];
  if (prefC && (aw.field === 'contactPref' || /\b(call|text|email|phone) me\b|\b(by|via|through) (phone|email|text)\b/.test(prefC.text))) { C.pref = prefC.pref; understood = true; }
  if (!C.pref && (C.phone || C.email)) C.pref = C.phone && C.email ? 'both' : C.phone ? 'phone' : 'email';
  if (ph.bad && !ph.valid.length) { this.err('phone', 'bad', R); understood = true; }
  if (em.bad && !em.valid.length) { this.err('email', 'bad', R); understood = true; }
  if (nameX && (aw.field === 'name' || S.active.length || T.started.length || !C.name)) { this.setName(nameX); understood = true; }
  else if (aw.field === 'name') {
    var cand = cleaned.replace(/\b(my name is|my name's|name is|it's|its|it is|i am|i'm|im|this is|call me|name:|hi|hello|hey|thanks|thank you|please|sure|ok|okay)\b/ig, ' ').replace(/[^A-Za-z' -]/g, ' ').replace(/\s+/g, ' ').trim();
    var nm = this.validName(cand);
    if (nm && !understood) { this.setName(nm); understood = true; }
    else if (!understood && !isQ && !hasOther) { this.err('name', 'bad', R); understood = true; }
  }

  if (!C.name && !nameX && !understood && aw.field !== 'name' && S.active.length && !isQ && cls.length === 1 && !cls[0].topic && !cls[0].mentions.length) {
    var nm2 = this.validName(plain.replace(/\b(it's|its|it is|i am|i'm|im|this is|my name is)\b/ig, ' ').trim());
    if (nm2 && plain.split(/\s+/).length <= 3) { this.setName(nm2); understood = true; if (aw.flow === 'reserve' && aw.field === 'occasion' && S.flows.reserve) S.flows.reserve.occasion = 'None'; }
  }
  if (!C.pref && !understood && S.active.length && /^(phone|email|both|call|text|e mail|mail)( please| is fine| works)?$/.test(plain.toLowerCase())) { C.pref = /both/.test(plain.toLowerCase()) ? 'both' : /mail/.test(plain.toLowerCase()) ? 'email' : 'phone'; understood = true; }
  // 4) free-text answers to the question we just asked
  if (aw.flow && S.flows[aw.flow]) {
    var F = S.flows[aw.flow], c0 = cls[0] || {};
    switch (aw.field) {
      case 'address':
        if (!isQ && F.address == null) {
          var a = addrM ? addrM[0] : (/\d/.test(plain) && /[a-z]{3,}/i.test(plain) && plain.split(' ').length >= 2 && !T.anySet ? plain : null);
          if (a) { a = a.replace(/,?\s*\b\d{5}\b\s*$/, '').replace(/[,\s]+$/, '').trim(); this.setF('order', 'address', a); understood = true; }
          else if (!understood && !hasOther) { this.err('address', 'bad', R); understood = true; }
        }
        break;
      case 'zip': if (!understood && !isQ && !hasOther) { this.err('zip', 'format', R); understood = true; } break;
      case 'note':
        if (F.noteWanted) { if (!isQ) { this.setF('reserve', 'note', quoted ? quoted[1] : plain); understood = true; } }
        else if (c0.noStart && !quoted) { F.note = ''; understood = true; }
        else if (c0.yesStart || quoted) {
          var rest = quoted ? quoted[1] : plain.replace(/^(yes|yeah|yep|sure|ok|okay|please|yes please)[\s,!.:-]*(please)?[\s,!.:-]*/i, '').replace(/^(add a note|add note|a note|note)[\s:,-]*/i, '').replace(/^(saying|that says|to say|write|put|add|say)\s*[:\-]?\s*/i, '');
          if (rest.length > 2) this.setF('reserve', 'note', rest); else F.noteWanted = true;
          understood = true;
        } else if (!isQ && !understood && plain.length > 3) { this.setF('reserve', 'note', plain); understood = true; }
        break;
      case 'message':
        if (S.flows.cake.message == null) {
          if (quoted) this.setF('cake', 'message', quoted[1].trim());
          else if (/\b(no message|none|nothing|blank|plain|no text|no writing|leave it blank|no)\b/i.test(plain) && plain.split(' ').length <= 4) this.setF('cake', 'message', '');
          else if (!isQ && !T.anySet) this.setF('cake', 'message', plain.replace(/^(please )?(write|say|put|message|it should say|make it say)\s*[:\-]?\s*/i, '').slice(0, 60));
          understood = true;
        }
        break;
      case 'interests':
        if (!isQ && F.interests == null && plain.length > 1) { this.setF('catering', 'interests', plain.slice(0, 140)); understood = true; }
        break;
      case 'eventType':
        if (F.eventType == null && !isQ && plain.split(' ').length <= 6) { this.setF('catering', 'eventType', titleCase(plain.replace(/\bevent\b/i, '').trim() || plain)); understood = true; }
        break;
      case 'occasion':
        if (aw.flow === 'event' && F.occasion == null && !isQ && plain.split(' ').length <= 6) { this.setF('event', 'occasion', titleCase(plain)); understood = true; }
        else if (aw.flow === 'reserve' && F.occasion == null && !isQ && !understood && plain.split(' ').length <= 4 && !cls.some(function (c) { return c.topic || c.mentions.length || c.gib || c.oos; })) { this.setF('reserve', 'occasion', titleCase(plain)); understood = true; }
        break;
      case 'budget':
        if (F.budget == null && !isQ && /\d|flexible|not sure|no idea/i.test(plain)) { this.setF('catering', 'budget', plain.slice(0, 40)); understood = true; }
        break;
      case 'flavor':
        if (F.flavor == null && !isQ && !understood) { R.say("We don't have that flavor, I'm afraid — we bake " + joinList(cfg.cakes.flavors.map(function (x) { return x.toLowerCase(); })) + '.'); understood = true; }
        break;
      case 'guests': if (!understood && !isQ && !hasOther) { this.err('guests', 'invalid', R); understood = true; } break;
      case 'date': if (!understood && !isQ && !hasOther) { this.err('date', 'invalid', R, { chips: this.dateChips(aw.flow) }); understood = true; } break;
      case 'time': if (!understood && !isQ && !hasOther) { this.err('time', 'invalid', R); understood = true; } break;
    }
  }
  if ((aw.field === 'phone' || aw.field === 'both') && !ph.valid.length && !em.valid.length && !understood && !isQ && !hasOther) { this.err('phone', 'bad', R); understood = true; }
  if (aw.field === 'email' && !em.valid.length && !understood && !isQ && !hasOther) { this.err('email', 'bad', R); understood = true; }

  // 5) questions → answers (always before we return to the pending step)
  if (T.minorReply) { understood = true; cls.forEach(function (c) { if (/\b(beer|wine|cocktail|alcohol|liquor|drink|vodka|whiskey|rum|tequila|bourbon|margarita|mojito|martini|shot)s?\b|\b(21|age|old)\b/.test(c.text) || c.mentions.some(function (m) { return m.ids.some(function (id) { return self.menu.byId[id].tags.indexOf('alc') >= 0; }); })) c.answered = true; }); }
  var allergyC = cls.filter(function (c) { return c.allergy && !c.used; });
  if (allergyC.length) { this.answerAllergy(allergyC, R); allergyC.forEach(function (c) { c.answered = true; }); understood = true; }
  cls.forEach(function (c) {
    if (c.used || c.answered || c.gib) return;
    if (c.avail && !c.started) { self.answerAvail(c, R); c.answered = true; understood = true; return; }
    var tp = c.topic;
    if (tp) {
      var id = tp.t.id;
      var freeText = /^(name|address|note|message|interests|eventType|occasion|budget)$/.test(aw.field || '');
      var ent = !!(c.date || c.time || c.guests || c.opsOK || c.zips.length || (c.seating && S.flows.reserve));
      var ok = c.q || tp.score >= 2 || (c.stems.length <= 5 && !ent && !c.started && !freeText);
      if (c.opsOK && !c.q) ok = false;
      if (!c.q && c.seating && S.flows.reserve) ok = false;
      if (tp.t.flow && c.started === tp.t.flow) ok = false;
      if (id === 'reservationInfo' && (c.started || !c.q && S.flows.reserve)) ok = false;
      if (id === 'contact' && /^(phone|email|both|contactPref)$/.test(aw.field || '')) ok = false;
      if ((id === 'delivery' || id === 'pickup' || id === 'seating' || id === 'spicy' || id === 'kids' || id === 'price' || id === 'best') && !c.q && (c.started || ent || (aw.field && c.stems.length > 3))) ok = false;
      if (id === 'hours' && !c.q && (ent || c.started)) ok = false;
      if (id === 'deals' && !c.q && c.started) ok = false;
      if (id === 'menu' && !c.q && c.started && !tp.cat) ok = false;
      if (id === 'cart' && !c.q && !/\b(cart|total)\b/.test(c.text)) ok = false;
      if (tp.t.kind === 'faq' && !c.q && tp.score < 2 && (c.started || ent || freeText)) ok = false;
      if (id === 'itemInfo' && c.opsOK) ok = false;
      if (ok) { self.answer(tp, c, R); c.answered = true; understood = true; return; }
    }
    if (c.q && !c.reqQ && (c.mentions.length || c.unknown.length) && !c.opsOK) { self.answerItemExists(c, R); c.answered = true; understood = true; return; }
    if (c.unknown.length && !c.q && !(c.ctx === 'catering' || aw.field === 'interests')) { self.answerUnknown(c, R); c.answered = true; understood = true; }
  });
  if (T.noReserve) { R.say(this.fill(cfg.noReserve)); understood = true; if (!S.flows.catering) R.chips = [{ label: 'Get a catering quote', text: 'catering quote' }]; }

  // 6) confirm / edit / closing
  var anyChange = T.anySet || T.changed.length || T.contact.length || T.nameSet || T.cartChanged;
  if (S.review && S.active.length && !anyChange && !R.errs.length && (any('confirmWord') || cls.some(function (c) { return c.yesOnly; }))) { this.confirm(R); return; }
  if (S.review && S.active.length && !anyChange && any('edit') && !R.ans.length) { this.editPrompt(R); return; }
  if (S.pending && S.pending.type === 'anything_else' && !understood) {
    if (cls.every(function (c) { return c.noOnly || c.thanks || c.bye || c.noStart; })) { this.goodbye(R); return; }
    if (cls.every(function (c) { return c.yesOnly; })) { R.say(this.pick('more', ['Of course! What else can I help you with?', 'Sure — what can I do for you?'])); S.pending = null; T.noNext = true; return; }
  }
  if (S.pending && S.pending.type === 'loose' && !understood) {
    if (cls.every(function (c) { return c.yesOnly; })) {
      var L = S.pending.data; S.pending = null; this.start('reserve'); understood = true;
      if (L.guests) this.setGuests('reserve', L.guests, R);
      if (L.date && S.flows.reserve) this.setDate('reserve', L.date, R);
      if (L.time != null && S.flows.reserve) this.setTime('reserve', L.time, R);
      if (L.seating && S.flows.reserve) this.setF('reserve', 'seating', L.seating);
      if (!S.flows.reserve && S.flows.event) { if (L.date) this.setDate('event', L.date, R); }
    } else if (cls.every(function (c) { return c.noOnly; })) { S.pending = null; R.say('No problem! What can I help you with?'); T.noNext = true; return; }
  }
  if (!understood && any('bye')) { this.goodbye(R); return; }
  if (!understood && any('thanks') && cls.every(function (c) { return c.thanks || c.noOnly || c.yesOnly || c.oosUsed; })) {
    if (!S.active.length) { R.say(this.pick('yw', ["You're very welcome! 😊 Is there anything else I can help you with?", 'Happy to help! 😊 Anything else I can do for you?'])); S.pending = { type: 'anything_else' }; T.noNext = true; return; }
    R.say("You're welcome! 😊"); understood = true;
  }
  if (!understood && any('greet')) { R.say(this.greeting()); understood = true; }

  // loose details with no flow → ONE clarifying question
  var L2 = T.loose;
  if (!S.active.length && !R.ans.length && !R.errs.length && (L2.guests || L2.date || L2.time != null || L2.seating)) {
    var desc = (L2.guests ? ' for ' + L2.guests : '') + (L2.date && !L2.date.err ? ' ' + this.dayWord(L2.date.key) : '') + (L2.time != null ? ' at ' + fmtTime(L2.time) : '');
    if (cfg.reservations) { S.pending = { type: 'loose', data: L2 }; R.q = 'Would you like me to book a table' + desc + '?'; R.chips = [{ label: 'Yes, book a table', text: 'yes' }, { label: 'No thanks', text: 'no' }]; }
    else { R.q = 'Is that for a catering event, or a pickup/delivery order?'; R.chips = [{ label: 'Catering', text: 'catering quote' }, { label: 'Order', text: 'I want to order' }]; }
    T.clarify = true; understood = true;
  }

  if (!understood) {
    if (cls.length && cls.every(function (c) { return c.gib || c.oosUsed; }) && cls.some(function (c) { return c.gib; })) { R.ans = ["Sorry, I didn't quite catch that. Could you rephrase?"]; T.noNext = true; return; }
    if (cls.length && cls.every(function (c) { return c.yesOnly || c.noOnly; })) {
      if (!S.active.length) { R.say('Sure! What can I help you with — our menu, an order' + (cfg.reservations ? ', or a table' : ', or catering') + '?'); T.noNext = true; return; }
      this.next(R); return;
    }
    R.scoped = true; T.noNext = true; return;
  }
  this.next(R);
};

/* ── config personalisation ── */
function resolveConfig(base, o) {
  o = o || {};
  var cfg = JSON.parse(JSON.stringify(base));
  if (o.name) cfg.name = String(o.name).slice(0, 60);
  if (o.city) { cfg.city = String(o.city).slice(0, 40); cfg.customCity = true; }
  if (o.phone) cfg.phone = String(o.phone).slice(0, 24);
  if (o.email) cfg.email = String(o.email).slice(0, 60);
  return cfg;
}

/* ═══════════════════════ 6. WIDGET (Shadow DOM UI) ═══════════════════════ */
var ICONS = {
  pot: '<path d="M4 10h16v3a8 8 0 0 1-16 0z"/><path d="M2 10h20"/><path d="M9 6.5c0-1 .8-1.5.8-2.5M12 6.5c0-1 .8-1.5.8-2.5M15 6.5c0-1 .8-1.5.8-2.5"/><path d="M8 21h8"/>',
  chai: '<path d="M5 8h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 9h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M3 21h16"/><path d="M9 3c0 1-.8 1.5-.8 2.5M12 3c0 1-.8 1.5-.8 2.5"/>',
  bowl: '<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 7c0-1.5 1-2 1-3.5M12 7c0-1.5 1-2 1-3.5M16 7c0-1.5 1-2 1-3.5"/>',
  noodles: '<path d="M3 12h18a9 9 0 0 1-18 0z"/><path d="M14 3l-4 9M19 4l-7 8"/><path d="M7 12c0-2 2-2 2-4"/>',
  pizza: '<path d="M12 3 3.5 19.5c5.5 2 11.5 2 17 0z"/><path d="M5.6 15.5c4.2 1.4 8.6 1.4 12.8 0"/><circle cx="11" cy="11" r="1.1"/><circle cx="14" cy="15" r="1.1"/><circle cx="9.5" cy="16" r="1"/>',
  burger: '<path d="M4 10a8 5 0 0 1 16 0z"/><path d="M3 13h18"/><path d="M4 16h16a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"/>',
  flame: '<path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z"/>',
  taco: '<path d="M3 17a9 9 0 0 1 18 0z"/><path d="M6 13c1-1 2-.5 3-1.5s2-.5 3-1.5 2-.5 3 .5 2 .5 3 1.5"/>',
  wrap: '<path d="M8 3h8l-2 18h-4z"/><path d="M8.5 7h7M9 11h6M9.5 15h5"/>',
  sushi: '<ellipse cx="12" cy="9" rx="8" ry="3.5"/><path d="M4 9v6c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5V9"/><ellipse cx="12" cy="9" rx="3.5" ry="1.5"/>',
  cup: '<path d="M5 8h12v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M9 3c0 1-.8 1.5-.8 2.5M12.5 3c0 1-.8 1.5-.8 2.5"/>',
  cake: '<path d="M4 20h16v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z"/><path d="M4 16c2 1.2 4 1.2 5.3 0s4-1.2 5.4 0 4 1.2 5.3 0"/><path d="M12 12V8"/><path d="M12 4.5c.8.8.8 2 0 2.5-.8-.5-.8-1.7 0-2.5z"/>',
  icecream: '<path d="M8 11 12 21l4-10"/><path d="M7 11a5 5 0 0 1 10 0z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  cloche: '<path d="M3 17h18"/><path d="M5 17a7 7 0 0 1 14 0"/><path d="M12 10V8"/><circle cx="12" cy="7" r="1"/><path d="M4 20h16"/>',
  platter: '<ellipse cx="12" cy="16" rx="9" ry="3"/><path d="M6 15a6 6 0 0 1 12 0"/><path d="M12 9V7M10 7h4"/>',
  plate: '<circle cx="12" cy="12" r="5.6"/><circle cx="12" cy="12" r="3"/><path d="M3 4v4.5a1.2 1.2 0 0 0 2.4 0V4M4.2 9v11"/><path d="M21 4c-1.6 0-2.4 2-2.4 5 0 1.6.9 2.6 2.4 2.6V20"/>',
  fork: '<path d="M8 3v5.5a4 4 0 0 0 8 0V3"/><path d="M12 3v18"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  pin: '<path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>'
};
function icon(n, s, sw) { return '<svg viewBox="0 0 24 24" width="' + (s || 22) + '" height="' + (s || 22) + '" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.6) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[n] || ICONS.bowl) + '</svg>'; }
function patternURI(op, color) {
  var g = ['pizza', 'cup', 'cake', 'bowl', 'taco', 'sushi', 'burger', 'icecream'], parts = '';
  g.forEach(function (n, i) { var x = (i % 4) * 58 + 10, y = Math.floor(i / 4) * 116 + (i % 2 ? 62 : 12); parts += '<g transform="translate(' + x + ' ' + y + ') rotate(' + ((i * 37) % 40 - 20) + ' 12 12)">' + ICONS[n] + '</g>'; });
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="232" height="232" viewBox="0 0 232 232" fill="none" stroke="' + (color || '#B5651D') + '" stroke-opacity="' + (op || 0.06) + '" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">' + parts + '</svg>';
  return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function fmtMsg(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>'); }
function clock(t) { var d = new Date(t), h = d.getHours(), m = d.getMinutes(); return (h % 12 || 12) + ':' + pad(m) + ' ' + (h >= 12 ? 'PM' : 'AM'); }
function lsGet(k) { try { return JSON.parse(root.localStorage.getItem(k)); } catch (e) { return null; } }
function lsSet(k, v) { try { root.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
function ssGet(k) { try { return JSON.parse(root.sessionStorage.getItem(k)); } catch (e) { return null; } }
function ssSet(k, v) { try { root.sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
function ssDel(k) { try { root.sessionStorage.removeItem(k); } catch (e) { } }

/* owner inbox (demo): confirmed bookings/orders are stored per niche in localStorage */
var Owner = {
  key: function (id) { return 'foodchat:owner:' + id; },
  list: function (id) { return lsGet(Owner.key(id)) || []; },
  add: function (id, rec) { var l = Owner.list(id); l.unshift(rec); lsSet(Owner.key(id), l.slice(0, 200)); },
  cancel: function (id, ref) { var l = Owner.list(id); l.forEach(function (r) { if (r.ref === ref) r.status = 'cancelled'; }); lsSet(Owner.key(id), l); },
  clear: function (id) { lsSet(Owner.key(id), []); }
};
function icsText(ics, ref) {
  var s = new Date(ics.start), e = new Date(ics.start + ics.mins * 60000);
  var f = function (d) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00'; };
  var x = function (t) { return String(t).replace(/([,;\\])/g, '\\$1'); };
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Skyline Web Co//Food Chatbot//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', 'UID:' + ref + '-' + ics.start + '@foodchat', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''), 'DTSTART:' + f(s), 'DTEND:' + f(e), 'SUMMARY:' + x(ics.title), 'LOCATION:' + x(ics.location), 'DESCRIPTION:' + x(ics.desc), 'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:' + x(ics.title), 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}

var CSS = [
  ':host{all:initial}',
  '*{box-sizing:border-box;margin:0;padding:0}',
  '.fc{--cream:#FFF8EE;--tomato:#E63946;--orange:#F4A261;--mustard:#E9C46A;--basil:#2A9D8F;--ink:#2B2B2B;--muted:#7A6E63;--line:#F0E2C4;font-family:"DM Sans",system-ui,-apple-system,"Segoe UI",sans-serif;font-weight:400;color:var(--ink);-webkit-font-smoothing:antialiased;line-height:1.45;font-size:15px}',
  'button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}',
  'strong,b{font-weight:700}',
  /* launcher */
  '.launch{position:fixed;right:22px;bottom:22px;width:62px;height:62px;border-radius:50%;background:linear-gradient(135deg,var(--tomato),var(--orange));color:#fff;display:grid;place-items:center;box-shadow:0 10px 28px rgba(230,57,70,.35);z-index:2;transition:transform .2s}',
  '.launch:hover{transform:scale(1.05)}',
  '.launch::before{content:"";position:absolute;inset:0;border-radius:50%;background:linear-gradient(135deg,var(--tomato),var(--orange));opacity:.5;animation:pulse 2.4s ease-out infinite;z-index:-1}',
  '@keyframes pulse{0%{transform:scale(1);opacity:.5}70%{transform:scale(1.55);opacity:0}100%{opacity:0}}',
  '.tip{position:fixed;right:96px;bottom:36px;background:#fff;border:1px solid var(--mustard);color:var(--ink);padding:9px 14px;border-radius:14px 14px 4px 14px;font-size:14px;white-space:nowrap;box-shadow:0 8px 24px rgba(43,43,43,.12);opacity:0;transform:translateY(6px);pointer-events:none;transition:.3s}',
  '.tip.show{opacity:1;transform:none}',
  '.fc.open .launch,.fc.open .tip{opacity:0;pointer-events:none;transform:scale(.8)}',
  /* panel */
  '.panel{position:fixed;right:22px;bottom:22px;width:400px;height:min(690px,calc(100vh - 44px));display:flex;flex-direction:column;border-radius:22px;overflow:hidden;background:var(--cream);border:1px solid var(--line);box-shadow:0 30px 70px rgba(43,43,43,.22);opacity:0;transform:translateY(16px) scale(.98);pointer-events:none;transition:opacity .25s,transform .25s;z-index:3}',
  '.fc.open .panel{opacity:1;transform:none;pointer-events:auto}',
  '.head{display:flex;align-items:center;gap:12px;padding:14px 10px 14px 16px;background:linear-gradient(120deg,var(--tomato),var(--orange));color:#fff}',
  '.av{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;color:var(--tomato);background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.12);flex:none}',
  '.ttl{flex:1;min-width:0}',
  '.nm{font-family:"Playfair Display",Georgia,serif;font-weight:600;font-size:17px;line-height:1.2;letter-spacing:.2px;color:#fff;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
  '.st{font-size:12.5px;color:rgba(255,255,255,.9);display:flex;align-items:center;gap:6px}',
  '.dot{width:7px;height:7px;border-radius:50%;background:#B8F5D8;box-shadow:0 0 6px #B8F5D8}',
  '.hb{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;color:#fff;transition:.2s}',
  '.hb:hover{background:rgba(255,255,255,.18)}',
  /* body */
  '.body{flex:1;overflow-y:auto;overflow-x:hidden;padding:18px 14px 8px;display:flex;flex-direction:column;gap:10px;background-color:var(--cream);background-image:var(--pat);scroll-behavior:smooth;overscroll-behavior:contain}',
  '.body::-webkit-scrollbar{width:6px}.body::-webkit-scrollbar-thumb{background:rgba(233,196,106,.6);border-radius:6px}',
  '.row{display:flex;flex-direction:column;max-width:100%;animation:in .35s ease both}',
  '@keyframes in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
  '.row.user{align-items:flex-end}',
  '.bub{max-width:86%;padding:10px 14px;border-radius:18px;font-size:15px;word-wrap:break-word;overflow-wrap:anywhere}',
  '.bot .bub{background:#fff;border:1px solid var(--mustard);color:var(--ink);border-bottom-left-radius:4px;box-shadow:0 3px 12px rgba(43,43,43,.06)}',
  '.user .bub{background:linear-gradient(135deg,var(--tomato),var(--orange));color:#fff;border-bottom-right-radius:4px;box-shadow:0 3px 12px rgba(230,57,70,.18)}',
  '.meta{font-size:11px;color:var(--muted);margin:4px 6px 0;display:flex;gap:4px;align-items:center}',
  '.seen{color:var(--basil);font-weight:700}',
  '.typing .bub{display:flex;gap:5px;align-items:center;padding:14px 16px}',
  '.typing i{width:7px;height:7px;border-radius:50%;background:var(--orange);opacity:.4;animation:blink 1.2s infinite}',
  '.typing i:nth-child(2){animation-delay:.2s}.typing i:nth-child(3){animation-delay:.4s}',
  '@keyframes blink{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}',
  /* chips */
  '.chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px;max-width:100%}',
  '.chip{min-height:36px;padding:7px 14px;border-radius:999px;border:1px solid var(--mustard);background:#fff;color:var(--ink);font-size:14px;transition:.2s}',
  '.chip:hover{border-color:var(--tomato);color:var(--tomato)}',
  /* cards */
  '.cards{display:flex;flex-direction:column;gap:8px;margin-top:8px;width:100%;max-width:100%}',
  '.card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:12px;width:100%;max-width:100%;overflow:hidden;box-shadow:0 3px 12px rgba(43,43,43,.05)}',
  '.ct{font-weight:700;font-size:14px;color:var(--ink);margin-bottom:8px;display:flex;justify-content:space-between;gap:8px}',
  '.mi{display:grid;grid-template-columns:1fr auto;gap:3px 10px;padding:10px 0;border-top:1px solid #F5EBD8}',
  '.mi:first-of-type{border-top:0;padding-top:2px}',
  '.mn{font-weight:700;font-size:14.5px;min-width:0}',
  '.mp{font-weight:700;color:var(--basil);font-size:14.5px;text-align:right}',
  '.md{grid-column:1/2;font-size:13px;color:var(--muted);min-width:0}',
  '.tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}',
  '.tag{font-size:10.5px;font-weight:700;padding:1px 7px;border-radius:999px;background:rgba(42,157,143,.1);color:var(--basil);letter-spacing:.2px}',
  '.tag.s{background:rgba(230,57,70,.1);color:var(--tomato)}.tag.alc{background:rgba(233,196,106,.25);color:#8A6A12}',
  '.add{align-self:end;justify-self:end;min-height:34px;min-width:64px;padding:5px 14px;border-radius:999px;background:var(--basil);color:#fff;font-weight:700;font-size:13.5px;transition:transform .15s}',
  '.add:active{transform:scale(.94)}',
  /* receipt-style cart */
  '.card.cart,.card.sum .rc{background:#FFFDF8;border-style:dashed;border-color:#E3D3AE}',
  '.cart .ct{justify-content:center;letter-spacing:2px;font-size:12px;text-transform:uppercase;color:var(--muted);border-bottom:1px dashed #E3D3AE;padding-bottom:6px}',
  '.cl{display:flex;align-items:center;gap:8px;padding:6px 0;font-size:14px}',
  '.cl .q{display:flex;align-items:center;gap:4px}',
  '.qb{width:28px;height:28px;border-radius:50%;border:1px solid var(--mustard);display:grid;place-items:center;font-size:15px;line-height:1;background:#fff}',
  '.cl .n{flex:1;min-width:0}.cl .note{display:block;font-size:12px;color:var(--tomato)}',
  '.cl .v{white-space:nowrap;font-variant-numeric:tabular-nums}',
  '.tot{margin-top:8px;padding-top:8px;border-top:1px dashed #E3D3AE;font-size:13.5px;color:var(--muted);font-variant-numeric:tabular-nums}',
  '.tot div{display:flex;justify-content:space-between;padding:1px 0}',
  '.tot .g{color:var(--ink);font-weight:700;font-size:15px;padding-top:4px}',
  '.tot .g span:last-child{color:var(--basil)}',
  '.rows{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:14px}',
  '.rows dt{color:var(--muted)}.rows dd{text-align:right;min-width:0;overflow-wrap:anywhere}',
  '.sec+.sec{margin-top:12px;padding-top:10px;border-top:1px solid #F5EBD8}',
  '.sh{font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:var(--tomato);margin-bottom:6px}',
  '.btns{display:flex;gap:8px;margin-top:12px}',
  '.btn{flex:1;min-height:42px;border-radius:12px;border:1px solid var(--mustard);font-weight:700;font-size:14.5px;display:flex;align-items:center;justify-content:center;gap:6px;color:var(--ink);background:#fff;text-decoration:none}',
  '.btn.pri{background:var(--basil);color:#fff;border:0}',
  '.btn[disabled]{opacity:.4;cursor:default}',
  '.ok .ct{color:var(--basil)}',
  '.ref{font-size:12px;color:var(--muted);font-weight:400}',
  /* input */
  '.quick{display:flex;gap:6px;padding:8px 12px 4px;overflow-x:auto;scrollbar-width:none;background:var(--cream)}',
  '.quick::-webkit-scrollbar{display:none}',
  '.quick .chip{flex:none;font-size:13.5px;min-height:34px;padding:5px 13px}',
  '.inp{display:flex;align-items:flex-end;gap:8px;padding:8px 12px 12px;background:var(--cream)}',
  'textarea{flex:1;resize:none;min-height:46px;max-height:120px;padding:12px 16px;border-radius:23px;border:1px solid var(--line);background:#fff;color:var(--ink);font:inherit;font-size:16px;outline:none;line-height:1.35}',
  'textarea::placeholder{color:#A39684}',
  'textarea:focus{border-color:var(--orange);box-shadow:0 0 0 3px rgba(244,162,97,.18)}',
  '.send{width:46px;height:46px;flex:none;border-radius:50%;background:var(--tomato);color:#fff;display:grid;place-items:center;box-shadow:0 6px 16px rgba(230,57,70,.3);transition:transform .15s}',
  '.send:active{transform:scale(.92)}',
  '.send.spin svg{animation:spin .55s cubic-bezier(.5,0,.3,1)}',
  '@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}',
  '.foot{text-align:center;font-size:11px;color:#A39684;padding:0 0 10px;background:var(--cream)}',
  /* mobile */
  '@media (max-width:559px){.panel{right:0;bottom:auto;top:0;left:0;width:100%;height:100%;border-radius:0;border:0}.launch{right:16px;bottom:16px}.tip{right:88px;bottom:28px}.chip,.quick .chip{min-height:44px}.add{min-height:44px;min-width:72px}.qb{width:44px;height:44px}.hb{width:44px;height:44px}.btn{min-height:48px}.bub{max-width:90%}}',
  '@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}'
].join('\n');

function Widget(o) {
  this.o = o;
  this.cfg = resolveConfig(o.base, o);
  this.key = 'foodchat:' + this.cfg.id + ':' + words(this.cfg.name).join('-');
  this.queue = []; this.log = []; this.timer = null; this.busy = false;
  this.DELAY = o.delay != null ? o.delay : 4000; this.TAP = o.tapDelay != null ? o.tapDelay : 1200;
  var saved = ssGet(this.key);
  this.brain = new Brain(this.cfg, { otherNames: o.otherNames, state: saved && saved.state });
  if (saved) { this.log = saved.log || []; this.queue = saved.queue || []; }
}
var W = Widget.prototype;
W.mount = function () {
  var self = this, cfg = this.cfg, doc = document;
  if (!doc.getElementById('foodchat-font')) {
    var l = doc.createElement('link'); l.id = 'foodchat-font'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@600;700&display=swap';
    doc.head.appendChild(l);
  }
  if (!doc.querySelector('meta[name=viewport]')) { var mv = doc.createElement('meta'); mv.name = 'viewport'; mv.content = 'width=device-width, initial-scale=1'; doc.head.appendChild(mv); }
  var host = doc.createElement('div');
  host.setAttribute('data-foodchat', cfg.id);
  host.style.cssText = 'position:fixed;z-index:2147483000;inset:auto;';
  doc.body.appendChild(host);
  var sh = host.attachShadow({ mode: 'open' });
  var quick = cfg.quick || ['Menu', 'Order', 'Reserve', 'Hours', 'Location'];
  sh.innerHTML = '<style>' + CSS + '</style>' +
    '<div class="fc" part="root">' +
    '<button class="launch" aria-label="Chat with ' + esc(cfg.name) + '">' + icon(cfg.icon === 'plate' ? 'plate' : 'chat', 28, 1.8) + '</button>' +
    '<div class="tip" role="status">' + esc(cfg.tooltip || 'Hungry? Ask me anything 🍽️') + '</div>' +
    '<section class="panel" role="dialog" aria-label="' + esc(cfg.name) + ' assistant">' +
    '<header class="head"><div class="av">' + icon(cfg.icon, 24) + '</div><div class="ttl"><div class="nm"></div><div class="st"><span class="dot"></span><span>Online · AI assistant</span></div></div>' +
    '<button class="hb new" title="Start new chat" aria-label="Start new chat">' + icon('refresh', 20) + '</button>' +
    '<button class="hb x" title="Close" aria-label="Close chat">' + icon('close', 22, 2) + '</button></header>' +
    '<div class="body" aria-live="polite"></div>' +
    '<div class="quick">' + quick.map(function (q) { var t = typeof q === 'string' ? { label: q, text: q } : q; return '<button class="chip" data-t="' + esc(t.text) + '">' + esc(t.label) + '</button>'; }).join('') + '</div>' +
    '<form class="inp"><textarea rows="1" placeholder="Type a message…" aria-label="Message" enterkeyhint="send"></textarea><button class="send" type="submit" aria-label="Send">' + icon('fork', 22, 2) + '</button></form>' +
    '<div class="foot">AI assistant for ' + esc(cfg.name) + ' · by Skyline Web Co</div>' +
    '</section></div>';
  this.sh = sh; this.root = sh.querySelector('.fc'); this.panel = sh.querySelector('.panel'); this.body = sh.querySelector('.body');
  this.ta = sh.querySelector('textarea'); this.sendBtn = sh.querySelector('.send'); this.tip = sh.querySelector('.tip');
  sh.querySelector('.nm').textContent = cfg.name;
  this.body.style.setProperty('--pat', patternURI(0.08));
  sh.querySelector('.launch').addEventListener('click', function () { self.open(); });
  sh.querySelector('.x').addEventListener('click', function () { self.close(); });
  sh.querySelector('.new').addEventListener('click', function () { self.reset(); });
  sh.querySelector('.launch').addEventListener('mouseenter', function () { self.tip.classList.add('show'); });
  sh.querySelector('.launch').addEventListener('mouseleave', function () { self.tip.classList.remove('show'); });
  sh.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); self.submit(); });
  this.ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); self.submit(); } });
  this.ta.addEventListener('input', function () { self.grow(); if (self.queue.length && !self.busy) self.arm(self.DELAY); });
  sh.querySelector('.quick').addEventListener('click', function (e) { var b = e.target.closest('[data-t]'); if (b) self.sendText(b.getAttribute('data-t'), true); });
  this.body.addEventListener('click', function (e) { self.onBodyClick(e); });
  // mobile: keep the input above the keyboard
  var vv = root.visualViewport, fit = function () { self.fit(); };
  if (vv) { vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit); }
  root.addEventListener('resize', fit);
  if (!this.log.length) this.pushBot({ text: this.brain.welcome(), cards: [], chips: [] }, true);
  this.renderAll();
  if (this.queue.length) this.arm(this.DELAY);
  if (this.o.open || (ssGet(this.key + ':open'))) this.open(true);
  else setTimeout(function () { if (!self.isOpen) { self.tip.classList.add('show'); setTimeout(function () { self.tip.classList.remove('show'); }, 6000); } }, 1500);
  return this;
};
W.isMobile = function () { return root.matchMedia && root.matchMedia('(max-width: 559px)').matches; };
W.fit = function () {
  var p = this.panel;
  if (!this.isOpen || !this.isMobile()) { p.style.height = ''; p.style.top = ''; return; }
  var vv = root.visualViewport;
  if (vv) { p.style.height = vv.height + 'px'; p.style.top = vv.offsetTop + 'px'; }
  this.scroll();
};
W.open = function (silent) {
  this.isOpen = true; this.root.classList.add('open'); this.tip.classList.remove('show');
  ssSet(this.key + ':open', true);
  if (this.isMobile()) { this._ov = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden'; }
  this.fit(); this.scroll();
  var ta = this.ta;
  if (!this.isMobile() && !silent) setTimeout(function () { ta.focus(); }, 250);
};
W.close = function () {
  this.isOpen = false; this.root.classList.remove('open'); ssSet(this.key + ':open', false);
  document.documentElement.style.overflow = this._ov || '';
  this.fit();
};
W.grow = function () { var t = this.ta; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px'; };
W.save = function () { ssSet(this.key, { state: this.brain.state, log: this.log.slice(-150), queue: this.queue }); };
W.reset = function () {
  clearTimeout(this.timer); this.queue = []; this.log = []; this.busy = false;
  this.brain = new Brain(this.cfg, { otherNames: this.o.otherNames });
  ssDel(this.key);
  this.pushBot({ text: this.brain.welcome(), cards: [], chips: [] }, true);
  this.renderAll();
};
W.submit = function () {
  var v = this.ta.value.trim();
  if (!v) return;
  this.ta.value = ''; this.grow();
  this.sendText(v, false);
  var b = this.sendBtn; b.classList.remove('spin'); void b.offsetWidth; b.classList.add('spin');
};
W.sendText = function (text, tap) {
  this.log.push({ who: 'user', text: text, t: Date.now(), st: 'sent' });
  this.queue.push({ text: text });
  this.renderAll(); this.save();
  this.arm(tap ? this.TAP : this.DELAY);
};
W.sendAction = function (action, label) {
  this.log.push({ who: 'user', text: label, t: Date.now(), st: 'sent' });
  this.queue.push({ action: action });
  this.renderAll(); this.save();
  this.arm(this.TAP);
};
W.arm = function (ms) { var self = this; clearTimeout(this.timer); this.timer = setTimeout(function () { self.flush(); }, ms); };
W.flush = function () {
  var self = this;
  if (this.busy) { this.arm(600); return; }
  if (!this.queue.length) return;
  var batch = this.queue.splice(0);
  this.log.forEach(function (e) { if (e.who === 'user') e.st = 'seen'; });
  this.busy = true; this.renderAll();
  var res;
  try { res = this.brain.handle(batch, new Date()); }
  catch (err) { if (root.console) console.error('[FoodChatbot]', err); res = { bubbles: [{ text: this.brain.fill("Sorry, something went wrong on my side. Could you try that again? You can also call us at {phone}."), cards: [], chips: [] }], events: [] }; }
  if (!res.bubbles.length) { this.busy = false; this.renderAll(); this.save(); return; }
  var len = res.bubbles.reduce(function (s, b) { return s + (b.text || '').length; }, 0);
  this.typing(true);
  setTimeout(function () {
    self.typing(false);
    res.bubbles.forEach(function (b) { self.pushBot(b); });
    res.events.forEach(function (ev) { self.emit(ev); });
    self.busy = false; self.renderAll(); self.save();
    if (self.queue.length) self.arm(self.DELAY);
  }, Math.max(700, Math.min(1900, 450 + len * 7)));
};
W.pushBot = function (b, silent) { this.log.push({ who: 'bot', text: b.text || '', cards: b.cards || [], chips: b.chips || [], t: Date.now() }); };
W.emit = function (ev) {
  var id = this.cfg.id;
  if (ev.cancel) Owner.cancel(id, ev.ref); else Owner.add(id, ev);
  try { root.dispatchEvent(new CustomEvent('foodchat:record', { detail: ev })); } catch (e) { }
  if (this.o.webhook) { try { fetch(this.o.webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ev) }); } catch (e) { } }
  if (typeof this.o.onRecord === 'function') this.o.onRecord(ev);
};
W.typing = function (on) {
  var t = this.body.querySelector('.typing');
  if (on && !t) { t = document.createElement('div'); t.className = 'row bot typing'; t.innerHTML = '<div class="bub"><i></i><i></i><i></i></div>'; this.body.appendChild(t); this.scroll(); }
  if (!on && t) t.remove();
};
W.scroll = function () { var b = this.body; requestAnimationFrame(function () { b.scrollTop = b.scrollHeight; }); };
function A(action) { return esc(JSON.stringify(action)); }
W.renderCard = function (c, live) {
  var h = '';
  if (c.type === 'menu') {
    h += '<div class="card menu">' + (c.title ? '<div class="ct">' + esc(c.title) + '</div>' : '');
    c.items.forEach(function (i) {
      var tags = (i.tags || []).filter(function (t) { return TAG_LABEL[t] && t !== 'k'; }).map(function (t) { return '<span class="tag ' + t + '">' + (t === 's' ? '🌶 ' : t === 's2' ? '🌶🌶 ' : '') + TAG_LABEL[t] + '</span>'; }).join('');
      h += '<div class="mi"><div class="mn">' + esc(i.name) + (tags ? '<div class="tags">' + tags + '</div>' : '') + '</div><div class="mp">' + money(i.price) + '</div><div class="md">' + esc(i.desc) + '</div><button class="add" data-a="' + A({ type: 'add', id: i.id, qty: 1 }) + '" data-l="' + esc('Add ' + i.name) + '">Add</button></div>';
    });
    return h + '</div>';
  }
  var totals = function (x) { return '<div class="tot"><div><span>Subtotal</span><span>' + money(x.subtotal) + '</span></div><div><span>Tax</span><span>' + money(x.tax) + '</span></div>' + (x.fee ? '<div><span>Delivery fee</span><span>' + money(x.fee) + '</span></div>' : '') + '<div class="g"><span>Total</span><span>' + money(x.total) + '</span></div></div>'; };
  var lines = function (ls, btns) { return ls.map(function (l) { return '<div class="cl">' + (btns ? '<span class="q"><button class="qb" aria-label="One less" data-a="' + A({ type: 'remove', id: l.id, qty: 1 }) + '" data-l="' + esc('−1 ' + l.name) + '">−</button><span>' + l.qty + '</span><button class="qb" aria-label="One more" data-a="' + A({ type: 'add', id: l.id, qty: 1 }) + '" data-l="' + esc('+1 ' + l.name) + '">+</button></span>' : '<span>' + l.qty + '×</span>') + '<span class="n">' + esc(l.name) + (l.note ? '<span class="note">' + esc(l.note) + '</span>' : '') + '</span><span class="v">' + money(l.total) + '</span></div>'; }).join(''); };
  if (c.type === 'cart') return '<div class="card cart"><div class="ct"><span>' + esc(c.title) + '</span></div>' + lines(c.lines, live) + totals(c) + '</div>';
  var rows = function (rs) { return '<dl class="rows">' + rs.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl>'; };
  if (c.type === 'summary') {
    h = '<div class="card sum"><div class="ct">' + esc(c.title) + '</div>';
    c.sections.forEach(function (s) { h += '<div class="sec"><div class="sh">' + esc(s.title) + '</div>' + (s.lines ? lines(s.lines, false) + totals(s) + '<div style="height:8px"></div>' : '') + rows(s.rows) + '</div>'; });
    h += '<div class="sec"><div class="sh">Contact</div>' + rows(c.contact) + '</div>';
    h += '<div class="btns">' + c.buttons.map(function (b) { return '<button class="btn' + (b.primary ? ' pri' : '') + '"' + (live ? '' : ' disabled') + ' data-a="' + A(b.action) + '" data-l="' + esc(b.label) + '">' + esc(b.label) + '</button>'; }).join('') + '</div>';
    return h + '</div>';
  }
  if (c.type === 'confirmed') {
    h = '<div class="card ok">';
    c.records.forEach(function (r, i) {
      h += '<div class="sec"><div class="ct"><span>✓ ' + esc(r.title) + '</span><span class="ref">#' + esc(r.ref) + '</span></div>' + (r.lines ? lines(r.lines, false) + '<div class="tot"><div class="g"><span>Total</span><span>' + money(r.total) + '</span></div></div><div style="height:8px"></div>' : '') + rows(r.rows);
      if (r.ics) h += '<div class="btns"><button class="btn" data-ics="' + A({ ics: r.ics, ref: r.ref }) + '">' + icon('cal', 18) + ' Add to Calendar</button></div>';
      h += '</div>';
    });
    return h + '</div>';
  }
  if (c.type === 'info') return '<div class="card"><div class="ct">' + esc(c.title) + '</div>' + rows(c.rows) + '</div>';
  if (c.type === 'link') return '<a class="btn" style="margin-top:2px" href="' + esc(c.url) + '" target="_blank" rel="noopener">' + icon('pin', 18) + ' ' + esc(c.label) + '</a>';
  return '';
};
W.renderAll = function () {
  var self = this, h = '', lastBot = -1, lastCart = -1, lastSum = -1;
  this.log.forEach(function (e, i) { if (e.who === 'bot') { lastBot = i; (e.cards || []).forEach(function (c) { if (c.type === 'cart') lastCart = i; if (c.type === 'summary') lastSum = i; }); } });
  var lastUser = -1; this.log.forEach(function (e, i) { if (e.who === 'user') lastUser = i; });
  this.log.forEach(function (e, i) {
    if (e.who === 'user') {
      h += '<div class="row user"><div class="bub">' + fmtMsg(e.text) + '</div><div class="meta">' + clock(e.t) + (i === lastUser ? (e.st === 'seen' ? ' · <span class="seen">✓✓ Seen</span>' : ' · ✓') : '') + '</div></div>';
      return;
    }
    h += '<div class="row bot">' + (e.text ? '<div class="bub">' + fmtMsg(e.text) + '</div>' : '');
    if (e.cards && e.cards.length) h += '<div class="cards">' + e.cards.map(function (c) { return self.renderCard(c, (c.type === 'cart' && i === lastCart) || (c.type === 'summary' && i === lastSum && self.brain.state.review)); }).join('') + '</div>';
    if (i === lastBot && e.chips && e.chips.length && !self.busy) h += '<div class="chips">' + e.chips.map(function (c) { return '<button class="chip" ' + (c.action ? 'data-a="' + A(c.action) + '"' : 'data-t="' + esc(c.text) + '"') + ' data-l="' + esc(c.label) + '">' + esc(c.label) + '</button>'; }).join('') + '</div>';
    h += '<div class="meta">' + clock(e.t) + '</div></div>';
  });
  this.body.innerHTML = h;
  if (this.busy) this.typing(true);
  this.scroll();
};
W.onBodyClick = function (e) {
  var b = e.target.closest('button');
  if (!b || b.disabled) return;
  var ics = b.getAttribute('data-ics');
  if (ics) {
    var x = JSON.parse(ics), blob = new Blob([icsText(x.ics, x.ref)], { type: 'text/calendar' }), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = words(this.cfg.name).join('-') + '-' + x.ref + '.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    return;
  }
  var act = b.getAttribute('data-a'), t = b.getAttribute('data-t'), l = b.getAttribute('data-l');
  if (act) this.sendAction(JSON.parse(act), l || b.textContent);
  else if (t) this.sendText(t, true);
};

/* ═══════════════════════ 7. PUBLIC API ═══════════════════════ */
function mount(o) {
  var N = root.FOOD_NICHES || {};
  var base = N[o.niche];
  if (!base) { if (root.console) console.warn('[FoodChatbot] unknown niche:', o.niche); return null; }
  var others = Object.keys(N).filter(function (k) { return k !== o.niche; }).map(function (k) { return N[k].name; });
  var w = new Widget({ base: base, name: o.name, city: o.city, phone: o.phone, email: o.email, open: o.open, webhook: o.webhook, onRecord: o.onRecord, otherNames: others, delay: o.delay, tapDelay: o.tapDelay });
  var go = function () { w.mount(); };
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
  return w;
}
function autoInit() {
  var s = CURRENT_SCRIPT;
  if (!s || !s.getAttribute || !s.getAttribute('data-niche')) return;
  var src = s.src || '', dir = src.replace(/[^\/]*(\?.*)?$/, '');
  var start = function () {
    mount({ niche: s.getAttribute('data-niche'), name: s.getAttribute('data-name'), city: s.getAttribute('data-city'), phone: s.getAttribute('data-phone'), email: s.getAttribute('data-email'), open: s.getAttribute('data-open') === 'true', webhook: s.getAttribute('data-webhook') });
  };
  if (root.FOOD_NICHES) start();
  else { var t = document.createElement('script'); t.src = dir + 'niches.js'; t.onload = start; t.onerror = function () { console.warn('[FoodChatbot] could not load niches.js from ' + dir); }; document.head.appendChild(t); }
}

return { Brain: Brain, resolveConfig: resolveConfig, mount: mount, Widget: Widget, Owner: Owner, icon: icon, patternURI: patternURI, icsText: icsText, _autoInit: autoInit, version: '1.0.0' };
});
