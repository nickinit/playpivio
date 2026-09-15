# Pivio visual refactor

## Current depth treatment

Expanded to an 8×10 dot grid with ten balanced colors (coral, blue, yellow, mint, lavender, orange, rose, teal, lime, slate). The 63 cells form 58 surfaces, preserving the existing three unions spatially. SVG bounds, lighting bounds, background mask and labels now derive from grid dimensions. Desktop board width increases to 950px and remains fluid on smaller screens. Boundary tracing is shared from the model so all cycles regenerate correctly at the new row stride. Earlier board counts below are historical; performance at this larger size still requires device profiling.

Press preview reduced to 8%, with 92% completing on release. This changes only the distance split; easing, the 60 ms minimum press duration, and cancellation behavior remain unchanged.

Interaction update: `usePuzzle.ts` now starts movement on pointer/key down, holds at exactly 15% of perimeter distance, and completes the other 85% on release using the testable `rotationTiming.ts` timeline. Quick taps finish the first segment continuously; cancellation before release restores the original visuals without a logical move. Holding stops the animation-frame loop. All dot, shadow-carrier and indentation nodes still share the same trajectory. Earlier claims that the animation hook is unchanged apply only to the preceding visual refactor.

Reference-image adaptation: softened the hard wavy dot reflection into a feathered elliptical reflection, removed the thin outlined glaze rim, and reduced dark perimeter contrast. Tile seams are now 6 units, with a softer, shallower molded bevel. A background-only grounding pass adds subtle lower-left contact shading: its exclusion mask blacks out all nine base tile silhouettes, following face hover/press transforms, so shadows cannot paint on tile faces. Twenty shadow carriers share existing token trajectories; the visible dot count remains twenty. Grid, zero radial clearance, combined shape, and puzzle logic are unchanged. The later reference-matching request supersedes the earlier blanket removal of background shadows.

Tile recess radius now equals the dot radius (24.5 units), removing the radial clearance so tiles meet the dots. The 10-unit inter-tile seams, dot sizes, and shared moving-mask behavior remain unchanged.

Candy rims are tighter: the flat-color region extends to 82% of the gradient radius instead of 66%, and the glazed lip is reduced from 1.4 to 0.8 units. Overall dot size and highlights are unchanged.

Dots use a candy-button profile: a broad, evenly colored top transitions into a narrow rounded darker rim, with a fine upper-right glazed lip and the existing asymmetric resin highlights. The circular footprint, moving token groups and shadow-free rendering remain unchanged.

Dots now have stronger domed depth: a gradual transition into darker lower-left color tones and brighter asymmetric upper-right highlights. Surface variation and reflected bounce remain, with no cast shadows, extra geometry, or size/clearance changes.

Dot lighting now matches the tiles' upper-right light: the base color gradient and asymmetric resin finish are mirrored horizontally, with the faint reflected bounce moved to the lower-left. Finish variations, colors, sizes and shadow-free rendering are preserved.

The latest keycap depth increase is dialed back halfway: bevel offsets, softness, and side shading are midway between the previous soft bevel and the stronger keycap treatment; the added base-edge opacity is halved. Lighting direction is unchanged.

Keycap-style depth now uses a broad bottom-left side bevel (5 units leftward / 7 downward visually), a narrower bright opposite lip, and a fine darker base edge. These remain inside the live tile silhouette, preserving seams and ball clearance without detached underlays or external shadows. The flatter face and more defined bevel transition suggest a taller molded keycap.

Bottom-left bevel shading opacity increased from .36 to .58 for stronger depth, retaining the approved light direction, softness, and absence of external shadows.

Tile lighting is now softer and more frontal, biased slightly from the upper-right. Reduced bevel offsets and contrast replace the strong downward shading with a subtler bottom-left shaded edge; external cast shadows remain disabled.

The face bevel now has a wider white upper lip and a deeper shaded lower slope to suggest greater tile thickness. Both are derived from and confined to the live face alpha, including moving recesses; no external shadow or offset underside is restored. Grid spacing, seams, and ball clearance are unchanged.

Removed the underneath tile body and all tile cast-shadow layers, including hover/press shadows. Only the face's own internal bevel remains; moving masks and press movement are unchanged. Underlay descriptions below refer to the previous treatment.

Tile inset is now 5 units, widening straight inter-tile seams from 4 to 10 units. Ball radius (24.5), circular cutout radius (26.5), and grid coordinates remain unchanged, preserving the 2-unit radial clearance around balls.

Ball shading now uses a softer base gradient without the old dark perimeter band, a gently irregular broad highlight, a stretched specular glint, and very faint warm/cool surface variation. Three deterministic `BALL_FINISHES` vary the highlight placement slightly between stable token entries while preserving a common upper-left light direction. All finish layers are clipped inside the existing ball radius and use no additional filters, noise animation, textures or cast shadows.

All tile bodies and cast shadows now render in a non-interactive `tile-underlay` pass before any upper surface. This prevents B's shadow/body from painting over E simply because B comes later in the move list. The underlay shares the same live masks and hover/press classes as its corresponding face, so shadow feedback and moving recesses remain synchronized.

Tile face and body gradients now use shared board-space coordinates (`gradientUnits="userSpaceOnUse"`) rather than stretching to each tile's bounding box. The face gradient has restrained contrast, so ADEH and the normal tiles use the same material/light field regardless of shape size. Silhouette bevels and elevation still supply the local depth.

Per the latest clarification, dots are flush with or below the tiles, not hovering. All dot cast shadows, all-around ambient shadows and dot contact-shadow overlays have been removed. Dot gradients, tile-owned shadows/bevels and moving indentation masks remain. Earlier shadow-treatment descriptions below document the intermediate refactor, not the current dot lighting.

Image 1 is the material/proportion reference only. It is not shipped, cropped, embedded or rasterized. The centered page and all puzzle mechanics remain in place.

## Reference comparison

The reference has balls approximately 47% of the grid pitch in diameter, versus approximately 34% in the original prototype. Its recesses wrap tightly around the balls rather than leaving a wide empty moat. It also has substantial molded ivory bodies, rounded light-catching lips, inset center marks, more saturated resin colors, stronger directional contact/cast shadows and a cohesive, dense board footprint.

The implementation now uses a 49-unit ball diameter on the unchanged 104-unit grid pitch. Cutouts grew from radius 23 to 26.5, while clearance decreased from 5.5 to 2. Tile inset decreased from 3.5 to 2, reducing the base inter-tile gap from 7 to 4. The SVG container is 550 CSS pixels wide on desktop, constrained by the available width on smaller screens. This increases the visual scale without changing board coordinates.

## Changed source files

- `src/geometry.ts`: visual radii/gap constants and a conservative renderer-only mask candidate calculation. Existing boundary construction and perimeter interpolation remain unchanged apart from passing the new corner-radius constant into the surface path.
- `src/TileBoard.tsx`: resin palette, spherical highlights, body layer, molded/beveled surface, contact-shadow field, dimples and bounded live masks.
- `src/styles.css`: background tone, desktop board scale, elevation/shadows and tactile hover/press/release styling. Page structure is unchanged.
- `tests/geometry.test.ts`, `tests/render.test.ts`: regression checks for mask pruning, shared shadow identities, uniform materials, proportions and absence of raster board assets.
- `README.md`, `VISUAL-REFACTOR.md`: current architecture, tuning values and validation notes.

`src/model.ts` and `src/usePuzzle.ts` are byte-for-byte unchanged. No grid, cycle, state-management, animation duration, token-identity, reset or scramble code was rewritten.

## Tuning map

| Control | Location | Value |
| --- | --- | --- |
| Logical grid pitch | `src/model.ts`: `STEP` | 104, unchanged |
| Grid origin | `src/model.ts`: `ORIGIN` | 48, unchanged |
| Visible ball radius | `src/geometry.ts`: `DOT_RADIUS` | 24.5 |
| Indentation radius | `src/geometry.ts`: `CUTOUT_RADIUS` | 26.5 |
| Tile inset / half-gap | `src/geometry.ts`: `TILE_GAP` | 5 |
| Base tile corner radius | `src/geometry.ts`: `TILE_CORNER_RADIUS` | 12 |
| Post-cutout join softness | `src/TileBoard.tsx`: `MOLD_SOFTNESS` | 2.1 |
| Center dimple radius | `src/TileBoard.tsx`: `DIMPLE_RADIUS` | 4.2 |
| Contact shadow extent | `src/TileBoard.tsx`: `CONTACT_SHADOW_RADIUS` | Cutout radius + 7 |
| Desktop SVG width | `src/styles.css`: `--board-width` | 550px |
| Body depth | `src/styles.css`: `--tile-body-depth` | 3.8 SVG-space CSS px |
| Face rest / hover / press | `--tile-rest-offset`, `--tile-hover-offset`, `--tile-press-offset` | 0 / −1.1 / +2.8px |
| Resting shadow layers | `--tile-contact-shadow`, `--tile-cast-shadow`, `--tile-ambient-shadow` | Tight / medium / diffuse |
| Ball colors | `src/TileBoard.tsx`: `BALL_COLORS` | Highlight, base, shade, rim per color |

The five base colors are coral `#ff6f6b`, blue `#329df4`, yellow `#ffc845`, mint `#45c995`, and purple `#a36be8` (the existing logical color ID remains `lavender`).

## Visual layers and filters

1. CSS layered `drop-shadow()` on `surface-shadow` produces close contact, elevation and ambient cast shadows. Its state variants deepen on hover and contract on press.
2. `surface-body` plus the `tile-body` gradient supplies a real second SVG silhouette beneath the face.
3. `tile-ivory` shades the upper face. `tile-mold` softens the silhouette *after* live circular subtraction; `surface-bevel` derives the upper-left light rim and lower-right shaded rim from that masked silhouette.
4. `moving-contact-field` supplies dot-following radial ambient occlusion, clipped independently through each tile's moving mask and face clip. It does not use fixed corner-specific shadows.
5. `dot-shadow` blurs two silhouettes together: a faint centered ambient disk that reaches neighboring tiles on every side, and an oval cast shadow offset 3 units right and 10 down using `DOT_SHADOW_OFFSET`. Both are painted above the tiles but below the ball, inside the same animated token group. The centered component gives the upper neighboring tiles soft shading too, without duplicating the stronger directional shadow. The former tight ball-contact shadow is removed and indentation occlusion is reduced to 20% strength, so balls read as hovering rather than seated in dark collars.
6. `color-*`, `dot-bounce` and `dot-gloss` gradients shade each spherical resin piece without metallic highlights or a hard painted-on highlight arc.
7. `dimple-inset` adds a tiny light catch below each muted center dimple. There is one dimple per physical object, including one for the combined tile, not separate internal-cell buttons.

The face returns over 170 ms with a slightly overshooting CSS easing curve; hover uses 140 ms and press uses 80 ms. These only affect elevation. Dots retain the original perimeter timing and path engine.

## Dynamic-SVG limits

The proportions, circular recesses, moving contact shadows and stylized molded material are all representable in the existing dynamic SVG architecture. No Canvas/WebGL or screenshot asset is required. Exact photographic equivalence to the reference's organic resin irregularities, material light scattering and genuinely three-dimensional lighting is not promised. Those are approximated here with gradients and layered silhouette effects, not a physical material simulation.

Expensive filters remain a performance consideration. Tests prove geometry and synchronization, not a 60 fps guarantee; see README for the measured-session caveat and remaining cross-device checks.
