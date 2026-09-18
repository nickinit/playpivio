# Pivio

## Current playable levels

The home screen offers mandatory tutorial Level 0 plus ten main levels. The approved layouts live in `src/levels.ts`; the former Level 10 layout is now Level 6. Tutorial completion is saved locally in this browser. Every main-level entry resets its counter and generates a new board through legal moves from five solid-color rows, so even Level 8's immovable interior dot starts in a solvable configuration. Scramble lengths increase from 4 to 24 moves; these are tuning parameters, not measured minimum solution lengths or a proven difficulty ranking. Earlier layout descriptions below are historical.

Current board restored to 4×5: 20 dots, five colors with four tokens each, and seven clickable shapes (A, BC, DEF, G, HIL, J, K). The larger experimental layout is no longer active. Press/release timing and tactile styling are unchanged.

Latest layout: 19 clickable surfaces, including new 12-, 11-, 8-, 6-, 5- and 3-cell unions alongside the existing BC, DEF and HIL groups. Every union is edge-connected and hole-free, with one clockwise outer perimeter. All 63 cells are covered exactly once; 80 dots and ten balanced colors remain unchanged. Dots fully inside a union stay stationary when that union rotates.

Current grid: 8 columns × 10 rows = 80 shared dots, with eight tokens of each of ten colors. The 7×9 cell grid contains 58 clickable surfaces after preserving BC, DEF and HIL at their original upper-left locations. Original A–L labels stay with those cells; new cells use row/column labels such as R1C4 to avoid ID collisions. Board dimensions and perimeter cycles derive from the grid rather than fixed position lists. The initial mixed arrangement is deterministic; Reset restores it.

Latest board layout: seven clickable objects—A, BC, DEF, G, HIL, J, K. BC combines B+C, DEF combines D+E+F, and HIL combines H+I+L. Each rotates around its complete outer perimeter, with internal seams removed. The shared twenty dots and 8% press / 92% release remain unchanged. Earlier layouts below are historical.

Current board: all 12 cells A–L are separate clickable tiles, each rotating its four shared corner dots. ADEH is no longer an active move; the combined-shape definition and geometry tests remain as examples for future unions. Earlier combined-board descriptions below are historical.

Current interaction tuning: press advances 8% and release completes 92%. The minimum press duration remains 60 ms; the release segment is 294.4 ms at 1×. Earlier 15%/85% descriptions below document the initial split.

A local interaction prototype for a tactile logic puzzle, built with React, TypeScript, Vite, SVG and CSS. No Canvas, WebGL, animation library, backend, account system or puzzle solver is used.

## Run

Requires Node.js 22.13 or later.

```sh
npm install
npm run dev
```

Run these commands inside this `pivio` directory. Open the local URL printed by Vite. The app is local-only; it has not been published. Optional Google Fonts fall back to system fonts when offline; the puzzle does not require an external service.

```sh
npm test
npm run build
npm run preview
```

## Try the experiment

1. Press and hold any ivory tile. Its tokens and shared indentations travel 15% of the perimeter step, then hold. Release to complete the remaining 85%. A quick tap completes the first segment before continuing, without jumping.
2. Enable **Debug** to see fixed position numbers, cell labels, mask outlines and the hovered/focused/active perimeter cycle.
3. Set **Animation speed** to **0.25×** to inspect 1,280 ms of movement, plus however long you hold. At default speed the first segment takes 60 ms and the remaining segment takes 272 ms.
4. Click **B**: `2 → 3 → 7 → 6 → 2`.
5. Click the large continuous **A + D + E + H** shape: `1 → 2 → 6 → 7 → 11 → 15 → 14 → 10 → 9 → 5 → 1`.
6. Watch B while the combined tile rotates. B stays raised while its edge cutouts travel with the shared dots.
7. Keyboard interaction: Tab to a tile; hold Enter or Space to preview 15%, then release to finish. Pointer capture supports releasing outside the tile. Escape, pointer cancellation, lost capture, focus loss, or hiding the page cancels an unreleased press and restores its original positions without counting a move. Assistive-technology click activation completes the full turn automatically.

There are exactly 20 shared token objects, four of each color, and nine interactive surfaces: ADEH, B, C, F, G, I, J, K and L. G is the optional remaining independent cell. A, D, E and H never appear as separate physical buttons. There is no win state.

**Reset** restores the original arrangement and move count. **Scramble** applies 24 legal cycle permutations instantly, preserving tokens and color counts and resetting the counter; it is deliberately not a sequence of animated moves. A synchronous interaction lock prevents overlapping moves. Controls that change the board or animation configuration are disabled during a move.

## Architecture

| File | Responsibility |
| --- | --- |
| `src/model.ts` | Fixed coordinates, cell definitions, stable token identities, move definitions, immutable generic rotation and legal scrambling. |
| `src/geometry.ts` | Cell-union boundaries, shared-vertex relationships, inset/rounded surface paths, perimeter routing and distance-based interpolation. |
| `src/usePuzzle.ts` | Board state, interaction lock, a single animation clock, physical token/mask updates, final logical commit and controls. |
| `src/rotationTiming.ts` | Testable 15% press / 85% release timing, early-release continuity and hold behavior. |
| `src/TileBoard.tsx` | SVG surfaces, per-surface masks, shared dot layer, tactile filters, accessible tile interactions and debug geometry. |
| `src/App.tsx`, `src/styles.css` | Page composition, controls, visual design, lighting and press/hover transitions. |
| `tests/` | Model, geometry and server-rendered SVG structural checks. |

### Pure puzzle model

Colors belong to stable tokens, not fixed vertices. `rotate(tokens, cycle)` constructs a new array and moves the token at every cycle position to its successor. It never changes the input. The engine accepts an ordered cycle independently of the renderer.

During a move, the logical tokens keep their original positions. One `requestAnimationFrame` callback paints the token transforms and all associated circular cutout centers from the same eased perimeter coordinates. It stops scheduling frames at the 15% hold and resumes on release. Only after the final paint does the hook commit the permutation and unlock the board. React renders on interaction transitions, not on every animation frame.

### Cell unions and paths

Each grid cell contributes four directed edges. Reversed shared edges cancel. The surviving edges are traced into closed boundary loops, inset by 5 SVG units and rounded with a 12-unit base corner radius. This leaves 10-unit straight seams without changing the 2-unit ball-to-cutout radial clearance. The combined shape therefore has a single continuous silhouette rather than four overlapping rectangles with visible seams.

Animation routes are traced along those boundary edges. If a future cycle skips an intermediate corner, the route still follows that corner instead of connecting source and destination diagonally. The supplied cycles advance exactly one grid edge per step.

Add a future edge-connected shape by defining its `cells` and clockwise `cycle` in `model.ts`, then removing any overlapping independent move definitions. No shape-specific animation code is needed. The current union implementation rejects pinched boundaries where cells touch only at a vertex; those require explicit topology rules. Token collision handling for unusual, unevenly spaced future cycles is outside this prototype.

## Moving indentations

The physical model is always:

**rounded base surface − union of moving circles**

Each tile has a luminance SVG mask in board coordinates (`maskUnits` and `maskContentUnits` are `userSpaceOnUse`). A white rectangle exposes the surface; black circles remove material at the current token centers. Every cutout has radius 26.5; the visible token radius is 24.5. The 2-unit clearance leaves the concave rim visible without the old wide empty moat. Mask regions are bounded to each surface with padding for the press/body offsets, rather than allocating a whole-board mask for every tile.

Each mask pre-mounts the tokens that can intersect that surface either at rest or anywhere along any possible next move. This is computed from the existing grid-edge perimeter routes, not hard-coded by tile ID. Candidates are determined before an animation starts, so the unchanged animation hook already has every required circle node when it builds its tracks. The current board uses 77 mask circles instead of 180, and still only **20 visible dot objects**. A regression test samples every move against every surface to ensure this optimization never omits a needed indentation. The same stable token identity connects mask circles, contact-shadow centers and the visible token group to one trajectory.

Dots are treated as flush with or below the tile surfaces. They project no cast, ambient or contact-shadow overlays onto tiles. Their color gradients and highlights remain confined to the dots themselves. Tile-owned shadows and bevels still describe the raised material and live recesses; moving cutout masks are unchanged.

Shared-vertex-to-surface relationships are calculated from the cell definitions and drive active/passive debug classification. The actual deformation is determined continuously by circle/surface intersection, not by fixed corner types or a selected tile's animation state. This naturally handles corner cutouts, semicircular edge bites, concave corners and full interior holes for future shapes.

Only the selected surface receives a press transform and reduced shadow. Its mask stays in board coordinates: the path inside the masked group depresses, not the mask itself. This prevents an elevation animation from offsetting the cutout from its dot. Passive neighbors use the same changing circle positions without receiving the active press transform. Bevel lighting is derived from the already-masked silhouette, so the new concave edges receive a rim as they move.

## Validation and remaining checks

The automated suite checks:

- Exactly 20 unique tokens and four tokens of each color.
- Both requested permutations, immutability, cycle restoration and scrambling invariants.
- One continuous combined boundary, with shared internal edges removed.
- Computed shared-vertex neighbors, including B, C and F at vertex 7.
- Perimeter-only routes and routes through intermediate bends.
- Passive shared-edge intersection at multiple animation positions.
- Exactly 20 visible token groups above the surfaces in rendered SVG.
- Nine masks, all driven by the same token identities, and only the nine valid clickable moves.

TypeScript checking and the production Vite build are also included in `npm run build`.

Browser checks during the visual refactor include comparison against the supplied target board, pointer and keyboard activation, completed perimeter permutations, and sampling live dot/mask/contact-shadow centers. The sampled centers remained synchronized, with 20 visible dots throughout; the combined piece pressed while passive B did not. The engine and animation-hook files were checked against their pre-refactor SHA-256 hashes and remain byte-for-byte unchanged.

**Not yet verified:** touch-device behavior, Safari/Firefox differences or sustained 60 fps. Debug displays the mean requestAnimationFrame interval of the last move; this is an indicator, not a GPU/rendering benchmark. The in-app test session showed slow/variable callback cadence, including in a temporary test without tile filters. No 60 fps claim is made. Whole-board mask allocations were reduced to per-surface bounds, and unreachable mask circles were pruned, without removing live deformation or changing the animation clock. Representative-device profiling is still required.

Suggested manual acceptance pass: run B four times and ADEH ten times, inspect B while ADEH animates at 0.25×, try rapid repeated clicks, use keyboard and touch, then repeat default-speed moves on Chrome, Safari and Firefox. Profile actual paint/compositing time on representative desktop and mobile devices before setting a production performance guarantee.

## Visual limitations

- This is a 2.5D subtraction illusion, not a rubber or soft-body simulation. The material does not stretch, conserve volume, bulge, spring back locally or remember where a dot passed.
- Circular cutouts have a constant radius. Their intersection with the base shape changes continuously, but there is no force-dependent indentation depth.
- Shadows and bevels are stylized screen-space effects. The brief press slightly shifts the path relative to the grid, while the mask intentionally stays aligned with the moving dots.
- Pressing is a CSS transition; token movement uses bounded smoothstep easing rather than overshooting springs so dots never leave the perimeter.
- The debug timing readout measures callback cadence, not actual display presentation. SVG filter cost and antialiasing need verification on target browsers and high-DPI devices.
- For much larger boards, further profile filter regions and surface caching before changing renderers. Current masks already use per-surface bounds and conservative next-move candidates.
- Reduced-motion preferences remove decorative CSS transitions. The central perimeter travel remains, because that movement is the interaction being tested. A final release should add a deliberate reduced-motion gameplay option and non-color token identifiers.

## Is this appropriate for the final game?

My engineering assessment is **yes for this board scale and visual model, subject to browser/device profiling and visual sign-off**. The model/geometry/animation split is intended to survive into a larger game without coupling puzzle logic to SVG. Production work should focus first on accessibility, performance measurements, cross-browser masking/filter consistency and level validation—not a renderer rewrite.

Nothing in the requested interaction requires Canvas or WebGL. I would consider WebGL for genuine 3D soft-body deformation, force-dependent material bulging, dynamic physically based lighting, or a much larger scene that measured profiling shows SVG cannot handle. Canvas alone would not supply those effects automatically; it would require custom geometry and rendering work. For the present moving-circle subtraction experiment, SVG remains the implementation choice.

## References

- SVG masks: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/mask
- Board-coordinate masks: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/maskUnits
- React refs and imperative integration: https://react.dev/reference/react/useRef
