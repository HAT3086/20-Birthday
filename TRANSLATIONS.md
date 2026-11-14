# Editing the game’s English and Vietnamese text

The two copy files below cover the whole arcade: cat verification, the hub, all six games, the wardrobe, results, accessibility labels, and birthday wishes. Both are UTF-8 JavaScript modules. The game loads them directly; no build is needed.

## 1. Short text and changing messages: `dist/i18n-vi.mjs`

Every Vietnamese translation has an English reference comment immediately above it:

```js
// English: How to play
"How to play": "Cách chơi",
```

Edit only the Vietnamese value on the right. Keep the English key on the left unchanged: the game uses it to find the translation. Comments are for you and never appear on screen.

The `PHRASES` section handles text containing names or numbers:

```js
// English: Welcome back, {name}.
["Welcome back, {name}.", "Chào mừng {name} trở lại!"],
```

Keep every placeholder exactly as written, including braces: `{name}`, `{count}`, `{target}`, `{coins}`, `{stars}`, `{outfit}`, `{breed}`, `{game}`, `{section}`, `{label}`, `{reason}`, `{treat}`, `{result}`, `{shape}`, `{row}`, and `{column}`. You can change their position to suit Vietnamese grammar. Player names are inserted verbatim. The six game titles remain proper names.

Use the search function in your editor to find the English text or its current Vietnamese translation. The first section contains common labels and fixed messages; the final section contains the changing phrases.

## 2. Complete instructions: `dist/i18n-blocks.mjs`

Help paragraphs and passages with emphasis or links are translated together, so Vietnamese word order remains natural:

```js
// English: Each fish adds a cat to your parade.
"snake-help-li-0": {
  source: "Each fish adds a cat to your parade.",
  html: "Ăn một con cá sẽ nối thêm một chú mèo vào đoàn.",
},
```

Edit the `html` value for Vietnamese. Keep the identifier and `source` unchanged. Preserve `<strong>...</strong>` for emphasis and `<a href=\"./shop.html\">...</a>` for shop links. You can move those tags with the words they surround. Keep quotes escaped as `\"` inside a double-quoted string. Do not insert scripts, event handlers, or form controls.

Identifiers use the page name: `snake` = Cake, `flappy` = Flappy Cat, `fishing` = Cat Fishing, `rooftop` = Rooftop Run, `candy` = Candy Cat, `catris` = Catris. `help` means instructions; `rewards` means the rewards dialog. `check-in-company` is the verification heading.

## Editing English too

The English keys and `source` values describe the game’s source text; editing them alone does not change English on screen. English is authored in:

| Page | English source files in `dist/` |
| --- | --- |
| Arcade and profile | `index.html`, `hub.mjs` |
| Cat check | `check-in.html`, `check-in.mjs`, `cat-check-engine.mjs` |
| Wardrobe | `shop.html`, `shop.mjs`, `costumes.mjs`, `breeds.mjs` |
| Cake | `snake.html`, `app.mjs` |
| Flappy Cat | `flappy.html`, `flappy-app.mjs` |
| Cat Fishing | `fishing.html`, `fishing-app.mjs`, `fishing-art.mjs` |
| Rooftop Run | `rooftop.html`, `rooftop-app.mjs` |
| Candy Cat | `candy.html`, `candy-app.mjs` |
| Catris | `catris.html`, `catris-app.mjs` |
| Cat reactions | `cat-reactions.mjs` |
| Birthday | `birthday.html`, `birthday-app.mjs` |
| Shared reward/accessibility labels | `progress.mjs` |

When changing English, update the matching English key/template and its comment in `i18n-vi.mjs`. For a complete passage, also update `source` and its comment in `i18n-blocks.mjs` to match the corresponding HTML element’s text (without tags, with spaces normalized). Keep game IDs, save keys, element IDs, and placeholder names unchanged.

## Preview your edits

1. Save the files as UTF-8.
2. In the project folder, run `node server.mjs`.
3. Open `http://127.0.0.1:4173` and use EN / VI to check both languages.
4. Run `node --test tests/i18n.test.mjs` to catch missing translations, mismatched English passages, or broken placeholders.

`dist/i18n-core.mjs` handles matching and saved language preferences; `dist/i18n.mjs` updates the page; `dist/i18n.css` handles fonts and spacing. You do not need to edit these three files to change Vietnamese wording. Local edits appear in the local preview; the hosted site changes after publication.
