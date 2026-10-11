# Slingshot Empires — Flight Lab v0.8

Live game: https://techmonius.github.io/Slingshot-Empires/

## New in v0.8 — zoom and pan

- **Pinch with two fingers** on the map to zoom smoothly between **0.5× and 6×**. Pinch center remains visually anchored to the same world point; dragging two fingers together also pans.
- **Plus (+)** and **minus (−)** buttons on the right edge of the map provide touch-accessible zoom for one-handed play. **FIT** resets the current view's scale and pan.
- **Drag empty space** with one finger to pan. Dragging from HOME still sets launch direction and delta-v, and dragging from the rocket during paused encounter still sets burn direction and delta-v. Starting a second touch cancels an in-progress aim drag and begins the pinch gesture instead.
- The solar-system map and the close-up orbit camera store zoom separately. Entering a new planetary encounter fits the orbit view automatically; resetting returns to the solar map with its previous zoom intact.
- Zoom, pan, and FIT are view-only: they never change physical coordinates, simulated time, fuel, orbit grades or launch trajectories. Desktop mouse wheel is also supported.
- Mobile screen overlays are compact so map controls stay accessible during flight.

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