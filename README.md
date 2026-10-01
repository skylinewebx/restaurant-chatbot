# Demo Chatbot for Restaurants

One AI chat for every type of restaurant. The demo is a single fictional dining venue with a section for each cuisine — Desi, Indian, Chinese, Thai, Japanese & sushi, Italian, French, American & English, steakhouse, BBQ & grill, burgers, Mexican, Middle Eastern, seafood, cafe, bakery & desserts and a bar. Guests can ask about the menu, prices, hours and policies, book a table, order for pickup or delivery, or request a catering quote.

No API key and no build step: replies come from a rule-based intent engine (synonyms, typo tolerance, keyword scoring), so the demo runs free on any static host.

## Files

| File | What it is |
|---|---|
| `index.html` | The demo page. Opens the chat directly. |
| `chatbot.js` | The engine and the chat widget (Shadow DOM, so host-site CSS can't break it). |
| `niches.js` | Configs: `demo` (the multi-cuisine venue) plus 15 single-restaurant configs. |
| `netlify.toml` | Netlify settings (`publish = "."`). |
| `tests/` | Node scripts used to test conversations. |

## Links

- Demo: `https://YOUR-SITE.netlify.app/`
- Single-restaurant client page: `https://YOUR-SITE.netlify.app/?niche=desi&name=Lahori%20Tadka&city=Chicago&phone=(312)%20555-0100`

  Niche ids: `desi dhaba indian chinese pizza burgers bbq mexican middleeastern sushi cafe bakery desserts finedining catering`. `name`, `city` and `phone` are optional overrides.

## Embed on any website

```html
<script src="https://YOUR-SITE.netlify.app/chatbot.js" data-niche="demo"></script>
```

Optional attributes: `data-name`, `data-city`, `data-phone`, `data-open="true"`, `data-webhook="https://…"` (confirmed bookings and orders are POSTed there as JSON).

## Deploy on Netlify

1. **Add new site → Import an existing project → GitHub** and pick this repo.
2. Branch: `main`. Build command: leave empty. Publish directory: `.` (already set in `netlify.toml`).
3. Deploy. No environment variables are needed.

## Plugging in Claude later

See the `CLAUDE API HOOK` comment in `Brain.prototype.handle` (`chatbot.js`). Call the Anthropic API from your own server endpoint — never put an API key in browser code — and keep the engine's validation, hours and booking logic as tools the model calls.

## Testing

```bash
node tests/run.js            # 52 scripted conversations with assertions
node tests/play.js demo "hi" "table for 4 saturday at 8pm"   # ad-hoc transcript
```
