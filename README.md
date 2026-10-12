# Slingshot Empires — Flight Lab v0.14.1

Live game: https://techmonius.github.io/Slingshot-Empires/

## v0.14.1 — orbit grade heatmap and graded flight paths

In the close-up planetary orbit view, a transparent, concentric **grade heatmap** surrounds the planet. Every thin annulus uses the real existing `orbitRating()` rules applied to a **hypothetical circular orbit** (`periapsis = apoapsis = radius; eccentricity = 0`) at that altitude. The circular optimal radius (planet radius + 16 simulation distance units) is marked as a dashed `CIRCULAR S` reference. Bands are sampled at about 0.55 simulation distance units; grade results are cached per planet to keep rendering efficient.

Grade colors: **S mint, A sky-blue, B lime, C gold, D orange, F pink/red**. The unsafe/impact region is red. Grades that cannot occur for a circular orbit at a given body's physical radius and orbit limit will not create artificial bands. The heatmap has **no separate color legend** to keep the map uncluttered. It represents circular-orbit altitude quality only; actual path grades also account for eccentricity, periapsis safety, and apoapsis limits.

When paused in orbit view, the ship's **coasting orbit is drawn dashed in its calculated grade color**; a **proposed burn orbit appears as a solid line in its calculated grade color**, with the legend showing the grade/score or an escape/unsafe status for each. Current flight trail during a local encounter likewise uses the current calculated grade color. Projected periapsis/apoapsis indicators, aiming controls, heatmap visibility during coasts, and manual burn mechanics remain. These visuals do not change the flight physics, orbit scores, saved grades, or station development.

Only a small **COAST / BURN** readout remains in the map overlay, showing each path's computed grade without a separate heatmap key or additional control-panel rows. Tested scoring at safe and unsafe radii, generated heat bands for Cinder/Aurora, Canvas render calls, burn legend, and the Cinder S/90 completion after waiting to both apsides. A C-grade **ring band** is present where the circular scoring model produces C; not all attainable elliptical grades necessarily appear in the circular reference bands.

## v0.14 — persistent multi-rocket orbital stations

Each destination planet (Aurora and Cinder) has an independently saved **orbital station project**. The player must pilot **three separate successful safe-orbit rockets** to commission a station. A mission is a delivery only after the player applies their own manual burns and completes a safe revolution. Crashes, escapes, and the star mission never deliver modules.

### Construction, score, improvements
- 0/3: blueprint. 1/3 and 2/3: construction is visible as an increasing partial orbit ring. 3/3: a permanent orbital station marker appears and moves around the planet in its representative orbit.
- The player's **three best orbit grades (numerical scores)** become that station's structural/orbital quality record. Each additional completed mission is logged; if its score enters the top three, it replaces a lower score. Repeating a bad mission cannot damage the existing station.
- Provisional orbital **logistics quality** is `round(60 + 0.4 × average(best up to 3 recorded scores))` percent for a completed station. This represents the design target for *future* cargo-handling/transport efficiency. It is not yet connected to any actual production, fuel transport or route automation.
- The 🛰 **Station network** button above the map opens a persistent dashboard showing both planets' progress, deliveries, grades and quality. It includes shortcuts to plan another rocket to either destination. Opening it mid-flight pauses the rocket; closing leaves it paused for safety.
- The current target card displays station construction progress or quality. Successful missions report their delivered module and any station upgrade.
- Existing save slots, wins and grades remain intact. A previously recorded planetary win migrates as **one** station module, using the historical grade if recorded. The system cannot infer multiple previous trips because older saves did not store that history.
- All new construction data lives under `stations` in the existing `slingshot-flight-lab-v04` local save key.

A visible station marker is currently a **representative orbit** based on the planet's gravitational parameter; individual module orbits and docking dynamics have not yet been implemented.

### Planned follow-up work

v0.15 adds multi-resource planetary surveying/mining only after station construction, including worlds that cannot locally produce fuel. v0.16 introduces processing/crafting and tech progression. Persistent, automatically repeatable logistical routes will first require manual proof-of-transfer and can then be upgraded by additional improved flights. Beyond that: moons, gravity assists, physically coherent body densities/distances, multiple star systems, and qualitatively new technology. See [GAME_DESIGN.md](GAME_DESIGN.md) for agreed long-range design principles.

## v0.13 — launch Δv precision matches orbital burns

The **interplanetary launch** screen now offers the same precise magnitude controls as the orbital-burn planner:

- Launch delta-v range: **0.00–65.00**, in **0.01** increments.
- Four touch-friendly adjustment buttons: **−0.10**, **−0.01**, **+0.01**, **+0.10**.
- **Reset Δv to 0** button; zero is a permitted launch magnitude, with no forced minimum.
- Launch magnitude displays **two decimal places** and is not rounded back to tenths in trajectory prediction, rocket initialization, or drag aiming.
- Launch direction retains the independent, prograde-relative ±1°/±0.1° controls and 0.1° granularity. The orbit-burn controls are unchanged.
- Launch controls remain inactive during a flight; mission wins and orbit grades are preserved.

The new four-button cluster uses the already compact styling from the orbital maneuver controls so the play map remains as large as practical. Tested fine nudge buttons, zero and 65.00 boundaries, input updates, flight-side lockout, and complete Cinder S/90 capture with 21 Δv remaining.

## v0.12 — orbital burns use the same angle convention as launch

Both launch and the close-up orbital maneuver screen now show **From prograde** and share the same orbital-frame directions:
- **0°: prograde** — add delta-v along the orbit's tangential direction of travel.
- **±180°: retrograde** — oppose that tangential motion.
- **+90°: radial outward** — away from the planet.
- **−90°: radial inward** — toward the planet.
- Full -180° to +180° freedom at **0.1° precision**, and delta-v still supports **0.00 minimum** and **0.01** increments.

During close-up flight the reference rotates continuously with the rocket around the planet, including after waiting to periapsis or apoapsis; it respects both clockwise and counterclockwise trajectories. Since a highly eccentric orbit can include substantial inward/outward velocity, **orbital prograde here is specifically the transverse (tangential) direction**, making +90° always radial outward. This matches Home's circular-orbit launch reference. The basis is planet-relative rather than fixed to screen directions.

An additional green **PRO** reference indicator shows the current tangential heading beside the rocket. Burn arrows, manual drag-to-aim, and both coast and after-burn trajectory predictions agree on the relative angle. Initial capture suggests **180° retrograde** but does not consume fuel or initiate a maneuver. No autopilot has been added. The orbital physics and grade rules are unchanged; saved progress is preserved.

Previous orbital burn directions that were specified as global screen-axis degrees now need conversion into this relative frame. For example, Cinder capture launched at **-95° from Home prograde** at T+0 still yields an S/90 orbit using **retrograde 180° with 5 Δv**, followed by **radial outward +90° with 4 Δv**; fuel left: 21. Verified after apoapsis and periapsis waits, including drag aiming, orbit completion and grade.

## v0.11 — launch angles referenced to orbital prograde

The launch angle is now expressed in **Home's moving orbital frame**, measured from the planet's instantaneous orbital velocity instead of the global screen axes:

- **0° = prograde** (adds launch delta-v in the direction Home travels around the star).
- **+90° = radial outward** (away from the star).
- **−90° = radial inward** (toward the star).
- **±180° = retrograde** (opposes Home's orbital velocity).
- Arbitrary angles from -180° to +180° retain **0.1° precision**.

The launch arrow includes a small green **PRO** reference indicator; the cyan launch arrow and trajectory simulation use the same rotating basis. Dragging from Home converts touch direction back into the displayed prograde-relative angle. Planning a departure later changes the planet's location, its orbital velocity and the corresponding world-space launch direction while the *relative angle remains fixed*. A zero-degree launch continues to align with orbital prograde at any chosen departure time. A new launch defaults to 0°.

**Since v0.12, orbital burns use the same prograde-relative coordinate system.** Saved shots, wins and orbit grades are preserved. Because launch-angle semantics have changed, older mission walkthroughs using absolute screen-axis launch angles must be converted to prograde-relative angles; for example, the former Cinder launch of -20° world/screen direction at T+0 corresponds to **-95° relative to prograde**. Tested with 0°, ±90°, ±180°, arbitrary angles across multiple departure times, touch aiming, and the complete Cinder S/90 mission.

## v0.10 — compact controls and map-first layout

The lower control panel is now a **compact, collapsible dock** instead of a tall stack of fixed-height cards. The top header and statistics are thinner; labels, spacing, unused rows, sliders, fuel indicators, burn-planning cards, grade readouts, and mission links are tightened without removing any controls or precision. On shorter iPhone screens, the control contents scroll independently instead of compressing the map.

**MAP ↑** hides the dock's controls and gives their entire area back to the map. The small dock header remains visible as **CONTROLS ↓** so you can reopen it at any time.

Automatic behavior:
- The panel opens initially for launch planning.
- After launch, it collapses to emphasize the flight map.
- Reaching a planetary encounter or pausing manually expands burn-planning controls.
- Coasting or waiting to apoapsis/periapsis collapses the panel; it expands again when the coast/warp is stopped.
- Resetting the mission reopens launch controls.
- You can override these defaults at any time by tapping the dock toggle.

Pinch zoom, map panning, 0.1-degree angle controls, 0.01 delta-v burn increments, transfer-time waiting, and both apsis-wait features remain unchanged. The layout does not change orbital physics, fuel or saved progress.

## v0.9 — wait for orbital maneuver points

During a planetary encounter, two new buttons are available in the **manual thruster** planner:

- **WAIT TO PERIAPSIS:** Fast-coasts to the nearest reachable point of minimum planet-centered radius (Pe).
- **WAIT TO APOAPSIS:** Fast-coasts to the nearest reachable point of maximum planet-centered radius (Ap). Only applicable to a bound orbit.

The trajectory follows the **same planet-relative, velocity-Verlet simulation used during manual coasting**, rather than teleporting the rocket or snapping it to a preset orbital path. It runs faster while waiting, then automatically **pauses at the radial-velocity turning point** with no fuel consumed. The player can inspect the updated gray coast and cyan burn previews and choose any burn angle and Δv.

The buttons display the estimated simulation-time interval to the next reachable apsis. If the ship has a near-circular orbit with indistinct apsides, is on an escape path without an apoapsis, would crash before reaching the requested point, or would exceed the flight limit, the affected button is disabled. A hyperbolic inbound approach can still coast to periapsis. **STOP WARP** or the on-map pause control cancels an ongoing wait and leaves the ship where it is. These mechanics do not guarantee orbital capture: bad trajectories can still crash or escape.

Pe and Ap markers are drawn even for **0 Δv**, so the player can view orbital extremes on the gray coast projection. No mining or resource throughput systems are implemented yet. The game retains its simplified two-body model within the capture zone.

Tested with both bound-elliptical apsides and unbound incoming periapsis, cancellations, and full Cinder orbital capture (S/90, 21 Δv remaining) after waiting to both apsides.

## v0.8.1 — pinch-only map navigation

Pinch two fingers on the map to zoom **0.5×–6×**, and drag empty map space with one finger to pan. On-screen zoom buttons and the zoom readout have been removed to keep the play area clear. Launch and orbital-burn drag aiming still work. The solar map and encounter camera retain independent zoom settings. Entering a new encounter fits the planet camera automatically.

## Automatic installed-app updates (0.7.1 maintenance)

- When the app launches or returns to the foreground, it checks `release.json` for a newer version and asks the service worker to update.
- When a newer release is ready and the user is **not actively flying**, the app reloads with a release-specific URL, bypassing old browser HTML caching. If the user is mid-flight, reloading is postponed until they reset the mission.
- App-shell HTML uses network-first fetch with `cache: 'no-store'`; previously cached files remain available as an offline fallback. This only works when online and after GitHub Pages has deployed the new commit.
- **One-time transition note:** An older installed v0.6/v0.7 page doesn't contain the new update checker, so a manual Safari refresh or fully closing and reopening the Home Screen app may still be needed to pick up this initial updater. After that, subsequent releases are checked automatically. Device behavior is subject to iOS Safari/PWA service-worker lifecycle.

## New in v0.7 — wait for an orbital transfer window

A prelaunch **WAIT FOR TRANSFER WINDOW** slider advances the start of the mission in simulation time, from **T+0.0 s to T+120.0 s**, in **0.5 s steps**. The **NOW**, **−10 s**, **−1 s**, **+1 s**, and **+10 s** buttons allow coarse adjustments. Backward adjustment is a *planning undo*, not reverse time travel in active gameplay.

Every adjustment moves all three planets consistently along their predefined circular orbits and recomputes the actual no-burn launch trajectory, using the launch planet's **new position and orbital velocity**. Touch aiming, target selection, trajectories and the displayed mission clock all reference the planned epoch. When you tap **LAUNCH ROCKET**, flight begins at the selected epoch and proceeds normally. Timeout is measured **from launch**, not from the start of the star system's timeline. Restarting a mission retains the selected wait value so you can try a different launch angle; tap **NOW** to reset time.

The wait is intentionally free in this *Flight Lab* prototype. Future strategy-game development can assign real in-game economic costs or turn constraints to waiting, and show optimized or approximate transfer windows as research/upgrades.

**This is simulated time**, not real-world seconds, and planets remain on preset circular orbits. Inside a planetary encounter, the local two-body approximation is unchanged.

## New in v0.6 — independent aim angle + burn delta-v

**Both launch and orbit insertion now have the same independent controls**: an angle slider spanning -180° to +180°, plus a separate delta-v magnitude slider. Both angle sliders support **0.1° increments**, with ±1° and ±0.1° buttons for precise touch adjustments. The burn magnitude slider remains **0.00–20.00 delta-v in 0.01 increments** (subject to remaining fuel); launch delta-v is **0–65 in 0.1 increments**.

**Aiming on iPhone:** Before launch, drag outward from HOME to aim. During paused planetary encounter, drag outward from the rocket itself to choose burn direction and magnitude, then fine-tune with sliders/buttons. Angle uses screen axes: **0° = right**, **90° = down**, **-90° = up**, **±180° = left**. This is an absolute world/screen direction, not a predefined BRAKE/BOOST/RADIAL mode.

On reaching the capture zone, the initial angle is suggested from a retrograde direction for convenience, but **no maneuver is applied automatically**. Change it freely; all 360° directions are available. Both coast and after-burn trajectories update for angle and delta-v changes. Zero burn remains true coasting, with no fuel consumption. The game still requires a safe orbit with one revolution to win.

Original missions, saved grades and other mechanics remain intact. Tested free-angle two-burn Cinder capture achieves S/90 with 21 delta-v fuel remaining. This version doesn't claim to model full multi-body dynamics inside planetary capture zones.

## New in v0.5 — fine maneuver control

- **Burn Δv ranges from 0.00 to 20.00**, limited by available fuel, and supports 0.01 increments. Zero is the default.
- Five touch controls: **0**, **−0.10**, **−0.01**, **+0.01**, and **+0.10**.
- A zero burn is a real **coast**: no fuel consumed, gray no-burn trajectory and corresponding orbit grade remain visible, and APPLY BURN is disabled. Press **COAST** to continue.
- Launch Δv now ranges from 0.0 to 65.0 with 0.1 increments (previously minimum 8.0).
- Existing saved mission results and orbit grades are preserved.

## New in v0.4 — orbit planning

After entering a planet’s capture ring the game pauses in a close-up **planet-frame camera**. During this pause the flight planner displays:

- **Gray dashed line:** the trajectory if you COAST without applying another burn.
- **Cyan solid line:** the projected trajectory after the selected burn. It updates with direction and Burn Δv.
- **Pe / Ap:** periapsis and apoapsis (closest and farthest orbital radius, measured from the planet center); shown on the proposed orbit when it is a bound elliptical orbit with meaningful eccentricity.
- **Status:** predicted impact, escape, high apoapsis / operationally unsuitable orbit, or safe capture. You can preview a burn before spending fuel.
- **S–F orbital quality grade:** a preliminary gameplay rating for *future* resource extraction; currently only shown for safe orbits, with collision-risk trajectories receiving F. A safe low-eccentricity orbit near a preferred operational altitude scores best. An S is 90+, A is 75+, B 60+, C 45+, D 30+, F below 30. The grade is NOT a real physics-based mining-efficiency calculation; resource production is not implemented yet.

The grade is recorded after a successful complete orbit, and the best grade achieved per planet is saved locally with the existing shot count and missions. Grade depends on orbital geometry, **not fuel remaining**. Fuel use can become a separate logistical constraint in later versions.

### Pilot instructions

1. Choose Aurora or Cinder. Launch using the angle and Δv controls and projected transfer trajectory.
2. On entering the encounter region, the camera zooms to the planet and flight pauses. Choose BRAKE, BOOST, RADIAL − or RADIAL +. Adjust the Burn Δv slider and see how the cyan orbit reacts relative to the gray coast path.
3. Check the predicted result and quality grade. Tap **APPLY BURN**, then **COAST ▶**. You can pause later to perform more burns.
4. Stay in a safe gravitational orbit for one full revolution to complete the mission and earn a final orbit grade.

Verified two-burn sample maneuvers (perform both before coasting):

| Target | Launch angle | Launch Δv | Burn 1 | Burn 2 | Example grade |
|---|---:|---:|---|---|---|
| Cinder | −20° | 16 | BRAKE 5.0 | RADIAL + 4.0 | S (90) |
| Aurora | −30° | 16 | BRAKE 2.5 | RADIAL + 4.5 | A (86) |

The star impact mission still works. The transfer path projection still simulates star and moving-planet gravity. Within the planet’s encounter zone both the live flight and the projected paths use continuous planet-relative velocity-Verlet two-body integration; in this prototype, stellar tides are omitted inside the encounter zone, and the transition is a gameplay approximation rather than a rigorously calculated sphere-of-influence crossing. Instantaneous maneuver Δv replaces realistic finite-duration thrust.

### iPhone installation / refresh

Open the live game in Safari and use **Share → Add to Home Screen**. Existing Home Screen installs update from GitHub Pages. If an older version remains after deployment, reopen while online or refresh the page in Safari. No Apple Developer account required.

HTML Canvas, JavaScript, PWA manifest and versioned service worker; no external libraries.