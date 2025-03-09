// GObject: Base object system for GNOME's JavaScript bindings (GJS), used for creating classes.
import GObject from "gi://GObject";

// St: Stands for "Shell Toolkit", provides UI widgets like icons, buttons, etc.
import St from "gi://St";

// Gio: For file operations to load the JSON prayer times and custom image.
import Gio from "gi://Gio";

// Base class for GNOME Shell extensions, plus gettext for translations (aliased as _).
import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";

// PanelMenu: Provides classes for creating panel menu buttons.
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";

// PopupMenu: Provides classes for creating dropdown menu items.
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";

// Main: Access to the main GNOME Shell UI components (like the panel and notifications).
import * as Main from "resource:///org/gnome/shell/ui/main.js";

import Clutter from "gi://Clutter";
import GLib from "gi://GLib";

const Indicator = GObject.registerClass(
  class Indicator extends PanelMenu.Button {
    _init(extensionPath) {
      super._init(0.5, _("Mu'adhin Indicator"));
      log("Mu'adhin: Initializing indicator");
      this._extensionPath = extensionPath;
      log(`Mu'adhin: Extension path received: ${this._extensionPath}`);

      this._box = new St.BoxLayout({
        style_class: "prayer-indicator-box",
        vertical: false,
      });
      this.add_child(this._box);
      log("Mu'adhin: Box layout created and added");

      // Add the prayer name label (leftmost)
      this._prayerNameLabel = new St.Label({
        text: "Unknown",
        style_class: "prayer-name-label",
        y_align: Clutter.ActorAlign.CENTER,
      });
      this._box.add_child(this._prayerNameLabel);
      log(
        "Mu'adhin: Prayer name label added to box with initial text 'Unknown'"
      );

      // Add the icon (initially symbolic, will switch to custom image when needed)
      this._icon = new St.Icon({
        icon_name: "media-record-symbolic",
        style_class: "system-status-icon",
      });
      this._box.add_child(this._icon);
      log("Mu'adhin: Icon added to box");

      // Add the remaining time label
      this._timeLabel = new St.Label({
        text: "00:00",
        style_class: "prayer-time-label",
        y_align: Clutter.ActorAlign.CENTER,
      });
      this._box.add_child(this._timeLabel);
      log("Mu'adhin: Time label added to box with initial text '00:00'");

      // Menu item
      //   let item = new PopupMenu.PopupMenuItem(_("Show Notification"));
      //   item.connect("activate", () => {
      //     log("Mu'adhin: Menu item 'Show Notification' activated");
      //     Main.notify(_("Time for prayer!"));
      //   });
      //   this.menu.addMenuItem(item);
      //   log("Mu'adhin: Menu item added to dropdown");

      // Load prayer times from JSON file
      this._loadPrayerTimes();

      // Start the timer update
      this._nextPrayerTime = null;
      this._nextPrayerName = null;
      log("Mu'adhin: Starting prayer time update");
      this._updatePrayerTime();
      this._timeoutId = GLib.timeout_add_seconds(
        GLib.PRIORITY_DEFAULT,
        60,
        () => {
          log("Mu'adhin: Timer tick");
          this._updatePrayerTime();
          return GLib.SOURCE_CONTINUE;
        }
      );
      log("Mu'adhin: Timer started with 60-second interval");
    }

    // Load prayer times from the JSON file
    _loadPrayerTimes() {
      try {
        const filePath = `${this._extensionPath}/prayer_times_cairo_2025.json`;
        log(`Mu'adhin: Attempting to load prayer times from ${filePath}`);
        const file = Gio.File.new_for_path(filePath);
        if (!file.query_exists(null)) {
          log(`Mu'adhin: Error: Prayer times file not found at ${filePath}`);
          this._prayerTimes = {};
          return;
        }
        log("Mu'adhin: File exists, reading contents");
        const [, contents] = file.load_contents(null);
        const jsonString = imports.byteArray.toString(contents);
        this._prayerTimes = JSON.parse(jsonString);
        log(
          `Mu'adhin: Prayer times loaded successfully, keys: ${
            Object.keys(this._prayerTimes).length
          }`
        );
      } catch (error) {
        const errorMsg = error.message || "Unknown error";
        log(`Mu'adhin: Error loading prayer times: ${errorMsg}`);
        this._prayerTimes = {};
      }
    }

    // Update icon color and type based on current prayer period
    _updateIconColor(now, todayPrayers, tomorrowPrayers) {
      const prayerTimes = [
        { name: "Fajr", time: todayPrayers.Fajr },
        { name: "Dhuhr", time: todayPrayers.Dhuhr },
        { name: "Asr", time: todayPrayers.Asr },
        { name: "Maghrib", time: todayPrayers.Maghrib },
        { name: "Isha", time: todayPrayers.Isha },
      ];

      // Convert prayer times to Date objects
      const prayerDates = prayerTimes
        .map((prayer) => {
          if (!prayer.time) return null;
          const [hours, minutes] = prayer.time.split(":").map(Number);
          const prayerTime = new Date(now);
          prayerTime.setHours(hours, minutes, 0, 0);
          return { name: prayer.name, time: prayerTime };
        })
        .filter(Boolean);

      // Add tomorrow's Fajr for the night period
      const tomorrowFajr = tomorrowPrayers.Fajr || "00:00";
      const [fajrHours, fajrMinutes] = tomorrowFajr.split(":").map(Number);
      const tomorrowFajrTime = new Date(now);
      tomorrowFajrTime.setDate(now.getDate() + 1);
      tomorrowFajrTime.setHours(fajrHours, fajrMinutes, 0, 0);
      prayerDates.push({ name: "Next Fajr", time: tomorrowFajrTime });

      // Find Isha and Fajr times for the special condition
      const ishaTime = prayerDates.find((p) => p.name === "Isha")?.time;
      const nextFajrTime = prayerDates.find(
        (p) => p.name === "Next Fajr"
      )?.time;

      if (ishaTime && nextFajrTime) {
        const ishaMinusHalfHour = new Date(ishaTime);
        ishaMinusHalfHour.setMinutes(ishaMinusHalfHour.getMinutes() - 30);
        const fajrMinusHalfHour = new Date(nextFajrTime);
        fajrMinusHalfHour.setMinutes(fajrMinusHalfHour.getMinutes() - 30);

        // Check if current time is between Isha - 0.5h and Fajr - 0.5h
        if (now >= ishaMinusHalfHour && now <= fajrMinusHalfHour) {
          const crescentPath = Gio.File.new_for_path(
            `${this._extensionPath}/crescent.svg`
          );
          if (crescentPath.query_exists(null)) {
            this._icon.gicon = Gio.FileIcon.new(crescentPath); // Load SVG as GIcon
            this._icon.style = "color: rgb(255, 255, 255); "; // White tint (optional)
            log(
              `Mu'adhin: Set icon to custom crescent.svg between Isha-0.5h (${ishaMinusHalfHour.toISOString()}) and Fajr-0.5h (${fajrMinusHalfHour.toISOString()})`
            );
          } else {
            log(
              `Mu'adhin: crescent.svg not found at ${this._extensionPath}/crescent.svg, falling back to default`
            );
            this._icon.icon_name = "media-record-symbolic";
            this._icon.style = "color: rgb(50, 50, 50);";
          }
          return;
        }
      }

      // Default to prayer-based colors if not in the special period
      let color;
      this._icon.icon_name = "media-record-symbolic"; // Reset to default symbolic icon
      if (now < prayerDates[0].time) {
        color = "rgb(50, 50, 50)"; // Before Fajr (night)
      } else {
        for (let i = 0; i < prayerDates.length - 1; i++) {
          if (now >= prayerDates[i].time && now < prayerDates[i + 1].time) {
            switch (prayerDates[i].name) {
              case "Fajr":
                color = "rgba(255, 255, 255, 0.56)"; // Transparent white (morning)
                break;
              case "Dhuhr":
                color = "rgb(255, 255, 0)"; // Yellow (midday)
                break;
              case "Asr":
                color = "rgb(221, 101, 22)"; // Orange (afternoon)
                break;
              case "Maghrib":
                color = "rgb(52, 52, 126)"; // Blue (evening)
                break;
              case "Isha":
                color = "rgb(50, 50, 50)"; // Light black (night)
                break;
              default:
                color = "rgb(50, 50, 50)"; // Fallback
            }
            break;
          }
        }
      }

      this._icon.style = `color: ${color};`;
      log(
        `Mu'adhin: Updated icon color to ${color} after ${
          prayerDates.find((p) => p.time <= now)?.name || "Unknown"
        }`
      );
    }

    // Calculate and update the remaining time (hh:mm format) and prayer name
    _updatePrayerTime() {
      const now = new Date();
      log(`Mu'adhin: Updating prayer time, current time: ${now.toISOString()}`);
      const dateKey = now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      log(`Mu'adhin: Current date key: ${dateKey}`);
      const todayPrayers = this._prayerTimes[dateKey] || {};
      log(`Mu'adhin: Today's prayers: ${JSON.stringify(todayPrayers)}`);

      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      const tomorrowKey = tomorrow.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const tomorrowPrayers = this._prayerTimes[tomorrowKey] || {};

      if (!this._nextPrayerTime || this._nextPrayerTime <= now) {
        log(
          "Mu'adhin: Next prayer time not set or has passed, calculating new one"
        );
        this._setNextPrayer(todayPrayers, now);
      }

      this._updateIconColor(now, todayPrayers, tomorrowPrayers);

      const diffMs = this._nextPrayerTime - now;
      log(
        `Mu'adhin: Time difference to next prayer (${this._nextPrayerName}): ${diffMs}ms`
      );
      if (diffMs <= 0) {
        this._timeLabel.set_text("Now");
        this._prayerNameLabel.set_text(this._nextPrayerName || "Unknown");
        log(`Mu'adhin: Prayer time (${this._nextPrayerName}) has arrived`);
        Main.notify(_("Prayer time has arrived!"));
        this._setNextPrayer(todayPrayers, now);
      } else {
        const totalMinutes = Math.floor(diffMs / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const timeStr = `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`;
        this._timeLabel.set_text(timeStr);
        this._prayerNameLabel.set_text(this._nextPrayerName || "Unknown");
        log(
          `Mu'adhin: Updated labels to ${
            this._nextPrayerName
          } ${timeStr} for time ${this._nextPrayerTime.toISOString()}`
        );
      }

      return GLib.SOURCE_CONTINUE;
    }

    // Set the next prayer time based on current time and prayer schedule
    _setNextPrayer(prayers, now) {
      const prayerTimes = [
        { name: "Fajr", time: prayers.Fajr },
        { name: "Dhuhr", time: prayers.Dhuhr },
        { name: "Asr", time: prayers.Asr },
        { name: "Maghrib", time: prayers.Maghrib },
        { name: "Isha", time: prayers.Isha },
      ];
      log(
        `Mu'adhin: Checking prayers for today: ${JSON.stringify(prayerTimes)}`
      );

      for (let prayer of prayerTimes) {
        if (!prayer.time) {
          log(`Mu'adhin: Skipping ${prayer.name} due to missing time`);
          continue;
        }
        const [hours, minutes] = prayer.time.split(":").map(Number);
        const prayerTime = new Date(now);
        prayerTime.setHours(hours, minutes, 0, 0);
        log(
          `Mu'adhin: Calculated ${
            prayer.name
          } time: ${prayerTime.toISOString()}`
        );
        if (prayerTime > now) {
          this._nextPrayerTime = prayerTime;
          this._nextPrayerName = prayer.name;
          log(
            `Mu'adhin: Set next prayer to ${
              prayer.name
            } at ${prayerTime.toISOString()}`
          );
          return;
        }
      }

      // If all prayers passed today, set to tomorrow's Fajr
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowKey = tomorrow.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      log(
        `Mu'adhin: All prayers passed today, checking tomorrow: ${tomorrowKey}`
      );
      const tomorrowPrayers = this._prayerTimes[tomorrowKey] || {};
      const fajrTime = tomorrowPrayers.Fajr || "00:00";
      const [hours, minutes] = fajrTime.split(":").map(Number);
      this._nextPrayerTime = new Date(tomorrow.setHours(hours, minutes, 0, 0));
      this._nextPrayerName = "Fajr";
      log(
        `Mu'adhin: Set next prayer to tomorrow's Fajr at ${this._nextPrayerTime.toISOString()}`
      );
    }

    // Clean up when destroyed
    destroy() {
      if (this._timeoutId) {
        GLib.source_remove(this._timeoutId);
        this._timeoutId = null;
        log("Mu'adhin: Timer removed");
      }
      log("Mu'adhin: Indicator destroyed");
      super.destroy();
    }
  }
);

export default class IndicatorExampleExtension extends Extension {
  enable() {
    log(`Mu'adhin: Enabling extension with UUID: ${this.uuid}`);
    this._indicator = new Indicator(this.path);
    Main.panel.addToStatusArea(this.uuid, this._indicator);
    log("Mu'adhin: Indicator added to panel");
  }

  disable() {
    log("Mu'adhin: Disabling extension");
    this._indicator.destroy();
    this._indicator = null;
    log("Mu'adhin: Extension disabled");
  }
}
