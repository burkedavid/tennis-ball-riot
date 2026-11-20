# Codex prompt — Iggy Pop Tennis Ball Riot

Build a complete mobile-first browser remake of **Iggy Pop Tennis Ball Riot**. You’re in the front row at a tiny, sweaty rock gig. Beyond the stage monitors, beside the drum kit, sits the drummer’s pint glass. You have a handful of tennis balls. Get one into that glass while the show carries on around you.

The feeling to chase is the half-second when the entire room watches a ball teeter on the rim. The drummer stops mid-fill. The singer leans in. It drops. The room erupts. Make that moment work with the sound off, then make it irresistible with headphones.

## Scope and working method

Work in the existing tennis-ball game repository. Read its level data, scoring and throw controls to understand the original. Implement the remake afresh using Three.js or Babylon.js with Vite. TypeScript is welcome. Preserve Git history, local configuration and unrelated work. Inventory the checkout before changing anything. Replace superseded game files individually once the new build works. Never wipe the working directory.

Build a playable vertical slice first: one stage, one glass, one ball, one gesture, one result and an instant retry. Tune this on a portrait viewport before adding artwork or later levels. Finish the full game, run the production build, play it and fix what breaks. Supply the finished implementation and a short evidence-based handoff.

## Art direction — a gig you can smell

Aim for the lighting, tactile surfaces and expressive animation of a current-generation console concert scene, within a phone browser’s frame budget. The venue is an old seaside ballroom commandeered for a punk gig. Think nicotine-gold house lights, oxblood velvet, chipped black road cases, chrome drum hardware, taped cables, beer rings on plywood and fluorescent yellow-green tennis felt. Make the felt and the bright rim of the glass the two easiest things to find.

Use a live-action concert film as the visual reference. Open at stage height: a rack focus shifts from the drummer’s battered chrome snare to the singer leaning into the front row, then follows his glance to the pint. Settle into the playable camera before the first throw. Keep the intro skippable. Light the performers’ faces with a soft reflected stage light so eyes, cheekbones and expressions read even against the hot backlight.

The intended lead is a recognisable Iggy Pop. If the project has an approved likeness for this use, work from the approved references for one agreed era. Match his facial proportions in front and three-quarter views, the fall of his hair, his lean bare-chested silhouette and his unusually low, loose-kneed stance. Animate the shift of weight as he grips the mic and prowls along the stage lip. If likeness clearance or approved references are unavailable, ship a distinct original punk singer and tell the owner which version was built. Use music, models and graphics cleared for redistribution.

Make the band convincing in motion as well as in a still. At sound check the drummer counts in with two visible stick clicks; each click should land on the frame the sticks meet. During the song, his wrists rebound from the skins and the struck cymbal wobbles. The bassist’s fretting hand changes position at phrase boundaries. On a rim-rattle, the musicians’ eyes turn toward the pint a fraction of a beat apart. Reserve the richest face and hair detail for close shots and keep these larger performance gestures readable at gameplay distance.

Ask the visual reviewer to watch a ten-second performance clip at normal speed on a phone-sized viewport and inspect a three-quarter close-up. Check foot sliding, floating instruments, stick-to-beat timing, skin highlights and whether the singer reads in silhouette. For the approved Iggy version, also compare the face and posture against the approved references. Report frame time during that same clip so the cinematic target is judged at playable speed.

Frame the scene from the audience at a slight three-quarter angle. The throwing hand and next ball sit low in frame, the stage lip crosses the middle, and the glass sits on a flight case beside the kit, visibly separated from cymbals, lights and HUD. Put a readable hand-painted **DRUMMER’S PINT** label on the case in sound check. Let the drummer tap the rim with a stick to introduce the target. Test the silhouette at 320px wide.

Use real licensed GLB assets and scanned materials where they improve the scene. Model or adapt the hero glass, pint stand, balls, drum kit and performers. Give the ball a curved seam and rough felt, the glass a thick rounded lip, believable amber liquid, condensation and a meniscus. Show displaced liquid and a bobbing ball after a make. Use an HDR environment for reflections, warm directional key light, cool fill, contact shadows, restrained shafts through stage haze and cinematic tone mapping. Reserve shallow depth of field for entrances and celebrations. Keep the ball, blockers and rim sharp during a throw. Never hide gameplay behind a simulated audience member’s phone.

## Throwing — one thumb, one consistent rule

- Use a fixed 2.5D gameplay plane inside the 3D venue. The player aims left/right and controls arc height. Camera perspective, zoom, DPR and quality settings must leave the physics unchanged.
- Touch or press anywhere in the lower play area, drag **toward the intended arc**, then release. Drag direction sets launch angle. Drag length sets power with a smooth response curve and a hard cap. A slow deliberate drag and a quick flick covering the same path produce the same throw. No charge timer. Show the ball settling into the hand, a dotted preview of the first part of the arc and an unmistakable ready state.
- Measure gestures in logical playfield units. Start with a dead zone equivalent to 10 CSS px at 360px wide and full power around 120px of drag. Tune from playtests. A tap, downward drag, cancelled pointer or interrupted gesture spends zero balls. Allow adjustment until release.
- Use Pointer Events, capture the primary pointer, ignore secondary fingers and keep buttons outside the throw handler. A throw spends exactly one ball. Only one ball may be in flight. Return control promptly after its result.
- Provide **Aim & Throw** as a selectable alternative for anyone who cannot flick. Include usable angle and power controls plus a Throw button. Keyboard users can adjust angle with Left/Right, power with Up/Down, throw with Space and pause with Escape. Show the active controls in context. All input methods feed the same launch function.

## What counts as a shot

Simulate gravity and collisions with a fixed timestep and swept collision checks around the rim. Award a make when the ball crosses the opening from above on its way down, between the inner rim edges with a small documented tolerance. A shot can rattle around the lip and drop in. A ball crossing the underside, brushing the outside wall or passing behind the glass in screen space must never score.

Monitors, stage floor and selected amp cases support predictable bank shots. Make their collidable surfaces visually obvious. Hitting the singer harmlessly deflects the ball and triggers a comic sidestep. Give no points for hitting people. The ball stays live until it scores, leaves the playfield, settles or reaches a bounded flight timeout. Resolve each throw exactly once. A shot taken with the last ball finishes normally. Check the level target first, then check for an empty supply; always advance or offer a retry.

## The ten-song setlist

Start each level with a fresh supply of balls and zero makes toward its target. A miss clears the combo but keeps the level’s successful shots. Keep cumulative score across completed levels. Retrying restores the score at that level’s entrance so farming retries cannot inflate a run. Reset the combo on level entry. Keep the first level generous enough that a new player can discover the shot before running out of balls.

| Song | Level | Balls | Makes | Stage direction |
| --- | --- | ---: | ---: | --- |
| 1 | Sound Check | 10 | 1 | A broad glass, a clear lane, the drummer points. |
| 2 | Opening Act | 10 | 2 | The singer paces and a wedge monitor introduces banks. |
| 3 | Main Set | 10 | 3 | An amp case creates a second playable angle. |
| 4 | Encore | 10 | 4 | The frontman telegraphs a run across the lane. |
| 5 | Legendary Show | 10 | 5 | The drummer lifts the pint between throws, then replaces it. |
| 6 | Raw Power | 9 | 6 | Shorter gaps between crossings, still readable. |
| 7 | Lust for Life | 9 | 6 | Alternate pacing and jumps; a bank can beat either. |
| 8 | The Passenger | 8 | 7 | A tighter opening and stronger crowd surges. |
| 9 | Search and Destroy | 8 | 7 | Faster stage patterns with a clear tell before each. |
| 10 | Iggy’s Ultimate Challenge | 10 | 8 | The full production, two spare attempts and a real finale. |

Use the corrected final allocation above. The old game asked for eight makes from seven balls. Validate every level at startup or build time, including that its target is reachable, a clean physical trajectory exists and at least one playable timing window occurs in each obstacle cycle. Finish the tenth level with the house lights coming up, the drummer saluting with the glass, the final setlist and a Play Again button.

## Scoring, timing and comedy

- Each make earns **100 × the current streak multiplier**, plus one bounce bonus. Consecutive makes use ×1, ×1.5, ×2 and then ×3 from the fourth onward. A clean shot adds 50, one bank adds 25, and two or more banks add 100. Count distinct impacts on bankable stage surfaces; ignore repeated contact on a resting surface and chatter against the rim.
- Completing a level in fewer than five throws adds 100. Display a short breakdown, for example **BANK SHOT · 150 + 25**. Track score, personal best, makes/goal and balls remaining. Spend score-display space on information that changes the next decision.
- Crowd bumps are timing hazards. Telegraph one with a visible swell in foreground silhouettes and a directional cue. During the brief surge, shift the indicated launch vector and its preview together. Keep the direction and magnitude fixed at release. Never secretly reroll an airborne shot. Give players a clean throwing window after every bump.
- Choreograph the laughs. A clean make gets a sharp glass *plink* and an approving single snare hit. A bank gets an extra fill. On a rim-out, let the drummer start celebrating one beat too early. For a wild miss, a roadie calmly opens a case already full of tennis balls. Keep repeat lines sparse. Players should be able to take the next throw while a background reaction finishes.
- Compose a short original garage-rock loop with separate crowd, percussion and guitar layers. Build intensity as the player nears the target. Duck the mix briefly for the rim impact. Start audio after a user gesture, persist mute, suspend sound when hidden and give every audio cue a visual equivalent. Haptics are brief and optional.

## Screens and interface

1. **Title.** Open on the live venue with the glass already visible. Use torn tour-poster lettering, warm paper against near-black and a tennis-ball accent. Give Play top billing. Include How to Play, sound, settings and personal best.
2. **First throw.** Teach in the actual scene. Point out the pint, demonstrate a short upward drag, then give control immediately. The preview should match an actual successful launch from the same position. Make help replayable.
3. **Playing.** Anchor score and makes/goal at the top, remaining balls by the throwing hand and pause in a safe corner. Never cover the target or the thumb’s release area. Show feedback near the event and fade it promptly.
4. **Pause and settings.** Offer Resume, Retry Level, Sound, Controls, Reduce Effects, Quality and Battery Saver. Pause simulation, timers, animations that affect gameplay and audio together. Restore focus after closing a menu.
5. **Results.** On success, show the next song and a prominent Continue. On failure, show makes/goal, best streak and a one-tap retry. On final victory, show total score, accuracy, bank shots and best streak. Persist personal best and settings in guarded local storage. A storage failure must leave the game playable.

## Browser, assets and performance

- Ship a static Vite build for Vercel using WebGL2 as the dependable baseline. Enable WebGPU only where the chosen renderer and effects have been tested. Offer an actionable message if graphics initialisation fails. Handle context loss and restoration.
- Use GLB/glTF with meshopt or Draco geometry and KTX2/Basis textures. Load decoders locally. Prioritise the playable stage, then stream optional detail between songs. Keep the first playable download under about 15 MB, **including** runtime, decoders, models, textures, audio and fonts. Measure actual cold-cache network transfer. Include loading progress, a retry on failure and versioned caching for repeat visits.
- Keep an **ASSETS.md** with each shipped asset’s author, exact source URL, licence, attribution, modifications and where it appears. Identify original artwork and synthesised audio. Verify redistribution rights on each asset’s source page.
- Target 60fps on recent phones and a stable 30fps on low-end devices. Cap DPR at 2. Provide Auto plus Low, Medium, High and Ultra presets. Pick an initial tier with a short rendered benchmark. Measure sustained frame time, step down promptly, and require sustained headroom before stepping up. Scale render resolution, shadow maps, crowd instances, haze and post effects. Never change collision timing, target size or throw sensitivity. Include a 30fps Battery Saver.
- Pool balls, trails, droplets and particles. Instance repeated audience figures and stage hardware. Use baked lighting where practical. Pause when hidden, cancel unfinished gestures on interruption and resume a suspended flight from its saved state. Repeated restarts must not accumulate listeners, GPU resources or audio nodes.
- Portrait first, safe-area aware, no page scrolling or pull-to-refresh during play. Fit the whole playfield in landscape and desktop. Handle iOS toolbar resizing and rotation. Include a manifest, home-screen icons, theme colour, viewport and Apple web-app tags. Respect reduced motion. Disable strobing, camera shake and aggressive zoom under Reduce Effects. Use labelled controls, visible focus, high contrast, 44px minimum hit targets and text equivalents for gesture and colour cues.

## Independent critique and acceptance

Use **three separate review agents** once a playable build exists. Give each the same build and its own brief. The first plays a fresh run and critiques gesture discovery, retry flow, keyboard use and accessibility. The second critiques composition, materials, animation, target visibility and polish using actual phone-sized screenshots. The third investigates collision edge cases, browser lifecycle, caching, frame pacing, memory and regressions. Have each report concrete observations and reproduction steps. Apply supported findings, then repeat the affected checks.

Verify these before declaring the game finished:

- Play a clean make, bank, rim-out, singer deflection and miss. Test both outcomes on the last ball. Demonstrate a legal winning path on each level, including the finale, through the normal throw and scoring logic.
- Exercise touch, mouse, keyboard and Aim & Throw. Try rapid presses, multi-touch, releasing outside the canvas, cancelling mid-aim, pausing mid-flight, rotating and backgrounding during the final shot. Each accepted throw must yield one result and leave a reachable next action.
- Check 320×568, 360×740, 390×844, 430×932 and 1280×720. Capture the same gameplay frame at every quality tier. Verify that the ball and rim stay readable in grayscale, during crowd surges and with effects reduced.
- Measure frame time and memory over sustained play and repeated restarts. Identify the device or emulator, browser, viewport and tier for every performance figure. Distinguish physical iOS/Android testing from desktop emulation. Report any unverified performance target plainly.
- Run a clean install, automated checks, `npm run build` and the production preview. Confirm cold and warm loads, asset paths, failed-load recovery and zero uncaught browser errors. Verify Vercel settings: Vite preset, `npm run build`, output `dist`.

Hand off the local play URL, exact run and deployment steps, measured download size, screenshots, test results, findings from all three reviewers, fixes applied and remaining limitations. The first thing the player should want to do after a near miss is throw another ball.
