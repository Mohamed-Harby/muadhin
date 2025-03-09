---
Author: Mohamed Harby
Date: 08-03-2025
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
