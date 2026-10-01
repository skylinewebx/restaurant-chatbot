/*!
 * niches.js — one config per food & restaurant niche (all businesses are fictional).
 *
 * Menu item format: [name, price, tags, allergens, description, aliases]
 *   tags:      v vegetarian · vg vegan · h halal · s spicy · gf gluten-free · pop popular · k kids
 *   allergens: G gluten · D dairy · E egg · N tree nuts · P peanuts · S soy · SE sesame · F fish · SH shellfish
 *   aliases:   "|"-separated words guests might type ("coke|cola|soda")
 * Hours: "HH:MM-HH:MM" (closing after midnight is fine: "12:00-01:00"), comma-separate split shifts, "" = closed.
 * Text may use {name} {city} {phone} {email} {address} — they are replaced with URL/embed overrides.
 * faqs: ["keyword alternatives separated by |", "answer"]; every word of an alternative must appear.
 */
(function (root) {
var N = {};

/* ═════════ DEMO — one fictional dining venue with a section for every cuisine ═════════
 * This is the default chat (index.html with no ?niche=). Each menu category is a cuisine
 * section; `sections` maps words a guest might type to that section. */
N.demo = {
  id: 'demo', name: 'Demo Chatbot for Restaurants', cuisine: 'Multi-cuisine dining venue', icon: 'plate',
  tagline: 'One venue, every cuisine — from biryani to sushi to steak.',
  street: '240 Ward St, 35th Street', city: 'New York', state: 'NY', zip: '10001', phone: '(212) 555-0188', email: 'hello@demorestaurant.example',
  welcome: 'Hi! 👋 Welcome to the Demo Chatbot for Restaurants. How may I help you today?',
  greetWelcome: true,
  hoursText: '🕐 Mon–Sat: 11 AM – 11 PM · Sun: Closed',
  scopeLine: "Sorry, I can't help with that. Feel free to ask me anything about our restaurant! 😊",
  tooltip: 'Questions? Ask me anything 🍽️',
  quick: ['Menu', 'Order', 'Reserve a Table', 'Hours', 'Location'],
  hours: { mon: '11:00-23:00', tue: '11:00-23:00', wed: '11:00-23:00', thu: '11:00-23:00', fri: '11:00-23:00', sat: '11:00-23:00', sun: '' },
  hoursRule: true,
  hoursLine: "We're open Mon–Sat, 11 AM–11 PM.",
  hoursNote: 'The kitchen is open Monday to Saturday, 11 AM–11 PM, and the bar stays open until midnight on Fridays and Saturdays. We\'re closed on Sundays.',
  barHours: 'The bar is open with the kitchen, Monday to Saturday from 11 AM, and stays open until midnight on Fridays and Saturdays.',
  tax: 0.08875,
  reservations: { max: 12, last: 30, text: 'We take reservations for 1–12 guests, and groups of 13 or more are booked as private events. Walk-ins are welcome when we have space.' },
  seating: { options: ['indoor', 'outdoor', 'bar', 'private'], outdoorLabel: 'Outdoor terrace', text: 'We seat 180 across the main dining room, an outdoor terrace (40 seats, heated, open March–November), the bar (24 seats) and a private dining room for up to 20.', outdoorNote: 'The terrace is heated, so it stays comfortable on cooler evenings.' },
  delivery: { zones: [{ zips: ['10001', '10018', '10011', '10036'], fee: 2.99, min: 20 }, { zips: ['10019', '10016', '10010', '10014', '10003'], fee: 4.99, min: 30 }], time: '30–45 minutes', mins: 40, pickup: '20–25 minutes', prep: 25, note: 'Alcohol is not delivered — bar drinks are for dine-in only.' },
  parking: 'There\'s a discounted garage next door at 250 W 35th St ($15 for 3 hours with validation) and metered street parking after 7 PM.',
  directions: 'Between 7th and 8th Ave — 34 St–Penn Station (1, 2, 3, A, C, E) is a 3-minute walk.',
  payments: 'We accept Visa, Mastercard, Amex, Discover, Apple Pay, Google Pay and cash. We can split the bill up to 6 ways.',
  kids: 'Families are very welcome! We have high chairs, booster seats, crayons and a kids menu, and most kitchens can make dishes mild.',
  privateEvents: 'Our private dining room seats up to 20, and we host larger parties (up to 120) on the terrace or with a partial buyout. Set menus start at $45 per guest.',
  events: { max: 120, lead: 1 },
  noteOffer: false,
  allHalal: false,
  halal: 'All chicken, lamb and beef in our Desi, Indian and Middle Eastern sections is zabiha halal, and our halal dishes are tagged on the menu. Other sections (like BBQ, Chinese and Italian) use pork and non-halal meat, so look for the Halal tag.',
  veg: 'Every section has vegetarian dishes, and plenty are vegan — look for the Vegan tag. Ask our staff and the kitchen can adapt many dishes.',
  glutenFree: 'Many dishes are naturally gluten-free and tagged GF, and we have gluten-free pizza and pasta.',
  spice: 'Spicy dishes are tagged on the menu, and most kitchens can make dishes mild, medium or extra spicy on request.',
  allergens: 'wheat, dairy, egg, tree nuts, peanuts, soy, sesame, fish and shellfish',
  best: 'Our best sellers are the Chicken Biryani, the Margherita Pizza, the Spicy Tuna Roll and the 12 oz Ribeye — and the Classic Smash Burger is a crowd favorite.',
  signature: ['Chicken Biryani', 'Margherita Pizza', 'Spicy Tuna Roll', 'Ribeye (12 oz)', 'Classic Smash Burger'],
  catering: { min: 20, max: 500, lead: 4, text: 'Yes! Our events team caters weddings, office lunches and parties for 20–500 guests with any mix of cuisines, from about $20–$75 per guest.', closing: 'Our events team will send you a quote.', interestsQ: 'Which cuisines would you like on the menu? (e.g. "Desi and Italian", or "chef\'s choice")' },
  noCakes: "We don't bake custom celebration cakes, but you're welcome to bring your own — there's a $2 per guest plating fee.",
  sections: {
    'Desi': 'desi|pakistani|pakistan|lahori|karahi|nihari|desi food',
    'Indian': 'indian|india|north indian|south indian|dosa|indian food',
    'Chinese': 'chinese|china|cantonese|sichuan|szechuan|dim sum|chinese food',
    'Thai': 'thai|thailand|thai food',
    'Japanese & Sushi': 'japanese|japan|sushi|ramen|sashimi|japanese food',
    'Italian': 'italian|italy|pizza|pasta|pizzeria|italian food',
    'French': 'french|france|bistro|french food',
    'American & English': 'american|english|british|comfort food|american food|english food',
    'Steakhouse': 'steakhouse|steak|steaks',
    'BBQ & Grill': 'bbq|barbecue|grill|grilled|smoked|smokehouse',
    'Burgers & Fast Food': 'burgers|fast food|burger joint',
    'Mexican': 'mexican|mexico|tex mex|mexican food',
    'Middle Eastern': 'middle eastern|lebanese|arabic|arab|turkish|mediterranean|middle east',
    'Seafood': 'seafood|sea food|shellfish|fish dishes',
    'Cafe & Coffee': 'cafe|coffee|breakfast|brunch|coffee shop',
    'Bakery & Desserts': 'bakery|dessert|desserts|sweets|pastries|pastry|sweet',
    'Bar': 'bar|cocktail|cocktails|alcohol|alcoholic|happy hour|mocktail|mocktails|spirits|liquor|bar menu|drinks menu',
    'Drinks': 'soft drinks|soft drink|juices|beverages|non alcoholic',
    'Kids': 'kids menu|children menu|kid menu'
  },
  menu: [
    { cat: 'Desi', items: [
      ['Chicken Biryani', 16.99, 'h s pop gf', 'D', 'Fragrant basmati layered with spiced chicken, saffron, mint and fried onions, with raita.', 'biryani|biriyani|briyani'],
      ['Mutton Biryani', 21.99, 'h s gf', 'D', 'Our biryani with slow-cooked goat on the bone.', 'mutton biryani|goat biryani'],
      ['Chicken Karahi (serves 2)', 26.99, 'h s pop gf', 'D', 'Bone-in chicken wok-cooked with tomatoes, ginger and green chilies.', 'karahi|kadai'],
      ['Beef Nihari', 19.99, 'h s', 'G', 'Beef shank slow-cooked overnight, finished with ginger, lemon and chilies. Comes with naan.', 'nihari'],
      ['Seekh Kebab (4 pc)', 14.99, 'h s gf', '', 'Minced beef kebabs with herbs and green chili, char-grilled.', 'seekh|seekh kebab|kebab|kabab|kebabs'],
      ['Chicken Tikka', 15.49, 'h s gf', 'D', 'Yogurt-marinated chicken leg from the tandoor.', 'chicken tikka|tikka'],
      ['Haleem', 15.99, 'h', 'G', 'Slow-cooked wheat, lentils and shredded beef, topped with fried onions and lemon.', 'haleem'],
      ['Daal Makhni', 13.99, 'v gf', 'D', 'Black lentils simmered overnight with butter and cream.', 'daal|dal|lentils'],
      ['Vegetable Samosa (2 pc)', 6.49, 'v', 'G', 'Crisp pastry with spiced potatoes and peas, tamarind chutney.', 'samosa|samosas'],
      ['Butter Naan', 2.99, 'v', 'G D', 'Soft tandoor-baked naan brushed with butter.', 'naan|nan|naans'],
      ['Mango Lassi', 5.49, 'v gf', 'D', 'Chilled yogurt shake with Alphonso mango.', 'lassi|lassis'],
      ['Gulab Jamun (2 pc)', 5.49, 'v', 'D G', 'Warm milk dumplings in rose-cardamom syrup.', 'gulab jamun|jamun']
    ] },
    { cat: 'Indian', items: [
      ['Butter Chicken', 19.49, 'h pop gf', 'D N', 'Tandoori chicken in a silky tomato, butter and fenugreek sauce — mild.', 'butter chicken|murgh makhani'],
      ['Chicken Tikka Masala', 19.49, 'h s gf', 'D', 'Char-grilled chicken in a creamy, spiced tomato-onion masala.', 'tikka masala|ctm'],
      ['Lamb Rogan Josh', 23.99, 'h s gf', 'D', 'Kashmiri slow-braised lamb with red chili, fennel and ginger.', 'rogan josh|lamb curry'],
      ['Chana Masala', 15.49, 'vg gf', '', 'Chickpeas in a tangy onion-tomato gravy.', 'chana|chole|chickpea curry'],
      ['Paneer Tikka Masala', 17.49, 'v gf', 'D N', 'Grilled cottage cheese in a rich tomato-cashew gravy.', 'paneer|paneer masala'],
      ['Vegetable Korma', 16.49, 'v gf', 'D N', 'Seasonal vegetables in a mild, creamy cashew sauce.', 'korma|veg korma'],
      ['Masala Dosa', 14.49, 'vg gf', '', 'Crisp rice-lentil crepe with spiced potato, sambar and coconut chutney.', 'dosa|masala dosa'],
      ['Idli Sambar (3 pc)', 10.49, 'vg gf', '', 'Steamed rice cakes with lentil sambar and chutneys.', 'idli|sambar'],
      ['Tandoori Chicken (half)', 18.99, 'h s gf', 'D', 'Half chicken marinated in yogurt and Kashmiri chili.', 'tandoori chicken|tandoori'],
      ['Samosa Chaat', 8.49, 'v s', 'G D', 'Crushed samosa with chickpeas, yogurt, tamarind and mint chutney.', 'chaat|samosa chaat'],
      ['Garlic Naan', 3.99, 'v', 'G D', 'Naan topped with garlic and cilantro.', 'garlic naan'],
      ['Masala Chai', 3.99, 'v gf', 'D', 'Spiced black tea with milk.', 'chai|masala tea'],
      ['Rasmalai', 7.49, 'v gf', 'D N', 'Soft cheese dumplings in saffron-cardamom milk with pistachios.', 'rasmalai|ras malai']
    ] },
    { cat: 'Chinese', items: [
      ['Pork & Chive Dumplings (8 pc)', 9.99, 'pop', 'G S SE', 'Hand-folded dumplings, pan-fried or steamed, with black vinegar.', 'dumplings|dumpling|pork dumplings|potstickers'],
      ['Vegetable Spring Rolls (3 pc)', 6.49, 'vg', 'G S', 'Crispy rolls with cabbage, carrot and mushroom.', 'spring roll|spring rolls|egg roll'],
      ['Hot & Sour Soup', 5.99, 's', 'G S E', 'Tofu, bamboo shoots, mushrooms and egg in a peppery broth.', 'hot and sour|hot and sour soup'],
      ["General Tso's Chicken", 17.49, 's pop', 'G S E', 'Crispy chicken in a sweet, tangy chili glaze.', 'general tso|general tsos'],
      ['Kung Pao Chicken', 16.99, 's', 'P S G', 'Wok-fried chicken with peanuts, dried chilies and Sichuan pepper.', 'kung pao'],
      ['Mapo Tofu', 14.99, 's', 'S', 'Silken tofu in fiery chili-bean sauce with minced pork (vegetarian on request).', 'mapo|mapo tofu|tofu'],
      ['Beef with Broccoli', 18.49, '', 'S G SH', 'Tender flank steak and broccoli in oyster sauce.', 'beef broccoli|beef and broccoli'],
      ['Sweet & Sour Chicken', 16.49, '', 'G S E', 'Crispy chicken with pineapple and peppers.', 'sweet and sour|sweet sour chicken'],
      ['Shrimp Lo Mein', 16.99, '', 'G S SH E', 'Soft egg noodles tossed with shrimp and vegetables.', 'lo mein'],
      ['Vegetable Fried Rice', 12.99, 'v', 'E S', 'Wok-fried rice with egg, peas, carrots and scallions.', 'fried rice|egg fried rice'],
      ['Peking Duck (half)', 36.99, 'pop', 'G S SE', 'Crispy roast duck with pancakes, scallions, cucumber and hoisin.', 'peking duck|duck|roast duck'],
      ['Sesame Balls (4 pc)', 5.99, 'vg', 'G SE', 'Glutinous rice balls with red bean, rolled in sesame.', 'sesame balls']
    ] },
    { cat: 'Thai', items: [
      ['Pad Thai', 16.99, 'pop', 'P E F S', 'Rice noodles wok-tossed with chicken, egg, tamarind, bean sprouts and crushed peanuts (tofu or shrimp on request).', 'pad thai|padthai'],
      ['Green Curry', 17.49, 's s2 gf', 'F', 'Chicken in spicy green coconut curry with Thai basil and bamboo shoots.', 'green curry'],
      ['Red Curry', 17.49, 's gf', 'F', 'Chicken in red coconut curry with eggplant and kaffir lime.', 'red curry'],
      ['Massaman Curry', 18.49, 'gf', 'P F', 'Mild, rich beef curry with potatoes and peanuts.', 'massaman'],
      ['Tom Yum Soup', 9.49, 's s2 gf', 'SH F', 'Hot-and-sour lemongrass soup with shrimp and mushrooms.', 'tom yum|tom yum soup'],
      ['Tom Kha Gai', 9.49, 'gf', 'F', 'Coconut-galangal soup with chicken.', 'tom kha|coconut soup'],
      ['Som Tum (Papaya Salad)', 11.49, 's s2 gf', 'P F SH', 'Shredded green papaya, chilies, lime, dried shrimp and peanuts.', 'som tum|papaya salad'],
      ['Chicken Satay (4)', 10.99, 'gf', 'P', 'Grilled chicken skewers with peanut sauce and cucumber relish.', 'satay'],
      ['Drunken Noodles', 16.99, 's', 'G S F E', 'Wide rice noodles with chicken, chilies and holy basil (no alcohol!).', 'drunken noodles|pad kee mao'],
      ['Thai Basil Chicken', 16.49, 's', 'S F', 'Minced chicken stir-fried with chilies and holy basil, with jasmine rice and a fried egg.', 'basil chicken|pad kra pao|kra pao'],
      ['Fresh Summer Rolls (2)', 8.49, 'vg gf', 'P', 'Rice paper rolls with tofu, herbs and vermicelli, peanut dip.', 'summer rolls|fresh rolls'],
      ['Mango Sticky Rice', 8.99, 'vg gf', '', 'Sweet coconut sticky rice with ripe mango.', 'sticky rice|mango sticky rice'],
      ['Thai Iced Tea', 4.99, 'v gf', 'D', 'Sweet spiced black tea with condensed milk.', 'thai tea|thai iced tea']
    ] },
    { cat: 'Japanese & Sushi', items: [
      ['Spicy Tuna Roll', 12.00, 's pop', 'F E S', 'Tuna, spicy mayo, cucumber and crunchy tempura flakes.', 'spicy tuna'],
      ['California Roll', 10.00, '', 'SH E S', 'Crab, avocado and cucumber with tobiko.', 'california roll|california'],
      ['Dragon Roll', 17.00, 'pop', 'SH F S G E', 'Shrimp tempura topped with eel, avocado and eel sauce.', 'dragon roll|dragon'],
      ['Salmon Nigiri (2 pc)', 8.50, 'gf', 'F', 'Scottish salmon over seasoned rice.', 'salmon nigiri|nigiri'],
      ['Tuna Sashimi (5 pc)', 17.00, 'gf', 'F', 'Bluefin akami slices with wasabi and ginger.', 'sashimi|tuna sashimi'],
      ['Avocado Cucumber Roll', 8.50, 'vg gf', '', 'Avocado and cucumber — simple and fresh.', 'avocado roll|veggie roll|vegetable roll|cucumber roll'],
      ['Tonkotsu Ramen', 18.50, 'pop', 'G S E SE', 'Rich pork-bone broth, chashu, soft egg, scallions and nori.', 'tonkotsu'],
      ['Miso Mushroom Ramen', 17.00, 'vg', 'G S SE', 'Vegan miso broth with mushrooms, tofu, corn and greens.', 'veggie ramen|vegan ramen|miso ramen'],
      ['Chicken Katsu Curry', 18.00, '', 'G E S', 'Panko-crusted chicken cutlet with Japanese curry and rice.', 'katsu|katsu curry'],
      ['Chicken Teriyaki', 17.50, '', 'G S SE', 'Grilled chicken thigh with teriyaki glaze and rice.', 'teriyaki'],
      ['Pork Gyoza (6 pc)', 8.50, '', 'G S SE', 'Pan-fried Japanese dumplings with ponzu.', 'gyoza'],
      ['Edamame', 5.50, 'vg gf', 'S', 'Steamed soybeans with sea salt.', 'edamame'],
      ['Miso Soup', 4.00, 'v', 'S F', 'Dashi broth with tofu, wakame and scallion.', 'miso|miso soup'],
      ['Mochi Ice Cream (3 pc)', 7.00, 'v gf', 'D', 'Green tea, mango and strawberry.', 'mochi']
    ] },
    { cat: 'Italian', items: [
      ['Margherita Pizza', 17.00, 'v pop', 'G D', 'San Marzano tomato, fior di latte, basil and olive oil. 12" (6 slices).', 'margherita|margarita pizza|pizza|cheese pizza'],
      ['Pepperoni Pizza', 19.00, 'pop', 'G D', 'Tomato, mozzarella and crispy pepperoni. 12" (6 slices).', 'pepperoni|peperoni'],
      ['Quattro Formaggi Pizza', 20.00, 'v', 'G D', 'Mozzarella, gorgonzola, fontina and parmigiano. 12".', 'four cheese|quattro formaggi'],
      ['Veggie Garden Pizza', 19.00, 'v', 'G D', 'Peppers, mushrooms, olives, red onion and spinach. 12".', 'veggie pizza|vegetable pizza'],
      ['Gluten-Free Margherita (10")', 18.00, 'v gf', 'D', 'Our margherita on a 10" gluten-free crust.', 'gluten free pizza|gf pizza'],
      ['Spaghetti Carbonara', 19.00, '', 'G D E', 'Guanciale, egg yolk, pecorino and black pepper — no cream.', 'carbonara'],
      ['Penne alla Vodka', 18.00, 'v pop', 'G D', 'Creamy tomato-vodka sauce with parmigiano.', 'vodka pasta|penne|penne vodka'],
      ['Beef Lasagna', 21.00, '', 'G D E', 'Fresh pasta, beef ragù, béchamel and mozzarella.', 'lasagna|lasagne'],
      ['Fettuccine Alfredo', 17.00, 'v', 'G D E', 'Fresh fettuccine in butter-parmesan cream.', 'alfredo|fettuccine'],
      ['Mushroom Risotto', 21.00, 'v gf', 'D', 'Carnaroli rice with porcini and parmesan.', 'risotto'],
      ['Bruschetta', 9.00, 'vg', 'G', 'Grilled bread with tomato, garlic and basil.', 'bruschetta'],
      ['Garlic Knots (6)', 6.00, 'v', 'G D', 'Pizza-dough knots with garlic butter and parmesan.', 'garlic knots|knots|garlic bread'],
      ['Tiramisu', 9.00, 'v', 'G D E', 'Espresso-soaked ladyfingers with mascarpone.', 'tiramisu']
    ] },
    { cat: 'French', items: [
      ['French Onion Soup', 12.00, 'v', 'G D', 'Caramelized onion broth under a gruyère crouton.', 'onion soup'],
      ['Escargots (6)', 15.00, 'gf', 'D', 'Burgundy snails in garlic-parsley butter.', 'escargots|escargot|snails'],
      ['Steak Frites', 34.00, 'gf pop', 'D', 'Grilled hanger steak, herb butter and crispy fries.', 'steak frites'],
      ['Coq au Vin', 29.00, 'gf', 'D', 'Chicken braised in red wine with mushrooms and bacon.', 'coq au vin'],
      ['Moules Marinières', 26.00, 'gf', 'SH D', 'Mussels in white wine, garlic and cream, with fries.', 'moules|mussels'],
      ['Duck Confit', 31.00, 'gf', '', 'Crispy duck leg with garlic potatoes and frisée.', 'duck confit|confit'],
      ['Croque Monsieur', 16.00, '', 'G D', 'Ham and gruyère toastie with béchamel.', 'croque|croque monsieur'],
      ['Ratatouille', 19.00, 'vg gf', '', 'Provençal stew of eggplant, zucchini, peppers and tomato.', 'ratatouille'],
      ['Salade Niçoise', 18.00, 'gf', 'F E', 'Tuna, egg, olives, green beans and potatoes.', 'nicoise|salade nicoise'],
      ['Crème Brûlée', 10.00, 'v gf', 'D E', 'Vanilla custard with a crackling sugar top.', 'creme brulee|brulee'],
      ['Chocolate Mousse', 9.00, 'v gf', 'D E', 'Dark chocolate mousse with whipped cream.', 'mousse|chocolate mousse'],
      ['Crêpes Suzette', 11.00, 'v', 'G D E', 'Crêpes in orange-butter sauce (flambéed at the table for 21+ only — alcohol-free version available).', 'crepes|crepe|crepes suzette']
    ] },
    { cat: 'American & English', items: [
      ['Fish and Chips', 22.00, 'pop', 'F G E', 'Beer-battered cod, chunky chips, mushy peas and tartar sauce.', 'fish and chips|fish n chips|fish & chips'],
      ['Buttermilk Fried Chicken', 21.00, '', 'G D E', 'Crispy fried chicken with mashed potatoes and gravy.', 'fried chicken'],
      ['Mac and Cheese', 14.00, 'v pop', 'G D', 'Three-cheese baked macaroni with a crunchy top.', 'mac and cheese|mac n cheese|mac'],
      ["Shepherd's Pie", 20.00, '', 'D', 'Braised lamb under a golden mashed-potato crust.', 'shepherds pie|cottage pie'],
      ['Bangers and Mash', 19.00, '', 'G D', 'British pork sausages, mash and onion gravy.', 'bangers|bangers and mash|sausages'],
      ['Full English Breakfast', 18.00, '', 'G E', 'Eggs, bacon, sausage, beans, mushrooms, tomato and toast (served all day).', 'full english|english breakfast|fry up'],
      ['Cobb Salad', 17.00, 'gf', 'D E', 'Chicken, bacon, egg, avocado, blue cheese and tomato.', 'cobb|cobb salad'],
      ['New England Clam Chowder', 11.00, '', 'SH D G', 'Creamy clam and potato soup with oyster crackers.', 'clam chowder|chowder'],
      ['Chicken Pot Pie', 19.00, '', 'G D E', 'Chicken and vegetables in cream sauce under flaky pastry.', 'pot pie'],
      ['Club Sandwich', 16.00, '', 'G E', 'Turkey, bacon, lettuce and tomato triple-decker with fries.', 'club|club sandwich|sandwich'],
      ['Apple Pie à la Mode', 9.00, 'v', 'G D E', 'Warm apple pie with vanilla ice cream.', 'apple pie|pie'],
      ['Sticky Toffee Pudding', 10.00, 'v', 'G D E', 'Warm date sponge with toffee sauce and custard.', 'sticky toffee|toffee pudding']
    ] },
    { cat: 'Steakhouse', items: [
      ['Ribeye (12 oz)', 46.00, 'gf pop', 'D', 'USDA Prime ribeye, char-grilled, with herb butter.', 'ribeye|rib eye'],
      ['Filet Mignon (8 oz)', 52.00, 'gf', 'D', 'The most tender cut, with red wine jus.', 'filet|filet mignon|fillet|tenderloin'],
      ['New York Strip (14 oz)', 48.00, 'gf', 'D', 'Bold, beefy strip loin with peppercorn sauce.', 'strip|ny strip|new york strip|sirloin'],
      ['Porterhouse for Two (32 oz)', 98.00, 'gf', 'D', 'Dry-aged porterhouse, sliced tableside, with two sides.', 'porterhouse|steak for two'],
      ['Halal Ribeye (12 oz)', 48.00, 'h gf', '', 'Zabiha halal ribeye, grilled with garlic and rosemary.', 'halal steak|halal ribeye'],
      ['Surf & Turf', 64.00, 'gf', 'SH D', '8 oz filet with a butter-poached lobster tail.', 'surf and turf|surf n turf'],
      ['Wedge Salad', 13.00, 'gf', 'D E', 'Iceberg, blue cheese, bacon and tomato.', 'wedge|wedge salad'],
      ['Creamed Spinach', 9.00, 'v gf', 'D', 'Classic steakhouse side.', 'creamed spinach|spinach'],
      ['Truffle Mashed Potatoes', 10.00, 'v gf', 'D', 'Buttery mash with black truffle.', 'mashed potatoes|mash|truffle mash'],
      ['Grilled Asparagus', 10.00, 'vg gf', '', 'With lemon and sea salt.', 'asparagus']
    ] },
    { cat: 'BBQ & Grill', items: [
      ['Smoked Brisket (1/2 lb)', 18.99, 'gf pop', '', 'Prime brisket smoked 14 hours over oak and hickory.', 'brisket'],
      ['St. Louis Ribs (half rack)', 21.99, 'gf', '', 'Pork spare ribs with a sweet-pepper rub and BBQ glaze.', 'ribs|pork ribs|half rack'],
      ['Pulled Pork Sandwich', 14.99, '', 'G', 'Hand-pulled pork shoulder with slaw on a brioche bun.', 'pulled pork|pork sandwich'],
      ['Smoked Half Chicken', 17.99, 'gf', '', 'Brined and hickory-smoked half chicken.', 'smoked chicken|half chicken|bbq chicken'],
      ['Burnt Ends', 17.99, 'gf', '', 'Caramelized brisket point cubes in sweet BBQ glaze.', 'burnt ends'],
      ['Grilled Lamb Chops (4)', 32.99, 'h gf', 'D', 'Halal lamb chops with mint-yogurt sauce.', 'lamb chops|chops'],
      ['Smoked Jackfruit Sandwich', 13.99, 'vg', 'G', 'Pulled smoked jackfruit with BBQ sauce and slaw.', 'jackfruit'],
      ['Skillet Cornbread', 5.49, 'v', 'G D E', 'Honey-butter cornbread in cast iron.', 'cornbread|corn bread'],
      ['Collard Greens', 5.49, 'gf', '', 'Slow-cooked with smoked turkey.', 'collards|collard greens|greens'],
      ['BBQ Baked Beans', 5.49, 'gf', '', 'Smoky beans with brisket bits.', 'baked beans|beans']
    ] },
    { cat: 'Burgers & Fast Food', items: [
      ['Classic Smash Burger', 13.99, 'pop', 'G D E SE', 'Two smashed patties, American cheese, pickles and house sauce.', 'smash burger|burger|cheeseburger|classic burger'],
      ['Bacon Double Cheeseburger', 16.99, '', 'G D E SE', 'Two patties, double cheddar and crispy bacon.', 'bacon burger|bacon cheeseburger|double cheeseburger'],
      ['Halal Beef Burger', 15.99, 'h', 'G D E SE', 'Zabiha halal beef patty, cheddar, lettuce, tomato and onion.', 'halal burger'],
      ['Beyond Burger', 15.99, 'vg', 'G S SE', 'Plant-based patty, vegan cheese and vegan sauce.', 'beyond|vegan burger|veggie burger|plant burger'],
      ['Nashville Hot Chicken Sandwich', 14.99, 's s2', 'G D E', 'Crispy chicken thigh in Nashville hot oil, slaw and pickles.', 'nashville|hot chicken|spicy chicken sandwich'],
      ['Crispy Chicken Sandwich', 13.99, '', 'G D E', 'Buttermilk-fried chicken, lettuce, pickles and mayo.', 'chicken sandwich'],
      ['Buffalo Wings (8)', 13.99, 's gf', 'D', 'With blue cheese dip and celery (mild, hot or BBQ).', 'wings|chicken wings|buffalo wings'],
      ['Chicken Tenders (4)', 12.99, '', 'G E', 'Crispy tenders with honey mustard.', 'tenders|chicken tenders|nuggets'],
      ['Fries', 4.99, 'vg', '', 'Skin-on fries with sea salt.', 'fries|french fries|chips'],
      ['Onion Rings', 5.99, 'v', 'G D E', 'Beer-battered onion rings.', 'onion rings|rings'],
      ['Loaded Cheese Fries', 8.99, '', 'D', 'Fries with cheddar sauce, bacon and scallions.', 'cheese fries|loaded fries']
    ] },
    { cat: 'Mexican', items: [
      ['Tacos al Pastor (3)', 13.99, 's pop gf', '', 'Marinated pork with pineapple, onion and cilantro on corn tortillas.', 'al pastor|pastor|tacos|taco'],
      ['Carne Asada Tacos (3)', 14.99, 'gf', '', 'Grilled skirt steak, onion, cilantro and salsa verde.', 'carne asada|steak tacos'],
      ['Baja Fish Tacos (3)', 14.99, '', 'F G E', 'Beer-battered cod, cabbage and chipotle crema.', 'fish tacos'],
      ['Birria Tacos (3)', 16.99, 's', 'D', 'Slow-braised beef, melted cheese and consomé for dipping.', 'birria'],
      ['Chicken Burrito', 14.49, '', 'G D', 'Grilled chicken, rice, beans, cheese, pico and crema.', 'burrito'],
      ['Veggie Burrito Bowl', 13.49, 'vg gf', '', 'Rice, black beans, fajita veggies, corn, pico and guac.', 'burrito bowl|veggie bowl'],
      ['Cheese Quesadilla', 10.99, 'v', 'G D', 'Flour tortilla with Oaxaca cheese (add chicken +$3).', 'quesadilla'],
      ['Chicken Enchiladas Verdes', 17.49, 'gf', 'D', 'Three enchiladas in tomatillo sauce with crema.', 'enchiladas|enchilada'],
      ['Nachos Supreme', 13.99, 'v s', 'D', 'Chips, beans, cheese, jalapeños, crema and guac.', 'nachos'],
      ['Guacamole & Chips', 11.99, 'vg gf', '', 'Avocado smashed to order with lime and jalapeño.', 'guac|guacamole|chips and guac'],
      ['Churros', 7.49, 'v', 'G D E', 'Cinnamon-sugar churros with chocolate sauce.', 'churros|churro']
    ] },
    { cat: 'Middle Eastern', items: [
      ['Chicken Shawarma Wrap', 12.99, 'h pop', 'G SE', 'Marinated chicken, garlic toum, pickles and fries in saj bread.', 'shawarma|chicken shawarma|shawarma wrap'],
      ['Beef Shawarma Plate', 19.99, 'h', 'SE D', 'Spiced beef over rice with hummus, salad, tahini and pita.', 'beef shawarma|shawarma plate'],
      ['Falafel Wrap', 10.99, 'vg h', 'G SE', 'Crispy falafel, tahini, pickled turnips and salad.', 'falafel wrap'],
      ['Falafel (6 pc)', 8.49, 'vg gf', 'SE', 'Crispy chickpea and herb falafel with tahini.', 'falafel'],
      ['Shish Tawook Plate', 19.49, 'h gf', 'D', 'Charcoal-grilled chicken skewers with garlic sauce and rice.', 'shish tawook|tawook'],
      ['Lamb Kofta Plate', 21.49, 'h gf', 'SE', 'Grilled minced lamb skewers with rice and hummus.', 'kofta|kafta'],
      ['Hummus', 8.49, 'vg gf', 'SE', 'Chickpeas with tahini, lemon and olive oil, with warm pita.', 'hummus|houmous'],
      ['Baba Ghanoush', 8.99, 'vg gf', 'SE', 'Smoky roasted eggplant with tahini and pomegranate.', 'baba ghanoush|baba ganoush'],
      ['Fattoush Salad', 9.49, 'vg', 'G', 'Crisp vegetables, sumac and toasted pita chips.', 'fattoush'],
      ['Lentil Soup', 6.49, 'vg gf', '', 'Red lentil soup with cumin and lemon.', 'lentil soup'],
      ['Kunafa', 9.49, 'v', 'G D N', 'Warm shredded pastry over sweet cheese with syrup and pistachio.', 'kunafa|knafeh'],
      ['Baklava (4 pc)', 6.99, 'v', 'G N', 'Flaky phyllo with walnuts, pistachios and honey syrup.', 'baklava']
    ] },
    { cat: 'Seafood', items: [
      ['Grilled Salmon', 29.00, 'gf pop', 'F', 'Atlantic salmon with lemon-dill sauce and greens.', 'salmon'],
      ['Whole Maine Lobster (1.5 lb)', 54.00, 'gf', 'SH D', 'Steamed lobster with drawn butter, corn and potatoes.', 'lobster|whole lobster'],
      ['Lobster Roll', 32.00, '', 'SH G E D', 'Chilled lobster salad on a buttered roll, with fries.', 'lobster roll'],
      ['Garlic Butter Shrimp', 26.00, 'gf', 'SH D', 'Jumbo shrimp sautéed in garlic butter with rice.', 'shrimp|garlic shrimp|prawns'],
      ['Oysters (half dozen)', 21.00, 'gf', 'SH', 'East Coast oysters with mignonette and lemon.', 'oysters|oyster'],
      ['Fried Calamari', 15.00, '', 'SH G E', 'Crispy calamari with marinara and lemon aioli.', 'calamari|squid'],
      ['Seafood Paella', 38.00, 'gf', 'SH F', 'Saffron rice with shrimp, mussels, clams and chorizo (serves 2).', 'paella'],
      ['Crab Cakes (2)', 24.00, '', 'SH G E', 'Jumbo lump crab cakes with remoulade.', 'crab cakes|crab cake|crab'],
      ['Blackened Fish Tacos (3)', 17.00, 's', 'F', 'Cajun-spiced mahi-mahi with mango salsa.', 'blackened fish|mahi tacos']
    ] },
    { cat: 'Cafe & Coffee', items: [
      ['Espresso', 3.50, 'vg gf', '', 'Double shot of our house blend.', 'espresso'],
      ['Cappuccino', 4.75, 'v gf', 'D', 'Espresso with velvety steamed milk (oat milk free).', 'cappuccino|cappucino'],
      ['Latte', 5.00, 'v gf', 'D', 'Espresso with steamed milk — iced or hot.', 'latte|iced latte'],
      ['Cold Brew', 5.25, 'vg gf', '', '18-hour cold brew over ice.', 'cold brew|iced coffee'],
      ['Matcha Latte', 5.75, 'v gf', 'D', 'Ceremonial matcha with steamed milk.', 'matcha'],
      ['Hot Chocolate', 4.75, 'v gf', 'D', 'Made with real Belgian chocolate.', 'hot chocolate|cocoa'],
      ['Avocado Toast', 13.50, 'vg', 'G', 'Sourdough, smashed avocado, chili flakes and lemon.', 'avocado toast|avo toast'],
      ['Buttermilk Pancakes', 14.00, 'v', 'G D E', 'Three fluffy pancakes with maple syrup and berries.', 'pancakes|pancake'],
      ['Eggs Benedict', 16.00, '', 'G D E', 'Poached eggs, ham and hollandaise on an English muffin.', 'eggs benedict|benedict'],
      ['Acai Bowl', 12.50, 'vg gf', 'N', 'Acai, banana, granola, berries and almond butter.', 'acai|acai bowl']
    ] },
    { cat: 'Bakery & Desserts', items: [
      ['Butter Croissant', 4.25, 'v', 'G D E', 'Flaky all-butter croissant baked every morning.', 'croissant|croissants'],
      ['Cinnamon Roll', 5.25, 'v', 'G D E', 'Soft swirl with cream cheese frosting.', 'cinnamon roll'],
      ['Chocolate Fudge Cake', 8.95, 'v pop', 'G D E', 'Rich chocolate layers with fudge frosting (slice).', 'chocolate cake|fudge cake|cake'],
      ['New York Cheesecake', 9.25, 'v', 'G D E', 'Creamy classic cheesecake with berry compote.', 'cheesecake'],
      ['Red Velvet Cupcake', 4.50, 'v', 'G D E', 'With cream cheese frosting.', 'cupcake|cupcakes|red velvet'],
      ['Gluten-Free Brownie', 5.00, 'v gf', 'D E', 'Fudgy almond-flour brownie.', 'brownie|brownies'],
      ['French Macarons (6)', 14.00, 'v gf', 'N D E', 'Pistachio, raspberry, vanilla, chocolate, caramel and lemon.', 'macarons|macaron'],
      ['Gelato (2 scoops)', 7.50, 'v gf', 'D E', 'Pistachio, chocolate, vanilla, strawberry or salted caramel.', 'gelato|ice cream|scoop'],
      ['Vegan Mango Sorbet', 6.50, 'vg gf', '', 'Alphonso mango sorbet, dairy-free.', 'sorbet|mango sorbet'],
      ['Chocolate Lava Cake', 11.00, 'v', 'G D E', 'Warm molten chocolate cake with vanilla gelato.', 'lava cake|molten cake']
    ] },
    { cat: 'Bar', items: [
      ['Classic Margarita', 15.00, 'alc vg gf', '', 'Tequila, fresh lime and orange liqueur (21+).', 'margarita|margaritas|margarita cocktail'],
      ['Old Fashioned', 17.00, 'alc vg gf', '', 'Bourbon, bitters and orange (21+).', 'old fashioned'],
      ['Mojito', 14.00, 'alc vg gf', '', 'White rum, mint, lime and soda (21+).', 'mojito'],
      ['Espresso Martini', 16.00, 'alc vg gf', '', 'Vodka, fresh espresso and coffee liqueur (21+).', 'espresso martini|martini'],
      ['Draft Beer', 8.00, 'alc vg', 'G', 'Local IPA, lager or seasonal (16 oz, 21+).', 'beer|beers|ipa|lager|draft'],
      ['House Wine (glass)', 12.00, 'alc vg gf', '', 'Red, white or rosé (21+).', 'wine|red wine|white wine|rose|house wine'],
      ['Virgin Mojito', 8.00, 'vg gf', '', 'Mint, lime, sugar and soda — alcohol-free.', 'virgin mojito|mocktail|mocktails'],
      ['Mango Chili Spritz (mocktail)', 9.00, 'vg gf s', '', 'Mango, lime, a touch of chili and soda — alcohol-free.', 'mango spritz|chili spritz'],
      ['Berry Nojito (mocktail)', 9.00, 'vg gf', '', 'Mixed berries, mint, lime and soda — alcohol-free.', 'nojito|berry mocktail'],
      ['Shirley Temple', 6.00, 'vg gf', '', 'Ginger ale, grenadine and a cherry — kids love it.', 'shirley temple']
    ] },
    { cat: 'Drinks', items: [
      ['Soft Drink', 3.50, 'vg gf', '', 'Coke, Diet Coke, Sprite or ginger ale.', 'coke|coca cola|soda|sprite|diet coke|soft drink|cola|pop'],
      ['Fresh Lemonade', 4.50, 'vg gf', '', 'House-squeezed lemonade.', 'lemonade'],
      ['Fresh Orange Juice', 5.50, 'vg gf', '', 'Squeezed to order.', 'orange juice|oj|juice'],
      ['Sparkling Water', 4.00, 'vg gf', '', 'San Pellegrino, 500 ml.', 'sparkling water|pellegrino'],
      ['Bottled Water', 3.00, 'vg gf', '', 'Still spring water (tap water is free).', 'water|bottled water'],
      ['Iced Tea', 3.75, 'vg gf', '', 'Unsweetened or peach.', 'iced tea|tea']
    ] },
    { cat: 'Kids', items: [
      ['Kids Cheese Pizza', 9.00, 'v k', 'G D', '8" cheese pizza.', 'kids pizza'],
      ['Kids Chicken Tenders & Fries', 9.50, 'k', 'G E', 'Three tenders with fries and ketchup.', 'kids tenders|kids meal'],
      ['Kids Mac and Cheese', 8.00, 'v k', 'G D', 'Small mac and cheese with fruit.', 'kids mac'],
      ['Kids Butter Chicken & Rice', 10.00, 'h k gf', 'D N', 'Extra-mild butter chicken over rice.', 'kids butter chicken'],
      ['Kids Vegan Pasta', 8.00, 'vg k', 'G', 'Penne with tomato sauce and vegan parmesan.', 'kids pasta|kids vegan pasta'],
      ['Kids Mini Sundae', 5.00, 'v k gf', 'D E', 'One scoop with sprinkles and a cherry.', 'kids sundae|mini sundae']
    ] },
    { cat: 'Deals & Combos', items: [
      ['Weekday Lunch Combo', 14.99, 'pop', 'G D', 'Any curry, pasta or burger with a side and soft drink — Mon–Fri, 11 AM–3 PM.', 'lunch combo|lunch special|lunch deal'],
      ['Indian Feast for Two', 49.99, 'h', 'D G N', 'Butter chicken, chana masala, rice, 2 garlic naan and 2 mango lassis.', 'indian feast'],
      ['Sushi Boat for Two', 68.00, '', 'F SH S G E', '10 nigiri, a dragon roll, a spicy tuna roll and a California roll.', 'sushi boat|boat'],
      ['Pizza Party Deal', 45.00, 'v', 'G D', 'Any 2 pizzas, garlic knots and 4 soft drinks.', 'pizza deal|pizza party'],
      ['Family Feast (serves 4)', 89.00, 'pop', 'G D E', 'Chicken biryani, butter chicken, a margherita pizza, fries, 4 naan and 4 soft drinks.', 'family feast|family deal|family meal'],
      ['BBQ Platter for Two', 54.99, '', 'G', 'Brisket, half rack of ribs, burnt ends, 3 sides and cornbread.', 'bbq platter|platter for two']
    ] }
  ],
  facts: {
    wifi: 'Yes — free Wi-Fi for guests. The network is "DemoRestaurant-Guest" and the password is on your table card.',
    wheelchair: 'Yes, we\'re fully wheelchair accessible — step-free entrance, an elevator to the private dining room, and accessible restrooms.',
    pets: 'Service animals are always welcome, and well-behaved dogs are welcome on the outdoor terrace.',
    dress: 'Smart casual — no strict dress code, but we ask for no swimwear or tank tops in the dining room.',
    giftcards: 'Yes! Gift cards are available in any amount from $25, at the host stand or by emailing {email}.',
    loyalty: 'Join our Table Club at the host stand — every $200 you spend earns a $20 credit.',
    alcohol: 'Our bar serves cocktails, beer and wine to guests 21+ with a valid ID, plus a full mocktail list. BYOB isn\'t allowed, but you can bring a bottle of wine for a $25 corkage fee (max 2 bottles).',
    cancelPolicy: 'Reservations are free to cancel up to 2 hours before. For groups of 8+, please give us 24 hours\' notice; private events need 7 days.',
    late: 'We hold your table for 15 minutes. If you\'re running late, give us a call at {phone} and we\'ll do our best.',
    music: 'We have live jazz on Friday and Saturday nights from 8 to 11 PM, and soft background music the rest of the week.',
    birthday: "Yes, you can bring a cake! There's a $2 per guest plating fee, and we'll add candles and bring it out with a song. Birthday guests also get a free dessert.",
    wait: 'Walk-in waits are usually under 15 minutes on weekdays and 30–45 minutes on Friday and Saturday evenings, so booking ahead is best.',
    discount: 'Happy hour is Monday to Friday, 4–7 PM, and our combos and lunch specials are the best value.',
    restroom: 'Yes, restrooms are on the main floor, including an accessible restroom and a baby-changing table.'
  },
  faqs: [
    /* venue */
    ['how big restaurant|how many seat|capacity', 'We seat about 180 guests: the main dining room, a 40-seat terrace, a 24-seat bar and a private dining room for up to 20.'],
    ['high chair|booster seat|highchair', 'Yes — we have high chairs and booster seats, just ask when you arrive or mention it when booking.'],
    ['how many cuisine|what cuisine|type of food|kind of food|what food do you serve', "We serve 17 kinds of food under one roof: Desi, Indian, Chinese, Thai, Japanese & sushi, Italian, French, American & English, steakhouse, BBQ & grill, burgers, Mexican, Middle Eastern, seafood, cafe, bakery & desserts — plus a full bar."],
    ['mix cuisine|order from different|different section|combine', 'Absolutely — everyone at the table can order from any section, and it all comes out together.'],
    ['live music|jazz|band', 'Live jazz plays on Friday and Saturday nights from 8 to 11 PM — no cover charge.'],
    ['private dining room|private room size|private room', 'Our private dining room seats up to 20 guests and has its own screen for presentations. For 13+ guests, I can start a private event inquiry.'],
    ['outdoor seating|terrace|patio|outside seating', 'Yes! Our heated outdoor terrace seats 40 and is open from March to November, weather permitting.'],
    ['open sunday|sunday hours|sunday', "Sorry, we're closed on Sundays. We're open Mon–Sat, 11 AM–11 PM."],
    ['bar hours|bar open late|bar close', 'The bar is open with the kitchen Monday to Saturday from 11 AM, and stays open until midnight on Fridays and Saturdays.'],
    ['last order|kitchen close|last food order', 'The kitchen takes its last food orders at 10:45 PM, Monday to Saturday.'],
    ['reservation required|need reservation|walk in welcome', 'Reservations are recommended for Friday and Saturday evenings, but walk-ins are always welcome when we have space.'],
    ['corkage|corkage fee', 'Corkage is $25 per bottle of wine, up to 2 bottles per table. Spirits and beer can\'t be brought in.'],
    ['byob|bring my own|bring our own|bring alcohol', "We don't allow BYOB for beer or spirits, but you can bring wine for a $25 corkage fee per bottle (max 2)."],
    ['split bill|separate check|split check', 'Of course — we can split the bill up to 6 ways, by item or evenly.'],
    ['service charge|large party gratuity|automatic tip', 'For parties of 8 or more, an 18% service charge is added to the bill.'],
    ['phone charger|charging|outlet', 'We have phone chargers at the host stand — just ask!'],
    ['coat check|coat|bag storage', 'We offer a free coat check from October to April.'],
    ['how long food take|food take long|how quick food', 'Most dishes arrive 15–20 minutes after ordering; slow-cooked or made-to-order items like karahi and soufflé take around 25 minutes.'],
    /* desi */
    ['what is nihari|nihari made|nihari taste', 'Nihari is a rich beef shank stew slow-cooked overnight with bone marrow and spices, finished with ginger, lemon and green chilies. It comes with naan.'],
    ['karahi serve|karahi size|karahi portion|how many karahi', 'Our Chicken Karahi serves 2 hungry people — add naan or rice on the side.'],
    ['karahi take|how long karahi|karahi ready', 'Karahi is cooked to order, so it takes about 20–25 minutes.'],
    ['what is haleem|haleem made', 'Haleem is a slow-cooked blend of wheat, lentils and shredded beef, topped with fried onions, ginger and lemon — rich and comforting.'],
    ['biryani spicy|biryani how spicy|biryani mild', 'Our biryani is medium-spicy; we can make it mild or extra spicy on request.'],
    ['biryani come with|biryani raita|biryani serve', 'Every biryani comes with raita and a small salad, and one portion fills one hungry adult.'],
    ['desi breakfast|halwa puri|nashta', 'Halwa puri is our Saturday special from 11 AM to 1 PM, while it lasts!'],
    ['ghee|desi ghee|cook with ghee', 'Our karahi and biryani are cooked with desi ghee; the daal and naan use butter, and the samosas are fried in canola oil.'],
    ['msg|food coloring|artificial color', 'No MSG and no artificial colors — the biryani gets its color from real saffron.'],
    /* indian */
    ['butter chicken vs tikka masala|difference tikka masala|tikka masala butter chicken', 'Butter chicken is milder, buttery and slightly sweet; tikka masala is smokier, more onion-forward and a little spicier.'],
    ['what is dosa|dosa made|dosa taste', 'A dosa is a thin, crispy crepe made from fermented rice and lentil batter — naturally vegan and gluten-free. Ours is filled with spiced potato.'],
    ['what is idli|idli made', 'Idli are soft steamed rice-and-lentil cakes from South India, served with sambar and coconut chutney.'],
    ['korma|what korma|korma spicy', 'Our Vegetable Korma is very mild and creamy, made with cashews — a great pick if you don\'t like heat.'],
    ['indian vegetarian|vegetarian indian|indian veg', 'Indian vegetarian favorites: chana masala, paneer tikka masala, vegetable korma, masala dosa and idli sambar.'],
    ['thali|indian platter', 'We don\'t serve a thali, but the Indian Feast combo gives you butter chicken, chana masala, rice, garlic naan and a mango lassi.'],
    ['rogan josh|what rogan josh', 'Rogan josh is a Kashmiri lamb braise colored by mild Kashmiri chilies — aromatic and medium-spicy.'],
    ['beef indian|indian beef', 'Our Indian section doesn\'t use beef or pork — it\'s chicken, lamb and vegetarian dishes.'],
    /* chinese */
    ['msg chinese|chinese msg', 'Our Chinese kitchen doesn\'t add MSG, though oyster and soy sauces naturally contain glutamates.'],
    ['sichuan pepper|numbing|mala', 'Sichuan peppercorns give a tingly, numbing feeling rather than pure heat — you\'ll find them in the Kung Pao Chicken and Mapo Tofu.'],
    ['dumplings steamed|steamed or fried|pan fried dumplings', 'Our dumplings can be steamed or pan-fried — just tell us which you prefer.'],
    ['dim sum|yum cha', 'We don\'t run dim sum carts, but our dumplings, spring rolls and sesame balls make a great dim-sum-style spread.'],
    ['peking duck how|duck serve|whole duck', 'Our half Peking Duck serves 2–3 as a main; a whole duck (serves 4–6, $69.99) needs 24 hours\' notice.'],
    ['fortune cookie', 'Of course — every Chinese order comes with fortune cookies!'],
    ['chinese vegetarian|vegetarian chinese', 'Chinese vegetarian picks: vegetable spring rolls, vegetable fried rice, sesame balls and mapo tofu made with mushrooms on request.'],
    ['lo mein vs chow mein|chow mein', 'We serve lo mein (soft tossed egg noodles). We don\'t have chow mein, but our Shrimp Lo Mein can be made with vegetables only.'],
    /* thai */
    ['pad thai peanut|peanuts pad thai', 'Our Pad Thai is topped with crushed peanuts and the sauce contains fish sauce. We can leave the peanuts off, but please let our staff know about a peanut allergy so the kitchen can take care.'],
    ['thai spice level|thai spicy|how spicy thai|thai hot', 'Thai dishes come in mild, medium, hot or "Thai hot". The green curry, tom yum and som tum are the spiciest.'],
    ['green or red curry|difference green red|curry difference', 'Green curry is the spiciest and most herbal; red curry is a little milder and richer; massaman is the mildest, with peanuts and potatoes.'],
    ['fish sauce|thai vegan|vegan thai', 'Most Thai sauces contain fish sauce, but we can make pad thai, curries and summer rolls vegan with soy sauce and tofu.'],
    ['drunken noodles alcohol|drunken noodles', 'Drunken noodles contain no alcohol — the name comes from being the perfect late-night dish!'],
    ['tom yum|tom kha', 'Tom yum is a spicy, sour lemongrass soup with shrimp; tom kha gai is a creamy, mild coconut soup with chicken.'],
    ['sticky rice|mango sticky rice', 'Mango sticky rice is sweet coconut rice with fresh mango — vegan and gluten-free.'],
    /* japanese */
    ['omakase', 'We don\'t offer an omakase, but the Sushi Boat for Two is a chef-selected spread of nigiri and rolls.'],
    ['fish fresh|where fish from|sushi fresh', 'Our fish is delivered daily and handled by sushi chefs trained in Tokyo.'],
    ['cooked sushi|no raw fish|pregnant sushi', 'Cooked sushi options: California roll, dragon roll, avocado cucumber roll, plus teriyaki, katsu curry and ramen.'],
    ['ramen broth|ramen vegetarian|vegetarian ramen', 'Our tonkotsu broth is pork-based and simmered 18 hours; the Miso Mushroom Ramen is fully vegan.'],
    ['soy sauce gluten|tamari', 'We have gluten-free tamari for sushi — just ask.'],
    ['wasabi|ginger|gari', 'Every sushi order comes with wasabi and pickled ginger on the side.'],
    ['nigiri vs sashimi|difference nigiri|sashimi or nigiri', 'Nigiri is a slice of fish over seasoned rice; sashimi is just the fish, no rice.'],
    ['brown rice sushi|brown rice', 'Any roll can be made with brown rice for $1 extra.'],
    /* italian */
    ['pizza size|how big pizza|what size pizza|large pizza|pizza big', 'Our pizzas are 12 inches and cut into 6 slices — enough for one hungry adult or two lighter eaters. The gluten-free pizza is 10".'],
    ['wood fired|pizza oven|neapolitan', 'Our pizzas are baked in a 900°F wood-fired oven in about 90 seconds, Neapolitan style.'],
    ['half and half|two toppings half|split pizza', 'Yes — we can do half-and-half on any pizza; you pay for the pricier half.'],
    ['extra topping|add topping|pizza topping', 'Extra toppings are $2–$4: mushrooms, olives, onions, peppers, sausage, pepperoni, anchovies or extra cheese.'],
    ['fresh pasta|homemade pasta|pasta made', 'Our fettuccine and lasagna sheets are made fresh every morning.'],
    ['vodka sauce alcohol|vodka pasta alcohol', 'The vodka cooks off completely in the sauce — it just adds a creamy, slightly sweet tomato flavor.'],
    ['gluten free pasta|gf pasta', 'Any pasta can be made with gluten-free penne for $3 extra.'],
    ['carbonara cream|real carbonara', 'Our carbonara is the Roman way — egg yolk, pecorino, guanciale and pepper. No cream!'],
    /* french */
    ['escargot|snails taste', 'Our escargots are Burgundy snails baked in garlic-parsley butter — tender and garlicky, best mopped up with bread.'],
    ['steak frites cook|steak frites', 'Steak frites is a grilled hanger steak with herb butter and fries — we recommend medium-rare.'],
    ['coq au vin alcohol|wine in food|cooked with wine', 'Coq au vin and moules are cooked with wine; the alcohol cooks off, but let us know if you avoid it and we\'ll suggest something else.'],
    ['creme brulee|brulee', 'Our crème brûlée is a vanilla-bean custard with a crackling caramel top — and it\'s gluten-free.'],
    ['french vegetarian|vegetarian french', 'French vegetarian picks: ratatouille (vegan), French onion soup and our crème brûlée or chocolate mousse.'],
    ['crepes|crepe', 'Our Crêpes Suzette come in an orange-butter sauce; we make an alcohol-free version on request.'],
    /* american & english */
    ['fish and chips fish|what fish chips|fish chips', 'Our fish and chips use wild Atlantic cod in a crispy beer batter, with chunky chips, mushy peas and tartar sauce.'],
    ['full english|english breakfast all day|breakfast all day', 'Yes — our Full English Breakfast is served all day: eggs, bacon, sausage, beans, mushrooms, tomato and toast.'],
    ['sunday roast|roast dinner', 'We\'re closed on Sundays, so no Sunday roast — but our Shepherd\'s Pie and Bangers and Mash are the next best thing.'],
    ['shepherds pie|cottage pie', 'Our Shepherd\'s Pie is braised lamb under a golden mashed-potato crust — proper British comfort food.'],
    ['mac and cheese kids|mac cheese', 'Our three-cheese mac and cheese is a hit with kids — and there\'s a smaller kids portion too.'],
    ['gravy|onion gravy', 'Bangers and mash comes with onion gravy, and the fried chicken with peppered gravy — extra gravy is free.'],
    ['sticky toffee|toffee pudding', 'Sticky toffee pudding is a warm date sponge soaked in toffee sauce with custard — our most popular British dessert.'],
    /* steakhouse */
    ['steak cook|steak cooked|how cook steak|medium rare|steak temperature|how do you cook|well done|rare steak', 'Our chefs recommend medium-rare, but we\'ll cook your steak exactly how you like it — from rare to well done.'],
    ['dry aged|dry age|aged beef', 'Our porterhouse is dry-aged for 28 days; the ribeye and strip are wet-aged USDA Prime.'],
    ['steak sauce|peppercorn|bearnaise|chimichurri', 'Steak sauces are $3: peppercorn, béarnaise, chimichurri or red wine jus.'],
    ['steak come with|steak sides|sides included', 'Steaks are served à la carte except the Porterhouse for Two, which includes two sides. Our sides are $9–$10.'],
    ['halal steak|steak halal', 'Yes — our Halal Ribeye is zabiha halal and grilled separately. Our other steaks aren\'t halal.'],
    ['best steak|which steak|most tender', 'For tenderness, go for the filet mignon; for flavor and marbling, the ribeye is our best seller.'],
    ['wagyu|kobe', 'We don\'t serve wagyu right now — our ribeye and strip are USDA Prime.'],
    /* bbq & grill */
    ['wood|smoke with|what wood', 'We smoke over oak and hickory for 14 hours in our pit smoker.'],
    ['brisket sold out|sell out|run out', 'Brisket and burnt ends can sell out on busy nights — pre-ordering for pickup is the safe bet.'],
    ['bbq sauce|which sauce bbq|sauces', 'We have three house BBQ sauces: original, spicy and Carolina gold. All are gluten-free.'],
    ['how much meat|pound per person|meat per person', 'Plan on about 1/2 lb of meat per person.'],
    ['ribs pork|pork free bbq|bbq halal', 'Our ribs and pulled pork are pork; for halal grill options, try the Grilled Lamb Chops or the Halal Ribeye.'],
    ['smoke ring|pink brisket', 'The pink ring in our brisket is the smoke ring — a sign of real low-and-slow smoking, not undercooked meat.'],
    /* burgers & fast food */
    ['smash burger|what smash', 'A smash burger is a ball of fresh beef pressed thin on a hot griddle, so it gets crispy, lacy edges.'],
    ['burger cook|medium rare burger|pink burger', 'Smash patties are thin and always cooked through with a crispy crust.'],
    ['gluten free bun|lettuce wrap|no bun', 'Any burger can come on a gluten-free bun (+$1.50) or as a lettuce wrap.'],
    ['add bacon|extra patty|add cheese|burger add', 'Burger add-ons: bacon $2.50, extra patty $3.50, extra cheese $1, fried egg $2, avocado $2.'],
    ['wing flavor|wing sauce|wings hot', 'Wings come mild, hot or BBQ — tell us your favorite.'],
    ['shared fryer|fries vegan|fryer', 'Our fries are vegan but share a fryer with chicken and onion rings.'],
    /* mexican */
    ['tortilla|corn tortilla|handmade tortilla', 'Our corn tortillas are pressed fresh every morning; flour tortillas come from a local tortillería.'],
    ['birria|what is birria|consome', 'Birria is beef slow-braised with dried chilies; we crisp the tacos with cheese and serve them with consomé for dipping.'],
    ['salsa|hot sauce|salsa bar', 'Every Mexican order comes with salsa verde and salsa roja — the roja is the spicy one.'],
    ['lard|beans vegan|rice vegan', 'We never use lard — our beans and rice are vegan.'],
    ['taco mix|mix tacos|different tacos', 'You can mix fillings in any order of 3 tacos for the higher price.'],
    ['add guac|extra guac', 'Add guacamole to anything for $2.50.'],
    /* middle eastern */
    ['toum|garlic sauce', 'Toum is our fluffy Lebanese garlic sauce — no dairy or egg, just garlic, oil and lemon.'],
    ['charcoal|grilled charcoal', 'Our kebabs and tawook are grilled over real charcoal.'],
    ['shawarma made|how shawarma', 'Our shawarma is marinated overnight, roasted on a vertical spit and shaved to order.'],
    ['falafel vegan|falafel gluten', 'Our falafel is vegan and gluten-free — made from soaked chickpeas and fresh herbs.'],
    ['kunafa|what kunafa', 'Kunafa is warm shredded pastry over sweet cheese, soaked in syrup and topped with pistachio — best eaten hot!'],
    ['middle eastern halal|shawarma halal', 'Everything in our Middle Eastern section is zabiha halal.'],
    /* seafood */
    ['lobster price|market price|lobster size', 'Our whole Maine lobster is 1.5 lb and $54, served with drawn butter, corn and potatoes.'],
    ['oysters where|oyster type|oysters fresh', 'Our oysters are East Coast varieties delivered daily — ask your server what\'s fresh today.'],
    ['fish fresh|seafood fresh|fresh fish', 'Our seafood is delivered fresh six days a week.'],
    ['paella serve|paella size|paella take', 'Our seafood paella serves 2 and takes about 30 minutes, since it\'s cooked to order.'],
    ['shellfish allergy|seafood allergy', 'Shellfish is in our lobster, shrimp, oyster, calamari, crab cakes and paella. Please let our staff know so the kitchen can take care.'],
    /* cafe */
    ['oat milk|almond milk|plant milk|dairy free milk', 'Oat, almond and soy milk are free in any coffee drink.'],
    ['decaf|decaffeinated', 'Yes — any coffee can be made decaf.'],
    ['breakfast hours|serve breakfast|brunch hours', 'Breakfast and brunch dishes are served all day, from 11 AM when we open.'],
    ['coffee beans|roast|single origin', 'Our house espresso is a chocolatey Brazil–Ethiopia blend roasted in Brooklyn.'],
    ['laptop|work from|study', 'Laptops are welcome at the cafe counter on weekdays before 5 PM.'],
    /* bakery & desserts */
    ['bring cake|bring own cake|bring our own cake|bring a cake|can i bring cake|outside cake', "Yes, you can bring a cake! There's a $2 per guest plating fee, and we'll add candles and bring it out with a song."],
    ['custom cake|order cake|birthday cake order|celebration cake', "We don't make custom celebration cakes, but you're welcome to bring one ($2 per guest plating fee) — and our Chocolate Fudge Cake by the slice is always a hit."],
    ['gelato flavor|ice cream flavor|flavors', 'Gelato flavors: pistachio, chocolate, vanilla, strawberry and salted caramel, plus a vegan mango sorbet.'],
    ['dessert vegan|vegan dessert', 'Vegan desserts: mango sorbet, mango sticky rice and sesame balls.'],
    ['lava cake|lava cake take', 'Our chocolate lava cake is baked to order and takes about 12 minutes — worth it!'],
    /* bar */
    ['happy hour|happy hour price|happy hour time|happy hour drinks', 'Happy hour is Monday to Friday, 4–7 PM: $9 classic cocktails, $6 draft beer, $8 house wine and $6 mocktails, plus half-price fries and wings. Alcohol is for guests 21+ with a valid ID.'],
    ['age|id|how old|21|drinking age|card|id check', 'Alcohol is only served to guests 21 and over with a valid photo ID. Everyone is welcome to enjoy our mocktails!'],
    ['mocktail|non alcoholic|alcohol free|virgin', 'Our mocktails: Virgin Mojito ($8), Mango Chili Spritz ($9), Berry Nojito ($9) and the Shirley Temple ($6).'],
    ['cocktail list|cocktails|signature cocktail', 'Our cocktails include the Classic Margarita, Old Fashioned, Mojito and Espresso Martini ($14–$17), for guests 21+ with ID.'],
    ['beer list|what beer|beers', 'We pour a local IPA, a crisp lager and a seasonal draft (16 oz, $8), for guests 21+ with ID.'],
    ['wine list|what wine|wine by glass', 'House red, white and rosé are $12 a glass, and we have a full bottle list — ask your server. 21+ with ID.'],
    ['drink deliver|alcohol delivery|deliver alcohol|beer to go|alcohol to go', "Bar drinks are dine-in only — we don't deliver alcohol or sell it to go. Mocktails, juices and sodas can be added to any order."],
    ['drink limit|last call|drunk', 'Last call is 30 minutes before the bar closes, and our bartenders always serve responsibly.']
  ]
};

/* ───────────── 1. DESI — Lahori Tadka (Pakistani) ───────────── */
N.desi = {
  id: 'desi', name: 'Lahori Tadka', cuisine: 'Pakistani', icon: 'pot',
  tagline: 'Home-style Lahori karahi, nihari and tandoor, cooked fresh every day.',
  street: '142 Lexington Ave', city: 'New York', state: 'NY', zip: '10016', phone: '(212) 555-0142', email: 'hello@lahoritadka.com',
  hours: { mon: '12:00-23:00', tue: '12:00-23:00', wed: '12:00-23:00', thu: '12:00-23:30', fri: '12:00-01:00', sat: '11:00-01:00', sun: '11:00-22:30' },
  hoursNote: 'We stay open late on Friday and Saturday nights.',
  tax: 0.08875,
  reservations: { max: 12, last: 60 },
  seating: { options: ['indoor', 'outdoor', 'booth'], outdoorLabel: 'Sidewalk patio', text: 'We seat about 70 inside — booths for 4, tables for 2, 4 and 6, and we can join tables for up to 12. Our heated sidewalk patio has 6 tables and is open April to November.', outdoorNote: 'The patio has heaters, so it stays cozy on cooler nights.' },
  delivery: { zones: [{ zips: ['10016', '10017', '10010', '10001'], fee: 2.99, min: 20 }, { zips: ['10011', '10003', '10022', '10018'], fee: 4.99, min: 30 }], time: '35–50 minutes', mins: 45, pickup: '20–25 minutes', prep: 25, note: 'We also deliver through DoorDash and Uber Eats, but ordering here saves you their fees.' },
  parking: 'Street parking on Lexington and 28th St is metered until 7 PM. The Icon garage at 120 E 29th St is a 2-minute walk.',
  directions: 'Between 28th & 29th St — the 6 train at 28th St is right around the corner.',
  payments: 'We take Visa, Mastercard, Amex, Discover, Apple Pay, Google Pay and cash. Happy to split the bill up to 4 ways.',
  kids: 'Kids are very welcome! We have high chairs, a mild kids menu, and we can make most dishes mild on request.',
  privateEvents: 'Our back room seats up to 40 for birthdays, dholkis and office dinners, and we can host up to 60 with a full buyout. Set menus start at $35 per guest.',
  events: { max: 60, lead: 2 },
  allHalal: true,
  halal: 'Yes — 100% of our meat is zabiha halal from a certified supplier, and we never use pork or alcohol in our cooking.',
  veg: 'Plenty of vegetarian choices: daal makhni, palak paneer, vegetable pulao, samosas and more. Our tandoori roti and pulao are vegan.',
  glutenFree: 'Our karahis, tandoori grills, daal and rice dishes are naturally gluten-free — just skip the naan.',
  spice: 'Most dishes can be made mild, medium or hot — just tell us when you order. Our karahis come medium-hot by default.',
  allergens: 'wheat, dairy, tree nuts and sesame',
  best: "Our Chicken Karahi is the dish people come back for, and the Beef Nihari is a weekend legend. The Chicken Biryani rounds out the top three.",
  signature: ['Chicken Karahi (serves 2)', 'Beef Nihari', 'Chicken Biryani'],
  catering: { min: 20, max: 400, lead: 4, text: 'Yes! We cater weddings, mehndis, office lunches and family events from 20 to 400 guests — trays or full buffet with setup, from about $18–$32 per guest.' },
  noCakes: "We don't bake custom cakes, but you're welcome to bring your own — there's no cake-cutting fee.",
  menu: [
    { cat: 'Starters', items: [
      ['Vegetable Samosa (2 pc)', 5.99, 'v', 'G', 'Crisp pastry filled with spiced potatoes and peas, served with tamarind chutney.', 'samosa|samosas'],
      ['Chicken Pakora', 8.99, 'h s', 'G E', 'Spiced chicken fritters in chickpea batter with mint raita.', 'pakora|pakoras'],
      ['Aloo Tikki Chaat', 7.99, 'v s', 'D G', 'Potato patties with chickpeas, yogurt, tamarind and chaat masala.', 'chaat|aloo tikki']
    ] },
    { cat: 'Karahi & Curries', items: [
      ['Chicken Karahi (serves 2)', 24.99, 'h s pop gf', 'D', 'Bone-in chicken cooked in a wok with tomatoes, ginger, green chilies and fresh coriander.', 'karahi|chicken karahi|kadai'],
      ['Mutton Karahi (serves 2)', 32.99, 'h s gf', 'D', 'Tender goat on the bone, Lahori style with black pepper and ginger.', 'mutton karahi|goat karahi|lamb karahi'],
      ['Beef Nihari', 19.99, 'h s pop', 'G', 'Slow-cooked overnight beef shank stew, finished with ginger, lemon and chilies. Served with naan.', 'nihari'],
      ['Chicken Handi', 18.99, 'h', 'D N', 'Boneless chicken in a creamy clay-pot gravy with cashews.', 'handi'],
      ['Daal Makhni', 13.99, 'v gf', 'D', 'Black lentils simmered overnight with butter and cream.', 'daal|dal|lentils|lentil'],
      ['Palak Paneer', 14.99, 'v gf', 'D', 'Spinach with house-made cottage cheese and garlic.', 'paneer|saag|palak']
    ] },
    { cat: 'Tandoor & BBQ', items: [
      ['Seekh Kebab (4 pc)', 14.99, 'h s gf', '', 'Minced beef kebabs with herbs and green chili, char-grilled on skewers.', 'seekh|kebab|kabab|seekh kabab|seekh kebabs|kebabs'],
      ['Chicken Tikka (Leg)', 13.99, 'h s gf pop', 'D', 'Yogurt-marinated chicken leg quarter from the tandoor.', 'tikka|chicken tikka'],
      ['Malai Boti', 15.99, 'h gf', 'D N', 'Creamy, mild chicken cubes marinated in cream and cashew.', 'malai|malai tikka'],
      ['Mixed Grill Platter', 34.99, 'h s gf', 'D', 'Seekh kebab, chicken tikka, malai boti and lamb chops for 2–3 people.', 'mixed grill|grill platter|bbq platter']
    ] },
    { cat: 'Rice', items: [
      ['Chicken Biryani', 15.99, 'h s pop gf', 'D', 'Fragrant basmati layered with spiced chicken, fried onions, mint and saffron.', 'biryani|biriyani|briyani'],
      ['Mutton Biryani', 19.99, 'h s gf', 'D', 'Our biryani with slow-cooked goat on the bone.', 'mutton biryani|goat biryani'],
      ['Vegetable Pulao', 11.99, 'vg gf', '', 'Basmati rice cooked with seasonal vegetables and whole spices.', 'pulao|veg rice']
    ] },
    { cat: 'Breads', items: [
      ['Butter Naan', 2.99, 'v', 'G D', 'Soft tandoor-baked naan brushed with butter.', 'naan|nan|naans'],
      ['Garlic Naan', 3.49, 'v', 'G D', 'Naan topped with garlic and coriander.', 'garlic naan'],
      ['Tandoori Roti', 1.99, 'vg', 'G', 'Whole-wheat flatbread from the tandoor.', 'roti|rotis']
    ] },
    { cat: 'Desserts', items: [
      ['Gulab Jamun (2 pc)', 5.49, 'v', 'D G', 'Warm milk dumplings in rose-cardamom syrup.', 'gulab jamun|jamun'],
      ['Kheer', 5.99, 'v gf', 'D N', 'Creamy rice pudding with pistachios and cardamom.', 'rice pudding']
    ] },
    { cat: 'Drinks', items: [
      ['Mango Lassi', 5.49, 'v gf', 'D', 'Chilled yogurt shake with Alphonso mango.', 'lassi|lassis'],
      ['Doodh Patti Chai', 3.49, 'v gf', 'D', 'Strong milky tea, brewed the Lahori way.', 'chai|tea|doodh patti'],
      ['Coca-Cola (Can)', 2.25, 'vg gf', '', 'Classic Coke, Diet Coke or Sprite.', 'coke|coca cola|cola|soda|soft drink|diet coke|sprite|pop'],
      ['Bottled Water', 1.75, 'vg gf', '', 'Still spring water.', 'water']
    ] },
    { cat: 'Kids', items: [
      ['Kids Chicken Nuggets & Fries', 8.99, 'h k', 'G E', 'Crispy nuggets with fries and ketchup.', 'nuggets|kids meal'],
      ['Kids Butter Chicken & Rice', 10.99, 'h k gf', 'D', 'Mild, creamy tomato chicken over rice.', 'butter chicken']
    ] },
    { cat: 'Deals & Combos', items: [
      ['Lahori Family Feast (serves 4)', 69.99, 'h pop', 'D G', 'Chicken karahi, chicken biryani, 4 seekh kebabs, 4 naan and 4 soft drinks.', 'family feast|family deal'],
      ['Weekday Lunch Box', 12.99, 'h', 'D G', 'Any curry of the day with rice, naan and a drink — Mon–Fri, 12–4 PM.', 'lunch box|lunch special'],
      ['Karahi + 4 Naan Combo', 29.99, 'h s', 'D G', 'Our Chicken Karahi (serves 2) with 4 butter naan.', 'karahi combo']
    ] }
  ],
  facts: {
    wifi: 'Yes, free Wi-Fi — the network is "LahoriTadka-Guest" and the password is on your table card.',
    wheelchair: 'Yes — step-free entrance on Lexington Ave and an accessible restroom.',
    pets: 'Service animals are always welcome. Well-behaved dogs are welcome on the sidewalk patio.',
    dress: 'No dress code at all — come as you are!',
    giftcards: 'Yes, gift cards are available at the counter in any amount from $25.',
    loyalty: 'Yes! Ask for a stamp card — every 10th karahi is on us.',
    alcohol: "We're an alcohol-free restaurant, and we don't allow BYOB. Try our lassis or a pot of doodh patti chai instead!",
    cancelPolicy: 'No deposit for regular tables. For groups of 8+, please give us 24 hours\' notice if plans change.',
    late: 'We hold tables for 15 minutes. Running late? Call {phone} and we\'ll do our best to keep it for you.',
    music: 'Soft Pakistani classics in the background, and we show big cricket matches on the TV by the counter.',
    birthday: "Celebrating? Tell us when you book and we'll bring a complimentary gulab jamun with a candle. You're welcome to bring your own cake — no cutting fee.",
    wait: 'Walk-ins are welcome! Friday and Saturday 7–10 PM get busy, so booking ahead is smart.',
    discount: 'Our Weekday Lunch Box ($12.99) and the Family Feast are our best-value deals. Students get 10% off with a valid ID.'
  },
  faqs: [
    ['what is nihari|nihari made|nihari taste', 'Nihari is a rich beef shank stew slow-cooked overnight with bone marrow and spices, finished with ginger, lemon and green chilies. It comes with naan.'],
    ['karahi serve|karahi size|karahi portion|how many karahi|half karahi|full karahi', 'Our karahis serve 2 hungry people. For 4, order two, or grab the Lahori Family Feast.'],
    ['karahi take|karahi ready|how long karahi', 'Karahi is cooked to order, so it takes about 20–25 minutes — it is worth the wait!'],
    ['boneless karahi|karahi boneless|karahi bone', 'Our karahis are bone-in for the best flavor, but we can make chicken karahi boneless for $3 extra — just ask.'],
    ['ghee|oil|cook with|butter ghee', 'We cook our karahis in desi ghee for authentic flavor; our pulao and roti are made without ghee or butter.'],
    ['msg|preservative|artificial color|food coloring', 'No MSG and no artificial colors — the biryani gets its color from real saffron.'],
    ['frozen|fresh meat|meat fresh', 'Everything is fresh — our zabiha meat is delivered daily and never frozen.'],
    ['halwa puri|desi breakfast|nashta|breakfast', 'Our weekend nashta runs Saturday and Sunday 11 AM–2 PM (halwa puri, channay and chai) — ask your server, it sells out fast!'],
    ['ramadan|iftar|sehri|suhoor|eid', 'During Ramadan we open at sunset with an iftar platter and stay open late for sehri on weekends. On Eid we open at noon.'],
    ['mild|less spicy|not spicy|kid friendly spice|no chili', 'Absolutely — every karahi, curry and biryani can be made mild. The Malai Boti and Kids Butter Chicken are naturally mild.'],
    ['extra spicy|very spicy|extra hot|hottest', 'Ask for "Lahori hot" and we will turn up the green chilies. The Beef Nihari and Seekh Kebab already have a good kick.'],
    ['raita|chutney|extra sauce|salad side', 'Every grill and biryani comes with mint raita and onion salad. Extra raita is $1.50.'],
    ['leftover|take home|box|doggy bag', 'Of course — we are happy to pack up leftovers in containers for you.'],
    ['beef|cow|beef dish', 'Our beef dishes are the Beef Nihari and Seekh Kebab (beef mince). The rest of our meat dishes are chicken or goat.'],
    ['lamb chop|lamb chops', 'Lamb chops come as part of our Mixed Grill Platter — they are marinated overnight in yogurt and spices.'],
    ['tandoor|clay oven', 'Yes — we bake naan and grill our tikka and kebabs in a traditional clay tandoor.'],
    ['roti or naan|naan or roti|difference naan roti', 'Naan is soft, leavened and brushed with butter; tandoori roti is whole-wheat, thinner and vegan.'],
    ['sweet lassi|salted lassi|lassi flavor', 'Our Mango Lassi is the favorite, and we can make it sweet or salted on request — same price.'],
    ['sugar free|diabetic|no sugar', 'We can make chai without sugar and skip the syrup on request. Most mains are naturally low in sugar.'],
    ['chef|who cooks|cook from lahore|owner', 'Our head chef trained in Lahore\'s Gawalmandi food street and has been cooking karahi for over 20 years.'],
    ['mehndi|dholki|wedding food|shaadi', 'We love wedding season! We cater mehndis, dholkis and walimas with full buffet setup — ask me for a catering quote.'],
    ['order ahead|pre order|preorder', 'Yes — you can order ahead for pickup or delivery right here in this chat and pick a time.'],
    ['large order|big order|order for office|order for 15', 'For orders over 15 people, our catering trays are better value — I can take a catering request for you.'],
    ['samosa filling|samosa beef|meat samosa', 'Our samosas are vegetarian — spiced potato and peas. We do not currently make meat samosas.'],
    ['charge for water|free water|tap water', 'Tap water is always free; bottled water is $1.75.']
  ]
};

/* ───────────── 2. DHABA — Highway Dhaba & Street Food ───────────── */
N.dhaba = {
  id: 'dhaba', name: 'Highway Dhaba & Street Food', cuisine: 'Punjabi dhaba & Indian street food', icon: 'chai',
  tagline: 'Punjabi highway dhaba food and Mumbai street snacks, served late.',
  street: '37-22 74th St', city: 'Jackson Heights', state: 'NY', zip: '11372', phone: '(718) 555-0137', email: 'chai@highwaydhaba.com',
  hours: { mon: '11:00-23:00', tue: '11:00-23:00', wed: '11:00-23:00', thu: '11:00-00:00', fri: '11:00-02:00', sat: '10:00-02:00', sun: '10:00-23:00' },
  hoursNote: 'Late-night chai runs until 2 AM on Fridays and Saturdays.',
  tax: 0.08875,
  reservations: { max: 12, last: 45 },
  seating: { options: ['indoor', 'outdoor'], outdoorLabel: 'Charpai courtyard', text: 'Inside we have long family tables for 4 to 10 and a chai counter. Out back is our courtyard with traditional charpai cots and string lights — about 30 seats, open year-round with heaters.', outdoorNote: 'The courtyard has charpai cots and heaters — very dhaba!' },
  delivery: { zones: [{ zips: ['11372', '11373', '11377', '11368'], fee: 1.99, min: 15 }, { zips: ['11369', '11370', '11104', '11101'], fee: 3.99, min: 25 }], time: '30–45 minutes', mins: 40, pickup: '15–20 minutes', prep: 20, note: 'Free delivery on orders over $50 in our first zone.' },
  parking: 'Street parking on 74th St and 37th Ave (metered until 7 PM), plus a municipal lot on 37th Rd behind us.',
  directions: 'Half a block from the 74 St–Broadway station (7, E, F, M, R trains).',
  payments: 'Cash, all major cards, Apple Pay, Google Pay and Zelle for catering deposits.',
  kids: 'Totally family friendly — high chairs, a kids menu, and the jalebi counter is a hit with little ones.',
  privateEvents: 'The courtyard can be booked for private parties of up to 45 guests — perfect for birthdays, dholkis and chai nights. Packages start at $25 per guest.',
  events: { max: 45, lead: 2 },
  allHalal: true,
  halal: 'All our chicken and goat is halal, and we never serve beef or pork. Our paneer and dal dishes are vegetarian.',
  veg: 'Loads of vegetarian street food — chole bhature, pav bhaji, pani puri, dal tadka and more. Most chaats are vegan without the yogurt.',
  glutenFree: 'Dal tadka, tandoori chicken, paneer tikka and our curries are naturally gluten-free; street snacks mostly use wheat.',
  spice: 'Dhaba food has a kick, but we can make anything mild, medium or "truck driver hot".',
  allergens: 'wheat, dairy, peanuts and tree nuts',
  best: 'Guests line up for our Chole Bhature, the smoky Dhaba Butter Chicken and our Kulhad Chai. On weekend nights, the Pav Bhaji flies out.',
  signature: ['Chole Bhature', 'Dhaba Butter Chicken', 'Kulhad Chai'],
  catering: { min: 25, max: 300, lead: 4, text: 'Yes — we cater chaat stations, live tandoor and dhaba-style buffets for 25 to 300 guests, from about $16–$28 per guest.' },
  noCakes: "We don't bake cakes, but you're welcome to bring one for your celebration — and our jalebi with rabri makes a great birthday dessert.",
  menu: [
    { cat: 'Street Food', items: [
      ['Pani Puri (8 pc)', 6.99, 'vg s', 'G', 'Crisp puris with spiced potato, chickpeas and tangy mint water.', 'pani puri|golgappa|gol gappa|puchka'],
      ['Samosa Chaat', 7.49, 'v s', 'G D', 'Crushed samosa with chole, yogurt, tamarind and mint chutney.', 'chaat|samosa chaat|samosa'],
      ['Pav Bhaji', 9.99, 'v pop', 'G D', 'Buttery mashed vegetable curry with toasted pav buns.', 'pav bhaji|bhaji'],
      ['Vada Pav (2 pc)', 7.99, 'vg s', 'G', 'Mumbai potato fritter burgers with garlic chutney.', 'vada pav|vada'],
      ['Keema Pav', 11.99, 'h s', 'G D', 'Spiced minced goat with buttered pav.', 'keema|keema pav']
    ] },
    { cat: 'Dhaba Classics', items: [
      ['Chole Bhature', 11.99, 'v pop', 'G D', 'Spicy Punjabi chickpeas with two fluffy fried bhature, pickle and onions.', 'chole|chole bhature|bhature|chana'],
      ['Dhaba Butter Chicken', 16.99, 'h pop gf', 'D N', 'Tandoori chicken in a smoky, buttery tomato gravy.', 'butter chicken'],
      ['Dal Tadka', 11.49, 'vg gf', '', 'Yellow lentils tempered with garlic, cumin and red chili.', 'dal|daal|dal tadka|lentils'],
      ['Paneer Tikka', 13.99, 'v gf s', 'D', 'Char-grilled cottage cheese with peppers and onions.', 'paneer|paneer tikka'],
      ['Tandoori Chicken (half)', 14.99, 'h gf s', 'D', 'Bone-in chicken marinated in yogurt and red chili, roasted in the tandoor.', 'tandoori chicken|tandoori'],
      ['Amritsari Fish', 15.99, 's', 'F G', 'Crispy spiced fish fritters with lemon and chutney.', 'fish|amritsari fish|fish fry'],
      ['Egg Bhurji & Pav', 9.49, 'v s', 'E G D', 'Spicy scrambled eggs with onions and chilies, with pav.', 'egg bhurji|bhurji|anda']
    ] },
    { cat: 'Breads', items: [
      ['Aloo Paratha with White Butter', 6.99, 'v', 'G D', 'Stuffed potato flatbread off the tawa, with homemade makhan.', 'paratha|aloo paratha'],
      ['Butter Naan', 2.99, 'v', 'G D', 'Soft naan from the tandoor with butter.', 'naan|nan'],
      ['Tawa Roti', 1.49, 'vg', 'G', 'Thin whole-wheat roti.', 'roti']
    ] },
    { cat: 'Sweets', items: [
      ['Jalebi with Rabri', 6.49, 'v', 'D G N', 'Hot crispy jalebis with thickened sweet milk.', 'jalebi|rabri'],
      ['Gajar Halwa', 5.99, 'v gf', 'D N', 'Slow-cooked carrot pudding with ghee and nuts.', 'halwa|gajar halwa|carrot halwa']
    ] },
    { cat: 'Chai & Drinks', items: [
      ['Kulhad Chai', 2.99, 'v gf pop', 'D', 'Cardamom-ginger chai served in a clay cup.', 'chai|tea|kulhad'],
      ['Sweet Lassi (tall glass)', 4.99, 'v gf', 'D', 'Thick Punjabi lassi topped with malai.', 'lassi'],
      ['Rooh Afza Milk', 3.99, 'v gf', 'D', 'Chilled rose sherbet milk.', 'rooh afza'],
      ['Thums Up / Coke', 2.49, 'vg gf', '', 'Thums Up, Coke or Sprite.', 'coke|thums up|soda|cola|sprite|soft drink']
    ] },
    { cat: 'Kids', items: [
      ['Kids Cheese Toastie & Fries', 7.99, 'v k', 'G D', 'Bombay-style grilled cheese with masala-free fries.', 'toastie|grilled cheese|kids meal'],
      ['Kids Mango Shake', 3.99, 'v k gf', 'D', 'Small mango milkshake.', 'mango shake']
    ] },
    { cat: 'Deals & Combos', items: [
      ['Truck Driver Thali', 18.99, 'h pop', 'D G', 'Butter chicken, dal tadka, chole, rice, 2 rotis, salad and a chai.', 'thali|truck driver thali'],
      ['Street Food Sampler (for 2)', 19.99, 'v', 'G D', 'Pani puri, samosa chaat, vada pav and pav bhaji to share.', 'sampler|street food sampler'],
      ['Chai & Samosa Combo', 4.99, 'v', 'G D', 'One kulhad chai with a hot samosa — any time of day.', 'chai samosa|chai combo']
    ] }
  ],
  facts: {
    wifi: 'Yes — free Wi-Fi. Network "Dhaba-Guest", password on the chai counter.',
    wheelchair: 'The dining room is step-free with an accessible restroom; the courtyard has a ramp from the back door.',
    pets: 'Dogs are welcome in the courtyard. Service animals are welcome everywhere.',
    dress: 'Totally casual — it is a dhaba!',
    giftcards: 'Yes, we sell gift cards in any amount at the counter.',
    loyalty: 'Buy 9 kulhad chais and the 10th is free — ask for a chai card.',
    alcohol: "We don't serve or allow alcohol — but our kulhad chai and lassi are legendary.",
    cancelPolicy: 'No deposit needed for tables. Courtyard private parties need a $100 refundable deposit, returned with 72 hours\' notice.',
    late: 'We hold tables for 15 minutes — just call {phone} if you are running behind.',
    music: 'Bollywood and Punjabi classics, and cricket matches on the big screen during IPL season.',
    birthday: "Birthdays get a free jalebi plate with a sparkler! You're welcome to bring your own cake.",
    wait: 'Weekend nights from 9 PM to midnight get packed — book the courtyard ahead if you can.',
    discount: 'Our Chai & Samosa Combo ($4.99) and Truck Driver Thali are the best deals. Free delivery over $50 nearby.'
  },
  faqs: [
    ['what is dhaba|dhaba mean|what dhaba', 'A dhaba is a roadside eatery on Indian and Pakistani highways — hearty, fresh, cooked-to-order food for truck drivers and travelers. We bring that vibe to Jackson Heights.'],
    ['chole bhature|what bhature|bhature fried', 'Chole bhature is spicy Punjabi chickpea curry with two big, fluffy fried breads — our most-ordered breakfast and lunch.'],
    ['pani puri|golgappa|how eat pani puri', 'Pani puri comes as a kit: crack the puri, add filling, pour in the mint water and eat in one bite! For delivery we pack the water separately.'],
    ['pani puri delivery|golgappa delivery|puri soggy', 'Yes — we pack the puris, filling and water separately so nothing gets soggy on the way.'],
    ['breakfast|nashta|morning food', 'From opening until noon we serve aloo paratha with white butter, chole bhature and egg bhurji with chai.'],
    ['kulhad|clay cup|chai cup', 'Our chai is served in kulhads — unglazed clay cups that add an earthy aroma. You are welcome to keep the cup!'],
    ['chai sugar|less sugar chai|chai without sugar', 'We can make chai with less sugar, no sugar, or with jaggery on request.'],
    ['late night|after midnight|open late|midnight snack', 'We serve our full menu until closing — midnight Thursday and 2 AM Friday and Saturday.'],
    ['white butter|makhan', 'Our white butter (makhan) is churned in-house every morning — it melts right into a hot paratha.'],
    ['thali|what in thali|truck driver thali', 'The Truck Driver Thali has butter chicken, dal tadka, chole, rice, 2 rotis, salad and a kulhad chai — a full dhaba meal for $18.99.'],
    ['jain|no onion|no garlic', 'Several dishes can be made Jain-style without onion and garlic — dal tadka, paneer tikka and pav bhaji. Just mention it when ordering.'],
    ['fish bone|fish type|what fish', 'Our Amritsari Fish uses boneless swai fillets, marinated in carom seeds and chili before frying.'],
    ['egg|eggetarian|eggs', 'Egg dishes: Egg Bhurji & Pav. Our breads and street snacks are egg-free.'],
    ['fried|oil|frying oil', 'We fry in fresh canola oil changed daily; our bhature and pakoras are fried to order.'],
    ['street food|mumbai|bombay snack', 'Our street food menu is Mumbai-inspired: pav bhaji, vada pav, pani puri and chaats, just like the stalls at Juhu beach.'],
    ['spice level|how spicy chaat|mild chaat', 'Chaats are tangy and medium-spicy; say "less teekha" and we will tone it down.'],
    ['portion|how big|filling', 'Portions are generous, dhaba-style. One thali or chole bhature fills most adults.'],
    ['group|big family|family table', 'Our long family tables seat up to 10 together; for 13 or more, the courtyard makes a great private party.'],
    ['courtyard winter|cold outside|heater', 'The courtyard is covered and heated in winter, with blankets on the charpais.'],
    ['charpai|cot|traditional seating', 'Charpais are traditional woven cots — you sit on them and eat off wooden trays, true highway style.'],
    ['sweets to go|mithai|takeaway sweets', 'Jalebi and gajar halwa are packed hot to go. For boxes of mithai for events, ask about catering.'],
    ['rooh afza|sherbet|rose', 'Rooh Afza is a rose-flavored syrup; we serve it chilled with milk — very refreshing in summer.'],
    ['cricket|ipl|match', 'We show IPL and international cricket on the big screen — book a courtyard table on match nights!'],
    ['fresh|made to order|reheated', 'Everything is cooked to order on the tawa or in the tandoor — nothing sits under a heat lamp.'],
    ['dhaba butter chicken|different butter chicken', 'Ours is smokier than the usual — the chicken is charred in the tandoor first, then finished in a buttery tomato gravy.']
  ]
};

/* ───────────── 3. INDIAN — Masala House ───────────── */
N.indian = {
  id: 'indian', name: 'Masala House', cuisine: 'North & South Indian', icon: 'bowl',
  tagline: 'Modern North & South Indian kitchen with a tandoor and a dosa station.',
  street: '324 E 6th St', city: 'New York', state: 'NY', zip: '10003', phone: '(212) 555-0324', email: 'namaste@masalahouse.nyc',
  hours: { mon: '12:00-15:00,17:00-22:30', tue: '12:00-15:00,17:00-22:30', wed: '12:00-15:00,17:00-22:30', thu: '12:00-15:00,17:00-23:00', fri: '12:00-15:00,17:00-00:00', sat: '11:30-00:00', sun: '11:30-22:00' },
  hoursNote: 'On weekdays we close between lunch and dinner (3–5 PM).',
  tax: 0.08875,
  reservations: { max: 12, last: 60 },
  seating: { options: ['indoor', 'outdoor', 'booth', 'window'], outdoorLabel: 'Garden patio', text: 'We seat 60 inside — velvet booths for 4, tables for 2 to 8, and window tables for two. Our back garden patio seats 24 from May to October.', outdoorNote: 'The garden patio is lit with lanterns — lovely in the evening.' },
  delivery: { zones: [{ zips: ['10003', '10009', '10002', '10012'], fee: 2.49, min: 20 }, { zips: ['10011', '10014', '10010', '10001'], fee: 4.49, min: 30 }], time: '35–50 minutes', mins: 45, pickup: '20 minutes', prep: 20 },
  parking: 'Street parking only on 6th St and 1st Ave; the nearest garage is on E 7th St near Avenue A.',
  directions: 'On "Curry Row" between 1st and 2nd Ave — 2nd Ave F train or Astor Place 6 are a short walk.',
  payments: 'All major cards, Apple Pay, Google Pay and cash. We can split checks by card for up to 6.',
  kids: 'Families are welcome! We have high chairs, crayons and a kids menu with mild butter chicken and a mini dosa.',
  privateEvents: 'Our mezzanine seats 30 for private dinners and can be combined with the garden for up to 55. Set menus from $45 per guest.',
  events: { max: 55, lead: 2 },
  allHalal: false,
  halal: 'Our chicken and lamb are halal-certified, and we never serve pork or beef. Our fish and seafood are not certified but are naturally permissible.',
  veg: 'About half the menu is vegetarian, and dishes marked vegan use coconut milk instead of dairy — dosas, chana masala and dal are great picks.',
  glutenFree: 'Dosas, idli, curries and rice dishes are naturally gluten-free; we mark them GF on the menu.',
  spice: 'Tell us 1 to 5 on our spice scale — our default is a friendly 2. The Goan Fish Curry and Chicken Chettinad lean hot.',
  allergens: 'wheat, dairy, tree nuts, peanuts and mustard',
  best: 'Our Butter Chicken is the house favorite, the Masala Dosa is our pride from the South, and the Lamb Rogan Josh wins every regular over.',
  signature: ['Butter Chicken', 'Masala Dosa', 'Lamb Rogan Josh'],
  catering: { min: 20, max: 350, lead: 4, text: 'We cater office lunches, weddings and parties for 20–350 guests, including live dosa and tandoor stations. Most menus land between $20 and $40 per guest.' },
  noCakes: "We don't bake custom cakes, but you're welcome to bring one (no fee) — or try our Rasmalai with a candle!",
  menu: [
    { cat: 'Starters', items: [
      ['Vegetable Samosa (2 pc)', 6.49, 'v', 'G', 'Potato and pea pastries with tamarind and mint chutneys.', 'samosa|samosas'],
      ['Onion Bhaji', 6.99, 'vg gf', '', 'Crispy onion fritters in chickpea batter.', 'bhaji|onion bhaji|pakora'],
      ['Papadum & Chutney Trio', 4.49, 'vg gf', '', 'Crisp lentil wafers with mango, mint and tamarind chutneys.', 'papadum|papad|poppadom']
    ] },
    { cat: 'Curries', items: [
      ['Butter Chicken', 19.49, 'h pop gf', 'D N', 'Tandoori chicken simmered in a silky tomato, butter and fenugreek sauce.', 'butter chicken|murgh makhani'],
      ['Chicken Tikka Masala', 19.49, 'h gf', 'D', 'Char-grilled chicken tikka in a creamy, spiced tomato-onion masala.', 'tikka masala|ctm|chicken tikka masala'],
      ['Lamb Rogan Josh', 23.99, 'h s gf', 'D', 'Kashmiri slow-braised lamb with red chili, fennel and ginger.', 'rogan josh|lamb curry'],
      ['Goan Fish Curry', 22.49, 's gf', 'F', 'Wild cod in a tangy coconut, kokum and red chili curry.', 'fish curry|goan curry'],
      ['Chana Masala', 15.49, 'vg gf', '', 'Chickpeas in a tangy onion-tomato gravy.', 'chana|chole|chickpeas'],
      ['Paneer Butter Masala', 17.49, 'v gf', 'D N', 'House-made paneer in a rich tomato-cashew gravy.', 'paneer|paneer makhani']
    ] },
    { cat: 'South Indian', items: [
      ['Masala Dosa', 14.49, 'vg gf pop', '', 'A crisp rice-lentil crepe filled with spiced potato, with sambar and coconut chutney.', 'dosa|masala dosa'],
      ['Idli Sambar (3 pc)', 10.49, 'vg gf', '', 'Steamed rice cakes with lentil sambar and chutneys.', 'idli|sambar'],
      ['Chicken Chettinad', 20.49, 'h s gf', '', 'Fiery Tamil-style chicken with black pepper, curry leaves and roasted coconut.', 'chettinad']
    ] },
    { cat: 'Tandoor & Rice', items: [
      ['Tandoori Chicken', 18.99, 'h s gf', 'D', 'Half chicken marinated in yogurt and Kashmiri chili.', 'tandoori chicken|tandoori'],
      ['Hyderabadi Chicken Biryani', 20.99, 'h s gf pop', 'D', 'Dum-cooked basmati and chicken with saffron and fried onions, with raita.', 'biryani|chicken biryani'],
      ['Vegetable Biryani', 17.49, 'v gf', 'D N', 'Seasonal vegetables and basmati, dum-cooked with saffron.', 'veg biryani|vegetable biryani']
    ] },
    { cat: 'Breads', items: [
      ['Butter Naan', 3.99, 'v', 'G D', 'Soft leavened bread from the tandoor.', 'naan|nan'],
      ['Garlic Naan', 4.49, 'v', 'G D', 'Naan with garlic and cilantro.', 'garlic naan'],
      ['Laccha Paratha', 4.99, 'v', 'G D', 'Flaky layered whole-wheat bread.', 'paratha|laccha']
    ] },
    { cat: 'Desserts & Drinks', items: [
      ['Rasmalai', 7.49, 'v gf', 'D N', 'Soft cheese dumplings in saffron-cardamom milk with pistachios.', 'rasmalai|ras malai'],
      ['Gulab Jamun', 6.49, 'v', 'D G', 'Warm milk dumplings in rose syrup.', 'gulab jamun'],
      ['Mango Lassi', 5.99, 'v gf', 'D', 'Yogurt shake with Alphonso mango.', 'lassi'],
      ['Masala Chai', 3.99, 'v gf', 'D', 'Spiced tea with milk.', 'chai|tea'],
      ['Soft Drink', 2.99, 'vg gf', '', 'Coke, Diet Coke, Sprite or ginger ale.', 'coke|soda|diet coke|sprite|soft drink|cola']
    ] },
    { cat: 'Kids', items: [
      ['Kids Butter Chicken & Rice', 11.99, 'h k gf', 'D N', 'Extra-mild butter chicken over rice.', 'kids butter chicken|kids meal'],
      ['Kids Mini Cheese Dosa', 8.99, 'v k gf', 'D', 'Small dosa with melted cheese — no spice.', 'mini dosa|cheese dosa']
    ] },
    { cat: 'Deals & Combos', items: [
      ['Thali for Two', 49.99, 'h pop', 'D G N', 'Butter chicken, rogan josh, chana masala, dal, rice, 2 naan, raita and gulab jamun for two.', 'thali|thali for two'],
      ['Weekday Lunch Thali', 16.99, 'v', 'D G', 'Two curries of the day with rice, naan, raita and dessert — Mon–Fri 12–3 PM.', 'lunch thali|lunch special']
    ] }
  ],
  facts: {
    wifi: 'Yes — free Wi-Fi. The password is on the back of the menu.',
    wheelchair: 'Our dining room and restroom are step-free; the mezzanine is stairs-only.',
    pets: 'Dogs are welcome on the garden patio; service animals everywhere.',
    dress: 'Smart casual is perfect, but there is no strict dress code.',
    giftcards: 'Gift cards are available in any amount, in person or by emailing {email}.',
    loyalty: 'Join our Masala Club at the register — every $200 spent earns a $20 credit.',
    alcohol: 'We have a full bar with Indian beers, wine and spice-inspired cocktails. BYOB is not permitted.',
    cancelPolicy: 'No deposit for tables of up to 8. For 9–12 guests we hold a card and charge $20 per person for no-shows or cancellations within 24 hours.',
    late: 'We hold tables for 15 minutes; after that we may release them on busy nights. Call {phone} and we will try to help.',
    music: 'A mix of Bollywood, Carnatic fusion and lounge — never too loud to talk.',
    birthday: 'Birthdays get a complimentary gulab jamun with a candle. You may bring your own cake with no fee.',
    wait: 'Friday and Saturday 7–9 PM usually have a 30–45 minute wait for walk-ins, so booking is best.',
    discount: 'The Weekday Lunch Thali ($16.99) is our best value, plus 10% off pickup orders placed directly with us.'
  },
  faqs: [
    ['butter chicken vs tikka masala|difference tikka masala|tikka masala butter chicken', 'Butter chicken is milder, buttery and slightly sweet with fenugreek; tikka masala is smokier and more onion-forward with a bit more spice.'],
    ['what is dosa|dosa made|dosa taste', 'A dosa is a thin, crispy crepe made from fermented rice and lentil batter — naturally vegan and gluten-free. Ours is filled with spiced potato.'],
    ['dosa station|live dosa', 'Our open dosa station runs at lunch and all weekend — sit at the counter to watch them being made.'],
    ['idli|what is idli', 'Idli are steamed, fluffy rice-and-lentil cakes from South India, served with sambar and coconut chutney.'],
    ['south indian|north indian|regional', 'Our North Indian side covers tandoor, curries and naan; the South Indian side has dosas, idli and Chettinad dishes.'],
    ['rogan josh|kashmiri', 'Rogan josh is a Kashmiri lamb braise colored by mild Kashmiri chilies — rich, aromatic and medium-spicy.'],
    ['spice scale|1 to 5|scale', 'Our spice scale goes 1 (no heat) to 5 (Indian hot). Most guests enjoy a 2 or 3.'],
    ['vegan curry|coconut milk|dairy free curry', 'Our vegan dishes — chana masala, dal, dosa, idli, onion bhaji — use no dairy or ghee.'],
    ['ghee|butter used', 'Butter and ghee are used in our North Indian curries and naan; South Indian dishes use coconut or sunflower oil.'],
    ['beef|pork', 'We do not serve beef or pork. Our meats are chicken, lamb and fish.'],
    ['thali|what in thali', 'A thali is a platter of several small dishes. Our Thali for Two includes butter chicken, rogan josh, chana masala, dal, rice, naan, raita and gulab jamun.'],
    ['lunch special|lunch thali|lunch deal', 'Weekday Lunch Thali: two curries of the day, rice, naan, raita and dessert for $16.99, Monday–Friday 12–3 PM.'],
    ['cocktail|signature drink|mango margarita', 'Try the Mango Chili Margarita or the Chai Old Fashioned — our bartender\'s favorites.'],
    ['indian beer|kingfisher|taj mahal', 'We pour Kingfisher and Taj Mahal, plus local IPAs that pair nicely with spice.'],
    ['brunch|weekend brunch', 'Weekend brunch runs 11:30 AM–3 PM with dosas, chole bhature and bottomless chai.'],
    ['closed afternoon|3 to 5|between lunch and dinner', 'On weekdays the kitchen closes 3–5 PM between lunch and dinner. Weekends we serve all day.'],
    ['raita|chutney|extra rice', 'Extra raita is $2, extra rice $3, and extra chutneys are free.'],
    ['basmati|rice type', 'We use aged Indian basmati rice for our biryani and plain rice.'],
    ['fresh naan|naan made', 'Naan is slapped onto the tandoor walls to order — it comes to your table puffed and hot.'],
    ['mild dish|not spicy dish|kids dish', 'Butter chicken, paneer butter masala, korma-style sauces and the mini cheese dosa are all very mild.'],
    ['chef|who cooks', 'Chef Priya grew up between Delhi and Chennai — which is why our menu covers both North and South.'],
    ['leftover|reheat|take home', 'We pack leftovers in compostable containers; curries reheat beautifully the next day.'],
    ['diwali|holi|festival', 'For Diwali we run a special festive thali and mithai boxes — follow our Instagram for dates.'],
    ['nut free curry|cashew|nuts in curry', 'Butter chicken, paneer butter masala, vegetable biryani and rasmalai contain cashews or pistachios. Chana masala, dal and dosas are made without nuts.'],
    ['order online|order here|how order', 'You can order right here — just type what you would like, e.g. "2 butter chicken and 2 garlic naan for pickup".']
  ]
};

/* ───────────── 4. CHINESE — Golden Dragon ───────────── */
N.chinese = {
  id: 'chinese', name: 'Golden Dragon', cuisine: 'Cantonese & Sichuan', icon: 'noodles',
  tagline: 'Cantonese classics, Sichuan heat and hand-folded dumplings since 1998.',
  street: '48 Mott St', city: 'New York', state: 'NY', zip: '10013', phone: '(212) 555-0048', email: 'orders@goldendragonnyc.com',
  hours: { mon: '11:00-22:30', tue: '11:00-22:30', wed: '11:00-22:30', thu: '11:00-22:30', fri: '11:00-00:00', sat: '10:30-00:00', sun: '10:30-22:00' },
  hoursNote: 'Dim sum carts roll on weekends from 10:30 AM to 3 PM.',
  tax: 0.08875,
  reservations: { max: 12, last: 60 },
  seating: { options: ['indoor', 'booth'], text: 'We have two floors: the ground floor has booths and tables for 2–6, and upstairs has big round tables with lazy susans for 8–12. No outdoor seating, sorry!', noOutdoor: "We don't have outdoor seating, I'm afraid — but our upstairs round tables by the windows are lovely." },
  delivery: { zones: [{ zips: ['10013', '10002', '10038', '10007'], fee: 1.99, min: 15 }, { zips: ['10012', '10003', '10004', '10006', '10282'], fee: 3.99, min: 25 }], time: '30–45 minutes', mins: 40, pickup: '15 minutes', prep: 15, note: 'Orders over $60 get a free order of spring rolls.' },
  parking: 'Parking is tight in Chinatown — the Mott St garage (between Canal & Bayard) gives 2 hours at a discount with your receipt.',
  directions: 'Just south of Canal St — Canal St station (6, J, Z, N, Q, R, W) is 3 minutes away.',
  payments: 'Cash, all major cards, Apple Pay, Google Pay, WeChat Pay and Alipay.',
  kids: 'Great for families — high chairs, kids chopsticks, and a sweet honey chicken kids meal.',
  privateEvents: 'Our upstairs banquet room seats 80 at round tables — perfect for weddings, birthdays and Lunar New Year banquets. Banquet menus from $48 per guest.',
  events: { max: 80, lead: 3 },
  allHalal: false,
  halal: "We're not halal certified — we cook with pork and use shared woks. Our vegetarian dishes and seafood contain no pork, but we can't guarantee separation.",
  veg: 'Plenty for vegetarians: mapo tofu (made with mushrooms on request), vegetable chow mein, garlic green beans, spring rolls and veggie dumplings.',
  glutenFree: 'We can make fried rice, steamed dishes and some stir-fries with gluten-free tamari — but soy sauce with wheat is used throughout the kitchen.',
  spice: 'Sichuan dishes (marked spicy) bring real heat and numbing peppercorns; Cantonese dishes are mild. We can tone down any dish.',
  allergens: 'wheat, soy, peanuts, sesame, shellfish and egg',
  best: 'Our Peking Duck is the showstopper, the Pork & Chive Dumplings are hand-folded daily, and the General Tso\'s Chicken is the crowd favorite.',
  signature: ['Peking Duck (half)', 'Pork & Chive Dumplings (8 pc)', "General Tso's Chicken"],
  catering: { min: 20, max: 500, lead: 3, text: 'Yes — we cater banquets and parties for 20–500 guests with family-style trays, dumpling stations and whole roast duck. Budget about $18–$45 per guest.' },
  noCakes: "We don't make custom cakes, but you're welcome to bring your own — and our mango pudding and sesame balls are lovely for celebrations.",
  menu: [
    { cat: 'Dim Sum & Starters', items: [
      ['Pork & Chive Dumplings (8 pc)', 9.99, 'pop', 'G S SE', 'Hand-folded dumplings, pan-fried or steamed, with black vinegar.', 'dumplings|dumpling|pork dumplings|potstickers'],
      ['Vegetable Dumplings (8 pc)', 8.99, 'vg', 'G S SE', 'Bok choy, mushroom and glass noodle dumplings.', 'veggie dumplings|veg dumplings'],
      ['Vegetable Spring Rolls (3 pc)', 5.99, 'vg', 'G S', 'Crispy rolls with cabbage, carrot and mushroom.', 'spring roll|spring rolls|egg roll'],
      ['Crab Rangoon (6 pc)', 8.49, '', 'G D SH E', 'Crispy wontons with crab and cream cheese.', 'rangoon|crab rangoon'],
      ['Hot & Sour Soup', 5.49, 's', 'G S E', 'Tofu, bamboo, mushroom and egg in a peppery broth.', 'hot and sour|hot sour soup|soup'],
      ['Wonton Soup', 6.49, '', 'G S SH E', 'Shrimp and pork wontons in clear chicken broth.', 'wonton|wonton soup']
    ] },
    { cat: 'Mains', items: [
      ["General Tso's Chicken", 16.99, 's pop', 'G S E', 'Crispy chicken in a sweet, tangy chili glaze.', 'general tso|general tsos|general tso chicken'],
      ['Kung Pao Chicken', 16.49, 's', 'P S G', 'Wok-fried chicken with peanuts, dried chilies and Sichuan pepper.', 'kung pao'],
      ['Orange Chicken', 16.49, '', 'G S E', 'Crispy chicken in a bright orange glaze.', 'orange chicken'],
      ['Beef with Broccoli', 17.99, '', 'S G', 'Tender flank steak and broccoli in oyster sauce.', 'beef broccoli|beef and broccoli'],
      ['Sweet & Sour Pork', 16.49, '', 'G S E', 'Crispy pork with pineapple and peppers.', 'sweet and sour|sweet sour pork'],
      ['Mapo Tofu', 14.99, 's', 'S', 'Silken tofu in fiery chili-bean sauce with minced pork (vegetarian on request).', 'mapo|tofu'],
      ['Peking Duck (half)', 34.99, 'pop', 'G S SE', 'Crispy roast duck with pancakes, scallions, cucumber and hoisin.', 'peking duck|duck|roast duck'],
      ['Garlic Green Beans', 12.99, 'vg', 'S', 'Blistered green beans with garlic.', 'green beans|string beans']
    ] },
    { cat: 'Noodles & Rice', items: [
      ['Shrimp Lo Mein', 15.99, '', 'G S SH E', 'Soft egg noodles tossed with shrimp and vegetables.', 'lo mein|shrimp lo mein'],
      ['Vegetable Chow Mein', 12.99, 'v', 'G S E', 'Crispy pan-fried noodles with mixed vegetables.', 'chow mein|veg noodles'],
      ['Dan Dan Noodles', 13.99, 's', 'G S SE P', 'Sichuan noodles with spicy pork, sesame paste and crushed peanuts.', 'dan dan'],
      ['Yangzhou Fried Rice', 13.99, '', 'S E SH', 'Egg fried rice with shrimp, char siu and peas.', 'fried rice|yangzhou|house fried rice'],
      ['Egg Fried Rice', 8.99, 'v', 'E S', 'Simple wok-fried rice with egg and scallion.', 'egg fried rice']
    ] },
    { cat: 'Desserts & Drinks', items: [
      ['Mango Pudding', 5.49, 'v gf', 'D', 'Silky mango pudding with evaporated milk.', 'mango pudding|pudding'],
      ['Sesame Balls (4 pc)', 5.99, 'vg', 'G SE', 'Glutinous rice balls with red bean, rolled in sesame.', 'sesame balls|jian dui'],
      ['Brown Sugar Bubble Tea', 5.99, 'v', 'D', 'Milk tea with brown-sugar tapioca pearls.', 'bubble tea|boba|milk tea'],
      ['Jasmine Tea (pot)', 3.49, 'vg gf', '', 'Fragrant jasmine green tea.', 'tea|jasmine tea|green tea'],
      ['Soft Drink', 2.49, 'vg gf', '', 'Coke, Diet Coke, Sprite or ginger ale.', 'coke|soda|sprite|soft drink|cola']
    ] },
    { cat: 'Kids', items: [
      ['Kids Honey Chicken & Rice', 9.99, 'k', 'G S E', 'Lightly crispy chicken with honey glaze and white rice.', 'honey chicken|kids meal']
    ] },
    { cat: 'Deals & Combos', items: [
      ['Family Dinner for 4', 69.99, 'pop', 'G S E SE', 'Hot & sour soup for 4, dumplings, General Tso\'s, beef with broccoli, lo mein and fried rice.', 'family dinner|family meal|dinner for 4'],
      ['Lunch Special', 11.99, '', 'G S E', 'Any main with egg fried rice and a spring roll — Mon–Fri 11 AM–3 PM.', 'lunch special|lunch combo']
    ] }
  ],
  facts: {
    wifi: 'Yes, free Wi-Fi — network "GoldenDragon", password on your receipt.',
    wheelchair: 'The ground floor and restroom are wheelchair accessible; the banquet room is up one flight with a chair lift.',
    pets: 'Only service animals are allowed inside — we have no outdoor seating.',
    dress: 'Casual — no dress code.',
    giftcards: 'Red-envelope gift cards are available at the front desk in any amount.',
    loyalty: 'Every $10 spent earns a stamp; 10 stamps gets you a free Peking Duck half!',
    alcohol: 'We serve Tsingtao, plum wine and a few classic cocktails. Corkage for your own wine is $20 a bottle.',
    cancelPolicy: 'No deposit for tables. Banquet bookings need a 25% deposit, refundable up to 7 days before.',
    late: 'We hold tables for 15 minutes — on weekends please call {phone} if you are running late.',
    music: 'Soft instrumental music; the banquet room has a projector and microphone for speeches and karaoke.',
    birthday: 'Birthday guests get free longevity buns! You are welcome to bring a cake, no cutting fee.',
    wait: 'Weekend dim sum (10:30 AM–1 PM) often has a line — book ahead or come after 1:30 PM.',
    discount: 'Our $11.99 Lunch Special and the Family Dinner for 4 are the best value. Free spring rolls on delivery orders over $60.'
  },
  faqs: [
    ['dim sum|dim sum cart|yum cha', 'Dim sum carts roll through the dining room on Saturday and Sunday from 10:30 AM to 3 PM — har gow, siu mai, cheung fun and more.'],
    ['peking duck order ahead|duck ready|whole duck', 'Our half Peking Duck is available daily; for a whole duck (serves 4–6, $64.99), please order 24 hours ahead.'],
    ['msg', 'We do not add MSG to our dishes, though some sauces like oyster sauce naturally contain glutamates.'],
    ['sichuan pepper|numbing|mala', 'Sichuan peppercorns give a tingly, numbing sensation rather than pure heat — you will find them in the kung pao, mapo tofu and dan dan noodles.'],
    ['kung pao peanut|peanuts kung pao', 'Yes, kung pao chicken contains peanuts, and so do the dan dan noodles. Please tell our staff about any peanut allergy.'],
    ['general tso|what is general tso', 'General Tso\'s is crispy fried chicken tossed in a sweet, tangy and gently spicy chili glaze — our most-ordered dish.'],
    ['steamed|healthy option|less oil', 'Ask for any main "steamed with sauce on the side" — we do this for chicken, shrimp and vegetables.'],
    ['brown rice|white rice', 'We serve white jasmine rice; brown rice is available for $1 extra.'],
    ['chopsticks|fork', 'Chopsticks and forks are both on every table — use whatever you like!'],
    ['lunar new year|chinese new year', 'For Lunar New Year we serve a festive banquet menu with whole fish, longevity noodles and dumplings — book early, it fills up weeks ahead.'],
    ['round table|lazy susan|big table', 'Upstairs round tables with lazy susans seat 8–12 — ideal for family-style sharing.'],
    ['family style|share|sharing', 'Everything is served family style — we suggest one dish per person plus rice or noodles.'],
    ['how many dumplings|dumpling portion', 'Dumplings come 8 to an order; two orders make a nice starter for four people.'],
    ['frozen dumplings|dumplings to go|raw dumplings', 'Yes! Bags of 30 frozen dumplings to cook at home are $22 — ask at the counter.'],
    ['boba|bubble tea|tapioca', 'Our bubble tea is brown-sugar milk tea with fresh tapioca pearls; ask for oat milk to make it dairy-free.'],
    ['lo mein vs chow mein|difference noodles', 'Lo mein is soft, tossed egg noodles; chow mein is pan-fried until crispy.'],
    ['vegetarian mapo|mapo tofu vegetarian', 'We can make mapo tofu vegetarian with shiitake mushrooms instead of pork — just ask.'],
    ['spicy level|mild sichuan|less spicy', 'Say "mild" and we will halve the chilies; all Cantonese dishes are already mild.'],
    ['oyster sauce|fish sauce|shellfish sauce', 'Oyster sauce (contains shellfish) is used in beef with broccoli and several stir-fries — let us know about shellfish allergies.'],
    ['since 1998|history|family owned', 'Golden Dragon has been family-run since 1998 — the dumplings are still folded by Grandma Lin\'s recipe.'],
    ['large order|party order|office order', 'For 20+ people our catering trays are the way to go — I can take a catering request.'],
    ['fortune cookie', 'Of course — every order comes with fortune cookies!'],
    ['tea free|free tea|hot tea', 'A pot of hot jasmine tea is complimentary with dine-in meals.'],
    ['sauce side|extra sauce|chili oil', 'Our house chili oil and extra sauces are free — just ask.'],
    ['gluten free soy|tamari', 'We keep gluten-free tamari and can make fried rice, steamed dishes and green beans with it on request.']
  ]
};

/* ───────────── 5. PIZZA — Napoli Pizza & Pasta ───────────── */
N.pizza = {
  id: 'pizza', name: 'Napoli Pizza & Pasta', cuisine: 'Neapolitan pizza & Italian pasta', icon: 'pizza',
  tagline: 'Wood-fired Neapolitan pizza and fresh pasta in the heart of Brooklyn.',
  street: '219 Court St', city: 'Brooklyn', state: 'NY', zip: '11201', phone: '(718) 555-0219', email: 'ciao@napolipizza.nyc',
  hours: { mon: '12:00-22:00', tue: '12:00-22:00', wed: '12:00-22:00', thu: '12:00-22:30', fri: '12:00-23:30', sat: '11:30-23:30', sun: '11:30-21:30' },
  hoursNote: 'The oven stays hot until 11:30 PM on Fridays and Saturdays.',
  tax: 0.08875,
  reservations: { max: 12, last: 45 },
  seating: { options: ['indoor', 'outdoor', 'bar'], outdoorLabel: 'Court St sidewalk tables', text: 'We seat 50 inside at tables for 2–6, plus 8 counter seats facing the wood-fired oven. Out front we have 7 sidewalk tables from April to October.', outdoorNote: 'Sidewalk tables are first come on warm evenings, so I\'ll note your request.' },
  delivery: { zones: [{ zips: ['11201', '11231', '11217', '11242'], fee: 2.49, min: 18 }, { zips: ['11215', '11238', '11205', '11251'], fee: 3.99, min: 28 }], time: '30–45 minutes', mins: 40, pickup: '15–20 minutes', prep: 15, note: 'Pizzas travel in vented boxes so the crust stays crisp.' },
  parking: 'Metered parking on Court St and free side-street parking after 7 PM. There is a garage on Atlantic Ave, 3 blocks north.',
  directions: 'Between Baltic and Warren St — Bergen St (F, G) is a 4-minute walk.',
  payments: 'All major cards, Apple Pay, Google Pay and cash. Split checks are fine.',
  kids: 'Kids love it here! High chairs, crayons, a kids cheese pizza, and they can watch the pizzaiolo toss dough at the counter.',
  privateEvents: 'Our back room seats 30 for birthdays and team dinners, with a pizza-making class option for groups of 10–20. Party packages start at $32 per guest.',
  events: { max: 45, lead: 2 },
  allHalal: false,
  halal: "We're not halal — our pepperoni and pancetta are pork. Our margherita, veggie and seafood dishes contain no meat, but they're cooked in the same oven.",
  veg: 'Lots of vegetarian options: margherita, quattro formaggi, the veggie garden pizza and most of our pastas. Ask for vegan cheese on any pizza (+$2).',
  glutenFree: 'We offer a 10" gluten-free crust (+$3) baked on a separate tray, but it shares our oven, so it is not safe for celiac disease.',
  spice: 'Only the Diavola (spicy salami and Calabrian chili) is truly spicy. Chili flakes and hot honey are always on the table.',
  allergens: 'wheat, dairy, egg and tree nuts (pesto)',
  best: 'The Margherita is our pride — San Marzano tomatoes, fior di latte, basil, 90 seconds in a 900°F oven. The Diavola and the Penne alla Vodka are close behind.',
  signature: ['Margherita', 'Diavola', 'Penne alla Vodka'],
  catering: { min: 20, max: 300, lead: 3, text: 'We cater with party trays of pasta, salads and pizzas, or bring our mobile wood-fired oven to your event for 40+ guests. Usually $15–$35 per guest.' },
  noCakes: "We don't make custom cakes, but you're welcome to bring one — no cake fee — and our tiramisu or cannoli make great birthday treats.",
  menu: [
    { cat: 'Pizzas (14")', items: [
      ['Margherita', 17.00, 'v pop', 'G D', 'San Marzano tomato, fior di latte, basil, extra-virgin olive oil.', 'margherita|margarita|cheese pizza|plain pizza'],
      ['Pepperoni', 19.00, 'pop', 'G D', 'Tomato, mozzarella and crispy cup-and-char pepperoni.', 'pepperoni|peperoni'],
      ['Diavola', 20.00, 's', 'G D', 'Spicy salami, Calabrian chili, tomato and mozzarella.', 'diavola|spicy pizza'],
      ['Quattro Formaggi', 20.00, 'v', 'G D', 'Mozzarella, gorgonzola, fontina and parmigiano — no tomato.', 'four cheese|quattro formaggi|4 cheese'],
      ['Veggie Garden', 19.00, 'v', 'G D', 'Roasted peppers, mushrooms, olives, red onion and spinach.', 'veggie pizza|vegetable pizza|veggie'],
      ['BBQ Chicken', 21.00, '', 'G D', 'Smoky BBQ sauce, roast chicken, red onion and cilantro.', 'bbq chicken|chicken pizza'],
      ['Gluten-Free Margherita (10")', 18.00, 'v gf', 'D', 'Our margherita on a 10" gluten-free crust.', 'gluten free pizza|gf pizza']
    ] },
    { cat: 'Starters & Salads', items: [
      ['Garlic Knots (6 pc)', 6.00, 'v', 'G D', 'Pizza dough knots with garlic butter and parmesan, with marinara.', 'garlic knots|knots|garlic bread'],
      ['Burrata', 14.00, 'v gf', 'D', 'Creamy burrata with heirloom tomatoes, basil and olive oil.', 'burrata'],
      ['Arancini (3 pc)', 10.00, 'v', 'G D E', 'Crispy risotto balls with mozzarella centers.', 'arancini|rice balls'],
      ['Caesar Salad', 12.00, '', 'D E F G', 'Romaine, parmesan, croutons and anchovy dressing.', 'caesar|salad']
    ] },
    { cat: 'Pasta', items: [
      ['Penne alla Vodka', 18.00, 'v pop', 'G D', 'Creamy tomato-vodka sauce with parmigiano.', 'vodka|penne|vodka pasta'],
      ['Spaghetti Carbonara', 19.00, '', 'G D E', 'Guanciale, egg yolk, pecorino and black pepper.', 'carbonara'],
      ['Beef Lasagna', 21.00, 'pop', 'G D E', 'Layers of fresh pasta, beef ragù, béchamel and mozzarella.', 'lasagna|lasagne'],
      ['Fettuccine Alfredo', 17.00, 'v', 'G D E', 'Fresh fettuccine in a butter-parmesan cream.', 'alfredo|fettuccine'],
      ['Chicken Parm Hero', 15.00, '', 'G D E', 'Breaded chicken cutlet, marinara and mozzarella on a seeded roll.', 'chicken parm|chicken parmesan|hero|sandwich']
    ] },
    { cat: 'Desserts & Drinks', items: [
      ['Tiramisu', 9.00, 'v', 'G D E', 'Espresso-soaked ladyfingers with mascarpone.', 'tiramisu'],
      ['Cannoli (2 pc)', 8.00, 'v', 'G D N', 'Crisp shells with sweet ricotta and pistachio.', 'cannoli|cannolis'],
      ['San Pellegrino', 3.50, 'vg gf', '', 'Sparkling water or Aranciata.', 'pellegrino|sparkling water'],
      ['Coca-Cola', 3.00, 'vg gf', '', 'Coke, Diet Coke or Sprite.', 'coke|soda|cola|diet coke|sprite|soft drink']
    ] },
    { cat: 'Kids', items: [
      ['Kids Cheese Pizza (8")', 9.00, 'v k', 'G D', 'Little pizza with tomato and mozzarella.', 'kids pizza'],
      ['Kids Butter Spaghetti', 8.00, 'v k', 'G D', 'Spaghetti with butter and parmesan (or marinara).', 'kids pasta|kids spaghetti']
    ] },
    { cat: 'Deals & Combos', items: [
      ['Pizza Party Deal', 42.00, 'pop', 'G D', 'Any 2 pizzas, garlic knots and a 2-liter soda.', 'party deal|pizza deal|2 pizza deal'],
      ['Lunch Slice Deal', 9.50, '', 'G D', '2 slices (cheese or pepperoni) and a soda — weekdays 12–4 PM.', 'slice deal|lunch deal|slice|slices']
    ] }
  ],
  facts: {
    wifi: 'Yes — free Wi-Fi, network "Napoli-Guest", password "margherita".',
    wheelchair: 'Yes, step-free entrance and an accessible restroom.',
    pets: 'Dogs are welcome at our sidewalk tables, and we keep a water bowl out front.',
    dress: 'Totally casual.',
    giftcards: 'Yes! Gift cards are available at the register in any amount.',
    loyalty: 'Our pizza card: buy 9 pizzas and the 10th is free.',
    alcohol: 'We pour Italian wines by the glass, Peroni and local craft beer. Corkage is $15 per bottle if you bring your own wine.',
    cancelPolicy: 'No deposit for tables. For private room bookings we ask for 48 hours\' notice to cancel.',
    late: 'We hold tables for 15 minutes — just give us a call at {phone} if you\'re running late.',
    music: 'Italian classics and jazz; we put big soccer matches on the TV at the bar.',
    birthday: 'Birthday guests get a free cannoli with a candle! You can bring your own cake — no fee.',
    wait: 'Friday and Saturday 7–9 PM usually means a 20–40 minute wait for walk-ins.',
    discount: 'The Lunch Slice Deal ($9.50) and Pizza Party Deal ($42) are the best value. Tuesday is 20% off pasta for pickup.'
  },
  faqs: [
    ['pizza size|how big pizza|what size|large pizza|small pizza', 'All our pizzas are 14 inches — about 6 slices, enough for one hungry adult or two lighter eaters. The gluten-free pizza is 10".'],
    ['slices|how many slices|by the slice', 'Each 14" pie is cut into 6 slices. We sell single slices only with the weekday Lunch Slice Deal.'],
    ['neapolitan|what neapolitan|wood fired', 'Neapolitan pizza has a thin center and puffy, blistered crust, baked for about 90 seconds in our 900°F wood-fired oven.'],
    ['dough|how dough made|fermented', 'Our dough is made daily with Italian 00 flour and fermented for 48 hours for flavor and digestibility.'],
    ['half and half|two toppings half|split pizza', 'Yes — we can do half-and-half on any 14" pizza; you pay for the pricier half.'],
    ['extra topping|add topping|toppings', 'Extra toppings are $2–$4: mushrooms, olives, onions, peppers, sausage, pepperoni, prosciutto, anchovies or extra cheese.'],
    ['vegan cheese|dairy free pizza|vegan pizza', 'We can make any veggie pizza with plant-based mozzarella for +$2.'],
    ['celiac|gluten free safe|cross contamination', 'Our gluten-free crust is baked on its own tray but in the same oven, so we can\'t call it safe for celiac disease.'],
    ['crispy|well done|charred', 'Want it extra crispy? Ask for "well done" — we\'ll leave it in the oven a little longer.'],
    ['pasta fresh|homemade pasta|fresh pasta', 'Our fettuccine and lasagna sheets are made fresh in-house every morning; penne and spaghetti are imported from Gragnano.'],
    ['vodka sauce alcohol|vodka alcohol', 'The vodka cooks off in the sauce, leaving just a creamy, slightly sweet tomato flavor.'],
    ['carbonara cream|real carbonara', 'Our carbonara is the Roman way — egg yolk, pecorino, guanciale and pepper. No cream!'],
    ['pepperoni pork|pepperoni beef|beef pepperoni', 'Our pepperoni is pork and beef. We don\'t have a turkey or halal pepperoni.'],
    ['pizza class|make pizza|pizza making', 'Pizza-making classes run for private groups of 10–20 in our back room — $55 per person including dinner.'],
    ['reheat|leftover pizza|next day', 'Reheat leftover pizza in a hot skillet for 2 minutes with a lid — way better than the microwave.'],
    ['ranch|dipping sauce|hot honey', 'Dipping sauces are $1: marinara, ranch, garlic butter or Mike\'s hot honey.'],
    ['mobile oven|oven truck|pizza truck', 'Our mobile wood-fired oven comes to events of 40+ guests — ask me for a catering quote.'],
    ['gorgonzola|blue cheese', 'Gorgonzola is only on the Quattro Formaggi; we can swap it for extra mozzarella.'],
    ['anchovy|anchovies|fish', 'Anchovies are in our Caesar dressing and available as a pizza topping — no other fish on the menu.'],
    ['tiramisu alcohol|tiramisu coffee', 'Our tiramisu has espresso and a splash of marsala wine.'],
    ['large order|20 pizzas|office pizza', 'For big pizza orders (10+ pies) please give us 2 hours\' notice, or let me start a catering request.'],
    ['sauce|san marzano|tomato', 'Our sauce is just crushed San Marzano tomatoes, sea salt and basil — nothing else.'],
    ['cheese type|mozzarella|fior di latte', 'We use fresh fior di latte on the margherita and aged low-moisture mozzarella on the New York–style toppings.'],
    ['nut|pesto', 'Our pesto (on request) contains pine nuts, and the cannoli has pistachio. Other dishes are nut-free recipes.'],
    ['slice deal time|lunch hours slice', 'The Lunch Slice Deal runs Monday–Friday from noon to 4 PM.']
  ]
};

/* ───────────── 6. BURGERS — Stack'd Burgers ───────────── */
N.burgers = {
  id: 'burgers', name: "Stack'd Burgers", cuisine: 'Smash burgers & shakes', icon: 'burger',
  tagline: 'Smash burgers, crispy chicken and thick shakes, made to order.',
  street: '118 N 6th St', city: 'Brooklyn', state: 'NY', zip: '11249', phone: '(718) 555-0118', email: 'hey@stackdburgers.com',
  hours: { mon: '11:30-22:00', tue: '11:30-22:00', wed: '11:30-22:00', thu: '11:30-23:00', fri: '11:30-02:00', sat: '11:00-02:00', sun: '11:00-22:00' },
  hoursNote: 'Late-night burgers until 2 AM on Fridays and Saturdays.',
  tax: 0.08875,
  reservations: { max: 12, last: 30 },
  seating: { options: ['indoor', 'outdoor', 'booth', 'bar'], outdoorLabel: 'Back patio', text: 'We have 12 booths for 4, high-tops and a counter overlooking the grill, plus a back patio with picnic tables for 30 (open March–November).', outdoorNote: 'The back patio has picnic tables and string lights.' },
  delivery: { zones: [{ zips: ['11249', '11211', '11222'], fee: 1.99, min: 15 }, { zips: ['11206', '11237', '11101', '11205'], fee: 3.49, min: 25 }], time: '25–40 minutes', mins: 35, pickup: '12–15 minutes', prep: 15, note: 'Fries travel in vented bags so they stay crispy.' },
  parking: 'Street parking on N 6th and Wythe; the Wythe Ave garage is one block away.',
  directions: 'Between Berry St and Wythe Ave — Bedford Av (L train) is a 5-minute walk.',
  payments: 'Card-free? No problem — we take all cards, Apple Pay, Google Pay and cash.',
  kids: 'Super kid friendly — kids meals come with fries, a drink and a toy, and we have high chairs and booster seats.',
  privateEvents: 'The back patio can be booked for parties of up to 40 with a burger bar package from $28 per guest.',
  events: { max: 40, lead: 2 },
  allHalal: false,
  halal: 'Our beef is not halal certified, but we offer halal-certified crispy chicken on request — it is cooked on the same grill, so we can\'t guarantee full separation.',
  veg: 'Swap any burger to a Beyond patty (vegan) for no extra cost; our fries, onion rings and sweet potato fries are vegan (shared fryer).',
  glutenFree: 'Any burger can come on a gluten-free bun (+$1.50) or lettuce wrap. Our fries share a fryer with breaded items.',
  spice: 'The Nashville Hot Chicken comes mild, medium, hot or "cluck no" — and the Jalapeño Popper Burger has a kick.',
  allergens: 'wheat, dairy, egg, soy and sesame',
  best: 'The Double Stack is our classic — two smashed patties, American cheese and Stack\'d sauce. The Nashville Hot Chicken and the Oreo Shake have a cult following.',
  signature: ['Double Stack', 'Nashville Hot Chicken Sandwich', 'Oreo Shake'],
  catering: { min: 20, max: 250, lead: 3, text: 'We do burger bars, slider platters and our food truck for parties of 20–250 guests, around $16–$30 per guest.' },
  noCakes: "We don't make cakes, but you're welcome to bring one! Our shakes with a candle are a birthday favorite.",
  menu: [
    { cat: 'Burgers', items: [
      ['Classic Stack', 11.99, 'pop', 'G D E SE', 'Single smashed patty, American cheese, pickles, onions and Stack\'d sauce on a potato bun.', 'classic|classic burger|cheeseburger|burger|burgers'],
      ['Double Stack', 14.99, 'pop', 'G D E SE', 'Two smashed patties, double cheese, pickles and Stack\'d sauce.', 'double stack|double|double burger'],
      ['Bacon Jam Burger', 15.99, '', 'G D E SE', 'Double patty, cheddar, sweet-smoky bacon jam and crispy onions.', 'bacon burger|bacon jam'],
      ['Smokehouse BBQ Burger', 15.49, '', 'G D E SE', 'Double patty, pepper jack, BBQ sauce and onion rings.', 'bbq burger|smokehouse'],
      ['Mushroom Swiss Burger', 14.49, '', 'G D E SE', 'Double patty, Swiss cheese and garlic mushrooms.', 'mushroom burger|mushroom swiss'],
      ['Jalapeño Popper Burger', 15.49, 's', 'G D E SE', 'Double patty, cream cheese, pickled jalapeños and pepper jack.', 'jalapeno burger|popper burger'],
      ['Beyond Stack', 14.99, 'vg', 'G S SE', 'Plant-based Beyond patty, vegan cheese, lettuce, tomato and vegan sauce.', 'beyond|vegan burger|veggie burger|beyond burger|plant burger']
    ] },
    { cat: 'Chicken', items: [
      ['Nashville Hot Chicken Sandwich', 13.99, 's pop', 'G D E', 'Crispy thigh in Nashville hot oil, slaw and pickles.', 'nashville|hot chicken|spicy chicken sandwich'],
      ['Crispy Chicken Sandwich', 12.99, '', 'G D E', 'Buttermilk-fried thigh, lettuce, pickles and mayo.', 'chicken sandwich|crispy chicken'],
      ['Wings (8 pc)', 12.99, 's gf', 'D', 'Buffalo, BBQ or garlic parm wings with blue cheese dip.', 'wings|chicken wings|buffalo wings']
    ] },
    { cat: 'Sides', items: [
      ['Fries', 4.49, 'vg', '', 'Skin-on fries with sea salt.', 'fries|french fries|chips'],
      ['Truffle Parm Fries', 6.99, 'v', 'D', 'Fries with truffle oil, parmesan and parsley.', 'truffle fries'],
      ['Sweet Potato Fries', 5.49, 'vg', '', 'With chipotle mayo.', 'sweet potato fries'],
      ['Onion Rings', 5.49, 'v', 'G D E', 'Beer-battered onion rings.', 'onion rings|rings'],
      ['Mac & Cheese Bites (6 pc)', 6.99, 'v', 'G D E', 'Crispy fried mac & cheese.', 'mac and cheese|mac bites']
    ] },
    { cat: 'Shakes & Drinks', items: [
      ['Oreo Shake', 7.49, 'v pop', 'G D S', 'Vanilla custard blended with Oreos.', 'oreo shake|cookies and cream shake'],
      ['Classic Shake', 6.49, 'v gf', 'D', 'Vanilla, chocolate or strawberry.', 'shake|milkshake|vanilla shake|chocolate shake|strawberry shake'],
      ['Fresh Lemonade', 3.99, 'vg gf', '', 'Squeezed daily.', 'lemonade'],
      ['Fountain Soda', 2.99, 'vg gf', '', 'Coke, Diet Coke, Sprite, root beer.', 'coke|soda|sprite|root beer|soft drink|cola|pop']
    ] },
    { cat: 'Kids', items: [
      ['Kids Cheeseburger Meal', 8.99, 'k', 'G D E', 'Mini cheeseburger, small fries, drink and a toy.', 'kids burger|kids meal'],
      ['Kids Tenders Meal', 8.99, 'k', 'G D E', 'Three chicken tenders, small fries, drink and a toy.', 'tenders|chicken tenders|kids tenders']
    ] },
    { cat: 'Deals & Combos', items: [
      ['Stack\'d Combo', 18.99, 'pop', 'G D E SE', 'Any burger or chicken sandwich + fries + fountain drink.', 'combo|meal deal|burger combo'],
      ['Family Box', 49.99, '', 'G D E SE', '4 Classic Stacks, 2 large fries, 8 wings and 4 drinks.', 'family box|family deal']
    ] }
  ],
  facts: {
    wifi: 'Yes, free Wi-Fi — "Stackd-Guest", no password.',
    wheelchair: 'Yes, step-free entry, wide aisles and an accessible restroom.',
    pets: 'Dogs are welcome on the back patio — we even have a "pup patty" for $3.',
    dress: 'Come as you are!',
    giftcards: 'Gift cards are available in store in any amount.',
    loyalty: 'Download the Stack\'d app to earn 1 point per dollar — 100 points gets a free burger.',
    alcohol: 'We have local craft beers on tap and boozy shakes for 21+ (ID required).',
    cancelPolicy: 'No deposit for regular tables. Patio parties need 48 hours\' notice to cancel.',
    late: 'We hold tables for 10 minutes on busy nights — call {phone} if you\'re running behind.',
    music: 'Classic rock and hip-hop, plus big games on our TVs.',
    birthday: 'Birthday guests get a free classic shake with a candle! Outside cakes are welcome.',
    wait: 'Friday and Saturday nights 7–10 PM get busy; the counter usually moves fastest.',
    discount: 'The Stack\'d Combo ($18.99) saves you about $4, and Mondays are $2 off all shakes.'
  },
  faqs: [
    ['smash burger|what is smash|smashed', 'A smash burger is a ball of fresh beef smashed thin on a screaming-hot griddle — it gets crispy, lacy edges and tons of flavor.'],
    ['beef|what beef|beef quality|grass fed', 'We use a fresh (never frozen) chuck and brisket blend from a New York butcher, ground daily.'],
    ['cook burger|medium rare|how cooked|pink', 'Smash patties are thin and always cooked through with a crispy crust — we don\'t do medium-rare.'],
    ['stackd sauce|secret sauce|special sauce', 'Stack\'d sauce is our tangy, creamy house sauce with pickles and a touch of smoked paprika.'],
    ['bun|potato bun|brioche', 'We use soft Martin\'s potato buns. Gluten-free buns (+$1.50) and lettuce wraps are available.'],
    ['add bacon|extra patty|add cheese|extra cheese', 'Add-ons: bacon $2.50, extra patty $3.50, extra cheese $1, fried egg $2, avocado $2.'],
    ['beyond|plant based|vegan patty', 'Any burger can be made with a Beyond patty at no extra charge; the Beyond Stack is fully vegan.'],
    ['nashville heat|how hot nashville|nashville level', 'Nashville Hot Chicken comes in 4 levels: mild, medium, hot and "cluck no" (seriously hot — you sign a waiver 😄).'],
    ['fryer|shared fryer|fries vegan', 'Our fries are vegan but share a fryer with chicken and onion rings.'],
    ['wing flavor|wing sauce|wings sauce', 'Wings come Buffalo, BBQ, garlic parm or Nashville hot — each order of 8 can be split two ways.'],
    ['shake thick|shake made|custard', 'Our shakes are made with frozen custard, so they\'re extra thick — you might need a spoon!'],
    ['boozy shake|alcohol shake', 'Boozy shakes (bourbon, Baileys or Kahlúa) are available for guests 21+ with ID.'],
    ['dairy free shake|vegan shake|oat shake', 'We can blend a vegan shake with oat-milk soft serve in vanilla or chocolate.'],
    ['low carb|keto|no bun', 'Any burger can be a lettuce-wrapped "no bun" burger — great for keto.'],
    ['kids toy|toy', 'Every kids meal comes with a small toy or sticker pack.'],
    ['sliders|mini burgers|slider', 'Sliders are part of our catering and party menus — 12 for $36 with 24 hours\' notice.'],
    ['food truck|truck', 'The Stack\'d truck is available for events of 50+ guests — ask me for a catering quote.'],
    ['late night menu|after midnight', 'Our full menu is available until 2 AM on Fridays and Saturdays.'],
    ['pickle|no pickles|custom order|no onions', 'Customize anything — no pickles, no onions, sauce on the side, extra crispy. Just tell us.'],
    ['sesame bun|sesame', 'Our potato buns are sesame-free, but the Stack\'d sauce and Beyond Stack contain sesame.'],
    ['peanut|peanut oil|fry oil', 'We fry in canola oil, and there are no peanuts on our menu.'],
    ['ketchup|condiment|mustard|mayo', 'Ketchup, mustard, mayo, hot sauce and pickles are free at the condiment bar.'],
    ['calories burger|double calories', 'A Classic Stack is about 650 calories and the Double Stack around 950.'],
    ['order ahead|skip line', 'Order ahead right here for pickup — your food will be ready on the pickup shelf, no line.'],
    ['sweet potato|sweet potato fries', 'Yes! Our sweet potato fries come with chipotle mayo for $5.49.']
  ]
};

/* ───────────── 7. BBQ — Smoke & Fire BBQ Grill ───────────── */
N.bbq = {
  id: 'bbq', name: 'Smoke & Fire BBQ Grill', cuisine: 'Texas-style barbecue', icon: 'flame',
  tagline: 'Low-and-slow Texas barbecue, smoked 14 hours over post oak and hickory.',
  street: '2280 Frederick Douglass Blvd', city: 'New York', state: 'NY', zip: '10027', phone: '(212) 555-2280', email: 'pitmaster@smokeandfire.nyc',
  hours: { mon: '', tue: '12:00-22:00', wed: '12:00-22:00', thu: '12:00-22:00', fri: '12:00-23:30', sat: '11:00-23:30', sun: '11:00-21:00' },
  hoursNote: 'We are closed on Mondays so the pitmasters can rest (and start the brisket).',
  tax: 0.08875,
  reservations: { max: 12, last: 60 },
  seating: { options: ['indoor', 'outdoor', 'booth'], outdoorLabel: 'Pit-side beer garden', text: 'Inside we have long communal tables, booths for 4–6 and big tables for 8–12. The pit-side beer garden seats 40 and is heated from October to March.', outdoorNote: 'The beer garden sits right by the smokers — you\'ll smell the oak!' },
  delivery: { zones: [{ zips: ['10027', '10026', '10030', '10039'], fee: 2.99, min: 25 }, { zips: ['10025', '10031', '10037', '10035'], fee: 4.99, min: 35 }], time: '40–55 minutes', mins: 50, pickup: '20 minutes', prep: 20 },
  parking: 'Street parking on Frederick Douglass Blvd and a garage on W 122nd St.',
  directions: 'At the corner of W 122nd St — 125 St (A, B, C, D) is 4 minutes away.',
  payments: 'All major cards, Apple Pay, Google Pay and cash.',
  kids: 'Kids are welcome — we have high chairs, a kids menu with sliders and tenders, and plenty of napkins!',
  privateEvents: 'The beer garden can be reserved for up to 60 guests, and the whole restaurant for up to 120. BBQ packages start at $38 per guest.',
  events: { max: 60, lead: 3 },
  allHalal: false,
  halal: "We're not halal — we smoke pork alongside beef and chicken in the same pits.",
  veg: 'BBQ is meat-heavy, but we have a smoked jackfruit sandwich and plenty of sides: mac & cheese, collard greens (vegetarian on request), cornbread and slaw.',
  glutenFree: 'Our meats and dry rubs are gluten-free, and our house sauces are too. Cornbread and mac & cheese contain gluten.',
  spice: 'Our meats are rubbed with salt and pepper Texas-style; we have mild, spicy and Carolina gold sauces on every table.',
  allergens: 'wheat, dairy, egg and mustard',
  best: 'Our 14-hour Prime Brisket is the reason people cross town. The St. Louis Ribs and the Burnt Ends sell out most weekends.',
  signature: ['Prime Brisket (1/2 lb)', 'St. Louis Ribs (half rack)', 'Burnt Ends'],
  catering: { min: 20, max: 500, lead: 4, text: 'We cater backyard parties, weddings and corporate events for 20–500 guests with meats by the pound, sides and an on-site smoker option. Plan on $22–$45 per guest.' },
  noCakes: "We don't bake custom cakes, but bring yours and we'll serve it — or celebrate with our peach cobbler!",
  menu: [
    { cat: 'Smoked Meats', items: [
      ['Prime Brisket (1/2 lb)', 17.99, 'gf pop', '', 'Prime beef brisket smoked 14 hours over post oak — moist or lean.', 'brisket'],
      ['Burnt Ends', 16.99, 'gf pop', '', 'Caramelized brisket point cubes glazed in sweet sauce.', 'burnt ends'],
      ['St. Louis Ribs (half rack)', 19.99, 'gf pop', '', 'Pork spare ribs with a sweet-pepper rub.', 'ribs|half rack|pork ribs'],
      ['St. Louis Ribs (full rack)', 34.99, 'gf', '', 'A full rack for the serious eater (or two).', 'full rack'],
      ['Smoked Half Chicken', 15.99, 'gf', '', 'Brined and hickory-smoked half chicken.', 'chicken|smoked chicken|half chicken'],
      ['Pulled Pork Sandwich', 13.99, '', 'G', 'Hand-pulled pork shoulder with slaw on a brioche bun.', 'pulled pork|pork sandwich'],
      ['Jalapeño Cheddar Hot Links (2)', 12.99, 's gf', 'D', 'House-made beef sausage with jalapeño and cheddar.', 'hot links|sausage|links'],
      ['Smoked Jackfruit Sandwich', 12.99, 'vg', 'G', 'Pulled smoked jackfruit with BBQ sauce and slaw.', 'jackfruit|vegan sandwich|veggie sandwich']
    ] },
    { cat: 'Sides', items: [
      ['Mac & Cheese', 5.99, 'v pop', 'G D E', 'Three-cheese baked mac with a crunchy top.', 'mac and cheese|mac'],
      ['Collard Greens', 4.99, 'gf', '', 'Slow-cooked with smoked turkey (vegetarian on request).', 'greens|collards'],
      ['Skillet Cornbread', 4.49, 'v', 'G D E', 'Honey-butter cornbread in a cast-iron skillet.', 'cornbread|corn bread'],
      ['Coleslaw', 3.99, 'v gf', 'E', 'Creamy tangy slaw.', 'slaw|coleslaw'],
      ['Baked Beans', 4.49, 'gf', '', 'Smoky beans with brisket bits.', 'beans|baked beans'],
      ['Potato Salad', 4.49, 'v gf', 'E', 'Mustard potato salad with dill.', 'potato salad']
    ] },
    { cat: 'Desserts & Drinks', items: [
      ['Banana Pudding', 6.99, 'v', 'G D E', 'Vanilla wafers, bananas and whipped cream.', 'banana pudding|pudding'],
      ['Peach Cobbler', 7.49, 'v', 'G D', 'Warm cobbler with a scoop of vanilla ice cream.', 'cobbler|peach cobbler'],
      ['Sweet Tea', 3.49, 'vg gf', '', 'Southern-style sweet tea (unsweet on request).', 'tea|sweet tea|iced tea'],
      ['Fresh Lemonade', 3.99, 'vg gf', '', 'House-squeezed lemonade.', 'lemonade'],
      ['Soda', 2.99, 'vg gf', '', 'Coke, Diet Coke, Sprite, Dr Pepper.', 'coke|soda|dr pepper|sprite|soft drink|cola']
    ] },
    { cat: 'Kids', items: [
      ['Kids Brisket Sliders (2)', 9.99, 'k', 'G', 'Two mini brisket sliders with a side.', 'sliders|kids sliders'],
      ['Kids Chicken Tenders', 8.99, 'k', 'G E', 'Three tenders with fries.', 'tenders|kids tenders|kids meal']
    ] },
    { cat: 'Deals & Combos', items: [
      ['BBQ Platter for Two', 54.99, 'pop', 'G D E', '1/2 lb brisket, half rack of ribs, 2 hot links, 3 sides and cornbread.', 'platter|platter for two|bbq platter'],
      ['Pitmaster Feast (serves 4)', 99.99, '', 'G D E', '1 lb brisket, full rack, half chicken, burnt ends, 4 sides and cornbread.', 'pitmaster feast|feast|family platter'],
      ['Weekday Lunch Combo', 15.99, '', 'G', 'Any sandwich with one side and a drink — Tue–Fri 12–3 PM.', 'lunch combo|lunch special']
    ] }
  ],
  facts: {
    wifi: 'Yes, free Wi-Fi — ask any server for the password.',
    wheelchair: 'Fully accessible, including the beer garden and restrooms.',
    pets: 'Dogs are welcome in the beer garden.',
    dress: 'Casual — wear something you don\'t mind getting a little sauce on!',
    giftcards: 'Gift cards are available at the counter or by emailing {email}.',
    loyalty: 'Join the Smoke Club: every 10th visit earns a free half pound of brisket.',
    alcohol: 'We have 16 craft beers on tap, bourbon flights and frozen margaritas. No BYOB.',
    cancelPolicy: 'No deposit for up to 8 guests. Groups of 9–12 need 24 hours\' notice to cancel.',
    late: 'We hold tables for 15 minutes. Call {phone} if you need a little longer.',
    music: 'Blues and southern rock, with live blues on Thursday nights from 8 PM.',
    birthday: 'Birthday guests get a free banana pudding with a candle! Outside cakes welcome.',
    wait: 'Weekend evenings can have a 30–45 minute wait; the beer garden is first come for walk-ins.',
    discount: 'Our Weekday Lunch Combo ($15.99) and BBQ Platter for Two are the best value.'
  },
  faqs: [
    ['wood|what wood|smoke with', 'We smoke over post oak and hickory in two 1,000-gallon offset smokers.'],
    ['how long brisket|brisket smoked|brisket time', 'Our brisket is smoked for about 14 hours, then rested for 2 more before slicing.'],
    ['sold out|run out|sell out', 'When the meat is gone, it\'s gone! Brisket and burnt ends often sell out by 8 PM on weekends — ordering ahead is the safe bet.'],
    ['moist or lean|fatty brisket|lean brisket', 'Moist (fatty) brisket comes from the point and is juicier; lean comes from the flat. Get half-and-half to try both.'],
    ['sauce|bbq sauce|what sauces', 'We have three house sauces: Original (sweet & tangy), Fire (spicy) and Carolina Gold (mustard). All gluten-free.'],
    ['by the pound|pound|lb|how much meat', 'Plan about 1/2 lb of meat per person. We sell brisket, pulled pork and burnt ends by the half pound or pound.'],
    ['rub|seasoning|dry rub', 'Brisket gets a Texas salt-and-pepper rub; ribs get our sweet-pepper rub. All rubs are gluten-free.'],
    ['beef ribs|dino rib', 'Beef "dino" ribs are a Saturday-only special — about $38 each, and they go fast.'],
    ['pork|pork free|no pork', 'Our brisket, burnt ends, hot links and chicken are pork-free, but they share smokers with pork.'],
    ['smoked turkey|turkey', 'Smoked turkey breast is available Thursday to Sunday at $15.99 per half pound.'],
    ['thanksgiving|holiday brisket|whole brisket', 'Whole smoked briskets and turkeys can be pre-ordered for holidays — order at least 5 days ahead.'],
    ['smoke ring|pink meat|pink', 'That pink ring is the smoke ring — a sign of real low-and-slow smoking, not undercooked meat.'],
    ['reheat brisket|leftover brisket', 'Wrap leftover brisket in foil with a splash of broth and warm it at 275°F for about 20 minutes.'],
    ['live blues|live music thursday', 'Live blues every Thursday from 8 PM — no cover charge.'],
    ['closed monday|monday', 'We\'re closed Mondays — that\'s when the pitmasters rest and fire up the smokers for Tuesday.'],
    ['mac and cheese|mac cheese', 'Our mac & cheese is baked with cheddar, gouda and fontina and topped with toasted crumbs.'],
    ['collard vegetarian|greens vegetarian', 'Collards are made with smoked turkey, but we keep a vegetarian batch — just ask.'],
    ['on site smoker|smoker event|pit at event', 'For 75+ guests we can bring a smoker to your event and slice on site — ask me for a catering quote.'],
    ['bourbon|whiskey', 'We have 40+ bourbons, including flights of three for $22.'],
    ['sides included|come with sides', 'Plates of meat by weight don\'t include sides — sandwiches come with one side, platters with three.'],
    ['napkins|messy|wet wipes', 'Plenty of paper towels and wet wipes on every table — BBQ is supposed to be messy!'],
    ['cornbread|honey butter', 'Our skillet cornbread comes warm with whipped honey butter.'],
    ['spicy sauce|hot sauce|fire sauce', 'Fire sauce is our spicy one — habanero and chipotle. Hot links also have a jalapeño kick.'],
    ['pitmaster|who smokes', 'Our pitmaster Dre learned in Lockhart, Texas, and has been smoking brisket for 15 years.'],
    ['beer garden heated|outside winter', 'The beer garden has heat lamps and wind screens from October to March.']
  ]
};

/* ───────────── 8. MEXICAN — Casa Verde Taqueria ───────────── */
N.mexican = {
  id: 'mexican', name: 'Casa Verde Taqueria', cuisine: 'Mexican taqueria', icon: 'taco',
  tagline: 'Handmade tortillas, birria and al pastor off the trompo.',
  street: '1920 3rd Ave', city: 'New York', state: 'NY', zip: '10029', phone: '(212) 555-1920', email: 'hola@casaverdetaqueria.com',
  hours: { mon: '11:00-22:00', tue: '11:00-22:00', wed: '11:00-22:00', thu: '11:00-23:00', fri: '11:00-01:00', sat: '10:00-01:00', sun: '10:00-22:00' },
  hoursNote: 'Weekend brunch starts at 10 AM with chilaquiles.',
  tax: 0.08875,
  reservations: { max: 12, last: 45 },
  seating: { options: ['indoor', 'outdoor', 'bar'], outdoorLabel: 'Front patio', text: 'We seat 45 inside at colorful tables for 2–8 and a taco bar with 10 stools. Our front patio has 8 tables under an awning, open April–October.', outdoorNote: 'The patio has an awning, so a little rain is no problem.' },
  delivery: { zones: [{ zips: ['10029', '10035', '10128'], fee: 1.99, min: 15 }, { zips: ['10026', '10037', '10028', '10027'], fee: 3.49, min: 25 }], time: '30–45 minutes', mins: 40, pickup: '15 minutes', prep: 15 },
  parking: 'Street parking on 3rd Ave and the side streets; the East River Plaza garage is 5 minutes away.',
  directions: 'At 106th St — the 6 train at 103rd St is a 3-minute walk.',
  payments: 'All major cards, Apple Pay, Google Pay, cash and Venmo for catering.',
  kids: 'Kids are welcome — kids quesadillas, mild tacos, high chairs and churros make everyone happy.',
  privateEvents: 'Our back room seats 35 for fiestas with a taco bar package from $26 per guest.',
  events: { max: 50, lead: 2 },
  allHalal: false,
  halal: 'We\'re not halal certified — our al pastor and carnitas are pork. Our chicken and beef are not zabiha.',
  veg: 'Vegetarians have lots of options: mushroom and potato tacos, veggie burrito bowl, quesadillas, elote and guac. Our beans and rice are vegan (no lard).',
  glutenFree: 'Our tacos use corn tortillas made in-house, so most tacos, bowls and enchiladas are gluten-free. Flour tortillas (burritos, quesadillas) contain gluten.',
  spice: 'We keep dishes medium and let you add heat at the salsa bar — from mild pico to our habanero salsa roja.',
  allergens: 'wheat, dairy, egg and tree nuts',
  best: 'The Birria Tacos with consomé are the star, the Al Pastor is carved right off the trompo, and our Guacamole is smashed to order.',
  signature: ['Birria Tacos (3) with Consomé', 'Tacos al Pastor (3)', 'Guacamole & Chips'],
  catering: { min: 20, max: 400, lead: 3, text: 'We do taco bars, burrito trays and a live trompo al pastor for 20–400 guests — typically $17–$32 per guest.' },
  noCakes: "We don't make custom cakes, but you're welcome to bring one — or try our tres leches cake by the slice!",
  menu: [
    { cat: 'Tacos', items: [
      ['Tacos al Pastor (3)', 12.99, 's pop gf', '', 'Marinated pork off the trompo with pineapple, onion and cilantro.', 'al pastor|pastor|pastor tacos'],
      ['Carne Asada Tacos (3)', 13.99, 'gf', '', 'Grilled skirt steak, onion, cilantro and salsa verde.', 'carne asada|asada|steak tacos'],
      ['Birria Tacos (3) with Consomé', 15.99, 's pop', 'D', 'Slow-braised beef, melted cheese and a cup of rich consomé for dipping.', 'birria|birria tacos|quesabirria'],
      ['Baja Fish Tacos (3)', 13.99, '', 'F G E', 'Beer-battered cod, cabbage, chipotle crema.', 'fish tacos|baja'],
      ['Mushroom & Potato Tacos (3)', 11.49, 'vg gf', '', 'Roasted mushrooms and potatoes with salsa verde.', 'veggie tacos|vegan tacos|mushroom tacos'],
      ['Tacos', 11.99, 'gf', '', 'Pick 3: chicken tinga, carnitas or chorizo (any mix).', 'taco|tacos|chicken tacos|carnitas tacos']
    ] },
    { cat: 'Burritos & Bowls', items: [
      ['Chicken Burrito', 13.49, '', 'G D', 'Grilled chicken, rice, beans, cheese, pico and crema.', 'burrito|chicken burrito'],
      ['Carnitas Burrito', 13.99, '', 'G D', 'Crispy braised pork, rice, beans, salsa verde and cheese.', 'carnitas burrito'],
      ['Veggie Burrito Bowl', 12.49, 'vg gf', '', 'Rice, black beans, fajita veggies, corn, pico and guac.', 'burrito bowl|bowl|veggie bowl']
    ] },
    { cat: 'Plates & Snacks', items: [
      ['Chicken Enchiladas Verdes', 16.49, 'gf', 'D', 'Three enchiladas in tomatillo sauce with crema and queso fresco.', 'enchiladas|enchilada'],
      ['Cheese Quesadilla', 9.99, 'v', 'G D', 'Flour tortilla with Oaxaca cheese (add chicken or steak +$3).', 'quesadilla'],
      ['Nachos Supreme', 13.99, 'v', 'D', 'Chips, beans, cheese, pico, jalapeños, crema and guac.', 'nachos'],
      ['Guacamole & Chips', 10.99, 'vg gf pop', '', 'Avocado smashed to order with lime, onion, jalapeño and cilantro.', 'guac|guacamole|chips and guac'],
      ['Elote', 5.49, 'v gf', 'D', 'Grilled street corn with mayo, cotija, chili and lime.', 'elote|street corn|corn']
    ] },
    { cat: 'Desserts & Drinks', items: [
      ['Churros', 6.99, 'v', 'G D E', 'Cinnamon-sugar churros with chocolate sauce.', 'churro|churros'],
      ['Tres Leches Cake', 7.49, 'v', 'G D E', 'Sponge soaked in three milks with whipped cream.', 'tres leches'],
      ['Horchata', 4.49, 'v gf', 'D N', 'Rice and cinnamon drink with a touch of almond.', 'horchata'],
      ['Agua Fresca', 4.49, 'vg gf', '', 'Jamaica (hibiscus), tamarind or watermelon.', 'agua fresca|jamaica|hibiscus'],
      ['Jarritos / Mexican Coke', 3.49, 'vg gf', '', 'Mexican Coke or Jarritos (mandarin, lime, tamarind).', 'coke|mexican coke|jarritos|soda|soft drink|cola']
    ] },
    { cat: 'Kids', items: [
      ['Kids Cheese Quesadilla', 6.99, 'v k', 'G D', 'Small cheese quesadilla with rice.', 'kids quesadilla|kids meal'],
      ['Kids Chicken Taco Plate', 7.49, 'k gf', 'D', 'Two mild chicken tacos with rice and beans.', 'kids taco|kids tacos']
    ] },
    { cat: 'Deals & Combos', items: [
      ['Taco Tuesday Trio', 9.99, 'pop gf', '', 'Any 3 tacos for $9.99 — Tuesdays all day.', 'taco tuesday|tuesday deal'],
      ['Family Taco Kit (serves 4)', 49.99, '', 'G D', '12 tacos (pick 2 fillings), rice, beans, chips, guac and salsas.', 'taco kit|family kit|family taco']
    ] }
  ],
  facts: {
    wifi: 'Yes, free Wi-Fi — "CasaVerde", password "tacotime".',
    wheelchair: 'Yes — step-free entrance and an accessible restroom.',
    pets: 'Dogs are welcome on the front patio.',
    dress: 'Casual — no dress code.',
    giftcards: 'Gift cards are available at the register in any amount.',
    loyalty: 'Get a stamp with every burrito or taco plate — 10 stamps equals a free meal.',
    alcohol: 'We serve margaritas, Mexican beers and mezcal. No BYOB, please.',
    cancelPolicy: 'No deposit for tables. Back-room fiestas need 48 hours\' notice to cancel.',
    late: 'We hold tables for 15 minutes — give us a ring at {phone} if you\'re running late.',
    music: 'Cumbia, norteño and Latin pop — and live mariachi on Sunday afternoons.',
    birthday: 'Birthday guests get free churros and the staff will sing Las Mañanitas! 🎉 Outside cakes welcome.',
    wait: 'Friday and Saturday evenings get busy; walk-ins usually wait 15–30 minutes.',
    discount: 'Taco Tuesday: any 3 tacos for $9.99. Happy hour margaritas are $8, weekdays 4–7 PM.'
  },
  faqs: [
    ['tortilla|handmade tortilla|corn tortilla', 'Our corn tortillas are pressed by hand from fresh masa every morning; flour tortillas come from a local tortillería.'],
    ['birria|what is birria|consome', 'Birria is beef slow-braised with dried chilies and spices; we crisp the tacos with cheese and serve them with the rich consomé for dipping.'],
    ['al pastor|trompo|what al pastor', 'Al pastor is pork marinated in achiote and chilies, stacked on a vertical spit (the trompo) and carved to order with pineapple.'],
    ['salsa bar|salsa|hot sauce', 'Our self-serve salsa bar has pico de gallo, salsa verde, roja, habanero and pickled onions — free with any meal.'],
    ['mix tacos|different tacos|mix and match', 'Yes — you can mix fillings in any order of 3 tacos.'],
    ['lard|beans vegan|rice vegan', 'We never use lard — our beans and rice are 100% vegan.'],
    ['spicy salsa|hottest salsa|habanero', 'The habanero salsa roja is our hottest — use it carefully!'],
    ['chilaquiles|brunch|breakfast', 'Weekend brunch (10 AM–2 PM) has chilaquiles, huevos rancheros and breakfast burritos.'],
    ['margarita|happy hour|margaritas', 'Happy hour is weekdays 4–7 PM: $8 margaritas and $5 Mexican beers.'],
    ['mexican coke|cane sugar', 'Our Mexican Coke is made with cane sugar and comes in a glass bottle.'],
    ['burrito size|big burrito|how big burrito', 'Our burritos are big — about a pound. Many guests share one with chips and guac.'],
    ['add protein|add chicken|add steak', 'Add chicken or steak to any quesadilla, bowl or nachos for $3, shrimp for $4.'],
    ['guac extra|add guac', 'Add guac to anything for $2.50.'],
    ['mariachi|live music sunday', 'Live mariachi plays Sunday afternoons from 1–4 PM.'],
    ['carnitas|what carnitas', 'Carnitas are pork shoulder slow-cooked in its own fat until tender, then crisped on the plancha.'],
    ['tamales|pozole|menudo', 'Tamales and pozole are weekend specials — ask your server what\'s on today.'],
    ['taco tuesday|tuesday', 'Taco Tuesday: any 3 tacos for $9.99, all day every Tuesday.'],
    ['queso|cheese dip', 'Queso fundido with chorizo is a weekend special; nachos and quesadillas are available every day.'],
    ['cilantro|no cilantro|no onions', 'Say "no cilantro" or "no onions" and we\'ll leave them off.'],
    ['fish taco fish|what fish', 'Our Baja fish tacos use beer-battered wild Pacific cod.'],
    ['gluten free tacos|corn gluten', 'Our corn tortillas are gluten-free, but they are warmed on the same plancha as flour tortillas.'],
    ['party taco bar|taco bar|trompo event', 'We bring taco bars and even a live trompo to events — ask me for a catering quote.'],
    ['piñata|pinata|decorations', 'You\'re welcome to bring decorations or a piñata for back-room fiestas.'],
    ['dairy free|no cheese|lactose', 'Ask for any taco or bowl without cheese or crema to make it dairy-free.'],
    ['cinco de mayo|dia de muertos|holiday', 'We throw big parties for Cinco de Mayo and Día de Muertos — book early!']
  ]
};

/* ───────────── 9. MIDDLE EASTERN — Shawarma Palace ───────────── */
N.middleeastern = {
  id: 'middleeastern', name: 'Shawarma Palace', cuisine: 'Lebanese & Middle Eastern', icon: 'wrap',
  tagline: 'Charcoal grills, shawarma carved to order and mezze made daily.',
  street: '25-18 Steinway St', city: 'Astoria', state: 'NY', zip: '11103', phone: '(718) 555-2518', email: 'marhaba@shawarmapalace.nyc',
  hours: { mon: '11:00-00:00', tue: '11:00-00:00', wed: '11:00-00:00', thu: '11:00-01:00', fri: '11:00-03:00', sat: '11:00-03:00', sun: '11:00-00:00' },
  hoursNote: 'Open until 3 AM on Friday and Saturday nights.',
  tax: 0.08875,
  reservations: { max: 12, last: 45 },
  seating: { options: ['indoor', 'outdoor', 'booth'], outdoorLabel: 'Steinway St terrace', text: 'We seat 55 inside with majlis-style booths for 6 and tables for 2–8, plus a covered sidewalk terrace with 10 tables and heaters.', outdoorNote: 'The terrace is covered and heated, so it works year-round.' },
  delivery: { zones: [{ zips: ['11103', '11102', '11105', '11106'], fee: 1.49, min: 15 }, { zips: ['11101', '11104', '11377', '11370'], fee: 3.49, min: 25 }], time: '25–40 minutes', mins: 35, pickup: '10–15 minutes', prep: 15 },
  parking: 'Metered parking on Steinway St; free parking on side streets after 7 PM and a municipal lot on 25th Ave.',
  directions: 'Between 25th Ave and 28th Ave — Steinway St (M, R) is 2 blocks away.',
  payments: 'Cash, all major cards, Apple Pay and Google Pay.',
  kids: 'Families are very welcome — high chairs, a kids chicken plate, and fresh-baked pita that kids love.',
  privateEvents: 'Our upstairs hall seats 50 for engagements, birthdays and iftars, with mezze and mixed-grill packages from $30 per guest.',
  events: { max: 50, lead: 2 },
  allHalal: true,
  halal: 'Yes — everything we serve is 100% zabiha halal, and we are certified. No pork or alcohol is used anywhere in the kitchen.',
  veg: 'Great for vegetarians: falafel, hummus, baba ghanoush, tabbouleh, fattoush, grape leaves and lentil soup — most are vegan too.',
  glutenFree: 'Our plates without pita, grills, rice, hummus and salads (without fattoush chips) are gluten-free.',
  spice: 'Our food is flavorful rather than hot — ask for toum (garlic sauce) and our homemade chili sauce on the side for a kick.',
  allergens: 'wheat, sesame, dairy, tree nuts and pine nuts',
  best: 'The Mixed Shawarma Plate is our bestseller, the Chicken Shawarma Wrap is the late-night legend, and our Kunafa is worth saving room for.',
  signature: ['Mixed Shawarma Plate', 'Chicken Shawarma Wrap', 'Kunafa'],
  catering: { min: 20, max: 600, lead: 3, text: 'We cater weddings, iftars and office lunches for 20–600 guests with mezze spreads, shawarma stations and whole roasted lamb (ouzi). Most menus are $18–$40 per guest.' },
  noCakes: "We don't make custom cakes, but you're welcome to bring one — and our kunafa and baklava trays are perfect for celebrations.",
  menu: [
    { cat: 'Wraps', items: [
      ['Chicken Shawarma Wrap', 10.99, 'h pop', 'G SE', 'Marinated chicken, toum, pickles and fries rolled in saj bread.', 'chicken shawarma|chicken wrap|shawarma wrap|shawarma'],
      ['Beef Shawarma Wrap', 12.49, 'h', 'G SE', 'Spiced beef and lamb, tahini, parsley, onion and tomato.', 'beef shawarma|beef wrap|lamb shawarma'],
      ['Falafel Wrap', 9.49, 'vg h', 'G SE', 'Crispy falafel, tahini, pickled turnips, lettuce and tomato.', 'falafel wrap']
    ] },
    { cat: 'Plates', items: [
      ['Mixed Shawarma Plate', 19.99, 'h pop', 'SE D', 'Chicken and beef shawarma over rice with hummus, salad, toum and pita.', 'mixed plate|shawarma plate|mix plate'],
      ['Shish Tawook Plate', 18.99, 'h gf', 'D', 'Charcoal-grilled chicken skewers with garlic sauce, rice and salad.', 'shish tawook|tawook|chicken kebab'],
      ['Lamb Kofta Plate', 20.99, 'h gf', 'SE', 'Grilled minced lamb skewers with parsley and onion, over rice with hummus.', 'kofta|kafta|lamb kebab'],
      ['Mixed Grill (for 2)', 42.99, 'h gf', 'D SE', 'Shish tawook, kofta and lamb cubes with rice, grilled vegetables and dips.', 'mixed grill|grill platter'],
      ['Falafel (6 pc)', 7.99, 'vg h gf', 'SE', 'Crispy chickpea and herb falafel with tahini.', 'falafel']
    ] },
    { cat: 'Mezze & Salads', items: [
      ['Hummus', 7.99, 'vg gf', 'SE', 'Creamy chickpeas with tahini, lemon and olive oil. Add shawarma +$5.', 'hummus|houmous'],
      ['Baba Ghanoush', 8.49, 'vg gf', 'SE', 'Smoky roasted eggplant with tahini and pomegranate.', 'baba ghanoush|baba ganoush|eggplant dip'],
      ['Tabbouleh', 8.49, 'vg', 'G', 'Parsley, bulgur, tomato, mint and lemon.', 'tabbouleh|tabouli'],
      ['Fattoush', 8.99, 'vg', 'G', 'Crisp vegetables, sumac and toasted pita chips.', 'fattoush|salad'],
      ['Stuffed Grape Leaves (6 pc)', 7.49, 'vg gf', '', 'Vine leaves with rice, tomato and herbs.', 'grape leaves|dolma|warak enab'],
      ['Lentil Soup', 5.99, 'vg gf', '', 'Red lentil soup with cumin and lemon.', 'lentil soup|soup'],
      ['Garlic Fries', 5.49, 'vg', 'G', 'Fries tossed with toum and parsley.', 'fries|garlic fries']
    ] },
    { cat: 'Desserts & Drinks', items: [
      ['Kunafa', 8.99, 'v pop', 'G D N', 'Warm shredded pastry over sweet cheese, with syrup and pistachio.', 'kunafa|knafeh|kanafeh'],
      ['Baklava (4 pc)', 6.49, 'v', 'G N', 'Flaky phyllo with walnuts, pistachios and honey syrup.', 'baklava'],
      ['Mint Lemonade', 4.99, 'vg gf', '', 'Blended fresh lemon and mint.', 'lemonade|mint lemonade|limonana'],
      ['Ayran', 3.49, 'v gf', 'D', 'Salted yogurt drink.', 'ayran|laban|yogurt drink'],
      ['Turkish Coffee', 3.99, 'vg gf', '', 'Cardamom coffee brewed in a copper cezve.', 'coffee|turkish coffee|arabic coffee'],
      ['Soft Drink', 2.49, 'vg gf', '', 'Coke, Diet Coke, Sprite or Fanta.', 'coke|soda|sprite|fanta|soft drink|cola']
    ] },
    { cat: 'Kids', items: [
      ['Kids Chicken Plate', 8.99, 'h k', 'G', 'Mild grilled chicken with rice or fries and a mini pita.', 'kids chicken|kids plate|kids meal']
    ] },
    { cat: 'Deals & Combos', items: [
      ['Shawarma Family Platter (serves 4)', 64.99, 'h pop', 'G SE D', 'Chicken and beef shawarma, rice, hummus, fattoush, falafel, garlic fries and pita.', 'family platter|family deal|platter'],
      ['Wrap Combo', 14.99, 'h', 'G SE', 'Any wrap with garlic fries and a soft drink.', 'wrap combo|combo|lunch combo']
    ] }
  ],
  facts: {
    wifi: 'Yes, free Wi-Fi — the password is on your receipt.',
    wheelchair: 'The ground floor and terrace are step-free with an accessible restroom; the upstairs hall is stairs-only.',
    pets: 'Dogs are welcome on the terrace; service animals everywhere.',
    dress: 'No dress code — casual is perfect.',
    giftcards: 'Gift cards are available at the counter.',
    loyalty: 'Every 10th wrap is free with our stamp card.',
    alcohol: 'We are an alcohol-free restaurant. Try our mint lemonade or Turkish coffee!',
    cancelPolicy: 'No deposit for tables. Upstairs hall bookings need a $150 deposit, refundable with 5 days\' notice.',
    late: 'We hold tables for 15 minutes — call {phone} if you\'re delayed.',
    music: 'Arabic classics and Fairuz in the mornings; we show big football (soccer) matches on the TVs.',
    birthday: 'Birthday guests get a free kunafa with a candle! Outside cakes welcome.',
    wait: 'Late nights on weekends (11 PM–2 AM) get busy, but wraps move fast.',
    discount: 'The Wrap Combo ($14.99) and Family Platter are our best value. 10% off for students with ID.'
  },
  faqs: [
    ['charcoal|grill charcoal|how grilled', 'Our kebabs and tawook are grilled over real lump charcoal for that smoky flavor.'],
    ['shawarma made|how shawarma|shawarma cooked', 'Our shawarma is marinated overnight, stacked on vertical rotisseries and shaved to order.'],
    ['toum|garlic sauce|white sauce', 'Toum is our fluffy Lebanese garlic sauce — no dairy, no egg, just garlic, oil and lemon. Extra toum is $1.'],
    ['tahini|sesame sauce', 'Tahini is sesame paste mixed with lemon and garlic — it\'s in our hummus, baba ghanoush and falafel wrap.'],
    ['pita fresh|bread fresh|saj', 'We bake pita in-house all day, and our wraps use thin saj bread.'],
    ['falafel made|falafel fried|falafel vegan', 'Falafel is made from soaked chickpeas and fresh herbs, fried to order — it\'s vegan and gluten-free.'],
    ['ouzi|whole lamb|roasted lamb', 'Whole roasted lamb (ouzi) over rice is available for catering with 5 days\' notice.'],
    ['lebanese|syrian|what cuisine', 'Our recipes are Lebanese with Syrian and Palestinian touches — the family is from Beirut and Aleppo.'],
    ['kunafa|what kunafa', 'Kunafa is shredded phyllo layered with sweet cheese, baked and soaked in rose syrup, topped with pistachio. Best eaten warm!'],
    ['plate or wrap|difference plate wrap', 'Wraps are rolled to go; plates come with rice, salad, hummus and pita — a full meal.'],
    ['rice|what rice', 'Our rice is Lebanese-style with toasted vermicelli.'],
    ['spicy sauce|chili sauce|hot sauce', 'Our house chili sauce is free on request — medium heat with garlic.'],
    ['pickles|turnip|pink pickles', 'Those pink pickles are turnips colored with beetroot — tangy and crunchy.'],
    ['late night|3 am|after midnight', 'The full menu runs until closing: midnight most nights and 3 AM Friday and Saturday.'],
    ['iftar|ramadan|suhoor', 'During Ramadan we serve an iftar special with dates, lentil soup and a plate, and stay open for suhoor.'],
    ['lamb or beef|beef shawarma lamb', 'Our beef shawarma is a beef and lamb blend.'],
    ['extra meat|double meat', 'Double meat is +$4 on wraps and +$6 on plates.'],
    ['sauce side|no garlic|no onion', 'Customize anything — sauce on the side, no onions, no pickles.'],
    ['mezze platter|mezze|dips', 'Order any three mezze and we\'ll plate them together with fresh pita — great for sharing.'],
    ['arabic coffee|turkish coffee', 'Our Turkish coffee is brewed with cardamom in a copper cezve and served with a date.'],
    ['sweets tray|baklava tray|dessert tray', 'Baklava and kunafa trays for events are available with 24 hours\' notice.'],
    ['calories|healthy|light meal', 'Lighter picks: shish tawook plate (ask for salad instead of rice), lentil soup and tabbouleh.'],
    ['engagement|khatbe|wedding', 'We host engagements and weddings upstairs and cater large ones — ask me about a quote.'],
    ['fanta|soft drinks|drinks', 'We have Coke, Diet Coke, Sprite and Fanta, plus mint lemonade, ayran and Turkish coffee.'],
    ['certificate|halal certified|certification', 'Yes, we are halal certified — the certificate hangs by the register.']
  ]
};

/* ───────────── 10. SUSHI — Sakura Sushi Bar ───────────── */
N.sushi = {
  id: 'sushi', name: 'Sakura Sushi Bar', cuisine: 'Japanese sushi & izakaya', icon: 'sushi',
  tagline: 'Edomae-style sushi, omakase at the counter and cozy izakaya plates.',
  street: '2440 Broadway', city: 'New York', state: 'NY', zip: '10024', phone: '(212) 555-2440', email: 'reservations@sakurasushibar.com',
  hours: { mon: '17:00-22:00', tue: '12:00-14:30,17:00-22:00', wed: '12:00-14:30,17:00-22:00', thu: '12:00-14:30,17:00-22:30', fri: '12:00-14:30,17:00-23:30', sat: '12:00-23:30', sun: '12:00-21:30' },
  hoursNote: 'On weekdays we serve lunch 12–2:30 PM and dinner from 5 PM (Monday is dinner only).',
  tax: 0.08875,
  reservations: { max: 12, last: 60 },
  seating: { options: ['indoor', 'bar', 'booth'], text: 'We have a 12-seat sushi counter (best for omakase), booths for 4, tables for 2–6 and a tatami room for up to 10. No outdoor seating.', noOutdoor: "We don't have outdoor seating, I'm afraid — but the sushi counter is the best seat in the house." },
  delivery: { zones: [{ zips: ['10024', '10023', '10025'], fee: 2.99, min: 25 }, { zips: ['10069', '10019', '10026', '10128'], fee: 4.99, min: 40 }], time: '35–50 minutes', mins: 45, pickup: '20 minutes', prep: 20, note: 'Omakase is dine-in only.' },
  parking: 'Street parking on the side streets and a garage on W 90th St.',
  directions: 'At W 90th St — 86 St (1 train) is 2 blocks away.',
  payments: 'All major cards, Apple Pay and Google Pay. We\'re card-only (no cash).',
  kids: 'Kids are welcome — we have booster seats, training chopsticks and a kids chicken teriyaki.',
  privateEvents: 'Our tatami room seats 10, and we can close the restaurant for up to 45 guests. Private omakase dinners start at $120 per guest.',
  events: { max: 45, lead: 3 },
  allHalal: false,
  halal: 'We are not halal certified. Our fish and seafood are halal by nature, but we use mirin and sake (alcohol) in some sauces — just ask and we can prepare items without them.',
  veg: 'Vegetarian options include avocado cucumber roll, vegetable tempura, edamame, seaweed salad and vegetable gyoza. Most are vegan too.',
  glutenFree: 'We can make most sushi gluten-free with tamari instead of soy sauce and no tempura or eel sauce. Please tell us when ordering.',
  spice: 'Only rolls marked spicy (spicy tuna, spicy salmon) have heat — from sriracha mayo. Wasabi is served on the side.',
  allergens: 'fish, shellfish, soy, wheat, sesame and egg',
  best: 'The Chef\'s Omakase at the counter is the full experience; for rolls, the Dragon Roll and Spicy Tuna are the favorites, and the salmon nigiri melts in your mouth.',
  signature: ["Chef's Omakase (12 pc)", 'Dragon Roll', 'Spicy Tuna Roll'],
  catering: { min: 20, max: 200, lead: 4, text: 'We cater with sushi platters and a live sushi chef station for 20–200 guests. Platters run about $25–$60 per guest.' },
  noCakes: "We don't make custom cakes, but you're welcome to bring one — our mochi ice cream and matcha cheesecake are lovely for celebrations.",
  menu: [
    { cat: 'Starters', items: [
      ['Edamame', 5.50, 'vg gf', 'S', 'Steamed soybeans with sea salt.', 'edamame'],
      ['Miso Soup', 4.00, 'v', 'S F', 'Dashi broth with tofu, wakame and scallion.', 'miso|miso soup|soup'],
      ['Pork Gyoza (6 pc)', 8.50, '', 'G S SE', 'Pan-fried dumplings with ponzu.', 'gyoza|dumplings'],
      ['Seaweed Salad', 6.50, 'vg', 'S SE', 'Marinated wakame with sesame.', 'seaweed salad|seaweed']
    ] },
    { cat: 'Nigiri & Sashimi', items: [
      ['Salmon Nigiri (2 pc)', 8.00, 'gf pop', 'F', 'Scottish salmon over seasoned rice.', 'salmon nigiri|sake nigiri'],
      ['Tuna Nigiri (2 pc)', 9.00, 'gf', 'F', 'Bluefin akami over seasoned rice.', 'tuna nigiri|maguro'],
      ['Yellowtail Sashimi (5 pc)', 16.00, 'gf', 'F', 'Hamachi slices with jalapeño and ponzu.', 'yellowtail|hamachi|sashimi']
    ] },
    { cat: 'Rolls', items: [
      ['Spicy Tuna Roll', 11.00, 's pop', 'F E S', 'Tuna, spicy mayo, cucumber and crunchy tempura flakes.', 'spicy tuna'],
      ['California Roll', 9.00, '', 'SH E S', 'Crab, avocado and cucumber with tobiko.', 'california|california roll'],
      ['Salmon Avocado Roll', 10.00, 'gf', 'F', 'Fresh salmon and avocado.', 'salmon avocado|salmon roll'],
      ['Dragon Roll', 17.00, 'pop', 'SH F S G E', 'Shrimp tempura and cucumber topped with eel, avocado and eel sauce.', 'dragon|dragon roll'],
      ['Rainbow Roll', 17.00, '', 'SH F E S', 'California roll topped with tuna, salmon, yellowtail and avocado.', 'rainbow|rainbow roll'],
      ['Shrimp Tempura Roll', 12.00, '', 'SH G E S', 'Crispy shrimp tempura, avocado and eel sauce.', 'shrimp tempura|tempura roll'],
      ['Avocado Cucumber Roll', 8.00, 'vg gf', '', 'Avocado and cucumber — simple and fresh.', 'avocado roll|cucumber roll|veggie roll|vegetable roll']
    ] },
    { cat: 'Kitchen', items: [
      ['Chicken Teriyaki Bento', 19.00, '', 'G S SE', 'Grilled chicken teriyaki with rice, salad, gyoza and California roll.', 'bento|teriyaki bento|chicken teriyaki'],
      ['Tonkotsu Ramen', 18.00, 'pop', 'G S E SE', 'Rich pork-bone broth, chashu, soft egg, scallions and nori.', 'ramen|tonkotsu'],
      ["Chef's Omakase (12 pc)", 85.00, 'pop', 'F SH S', "12 pieces of the chef's seasonal selection, served one by one at the counter (dine-in only).", 'omakase|chef choice']
    ] },
    { cat: 'Desserts & Drinks', items: [
      ['Mochi Ice Cream (3 pc)', 7.00, 'v gf', 'D', 'Green tea, mango and strawberry.', 'mochi'],
      ['Matcha Cheesecake', 8.50, 'v', 'D E G', 'Creamy cheesecake with ceremonial matcha.', 'cheesecake|matcha cheesecake'],
      ['Hot Green Tea', 3.00, 'vg gf', '', 'Genmaicha, refilled free.', 'green tea|tea|genmaicha'],
      ['Ramune Soda', 4.00, 'vg gf', '', 'Japanese marble soda — original or melon.', 'ramune'],
      ['Soft Drink', 3.00, 'vg gf', '', 'Coke, Diet Coke or Sprite.', 'coke|soda|sprite|soft drink|cola']
    ] },
    { cat: 'Kids', items: [
      ['Kids Chicken Teriyaki', 10.00, 'k', 'G S', 'Mild chicken teriyaki with rice and cucumber roll.', 'kids teriyaki|kids meal']
    ] },
    { cat: 'Deals & Combos', items: [
      ['Sushi for Two Boat', 68.00, 'pop', 'F SH E S G', '10 nigiri, a dragon roll, a spicy tuna roll and a California roll, served on a wooden boat.', 'sushi boat|boat|sushi for two'],
      ['Lunch Bento Special', 16.00, '', 'G S F', 'Choice of chicken or salmon teriyaki with rice, miso and a roll — weekdays 12–2:30 PM.', 'lunch bento|lunch special']
    ] }
  ],
  facts: {
    wifi: 'Yes, free Wi-Fi — just ask your server.',
    wheelchair: 'Our dining room and restroom are step-free; the tatami room requires removing shoes and sitting low, so booths are more comfortable for some guests.',
    pets: 'Only service animals are allowed — we have no outdoor seating.',
    dress: 'Smart casual is ideal, especially at the omakase counter.',
    giftcards: 'Gift cards are available at the host stand or by emailing {email} — perfect for omakase.',
    loyalty: "We don't have a points program, but regulars at the counter often get a little surprise from the chef.",
    alcohol: 'We serve sake, Japanese whisky, beer and plum wine. Corkage is $30 per bottle (max 2).',
    cancelPolicy: 'Omakase counter seats need a card to hold and a $50 per person fee for cancellations within 24 hours. Regular tables have no deposit.',
    late: 'We hold tables for 15 minutes, but omakase starts together at 6 PM and 8:30 PM, so please be on time.',
    music: 'Quiet jazz and city pop — it\'s a calm, conversation-friendly space.',
    birthday: 'Birthday guests get a free mochi with a candle! You can bring your own cake (plating fee $3 per person).',
    wait: 'Walk-ins are welcome for tables and the bar; omakase counter seats book out about a week ahead.',
    discount: 'The Lunch Bento Special ($16) is our best deal, and happy hour (5–6:30 PM weekdays) has $6 rolls.'
  },
  faqs: [
    ['omakase|what omakase|omakase price', "Omakase means \"I'll leave it to you\" — our chef serves 12 pieces of the day's best fish, one at a time, at the counter for $85. Seatings are 6 PM and 8:30 PM."],
    ['omakase time|how long omakase|omakase seating', 'Omakase takes about 75 minutes, with seatings at 6:00 and 8:30 PM.'],
    ['fish fresh|where fish|fish from', 'Our fish arrives daily, much of it flown in from Japan\'s Toyosu market, plus local and Scottish salmon.'],
    ['raw fish|pregnant|cooked sushi', 'If you prefer cooked options: California roll, shrimp tempura roll, dragon roll (cooked eel and shrimp), avocado rolls, teriyaki and ramen.'],
    ['soy sauce|tamari|gluten soy', 'We have regular soy sauce and gluten-free tamari; low-sodium soy is available too.'],
    ['wasabi|real wasabi|fresh wasabi', 'Our omakase uses freshly grated real wasabi root; rolls come with standard wasabi on the side.'],
    ['nigiri vs sashimi|difference nigiri|sashimi or nigiri', 'Nigiri is a slice of fish on seasoned rice; sashimi is just the fish, no rice.'],
    ['brown rice|rice option|soy paper', 'Any roll can be made with brown rice (+$1) or soy paper (+$1.50).'],
    ['eel sauce|unagi sauce', 'Eel sauce is a sweet soy glaze with mirin — it contains wheat and a little alcohol.'],
    ['tempura|fried', 'Our tempura is fried in rice-bran oil with a light wheat batter.'],
    ['ramen|broth|ramen vegetarian', 'Our tonkotsu broth is pork-bone based and simmered 18 hours. We don\'t have a vegetarian ramen yet.'],
    ['tatami|shoes|tatami room', 'The tatami room has low tables and floor cushions — shoes off, please! It seats up to 10.'],
    ['counter|sit at counter|sushi counter', 'The 12-seat counter lets you watch the chefs; omakase is served there, and you can order à la carte at the counter too.'],
    ['sake|recommend sake|sake list', 'We carry 20+ sakes; our server loves recommending a junmai ginjo for sushi.'],
    ['spicy mayo|spicy sauce', 'Spicy mayo is mayonnaise with sriracha and sesame oil — it contains egg.'],
    ['platter|party platter|sushi platter', 'Party platters (from 40 pieces) are available with 24 hours\' notice, or ask me for a catering quote.'],
    ['chef|who is chef|itamae', 'Chef Kenji trained for 12 years in Tokyo\'s Tsukiji before opening Sakura.'],
    ['sustainable|bluefin|sustainability', 'We source responsibly, following Seafood Watch guidance and working with farms that meet sustainability standards.'],
    ['ginger|pickled ginger|gari', 'Pickled ginger (gari) cleanses your palate between pieces — our gari is naturally colored, no dyes.'],
    ['how to eat sushi|etiquette|chopsticks or hands', 'Nigiri can be eaten with fingers or chopsticks — dip the fish side lightly in soy, not the rice.'],
    ['lunch hours|lunch time|weekday lunch', 'Lunch is 12–2:30 PM Tuesday to Friday; weekends we serve all day from noon.'],
    ['closed lunch monday|monday', 'On Mondays we open for dinner only, from 5 PM.'],
    ['happy hour', 'Happy hour is 5–6:30 PM on weekdays: $6 rolls, $5 beers and $8 sake flights.'],
    ['matcha|green tea dessert', 'Our matcha cheesecake uses ceremonial-grade matcha from Uji.'],
    ['delivery omakase|omakase delivery|omakase to go', 'Omakase is dine-in only, but our Sushi for Two Boat travels beautifully.']
  ]
};

/* ───────────── 11. CAFE — Brew Theory Cafe ───────────── */
N.cafe = {
  id: 'cafe', name: 'Brew Theory Cafe', cuisine: 'Specialty coffee & all-day brunch', icon: 'cup',
  tagline: 'Single-origin coffee, all-day brunch and fresh pastries.',
  street: '402 7th Ave', city: 'Brooklyn', state: 'NY', zip: '11215', phone: '(718) 555-0402', email: 'hello@brewtheory.coffee',
  hours: { mon: '07:00-19:00', tue: '07:00-19:00', wed: '07:00-19:00', thu: '07:00-20:00', fri: '07:00-21:00', sat: '08:00-21:00', sun: '08:00-18:00' },
  hoursNote: 'Brunch is served all day, every day.',
  morning: true,
  tax: 0.08875,
  reservations: { max: 8, last: 45, text: 'We take reservations for 1–8 guests (weekend brunch fills up!), and larger groups can book our community table as a private event. Walk-ins are always welcome.' },
  seating: { options: ['indoor', 'outdoor', 'window'], outdoorLabel: 'Garden patio', text: 'We have 40 seats inside — a big community table, tables for 2–4 and window bar seats — plus a garden patio with 8 tables in warmer months.', outdoorNote: 'The garden patio is dog-friendly and shaded in summer.' },
  delivery: { zones: [{ zips: ['11215', '11217', '11232'], fee: 1.99, min: 12 }, { zips: ['11218', '11231', '11238'], fee: 3.49, min: 20 }], time: '25–40 minutes', mins: 35, pickup: '10 minutes', prep: 10 },
  parking: 'Street parking on 7th Ave and the side streets; it\'s usually easiest after 10 AM.',
  directions: 'At 8th St — 7 Av (F, G) is right on the corner.',
  payments: 'All cards, Apple Pay, Google Pay and cash. We don\'t add a service fee.',
  kids: 'Very kid friendly — high chairs, a kids menu, crayons and a baby-changing table.',
  privateEvents: 'The community table seats 16 for baby showers, book clubs and brunch parties, and we can host up to 35 after hours. Brunch packages from $28 per guest.',
  events: { max: 35, lead: 2 },
  allHalal: false,
  halal: "We're not halal certified — our bacon is pork. Our vegetarian dishes contain no meat, and we can cook your eggs on a clean pan.",
  veg: 'Most of our menu is vegetarian, and dishes marked vegan use oat milk and plant butter. Oat, almond and soy milk are free!',
  glutenFree: 'We have gluten-free toast (+$1) and our acai bowl and power bowl are gluten-free. Pastries contain gluten.',
  spice: 'Not much heat here — except the chipotle salsa on our breakfast burrito.',
  allergens: 'wheat, dairy, egg, tree nuts and soy',
  best: 'Our Avocado Toast and Buttermilk Pancakes are the brunch favorites, and the Oat Milk Latte is what regulars order every morning.',
  signature: ['Avocado Toast', 'Buttermilk Pancakes', 'Oat Milk Latte'],
  catering: { min: 15, max: 150, lead: 2, text: 'We cater office breakfasts and brunches for 15–150 guests: coffee boxes, pastry platters, breakfast sandwiches and yogurt parfaits, about $12–$25 per guest.' },
  noCakes: "We don't make custom cakes, but you're welcome to bring one — our banana bread and croissants are great for sharing.",
  menu: [
    { cat: 'Coffee & Tea', items: [
      ['Espresso', 3.50, 'vg gf', '', 'Double shot of our seasonal single-origin.', 'espresso|shot'],
      ['Cappuccino', 4.75, 'v gf', 'D', 'Espresso with velvety steamed milk.', 'cappuccino|cappucino'],
      ['Latte', 5.00, 'v gf', 'D', 'Espresso with steamed milk.', 'latte|lattes'],
      ['Oat Milk Latte', 5.00, 'vg gf pop', '', 'Our latte with Oatly.', 'oat latte|oat milk latte|oatmilk latte'],
      ['Cold Brew', 5.25, 'vg gf', '', '18-hour cold brew over ice.', 'cold brew|iced coffee'],
      ['Matcha Latte', 5.75, 'v gf', 'D', 'Ceremonial matcha with steamed milk.', 'matcha'],
      ['Chai Latte', 5.25, 'v gf', 'D', 'House-spiced chai with milk.', 'chai|chai latte|tea']
    ] },
    { cat: 'Brunch', items: [
      ['Avocado Toast', 13.50, 'vg pop', 'G', 'Sourdough, smashed avocado, chili flakes, lemon and herbs. Add an egg +$2.', 'avo toast|avocado toast'],
      ['Buttermilk Pancakes', 14.00, 'v pop', 'G D E', 'Three fluffy pancakes, maple syrup, berries and whipped butter.', 'pancakes|pancake'],
      ['Eggs Benedict', 16.00, '', 'G D E', 'Poached eggs, ham and hollandaise on an English muffin.', 'eggs benedict|benedict|eggs benny'],
      ['Breakfast Burrito', 13.00, 's', 'G D E', 'Scrambled eggs, bacon, potatoes, cheddar and chipotle salsa.', 'burrito|breakfast burrito'],
      ['Acai Bowl', 12.50, 'vg gf', 'N', 'Acai, banana, granola, berries and almond butter.', 'acai|acai bowl|smoothie bowl']
    ] },
    { cat: 'Lunch', items: [
      ['Turkey Pesto Panini', 14.00, '', 'G D N', 'Roast turkey, provolone and basil pesto on ciabatta.', 'turkey panini|panini|turkey sandwich'],
      ['Caprese Sandwich', 12.50, 'v', 'G D', 'Mozzarella, tomato, basil and balsamic on focaccia.', 'caprese|mozzarella sandwich|sandwich'],
      ['Quinoa Power Bowl', 14.50, 'vg gf', 'SE', 'Quinoa, roasted sweet potato, kale, chickpeas and tahini dressing.', 'power bowl|quinoa bowl|bowl|salad']
    ] },
    { cat: 'Bakery', items: [
      ['Butter Croissant', 4.25, 'v', 'G D E', 'Flaky, all-butter croissant baked every morning.', 'croissant|croissants'],
      ['Blueberry Muffin', 4.00, 'v', 'G D E', 'With a crumble top.', 'muffin|blueberry muffin'],
      ['Banana Bread', 4.50, 'v', 'G E N', 'Moist banana bread with walnuts.', 'banana bread']
    ] },
    { cat: 'Kids', items: [
      ['Kids Grilled Cheese', 8.00, 'v k', 'G D', 'Cheddar on white bread with fruit.', 'grilled cheese|kids sandwich'],
      ['Kids Pancake Stack', 8.00, 'v k', 'G D E', 'Two small pancakes with berries and syrup.', 'kids pancakes|kids meal'],
      ['Babyccino', 1.50, 'v k gf', 'D', 'Frothy warm milk with cocoa dust.', 'babyccino|kids milk']
    ] },
    { cat: 'Deals & Combos', items: [
      ['Coffee & Pastry Deal', 7.50, 'v pop', 'G D E', 'Any drip coffee or latte with a croissant or muffin — until 11 AM.', 'coffee and pastry|breakfast deal|morning deal'],
      ['Brunch for Two', 38.00, 'v', 'G D E', 'Two brunch mains, two lattes and a pastry to share.', 'brunch for two|brunch deal']
    ] }
  ],
  facts: {
    wifi: 'Yes, fast free Wi-Fi — the password is on the chalkboard. Laptops are welcome on weekdays; on weekends we keep tables laptop-free 10 AM–3 PM.',
    wheelchair: 'Yes — step-free entrance, accessible restroom and a lowered counter section.',
    pets: 'Dogs are welcome on the garden patio, and we have pup cups!',
    dress: 'Totally casual.',
    giftcards: 'Gift cards and coffee subscriptions are available at the counter.',
    loyalty: 'Get a stamp with every drink — your 10th coffee is free.',
    alcohol: 'We serve mimosas and bellinis at weekend brunch, and a small natural wine list after 5 PM.',
    cancelPolicy: 'No deposit needed. If plans change, just let us know so someone else can have the table.',
    late: 'We hold tables for 15 minutes on weekends — give us a shout at {phone} if you\'re running late.',
    music: 'Chill indie and jazz playlists — perfect for working or catching up.',
    birthday: 'Tell us it\'s a birthday and we\'ll bring a candle on a pastry. Outside cakes are welcome.',
    wait: 'Weekend brunch (10 AM–1 PM) often has a 20–30 minute wait — reservations help!',
    discount: 'The Coffee & Pastry Deal ($7.50, before 11 AM) is our best value, and plant milks are always free.'
  },
  faqs: [
    ['coffee beans|roast|single origin|where coffee', 'We roast in small batches in Red Hook and rotate single-origin beans every few weeks — currently an Ethiopian Guji.'],
    ['oat milk|almond milk|plant milk|milk alternative', 'Oat, almond and soy milk are available at no extra charge.'],
    ['decaf|decaffeinated', 'Yes — we have a Swiss Water Process decaf that tastes great.'],
    ['beans to buy|bag of coffee|buy beans', 'We sell 12 oz bags of our beans for $18, ground to order if you like.'],
    ['brunch hours|breakfast hours|serve breakfast', 'Brunch is served all day, every day — pancakes at 5 PM is completely fine!'],
    ['work|laptop|study|remote work', 'Laptops are welcome on weekdays; on weekends we keep tables laptop-free 10 AM–3 PM during the brunch rush.'],
    ['outlet|charge phone|plug', 'There are outlets along the window bar and the community table.'],
    ['sugar free|syrup|sweetener', 'Our syrups (vanilla, caramel, lavender) can be swapped for sugar-free vanilla, and we have honey, agave and stevia.'],
    ['iced latte|iced drinks|cold drinks', 'Every espresso drink can be made iced.'],
    ['matcha|matcha grade', 'Our matcha is ceremonial-grade from Uji, whisked to order.'],
    ['egg|egg free|vegan brunch', 'Vegan brunch picks: avocado toast, acai bowl, quinoa power bowl and our oat milk drinks.'],
    ['sourdough|bread|gf toast', 'Our sourdough comes from a local bakery; gluten-free toast is +$1.'],
    ['pastry fresh|baked daily|bake', 'Croissants and muffins are baked every morning; they sometimes sell out by 11 AM on weekends.'],
    ['group brunch|large group|10 people', 'For 9 or more, we can host you at the community table as a private brunch — I can take the details.'],
    ['bottomless|mimosa', 'Weekend mimosas are $9 each or $24 bottomless with a brunch main (90 minutes).'],
    ['pour over|chemex|filter', 'Pour-over (V60) is available on weekdays for $6 — takes about 4 minutes.'],
    ['to go cup|reusable cup|bring cup', 'Bring your own cup and get 50¢ off any drink.'],
    ['subscription|coffee subscription', 'Our coffee subscription ships a fresh bag every 2 or 4 weeks — ask at the counter.'],
    ['kids hot chocolate|hot chocolate', 'We make hot chocolate with real chocolate and steamed milk; kids get a babyccino for $1.50.'],
    ['eggs how|egg style|scrambled', 'Add eggs any style — scrambled, fried or poached — to any dish for $2.'],
    ['nut free|nuts', 'The acai bowl (almond butter), banana bread (walnuts) and pesto panini contain nuts.'],
    ['caffeine|strong coffee|how strong', 'Our espresso is a double shot (~130 mg caffeine); cold brew is the strongest at ~200 mg.'],
    ['weekend wait|busy brunch|best time', 'Weekdays anytime and weekends before 10 AM are the calmest times to visit.'],
    ['baby shower|book club|party', 'We host baby showers and book clubs at our community table — packages from $28 per guest.'],
    ['last order|kitchen close', 'The kitchen takes last food orders 30 minutes before closing.']
  ]
};

/* ───────────── 12. BAKERY — Sweet Crumbs Bakery & Cakes ───────────── */
N.bakery = {
  id: 'bakery', name: 'Sweet Crumbs Bakery & Cakes', cuisine: 'Bakery & custom cakes', icon: 'cake',
  tagline: 'Scratch-made pastries, breads and custom celebration cakes.',
  street: '1485 2nd Ave', city: 'New York', state: 'NY', zip: '10075', phone: '(212) 555-1485', email: 'cakes@sweetcrumbs.nyc',
  hours: { mon: '07:00-19:00', tue: '07:00-19:00', wed: '07:00-19:00', thu: '07:00-19:00', fri: '07:00-20:00', sat: '08:00-20:00', sun: '08:00-17:00' },
  hoursNote: 'Custom cake pickups are available any time during opening hours.',
  morning: true,
  tax: 0.08875,
  reservations: { max: 6, last: 45, text: 'Our café corner has just 20 seats, so we reserve small tables for 1–6 guests (great for afternoon tea). Bigger groups can book a private tea party.' },
  seating: { options: ['indoor', 'outdoor', 'window'], outdoorLabel: 'Sidewalk bistro tables', text: 'We have a cozy café corner with 20 seats (tables for 2–6 and a window counter) and 4 bistro tables outside when the weather is nice.', outdoorNote: 'The sidewalk bistro tables are lovely on sunny mornings.' },
  delivery: { zones: [{ zips: ['10075', '10021', '10028', '10065'], fee: 3.99, min: 20 }, { zips: ['10128', '10022', '10044', '10029'], fee: 6.99, min: 35 }], time: '35–50 minutes', mins: 45, pickup: '10 minutes', prep: 10, note: 'Custom cakes are delivered by our own team in a temperature-controlled van ($15 flat within our zones).' },
  parking: 'Street parking on 2nd Ave and E 77th St; the garage on E 76th St offers 1-hour rates.',
  directions: 'At the corner of E 77th St — 77 St (6 train) or 72 St (Q) are both close.',
  payments: 'All major cards, Apple Pay, Google Pay and cash. Custom cakes need a 50% deposit when ordering.',
  kids: 'Kids adore it here — sprinkle cupcakes, a little bench by the window and cookie-decorating parties on weekends.',
  privateEvents: 'We host private tea parties and cookie-decorating parties for up to 20 guests on Saturday afternoons, from $35 per guest.',
  events: { max: 20, lead: 3 },
  allHalal: false,
  halal: 'Our bakes contain no meat, gelatin or lard, and we use alcohol-free vanilla in most recipes (our rum cake and tiramisu contain alcohol). We are not formally halal certified.',
  veg: 'Everything we bake is vegetarian (no gelatin). Vegan options: sourdough, baguette, our vegan chocolate cupcake and the vegan chocolate custom cake.',
  glutenFree: 'We offer gluten-free brownies, macarons (almond flour) and a gluten-free chocolate custom cake, but our kitchen handles lots of wheat flour.',
  spice: 'No spicy food here — just cinnamon and a little cardamom!',
  allergens: 'wheat, dairy, egg, tree nuts, peanuts and sesame',
  best: 'Our Chocolate Fudge Cake is the bestseller, the Cinnamon Rolls sell out by 10 AM, and the Pistachio Rose custom cake is a showstopper for birthdays.',
  signature: ['Chocolate Fudge Cake Slice', 'Cinnamon Roll', 'Red Velvet Cupcake'],
  catering: { min: 20, max: 400, lead: 5, text: 'We cater dessert tables for weddings, showers and corporate events for 20–400 guests — mini pastries, cupcake towers, cookies and cakes, about $8–$20 per guest.' },
  cakes: {
    lead: 48,
    text: 'Yes! We bake custom celebration cakes with 48 hours\' notice — choose a flavor, size (1 kg to 5 kg) and a message, and pick it up or get it delivered.',
    readyMade: 'If you need something sooner, our ready-made 8" chocolate and vanilla cakes are available same day (we can pipe a message in 10 minutes).',
    flavors: ['Chocolate Fudge', 'Vanilla Bean', 'Red Velvet', 'Carrot', 'Lemon Raspberry', 'Black Forest', 'Strawberry Shortcake', 'Pistachio Rose'],
    sizes: [
      { key: '1kg', label: '1 kg · 6" (serves 8)', kg: 1, inch: 6, serves: 8, price: 45 },
      { key: '1.5kg', label: '1.5 kg · 8" (serves 12)', kg: 1.5, inch: 8, serves: 12, price: 62 },
      { key: '2kg', label: '2 kg · 9" (serves 16)', kg: 2, inch: 9, serves: 16, price: 78 },
      { key: '3kg', label: '3 kg · 2-tier (serves 25)', kg: 3, inch: 10, tier: 2, serves: 25, price: 115 },
      { key: '5kg', label: '5 kg · 3-tier (serves 40)', kg: 5, inch: 12, tier: 3, serves: 40, price: 185 }
    ]
  },
  quick: ['Menu', 'Order', { label: 'Custom cake', text: 'I want to order a custom cake' }, 'Reserve', 'Hours', 'Location'],
  menu: [
    { cat: 'Pastries', items: [
      ['Butter Croissant', 4.25, 'v pop', 'G D E', 'Laminated for three days — flaky and buttery.', 'croissant|croissants'],
      ['Pain au Chocolat', 4.75, 'v', 'G D E', 'Croissant dough with dark chocolate batons.', 'pain au chocolat|chocolate croissant'],
      ['Cinnamon Roll', 5.25, 'v pop', 'G D E', 'Soft swirl with cinnamon sugar and cream cheese frosting.', 'cinnamon roll|cinnamon bun'],
      ['Fruit Danish', 4.75, 'v', 'G D E', 'Seasonal fruit on custard in flaky pastry.', 'danish'],
      ['Blueberry Muffin', 3.95, 'v', 'G D E', 'Bursting with blueberries and a crumble top.', 'muffin|muffins']
    ] },
    { cat: 'Breads', items: [
      ['Sourdough Loaf', 9.00, 'vg', 'G', '48-hour naturally leavened country loaf.', 'sourdough|bread|loaf'],
      ['Baguette', 4.00, 'vg', 'G', 'Crisp classic French baguette.', 'baguette']
    ] },
    { cat: 'Cakes & Slices', items: [
      ['Chocolate Fudge Cake Slice', 6.95, 'v pop', 'G D E', 'Rich chocolate layers with fudge frosting.', 'chocolate cake|fudge cake|cake slice|chocolate slice'],
      ['New York Cheesecake Slice', 7.25, 'v', 'G D E', 'Creamy classic cheesecake on a graham crust.', 'cheesecake'],
      ['Carrot Cake Slice', 6.75, 'v', 'G D E N', 'Spiced carrot cake with walnuts and cream cheese frosting.', 'carrot cake'],
      ['Lemon Tart', 6.50, 'v', 'G D E', 'Zesty lemon curd in a buttery shell.', 'lemon tart|tart'],
      ['Chocolate Eclair', 5.50, 'v', 'G D E', 'Choux pastry with vanilla cream and chocolate glaze.', 'eclair|eclairs'],
      ['Ready-Made Celebration Cake (8")', 48.00, 'v', 'G D E', 'Chocolate or vanilla 8" cake, available same day — message piped free.', 'ready made cake|whole cake|same day cake']
    ] },
    { cat: 'Cupcakes & Cookies', items: [
      ['Red Velvet Cupcake', 4.25, 'v pop', 'G D E', 'With cream cheese frosting.', 'red velvet|cupcake|cupcakes'],
      ['Vegan Chocolate Cupcake', 4.50, 'vg', 'G S', 'Dairy- and egg-free chocolate cupcake.', 'vegan cupcake'],
      ['Chocolate Chip Cookie', 3.50, 'v', 'G D E', 'Brown-butter cookie with sea salt.', 'cookie|cookies|chocolate chip'],
      ['French Macarons (6)', 14.00, 'v gf', 'N D E', 'Pistachio, raspberry, vanilla, chocolate, salted caramel and lemon.', 'macarons|macaron|macaroons'],
      ['Gluten-Free Brownie', 4.50, 'v gf', 'D E', 'Fudgy, made with almond flour.', 'brownie|brownies']
    ] },
    { cat: 'Drinks', items: [
      ['Drip Coffee', 3.25, 'vg gf', '', 'Fresh-brewed house blend.', 'coffee|drip'],
      ['Latte', 5.00, 'v gf', 'D', 'Espresso with steamed milk (oat milk free).', 'latte|cappuccino'],
      ['Hot Chocolate', 4.75, 'v gf', 'D', 'Made with real Belgian chocolate.', 'hot chocolate|cocoa']
    ] },
    { cat: 'Kids', items: [
      ['Kids Sprinkle Cupcake', 3.25, 'v k', 'G D E', 'Mini vanilla cupcake with rainbow sprinkles.', 'sprinkle cupcake|kids cupcake']
    ] },
    { cat: 'Deals & Combos', items: [
      ['Cupcake Dozen Box', 44.00, 'v pop', 'G D E', 'Any 12 cupcakes — mix and match.', 'dozen cupcakes|cupcake box|dozen'],
      ['Breakfast Pastry Box', 26.00, 'v', 'G D E', '6 assorted morning pastries — great for the office.', 'pastry box|breakfast box']
    ] }
  ],
  facts: {
    wifi: 'Yes, free Wi-Fi for café guests.',
    wheelchair: 'Our entrance has one small step with a portable ramp available; the café corner is accessible.',
    pets: 'Dogs are welcome at our sidewalk tables, and we sell peanut-butter dog biscuits!',
    dress: 'No dress code at all.',
    giftcards: 'Gift cards are available in any amount — they make sweet presents.',
    loyalty: 'Collect a stamp per purchase over $5 — 10 stamps equals a free cake slice and coffee.',
    alcohol: "We don't serve alcohol.",
    cancelPolicy: 'Custom cakes can be changed or cancelled with a full refund up to 48 hours before pickup; after that, the 50% deposit is non-refundable because baking has started.',
    late: 'Cake pickups are held until closing time on the day — just call {phone} if you need to come the next morning.',
    music: 'Soft French café music.',
    birthday: 'Birthdays are our favorite! We can add candles, sparklers and a message to any cake.',
    wait: 'Weekend mornings (9–11 AM) have a line, but it moves quickly. Custom cake pickups skip the line.',
    discount: 'The Cupcake Dozen Box saves you $7, and day-old pastries are half price after 5 PM.'
  },
  faqs: [
    ['cake notice|how much notice|how far in advance|order advance', 'Custom cakes need at least 48 hours\' notice; wedding cakes need 3 weeks. For same-day, grab a ready-made 8" cake.'],
    ['same day cake|cake today|urgent cake|last minute cake', 'For same-day, our Ready-Made Celebration Cake (8" chocolate or vanilla, $48) can be personalized with a message in about 10 minutes.'],
    ['cake flavor|flavors|what flavors', 'Custom cake flavors: chocolate fudge, vanilla bean, red velvet, carrot, lemon raspberry, black forest, strawberry shortcake and pistachio rose.'],
    ['cake size|sizes|how big cake|serves how many', 'Cake sizes: 1 kg (serves 8), 1.5 kg (12), 2 kg (16), 3 kg two-tier (25) and 5 kg three-tier (40).'],
    ['cake price|how much cake|cost cake', 'Custom cakes start at $45 for 1 kg, $62 for 1.5 kg, $78 for 2 kg, $115 for a 2-tier 3 kg and $185 for a 3-tier 5 kg.'],
    ['photo cake|picture cake|edible print|image cake', 'Yes — we can add an edible photo print for $12.'],
    ['fondant|buttercream|frosting', 'Our cakes are finished in Swiss meringue buttercream; fondant designs are available for +$20.'],
    ['theme cake|design|character cake|unicorn', 'We love themed cakes! Send a reference picture to {email} after ordering and our decorator will confirm the design.'],
    ['wedding cake|tasting', 'Wedding cakes need 3 weeks\' notice and start with a tasting box ($25, credited to your order).'],
    ['eggless|egg free cake|eggless cake', 'Yes — any custom cake flavor can be made eggless for +$8.'],
    ['sugar free|diabetic|low sugar', 'We can reduce sugar in custom cakes, but we don\'t make fully sugar-free cakes.'],
    ['vegan cake|dairy free cake', 'Our vegan chocolate cake (dairy- and egg-free) is available in all sizes up to 2 kg.'],
    ['gluten free cake|celiac cake', 'We offer a gluten-free chocolate cake, but it\'s made in a kitchen with lots of wheat flour.'],
    ['candles|sparkler|topper', 'Candles are free; number candles, sparklers and toppers are $3–$8.'],
    ['cake delivery|deliver cake|cake delivered', 'We deliver custom cakes ourselves in a cooled van for a $15 flat fee within our delivery ZIPs.'],
    ['store cake|keep cake|fridge|refrigerate', 'Keep buttercream cakes in the fridge and take them out 1 hour before serving for the best texture.'],
    ['deposit|pay cake|payment cake', 'We take a 50% deposit when you place a custom cake order and the balance at pickup.'],
    ['cupcake order|bulk cupcakes|cupcakes party', 'Cupcakes for parties can be ordered by the dozen with 24 hours\' notice — custom colors +$6 per dozen.'],
    ['cinnamon roll|sell out|what time', 'Cinnamon rolls come out at 7 AM and usually sell out by 10 AM on weekends — pre-order to be safe.'],
    ['nut free|nut free cake|nuts', 'Our carrot cake, macarons and pistachio rose contain nuts; other cakes are nut-free recipes, but we can\'t guarantee a nut-free kitchen.'],
    ['alcohol cake|rum|liqueur', 'Only our black forest (kirsch) and tiramisu contain alcohol; we can make black forest without it.'],
    ['sourdough|bread daily|fresh bread', 'Sourdough and baguettes are baked every morning and are ready by 8 AM.'],
    ['decorating party|cookie decorating|kids party', 'Cookie-decorating parties for kids run Saturday afternoons for up to 20 guests — $35 per child.'],
    ['message on cake|writing|inscription', 'We can pipe any short message on your cake — up to about 30 characters fits nicely.'],
    ['baker|who bakes|pastry chef', 'Our head baker trained in Paris and has run Sweet Crumbs since 2012.']
  ]
};

/* ───────────── 13. DESSERTS — Scoops & Shakes ───────────── */
N.desserts = {
  id: 'desserts', name: 'Scoops & Shakes', cuisine: 'Ice cream, shakes & desserts', icon: 'icecream',
  tagline: 'Small-batch ice cream, freakshakes and ice cream cakes.',
  street: '162 Orchard St', city: 'New York', state: 'NY', zip: '10002', phone: '(212) 555-0162', email: 'hello@scoopsandshakes.nyc',
  hours: { mon: '13:00-22:00', tue: '13:00-22:00', wed: '13:00-22:00', thu: '13:00-23:00', fri: '12:00-00:00', sat: '11:00-00:00', sun: '11:00-22:00' },
  hoursNote: 'Open until midnight on Fridays and Saturdays for late-night sundaes.',
  tax: 0.08875,
  reservations: { max: 8, last: 30, text: 'Walk-ins are the norm, but we reserve our two party booths for 1–8 guests, and bigger groups can book a private sundae party.' },
  seating: { options: ['indoor', 'outdoor', 'booth'], outdoorLabel: 'Sidewalk benches', text: 'We have 24 seats inside — two big party booths for up to 8, small tables and a counter — plus sidewalk benches out front.', outdoorNote: 'Sidewalk benches are first come, but I\'ll note your preference.' },
  delivery: { zones: [{ zips: ['10002', '10009', '10003', '10012'], fee: 2.99, min: 15 }, { zips: ['10013', '10038', '10011', '10014'], fee: 4.99, min: 25 }], time: '25–35 minutes', mins: 30, pickup: '10 minutes', prep: 10, note: 'Ice cream is packed in insulated bags with ice packs so it arrives frozen.' },
  parking: 'Street parking on Orchard and Stanton St (tough on weekends); the Essex St garage is 2 blocks away.',
  directions: 'Between Stanton and Rivington — Delancey St/Essex St (F, J, M, Z) is a 4-minute walk.',
  payments: 'All major cards, Apple Pay, Google Pay and cash.',
  kids: 'Kids are our best customers — sprinkle cones, mini sundaes, booster seats and free taste spoons.',
  privateEvents: 'Sundae parties for up to 30 guests in the shop before opening (weekend mornings) — $22 per guest with a toppings bar.',
  events: { max: 30, lead: 3 },
  allHalal: false,
  halal: 'Our ice cream contains no gelatin or meat products and uses alcohol-free flavorings, except our "Bourbon Pecan" flavor. We are not halal certified.',
  veg: 'Everything is vegetarian (no gelatin). Vegan options: mango and raspberry sorbets, oat-milk chocolate, and the vegan mango sorbet cup.',
  glutenFree: 'Most ice cream flavors are gluten-free when served in a cup; cones, cookies and brownie pieces contain gluten.',
  spice: 'Our "Mexican Hot Chocolate" flavor has a little cinnamon-chili warmth — everything else is sweet!',
  allergens: 'dairy, egg, wheat, peanuts, tree nuts and soy',
  best: 'Our Nutella Freakshake is the showstopper, the Salted Caramel ice cream is our top flavor, and the Brownie Sundae is pure comfort.',
  signature: ['Nutella Freakshake', 'Double Scoop', 'Brownie Sundae'],
  catering: { min: 20, max: 300, lead: 4, text: 'We cater ice cream bars and shake stations for parties, weddings and offices — 20–300 guests, about $8–$16 per guest.' },
  cakes: {
    lead: 48,
    text: 'Yes! We make custom ice cream cakes with 48 hours\' notice — choose a flavor, size and message.',
    readyMade: 'Need one sooner? Our ready-to-go 6" Cookies & Cream ice cream cake is in the freezer daily.',
    flavors: ['Cookies & Cream', 'Chocolate Fudge', 'Strawberry Cheesecake', 'Mint Chip', 'Salted Caramel', 'Vanilla Rainbow'],
    sizes: [
      { key: '6in', label: '6" · 1 kg (serves 6–8)', kg: 1, inch: 6, serves: 8, price: 39 },
      { key: '8in', label: '8" · 1.5 kg (serves 10–12)', kg: 1.5, inch: 8, serves: 12, price: 52 },
      { key: '10in', label: '10" · 2 kg (serves 16–20)', kg: 2, inch: 10, serves: 20, price: 69 },
      { key: 'sheet', label: 'Half sheet · 3 kg (serves 30)', kg: 3, serves: 30, price: 95 }
    ]
  },
  quick: ['Menu', 'Order', { label: 'Ice cream cake', text: 'I want to order an ice cream cake' }, 'Reserve', 'Hours', 'Location'],
  menu: [
    { cat: 'Scoops', items: [
      ['Single Scoop', 5.50, 'v gf', 'D E', 'One scoop in a cup or cone — ask about today\'s 18 flavors.', 'single scoop|scoop|one scoop|ice cream|cone'],
      ['Double Scoop', 7.95, 'v gf pop', 'D E', 'Two flavors in a cup or cone.', 'double scoop|two scoops|2 scoops'],
      ['Triple Scoop', 9.95, 'v gf', 'D E', 'Three flavors — go big.', 'triple scoop|three scoops'],
      ['Vegan Mango Sorbet Cup', 5.50, 'vg gf', '', 'Alphonso mango sorbet, dairy-free.', 'sorbet|mango sorbet|vegan ice cream'],
      ['Pint to Go', 12.00, 'v gf', 'D E', 'Hand-packed pint of any flavor.', 'pint|pints']
    ] },
    { cat: 'Sundaes', items: [
      ['Hot Fudge Sundae', 9.50, 'v', 'D E P', 'Vanilla, hot fudge, whipped cream, peanuts and a cherry.', 'hot fudge|sundae|fudge sundae'],
      ['Banana Split', 11.50, 'v', 'D E N', 'Three scoops, banana, three sauces, walnuts and whipped cream.', 'banana split'],
      ['Brownie Sundae', 10.50, 'v pop', 'G D E', 'Warm brownie, two scoops, fudge and whipped cream.', 'brownie sundae|brownie'],
      ['Churro Bowl', 10.95, 'v', 'G D E', 'Cinnamon churro bowl with dulce de leche ice cream.', 'churro|churros|churro bowl'],
      ['Belgian Waffle & Ice Cream', 11.95, 'v', 'G D E', 'Fresh waffle, two scoops, berries and maple.', 'waffle|belgian waffle']
    ] },
    { cat: 'Shakes', items: [
      ['Nutella Freakshake', 12.95, 'v pop', 'D E N G', 'Nutella shake with a Nutella rim, whipped cream, wafer and brownie on top.', 'freakshake|nutella shake|nutella'],
      ['Oreo Shake', 8.95, 'v', 'D E G S', 'Cookies & cream shake.', 'oreo shake|oreo'],
      ['Strawberry Shake', 7.95, 'v gf', 'D E', 'Made with real strawberries.', 'strawberry shake'],
      ['Salted Caramel Shake', 8.50, 'v gf', 'D E', 'Our bestselling flavor, blended thick.', 'caramel shake|salted caramel shake|shake|milkshake']
    ] },
    { cat: 'Drinks', items: [
      ['Affogato', 6.50, 'v gf', 'D E', 'Vanilla gelato drowned in a double espresso.', 'affogato|coffee'],
      ['Brown Sugar Milk Tea Float', 7.50, 'v', 'D E', 'Milk tea with boba and a scoop of vanilla.', 'milk tea|boba|float'],
      ['Bottled Water', 2.00, 'vg gf', '', 'Still water.', 'water'],
      ['Soda', 2.50, 'vg gf', '', 'Coke, Diet Coke or Sprite.', 'coke|soda|sprite|soft drink|cola']
    ] },
    { cat: 'Kids', items: [
      ['Kids Mini Sundae', 5.95, 'v k', 'D E', 'One scoop, sprinkles, a little whipped cream and a cherry.', 'mini sundae|kids sundae'],
      ['Kids Sprinkle Cone', 4.50, 'v k', 'D E G', 'Kid-size cone rolled in rainbow sprinkles.', 'sprinkle cone|kids cone']
    ] },
    { cat: 'Deals & Combos', items: [
      ['Sundae Party Tub (serves 6)', 39.00, 'v pop', 'D E G P N', 'Two quarts of ice cream, four toppings, sauces and cones for 6.', 'party tub|sundae kit|sundae party'],
      ['Family Shake Deal', 29.00, 'v', 'D E G', 'Any 4 classic shakes.', 'shake deal|4 shakes']
    ] }
  ],
  facts: {
    wifi: 'Yes, free Wi-Fi — "Scoops-Guest".',
    wheelchair: 'Yes, step-free entrance; our restroom is accessible.',
    pets: 'Dogs are welcome and get a free pup cup of dog-safe vanilla!',
    dress: 'No dress code — sticky fingers welcome.',
    giftcards: 'Gift cards are available in store in any amount.',
    loyalty: 'Get a stamp per purchase — 8 stamps earns a free double scoop.',
    alcohol: 'We don\'t serve alcohol, but our boozy-tasting flavors are alcohol-free (except Bourbon Pecan).',
    cancelPolicy: 'Ice cream cakes can be changed or cancelled up to 48 hours before pickup for a full refund.',
    late: 'Booth reservations are held for 15 minutes; call {phone} if you\'re running late.',
    music: 'Upbeat pop and retro hits — it\'s a happy place!',
    birthday: 'Birthday guests get a free scoop and we\'ll bring the sundae out with a sparkler! 🎉',
    wait: 'Summer evenings and weekend nights have a line out the door, but it moves fast.',
    discount: 'The Family Shake Deal (4 shakes for $29) and Sundae Party Tub are our best value. Tuesdays: $1 off any double scoop.'
  },
  faqs: [
    ['flavors|what flavors|today flavors|flavor list', 'We churn 18 flavors daily, including salted caramel, cookies & cream, pistachio, strawberry, mint chip, Mexican hot chocolate and two vegan sorbets.'],
    ['taste|sample|try flavor', 'Of course — ask for a taste spoon of any flavor (up to three).'],
    ['homemade|made in house|small batch', 'All our ice cream is made in small batches right here, using milk from a Hudson Valley dairy.'],
    ['vegan ice cream|dairy free|lactose free', 'Our sorbets (mango, raspberry) and oat-milk chocolate are vegan and dairy-free.'],
    ['cone gluten|gluten free cone|gf cone', 'We have gluten-free cones for +$0.50, but scoops share scoops and freezers with gluten ingredients.'],
    ['waffle cone|cone type|cup or cone', 'Choose a cup, cake cone, sugar cone, or fresh waffle cone (+$1.50).'],
    ['toppings|extra toppings|sprinkles', 'Toppings are $0.75 each: sprinkles, hot fudge, caramel, Oreo, brownie bits, peanuts, whipped cream and more.'],
    ['freakshake|what freakshake', 'A freakshake is our over-the-top shake with a decorated rim, whipped cream and dessert pieces on top — very Instagrammable!'],
    ['ice cream cake notice|how much notice ice cream cake|cake advance', 'Custom ice cream cakes need 48 hours\' notice. For same-day, we keep ready-made 6" Cookies & Cream cakes in the freezer.'],
    ['ice cream cake size|cake size|serves', 'Ice cream cake sizes: 6" (serves 6–8), 8" (10–12), 10" (16–20) and a half sheet (30).'],
    ['ice cream cake price|cake price|how much cake', 'Ice cream cakes: $39 (6"), $52 (8"), $69 (10") and $95 (half sheet).'],
    ['cake melt|transport|how long frozen', 'We pack ice cream cakes with dry ice — they stay frozen for about 2 hours. Put it in the freezer as soon as you get home.'],
    ['serve cake|cut ice cream cake|soften', 'Let the cake sit 10 minutes out of the freezer, then cut with a warm knife.'],
    ['sugar free|diabetic|no sugar', 'We have a no-sugar-added vanilla sweetened with monk fruit.'],
    ['peanut free|nut free|nuts', 'Our pistachio, butter pecan and Nutella items contain nuts, and peanuts are a topping, so we can\'t guarantee nut-free scoops.'],
    ['egg|custard|eggs in ice cream', 'Our base is a French-style custard made with egg yolks; sorbets are egg-free.'],
    ['pint|take home|quart', 'Hand-packed pints are $12 and quarts $20.'],
    ['party|sundae party|ice cream party', 'Private sundae parties for up to 30 guests happen before we open on weekends — $22 per guest with a toppings bar.'],
    ['boba|milk tea', 'Our milk tea float has brown-sugar boba and a scoop of vanilla on top.'],
    ['affogato|espresso', 'Affogato is vanilla gelato with a hot double espresso poured over — the perfect after-dinner treat.'],
    ['kids price|kids size', 'Kids scoops and cones are about $4.50 — perfect little portions.'],
    ['seasonal|special flavor|limited', 'We rotate two seasonal flavors monthly — right now it\'s pumpkin pie and apple crumble.'],
    ['catering ice cream|ice cream bar|wedding dessert', 'We bring ice cream bars to weddings and office parties — ask me for a catering quote.'],
    ['calories|healthy|light', 'For something lighter, try a sorbet cup (about 120 calories per scoop).'],
    ['birthday free|free scoop', 'Yes! Show your ID on your birthday for a free single scoop.']
  ]
};

/* ───────────── 14. FINE DINING — The Olive Room ───────────── */
N.finedining = {
  id: 'finedining', name: 'The Olive Room', cuisine: 'Modern Mediterranean fine dining', icon: 'cloche',
  tagline: 'Modern Mediterranean tasting menus and an award-winning wine list.',
  street: '19 W 21st St', city: 'New York', state: 'NY', zip: '10010', phone: '(212) 555-0019', email: 'reservations@theoliveroom.nyc',
  hours: { mon: '', tue: '17:30-22:30', wed: '17:30-22:30', thu: '17:30-22:30', fri: '17:30-23:30', sat: '17:00-23:30', sun: '11:30-14:30,17:00-22:00' },
  hoursNote: 'Closed Mondays. Sunday brunch runs 11:30 AM–2:30 PM.',
  tax: 0.08875,
  reservations: { max: 10, last: 120, text: 'Reservations are recommended — we book tables for 1–10 guests up to 60 days ahead, and larger parties dine in our private room.' },
  seating: { options: ['indoor', 'booth', 'window', 'bar'], text: 'Our dining room seats 64 — plush banquettes, window tables for two, the chef\'s counter (8 seats) and a private dining room for up to 24. No outdoor seating.', noOutdoor: "We don't have outdoor seating, I'm afraid — but our window tables look right onto the Flatiron streetscape." },
  delivery: { zones: [], time: 'n/a', mins: 45, pickup: '30 minutes', prep: 30, note: "We don't offer delivery — our dishes are plated to be enjoyed in the dining room — but select dishes are available for pickup." },
  parking: 'Valet parking is available from 6 PM ($35), or use the Icon garage on W 21st St.',
  directions: 'Between 5th and 6th Ave — 23 St (F, M, R, W) is 3 minutes away.',
  payments: 'All major cards and Apple Pay. We do not accept cash for checks over $500.',
  kids: 'Children are welcome, especially at Sunday brunch; we offer a simple kids menu and high chairs. The tasting menu is best for guests 12+.',
  privateEvents: 'The Cellar Room seats 24 for private dinners and the full restaurant can be booked for up to 90 guests. Private dining menus start at $125 per guest.',
  events: { max: 90, lead: 5 },
  allHalal: false,
  halal: 'We are not halal certified, and wine is used in some sauces. Our fish and vegetarian dishes can be prepared without alcohol — please let us know when booking.',
  veg: 'We offer a full vegetarian tasting menu with 24 hours\' notice, and several à la carte dishes like the mushroom risotto and roasted carrots.',
  glutenFree: 'Our kitchen can adapt most dishes and the tasting menu to be gluten-free — just note it on your reservation.',
  spice: 'Our cooking is refined rather than spicy; a touch of Aleppo pepper here and there.',
  allergens: 'shellfish, fish, dairy, gluten, tree nuts and egg',
  best: 'The Seven-Course Tasting Menu is the full Olive Room experience. À la carte, guests rave about the Grilled Octopus and the Lamb Rack, and the Chocolate Soufflé is a must.',
  signature: ['Seven-Course Tasting Menu', 'Grilled Octopus', 'Lamb Rack'],
  catering: { min: 20, max: 150, lead: 10, text: 'We offer off-site catering for elegant dinners and weddings for 20–150 guests, with our chefs and service team on site. Menus start around $150 per guest.' },
  noCakes: 'We don\'t bake custom celebration cakes, but you\'re welcome to bring one ($8 per guest plating fee) — or let our pastry chef add a candle to the chocolate soufflé.',
  menu: [
    { cat: 'To Begin', items: [
      ['Heirloom Tomato & Burrata', 22.00, 'v gf', 'D', 'Heirloom tomatoes, burrata, basil oil and aged balsamic.', 'burrata|tomato salad'],
      ['Tuna Crudo', 24.00, 'gf', 'F', 'Yellowfin tuna, blood orange, Castelvetrano olive and fennel.', 'crudo|tuna crudo'],
      ['Grilled Octopus', 26.00, 'gf pop', 'SH', 'Charred octopus, smoked potato, salsa verde and paprika oil.', 'octopus'],
      ['Lobster Bisque', 19.00, 'gf', 'SH D', 'Maine lobster, cognac cream and chive.', 'bisque|lobster soup|soup'],
      ['Wagyu Carpaccio', 28.00, 'gf', 'D E', 'Shaved wagyu, truffle aioli, parmesan and arugula.', 'carpaccio']
    ] },
    { cat: 'Mains', items: [
      ['Wild Mushroom Risotto', 34.00, 'v gf', 'D', 'Carnaroli rice, porcini, chanterelles and aged parmesan.', 'risotto|mushroom risotto'],
      ['Pan-Seared Sea Bass', 46.00, 'gf', 'F D', 'Mediterranean branzino, saffron beurre blanc and fennel.', 'sea bass|branzino|fish'],
      ['Lamb Rack', 54.00, 'gf pop', 'D', 'Herb-crusted rack of lamb, eggplant purée and pomegranate jus.', 'lamb|lamb rack|rack of lamb'],
      ['Dry-Aged Ribeye (16 oz)', 72.00, 'gf', 'D', '45-day dry-aged ribeye with bone marrow butter.', 'ribeye|steak'],
      ['Duck Breast', 48.00, 'gf', 'N', 'Roasted duck, cherry-port sauce and pistachio.', 'duck'],
      ['Handmade Pappardelle', 36.00, 'v', 'G E D', 'Fresh pappardelle, braised mushroom ragù and pecorino.', 'pappardelle|pasta']
    ] },
    { cat: 'Sides', items: [
      ['Roasted Heirloom Carrots', 14.00, 'vg gf', 'SE', 'With tahini, dukkah and herbs.', 'carrots'],
      ['Truffle Pommes Purée', 14.00, 'v gf', 'D', 'Silky potato purée with black truffle.', 'mashed potatoes|pommes puree|truffle potatoes']
    ] },
    { cat: 'Desserts', items: [
      ['Chocolate Soufflé', 18.00, 'v', 'D E G', 'Valrhona chocolate soufflé with crème anglaise (please allow 20 minutes).', 'souffle|chocolate souffle'],
      ['Olive Oil Cake', 14.00, 'v', 'G D E N', 'Citrus olive oil cake, mascarpone and candied pistachio.', 'olive oil cake|cake'],
      ['Artisan Cheese Plate', 22.00, 'v', 'D G N', 'Three cheeses, honeycomb, fig jam and walnut bread.', 'cheese plate|cheese']
    ] },
    { cat: 'Tasting & Drinks', items: [
      ['Seven-Course Tasting Menu', 145.00, 'pop', 'F SH D G E N', "The chef's seasonal seven-course journey (per guest, whole table participation).", 'tasting menu|tasting|chef tasting'],
      ['Wine Pairing', 95.00, '', '', 'Sommelier-selected pairing for the tasting menu (per guest).', 'wine pairing|pairing'],
      ['Sparkling Water', 9.00, 'vg gf', '', 'Large bottle of San Pellegrino.', 'sparkling water|water|pellegrino'],
      ['Espresso', 5.00, 'vg gf', '', 'Single-origin espresso.', 'espresso|coffee']
    ] },
    { cat: 'Kids', items: [
      ['Kids Butter Pasta', 16.00, 'v k', 'G D E', 'Fresh pasta with butter and parmesan.', 'kids pasta|kids meal'],
      ['Kids Grilled Chicken', 18.00, 'k gf', 'D', 'Grilled chicken with pommes purée and vegetables.', 'kids chicken']
    ] },
    { cat: 'Deals & Combos', items: [
      ['Pre-Theatre Menu (3 courses)', 68.00, 'pop', 'D G', 'Starter, main and dessert, served 5–6:15 PM Tuesday to Saturday (per guest).', 'pre theatre|pre theater|prix fixe|set menu'],
      ['Sunday Brunch Menu', 55.00, '', 'D G E', 'Three brunch courses with a glass of bubbles or fresh juice (per guest).', 'brunch|sunday brunch']
    ] }
  ],
  facts: {
    wifi: 'Wi-Fi is available on request, though we encourage guests to unplug and enjoy the evening.',
    wheelchair: 'The dining room and restrooms are fully wheelchair accessible; the Cellar Room is reached by elevator.',
    pets: 'Only service animals are permitted.',
    dress: 'Smart casual to formal — collared shirts suggested; please no athletic wear, shorts or flip-flops.',
    giftcards: 'Gift cards are available in any amount, or as a "Tasting Menu for Two" experience, via {email}.',
    loyalty: "We don't run a points program, but our regulars are always remembered.",
    alcohol: 'Our 900-bottle wine list focuses on the Mediterranean. Corkage is $65 per bottle (max 2 bottles, not on our list).',
    cancelPolicy: 'We hold reservations with a card. Cancellations within 24 hours or no-shows are charged $75 per guest ($150 for the tasting menu).',
    late: 'We hold tables for 15 minutes. For the tasting menu, please arrive on time — call {phone} if you are delayed.',
    music: 'Soft jazz and Mediterranean acoustic — the room is designed for conversation.',
    birthday: 'Let us know it\'s a special occasion and our pastry team will add a personalized touch to dessert.',
    wait: 'We are mostly booked 1–2 weeks ahead on weekends, but the bar and chef\'s counter take walk-ins.',
    discount: 'Our Pre-Theatre Menu ($68, 3 courses) is the best way to experience The Olive Room.'
  },
  faqs: [
    ['tasting menu long|how long tasting|tasting menu time', 'The tasting menu takes about 2.5 hours; please allow the whole evening.'],
    ['tasting menu change|dietary tasting|restrictions tasting', 'The tasting menu can accommodate most dietary restrictions with 24 hours\' notice — add it to your reservation note.'],
    ['whole table tasting|everyone tasting', 'The tasting menu is served to the whole table so courses arrive together.'],
    ['vegetarian tasting|vegan tasting', 'A vegetarian tasting menu ($125) is available with 24 hours\' notice; vegan with 48 hours\'.'],
    ['sommelier|wine list|wine recommend', 'Our sommelier, Elena, is happy to guide you through our 900-bottle list — mostly Mediterranean, with great Greek and Lebanese wines.'],
    ['corkage|bring wine|bring own wine', 'Corkage is $65 per bottle, maximum 2 bottles, for wines not on our list.'],
    ['chef counter|chef table|counter seats', 'Our 8-seat chef\'s counter faces the open kitchen — request it in your booking note.'],
    ['michelin|award|reviews', 'The Olive Room has held a Michelin star since 2021 and a Wine Spectator Award of Excellence.'],
    ['chef|who is chef|executive chef', 'Executive Chef Nikos Andreou grew up in Crete and cooked in Paris and Barcelona before opening The Olive Room.'],
    ['pre theatre|pre theater|early dinner', 'The Pre-Theatre Menu (3 courses, $68) is served 5–6:15 PM Tuesday to Saturday, finishing in time for an 8 PM curtain.'],
    ['brunch|sunday brunch', 'Sunday brunch (11:30 AM–2:30 PM) is a three-course menu for $55 with bubbles or fresh juice.'],
    ['soufflé time|souffle wait|order souffle', 'The chocolate soufflé is baked to order — let your server know early; it takes about 20 minutes.'],
    ['proposal|propose|engagement dinner', 'We love helping with proposals — ask for a corner banquette and we\'ll prepare flowers or champagne on request.'],
    ['service charge|gratuity|tip included', 'Gratuity is not included for parties under 6; for 6 or more, a 20% service charge is added.'],
    ['kids tasting|children tasting', 'Children 12 and under can order from our kids menu while adults enjoy the tasting menu.'],
    ['steak cook|temperature|how steak', 'We recommend our dry-aged ribeye medium-rare, but the kitchen will cook it to your liking.'],
    ['bread|olive oil|bread service', 'Every table starts with house focaccia and our estate olive oil from Crete.'],
    ['takeout|pickup|to go', 'Select dishes are available for pickup (not the tasting menu), but we don\'t offer delivery.'],
    ['private room|cellar room', 'The Cellar Room seats up to 24 with its own sommelier service — ideal for milestone dinners.'],
    ['shellfish allergy|seafood allergy', 'Please tell us about shellfish allergies when booking; our octopus and bisque contain shellfish, but most dishes can be adapted.'],
    ['seasonal|menu change|how often', 'Our menu changes seasonally, with the tasting menu evolving every few weeks.'],
    ['last seating|latest table|late dinner', 'Our last seating is 2 hours before closing: 8:30 PM on weekdays and 9:30 PM on Friday and Saturday.'],
    ['anniversary|special occasion|celebration', 'Tell us about your occasion in the booking — we\'ll prepare a personalized dessert and a quiet table.'],
    ['olive oil|estate oil|buy oil', 'Our Cretan estate olive oil is available to buy — $32 for 500 ml.'],
    ['phones|photos|photography', 'Photos are welcome — we just ask for no flash in the dining room.']
  ]
};

/* ───────────── 15. CATERING — Feast Events Catering ───────────── */
N.catering = {
  id: 'catering', name: 'Feast Events Catering', cuisine: 'Full-service event catering', icon: 'platter',
  tagline: 'Full-service catering for weddings, offices and parties of 20 to 1,000.',
  street: '43-01 21st St', city: 'Long Island City', state: 'NY', zip: '11101', phone: '(718) 555-4301', email: 'events@feastcatering.com',
  hours: { mon: '09:00-18:00', tue: '09:00-18:00', wed: '09:00-18:00', thu: '09:00-18:00', fri: '09:00-18:00', sat: '10:00-16:00', sun: '' },
  hoursNote: 'Office and pickup hours — events run any day and time.',
  tax: 0.08875,
  reservations: false,
  noReserve: "We're a catering kitchen, so we don't have a dining room or tables to book — but we'd love to cater your event at your venue or home, from 20 to 1,000 guests. Want a quote?",
  seating: { options: [], text: "We don't have a dining room — we cater at your venue. Our partner venues seat from 40 to 400 guests if you need a space." },
  delivery: { zones: [{ zips: ['11101', '11109', '11102', '11103', '11104', '11106'], fee: 15, min: 150 }, { zips: ['10001', '10016', '10017', '10018', '10022', '10036', '11201', '11211', '11222', '11377'], fee: 35, min: 250 }], time: '60–90 minutes (or scheduled)', mins: 120, pickup: '2 hours', prep: 120, note: 'Party trays need at least 24 hours\' notice for large orders, and we deliver in insulated cases with setup included.' },
  parking: 'Pickup customers can use our loading bay on 43rd Ave (15-minute parking).',
  directions: 'Our kitchen is 2 blocks from Court Sq (7, E, M, G trains).',
  payments: 'Cards, ACH bank transfer, company checks and Zelle. Events need a 30% deposit to hold the date.',
  kids: 'We love kids parties! Our Kids Party Pack has mini sliders, pizza bites, fruit and juice boxes.',
  privateEvents: 'We cater at any venue you choose, and our partner venues in Long Island City and Manhattan host 40–400 guests.',
  events: { max: 1000, lead: 5 },
  allHalal: false,
  halal: 'We offer fully halal menus on request with certified halal meat prepared separately, and we can also do kosher-style and vegetarian-only menus.',
  veg: 'Every package has vegetarian options, and we can build fully vegetarian or vegan menus.',
  glutenFree: 'We label every tray, and can make gluten-free versions of most dishes on request.',
  spice: 'We keep dishes crowd-friendly and mild, with spicy sauces on the side — or turn up the heat on request.',
  allergens: 'wheat, dairy, egg, tree nuts, peanuts, soy, sesame, fish and shellfish',
  best: 'Our most-booked menus are the Classic Buffet and the Office Lunch Package, and the Mediterranean Mezze Platter and Grilled Salmon Tray are guest favorites.',
  signature: ['Classic Buffet Package (per guest)', 'Mediterranean Mezze Platter', 'Grilled Salmon Tray'],
  catering: { min: 20, max: 1000, lead: 5, text: 'Catering is what we do! We handle weddings, corporate events, birthdays and holiday parties for 20–1,000 guests — trays, buffets or plated service, with staff and rentals. Most events run $18–$75 per guest.' },
  noCakes: "We don't bake custom celebration cakes ourselves, but our partner bakery can supply one for your event, and our Dessert Platter and mini cupcakes are always a hit.",
  quick: ['Menu', { label: 'Get a quote', text: 'catering quote' }, 'Order', 'Hours', 'Location'],
  welcome: "Hi there! 👋 Welcome to {name}. I can put together a catering quote, show you our party trays and packages, or take a tray order for pickup or delivery. What are you planning?",
  menu: [
    { cat: 'Party Trays (serve 10)', items: [
      ['Chicken Tikka Tray', 95.00, 'gf s', 'D', 'Tandoori-spiced grilled chicken with mint chutney.', 'chicken tikka|tikka tray'],
      ['Grilled Salmon Tray', 140.00, 'gf pop', 'F', 'Lemon-herb salmon fillets with capers.', 'salmon|salmon tray'],
      ['BBQ Chicken Tray', 90.00, 'gf', '', 'Smoky grilled chicken thighs with house BBQ sauce.', 'bbq chicken|chicken tray'],
      ['Pasta Primavera Tray', 70.00, 'v', 'G D', 'Penne with seasonal vegetables in garlic-parmesan sauce.', 'pasta|pasta tray|primavera'],
      ['Vegetable Biryani Tray', 75.00, 'v gf s', 'D N', 'Fragrant basmati with vegetables and saffron.', 'biryani|veg biryani'],
      ['Mediterranean Mezze Platter', 85.00, 'vg pop', 'G SE', 'Hummus, baba ghanoush, falafel, olives, veggies and pita.', 'mezze|mezze platter|hummus platter'],
      ['Sandwich & Wrap Platter', 95.00, '', 'G D E', '20 halves: turkey, chicken caesar, caprese and veggie wraps.', 'sandwich platter|sandwiches|wraps']
    ] },
    { cat: 'Salads & Sides', items: [
      ['Caesar Salad Tray', 55.00, '', 'D E F G', 'Romaine, parmesan, croutons and caesar dressing.', 'caesar|caesar salad'],
      ['Garden Salad Bowl', 45.00, 'vg gf', '', 'Mixed greens, cucumber, tomato and balsamic vinaigrette.', 'salad|garden salad'],
      ['Roasted Vegetable Tray', 50.00, 'vg gf', '', 'Seasonal roasted vegetables with herbs.', 'vegetables|roasted veg']
    ] },
    { cat: 'Desserts & Drinks', items: [
      ['Dessert Platter', 65.00, 'v', 'G D E N', 'Brownies, cookies, lemon bars and mini cheesecakes (30 pieces).', 'dessert platter|desserts|dessert'],
      ['Mini Cupcakes (24)', 48.00, 'v', 'G D E', 'Assorted mini cupcakes.', 'cupcakes|mini cupcakes'],
      ['Fresh Fruit Platter', 60.00, 'vg gf', '', 'Seasonal sliced fruit and berries.', 'fruit|fruit platter'],
      ['Coffee Box (serves 10)', 28.00, 'vg gf', '', 'Hot coffee with cups, milk and sugar.', 'coffee|coffee box'],
      ['Lemonade Gallon', 22.00, 'vg gf', '', 'Fresh lemonade, serves 10–12.', 'lemonade|drinks']
    ] },
    { cat: 'Kids', items: [
      ['Kids Party Pack (serves 10)', 85.00, 'k', 'G D E', 'Mini sliders, pizza bites, fruit cups and juice boxes.', 'kids pack|kids party']
    ] },
    { cat: 'Packages & Deals', items: [
      ['Office Lunch Package (per guest)', 18.00, 'pop', 'G D E', 'Boxed lunch: sandwich or wrap, salad, cookie and drink (min 15).', 'office lunch|boxed lunch|lunch package'],
      ['Classic Buffet Package (per guest)', 28.00, 'pop', 'G D', 'Two mains, two sides, salad, bread and dessert, with chafers (min 20).', 'classic buffet|buffet'],
      ['Premium Buffet Package (per guest)', 42.00, '', 'G D F', 'Three mains incl. salmon, three sides, salad bar and dessert table (min 30).', 'premium buffet'],
      ['Wedding Package (per guest)', 75.00, '', 'G D F N', 'Passed appetizers, plated or buffet dinner, dessert and service staff (min 50).', 'wedding package|wedding']
    ] }
  ],
  facts: {
    wifi: "We don't have a dining space, so no guest Wi-Fi — but our team is always reachable by phone.",
    wheelchair: 'Our pickup counter is step-free, and we plan accessible buffet layouts for every event.',
    pets: 'Pets are fine at your own events — we\'ll even bring pup-friendly treats on request.',
    dress: 'Our staff dress to match your event — black-tie, cocktail or casual.',
    giftcards: 'Gift certificates for catering are available in any amount.',
    loyalty: 'Corporate clients who book 6+ events a year get 10% off every order.',
    alcohol: 'We provide licensed bartenders and bar packages, or you can supply your own alcohol and we\'ll serve it.',
    cancelPolicy: 'The 30% deposit is fully refundable up to 30 days before the event, 50% refundable 14–30 days out, and non-refundable within 14 days.',
    late: 'Our team arrives 60–90 minutes early to set up, so timing is on us!',
    music: 'We don\'t provide music, but we can recommend DJs and bands we love working with.',
    birthday: 'We cater lots of birthdays! Our partner bakery can supply a custom cake, and we\'ll serve it for you.',
    wait: 'For events, please book 2–4 weeks ahead (weddings 3–6 months). Tray orders need 24 hours.',
    discount: 'Our Office Lunch Package ($18 per guest) is the best value, and corporate clients get 10% off after 6 events.'
  },
  faqs: [
    ['tasting|food tasting|taste before', 'Yes — we offer tastings for weddings and events over 75 guests; the $150 fee is credited toward your booking.'],
    ['staff|servers|waiters|bartenders', 'We provide uniformed servers and bartenders at $45 per staff member per hour (4-hour minimum).'],
    ['rentals|chairs|linens|plates|tables', 'We can arrange tables, chairs, linens, china and glassware through our rental partners — just ask in your quote.'],
    ['setup|set up|cleanup|clean up', 'Delivery includes buffet setup with chafers; full-service events include setup and cleanup by our team.'],
    ['minimum|minimum guests|smallest event', 'Our event minimum is 20 guests; party trays can be ordered for smaller groups.'],
    ['how far|travel|outside nyc|new jersey|long island', 'We cater across the five boroughs, Long Island and northern New Jersey; travel fees apply outside NYC.'],
    ['deposit|payment terms|pay', 'We hold your date with a 30% deposit; the balance is due 7 days before the event.'],
    ['cuisine|what food|types of food', 'Our menus span American, Mediterranean, Indian, Italian and BBQ — mix and match for your crowd.'],
    ['custom menu|build menu|design menu', 'Absolutely — our catering manager will design a custom menu around your theme, budget and dietary needs.'],
    ['plated|buffet|family style|service style', 'We offer buffets, family-style platters, plated dinners, food stations and passed appetizers.'],
    ['dietary|allergies|vegan guests|gluten free guests', 'Every tray is labeled, and we prepare vegan, gluten-free, nut-free and halal meals for individual guests on request.'],
    ['kosher|kosher style', 'We offer kosher-style menus (no pork or shellfish, no mixing meat and dairy), but we are not a certified kosher kitchen.'],
    ['wedding|wedding catering|wedding menu', 'Our wedding packages start at $75 per guest with passed appetizers, dinner, dessert and service staff. Book 3–6 months ahead.'],
    ['corporate|office|company event|conference', 'We cater daily office lunches, conferences and company parties — the Office Lunch Package is $18 per guest.'],
    ['boxed lunch|individual box|box lunch', 'Individual boxed lunches (sandwich, salad, cookie and drink) are $18 per guest, minimum 15.'],
    ['last minute|short notice|tomorrow event', 'Tray orders need 24 hours; full events need at least 5 days, but call {phone} for urgent requests — we\'ll try!'],
    ['tray size|how many serve|tray serves', 'Each party tray serves about 10 guests as part of a meal.'],
    ['how much food|how many trays|quantity', 'Plan 1 main tray per 10 guests plus sides — our catering manager will calculate exact quantities for you.'],
    ['leftovers|leftover food|take home', 'Any leftovers from buffet events are packed for you to keep, in line with food safety rules.'],
    ['live station|carving|pasta station', 'Live stations — carving, pasta, taco and grill — are available for 50+ guests.'],
    ['venue|space|hall|where host', 'We don\'t have our own dining room, but our partner venues in LIC and Manhattan host 40–400 guests.'],
    ['quote|how get quote|price quote', 'Just tell me your date, guest count, event type and budget, and our catering manager will send a detailed quote within 24 hours.'],
    ['insurance|licensed|certificate', 'We are fully licensed and insured, and can provide a certificate of insurance for your venue.'],
    ['chafing|keep warm|hot food', 'Hot trays come with disposable chafing dishes and burners to keep food warm for 2–3 hours.'],
    ['pickup trays|pick up trays|collect trays', 'You can pick up tray orders at our LIC kitchen Mon–Sat during office hours — we\'ll help load your car.']
  ]
};

if (typeof module === 'object' && module.exports) module.exports = N;
else root.FOOD_NICHES = N;
})(typeof window !== 'undefined' ? window : globalThis);
