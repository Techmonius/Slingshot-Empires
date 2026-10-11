# Slingshot Empires — Flight Lab v0.5

Live game: https://techmonius.github.io/Slingshot-Empires/

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