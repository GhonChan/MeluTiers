const state = {
  data: null,
  query: "",
  kit: "all"
};

const $ = (s) => document.querySelector(s);

function tierClass(tier) {
  if (!tier) return "tier-none";
  return `tier-${Number(tier.slice(-1))}`;
}

function tierBadge(tier) {
  return `<span class="tier ${tierClass(tier)}">${tier || "—"}</span>`;
}

function overallBadge(player) {
  const points = player.overall?.totalPoints ?? 0;
  return `<span class="overall-points">${points} P</span>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}

function visiblePlayers() {
  const q = state.query.trim().toLowerCase();

  return state.data.players.filter((p) => {
    const matchesName =
      !q ||
      p.username.toLowerCase().includes(q) ||
      (p.globalName || "").toLowerCase().includes(q);

    const matchesKit =
      state.kit === "all" || Boolean(p.tiers[state.kit]);

    return matchesName && matchesKit;
  });
}

function renderKitFilters() {
  const el = $("#kitFilter");
  el.innerHTML = [
    `<button class="kit-chip ${state.kit === "all" ? "active" : ""}" data-kit="all">ALL</button>`,
    ...state.data.kits.map(k =>
      `<button class="kit-chip ${state.kit === k.key ? "active" : ""}" data-kit="${k.key}">${escapeHtml(k.name)}</button>`
    )
  ].join("");

  el.querySelectorAll(".kit-chip").forEach(btn => {
    btn.onclick = () => {
      state.kit = btn.dataset.kit;
      render();
    };
  });
}

function renderHeadings() {
  $("#kitHeadings").innerHTML = state.data.kits.map(k => `
    <div class="kit-title">
      <img src="${escapeHtml(k.image)}" alt="" onerror="this.style.visibility='hidden'">
      <span>${escapeHtml(k.name)}</span>
    </div>
  `).join("");
}

function renderRows() {
  const players = visiblePlayers();
  const el = $("#rankingRows");

  el.innerHTML = players.map((p, index) => `
    <div class="ranking-row">
      <div class="rank">${String(index + 1).padStart(2, "0")}</div>
      <div class="player" data-player="${p.id}">
        <img class="avatar" src="${escapeHtml(p.avatar)}" alt="">
        <div class="player-name">
          <strong>${escapeHtml(p.username)}</strong>
          ${p.globalName && p.globalName !== p.username
            ? `<small>${escapeHtml(p.globalName)}</small>`
            : `<small>Discord</small>`}
        </div>
      </div>
      <div class="overall">${overallBadge(p)}</div>
      ${state.data.kits.map(k => `
        <div class="kit-cell">${tierBadge(p.tiers[k.key])}</div>
      `).join("")}
    </div>
  `).join("") || `
    <div style="padding:40px;text-align:center;color:#666">
      No players found.
    </div>
  `;

  el.querySelectorAll(".player").forEach(node => {
    node.onclick = () => openProfile(node.dataset.player);
  });

  $("#playerCount").textContent = players.length;
}

function render() {
  renderKitFilters();
  renderHeadings();
  renderRows();

  const d = new Date(state.data.updatedAt);
  $("#status").textContent =
    `Updated ${d.toLocaleString("ja-JP")} · ${state.data.players.length} ranked players`;
}

async function load(refresh = false) {
  $("#status").textContent = "Loading Discord ranking data…";
  $("#refreshBtn").disabled = true;

  try {
    const url = refresh ? "/api/rankings?refresh=1" : "/api/rankings";
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) throw new Error(data.detail || data.error || "Unknown error");

    state.data = data;
    render();
  } catch (error) {
    $("#status").textContent = `Error: ${error.message}`;
  } finally {
    $("#refreshBtn").disabled = false;
  }
}

function openProfile(id) {
  const p = state.data.players.find(x => x.id === id);
  if (!p) return;

  $("#profileContent").innerHTML = `
    <div class="profile-top">
      <img class="avatar" src="${escapeHtml(p.avatar)}" alt="">
      <div>
        <h2>${escapeHtml(p.username)}</h2>
        <p>Discord ID: ${escapeHtml(p.id)}</p>
      </div>
      <div class="profile-overall">
        <small>OVERALL POINTS</small>
        <span class="profile-points">${p.overall?.totalPoints ?? 0} P</span>
      </div>
    </div>
    <div class="profile-grid">
      ${state.data.kits.map(k => `
        <div class="profile-kit">
          <div class="profile-kit-head">
            <img src="${escapeHtml(k.image)}" alt="" onerror="this.style.visibility='hidden'">
            <span>${escapeHtml(k.name)}</span>
          </div>
          ${tierBadge(p.tiers[k.key])}
        </div>
      `).join("")}
    </div>
  `;

  $("#modal").classList.remove("hidden");
}

document.addEventListener("click", (event) => {
  if (event.target.matches("[data-close]")) {
    $("#modal").classList.add("hidden");
  }
});

$("#searchInput").addEventListener("input", (event) => {
  state.query = event.target.value;
  if (state.data) renderRows();
});

$("#refreshBtn").onclick = () => load(true);

load();