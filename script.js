let data = {};
let currentLang = "es";

document.addEventListener("DOMContentLoaded", async () => {
  data = await fetchData("data.json");

  const stored = localStorage.getItem("portfolio_lang");
  currentLang = stored || data.settings.default_lang || "es";

  loadStaticData();
  renderLanguage(currentLang);

  document.getElementById("lang-toggle").addEventListener("click", () => {
    currentLang = currentLang === "es" ? "en" : "es";
    localStorage.setItem("portfolio_lang", currentLang);
    renderLanguage(currentLang);
  });

  // Mobile menu
  const mobileToggle = document.getElementById("mobile-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  mobileToggle.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
  });

  // Close mobile menu on link click
  document.getElementById("mobile-links").addEventListener("click", (e) => {
    if (e.target.tagName.toLowerCase() === "a") mobileMenu.classList.add("hidden");
  });

  // Back to top
  const backBtn = document.getElementById("back-to-top");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 600) backBtn.classList.remove("hidden");
    else backBtn.classList.add("hidden");
  });
  backBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  setupActiveNavObserver();
});

async function fetchData(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo cargar data.json");
  return await res.json();
}

function loadStaticData() {
  // Brand
  document.getElementById("brand").textContent = data.settings.brand || "<GN/>";
  document.getElementById("footer-brand").textContent = data.settings.brand || "<GN/>";

  // Profile
  document.getElementById("profile-img").src = data.settings.profile_image || "";
  document.getElementById("profile-name").textContent = data.settings.profile_name || "";
  document.getElementById("footer-name").textContent = data.settings.profile_name || "Portfolio";
  document.getElementById("year").textContent = new Date().getFullYear();

  // CV
  const cv = document.getElementById("btn-cv");
  cv.href = data.settings.cv_link || "#";

  // Socials (header + footer)
  renderSocials("social-icons");
  renderSocials("footer-contact", true);
}

function renderLanguage(lang) {
  const t = data[lang];
  const ui = t.ui;

  document.documentElement.lang = lang;

  const langBtn = document.getElementById("lang-toggle");
  langBtn.textContent = lang === "es" ? "🇺🇸 EN" : "🇪🇸 ES";

  renderNav(ui.nav);

  // HERO
  setText("hero-name", t.hero.name);
  setText("hero-role", t.hero.role);
  setText("hero-summary", t.hero.summary);
  setText("profile-sub", t.hero.role);

  document.getElementById("target-pill").textContent =
    `${ui.labels.target_role}: ${data.stats.target_role}`;

  const hl = document.getElementById("hero-highlights");
  hl.innerHTML = (t.hero.highlights || []).map(x => `<li>${escapeHtml(x)}</li>`).join("");

  setText("btn-cv", ui.buttons.download_cv);

  // Titles
  setText("title-quickfacts", ui.section_titles.quick_facts);
  setText("title-interests", ui.section_titles.interests);
  setText("title-skills", ui.section_titles.skills);
  setText("title-exp", ui.section_titles.experience);
  setText("title-activities", ui.section_titles.activities);
  setText("title-projects", ui.section_titles.projects);
  setText("title-certs", ui.section_titles.certs);
  setText("title-ctfs", ui.section_titles.ctfs);
  setText("title-edu", ui.section_titles.education);

  // Quick facts
  renderQuickFacts(ui);

  // Interests (moved to top)
  renderTags("list-interests", t.interests || []);

  // Skills
  renderSkillGroups(t.skills?.groups || []);

  // Experience & Activities (bullets supported)
  renderTimeline("list-experience", t.experience || []);
  renderTimeline("list-activities", t.activities || []);

  // Projects (support 2 repos)
  renderProjects("list-projects", t.projects || [], ui);

  // Certs (sort by date desc)
  const certsSorted = (t.certs || []).slice().sort((a, b) => compareCertDates(b, a));
  renderCerts("list-certs", certsSorted, lang);

  // CTFs (sort by year desc)
  renderCTFs("list-ctfs", (t.ctfs || []).slice().sort((a,b) => (+b.year || 0) - (+a.year || 0)), ui);

  // Education
  renderEducation("list-education", t.education || []);

  document.getElementById("back-to-top").title = ui.buttons.back_to_top;
}

/* NAV */
function renderNav(navItems) {
  const nav = document.getElementById("nav-links");
  const mobile = document.getElementById("mobile-links");

  const html = navItems
    .map(i => `<li><a class="nav-a" href="#${i.id}" data-section="${i.id}">${escapeHtml(i.label)}</a></li>`)
    .join("");

  nav.innerHTML = html;

  mobile.innerHTML = navItems
    .map(i => `<li><a href="#${i.id}" data-section="${i.id}">${escapeHtml(i.label)}</a></li>`)
    .join("");
}

/* SOCIALS */
function renderSocials(containerId, compact = false) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = "";

  const icons = {
    linkedin: '<i class="fa-brands fa-linkedin"></i>',
    github: '<i class="fa-brands fa-github"></i>',
    email: '<i class="fa-solid fa-envelope"></i>',
    phone: '<i class="fa-solid fa-phone"></i>'
  };

  Object.entries(data.contact).forEach(([key, value]) => {
    let href = value;
    if (key === "email") href = `mailto:${value}`;
    if (key === "phone") href = `tel:${value}`;

    const a = document.createElement("a");
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
    a.title = key;
    a.innerHTML = icons[key] || "";
    if (compact) a.style.marginLeft = "12px";
    el.appendChild(a);
  });
}

/* QUICK FACTS */
function renderQuickFacts(ui) {
  const facts = document.getElementById("quick-facts");
  const spoken = (data.stats.spoken_languages || []).join(" · ");

  facts.innerHTML = `
    ${factRow("fa-solid fa-location-dot", ui.labels.location, data.stats.location)}
    ${factRow("fa-solid fa-circle-check", ui.labels.availability, data.stats.availability)}
    ${factRow("fa-solid fa-crosshairs", ui.labels.target_role, data.stats.target_role)}
    ${factRow("fa-solid fa-flask", ui.labels.labs_solved, data.stats.labs_solved)}
    ${factRow("fa-solid fa-language", ui.labels.spoken_languages, spoken)}
  `;
}

function factRow(icon, key, val) {
  return `
    <div class="fact">
      <i class="${icon}"></i>
      <div>
        <div class="k">${escapeHtml(key)}</div>
        <div class="v">${escapeHtml(val || "")}</div>
      </div>
    </div>
  `;
}

/* SKILLS */
function renderSkillGroups(groups) {
  const el = document.getElementById("skills-groups");
  el.innerHTML = groups.map(g => `
    <div class="skill-card">
      <h4>${escapeHtml(g.label)}</h4>
      <div class="tag-cloud">
        ${(g.items || []).map(x => `<span class="tag">${escapeHtml(x)}</span>`).join("")}
      </div>
    </div>
  `).join("");
}

/* TIMELINE (bullets) */
function renderTimeline(id, items) {
  const el = document.getElementById(id);
  el.innerHTML = items.map(i => {
    const org = i.company || i.org || "";
    const tags = (i.tags || []).map(t => `<span class="badge">${escapeHtml(t)}</span>`).join("");
    const bullets = (i.bullets || []).map(b => `<li>${escapeHtml(b)}</li>`).join("");
    const hasBullets = bullets.length > 0;

    return `
      <div class="timeline-item">
        <div class="timeline-top">
          <div>
            <h4>${escapeHtml(i.role || "")}</h4>
            <div class="timeline-meta">${escapeHtml(org)} • ${escapeHtml(i.period || "")}</div>
          </div>
        </div>

        ${i.desc ? `<p>${escapeHtml(i.desc)}</p>` : ""}
        ${hasBullets ? `<ul class="bullet-list">${bullets}</ul>` : ""}

        ${tags ? `<div class="badges">${tags}</div>` : ""}
      </div>
    `;
  }).join("");
}

/* PROJECTS (2 repos) */
function renderProjects(id, projects, ui) {
  const el = document.getElementById(id);
  el.innerHTML = projects.map(p => {
    const techs = (p.tech || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("");

    const repo = p.links?.repo?.trim();
    const repoFE = p.links?.repo_frontend?.trim();
    const repoBE = p.links?.repo_backend?.trim();
    const demo = p.links?.demo?.trim();
    const more = p.links?.more?.trim();

    return `
      <article class="project-card">
        ${p.image ? `<img class="project-img" src="${escapeAttr(p.image)}" alt="project image">` : `<div class="project-img"></div>`}
        <div class="project-body">
          <div class="project-top">
            <h4>${escapeHtml(p.title || "")}</h4>
            <span class="chip">${escapeHtml((p.year || "") + (p.status ? " • " + p.status : ""))}</span>
          </div>

          <p>${escapeHtml(p.desc || "")}</p>
          <div class="tag-cloud" style="margin-top:10px">${techs}</div>

          <div class="project-actions">
            ${repo ? `<a class="btn-ghost btn-accent" href="${escapeAttr(repo)}" target="_blank" rel="noopener">
              <i class="fa-brands fa-github"></i> ${escapeHtml(ui.buttons.repo)}
            </a>` : ""}

            ${repoFE ? `<a class="btn-ghost btn-accent" href="${escapeAttr(repoFE)}" target="_blank" rel="noopener">
              <i class="fa-brands fa-github"></i> ${escapeHtml(ui.buttons.repo_frontend)}
            </a>` : ""}

            ${repoBE ? `<a class="btn-ghost btn-accent" href="${escapeAttr(repoBE)}" target="_blank" rel="noopener">
              <i class="fa-brands fa-github"></i> ${escapeHtml(ui.buttons.repo_backend)}
            </a>` : ""}

            ${demo ? `<a class="btn-ghost" href="${escapeAttr(demo)}" target="_blank" rel="noopener">
              <i class="fa-solid fa-globe"></i> ${escapeHtml(ui.buttons.view_demo)}
            </a>` : ""}

            ${more ? `<a class="btn-ghost" href="${escapeAttr(more)}" target="_blank" rel="noopener">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> ${escapeHtml(ui.buttons.view_more)}
            </a>` : ""}
          </div>
        </div>
      </article>
    `;
  }).join("");
}

/* CERTS (date format + sort) */
function renderCerts(id, certs, lang) {
  const el = document.getElementById(id);

  el.innerHTML = certs.map(c => {
    const badge = c.date ? formatYM(c.date, lang) : "";
    return `
      <a class="cert-card" href="${escapeAttr(c.link || "#")}" target="_blank" rel="noopener">
        <img class="cert-img" src="${escapeAttr(c.image || "")}" alt="cert logo">
        <div class="cert-info">
          <h4>${escapeHtml(c.name || "")}</h4>
          <div class="meta">${escapeHtml(c.issuer || "")}</div>
        </div>
        ${badge ? `<div class="year-badge">${escapeHtml(badge)}</div>` : `<div class="year-badge">—</div>`}
      </a>
    `;
  }).join("");
}

function compareCertDates(a, b) {
  // a,b objects. Want descending by date (YYYY-MM). Missing date goes last.
  const da = (a.date || "").trim();
  const db = (b.date || "").trim();
  if (!da && !db) return 0;
  if (!da) return 1;
  if (!db) return -1;
  return db.localeCompare(da);
}

function formatYM(ym, lang) {
  // ym: "YYYY-MM"
  const [y, m] = String(ym).split("-");
  const monthIndex = Math.max(1, Math.min(12, parseInt(m || "1", 10))) - 1;
  const monthsES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const monthsEN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const mm = (lang === "es" ? monthsES : monthsEN)[monthIndex] || m;
  return `${mm} ${y}`;
}

/* CTFS */
function renderCTFs(id, ctfs, ui) {
  const el = document.getElementById(id);
  el.innerHTML = ctfs.map(c => {
    const event = c.event_link?.trim();
    const cert = c.cert_link?.trim();
    const writeup = c.writeup_link?.trim();

    return `
      <div class="ctf-card">
        <div class="ctf-top">
          <div>
            <div class="ctf-name">${escapeHtml(c.name || "")}</div>
            <div class="ctf-meta">${escapeHtml(c.platform || "")} • ${escapeHtml(c.year || "")}</div>
          </div>
          <span class="chip">${escapeHtml(c.year || "")}</span>
        </div>

        <div class="ctf-rank">${escapeHtml(c.rank || "")}</div>

        <div class="ctf-actions">
          ${event ? `<a class="btn-ghost btn-accent" href="${escapeAttr(event)}" target="_blank" rel="noopener">
            <i class="fa-solid fa-trophy"></i> ${escapeHtml(ui.buttons.open_link)}
          </a>` : ""}

          ${cert ? `<a class="btn-ghost" href="${escapeAttr(cert)}" target="_blank" rel="noopener">
            <i class="fa-solid fa-certificate"></i> Cert
          </a>` : ""}

          ${writeup ? `<a class="btn-ghost" href="${escapeAttr(writeup)}" target="_blank" rel="noopener">
            <i class="fa-solid fa-pen-to-square"></i> Writeup
          </a>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

/* EDUCATION */
function renderEducation(id, items) {
  const el = document.getElementById(id);
  el.innerHTML = items.map(e => {
    const notes = (e.notes || []).map(n => `<div class="edu-note">• ${escapeHtml(n)}</div>`).join("");
    return `
      <div class="edu-card">
        <img class="edu-img" src="${escapeAttr(e.image || "")}" alt="education logo">
        <div class="edu-info">
          <h4>${escapeHtml(e.institution || "")}</h4>
          <div class="meta">${escapeHtml(e.degree || "")}</div>
          <div class="meta">${escapeHtml(e.period || "")}</div>
          ${notes ? `<div class="edu-notes">${notes}</div>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

/* TAGS */
function renderTags(id, tags) {
  const el = document.getElementById(id);
  el.innerHTML = tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("");
}

/* HELPERS */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text || "";
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(str) {
  return escapeHtml(str);
}

/* Active nav highlight */
let sectionObserver = null;

function setupActiveNavObserver() {
  const sections = Array.from(document.querySelectorAll("main .section, header.section"));
  const opts = { root: null, rootMargin: "-40% 0px -55% 0px", threshold: 0.01 };

  sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      setActiveNav(id);
    });
  }, opts);

  sections.forEach(s => sectionObserver.observe(s));
}

function setActiveNav(sectionId) {
  document.querySelectorAll(".nav-a").forEach(a => {
    const match = a.getAttribute("data-section") === sectionId;
    a.classList.toggle("active", match);
  });
}
