# Discord Tier List

Minecraft PvP tier-list website powered by Discord roles.

## Important security note

Never put the Discord bot token in frontend JavaScript or commit it to Git.
The token that was pasted into the chat should be considered compromised and
should be regenerated in the Discord Developer Portal before using this project.

## Requirements

- Node.js 20+
- A Discord bot in the target server
- Server Members Intent enabled for the bot
- Bot installed in the server with permission to view the server/members

## Start

```bash
npm install
cp .env.example .env
# edit .env and add the NEW bot token
npm start
```

Open http://localhost:3000

## Overall calculation

Every Kit uses the same point table:

- HT1 = 60
- LT1 = 45
- HT2 = 30
- LT2 = 20
- HT3 = 10
- LT3 = 6
- HT4 = 4
- LT4 = 3
- HT5 = 2
- LT5 = 1

The site reads the Discord roles attached to each individual member.
For every Kit, it checks whether that member has one of the configured Tier
role IDs. The matching Tier contributes its points to that player's total.

Players are ranked by **total points, highest first**.

There is no separate Overall HT/LT conversion in this version; the Overall
column displays the total points (for example `237 P`). This avoids inventing
an Overall threshold that was not specified.

## Images

Put your own kit images in `public/images/` and change the `image` fields in
`server.js`. The project intentionally uses placeholders such as:

/images/sword.png
/images/axe.png
/images/uhc.png

If an image is missing, the UI shows the kit name instead.

## Discord usernames

The site uses the Discord username (`user.username`) rather than a Minecraft
username/UUID. It also keeps the Discord user ID in the data model for stable
profile URLs.

## Updating data

The API caches Discord data for CACHE_SECONDS (default 60 seconds).
Use the Refresh button on the site to force an immediate refresh.