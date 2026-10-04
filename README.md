# Command Bar

Spotlight-style command bar - app launcher, calculator, currency, time zones, date maths, emoji, kill process and your own keyword commands

![Command Bar: Spotlight-style command bar for Omarchy](preview.png)

<p align="center">
  <b>Open an app</b><br>
  <img src="screenshots/apps.png" alt="Opening Brave or one of its actions" width="460">
</p>

<p align="center">
  <b>Switch window</b><br>
  <img src="screenshots/windows.png" alt="Switching to an open window" width="460">
</p>

<p align="center">
  <b>Kill a process</b><br>
  <img src="screenshots/kill.png" alt="Quitting a process" width="460">
</p>

## What it does

| Type | Result |
|------|--------|
| `12*8 + 15%`, `sqrt(2)`, `15% of 200`, `5!` | Calculator |
| `100 usd to eur`, `$50`, `50 gbp`, `usd jpy` | Currency conversion, using rates from [open.er-api.com](https://open.er-api.com) |
| `time`, `time in tokyo`, `3pm cet to pst` | Time zones |
| `days until dec 25`, `today + 45 days`, `next friday` | Date calculations |
| `:fire`, `emoji party` | Emoji search. Enter types the emoji into the app you were using |
| `5 km to mi`, `72f`, `5 ft 11 in to cm`, `2 cups in ml` | Unit conversion: length, weight, temperature, volume, area, speed, data and time. Offline |
| `brave`, `netflix`, `w `, `w github` | Switch to an open window, found by its app or its title. `w ` lists them all, most recent first |
| `firefox`, `term`, `vsc`, `brave new window` | Open an installed app, or one of its actions like New Window. Only apps: nothing here changes a setting or a default |
| `kill`, `kill chrome`, `kill -9 node` | Quit one of your processes, or all processes with that name |
| `g …`, `yt …`, `gh …`, `wiki …`, `lock` | Keyword commands, which you can change in the config |

Type part of a feature's name to find it. `emo` finds Search emoji and `curr` finds Convert currency.

Type `?` for help. It lists one topic per feature. Enter opens a topic, and each example in it shows the answer it would give, so `5 km to mi` reads `→ 3.1069 mi`. Enter on an example tries it. Esc goes back to the topics. Type words after the `?` to search the help, for example `?money`.

Results come in groups (Windows, Apps, Calculator and so on). A sum or a conversion at the top shows in large type. The footer names the selected row's group and what Enter will do with it, such as Open, Switch or Copy.

Keys:

- Up/Down or Ctrl+N/P moves the selection.
- Enter copies, opens or runs the selected row.
- Tab fills in the query for the selected row, for example a keyword and a space.
- Esc clears the text. Press it again to close the bar.

After you copy, open or run something, the bar starts empty next time. If you close it without doing anything (Esc or clicking outside), it keeps your text, selected, so typing replaces it.

## Install

```sh
omarchy plugin add https://github.com/Saikomantisu/omarchy-commandbar --enable
```

Press Super + Period to open it. You can change the key with `"hotkey"` in the config. If another action already uses the key, the bar leaves it alone and shows a notification.

To open the bar with text already filled in, pass a query. For example, to open emoji search directly:

```sh
omarchy-shell shell toggle io.github.saikomantisu.commandbar '{"query": ":"}'
```

### Dependencies

All of these come with Omarchy:

- `curl`: exchange rates
- `wl-copy` (from `wl-clipboard`): copying results
- `xdg-open`: web keyword commands
- `ps` and `kill` (from `procps-ng`): the process list
- `date` and `timedatectl`: time zones
- `uwsm-app` and `gtk-launch`: opening apps, the same way Omarchy's own launcher does
- `hyprctl`: setting the hotkey, and listing and focusing windows
- `notify-send`: warning when the hotkey is already taken
- `omarchy-menu-emoji-insert` and Omarchy's `emojis.json`: emoji

### Network, files and processes

- The only network request is to `https://open.er-api.com/v6/latest/USD`, made when you convert currency and the saved rates are out of date. The rates update once a day. What you type is not sent anywhere, except the text you search with a web keyword like `g`.
- It writes only to `~/.cache/omarchy-commandbar/`: the saved rates, your last query, and how often you've opened each app from the bar (used to order equally good matches). It does not change your Hyprland or Omarchy config files.
- It sets its hotkey in the running Hyprland with `hyprctl eval`, and sets it again after Hyprland reloads its config. The hotkey is removed when the plugin is disabled or removed.
- It lists only your own processes, and quits one only when you press Enter on it.

## Remove

```sh
omarchy plugin remove io.github.saikomantisu.commandbar
rm -rf ~/.cache/omarchy-commandbar ~/.config/omarchy/extensions/commandbar.json
```

The hotkey is removed with the plugin.

## Configure

Put your settings in `~/.config/omarchy/extensions/commandbar.json`. They override the defaults in [`config.default.json`](config.default.json), and changes apply when you save. You can use comments and trailing commas.

```jsonc
{
  // A Hyprland key combination. "" means no hotkey.
  "hotkey": "SUPER + PERIOD",
  // Features to turn on. When results score equally, earlier ones come first.
  "providers": ["commands", "math", "currency", "time", "emoji", "processes", "units", "windows", "apps"],
  // Default home currency is USD.
  "currency": { "home": "EUR", "favorites": ["USD", "GBP"] },
  // Default home zone is your system time zone.
  "time": { "home": "Europe/Berlin", "zones": ["UTC", "America/New_York"], "clock24": true },
  // "paste" types the emoji into the app you were using; "copy" copies it.
  "emoji": { "onEnter": "paste" },
  // This list replaces the default keyword commands.
  "commands": [
    { "keyword": "g", "title": "Search Google", "open": "https://www.google.com/search?q={q}" },
    { "keyword": "ddg", "title": "DuckDuckGo", "open": "https://duckduckgo.com/?q={q}" },
    { "keyword": "term", "title": "Terminal", "run": "xdg-terminal-exec" },
    { "keyword": "say", "title": "Notify", "run": "notify-send {q}" }
  ]
}
```

`{q}` is whatever you type after the keyword. In `open` commands it is URL-encoded. In `run` commands it is shell-quoted, so it can't change the command itself.

## Adding a feature

Each feature is a JavaScript file in `providers/`:

```js
.pragma library

var provider = {
  id: "units",
  name: "Units",
  icon: "󰕒",
  // Found by name: typing "unit" shows this command.
  commands: [{ title: "Convert Units", keywords: "unit convert", text: "e.g. 5 km to mi", complete: "5 km to mi", select: true }],
  // Shown in the "?" list.
  help: [{ title: "Units", examples: ["5 km to mi", "30c to f"] }],
  // Return [] if the query isn't for this feature.
  match: function(query, ctx) {
    return [{ title: "3.11 mi", subtitle: "5 km → mi", score: 80, copy: "3.11" }]
  }
}
```

A result can include `run: { kind: "open" | "run", target }` to open or run something on Enter. `ctx.settings` is the provider's section of the config. `ctx` also has `rates`, `zones`, `localZone`, `emojis`, `processes`, `now()`, `format(n)` and `plain(n)`.

To enable it, import it in [`providers/index.js`](providers/index.js), add it to the list there, and add its `id` to `"providers"` in the config.

Test providers without the shell by running `node tests/run.js`.

To contribute, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
