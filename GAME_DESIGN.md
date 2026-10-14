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

### v0.15 — Survey and multi-resource mining (implemented)

- A **commissioned three-rocket station** unlocks a one-time planetary survey and the surface operations screen.
- Each current planet has three **finite physical deposits**, with individually persisted reserves, production rates, extractor assignments, and local inventory, and **two active extractors per planet**. No orbital-quality mining bonus.
- **Aurora:** Water Ice, Silicon Ore, Helium-3. Ice and Helium-3 are **fuel precursors only** until later refining technology. **Cinder:** Iron Ore, Copper Ore, Sulfur, with **no local fuel source**.
- Mining stockpiles accumulate on a real-time clock, with six hours of capped offline production and a per-resource 400-unit storage cap. Production halts when exhausted or full.
- Mining/survey state migrates inside the old save key without resetting orbital grades or stations.
- Starter rig assignments are currently free and can be reallocated; **fuel import, shipping, resource consumption, factories and chemical processing remain future work**.
- Later planets and moons should continue the multi-resource rule, add new extraction constraints, power generation and strategic fuel scarcity without making resource richness depend on orbital efficiency.

### v0.16 — Industry, Cargo and Research (in progress; design decisions being confirmed)

**Home infrastructure confirmed:** Home begins with a **basic operational orbital dock**, capable of docking and receiving incoming cargo without requiring three orbital-construction rocket deliveries. Home's advanced facilities must be **explicitly expanded through both completed research and physically delivered construction resources**; Home does not start with a full shipyard, fuel depot, or orbital laboratory.

- v0.16 model: `cargo-core.js` now exposes an operational starter Home dock (initial proposed capacity **80 units**), independent optional **Orbital Fuel Depot**, **Orbital Assembly Yard**, and **Orbital Research Laboratory** facilities. These unlock fuel storage/transfer, orbital shipbuilding, and orbital research respectively.
- Each upgrade requires its own science milestone and real materials **already in Home's orbital inventory**, consumes those materials only upon an explicit successful upgrade operation, and grants additional storage. No upgrade occurs merely because a cargo plan exists.
- Facility upgrade recipes are **provisional raw-material placeholders** until actual crafting and chemical processing unlock manufactured construction components. Storage capacity and costs are subject to balancing. Cargo receipt capacity is checked separately and cannot create or duplicate resources.
- Existing saved inventories load with the free starter dock even if no `homeDock` record exists. The starter dock does not bypass the three-delivery prerequisite on Aurora or Cinder. The present `cargo-core.js` is model-only; upgrades and receipts are not yet wired into the live v0.15 game. **Manual docking/arrival rules are the next design decision.**

**Cargo strategy decision confirmed:** Hybrid logistics. **Early flights use separately piloted surface → orbit and orbit → orbit transfer legs**, with a separate orbit → surface unloading leg where surface delivery is needed. Future technologies may unlock **direct surface-to-surface rockets**, without deleting orbital station routes.

- **Home** will be the primary R&D and advanced-manufacturing hub; other planets can run basic local material-processing chemistry. Survey/research information can travel freely; physical resources must be carried in actual cargo inventories.
- Current implementation groundwork: `cargo-core.js` with six distinct world/location nodes (Home, Aurora, Cinder × surface/orbit), separate planetary surface inventories (existing `mines.stock`) and orbital holds, a Home research-hub inventory, pure route-leg validation and payload/source-inventory checks. No cargo actually moves yet; no route becomes proven simply by being planned.
- **All first-time cargo legs remain manually piloted.** Once a successful route has been proven in-game, v0.17 can automate repeat shipments. Later improved manually flown missions can enhance the proven route, subject to fuel, inventories, and launch windows.
- **Ship customization confirmed: modular spacecraft, expanding through research.** Early craft combine a frame, an engine, fuel tanks, and cargo bays; later technologies unlock additional parts and eventually staging/direct-delivery vehicles. Rather than making modules cosmetic, extra payload adds mass (reducing Δv and acceleration), fuel mass affects both range and acceleration, and different engines trade exhaust velocity against thrust.
- **Modular model groundwork:** `ship-core.js` defines a UI-independent data catalog, module mount/cargo/tank-capacity and research prerequisites, rocket-equation Δv from wet/dry mass, and propellant consumption for *requested* manual burns. Sample module values are **provisional balance parameters**, not approved final gameplay numbers. Pure tests: `node ship-core.test.js`.
- **2D mobile assembly confirmed:** the player drags parts from a tray onto compatible spacecraft sockets, with tap-then-socket as a touch-friendly alternative. The builder uses predefined mount points rather than unrestricted freeform physical placement.
- **Placement physics decision confirmed:** positions can give **operational efficiency bonuses** when parts are mounted well (such as faster tank servicing/thermal protection or cargo loading/unloading). Component positions **must never alter motion**, steering, stability, thrust, acceleration, mass, the rocket-equation Δv, or flight trajectories. Only the actual selected modules/fuel/payload can affect mass, engine properties, and Δv. This distinction is non-negotiable for the agreed game feel.
- **Optimization and preservation confirmed:** placement must improve **both operational speed and resource preservation**. `ship-core.js` projects faster fuel servicing and cargo handling, plus reduced fuel/cargo handling losses for higher placement scores. `ship-builder.html` displays placement badges, previews on highlighted drop sockets, turnaround estimates, and retained material estimates. Example: a standard tank prefers an aft service mount while a compact tank prefers a forward insulated location. Provisional baseline per-handling-operation values are **2.0 min/fuel unit and 3% handling loss**, **1.5 min/cargo unit and 1.5% handling loss**; a 112% slot divides both turnaround and loss rates by 1.12, an 88% slot divides them by .88. No resource is created or automatically spent at preview time, and travel/rocket dynamics remain unchanged. The actual rates and realism of loss triggers should be balanced with the user when live logistics is implemented.
- `ship-builder.html` is now an independent, functional prototype backed by `ship-core.js`, showing a visible rocket, drag/drop and touch controls, swaps/removals, locked advanced parts, fuel/cargo adjustments, mass/acceleration/Δv readouts, and test-only blueprint persistence. It does **not** touch player saves, run missions, or activate the installed app's v0.16 update.
- Still needs user decisions: first module unlocks, fuel provisioning/processing, surface-launch and docking mechanics, and how the fully integrated physical model should bridge the current instantaneous Δv simulation. `cargo-core.js` and `ship-core.js` are not yet wired into the shipped `index.html`; **they do not affect v0.15 gameplay**.
- The first meaningful manufacturing goals will require physical resources from multiple worlds and unlock qualitatively new capabilities (staging, docking, fuel processing, spacecraft configuration), rather than just numeric efficiency modifiers.
- Unit tests can be run with `node cargo-core.test.js`. Do not activate auto-updating release.json before the first player-facing cargo milestone is ready.

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

- Confirmed research architecture: Home is the research and advanced-manufacturing capital, with basic processing distributed among colonies; advanced discoveries can be exploration-gated.
- Whether station quality ultimately weights the best three modules, all installed modules with diminishing returns, or orbit-dependent placement and maintenance costs.
- How to represent physical station docking/individual module orbit data rather than a representative station symbol.
- How many surface tiles/building slots are appropriate for mobile; how much direct factory-layout control versus higher-level crafting puzzles.
- Balance of Kerbal-like orbital challenge versus approachable gameplay assists for casual players.

Implementation should proceed incrementally with tested releases, and each feature should create a meaningful player decision rather than merely increasing a percentage.
