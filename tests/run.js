// node tests/run.js — exercises every provider against mocked rates, zones and clock.
const load = require("./loader")
const P = require("path").join(__dirname, "..") + "/"
const Engine = load(P + "lib/Engine.js")
const defaults = Engine.parseJsonc(require("fs").readFileSync(P + "config.default.json", "utf8"))
// Most cases run as a Sri Lanka user; the neutral defaults are checked separately below.
const config = Engine.deepMerge(defaults, { currency: { home: "LKR", favorites: ["USD", "EUR", "INR"] }, time: { home: "Asia/Colombo" } })
const rates = { rates: { USD: 1, LKR: 300.5, EUR: 0.9, INR: 83.2, GBP: 0.78, JPY: 150 }, updated: 1790000000, stale: false }
const zones = { "Asia/Colombo": { offset: 330, abbr: "+0530" }, "UTC": { offset: 0, abbr: "UTC" }, "America/New_York": { offset: -240, abbr: "EDT" }, "Europe/London": { offset: 60, abbr: "BST" }, "America/Los_Angeles": { offset: -420, abbr: "PDT" }, "Asia/Tokyo": { offset: 540, abbr: "JST" } }
const now = () => new Date(2026, 8, 23, 14, 0)   // 23 Sep 2026 14:00 local
let fails = 0
const emojis = JSON.parse(require("fs").readFileSync("/usr/share/omarchy/shell/plugins/emojis/emojis.json", "utf8"))
const processes = [
  { pid: 101, rss: 400000, cpu: 12.5, name: "chrome", args: "/opt/google/chrome/chrome" },
  { pid: 102, rss: 200000, cpu: 3.0, name: "chrome", args: "/opt/google/chrome/chrome --type=renderer" },
  { pid: 103, rss: 50000, cpu: 0.1, name: "Web Content", args: "/usr/lib/firefox/firefox -contentproc" },
  { pid: 104, rss: 90000, cpu: 20.0, name: "node", args: "node server.js" }
]
const app = (id, name, generic, actions, keywords) => ({ id, name, generic: generic || "", comment: "", keywords: keywords || [], icon: id, actions: (actions || []).map((n, i) => ({ index: i, name: n })) })
const apps = [
  app("brave-browser", "Brave", "Web Browser", ["New Window", "New Private Window"]),
  app("firefox", "Firefox", "Web Browser", ["New Window", "New Private Window"]),
  app("org.gnome.Nautilus", "Files", "File Manager", [], ["folder", "explorer"]),
  app("Alacritty", "Alacritty", "Terminal", [], ["shell", "prompt"]),
  app("code", "Visual Studio Code", "Text Editor", ["New Empty Window"]),
  app("org.localsend.localsend_app", "LocalSend", "File Sharing"),
  app("signal", "Signal", "Messenger")
]
let launches = { "firefox": 12 }
const windows = [
  { address: "0xa1", cls: "firefox", title: "Mozilla Firefox", workspace: "2", focus: 0 },          // the one you're in: never listed
  { address: "0xb1", cls: "brave-browser", title: "Netflix - Brave", workspace: "1", focus: 1 },
  { address: "0xb2", cls: "brave-browser", title: "GitHub - Brave", workspace: "3", focus: 3 },
  { address: "0xc1", cls: "org.gnome.Nautilus", title: "Images", workspace: "5", focus: 2 },
  { address: "0xd1", cls: "com.mitchellh.ghostty", title: "~/Code", workspace: "special:scratch", focus: 4 },
  { address: "$(rm -rf ~)", cls: "evil", title: "Evil window", workspace: "1", focus: 5 }
]
let requested = 0
let openWindows = []   // the app tests run with nothing open; the window tests switch these on
function q(query) { return Engine.run(query, config, { rates, zones, now, ratesStatus: "", emojis, processes, apps, windows: openWindows, launches, requestProcesses: () => requested++ }) }
function expect(query, want) {
  const rows = q(query)
  const top = rows[0] ? rows[0].title : "(none)"
  const ok = want === null ? rows.length === 0 : (want instanceof RegExp ? want.test(top) : top === want)
  if (!ok) fails++
  console.log((ok ? "ok  " : "FAIL") + "  " + JSON.stringify(query).padEnd(30) + " → " + top + (rows[0] ? "  | " + rows[0].subtitle : "") + (ok ? "" : "   (want " + want + ")"))
}
expect("2+3*4", "14"); expect("2^10", "1,024"); expect("15% of 200", "30"); expect("200+10%", "220"); expect("200 - 15%", "170")
expect("sqrt(16)", "4"); expect("2pi", "6.283185307"); expect("3(4+1)", "15"); expect("3x4", "12"); expect("10 % 3", "1"); expect("10 mod 4", "2")
expect("0.1+0.2", "0.3"); expect("1,000 * 3", "3,000"); expect("max(1,5,3)", "5"); expect("-2^2", "-4"); expect("5!", "120"); expect("1/0", "∞"); expect("2e3+1", "2,001")
expect("hello", null); expect("42", null); expect("(1+2", null); expect("", null)
expect("100 usd to lkr", "30,050 LKR"); expect("100usd in eur", "90 EUR"); expect("$50", "15,025 LKR"); expect("€20 to inr", /^1,848\.89 INR$/)
expect("50 eur", /LKR$/); expect("usd lkr", "300.5 LKR"); expect("usd to lkr", "300.5 LKR"); expect("12*50 usd", "180,300 LKR"); expect("1 lkr", /USD$/); expect("usd", null)
expect("time", /Colombo/); expect("time in tokyo", /Tokyo/); expect("tokyo time", /Tokyo/); expect("3pm lkt to pst", "02:30 Los Angeles"); expect("15:30 in london", "11:00 London")
expect("9am to tokyo", "12:30 Tokyo"); expect("11pm to tokyo", "02:30 Tokyo (+1 day)")
expect("days until dec 25", /^93 days/); expect("today + 45 days", "Sat, 7 Nov 2026"); expect("2026-01-01 to 2026-09-23", /^265 days/); expect("next friday", "Fri, 25 Sep 2026")
expect("days since jan 1", /^265 days/); expect("in 2 weeks", "Wed, 7 Oct 2026"); expect("until christmas", /^93 days/); expect("dec 25", "Fri, 25 Dec 2026")
expect("g foo bar", "Search Google: foo bar"); expect("g", "Search Google…"); expect("lock", "Lock screen"); expect("lo", "Lock screen")
// emoji
expect(":fire", /fire/); expect("emoji thumbs up", /thumbs up/); expect(":", "Type a word after the colon"); expect(":zzqx", null)
{ const r = q(":fire")[0]; const ok = r.icon === "🔥" && r.copy === "🔥" && r.run.target === "omarchy-menu-emoji-insert '🔥'; printf %s '🔥' | wl-copy"
  console.log((ok ? "ok  " : "FAIL") + "  :fire row → " + r.icon + " " + r.run.target); if (!ok) fails++ }
{ const r = Engine.run(":fire", { providers: ["emoji"], emoji: { onEnter: "copy" } }, { emojis })[0]; const ok = !r.run && r.copy === "🔥"
  console.log((ok ? "ok  " : "FAIL") + "  emoji onEnter=copy → no run, copies " + r.copy); if (!ok) fails++ }
// processes
expect("kill", "Quit node"); expect("kill chrome", "Quit all 2 \"chrome\" processes"); expect("kill web", "Quit Web Content"); expect("kill zzz", /^No process/)
expect("kill -9 node", "Force quit node"); expect("killer", null)
{ const rows = q("kill chrome"); const ok = rows[0].run.target === "kill -TERM 101 102" && rows[1].run.target === "kill -TERM 101" && q("kill -9 node")[0].run.target === "kill -KILL 104" && requested > 0
  console.log((ok ? "ok  " : "FAIL") + "  kill targets → " + rows[0].run.target + " | " + q("kill -9 node")[0].run.target + " | requested " + requested); if (!ok) fails++ }
{ const r = Engine.run("kill x", { providers: ["processes"] }, { requestProcesses: () => {} })[0]; const ok = r.title === "Reading your processes…" && !r.run
  console.log((ok ? "ok  " : "FAIL") + "  kill before snapshot → " + r.title); if (!ok) fails++ }
// Every kill target must be exactly "kill -SIG <digits…>" — nothing from args/names reaches the shell.
{ const all = ["kill", "kill chrome", "kill web", "kill -9 chrome"].flatMap(x => q(x)).filter(r => r.run)
  const ok = all.every(r => /^kill -(TERM|KILL)( \d+)+$/.test(r.run.target))
  console.log((ok ? "ok  " : "FAIL") + "  " + all.length + " kill targets are pid-only"); if (!ok) fails++ }

// apps
expect("brave", "Brave"); expect("firefox", "Firefox"); expect("fire", "Firefox"); expect("files", "Files"); expect("nautilus", "Files")
expect("term", "Alacritty"); expect("vsc", "Visual Studio Code"); expect("studio code", "Visual Studio Code"); expect("local", "LocalSend")
expect("brave new window", "New Window"); expect("firefox priv", "New Private Window"); expect("zzzq", null)
{ const rows = q("brave"); const ok = rows[0].run.kind === "app" && rows[0].run.target === "brave-browser" && rows[0].run.action === undefined
    && rows[1].title === "New Window" && rows[1].run.action === 0 && rows[2].title === "New Private Window" && rows[0].image === "brave-browser"
  console.log((ok ? "ok  " : "FAIL") + "  \"brave\" → app, then its window actions → " + rows.slice(0, 3).map(r => r.title).join(" | ")); if (!ok) fails++ }
// The point of the launcher: an app query never offers to change a default.
{ const all = ["brave", "browser", "default", "firefox", "term"].flatMap(x => q(x))
  const ok = all.every(r => !/default/i.test(r.title + " " + (r.run ? r.run.target : "")))
  console.log((ok ? "ok  " : "FAIL") + "  no default-changing rows among " + all.length + " app results"); if (!ok) fails++ }
{ const f = q("f").map(r => r.title); const ok = f[0] === "Firefox" && f.includes("Files")
  console.log((ok ? "ok  " : "FAIL") + "  launch history orders equal matches → " + f.slice(0, 3).join(" | ")); if (!ok) fails++ }
{ const ok = q("web browser").map(r => r.title).slice(0, 2).sort().join() === "Brave,Firefox" && q("2+2").length === 1 && q("100 usd to lkr")[0].title === "30,050 LKR"
  console.log((ok ? "ok  " : "FAIL") + "  generic-name search, and apps stay out of answers"); if (!ok) fails++ }

// units
expect("5 km to mi", "3.1069 mi"); expect("5km in miles", "3.1069 mi"); expect("180 lb to kg", "81.6466 kg"); expect("72f", "22.2222 °C"); expect("100 c to f", "212 °F")
expect("0 k to c", "-273.15 °C"); expect("5 ft 11 in to cm", "180.34 cm"); expect("5 in to cm", "12.7 cm"); expect("2 cups in ml", "473.1765 mL"); expect("90 min to hours", "1.5 h")
expect("10 gb to mb", "10,000 MB"); expect("1 gib in mb", "1,073.7418 MB"); expect("60 mph", "96.5606 km/h"); expect("1,500 m to km", "1.5 km"); expect("1 acre to m2", "4,046.8564 m²")
expect("5 min", null); expect("5 kg to km", null); expect("convert units", "Convert units")
{ const r = q("5 km"); const ok = r[0].title === "3.1069 mi" && r[0].copy === "3.1069" && /5 km → mi · Length/.test(r[0].subtitle)
  console.log((ok ? "ok  " : "FAIL") + "  \"5 km\" → counterpart, copies the bare number"); if (!ok) fails++ }
{ const ok = q("in 2 weeks")[0].title === "Wed, 7 Oct 2026" && q("3pm lkt to pst")[0].title === "02:30 Los Angeles" && q("2026-01-01 to 2026-09-23")[0].provider === "time" && q("2+2")[0].title === "4"
  console.log((ok ? "ok  " : "FAIL") + "  units leave dates, times and maths alone"); if (!ok) fails++ }

// windows
openWindows = windows
{ const r = q("brave"); const t = r.slice(0, 4).map(x => x.title + "/" + (x.run ? x.run.kind + ":" + (x.run.label || "") : ""))
  const ok = r[0].run.kind === "window" && r[0].run.target === "0xb1" && r[1].run.target === "0xb2" && r[2].run.kind === "app" && r[2].run.label === "open new" && r[0].image === "brave-browser"
  console.log((ok ? "ok  " : "FAIL") + "  \"brave\" → its windows by recency, then open new → " + t.join(" | ")); if (!ok) fails++ }
expect("netflix", "Netflix - Brave"); expect("images", "Images"); expect("nautilus", "Images"); expect("ghostty", "~/Code")
{ const r = q("w "); const ok = r.map(x => x.run && x.run.target).join() === "0xb1,0xc1,0xb2,0xd1" && r[3].subtitle === "Ghostty · scratchpad"
  console.log((ok ? "ok  " : "FAIL") + "  \"w \" → every other window, most recent first → " + r.map(x => x.title).join(" | ")); if (!ok) fails++ }
expect("w git", "GitHub - Brave"); expect("w zzz", /^No window/)
{ const ok = q("firefox")[0].run.kind === "app" && q("firefox")[0].run.label === "open new" && !q("mozilla").some(r => r.run && r.run.kind === "window")
  console.log((ok ? "ok  " : "FAIL") + "  the window you're in isn't offered; its app says open new"); if (!ok) fails++ }
{ const all = ["w ", "evil", "w evil", "brave"].flatMap(x => q(x)).filter(r => r.run && r.run.kind === "window")
  const ok = all.every(r => /^0x[0-9a-f]+$/.test(r.run.target))
  console.log((ok ? "ok  " : "FAIL") + "  " + all.length + " window targets are hex addresses only"); if (!ok) fails++ }
{ const ok = q("signal")[0].run.label === "open" && q("w")[0] && q("w").every(r => !r.run || r.run.kind !== "window")
  console.log((ok ? "ok  " : "FAIL") + "  apps without windows say open; bare \"w\" is a normal search"); if (!ok) fails++ }

openWindows = []

// Commands are found from the normal search box.
expect("emo", "Search emoji"); expect("curr", "Convert currency"); expect("goo", "Search Google"); expect("kil", "Kill a process")
expect("date", "Date calculator"); expect("help", "Show everything"); expect("exchange", "Convert currency")
{ const rows = q("clock"); const ok = /Colombo/.test(rows[0].title) && rows.some(r => r.title === "World clock" && r.complete === "time")
  console.log((ok ? "ok  " : "FAIL") + "  \"clock\" → real answer first, World Clock command below"); if (!ok) fails++ }
{ const c = q("curr")[0]; const ok = c.complete === "100 usd to lkr" && c.select === true && !c.copy && !c.run
  console.log((ok ? "ok  " : "FAIL") + "  command row completes \"" + c.complete + "\" selected"); if (!ok) fails++ }
{ const ok = q("lock").filter(r => r.title === "Lock screen").length === 1 && q("kill").every(r => r.title !== "Kill Process")
  console.log((ok ? "ok  " : "FAIL") + "  no duplicate command rows for exact keyword / current mode"); if (!ok) fails++ }
{ const ok = q("2+2")[0].title === "4" && q("2+2").length === 1
  console.log((ok ? "ok  " : "FAIL") + "  maths queries don't pull in commands"); if (!ok) fails++ }

// Layout data: grouped sections, hero answers, the mode chip, plain subtitles.
{ openWindows = windows
  const b = q("brave"), sums = q("2+2"), fx = q("50 eur"), lo = q("lo")
  openWindows = []
  const ok = b[0].section === "Windows" && !b[1].section && b[2].section === "Apps" && !b[0].hero
    && sums[0].hero && !sums[0].section
    && fx[0].hero && fx[1].section === "Currency"
    && lo[0].section === "Commands" && lo[1].section === "Apps" && q("lock")[0].subtitle === "Runs omarchy-system-lock"
  console.log((ok ? "ok  " : "FAIL") + "  sections " + b.map(r => r.section || "·").join(",") + " | hero on answers only | " + q("lock")[0].subtitle); if (!ok) fails++ }
{ const m = x => (Engine.mode(x, config) || {}).label || ""
  const ok = m(":fire") === "Emoji" && m("kill ") === "Processes" && m("w git") === "Windows" && m("g cats") === "Search Google" && m("lock") === "" && m("2+2") === "" && m("w") === ""
  console.log((ok ? "ok  " : "FAIL") + "  mode chip → " + [":fire", "kill ", "w git", "g cats"].map(m).join(" | ")); if (!ok) fails++ }
expect("g foo bar", "Search Google: foo bar")
{ const ok = q("g foo bar")[0].subtitle === "Opens google.com" && q("yt x")[0].subtitle === "Opens youtube.com"
  console.log((ok ? "ok  " : "FAIL") + "  keyword rows say where they go → " + q("g foo bar")[0].subtitle); if (!ok) fails++ }

// Shipped defaults are neutral: USD home currency, system time zone.
{ const svc = { rates, zones, now, localZone: "Europe/London", emojis, processes }
  const eur = Engine.run("50 eur", defaults, svc).map(r => r.title)
  const t = Engine.run("time", defaults, svc)[0].title
  const cmd = Engine.run("curr", defaults, svc)[0].complete
  const ok = /USD$/.test(eur[0]) && /GBP$/.test(eur[1]) && /London/.test(t) && cmd === "100 eur to usd" && !JSON.stringify(defaults).includes("LKR")
  console.log((ok ? "ok  " : "FAIL") + "  neutral defaults → " + eur.join(", ") + " | " + t + " | " + cmd); if (!ok) fails++ }
{ const inr = Engine.run("100 rupees", defaults, { rates })[0].title
  const lkr = q("100 rupees")[0].subtitle, rs = q("rs 500 to usd")[0].subtitle
  const ok = /INR → USD/.test(Engine.run("100 rupees", defaults, { rates })[0].subtitle) && /^100 LKR/.test(lkr) && /^500 LKR → USD/.test(rs)
  console.log((ok ? "ok  " : "FAIL") + "  rupee follows home currency → " + inr + " | " + lkr + " | " + rs); if (!ok) fails++ }

// The exchange-rate API is requested only by real currency queries.
{ const asked = []
  const svc = query => ({ rates, zones, now, emojis, processes, requestProcesses: () => {}, requestRates: () => asked.push(query) })
  const yes = ["100 usd to eur", "$50", "50 eur", "usd lkr", "12*50 usd"], no = ["2+2", "time", "hello", "?", ":fire", "curr", "kill", "g usd", "days until dec 25", ""]
  for (const x of yes.concat(no)) Engine.run(x, config, svc(x))
  const ok = yes.every(x => asked.includes(x)) && no.every(x => !asked.includes(x))
  console.log((ok ? "ok  " : "FAIL") + "  rates requested only for currency queries → " + asked.join(" | ")); if (!ok) fails++ }

// Hotkey: which Lua gets sent to `hyprctl eval`.
{ const H = load(P + "lib/Hotkey.js"), cmd = "omarchy-shell shell toggle io.github.saikomantisu.commandbar"
  const other = { modmask: 64, key: "K", description: "Keybindings", dispatcher: "__lua" }
  const mine = { modmask: 64, key: "PERIOD", description: "Command bar", dispatcher: "__lua" }
  const j = a => JSON.stringify(a)
  const checks = [
    ["parse", JSON.stringify(H.parseCombo("super + alt + c")) === '{"mask":72,"key":"C"}' && H.parseCombo("") === null && H.parseCombo("SUPER +") !== null && H.parseCombo("C + SUPER") === null],
    ["binds when free", (r => r.bound && r.lua.length === 2 && r.lua[0] === 'hl.bind("SUPER + PERIOD", hl.dsp.exec_cmd("' + cmd + '"), { description = "Command bar" })')(H.plan(j([other]), "SUPER + PERIOD", cmd))],
    ["already bound → nothing", (r => r.bound && r.lua.length === 0)(H.plan(j([other, mine]), "SUPER + PERIOD", cmd))],
    ["key changed → unbind old, bind new", (r => r.bound && r.lua[0] === 'hl.unbind("SUPER + PERIOD")' && /^hl\.bind\("SUPER \+ ALT \+ C"/.test(r.lua[1]))(H.plan(j([mine]), "SUPER + ALT + C", cmd))],
    ["taken by another → no bind, conflict", (r => !r.bound && r.conflict === "Keybindings" && r.lua.length === 0)(H.plan(j([other]), "SUPER + K", cmd))],
    ["hotkey \"\" → unbind ours only", (r => !r.bound && r.lua.join() === 'hl.unbind("SUPER + PERIOD")')(H.plan(j([other, mine]), "", cmd))],
    ["lua strings escaped", H.luaString('a"b\\c') === '"a\\"b\\\\c"'],
    ["bad json → still binds", H.plan("not json", "SUPER + PERIOD", cmd).bound]
  ]
  for (const [name, ok] of checks) { console.log((ok ? "ok  " : "FAIL") + "  hotkey: " + name); if (!ok) fails++ } }

// help: topics, a topic's examples with live answers, search, and quiet previews
{ const top = q("?"), titles = top.map(r => r.title).join("|")
  const ok = titles === "Open an app|Switch window|Calculator|Units|Currency|Time zones|Dates|Emoji|Kill a process|Keywords"
    && top.every(r => r.help && !r.run && !r.copy && r.actionLabel === "Open") && top[2].complete === "?calc" && !top[0].section
  console.log((ok ? "ok  " : "FAIL") + "  \"?\" → " + titles); if (!ok) fails++ }
{ const u = q("?units"), sub = u.map(r => r.title + " " + r.subtitle)
  const ok = u[0].section === "Units" && u[0].title === "5 km to mi" && u[0].subtitle === "→ 3.1069 mi" && u[0].complete === "5 km to mi" && u[0].select
    && u.every(r => r.actionLabel === "Try it" && r.helpTopic === "units")
  console.log((ok ? "ok  " : "FAIL") + "  \"?units\" → " + sub.slice(0, 2).join(" | ")); if (!ok) fails++ }
{ const k = q("?kill"), e = q("?emoji"), c = q("?currency"), kw = q("?keywords")
  const ok = k[0].subtitle === "Your processes, busiest first" && !k[0].select && k[0].complete === "kill "
    && /^→ 🔥 fire/.test(e[1].subtitle) && /^→ .*EUR$/.test(c[0].subtitle)
    && kw[0].title === "g" && kw[0].subtitle === "Search Google. Opens google.com" && kw[4].subtitle === "Lock screen. Runs omarchy-system-lock"
  console.log((ok ? "ok  " : "FAIL") + "  notes for prefixes, live answers otherwise → " + [k[0].subtitle, e[1].subtitle, c[0].subtitle, kw[0].subtitle].join(" | ")); if (!ok) fails++ }
{ const before = requested, asked = []
  const svc = { rates, zones, now, emojis, processes, apps, windows: [], launches, requestProcesses: () => requested++, requestRates: () => asked.push(1) }
  for (const x of ["?", "?kill", "?currency", "?units", "?time", "?money"]) Engine.run(x, config, svc)
  const ok = requested === before && asked.length === 0
  console.log((ok ? "ok  " : "FAIL") + "  browsing help never lists processes or fetches rates"); if (!ok) fails++ }
{ const m = q("?in"), none = q("?zzqx")
  const ok = m.some(r => r.helpTopic === "time") && m.some(r => r.helpTopic === "units") && none.length === 1 && /^No help matches/.test(none[0].title)
  console.log((ok ? "ok  " : "FAIL") + "  help search spans topics; misses say so"); if (!ok) fails++ }
{ const m = x => (Engine.mode(x, config) || {}).label
  const ok = m("?") === "Help" && m("?units") === "Help · Units" && m("?mon") === "Help"
  console.log((ok ? "ok  " : "FAIL") + "  help chip → " + [m("?"), m("?units")].join(" | ")); if (!ok) fails++ }
expect(" ? ", "Open an app")
const r = q("g foo & bar")[0].run; console.log("      url:", r.target)
const cmds = Engine.run("x it's; rm -rf ~", { providers: ["commands"], commands: [{ keyword: "x", run: "echo {q}" }] }, {})[0].run
console.log("      cmd:", cmds.target)
const out = require("child_process").execFileSync("bash", ["-c", cmds.target]).toString().trim()
console.log((out === "it's; rm -rf ~" ? "ok  " : "FAIL") + "  shell quoting → " + out); if (out !== "it's; rm -rf ~") fails++
console.log(fails ? fails + " FAILED" : "all passed"); process.exit(fails ? 1 : 0)
