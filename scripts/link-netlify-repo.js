const fs = require("fs");
const cfg = JSON.parse(fs.readFileSync(process.env.APPDATA + "/netlify/Config/config.json", "utf8"));
const token = cfg.users[cfg.userId].auth.token;
const headers = { Authorization: "Bearer " + token, "Content-Type": "application/json" };
const body = {
  repo: {
    provider: "github",
    id: 1371290812,
    repo: "yuan060016-hash/yulin-lms",
    private: true,
    branch: "main",
    cmd: "npm run build",
    dir: ".next",
    installation_id: 161890954
  }
};
(async () => {
  const r = await fetch("https://api.netlify.com/api/v1/sites/e0d50888-e6b2-4566-a8fe-be98268da190", {
    method: "PUT",
    headers,
    body: JSON.stringify(body)
  });
  const text = await r.text();
  console.log("STATUS", r.status);
  console.log(text.slice(0, 5000));
})();
