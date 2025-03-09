---
Author: Mohamed Harby
Date: 08-03-2025
Link: https://extensions.gnome.org/extension/7918/muadhin/
GitHub: https://github.com/Mohamed-Harby/muadhin
---

# Mu'adhin

A GNOME Shell extension that displays the time remaining until the next Islamic prayer.

## Features

- **Prayer Times**: Shows the remaining time to the next prayer (Fajr, Dhuhr, Asr, Maghrib, Isha).
- **Dynamic Icon**:
  - Changes color based on the prayer period:
    - After Fajr: Transparent white (morning).
    - After Dhuhr: Yellow (midday).
    - After Asr: Orange (afternoon).
    - After Maghrib: Blue (evening).
  - Switches to a custom crescent moon SVG (`crescent.svg`) between Isha - 30 minutes and Fajr - 30 minutes.
  

## Screenshoots
![image](https://github.com/user-attachments/assets/19274c74-e09d-49dd-9592-23d11c955720) ![image](https://github.com/user-attachments/assets/60cb406c-9405-4fe5-a847-5e8c64214d33)

## Manual Installation
1. Download the .zip file in the relases.
2. Extract the zip file and add the extracted folder in gnome shell extensions path in ubuntu:
  `/home/mohamed-harby/.local/share/gnome-shell/extensions/`
3. Log out from the current ubuntu session or restart the gnome-shell-extensions using `Alt + F2` then write `r` for restart and hit `Enter`.
4. Open the GNOME Extensions app (you can search for "Extensions" in your application menu). If you don’t have it, install it using `sudo apt install gnome-shell-extension-prefs`.
5. In the Extensions app, look for "Muadhin" Toggle the switch next to "Muadhin" to the "On" position.
## Files

- `extension.js`: Main extension logic.
- `metadata.json`: Extension metadata (UUID, name, description, etc.).
- `prayer_times_cairo_2025.json`: Prayer times data for Cairo, 2025.
- `crescent.svg`: Custom SVG icon for the late-night period.
- `fetch_prayer_times.js`: Node.js script to generate prayer times data.

## Credits

- Built with GNOME Shell JavaScript (GJS).
- Prayer times from [Aladhan API](http://api.aladhan.com/).
- Icon inspiration: GNOME symbolic icons.
