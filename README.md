# Slingshot Empires — Flight Lab 0.3

**Play:** https://techmonius.github.io/Slingshot-Empires/

## Change from v0.2

Orbital capture is now **manual and physical** rather than a guaranteed circularization or animated fake orbit. There is no longer an automatic velocity match. After encountering a target planet, the game pauses so you can plan a manual burn. Set thrust direction (BRAKE, BOOST, RADIAL −, RADIAL +) and amount (Δv), then tap **APPLY BURN** and **COAST**. Each burn consumes fuel from a 30 Δv budget; multiple burns are allowed. The status line shows current planet-relative radial and tangential velocity, plus the local circular speed at that altitude. The prospective post-burn orbit shows periapsis/apoapsis, and flags a safe orbit. To win, **maintain a safe non-impacting bound orbit for a full revolution** while fuel/physics remain in play. Bad choices crash or escape.

### Physics scope

Before the first encounter, the rocket follows star plus all moving planets' gravitational accelerations (the v0.2 Newtonian integration). Planet positions remain on predefined stellar orbits. **After entering the encounter zone**, integration continues with a patched-conic *planet-relative two-body approximation*: planet position/velocity continue to move, and the rocket orbits under that planet's gravity. The star's tides and other bodies' effects are intentionally omitted while in this local mode, and the transition is not a realistic planetary sphere of influence. No orbit is scripted, and no maneuver guarantees circularization. More realistic sphere-of-influence boundaries can come later.

### Install on iPhone

Open link in Safari, Share → Add to Home Screen. Your existing Home Screen game updates automatically after cache refresh (close/open while online). Old version 0.2 shots and wins are carried forward. If an old version persists, launch in Safari and reload.

### Game controls

Launch target, angle and speed: same as before. When green capture circle is reached: game pauses. Set direction:
- BRAKE: slow tangential speed relative to planet;
- BOOST: increase tangential speed;
- RADIAL −: thrust inward;
- RADIAL +: thrust outward.
Select Burn Δv and tap APPLY BURN. It deducts fuel immediately and leaves you paused to reconsider; tap COAST ▶ to continue. Pause at any time for another burn. Retrograde/prograde are defined relative to the current sign of angular momentum around the target. There is no automatic insertion.