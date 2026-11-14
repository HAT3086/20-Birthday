# Twenty — Birthday Arcade

A personal twentieth-birthday arcade with six cat-themed game entrances, a shared player profile, a coin wallet, and a 20-star birthday tracker. All six games are playable: Cake, Flappy Cat, Rooftop Run, Cat Fishing, Candy Cat, and Catris.

## Play locally

With Node.js installed, open a terminal in this folder and run:

```text
node server.mjs
```

Open http://127.0.0.1:4173 for the hub. Cake is at http://127.0.0.1:4173/snake.html, Flappy Cat at http://127.0.0.1:4173/flappy.html, Cat Fishing at http://127.0.0.1:4173/fishing.html, and Rooftop Run at http://127.0.0.1:4173/rooftop.html. No installation or build step is required; all artwork and sound are local. Use a laptop or desktop keyboard and a browser window at least 1,000 pixels wide.

## Edit the wording

See [TRANSLATIONS.md](TRANSLATIONS.md). `dist/i18n-vi.mjs` contains fixed labels and dynamic phrases; `dist/i18n-blocks.mjs` contains complete instructions with links and emphasis. Every Vietnamese entry has an English reference comment. Edit the Vietnamese values without changing English keys, identifiers, placeholders, or HTML links. The guide also lists the English source files for every page.

## Hub and shared progress

- The birthday celebration requires all 20 stars. Temporary preview is disabled in `dist/birthday-access.mjs`; its review flag controls the hub, candles, and music together.

- Use the EN / VI button in any page header to switch between English and Vietnamese immediately. It covers the cat check, all six games, instructions, results, wardrobe, and birthday wishes. The separate `twenty.language.v1` preference stays with this browser and syncs across tabs. Switching preserves the current round, camera, player name, stars, coins, and outfits; Vietnamese uses localized score separators. If storage is unavailable, the selected language still works for the current visit.
- Vietnamese instructions use complete, context-specific passages with preserved emphasis and shop links. Lora and Be Vietnam Pro are bundled locally in `dist/fonts/` with their SIL Open Font Licenses; their character maps are checked for full Vietnamese coverage. Headings no longer depend on Georgia's incomplete Vietnamese glyph set, and Vietnamese text uses uncompressed letter spacing with room for tone marks.

- On first entry, show a cat to the camera (or select a cat photo), then enter your name. Detection runs locally using the included TensorFlow.js / COCO-SSD model. No camera frames or photos are uploaded or stored. The camera stops after recognition, leaving the page, hiding the tab, or shrinking below laptop width. Camera access is requested directly from the button click before loading the model. If playback needs another gesture, Start preview keeps the already approved camera stream. Permission, playback, and detector failures have separate messages. Exit camera remains available while the detector loads, camera permission is pending, or the camera is active; choosing a photo also releases the camera.
- Three consecutive camera detections, or one clear photo detection, earn one welcome star when check-in is saved. A fresh visit or page refresh requires a new cat check; a saved welcome star never acts as verification. An approved tab can move between games, the hub, and the wardrobe for that visit. Returning visitors skip name entry when a name is already saved. The player name is also the cat’s name throughout the arcade, portraits, and wardrobe; editing the profile updates both. Direct game and wardrobe links also pass through check-in.
- Play Cake, Flappy Cat, Cat Fishing, or Rooftop Run from its card and return through the Arcade link or the results screen.
- Coins, game stars, completed games, best scores, player name, and sound settings share one browser save.
- The shared save includes owned costumes and the equipped costume. Visit Wardrobe from the hub or any game to preview, buy, and equip outfits.
- Existing Cat Snake saves migrate automatically. Already collected stars keep their coins and cannot pay twice.
- Rewards and profile changes refresh when returning from a game or receiving updates from another tab.
- The birthday tracker contains 18 game stars, the one-time cat-check welcome star, and the completion star for finishing the basic objective in all six games. Only game stars award coins: the maximum remains 180.
- All 20 stars unlock Celebrate! and a personalized twentieth-birthday party with pixel bunting, fairy lights, balloons, presents, flowers, a party hat, and a decorated cake. Click the cake or Make a wish to blow out the candles: smoke rises, the cats cheer, sparkling trails spread around the cake, and a fuller shower of paper, hearts, stars, and ribbons appears. A two-part birthday letter beside the cake shares a personal wish in English or Vietnamese. Relighting resets the celebration freely. The optional music button plays a short instrumental birthday tune; all sounds and animations stop when the page is hidden. Reduced-motion preferences use still happy cats and fewer static decorations. The finale fits short laptop screens and long player names.
- The birthday URL checks the latest saved star total too. Opening it early shows how many stars remain. Celebrations can be replayed freely and never change coins or stars.

Cake combines cat + snake. The mining chapter is now Cat Fishing. Internal game IDs and the existing game URL stay stable so earlier saves continue to work.

The canonical save key is `twenty.arcade.v1`. The old `twenty.cat-snake.v1` key remains as a compatible Cake backup. Progress is local to the device, browser profile, and website origin; the hosted game and local preview have separate saves. Clearing site data clears progress. A visible message explains when browser saving is unavailable.

## Original game music

Each game has its own original sixteen-bar instrumental loop. Enable Music using the existing button after entering a game; Sound controls effects separately. Tracks load on demand, fade when switched off, and stop when the tab is hidden or you leave the page. Returning resumes the loop without starting overlapping copies. Browser audio starts only after a player gesture.

| Game | Theme | Character |
| --- | --- | --- |
| Cake | Whisker Waltz | A bouncy marimba waltz |
| Flappy Cat | Cloud Paws | An airy flute melody |
| Cat Fishing | Moonlit Pond | Slow keys with gentle swung percussion |
| Rooftop Run | Lantern Rooftops | A lively retro adventure |
| Candy Cat | Sugar Paw Parade | Bright, soft bell notes |
| Catris | Neon Yarn | A steady electronic groove |

The editable notes, chords, instruments and rhythms are in `scripts/music-scores.mjs`. Run `npm run music:render` to regenerate the WAV loops and their cache-safe filenames in `dist/music-tracks.mjs`. The synthesizer uses no external songs or samples. To make an eight-second-per-theme comparison reel, run `node scripts/preview-music.mjs <output.wav>`. The birthday celebration retains its separate tune.

## Costume shop

- Choose a free breed independently of your costume: Original, British Shorthair, Siamese, Orange, or Ragdoll. The choice applies to every outfit preview, the hub and all six games, and persists without spending coins or changing rewards.
- Wardrobe and Arcade share the same header navigation; the small links beneath Mochi are replaced by that navigation.
- Original is free. Garden Paws (10), Little Sailor (20), Bumble Cat (30), Moon Wizard (30), Space Mochi (40), and Birthday Cat (50) cost 180 coins altogether: exactly the rewards from all 18 game stars.
- Previewing costs nothing. Buy & equip makes a one-time purchase; owned outfits can be equipped freely. Outfits appear in the hub, all games’ portraits, Cake’s parade, the flying cat, the fishing dock, and the rooftop runner.
- Every purchase checks the latest saved balance. Web Locks serialize shop actions across tabs where available. Failed saves do not grant outfits or deduct coins.
- Outfit ownership and spending persist through game rewards, reloads, and older open tabs.

## Cake rules and controls

- Arrow keys or WASD to steer; Space, P, or Escape to pause.
- The 20 × 20 garden has solid walls. Hitting a wall or your parade ends the run.
- Each fish adds a cat. Stars take 5, then 10, then 15 additional fish: 5, 15, and 30 fish total in one run.
- Each newly collected star earns 10 coins once. Cake awards at most 30 coins.
- Rewards save immediately and survive losing. Every run, including fully rewarded replays, ends in victory at 30 fish.
- Switching away pauses the game. Sound effects and optional background music have separate controls.

## Flappy Cat rules and controls

- Space or ↑ to flap; P or Escape to pause and resume. Click the playfield to flap with a mouse.
- Pass through each pair of pillars for one gate. The pillars, ground, and ceiling are solid. Pillars have more breathing room; higher scores bring larger vertical shifts and more variation in opening size.
- Stars arrive at 5, 15, and 30 gates. Each new star gives 10 coins once; rewards save at each gate and survive crashes.
- Every flight ends in victory at 30 gates. Fully rewarded replays pay no additional coins.
- Shared breeds, costumes, wallet, sound, and music work across the arcade. Leaving the tab or shrinking below laptop width pauses the flight.

## Cat Fishing rules and controls

- Space or a left mouse click casts the swinging hook. The hook swings, casts, and reels at a relaxed pace, then automatically returns with the first item it touches or from the lake edge. Small fish reel in fastest, medium fish next, and big fish slowest; boots give no points and take longer.
- Small golden fish give 1 point, striped coral fish give 2, and big blue fish give 3. Points are awarded when the fish returns to the dock.
- Stars unlock at 5, 15, and 30 cumulative points in one round, including when a larger catch crosses a milestone. Each new star gives 10 coins once and saves immediately. Every round wins at 30 points, including fully rewarded replays.
- Yellow lightning orbs give twice-as-fast reeling for 10 seconds. Green ×2 orbs double the next fish once per orb; charges queue and each fish uses one charge. Blue snowflake orbs freeze fish and orbs for 5 seconds while the hook keeps moving.
- Orb effects begin after reeling them to the dock. Timed effects refresh rather than extending when caught again. All three orb types have equal spawn probabilities; the lake maintains nine fish and three orbs, plus one old boot.
- P or Escape pauses/resumes. Changing tabs, losing focus, shrinking below laptop width, or a suspended frame pauses the round and boost timers. A paused round can be restarted while keeping earned rewards.
- Cat Fishing uses the existing internal mining game ID for save compatibility, with the same shared wardrobe, coins, stars, sound, and music.

## Rooftop Run rules and controls

- Left/Right or A/D to run. Space, Up, or W to jump; releasing early gives a shorter hop. A short grace period at edges and jump buffering before landings make timing forgiving.
- The course spans 15 rooftops and more than 10,000 pixels, with four checkpoint flags, three stars, and a finish flag beside a green door. Crates, vents, water tanks, skylights, chimneys, benches, antennas, planters, laundry, lanterns, and three sky palettes give the route more variety.
- Each unique rooftop star earns 10 coins once, even if you collect them out of order. Stars save immediately and disappear on future runs. Falls and collisions with active enemy cats each cost one heart and return Mochi to the latest checkpoint after a short delay. Earned stars stay saved.
- Start each run with three hearts and zero energy. Losing all hearts ends the run. A retry restores hearts and resets enemies, boxes, energy, and checkpoints while preserving permanent stars and coins.
- Fourteen other cats patrol within safe roof bounds. X fires one rainbow laser per energy, with a short cooldown. A laser stuns a cat for five seconds; only a downward jump on the stunned cat clears it. Active cats hurt from every direction. Solid obstacles block shots, and a brief shield prevents repeated damage immediately after respawning.
- Bump the underside of floating ? boxes to open them once per run. Each roll has a 50% chance of three energy or a 50% chance of one heart, capped at three hearts. These resources do not add coins or stars. Used boxes remain solid. Enemy, box, laser, and shield timers pause with the game.
- Reach the finish flag to complete the course. Finishing works even if you missed stars; start again to find the remaining ones. Fully rewarded replays still reach the finish but pay no more coins.
- P/Escape pauses and resumes. Pausing, leaving the tab, or shrinking below laptop width clears held inputs. Sound, optional music, breeds, costumes, and the wallet are shared with the arcade.
- The canonical platformer save records starIds (0, 1, 2), furthest course percentage in best, and completed only after reaching the flag. Legacy counts migrate to the first corresponding star IDs; concurrent progress merges by star identity.

## Candy Cat rules and controls

- Candy Cat replaces the planned Catapult Cats slot and retains the internal slingshot ID so the arcade still has six games and twenty star slots.
- Swap neighboring treats on an 8 by 8 board by clicking two cells, dragging, or using arrows and Enter/Space. Match at least three of the same color in a row or column. Six pixel shapes distinguish colors. Invalid swaps and non-neighbor selections do not spend a move.
- Each round starts with 25 moves and a settled, playable board. There is no time limit. Cleared treats give 10 points each. Automatic cascades use multipliers 1, 2, then 3 (capped), without spending another move; the multiplier resets for the next swap.
- A straight four creates a row/column striped treat, a straight five creates a rainbow, and an L/T match creates a wrapped treat. Matching an existing stripe clears its line; a wrapped treat clears a 3 by 3 area, chaining other specials. Swap a rainbow with a treat to clear that color, or swap two rainbows to clear the board. Newly created specials survive their creation wave.
- Stars unlock at 500, 1,200, and 2,000 points. Each new star saves immediately and pays 10 coins once. The score caps at 2,000 and ends the round with victory, including on fully rewarded replays. Otherwise, the final move's complete cascade resolves before results appear. Scores reset between attempts; stars and coins stay saved.
- A dead board reshuffles for free, retaining special treats. Animation phases use cancellable timers; pausing preserves their remaining delay and resuming finishes the same move. No animation frame loop or running game clock is needed.
- P/Escape pauses; help, leaving the page, changing tabs, losing focus, or shrinking below laptop width pauses the puzzle. New rounds cancel pending animations. Shared wardrobe, sound/music, profile, rewards, and save failure messaging match the other games.

- Animation follows individual treat identities: neighboring swaps slide first, cleared treats pop and fade, and surviving treats fall by the actual number of empty cells. Replacement treats enter from above the board, invalid swaps slide back, and free reshuffles animate without spending moves. Browser animations pause with the puzzle and are cancelled on a new round. Reduced-motion preferences remove these effects.

## Catris rules and controls

- Catris is the sixth playable game, using the existing tetris save ID. The board is 10 columns by 20 rows, with seven tetromino shapes drawn as little pixel cat blocks. The player's chosen breed and costume appear beside the board.
- Left/Right or A/D moves; holding repeats after a short delay. Up/X turns clockwise, Z counterclockwise. Small wall/floor nudges are allowed when a rotation fits. Down/S soft drops, and Space hard drops one piece per press to the outlined ghost landing. Native key repeat cannot rotate or drop extra pieces.
- A shuffled seven-piece bag ensures each shape appears once per bag. The next piece is visible. Grounded pieces have a 0.45-second adjustment window, with at most 12 resets before locking. The falling pace increases every five lines, from 0.85 seconds per cell to a 0.35-second cap.
- Full rows flash before collapsing. Single/double/triple/four-row clears give 100/300/500/800 score times the current level. Score is separate from coins; rewards depend only on cleared lines.
- Stars arrive at 5, 10, and 15 lines, saving immediately and paying 10 coins per new star once. A clear crossing 15 caps the line count at 15 and ends with victory. Replays keep the same goal without repaying collected stars. A blocked spawn or a piece locking above the top ends the run while keeping saved rewards.
- P/Escape pauses. Help, leaving the page, changing tabs, losing focus, narrow windows, and delayed timer callbacks pause safely and clear held controls. Timers stop outside active play. Music, sound, wardrobe, wallet, and save warnings match the rest of the arcade.
- Completion uses the arcade's existing first-star convention. Completing the sixth game derives the all-six bonus star once, without bonus coins; the camera welcome star remains reserved. All 18 unique game stars still provide exactly 180 coins for the full costume shop.

## Verification

```text
node --test tests/*.test.mjs
```

Tests cover movement, collision, fish placement, victory, saved rewards, old-save migration, the shared wallet, name entry, completion bonuses, the hub tracker, returning from either game, flight physics, full fishing casts, point milestones, boost timing and charges, rooftop movement and complete course traversal, unique star identity, checkpoint respawns, hearts and failure, box reward branches, patrols, laser blocking, stun-and-stomp combat, and duplicate-payout prevention.

## Cat reactions

Candy Cat’s companion hops for matches, dances through combos, and raises its paws with sparkles when a special treat is formed or activated. Catris reacts to each line removal, with larger celebrations for multiple lines and a four-line clear. Reactions keep the selected breed and costume, pause with the game, and stop on departure or a new round. Reduced motion uses a still happy expression and static decorations. Reaction timers are separate from gameplay and rewards.


## GitHub source export

See [GITHUB-SETUP.md](GITHUB-SETUP.md) for repository setup, local play, editable files, and save behavior. This export omits the original hosting binding and Git history.
