const fs = require("fs");
const cfg = JSON.parse(fs.readFileSync(process.env.APPDATA + "/netlify/Config/config.json", "utf8"));
const token = cfg.users[cfg.userId].auth.token;
const headers = { Authorization: "Bearer " + token, "Content-Type": "application/json" };
(async () => {
  const r = await fetch("https://api.netlify.com/api/v1/sites/e0d50888-e6b2-4566-a8fe-be98268da190/builds", {
    method: "POST",
    headers,
    body: JSON.stringify({ clear_cache: true })
  });
  const text = await r.text();
  console.log("STATUS", r.status);
  console.log(text.slice(0, 3000));
})();
