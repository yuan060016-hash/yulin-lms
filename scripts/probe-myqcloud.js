const candidates = [
  "https://5a3edc40vodcq1395361200.bd.myqcloud.com/524b66a45001834820125101240/ApOulyW2HmAA.mp4",
  "https://5a3edc40vodcq1395361200.cos.ap-guangzhou.myqcloud.com/524b66a45001834820125101240/ApOulyW2HmAA.mp4",
  "https://1395361200.vod-qcloud.com/5a3edc40vodcq1395361200/524b66a45001834820125101240/ApOulyW2HmAA.mp4",
  "https://1250000000.vod2.myqcloud.com/5a3edc40vodcq1395361200/524b66a45001834820125101240/ApOulyW2HmAA.mp4",
  "https://vod-cknj.qcloud.com/5a3edc40vodcq1395361200/524b66a45001834820125101240/ApOulyW2HmAA.mp4",
];
(async () => {
  for (const u of candidates) {
    try {
      const r = await fetch(u, { method: "HEAD" });
      console.log(r.status, r.headers.get("content-type"), u);
    } catch (e) {
      console.log("ERR", e.message, u);
    }
  }
})();
