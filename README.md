# Slingshot Empires — Flight Lab 0.1

A small, mobile-first orbital-flight prototype for iPhone. Built with HTML Canvas and JavaScript; no app store or paid software needed.

## Play it on iPhone

**First-time setup:** In this repository, go to **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select **main** and **/(root)**, and press **Save**.

Once published, open https://techmonius.github.io/Slingshot-Empires/ in iPhone **Safari**. Select **Share → Add to Home Screen → Add**. Launch the game from the new Home Screen icon.

The repository must remain public for free GitHub Pages hosting. The game itself has no logins or backend.

## How to play

Select your destination (Aurora, Cinder, or the star). Set your rocket's launch angle and speed using touch drag or the sliders. Follow the projected trajectory; then tap **Launch**.

Your rocket and the planets move through a simulated gravitational field. Complete intercept objectives and try different trajectories. Your progress is stored locally on the device.

## Technology

- 2D HTML Canvas renderer
- JavaScript orbital physics and trajectory predictor
- Progressive Web App manifest and service worker for offline use after assets have loaded
- No external dependencies

## Next milestone

Fuel management, braking maneuvers, and stable orbital capture.
