const GH_USER = "KetaGod";
const GH_REPO = "KetasSteamAchievementTracker"; 
const REPO_URL = `https://github.com/${GH_USER}/${GH_REPO}`;
const RELEASES_API = `https://api.github.com/repos/${GH_USER}/${GH_REPO}/releases`;
const LATEST_API = `${RELEASES_API}/latest`;

function $(sel){ return document.querySelector(sel); }
function setHref(id, url){ const el = $(id); if (el) el.href = url; }
function fmtDate(iso){ try{return new Date(iso).toLocaleDateString()}catch{return ""} }

(function wireLinks(){
  setHref("#repoLink", REPO_URL);
  setHref("#issuesLink", `${REPO_URL}/issues`);
  setHref("#releasesBtn", `${REPO_URL}/releases`);
})();

async function loadLatest(){
  const btn = $("#latestBtn") || $("#downloadBtn");
  const meta = $("#latestMeta") || $("#dlMeta");
  if (!btn && !meta) return;

  try{
    const r = await fetch(LATEST_API, { headers: { "Accept": "application/vnd.github+json" }});
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    const rel = await r.json();
    const exe = (rel.assets || []).find(a => /\.exe$/i.test(a.name)) || rel.assets?.[0];

    if (btn) {
      if (exe) {
        btn.href = exe.browser_download_url;
        btn.textContent = `Download KSAT ${rel.tag_name || ""} for Windows`;
      } else {
        btn.href = `${REPO_URL}/releases/latest`;
        btn.textContent = `Download KSAT (Latest)`;
      }
    }
    if (meta) meta.textContent = `Version ${rel.tag_name || ""} • ${fmtDate(rel.published_at)} • ${rel.name || ""}`;
  }catch(e){
    if (btn) {
      btn.href = `${REPO_URL}/releases/latest`;
      btn.textContent = `Download KSAT (Latest)`;
    }
    if (meta) meta.textContent = `Couldn’t load latest release (network or API rate limit).`;
  }
}

async function loadReleases(limit=12){
  const box = document.querySelector("#releaseList");
  if (!box) return;
  try{
    const r = await fetch(RELEASES_API, { headers: { "Accept": "application/vnd.github+json" }});
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    const arr = await r.json();
    box.innerHTML = "";
    for(const rel of arr.slice(0, limit)){
      const el = document.createElement("div");
      el.className = "rel";
      const body = (rel.body || "").trim();

      let bodyHtml = "";
      if (window.marked && window.DOMPurify) {
        const rawHtml = marked.parse(body, { gfm: true, breaks: true });
        bodyHtml = DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
      } else {
        const short = body.split("\n").slice(0,6).join("\n");
        bodyHtml = `<pre class="code small">${escapeHtml(short)}${body.split("\n").length>6 ? "\n…" : ""}</pre>`;
      }

      el.innerHTML = `
        <div><b>${rel.name || rel.tag_name}</b> — ${fmtDate(rel.published_at)}</div>
        <div class="release-body">${bodyHtml}</div>
        <div style="margin-top:6px">
          <a href="${rel.html_url}" target="_blank" rel="noopener">View on GitHub</a>
        </div>
      `;
      box.appendChild(el);
    }
  }catch(e){
    box.textContent = "Couldn’t load releases.";
  }
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] || c));
}

loadLatest();
loadReleases(12);
