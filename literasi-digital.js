(() => {
  "use strict";

  const STATS_KEY = "spensus-literasi-stats-v35";
  const CACHE_PREFIX = "spensus-literasi-cache-v35:";
  const CACHE_TTL = 12 * 60 * 60 * 1000;
  const PAGE_SIZE = 18;
  const MAX_RENDER = Number.MAX_SAFE_INTEGER;

  const categories = [
    { id: "all", label: "Semua", icon: "✦", query: "education OR literature OR science", color: ["#075d4c", "#0b8b70"], description: "Koleksi terbuka lintas bidang" },
    { id: "islam", label: "Islam", icon: "☪", query: "islam quran hadith muslim civilization", color: ["#07513f", "#c59827"], description: "Al Qur'an, Hadits, sejarah, peradaban, dan pemikiran Islam" },
    { id: "christianity", label: "Kekristenan", icon: "✝", query: "christianity bible church theology", color: ["#315a86", "#8bb8db"], description: "Kitab, sejarah gereja, teologi, dan etika" },
    { id: "hinduism", label: "Hindu", icon: "ॐ", query: "hinduism vedas upanishads hindu philosophy", color: ["#9c4b16", "#e6a23c"], description: "Sastra suci, filsafat, budaya, dan sejarah Hindu" },
    { id: "buddhism", label: "Buddha", icon: "☸", query: "buddhism buddhist dharma sutra", color: ["#7a5212", "#d7a62d"], description: "Dharma, sutra, sejarah, dan filsafat Buddha" },
    { id: "judaism", label: "Yahudi", icon: "✡", query: "judaism jewish torah history", color: ["#214a91", "#5fa7de"], description: "Sejarah, tradisi, teks, dan kebudayaan Yahudi" },
    { id: "religion", label: "Studi Agama", icon: "◎", query: "comparative religion world religions interfaith", color: ["#5f4787", "#9d78d2"], description: "Perbandingan agama, dialog, dan kerukunan" },
    { id: "fiction", label: "Fiksi", icon: "✒", query: "fiction novel short stories", color: ["#7c2d6a", "#d14ea8"], description: "Novel, cerpen, fantasi, misteri, dan petualangan" },
    { id: "classics", label: "Sastra Klasik", icon: "🪶", query: "classic literature poetry drama", color: ["#6c4c20", "#b68a47"], description: "Karya klasik, puisi, drama, dan sastra dunia" },
    { id: "children", label: "Anak & Remaja", icon: "🌈", query: "children juvenile young adult stories", color: ["#1f6a8a", "#2db8c9"], description: "Cerita anak, remaja, dan bacaan keluarga" },
    { id: "science", label: "Sains", icon: "⚗", query: "science physics biology chemistry astronomy", color: ["#146c43", "#44ad6f"], description: "Fisika, biologi, kimia, bumi, dan astronomi" },
    { id: "mathematics", label: "Matematika", icon: "∑", query: "mathematics algebra geometry statistics", color: ["#254b91", "#527ed5"], description: "Bilangan, aljabar, geometri, statistika, dan logika" },
    { id: "history", label: "Sejarah", icon: "⌛", query: "history civilization archaeology biography", color: ["#7b4a21", "#b77b42"], description: "Peradaban, sejarah dunia, arkeologi, dan biografi" },
    { id: "technology", label: "Teknologi, Koding & AI", icon: "⌘", query: "technology computer programming coding artificial intelligence", color: ["#163a76", "#315fd4"], description: "Komputer, pemrograman, data, keamanan, dan AI" },
    { id: "education", label: "Pendidikan", icon: "🎓", query: "education teaching learning pedagogy curriculum", color: ["#075d4c", "#18a77f"], description: "Pembelajaran, kurikulum, asesmen, dan pedagogi" },
    { id: "philosophy", label: "Filsafat", icon: "◇", query: "philosophy ethics logic epistemology", color: ["#4b376e", "#8267a9"], description: "Etika, logika, epistemologi, dan pemikiran" },
    { id: "social", label: "Sosial & Budaya", icon: "◉", query: "social sciences culture anthropology sociology economics", color: ["#8b3e32", "#cf6f58"], description: "Masyarakat, budaya, ekonomi, antropologi, dan sosiologi" }
  ];

  const categoryById = Object.fromEntries(categories.map((item) => [item.id, item]));
  const islamStarterCatalog = [["Al Qur'an Digital Kementerian Agama", "Kementerian Agama Republik Indonesia", "Al Qur'an", "https://quran.kemenag.go.id/", "Baca daring resmi"], ["Tafsir Ringkas Al Qur'an", "Kementerian Agama Republik Indonesia", "Tafsir", "https://quran.kemenag.go.id/", "Baca daring resmi"], ["Indeks Tematik Al Qur'an", "Kementerian Agama Republik Indonesia", "Al Qur'an Tematik", "https://quran.kemenag.go.id/", "Baca daring resmi"], ["Hadits Arba'in Nawawi", "Koleksi teks klasik", "Hadits", "https://archive.org/search?query=arba%27in+nawawi+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Riyadhus Shalihin", "Koleksi teks klasik", "Hadits dan Akhlak", "https://archive.org/search?query=riyadhus+shalihin+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Bulughul Maram", "Koleksi teks klasik", "Hadits Fikih", "https://archive.org/search?query=bulughul+maram+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Al-Adab Al-Mufrad", "Koleksi teks klasik", "Akhlak", "https://archive.org/search?query=al+adab+al+mufrad+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Sirah Nabi Muhammad Sholallohu 'Alaihi Wasallam", "Koleksi sejarah Islam", "Sirah", "https://archive.org/search?query=sirah+nabi+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Sejarah Khulafaur Rasyidin", "Koleksi sejarah Islam", "Sejarah Islam", "https://archive.org/search?query=khulafaur+rasyidin+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Sejarah Peradaban Islam Nusantara", "Koleksi sejarah terbuka", "Sejarah Islam", "https://archive.org/search?query=sejarah+islam+nusantara+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Dasar-Dasar Aqidah Islam", "Koleksi pendidikan Islam", "Aqidah", "https://archive.org/search?query=aqidah+islam+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Tauhid dan Kehidupan", "Koleksi pendidikan Islam", "Aqidah", "https://archive.org/search?query=tauhid+islam+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Fiqih Ibadah Praktis", "Koleksi pendidikan Islam", "Fiqih", "https://archive.org/search?query=fiqih+ibadah+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Fiqih Sholat", "Koleksi pendidikan Islam", "Fiqih Sholat", "https://archive.org/search?query=fiqih+sholat+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Fiqih Puasa dan Ramadhan", "Koleksi pendidikan Islam", "Fiqih Puasa", "https://archive.org/search?query=fiqih+puasa+ramadhan+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Fiqih Zakat dan Wakaf", "Koleksi pendidikan Islam", "Zakat dan Wakaf", "https://archive.org/search?query=fiqih+zakat+wakaf+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Fiqih Haji dan Umroh", "Koleksi pendidikan Islam", "Haji dan Umroh", "https://archive.org/search?query=fiqih+haji+umrah+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Adab dan Akhlak Muslim", "Koleksi pendidikan Islam", "Akhlak", "https://archive.org/search?query=adab+akhlak+islam+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Pendidikan Keluarga Islami", "Koleksi pendidikan Islam", "Keluarga", "https://archive.org/search?query=pendidikan+keluarga+islam+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Kumpulan Doa dan Dzikir", "Koleksi teks terbuka", "Doa dan Dzikir", "https://archive.org/search?query=doa+dzikir+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Hisnul Muslim", "Koleksi doa", "Doa dan Dzikir", "https://archive.org/search?query=hisnul+muslim+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Bahasa Arab untuk Pemula", "Koleksi pembelajaran bahasa", "Bahasa Arab", "https://archive.org/search?query=bahasa+arab+untuk+pemula+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Nahwu dan Sharaf Dasar", "Koleksi pembelajaran bahasa", "Bahasa Arab", "https://archive.org/search?query=nahwu+sharaf+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Ekonomi dan Keuangan Syariah", "Koleksi akses terbuka", "Muamalah", "https://archive.org/search?query=ekonomi+syariah+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Etika Bermedia dalam Islam", "Koleksi literasi digital", "Akhlak Digital", "https://archive.org/search?query=etika+media+islam+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Sains dan Islam", "Koleksi pendidikan terbuka", "Sains dan Islam", "https://archive.org/search?query=sains+islam+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Tokoh-Tokoh Ilmuwan Muslim", "Koleksi sejarah ilmu", "Biografi", "https://archive.org/search?query=ilmuwan+muslim+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Kisah Teladan Para Nabi 'Alaihissalam", "Koleksi kisah Islam", "Kisah Teladan", "https://archive.org/search?query=kisah+nabi+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Kisah Sahabat Nabi", "Koleksi sejarah Islam", "Kisah Teladan", "https://archive.org/search?query=kisah+sahabat+nabi+indonesia+mediatype%3Atexts", "Telusuri koleksi terbuka"], ["Khutbah Jum'at Tematik", "Koleksi dakwah", "Khutbah", "https://islam.nu.or.id/khutbah", "Baca sumber resmi"], ["Artikel Tarjih dan Keislaman", "Muhammadiyah", "Artikel Islam", "https://muhammadiyah.or.id/category/islam/", "Baca sumber resmi"], ["Artikel Pendidikan dan Keislaman", "Kementerian Agama Republik Indonesia", "Artikel Islam", "https://kemenag.go.id/kolom", "Baca sumber resmi"], ["Kajian Aqidah dan Akhlak", "Muslim.or.id", "Artikel Islam", "https://muslim.or.id/", "Baca sumber resmi"], ["Kajian Video dan Audio Islam", "Yufid", "Media Islam", "https://yufid.com/", "Baca sumber resmi"], ["Kajian dan Radio Islam", "Radio Rodja", "Media Islam", "https://rodja.com/", "Baca sumber resmi"], ["Artikel Islam Indonesia", "NU Online", "Artikel Islam", "https://islam.nu.or.id/", "Baca sumber resmi"]].map((row, index) => ({
    kind: "book", id: `islam-local-${index+1}`, title: row[0], author: row[1], year: "—", language: ["ind"],
    source: "Katalog Islam Spensus", sourceId: "local", subjects: [row[2], "Islam", "Bahasa Indonesia"],
    description: `${row[4]}. Entri katalog tersimpan luring dan langsung tampil. Isi lengkap hanya dibuka dari sumber yang memang memberi akses legal.`,
    category: "islam", icon: "☪", color: ["#07513f", "#c59827"], access: row[4], readUrl: row[3], downloadUrl: "", previewUrl: row[3]
  }));

  const languageDomains = { ind: "id", eng: "en", ara: "ar", msa: "ms", jpn: "ja", chi: "zh", fre: "fr", ger: "de", spa: "es", rus: "ru", hin: "hi", por: "pt" };
  const languageNames = { ind: "Indonesia", eng: "English", ara: "Arab", msa: "Melayu", jpn: "Jepang", chi: "Tionghoa", fre: "Prancis", ger: "Jerman", spa: "Spanyol", rus: "Rusia", hin: "Hindi", por: "Portugis" };

  const els = {
    form: document.querySelector("#literasi-search-form"),
    query: document.querySelector("#literasi-query"),
    category: document.querySelector("#literasi-category"),
    language: document.querySelector("#literasi-language"),
    chips: document.querySelector("#lit-category-chips"),
    grid: document.querySelector("#literasi-grid"),
    providerBar: document.querySelector("#lit-provider-bar"),
    resultTitle: document.querySelector("#lit-result-title"),
    resultCount: document.querySelector("#lit-result-count"),
    totalRecords: document.querySelector("#lit-total-records"),
    connectedSources: document.querySelector("#lit-connected-sources"),
    networkMode: document.querySelector("#lit-network-mode"),
    sync: document.querySelector("#lit-sync-indicator"),
    reset: document.querySelector("#lit-reset-search"),
    loadMore: document.querySelector("#lit-load-more"),
    preview: document.querySelector("#literasi-preview"),
    previewBody: document.querySelector("#literasi-preview-body")
  };

  if (!els.form || !els.grid) return;

  let searchToken = 0;
  let currentPage = 1;
  let currentBooks = [];
  let providerTotals = { openLibrary: 0, internetArchive: 0 };
  let providerStates = {};
  let hasMore = false;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
  const stripHtml = (value) => String(value || "").replace(/<[^>]*>/g, " ").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  const compact = (value, limit = 250) => { const text = stripHtml(value); return text.length > limit ? `${text.slice(0, limit - 1).trim()}…` : text; };
  const stableHash = (value) => { let hash = 2166136261; for (const char of String(value)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); } return hash >>> 0; };
  const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");
  const normalizedKey = (book) => `${String(book.title || "").toLocaleLowerCase("id").replace(/[^a-z0-9\u00c0-\uFFFF]+/g, " ").trim()}|${String(book.author || "").toLocaleLowerCase("id").slice(0, 55)}`;

  function readStats() {
    try { return { visits: 0, searches: 0, previews: 0, reads: 0, downloads: 0, borrows: 0, ...JSON.parse(localStorage.getItem(STATS_KEY) || "{}") }; }
    catch { return { visits: 0, searches: 0, previews: 0, reads: 0, downloads: 0, borrows: 0 }; }
  }
  function renderStats(stats = readStats()) { Object.entries(stats).forEach(([key, value]) => document.querySelectorAll(`[data-lit-stat="${key}"]`).forEach((node) => { node.textContent = formatNumber(value); })); }
  function incrementStat(key) { const stats = readStats(); stats[key] = Number(stats[key] || 0) + 1; localStorage.setItem(STATS_KEY, JSON.stringify(stats)); renderStats(stats); }
  if (!sessionStorage.getItem("spensus-literasi-visit-v35")) { sessionStorage.setItem("spensus-literasi-visit-v35", "1"); incrementStat("visits"); } else renderStats();

  function renderCategoryControls() {
    els.category.innerHTML = categories.map((item) => `<option value="${item.id}">${item.label}</option>`).join("");
    els.chips.innerHTML = categories.map((item) => `<button type="button" data-lit-category="${item.id}" class="${item.id === "all" ? "is-active" : ""}"><span>${item.icon}</span> ${item.label}</button>`).join("");
  }

  function currentCategory() { return categoryById[els.category.value] || categoryById.all; }
  function setCategory(id, run = true) {
    els.category.value = categoryById[id] ? id : "all";
    els.chips.querySelectorAll("[data-lit-category]").forEach((button) => button.classList.toggle("is-active", button.dataset.litCategory === els.category.value));
    if (run) runSearch({ reset: true });
  }

  function makeCollectionCards(categoryId = "all") {
    if (categoryId === "islam") return [...islamStarterCatalog];
    const chosen = categoryId === "all" ? categories.slice(1) : [currentCategory(), ...categories.filter((item) => !["all", categoryId].includes(item.id)).slice(0, 7)];
    return chosen.map((category) => ({
      kind: "collection",
      id: `collection-${category.id}`,
      title: `Koleksi ${category.label}`,
      author: "Katalog federatif Spensus",
      year: "Dinamis",
      language: [],
      source: "Akses cepat",
      sourceId: "local",
      subjects: [category.label, "Domain publik & akses terbuka"],
      description: category.description,
      category: category.id,
      icon: category.icon,
      color: category.color,
      access: "Koleksi",
      readUrl: "",
      downloadUrl: ""
    }));
  }

  function cacheKey(provider, params) { return `${CACHE_PREFIX}${provider}:${btoa(unescape(encodeURIComponent(JSON.stringify(params)))).replace(/=+$/g, "").slice(0, 180)}`; }
  function readCache(provider, params) {
    try {
      const stored = JSON.parse(localStorage.getItem(cacheKey(provider, params)) || "null");
      if (!stored || Date.now() - stored.savedAt > CACHE_TTL) return null;
      return stored.payload;
    } catch { return null; }
  }
  function writeCache(provider, params, payload) {
    try { localStorage.setItem(cacheKey(provider, params), JSON.stringify({ savedAt: Date.now(), payload })); }
    catch {
      Object.keys(localStorage).filter((key) => key.startsWith(CACHE_PREFIX)).slice(0, 8).forEach((key) => localStorage.removeItem(key));
    }
  }

  async function fetchJson(url, timeout = 6500) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally { clearTimeout(timer); }
  }

  function buildTerm(params) {
    const category = categoryById[params.category] || categoryById.all;
    return [params.query.trim(), category.query].filter(Boolean).join(" ").trim();
  }

  async function searchOpenLibrary(params) {
    const cached = readCache("ol", params); if (cached) return { ...cached, cached: true };
    const term = buildTerm(params);
    const fields = "key,title,author_name,first_publish_year,cover_i,language,ebook_access,public_scan_b,ia,subject,first_sentence";
    const query = `${term} ebook_access:public`;
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&limit=${PAGE_SIZE}&page=${params.page}${params.language ? `&language=${encodeURIComponent(params.language)}` : ""}`;
    const data = await fetchJson(url);
    const books = (data.docs || []).map((doc) => {
      const ia = Array.isArray(doc.ia) ? doc.ia[0] : "";
      const workUrl = doc.key ? `https://openlibrary.org${doc.key}` : "https://openlibrary.org/";
      const access = ia || doc.public_scan_b || doc.ebook_access === "public" ? "Baca terbuka" : "Metadata";
      return {
        kind: "book", id: `ol-${doc.key || stableHash(doc.title)}`, title: doc.title || "Tanpa judul",
        author: Array.isArray(doc.author_name) ? doc.author_name.join(", ") : "Penulis tidak tercantum",
        year: doc.first_publish_year || "—", language: Array.isArray(doc.language) ? doc.language.slice(0, 5) : [],
        cover: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : "",
        source: "Open Library", sourceId: "openLibrary", subjects: Array.isArray(doc.subject) ? doc.subject.slice(0, 5) : [],
        description: Array.isArray(doc.first_sentence) ? doc.first_sentence[0] : (doc.first_sentence || "Metadata buku terbuka dari Open Library."),
        access, readUrl: ia ? `https://archive.org/details/${encodeURIComponent(ia)}` : workUrl,
        downloadUrl: ia ? `https://archive.org/details/${encodeURIComponent(ia)}` : "", previewUrl: workUrl
      };
    }).filter((book) => book.access === "Baca terbuka");
    const payload = { total: Number(data.numFound || 0), books }; writeCache("ol", params, payload); return payload;
  }

  async function searchInternetArchive(params) {
    const cached = readCache("ia", params); if (cached) return { ...cached, cached: true };
    const rawTerm = buildTerm(params).replace(/["():]/g, " ").replace(/\s+/g, " ").trim();
    const quoted = rawTerm.split(/\s+/).slice(0, 10).map((word) => `"${word}"`).join(" ");
    const language = params.language ? ` AND language:${params.language}` : "";
    const q = `mediatype:texts AND (collection:gutenberg OR collection:opensource OR licenseurl:*creativecommons*) AND (title:(${quoted}) OR subject:(${quoted}) OR description:(${quoted}))${language}`;
    const fields = ["identifier", "title", "creator", "date", "year", "language", "description", "subject", "downloads", "licenseurl"];
    const fieldQuery = fields.map((field) => `fl[]=${encodeURIComponent(field)}`).join("&");
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&${fieldQuery}&rows=${PAGE_SIZE}&page=${params.page}&sort[]=downloads+desc&output=json`;
    const data = await fetchJson(url, 7000);
    const docs = data.response?.docs || [];
    const books = docs.map((doc) => {
      const identifier = doc.identifier;
      const author = Array.isArray(doc.creator) ? doc.creator.join(", ") : (doc.creator || "Penulis tidak tercantum");
      const subjects = Array.isArray(doc.subject) ? doc.subject : (doc.subject ? [doc.subject] : []);
      const langs = Array.isArray(doc.language) ? doc.language : (doc.language ? [doc.language] : []);
      return {
        kind: "book", id: `ia-${identifier}`, title: doc.title || "Tanpa judul", author,
        year: String(doc.year || doc.date || "—").slice(0, 4), language: langs.slice(0, 4),
        cover: `https://archive.org/services/img/${encodeURIComponent(identifier)}`,
        source: "Internet Archive", sourceId: "internetArchive", subjects: subjects.slice(0, 5),
        description: compact(doc.description || "Koleksi teks terbuka pada Internet Archive.", 280),
        access: "Baca / unduh", readUrl: `https://archive.org/details/${encodeURIComponent(identifier)}`,
        downloadUrl: `https://archive.org/download/${encodeURIComponent(identifier)}/`, previewUrl: `https://archive.org/details/${encodeURIComponent(identifier)}`,
        downloads: Number(doc.downloads || 0)
      };
    });
    const payload = { total: Number(data.response?.numFound || 0), books }; writeCache("ia", params, payload); return payload;
  }

  async function searchWikisource(params) {
    const cached = readCache("ws", params); if (cached) return { ...cached, cached: true };
    const domain = languageDomains[params.language] || "en";
    const term = buildTerm(params).split(/\s+/).slice(0, 8).join(" ");
    const url = `https://${domain}.wikisource.org/w/api.php?action=query&list=search&srnamespace=0&srsearch=${encodeURIComponent(term)}&srlimit=${PAGE_SIZE}&sroffset=${(params.page - 1) * PAGE_SIZE}&utf8=1&format=json&origin=*`;
    const data = await fetchJson(url, 6500);
    const books = (data.query?.search || []).map((result) => {
      const pageUrl = `https://${domain}.wikisource.org/wiki/${encodeURIComponent(result.title.replace(/ /g, "_"))}`;
      return {
        kind: "book", id: `ws-${domain}-${result.pageid}`, title: result.title, author: "Kontributor Wikisource",
        year: "—", language: [params.language || domain], cover: "", source: "Wikisource", sourceId: "wikisource",
        subjects: [currentCategory().label, "Teks bebas"], description: compact(result.snippet || "Teks bebas yang tersedia pada Wikisource.", 280),
        access: "Baca terbuka", readUrl: pageUrl, downloadUrl: "", previewUrl: pageUrl, icon: "W"
      };
    });
    const payload = { total: Number(data.query?.searchinfo?.totalhits || 0), books }; writeCache("ws", params, payload); return payload;
  }

  const providerConfig = {
    openLibrary: { label: "Open Library", icon: "📖", fn: searchOpenLibrary },
    internetArchive: { label: "Internet Archive", icon: "🏛️", fn: searchInternetArchive },
};

  function renderProviders() {
    els.providerBar.innerHTML = Object.entries(providerConfig).map(([id, provider]) => {
      const state = providerStates[id] || { status: "idle", total: 0, note: "Siap" };
      const className = state.status === "loading" ? "is-loading" : state.status === "ok" ? "is-ok" : state.status === "fail" ? "is-fail" : "";
      const note = state.status === "ok" ? `${formatNumber(state.total)} rekaman${state.cached ? " • cache cepat" : ""}` : state.note;
      return `<div class="lit-provider-v35 ${className}"><span>${provider.icon}</span><div><b>${provider.label}</b><small>${escapeHtml(note || "Siap")}</small></div></div>`;
    }).join("");
    const connected = Object.values(providerStates).filter((state) => state.status === "ok").length;
    els.connectedSources.textContent = `${connected}/2`;
  }

  function setSync(mode, title, detail) {
    els.sync.classList.toggle("is-working", mode === "working");
    els.sync.classList.toggle("is-ready", mode === "ready");
    els.sync.querySelector("strong").textContent = title;
    els.sync.querySelector("small").textContent = detail;
  }

  function mergeBooks(existing, incoming) {
    const map = new Map(existing.filter((book) => book.kind !== "collection").map((book) => [normalizedKey(book), book]));
    incoming.forEach((book) => { const key = normalizedKey(book); if (!map.has(key)) map.set(key, book); else { const prior = map.get(key); prior.source = prior.source.includes(book.source) ? prior.source : `${prior.source} + ${book.source}`; } });
    return [...map.values()];
  }

  function coverColors(book) {
    const category = categoryById[book.category] || currentCategory();
    if (book.color) return book.color;
    const palettes = [["#075d4c", "#0b8b70"], ["#183d75", "#416fc5"], ["#6c3c75", "#b65cab"], ["#8a5418", "#d0923b"], ["#7a2f32", "#c75b5f"]];
    return category?.color || palettes[stableHash(book.title) % palettes.length];
  }

  function bookCard(book, index) {
    const [colorA, colorB] = coverColors(book);
    const language = (book.language || []).slice(0, 2).map((code) => languageNames[code] || String(code).toUpperCase()).join(" • ") || "Lintas bahasa";
    const tags = (book.subjects || []).slice(0, 2).map((tag) => `<span>${escapeHtml(compact(tag, 34))}</span>`).join("");
    const fallback = `<div class="lit-cover-fallback-v35"><span>${escapeHtml(book.icon || (book.kind === "collection" ? categoryById[book.category]?.icon : "📕"))}</span><b>${escapeHtml(book.kind === "collection" ? "Koleksi tematik" : compact(book.source, 25))}</b></div>`;
    const cover = book.cover ? `<img src="${escapeHtml(book.cover)}" alt="Sampul ${escapeHtml(book.title)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">${fallback}` : fallback;
    if (book.kind === "collection") {
      return `<article class="lit-book-card-v35"><div class="lit-cover-v35" style="--cover-a:${colorA};--cover-b:${colorB}">${cover}<span class="lit-access-badge-v35">AKSES CEPAT</span><span class="lit-source-badge-v35">KATEGORI</span></div><div class="lit-book-body-v35"><h3>${escapeHtml(book.title)}</h3><div class="lit-book-author-v35">${escapeHtml(book.author)}</div><div class="lit-book-meta-v35">${tags}</div><p class="lit-book-description-v35">${escapeHtml(book.description)}</p><div class="lit-book-actions-v35"><button class="is-primary" type="button" data-open-collection="${book.category}">Jelajahi koleksi →</button></div></div></article>`;
    }
    const canDownload = Boolean(book.downloadUrl);
    return `<article class="lit-book-card-v35"><div class="lit-cover-v35" style="--cover-a:${colorA};--cover-b:${colorB}">${cover}<span class="lit-access-badge-v35">${escapeHtml(book.access || "Akses sumber")}</span><span class="lit-source-badge-v35">${escapeHtml(compact(book.source, 24))}</span></div><div class="lit-book-body-v35"><h3>${escapeHtml(book.title)}</h3><div class="lit-book-author-v35">${escapeHtml(book.author)}</div><div class="lit-book-meta-v35"><span>${escapeHtml(book.year || "—")}</span><span>${escapeHtml(language)}</span>${tags}</div><p class="lit-book-description-v35">${escapeHtml(compact(book.description || "Metadata buku dari katalog resmi.", 220))}</p><div class="lit-book-actions-v35"><button type="button" data-book-preview="${index}">Pratinjau</button><a href="${escapeHtml(book.readUrl || book.previewUrl || "#")}" target="_blank" rel="noopener" data-book-read="${index}">Baca</a><a class="is-primary" href="${escapeHtml(book.downloadUrl || book.previewUrl || book.readUrl || "#")}" target="_blank" rel="noopener" data-book-download="${index}" ${canDownload ? "" : "aria-label=\"Buka sumber resmi; unduhan bergantung pada penyedia\""}>${canDownload ? "Unduh / sumber resmi" : "Buka sumber resmi"}</a></div></div></article>`;
  }

  function renderBooks(message = "") {
    if (!currentBooks.length) {
      els.grid.innerHTML = `<div class="lit-empty-v35"><span>📚</span><h3>Belum ada hasil terbuka</h3><p>Coba kata kunci yang lebih luas, bahasa lain, atau buka salah satu sumber resmi.</p></div>`;
      els.resultCount.textContent = message || "Tidak ada hasil yang dapat ditampilkan.";
      return;
    }
    els.grid.innerHTML = currentBooks.map(bookCard).join("");
    els.resultCount.textContent = message || `${formatNumber(currentBooks.filter((book) => book.kind !== "collection").length)} judul unik ditampilkan.`;
  }

  function updateTotalRecords() {
    const total = Object.values(providerTotals).reduce((sum, value) => sum + Number(value || 0), 0);
    els.totalRecords.textContent = total ? formatNumber(total) : "—";
    return total;
  }

  function paramsForSearch() { return { query: els.query.value.trim(), category: els.category.value || "all", language: els.language.value || "", page: currentPage }; }

  async function runProvider(id, params, token) {
    const provider = providerConfig[id];
    providerStates[id] = { status: "loading", total: 0, note: "Menelusuri…" }; renderProviders();
    try {
      const payload = await provider.fn(params);
      if (token !== searchToken) return;
      providerStates[id] = { status: "ok", total: payload.total, cached: Boolean(payload.cached) };
      providerTotals[id] = payload.total;
      currentBooks = mergeBooks(currentBooks, payload.books || []);
      renderProviders();
      const total = updateTotalRecords();
      renderBooks(`${formatNumber(currentBooks.length)} judul unik ditampilkan • ${formatNumber(total)} rekaman penyedia sebelum deduplikasi.`);
    } catch (error) {
      if (token !== searchToken) return;
      providerStates[id] = { status: "fail", total: 0, note: navigator.onLine ? "Belum merespons" : "Perangkat luring" };
      renderProviders();
    }
  }

  async function runSearch({ reset = false, append = false } = {}) {
    if (reset) currentPage = 1;
    if (append) currentPage += 1;
    const token = ++searchToken;
    incrementStat("searches");
    providerTotals = { openLibrary: 0, internetArchive: 0 };
    providerStates = {};
    const category = currentCategory();
    els.resultTitle.textContent = category.id === "all" ? "Katalog lintas kategori" : `Koleksi ${category.label}`;
    if (!append) {
      currentBooks = makeCollectionCards(category.id);
      renderBooks("Koleksi cepat ditampilkan; katalog global sedang diperkaya secara progresif.");
    }
    els.networkMode.textContent = navigator.onLine ? "Sinkron cepat" : "Luring siap";
    setSync("working", "Katalog ringan sudah tampil", navigator.onLine ? "Menghubungkan sumber global tanpa memblokir halaman…" : "Jaringan tidak tersedia; koleksi cepat tetap dapat digunakan.");
    renderProviders();
    if (!navigator.onLine) { setSync("ready", "Mode luring aktif", "Hubungkan internet untuk hasil katalog global."); els.loadMore.hidden = true; return; }
    const params = paramsForSearch();
    await Promise.allSettled(Object.keys(providerConfig).map((id) => runProvider(id, params, token)));
    if (token !== searchToken) return;
    const connected = Object.values(providerStates).filter((state) => state.status === "ok").length;
    setSync("ready", connected ? "Katalog berhasil diperbarui" : "Koleksi cepat tetap tersedia", connected ? `${connected} sumber merespons; hasil telah dideduplikasi.` : "Sumber global belum merespons. Coba lagi beberapa saat.");
    hasMore = Object.values(providerTotals).some((total) => currentPage * PAGE_SIZE < total);
    els.loadMore.hidden = !hasMore;
  }

  function openPreview(book) {
    if (!book || book.kind === "collection") return;
    incrementStat("previews");
    const language = (book.language || []).map((code) => languageNames[code] || code).join(", ") || "Tidak tercantum";
    const cover = book.cover ? `<img src="${escapeHtml(book.cover)}" alt="Sampul ${escapeHtml(book.title)}" referrerpolicy="no-referrer" onerror="this.remove()">` : `<div class="lit-cover-fallback-v35"><span>${escapeHtml(book.icon || "📕")}</span><b>${escapeHtml(book.source)}</b></div>`;
    els.previewBody.innerHTML = `<div class="lit-preview-content-v35"><div class="lit-preview-cover-v35">${cover}</div><div class="lit-preview-copy-v35"><span class="lit-kicker-dark-v35">${escapeHtml(book.source)} • ${escapeHtml(book.access || "Akses sumber")}</span><h2 id="lit-preview-title">${escapeHtml(book.title)}</h2><p><strong>${escapeHtml(book.author)}</strong></p><p>${escapeHtml(compact(book.description || "Metadata buku dari katalog resmi.", 650))}</p><dl class="lit-preview-details-v35"><dt>Tahun</dt><dd>${escapeHtml(book.year || "—")}</dd><dt>Bahasa</dt><dd>${escapeHtml(language)}</dd><dt>Subjek</dt><dd>${escapeHtml((book.subjects || []).slice(0, 8).join(" • ") || "Tidak tercantum")}</dd><dt>Status</dt><dd>${escapeHtml(book.access || "Periksa pada sumber")}</dd></dl><div class="lit-preview-actions-v35"><a href="${escapeHtml(book.readUrl || book.previewUrl)}" target="_blank" rel="noopener" data-preview-read>Baca di sumber resmi</a><a class="is-secondary" href="${escapeHtml(book.downloadUrl || book.previewUrl || book.readUrl)}" target="_blank" rel="noopener" data-preview-download>${book.downloadUrl ? "Akses unduhan resmi" : "Buka halaman sumber"}</a></div></div></div>`;
    els.preview.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closePreview() { els.preview.hidden = true; els.previewBody.innerHTML = ""; document.body.style.overflow = ""; }

  els.chips.addEventListener("click", (event) => { const button = event.target.closest("[data-lit-category]"); if (button) setCategory(button.dataset.litCategory); });
  els.category.addEventListener("change", () => setCategory(els.category.value));
  els.form.addEventListener("submit", (event) => { event.preventDefault(); setCategory(els.category.value, false); runSearch({ reset: true }); });
  els.reset.addEventListener("click", () => { els.query.value = ""; els.language.value = ""; setCategory("all"); });
  els.loadMore.addEventListener("click", () => runSearch({ append: true }));
  els.grid.addEventListener("click", (event) => {
    const collection = event.target.closest("[data-open-collection]"); if (collection) { setCategory(collection.dataset.openCollection); return; }
    const preview = event.target.closest("[data-book-preview]"); if (preview) { openPreview(currentBooks[Number(preview.dataset.bookPreview)]); return; }
    if (event.target.closest("[data-book-read]")) incrementStat("reads");
    if (event.target.closest("[data-book-download]")) incrementStat("downloads");
  });
  els.preview.addEventListener("click", (event) => {
    if (event.target.closest("[data-preview-close]")) closePreview();
    if (event.target.closest("[data-preview-read]")) incrementStat("reads");
    if (event.target.closest("[data-preview-download]")) incrementStat("downloads");
  });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !els.preview.hidden) closePreview(); });
  document.querySelectorAll('a[href*="ipusnas"],a[href*="onesearch"]').forEach((link) => link.addEventListener("click", () => incrementStat("borrows")));
  window.addEventListener("online", () => { els.networkMode.textContent = "Sinkron cepat"; });
  window.addEventListener("offline", () => { els.networkMode.textContent = "Luring siap"; });

  renderCategoryControls();
  currentBooks = makeCollectionCards("all");
  renderBooks("Pilih kategori atau cari judul.");
  renderProviders();
  els.loadMore.hidden = true;
})();
