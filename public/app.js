function getKitFromHash() {
  const match = window.location.hash.match(/^#\/kit\/([^/]+)$/);

  if (!match) {
    return "all";
  }

  return match[1];
}

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
    const kit = btn.dataset.kit;

    if (kit === "all") {
      window.location.hash = "";
    } else {
      window.location.hash = `/kit/${kit}`;
    }
  };
});}

function renderHeadings() {
  $("#kitHeadings").innerHTML = state.data.kits.map(k => `
    <div class="kit-title">
      <img src="${escapeHtml(k.image)}" alt="" onerror="this.style.visibility='hidden'">
      <span>${escapeHtml(k.name)}</span>
    </div>
  `).join("");
}

function renderRows() {
  const el = $("#rankingRows");
  const players = visiblePlayers();

  // ALLの場合は今まで通りの表を表示
  if (state.kit === "all") {

    el.innerHTML = players.map((p, index) => `
      <div class="ranking-row">
        <div class="rank">${String(index + 1).padStart(2, "0")}</div>

        <div class="player" data-player="${p.id}">
          <img class="avatar" src="${escapeHtml(p.avatar)}" alt="">

          <div class="player-name">
            <strong>${escapeHtml(p.username)}</strong>

            ${p.globalName && p.globalName !== p.username
              ? `<small>${escapeHtml(p.globalName)}</small>`
              : `<small>Discord</small>`
            }
          </div>
        </div>

        <div class="overall">
          ${overallBadge(p)}
        </div>

        ${state.data.kits.map(k => `
          <div class="kit-cell">
            ${tierBadge(p.tiers[k.key])}
          </div>
        `).join("")}

      </div>
    `).join("");

    attachPlayerEvents();

    $("#playerCount").textContent = players.length;

    return;
  }


  // 選択されているKitを取得
  const kit = state.data.kits.find(k => k.key === state.kit);

  if (!kit) {
    el.innerHTML = `
      <div style="padding:40px;text-align:center;color:#666">
        Kit not found.
      </div>
    `;

    return;
  }


  // Tierごとにプレイヤーを分類
  const tiers = {
    1: { high: [], low: [] },
    2: { high: [], low: [] },
    3: { high: [], low: [] },
    4: { high: [], low: [] },
    5: { high: [], low: [] }
  };


  players.forEach(player => {

    const tier = player.tiers[kit.key];

    if (!tier) return;

    // 例: HT3
    const match = tier.match(/^(H|L)T([1-5])$/);

    if (!match) return;

    const type = match[1] === "H" ? "high" : "low";
    const level = Number(match[2]);

    tiers[level][type].push(player);
  });


  // Tier 1 ～ Tier 5 を描画
  el.innerHTML = `
    <div class="tier-board">

      ${[1, 2, 3, 4, 5].map(level => `

        <div class="tier-column tier-column-${level}">

          <div class="tier-column-header">

            <h2>TIER ${level}</h2>

            <span class="tier-player-count">
              ${tiers[level].high.length + tiers[level].low.length} Players
            </span>

          </div>


          ${tiers[level].high.length ? `

            <div class="tier-section">

              <div class="tier-section-title high">
                HIGH
              </div>

              <div class="tier-player-list">

                ${tiers[level].high.map(player =>
                  tierPlayerCard(player, kit.key)
                ).join("")}

              </div>

            </div>

          ` : ""}


          ${tiers[level].low.length ? `

            <div class="tier-section">

              <div class="tier-section-title low">
                LOW
              </div>

              <div class="tier-player-list">

                ${tiers[level].low.map(player =>
                  tierPlayerCard(player, kit.key)
                ).join("")}

              </div>

            </div>

          ` : ""}


          ${!tiers[level].high.length && !tiers[level].low.length ? `

            <div class="tier-empty">
              No players
            </div>

          ` : ""}

        </div>

      `).join("")}

    </div>
  `;


  attachPlayerEvents();

  $("#playerCount").textContent = players.length;
}

function tierPlayerCard(player, kitKey) {

  const tier = player.tiers[kitKey];

  return `
    <div class="tier-player-card player" data-player="${player.id}">

      <img
        class="avatar"
        src="${escapeHtml(player.avatar)}"
        alt=""
      >

      <div class="tier-player-info">

        <strong>
          ${escapeHtml(player.username)}
        </strong>

        <small>
          ${escapeHtml(tier)}
        </small>

      </div>

    </div>
  `;
}

function attachPlayerEvents() {

  document.querySelectorAll(".player").forEach(node => {

    node.onclick = () => {
      openProfile(node.dataset.player);
    };

  });

}

function render() {
  renderKitFilters();

  const tableHead = document.querySelector(".table-head");

  if (state.kit === "all") {
    // ALLページ
    tableHead.style.display = "";

    $("#kitHeadings").style.display = "";
    $("#rankingRows").style.display = "";

    renderHeadings();
    renderRows();

  } else {
    // Kit別ページ
    tableHead.style.display = "none";

    $("#rankingRows").style.display = "";

    renderRows();
  }

  const d = new Date(state.data.updatedAt);

  $("#status").textContent =
    `Updated ${d.toLocaleString("ja-JP")} · ${state.data.players.length} ranked players`;
}

async function load() {
  $("#status").textContent = "Loading Discord ranking data…";
  $("#refreshBtn").disabled = true;

  try {
    const response = await fetch("/api/rankings");

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

$("#refreshBtn").onclick = () => load();
window.addEventListener("hashchange", () => {
  state.kit = getKitFromHash();
  render();
});
state.kit = getKitFromHash();
load();