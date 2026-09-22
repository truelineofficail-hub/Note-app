NOTES - offline installable web app
====================================
Files
  index.html      app shell
  style.css       styles
  app.js          app logic + service-worker registration
  sw.js           service worker (caches everything, works fully offline)
  manifest.json   web app manifest (install to home screen)
  icons/          app icons (any + maskable, apple-touch, favicon, svg)

Deploy (GitHub Pages)
  1. Unzip and upload ALL files to the root of a GitHub repo (keep the icons folder).
  2. Settings -> Pages -> Deploy from a branch -> main -> / (root).
  3. Open https://YOUR-USERNAME.github.io/REPO-NAME/ once with internet.
     After that it works with no connection.
  Install: Android Chrome -> menu -> "Install app"; iPhone Safari -> Share -> "Add to Home Screen".

Local test (service workers need http, not file://)
  python3 -m http.server 8000     then open http://localhost:8000

Your data
  Notes, settings and your PIN (as a hash, not plain text) are saved only in this
  browser on this device. Clearing the site's data removes them, including if the
  PIN is forgotten. There is no account and no server.

Reminders
  Reminders only fire while the app is open in a browser tab (foreground or background
  tab). They do not wake the app up if it is fully closed.

Updating: change VERSION at the top of sw.js so phones fetch the new files.
Fonts: the app uses your device's built-in fonts, so nothing is downloaded.
