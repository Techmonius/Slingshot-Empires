# Slingshot Empires — Flight Lab 0.2

A mobile-first 2D gravitational flight and orbital insertion game for the iPhone. No App Store install needed.

**Live game:** https://techmonius.github.io/Slingshot-Empires/

### Playing
1. Choose **Aurora**, **Cinder**, or **Star**.
2. Aim using touch drag or fine-tune angle and launch delta-v with the sliders. The dotted path predicts a **coasting trajectory** (before burns).
3. For planet missions, fly near your target and **avoid hitting its surface**. The green ring shows the capture zone. The game automatically pauses on first entry.
4. **BURN TO ORBIT** matches a planet-relative circular orbital velocity at your current altitude, consuming the displayed delta-v from your **30 delta-v** insertion fuel budget. If the required burn exceeds your fuel, choose **COAST** and try a different part of the encounter, or retry with a different launch.
5. After the burn, watch one complete revolution to finish the mission. The **Star** mission remains a direct impact challenge.

### Physics scope (important)
During free flight, the rocket experiences gravity from the star **and every moving planet** using velocity-Verlet integration. The planets themselves follow preset circular orbits. The insertion maneuver is a calculated instantaneous velocity change; **after successful insertion, the orbit is demonstrated using the planet-relative two-body approximation**, rather than full long-term multi-body propagation. Orbital stability under stellar tides, fuel mass, realistic thrust duration, and actual sphere-of-influence transitions are future milestones. This keeps early gameplay accessible and clearly separates the physical model from gameplay approximations.

### Install on iPhone
Open the live game in Safari, use **Share → Add to Home Screen**, then launch it from the icon. The game also works in Safari. It should update when re-opened online; if a prior cached version remains, close and reopen the Home Screen app, or open the link in Safari and refresh.

### Tech and data
HTML Canvas / JavaScript / offline-capable service worker / zero external dependencies. Version 0.2 carries over your shot count and prior star win from version 0.1; planet impact wins must now be earned via orbital insertion. Results remain stored locally in your browser/PWA storage. No accounts or servers are involved.
