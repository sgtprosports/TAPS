(function () {
  "use strict";

  // -------------------------------------------------------------------
  // Hustle Points system: point values, straight from the book's chart
  // -------------------------------------------------------------------
  var POSITIVE = [
    { code: "2PM", label: "Made 2-Point Shot", pts: 2 },
    { code: "3PM", label: "Made 3-Point Shot", pts: 3 },
    { code: "FTM", label: "Made Free Throw", pts: 1 },
    { code: "OREB", label: "Offensive Rebound", pts: 2 },
    { code: "DREB", label: "Defensive Rebound", pts: 3 },
    { code: "CHG", label: "Charge Taken", pts: 3 },
    { code: "AST", label: "Assist", pts: 2 },
    { code: "STL", label: "Steal", pts: 2 },
    { code: "BLK", label: "Block", pts: 2 },
    { code: "SCRN", label: "Screen Set", pts: 2 },
    { code: "BOX", label: "Box Out", pts: 2 },
    { code: "PNR", label: "Pick and Roll", pts: 2 },
    { code: "CRSH", label: "Crashing the Boards", pts: 2 },
    { code: "FS", label: "Follow Shot (Putback)", pts: 2 }
  ];
  var NEGATIVE = [
    { code: "M2", label: "Missed 2-Point Shot", pts: -1 },
    { code: "M3", label: "Missed 3-Point Shot", pts: -2 },
    { code: "MFT", label: "Missed Free Throw", pts: -1 },
    { code: "TO", label: "Turnover", pts: -2 },
    { code: "PF", label: "Personal Foul", pts: -1 }
  ];
  var ALL_STATS = POSITIVE.concat(NEGATIVE);
  var PT_MAP = {};
  ALL_STATS.forEach(function (s) { PT_MAP[s.code] = s.pts; });

  var STORAGE_KEY = "taps_coach_v1";

  // -------------------------------------------------------------------
  // helpers
  // -------------------------------------------------------------------
  function totalFor(statLine) {
    if (!statLine) return 0;
    var t = 0;
    for (var code in statLine) t += (statLine[code] || 0) * (PT_MAP[code] || 0);
    return t;
  }
  function uid() { return Math.random().toString(36).slice(2, 10); }
  function todayStr() {
    var d = new Date();
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
  function esc(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function starPath(cx, cy, r) {
    var pts = [];
    for (var i = 0; i < 5; i++) {
      var oa = -Math.PI / 2 + i * ((2 * Math.PI) / 5);
      var ia = oa + Math.PI / 5;
      pts.push([cx + r * Math.cos(oa), cy + r * Math.sin(oa)]);
      pts.push([cx + 0.42 * r * Math.cos(ia), cy + 0.42 * r * Math.sin(ia)]);
    }
    return "M" + pts.map(function (p) { return p.join(","); }).join(" L") + " Z";
  }

  // -------------------------------------------------------------------
  // logo (19-star crest, matches the book / app icon)
  // -------------------------------------------------------------------
  var SHIELD_PATH = "M25,18 L175,18 L175,95 C175,150 133,183 100,193 C67,183 25,150 25,95 Z";
  var SHIELD_INNER_PATH = "M30.3,24.1 L169.7,24.1 L169.7,95.7 C169.7,146.9 130.7,177.5 100,186.8 C69.3,177.5 30.3,146.9 30.3,95.7 Z";
  var STAR_CENTERS = [45, 63.3, 81.7, 100, 118.3, 136.7, 155].map(function (x) { return [x, 30]; })
    .concat([54, 72.4, 90.8, 109.2, 127.6, 146].map(function (x) { return [x, 44]; }))
    .concat([54, 72.4, 90.8, 109.2, 127.6, 146].map(function (x) { return [x, 58]; }));

  function logoSvg(size) {
    var stars = STAR_CENTERS.map(function (c) {
      return '<path d="' + starPath(c[0], c[1], 4.3) + '" fill="#fff"/>';
    }).join("");
    return (
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 200 200">' +
      '<defs><clipPath id="tapsShield"><path d="' + SHIELD_PATH + '"/></clipPath></defs>' +
      '<g clip-path="url(#tapsShield)">' +
      '<rect x="0" y="0" width="200" height="200" fill="#fff"/>' +
      '<rect x="0" y="78" width="200" height="17" fill="#B31942"/>' +
      '<rect x="0" y="112" width="200" height="17" fill="#B31942"/>' +
      '<rect x="0" y="146" width="200" height="17" fill="#B31942"/>' +
      '<rect x="0" y="0" width="200" height="72" fill="#0A3161"/>' +
      stars +
      "</g>" +
      '<path d="' + SHIELD_PATH + '" fill="none" stroke="#0A3161" stroke-width="4"/>' +
      '<path d="' + SHIELD_INNER_PATH + '" fill="none" stroke="#C9A227" stroke-width="1.5"/>' +
      '<circle cx="100" cy="128" r="41" fill="none" stroke="#0A3161" stroke-width="1.5"/>' +
      '<circle cx="100" cy="128" r="37" fill="#fff" stroke="#0A3161" stroke-width="3.5"/>' +
      '<path d="M100,91 L100,165 M63,128 L137,128 M72,99 C87.5,113 112.5,113 128,99 M72,157 C87.5,143 112.5,143 128,157" fill="none" stroke="#0A3161" stroke-width="2.5"/>' +
      "</svg>"
    );
  }

  // small inline icon set (lucide-style, minimal)
  var ICON = {
    clipboard: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/><path d="M9 12h6M9 16h6"/></svg>',
    users: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    history: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>',
    play: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l15 8-15 8V4z"/></svg>',
    undo: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
    plus: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    x: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
    chevRight: '<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A3161" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    chevDown: '<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A3161" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>'
  };

  // -------------------------------------------------------------------
  // state
  // -------------------------------------------------------------------
  var state = {
    ready: false,
    roster: [],
    activeGame: null,
    history: [],
    view: "track",
    activePlayerId: null,
    log: [],
    expandedGameId: null,
    confirmEnd: false,
    confirmDeleteGame: null,
    toast: ""
  };

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        state.roster = data.roster || [];
        state.activeGame = data.activeGame || null;
        state.history = data.history || [];
        if (state.activeGame && state.activeGame.stats) {
          var ids = Object.keys(state.activeGame.stats);
          if (ids.length) state.activePlayerId = ids[0];
        }
      }
    } catch (e) { /* start fresh */ }
    state.ready = true;
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        roster: state.roster,
        activeGame: state.activeGame,
        history: state.history
      }));
    } catch (e) {
      state.toast = "Couldn't save \u2014 changes may not persist.";
      render();
      setTimeout(function () { state.toast = ""; render(); }, 2500);
    }
  }

  // -------------------------------------------------------------------
  // actions
  // -------------------------------------------------------------------
  function addPlayer() {
    var input = document.getElementById("newPlayerName");
    var name = (input.value || "").trim();
    if (!name) return;
    state.roster.push({ id: uid(), name: name });
    input.value = "";
    saveState();
    render();
  }
  function removePlayer(id) {
    state.roster = state.roster.filter(function (p) { return p.id !== id; });
    saveState();
    render();
  }
  function startGame() {
    if (state.roster.length === 0) { state.view = "roster"; render(); return; }
    var oppInput = document.getElementById("newOpponent") || document.getElementById("newOpponent2");
    var opponent = (oppInput && oppInput.value.trim()) || "Opponent";
    var stats = {};
    state.roster.forEach(function (p) { stats[p.id] = {}; });
    state.activeGame = { id: uid(), opponent: opponent, date: todayStr(), stats: stats };
    state.activePlayerId = state.roster[0].id;
    state.log = [];
    state.view = "track";
    saveState();
    render();
  }
  function tally(code) {
    if (!state.activeGame || !state.activePlayerId) return;
    var line = state.activeGame.stats[state.activePlayerId] || {};
    line[code] = (line[code] || 0) + 1;
    state.activeGame.stats[state.activePlayerId] = line;
    state.log.push({ playerId: state.activePlayerId, code: code });
    saveState();
    render();
  }
  function undo() {
    if (state.log.length === 0) return;
    var last = state.log.pop();
    var line = state.activeGame.stats[last.playerId] || {};
    line[last.code] = Math.max(0, (line[last.code] || 0) - 1);
    state.activeGame.stats[last.playerId] = line;
    saveState();
    render();
  }
  function endGame() {
    if (!state.activeGame) return;
    state.history.unshift(Object.assign({}, state.activeGame, { endedAt: Date.now() }));
    state.activeGame = null;
    state.activePlayerId = null;
    state.log = [];
    state.confirmEnd = false;
    state.view = "history";
    saveState();
    render();
  }
  function deleteGame(id) {
    state.history = state.history.filter(function (g) { return g.id !== id; });
    state.confirmDeleteGame = null;
    saveState();
    render();
  }

  // -------------------------------------------------------------------
  // render
  // -------------------------------------------------------------------
  function playerName(id) {
    var p = state.roster.filter(function (x) { return x.id === id; })[0];
    return p ? p.name : "Unknown Player";
  }

  function renderTabs() {
    var tabs = [
      ["track", ICON.clipboard, "Track"],
      ["roster", ICON.users, "Roster"],
      ["history", ICON.history, "History"]
    ];
    return tabs.map(function (t) {
      var active = state.view === t[0];
      return '<button class="tab-btn' + (active ? " active" : "") + '" data-action="set-view" data-view="' + t[0] + '">' + t[1] + " " + t[2] + "</button>";
    }).join("");
  }

  function renderHeader() {
    var status = state.activeGame
      ? "vs " + esc(state.activeGame.opponent) + " \u00b7 " + esc(state.activeGame.date)
      : "No game in progress";
    return (
      '<div class="header">' +
      '<div class="header-row">' + logoSvg(38) +
      '<div><div class="app-name">TAPS</div><div class="app-sub">The All-Around Player Scorebook</div></div>' +
      "</div>" +
      '<div class="game-status">' + status + "</div>" +
      '<div class="tabs">' + renderTabs() + "</div>" +
      "</div>" +
      '<div class="flag-stripe"><span></span><span></span><span></span></div>' +
      (state.toast ? '<div class="toast">' + esc(state.toast) + "</div>" : "")
    );
  }

  function statButton(stat, count, kind) {
    var on = count > 0;
    return (
      '<button class="stat-btn ' + kind + (on ? " on" : "") + '" data-action="tally" data-code="' + stat.code + '">' +
      (on ? '<span class="stat-badge">' + count + "</span>" : "") +
      '<span class="code">' + stat.code + "</span>" +
      '<span class="pts">' + (stat.pts > 0 ? "+" + stat.pts : stat.pts) + "</span>" +
      "</button>"
    );
  }

  function renderTrack() {
    if (!state.activeGame) {
      var body = state.roster.length === 0
        ? "<p>Add players to your roster first.</p>"
        : "<p>Tracking will cover all " + state.roster.length + " players on your roster.</p>";
      var startBlock = state.roster.length > 0
        ? '<input id="newOpponent" class="input" placeholder="Opponent name (optional)">' +
          '<button class="btn btn-blue" data-action="start-game">' + ICON.play + " Start Game</button>"
        : '<button class="btn btn-navy" data-action="set-view" data-view="roster">' + ICON.users + " Go to Roster</button>";
      return '<div class="content"><div class="card"><h3>Start a game</h3>' + body + startBlock + "</div></div>";
    }

    var gamePlayers = state.roster.filter(function (p) { return state.activeGame.stats.hasOwnProperty(p.id); });
    var pills = gamePlayers.map(function (p) {
      var active = p.id === state.activePlayerId;
      var pts = totalFor(state.activeGame.stats[p.id]);
      return '<button class="pill' + (active ? " active" : "") + '" data-action="select-player" data-id="' + p.id + '">' +
        esc(p.name) + ' <span class="pts">(' + pts + ")</span></button>";
    }).join("");

    var activeId = state.activePlayerId;
    var activeName = playerName(activeId);
    var activeLine = state.activeGame.stats[activeId] || {};
    var activeTotal = totalFor(activeLine);

    var posGrid = POSITIVE.map(function (s) { return statButton(s, activeLine[s.code] || 0, "positive"); }).join("");
    var negGrid = NEGATIVE.map(function (s) { return statButton(s, activeLine[s.code] || 0, "negative"); }).join("");

    var sorted = gamePlayers.slice().sort(function (a, b) {
      return totalFor(state.activeGame.stats[b.id]) - totalFor(state.activeGame.stats[a.id]);
    });
    var board = sorted.map(function (p) {
      var row = p.id === state.activePlayerId ? " active" : "";
      return '<div class="list-row' + row + '" data-action="select-player" data-id="' + p.id + '">' +
        '<span class="rname">' + esc(p.name) + "</span>" +
        '<span class="rscore">' + totalFor(state.activeGame.stats[p.id]) + "</span></div>";
    }).join("");

    return (
      '<div class="content">' +
      '<div class="pill-row">' + pills + "</div>" +
      '<div class="live-score"><div class="name">' + esc(activeName) + '</div>' +
      '<div class="value">' + activeTotal + '<span class="unit">PTS</span></div></div>' +
      '<div class="section-label">Positive Plays</div>' +
      '<div class="stat-grid cols-4">' + posGrid + "</div>" +
      '<div class="section-label" style="margin-top:16px">Misses &amp; Turnovers</div>' +
      '<div class="stat-grid cols-3">' + negGrid + "</div>" +
      '<div class="btn-row">' +
      '<button class="btn btn-outline" data-action="undo"' + (state.log.length === 0 ? " disabled" : "") + ">" + ICON.undo + " Undo last</button>" +
      '<button class="btn btn-navy" data-action="confirm-end-open">End Game</button>' +
      "</div>" +
      '<div class="section-label" style="margin-top:20px">Live Scoreboard</div>' +
      '<div class="list-card">' + board + "</div>" +
      "</div>"
    );
  }

  function renderRoster() {
    var rows = state.roster.map(function (p) {
      return '<div class="list-row"><span class="rname">' + esc(p.name) + '</span>' +
        '<button class="remove-btn" data-action="remove-player" data-id="' + p.id + '">' + ICON.x + "</button></div>";
    }).join("");

    var startBlock = "";
    if (state.roster.length > 0 && !state.activeGame) {
      startBlock =
        '<div style="margin-top:16px">' +
        '<input id="newOpponent2" class="input" placeholder="Opponent name (optional)">' +
        '<button class="btn btn-blue" data-action="start-game">' + ICON.play + " Start Game</button>" +
        "</div>";
    } else if (state.activeGame) {
      startBlock = '<div class="hint-note">A game is already in progress \u2014 roster changes here won\u2019t add players to it.</div>';
    }

    return (
      '<div class="content">' +
      '<div class="roster-add">' +
      '<input id="newPlayerName" class="input" placeholder="Player name">' +
      '<button class="add-btn" data-action="add-player">' + ICON.plus + "</button>" +
      "</div>" +
      (state.roster.length === 0 ? '<div class="empty-note">No players yet. Add your roster above \u2014 you can edit it any time between games.</div>' : "") +
      '<div class="list-card">' + rows + "</div>" +
      startBlock +
      "</div>"
    );
  }

  function renderHistory() {
    if (state.history.length === 0) {
      return '<div class="content"><div class="empty-note">No saved games yet. Finished games will show up here with the full box score.</div></div>';
    }
    var cards = state.history.map(function (g) {
      var ids = Object.keys(g.stats);
      var isOpen = state.expandedGameId === g.id;
      var ranked = ids.map(function (id) { return { id: id, name: playerName(id), pts: totalFor(g.stats[id]) }; })
        .sort(function (a, b) { return b.pts - a.pts; });

      var lines = ranked.map(function (r, i) {
        return '<div class="history-line' + (i === 0 ? " top" : "") + '">' +
          '<span class="pname">' + esc(r.name) + '</span><span class="pscore">' + r.pts + " pts</span></div>";
      }).join("");

      var confirmBlock = "";
      if (state.confirmDeleteGame === g.id) {
        confirmBlock =
          '<div class="confirm-box">Delete this game permanently?' +
          '<div class="row">' +
          '<button class="del" data-action="confirm-delete-yes" data-id="' + g.id + '">Delete</button>' +
          '<button class="cancel" data-action="confirm-delete-cancel">Cancel</button>' +
          "</div></div>";
      }

      return (
        '<div class="history-card">' +
        '<div class="history-head" data-action="toggle-history" data-id="' + g.id + '">' +
        '<div><div class="opp">vs ' + esc(g.opponent) + '</div><div class="meta">' + esc(g.date) + " \u00b7 " + ids.length + " players</div></div>" +
        '<div class="history-actions">' +
        '<button class="icon-btn" data-action="confirm-delete-open" data-id="' + g.id + '">' + ICON.trash + "</button>" +
        (isOpen ? ICON.chevDown : ICON.chevRight) +
        "</div></div>" +
        (isOpen ? '<div class="history-body">' + lines + "</div>" : "") +
        confirmBlock +
        "</div>"
      );
    }).join("");
    return '<div class="content">' + cards + "</div>";
  }

  function renderModal() {
    if (!state.confirmEnd) return "";
    return (
      '<div class="modal-overlay">' +
      '<div class="modal-sheet">' +
      "<h3>End this game?</h3>" +
      "<p>Final Hustle Scores will be saved to History. You can still review the full box score afterward.</p>" +
      '<div class="btn-row" style="margin-top:0">' +
      '<button class="btn btn-outline" data-action="confirm-end-cancel">Keep Playing</button>' +
      '<button class="btn btn-navy" data-action="confirm-end-yes">End &amp; Save</button>' +
      "</div></div></div>"
    );
  }

  function render() {
    var root = document.getElementById("app");
    if (!state.ready) {
      root.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;color:#0A3161;font-weight:600;">Loading TAPS\u2026</div>';
      return;
    }
    var body = state.view === "track" ? renderTrack() : state.view === "roster" ? renderRoster() : renderHistory();
    root.innerHTML = renderHeader() + body + renderModal();
  }

  // -------------------------------------------------------------------
  // event delegation
  // -------------------------------------------------------------------
  function onClick(e) {
    var el = e.target.closest("[data-action]");
    if (!el) return;
    var action = el.getAttribute("data-action");
    var id = el.getAttribute("data-id");
    switch (action) {
      case "set-view": state.view = el.getAttribute("data-view"); render(); break;
      case "start-game": startGame(); break;
      case "select-player": state.activePlayerId = id; render(); break;
      case "tally": tally(el.getAttribute("data-code")); break;
      case "undo": undo(); break;
      case "confirm-end-open": state.confirmEnd = true; render(); break;
      case "confirm-end-cancel": state.confirmEnd = false; render(); break;
      case "confirm-end-yes": endGame(); break;
      case "add-player": addPlayer(); break;
      case "remove-player": removePlayer(id); break;
      case "toggle-history": state.expandedGameId = state.expandedGameId === id ? null : id; render(); break;
      case "confirm-delete-open": state.confirmDeleteGame = id; render(); break;
      case "confirm-delete-cancel": state.confirmDeleteGame = null; render(); break;
      case "confirm-delete-yes": deleteGame(id); break;
    }
  }
  function onKeydown(e) {
    if (e.key === "Enter" && e.target && e.target.id === "newPlayerName") addPlayer();
  }

  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKeydown);

  loadState();
  render();
})();
