# Slingshot Empires — Game Design Direction

Project north star: an iPhone-friendly orbital engineering and exploration game whose industrial economy makes orbital piloting meaningful. The player manually pilots rockets to build a persistent infrastructure network. Logistics/factory systems become deep enough to be satisfying, but should not eclipse orbital mechanics, exploration, and experimentation.

## Design commitments

1. **Orbital piloting stays manual.** Every new destination and logistics route must be established by the player's own launch timing, delta-v choice, gravity-assist decisions, encounter maneuvers and safe orbit/docking. The game can simulate a *previously proven* supply route automatically afterward; it must never secretly auto-pilot the first successful delivery.
2. **Multiple rockets construct a persistent station.** A single good orbit is not enough. Each safe completed rocket delivery contributes a station module. Different orbit grades impact station quality and future logistics efficiency. Repeated flights with better scores can upgrade stations. Station construction is a prerequisite for surface mining operations.
3. **Real material logistics.** Different planets offer different resource combinations. Not every planet can mine or manufacture rocket fuel: those worlds must import fuel. Cargo launch capacity, rocket fuel, local storage, launch windows, and supply-chain bottlenecks should all matter.
4. **Persistent proven routes.** Each new interplanetary transfer or station-to-planet shipment is piloted manually at least once. After a successful route is established, the user may schedule repeat trips without re-piloting each individual delivery. Revisiting and piloting improved routes makes them more efficient/robust, with diminishing returns rather than infinite exploitation. Interplanetary and station/surface legs have different costs and requirements.
5. **Industry is rich but secondary.** Mining, refineries, factories and crafting recipes form a substantial gameplay layer. Include multi-input resource transformations and compact spatial/chemical production puzzles inspired by combinatorial crafting and programming/alchemy games, not only bigger throughput numbers.
6. **Technology must enable qualitatively new possibilities.** Beyond pure fuel and efficiency buffs, favor new maneuvers or planning abilities (staging, different propulsion tradeoffs, aerobraking, survey probes, fuel depots, advanced docking, orbital construction, hazardous environments, interstellar navigation, construction blueprints, chemical-reactor puzzles).
7. **Exploration expands the world.** Add moons, asteroid belts, multiple star systems, gravitational assists, and stronger propulsion. Consider combining centralized research/manufacturing with exploration-gated unlocks; the final research progression and central-hub location remain open design decisions.
8. **Plausible gravitational mechanics and better scale.** Current planets are cartoonishly large relative to the star. Future system-generation work should use internally coherent physical parameters (mass, radii, density, gravity, orbital periods, spheres of influence) and deliberately interesting distances. Use legible display scaling/camera zoom without changing gravitational parameters just to make the rendering look attractive. Aim for an engaging Kerbal-inspired feel, not an overly academic orbital simulator.
9. **Persistence is sacred.** No releases should silently reset players' station contributions, flight history, grades, routes, or economies. Version and migrate saved data forward. The existing save key must be preserved or explicitly migrated.
10. **Mobile-first usability.** Maximize the map, preserve pinch zoom and drag controls, and show deep logistics UIs on-demand.

## Incremental releases

### v0.14 — Persistent orbital station construction (implemented)

- Three individually piloted safe-orbit rocket deliveries commission a planet's station.
- The three best delivered orbit scores determine station quality. Further better deliveries replace low scores; failures do not contribute.
- Sample baseline quality metric: `60 + 0.4 × average(top three scores)`, rounded to a whole percent. **This is currently a forward-looking logistics quality rating, not yet an active mining or resource multiplier.**
- Visible under-construction orbit indicator, operational orbital station marker, mission-progress line, station-network dashboard.
- Store per-planet deliveries and top score contributions. Existing planet wins migrate as one prior delivery, not an invented three-mission station.

### Proposed v0.15 — Survey and multi-resource mining

- Finished station unlocks planetary prospecting. Each planet/moon may have several mineral/gas/ice deposits with distinctive extraction constraints.
- Local resources are *physical deposits*, not boosted ore abundance from orbit quality.
- Build simple extractors and storage. Make fuel availability a resource property; most worlds should depend on imported fuel.
- Keep mining disabled for worlds without a completed station.

### Proposed v0.16 — Crafting, processing and research seed

- Multi-input manufacturing recipes; early examples: ore → refined material → structural component → station/module/rocket part.
- Central R&D hub or distributed lab network (TBD); exploring special worlds reveals new science ingredients, manufacturing processes and capabilities.
- Add a compact recipe-logic/alchemical puzzle that rewards clever transformations, branching, sequencing or spatial layout instead of just waiting for resource timers.

### Proposed v0.17 — Manual-first routes and automation after proof

- To open a new route, manually fly a cargo-delivery mission and successfully unload into a station or depot.
- The successful trip becomes a persistent route blueprint. Subsequent shipments can auto-run according to stored capacity, transit time, resources, fuel and launch windows; no manual replay required.
- Additional manually flown missions can improve the route's best known fuel use, safety, travel time or capacity, potentially with different tradeoffs. Routes must be editable/pausable and respect finite inventories.
- Local surface-to-orbit fuel shuttle is a distinct leg. Station and planet launch require fuel and cargo hardware; fuel-deficient worlds need imports.

### Larger universe and physical mechanics (multiple releases)

- Moons, planetary spheres of influence, atmospheric entry/aerobraking, gravity assists and encounter preview.
- Stellar map/navigation layer, multiple stars, deep-space transfers and extreme high-energy launches.
- Orbital transfer trajectories should follow consistent mass/density/orbit parameters. Separate visual body size from physical gravitational scale; revisit current stellar/planetary scales before expanding to multiple systems.
- Use exploration objectives and resource diversity to make distant planets worthwhile; deep-space systems require infrastructure, not arbitrary loading screens.

## Open questions, not blockers for v0.14

- Primary science architecture: single capital hub, distributed labs, or hybrid? Current lean: hybrid manufacturing/research hub with exploration-gated discoveries.
- Whether station quality ultimately weights the best three modules, all installed modules with diminishing returns, or orbit-dependent placement and maintenance costs.
- How to represent physical station docking/individual module orbit data rather than a representative station symbol.
- How many surface tiles/building slots are appropriate for mobile; how much direct factory-layout control versus higher-level crafting puzzles.
- Balance of Kerbal-like orbital challenge versus approachable gameplay assists for casual players.

Implementation should proceed incrementally with tested releases, and each feature should create a meaningful player decision rather than merely increasing a percentage.
