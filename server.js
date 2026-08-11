import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID || "1536397883618893896";
const CACHE_SECONDS = Number(process.env.CACHE_SECONDS || 60);

if (!TOKEN) {
  console.warn("DISCORD_BOT_TOKEN is missing. Add it to .env before starting.");
}

const TIER_POINTS = {
  HT1: 60,
  LT1: 45,
  HT2: 30,
  LT2: 20,
  HT3: 10,
  LT3: 6,
  HT4: 4,
  LT4: 3,
  HT5: 2,
  LT5: 1
};

const TIER_ORDER = Object.keys(TIER_POINTS);

const kits = [
  {
    key: "sword",
    name: "Sword",
    image: "/images/sword.png",
    roles: {
      HT1: "1536458350936465528", LT1: "1536458519228715069",
      HT2: "1536458614334820502", LT2: "1536458964244500600",
      HT3: "1536459240170856489", LT3: "1536459360128204932",
      HT4: "1536470666835005570", LT4: "1536444939645485166",
      HT5: "1536445067550662708", LT5: "1536445125259956354"
    }
  },
  {
    key: "axe",
    name: "Axe",
    image: "/images/axe.png",
    roles: {
      HT1: "1536459549341384725", LT1: "1536458519228715069",
      HT2: "1536459622343508029", LT2: "1536459612423987280",
      HT3: "1536459630509826048", LT3: "1536459638231539782",
      HT4: "1536445469956382800", LT4: "1536445418697793536",
      HT5: "1536445352952209498", LT5: "1536445257313554552"
    }
  },
  {
    key: "uhc",
    name: "UHC",
    image: "/images/uhc.png",
    roles: {
      HT1: "1536460201178169434", LT1: "1536460224175677570",
      HT2: "1536460231423565875", LT2: "1536460238645895369",
      HT3: "1536460245549711530", LT3: "1536460376387100802",
      HT4: "1536445698856329266", LT4: "1536445645773082724",
      HT5: "1536445578056179883", LT5: "1536445529628872774"
    }
  },
  {
    key: "mace",
    name: "Mace",
    image: "/images/mace.png",
    roles: {
      HT1: "1536460907826258021", LT1: "1536460985202774197",
      HT2: "1536461033843982517", LT2: "1536461115561869312",
      HT3: "1536461146473766993", LT3: "1536461182041329685",
      HT4: "1536446240433373204", LT4: "1536446190038556733",
      HT5: "1536446139057049651", LT5: "1536445775716941965"
    }
  },
  {
    key: "nethop",
    name: "NethOP",
    image: "/images/nethop.png",
    roles: {
      HT1: "1536461997590315098", LT1: "1536462042670571721",
      HT2: "1536462063931498496", LT2: "1536462108030410895",
      HT3: "1536462149893754930", LT3: "1536462184769650728",
      HT4: "1536447138207240323", LT4: "1536447079507951756",
      HT5: "1536447034565861397", LT5: "1536446819607777323"
    }
  },
  {
    key: "smp",
    name: "SMP",
    image: "/images/smp.png",
    roles: {
      HT1: "1536462446393303080", LT1: "1536462482103603352",
      HT2: "1536462519894540460", LT2: "1536462544691134634",
      HT3: "1536462565058543647", LT3: "1536462594423132271",
      HT4: "1536447358848467065", LT4: "1536447317782167623",
      HT5: "1536447241441779852", LT5: "1536447197279690822"
    }
  },
  {
    key: "vanilla",
    name: "Vanilla",
    image: "/images/vanilla.png",
    roles: {
      HT1: "1536462752401465434", LT1: "1536462858529939617",
      HT2: "1536462877282803845", LT2: "1536462908257472552",
      HT3: "1536462928239403069", LT3: "1536462950955753594",
      HT4: "1536447708456419349", LT4: "1536447628131307651",
      HT5: "1536447481813143702", LT5: "1536447417338171552"
    }
  },
  {
    key: "pot",
    name: "Pot",
    image: "/images/pot.png",
    roles: {
      HT1: "1536470214483640370", LT1: "1536470290719310016",
      HT2: "1536470322704810175", LT2: "1536470351741976699",
      HT3: "1536470432172216321", LT3: "1536443904805699675",
      HT4: "1536446584630411415", LT4: "1536446634492428429",
      HT5: "1536446529483710564", LT5: "1536446475171528854"
    }
  },
  {
    key: "bejava-sword",
    name: "BEjava Sword",
    image: "/images/bejava-sword.png",
    roles: {
      HT1: "1536703157088817152", LT1: "1536703384260710534",
      HT2: "1536703183680962682", LT2: "1536703207148097616",
      HT3: "1536703288991424552", LT3: "1536703235891662888"
      // HT4/LT4/HT5/LT5 were not supplied, so they are intentionally unconfigured.
    }
  }
];

let cache = { expiresAt: 0, data: null };

function tierPoints(tier) {
  return TIER_POINTS[tier] ?? 0;
}

/*
 * Overall ranking:
 * - Every configured Kit contributes the point value of its current Tier.
 * - Players are sorted by total points, highest first.
 * - There is intentionally no forced Overall HT/LT label because the user
 *   specified that Overall should be based on total points/ranking order.
 */
function calculateOverall(tiers) {
  const entries = Object.entries(tiers)
    .filter(([, tier]) => tier && Number.isFinite(tierPoints(tier)));

  const totalPoints = entries.reduce(
    (sum, [, tier]) => sum + tierPoints(tier),
    0
  );

  return {
    totalPoints,
    rankedKits: entries.length
  };
}

async function discordFetch(path) {
  if (!TOKEN) throw new Error("DISCORD_BOT_TOKEN is not configured.");

  const response = await fetch(`https://discord.com/api/v10${path}`, {
    headers: {
      Authorization: `Bot ${TOKEN}`,
      "User-Agent": "DiscordTierList/1.0"
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Discord API ${response.status}: ${body}`);
  }

  return response.json();
}

async function fetchAllMembers() {
  const members = [];
  let after = "0";

  while (true) {
    const page = await discordFetch(
      `/guilds/${GUILD_ID}/members?limit=1000&after=${after}`
    );

    members.push(...page);

    if (page.length < 1000) break;
    after = page[page.length - 1].user.id;
  }

  return members;
}

function buildPlayer(member) {
  const roleSet = new Set(member.roles || []);
  const tiers = {};

  for (const kit of kits) {
    let found = null;

    // First matching tier wins. This also supports accidental/shared role IDs.
    for (const [tier, roleId] of Object.entries(kit.roles)) {
      if (roleSet.has(roleId)) {
        found = tier;
        break;
      }
    }

    tiers[kit.key] = found;
  }

  const overall = calculateOverall(tiers);

  return {
    id: member.user.id,
    username: member.user.username,
    globalName: member.user.global_name || null,
    displayName: member.nick || member.user.global_name || member.user.username,
    avatar: member.user.avatar
      ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(member.user.id) % 5n)}.png`,
    tiers,
    overall
  };
}

async function loadData(force = false) {
  if (!force && cache.data && cache.expiresAt > Date.now()) {
    return cache.data;
  }

  const members = await fetchAllMembers();
  const players = members
    .map(buildPlayer)
    .filter((p) => p.overall?.rankedKits > 0)
    .sort((a, b) => {
      const av = a.overall?.totalPoints ?? 0;
      const bv = b.overall?.totalPoints ?? 0;
      if (av !== bv) return bv - av;
      return a.username.localeCompare(b.username);
    });

  const data = {
    guildId: GUILD_ID,
    updatedAt: new Date().toISOString(),
    kits: kits.map(({ roles, ...kit }) => kit),
    players,
    tierOrder: TIER_ORDER,
    tierPoints: TIER_POINTS
  };

  cache = {
    data,
    expiresAt: Date.now() + CACHE_SECONDS * 1000
  };

  return data;
}

app.use(express.static("public"));

app.get("/api/rankings", async (req, res) => {
  try {
    const data = await loadData(req.query.refresh === "1");
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to load Discord ranking data.",
      detail: error.message
    });
  }
});

app.get("/api/player/:id", async (req, res) => {
  try {
    const data = await loadData(false);
    const player = data.players.find((p) => p.id === req.params.id);

    if (!player) {
      return res.status(404).json({ error: "Player not found." });
    }

    res.json(player);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load player." });
  }
});

app.listen(PORT, () => {
  console.log(`JPTiers running at http://localhost:${PORT}`);
});