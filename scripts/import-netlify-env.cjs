const fs = require('fs');
const { spawnSync } = require('child_process');
const raw = fs.readFileSync('.env','utf8');
const map = {};
for (const line of raw.split(/\r?\n/)) {
  if (!line || line.trim().startsWith('#')) continue;
  const i = line.indexOf('=');
  if (i < 0) continue;
  const k = line.slice(0,i).trim();
  let v = line.slice(i+1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1,-1);
  map[k]=v;
}
map.NEXT_PUBLIC_APP_URL='https://yulin-lms.netlify.app';
const keys=['DATABASE_URL','DIRECT_URL','AUTH_SECRET','NEXT_PUBLIC_TEACHER_ID','NEXT_PUBLIC_APP_URL','NEXT_PUBLIC_VIDEO_PROVIDER','NEXT_PUBLIC_TENCENT_VOD_APP_ID','NEXT_PUBLIC_TENCENT_VOD_PLAY_DOMAIN','TENCENT_VOD_PLAY_KEY'];
const lines = keys.filter(k => map[k]).map(k => ${k}=);
fs.writeFileSync('.env.netlify', lines.join('\n') + '\n');
const r = spawnSync('npx.cmd',['netlify','env:import','.env.netlify','--replace-existing'],{encoding:'utf8',shell:true});
console.log('status', r.status);
console.log((r.stdout||'').slice(0,500));
console.log((r.stderr||'').slice(0,500));
