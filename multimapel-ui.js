(() => {
  "use strict";

  const db = window.SPENSUS_MULTIMAPEL;
  const content = window.SPENSUS_MULTIMAPEL_CONTENT || {};
  if (!db) return;

  const IDENTITY_KEY = "paibp-smart-student-identity-v1";
  const SUBMISSION_RECAP_KEY = "paibp-smart-submission-recap-v1";
  const WORK_PREFIX = "spensus-multimapel-v35-";
  const initialParams = new URLSearchParams(window.location.search);
  const state = {
    subject: initialParams.get("subject") || "all",
    grade: initialParams.get("grade") || "all",
    semester: initialParams.get("semester") || "all",
    query: initialParams.get("q") || "",
  };
  const requestedModule = initialParams.get("open") || "";
  const subjectById = Object.fromEntries(db.subjects.map((item) => [item.id, item]));

  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");

  const stripHtml = (value) => {
    const holder = document.createElement("div");
    holder.innerHTML = String(value || "");
    return String(holder.textContent || "").replace(/\s+/g, " ").trim();
  };

  const svg = {
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z"/></svg>',
    target: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v3M22 12h-3M12 22v-3M2 12h3"/></svg>',
    map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3V6Z"/><path d="M8 3v15M16 6v15"/></svg>',
    quiz: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.4 9a3 3 0 1 1 4.8 2.4c-1.3.9-2.2 1.5-2.2 3.1"/><path d="M12 18h.01"/><circle cx="12" cy="12" r="10"/></svg>',
    video: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3V9Z"/></svg>',
    worksheet: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>',
    send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/></svg>',
    source: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8M8 9h2"/></svg>',
  };

  function filteredModules() {
    const query = state.query.trim().toLocaleLowerCase("id");
    return db.modules.filter((item) => {
      if (state.subject !== "all" && item.subject !== state.subject) return false;
      if (state.grade !== "all" && item.grade !== state.grade) return false;
      if (state.semester !== "all" && item.semester !== state.semester) return false;
      if (query && !`${item.title} ${item.subjectName} ${item.grade} ${item.semester}`.toLocaleLowerCase("id").includes(query)) return false;
      return true;
    }).sort((a, b) => a.subjectName.localeCompare(b.subjectName, "id") || ["VII", "VIII", "IX"].indexOf(a.grade) - ["VII", "VIII", "IX"].indexOf(b.grade) || Number(a.number) - Number(b.number));
  }

  function subjectOptions() {
    return [`<option value="all">Semua mata pelajaran</option>`, ...db.subjects.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} (${item.moduleCount})</option>`)].join("");
  }

  function filtersHtml(prefix) {
    return `<div class="multi-filter-v35">
      <label><span>Mata pelajaran</span><select data-mm-subject="${prefix}">${subjectOptions()}</select></label>
      <label><span>Kelas</span><select data-mm-grade="${prefix}"><option value="all">Semua kelas</option><option value="VII">VII</option><option value="VIII">VIII</option><option value="IX">IX</option></select></label>
      <label><span>Semester</span><select data-mm-semester="${prefix}"><option value="all">Semua semester</option><option value="Gasal">Gasal</option><option value="Genap">Genap</option></select></label>
      <label class="multi-search-v35"><span>Cari bab atau topik</span><input data-mm-query="${prefix}" type="search" placeholder="Contoh: bilangan berpangkat, teks berita, sel…"></label>
    </div>`;
  }

  function subjectIcon(item) {
    const icons = {
      "pendidikan-pancasila": "⚖",
      "bahasa-indonesia": "✒",
      matematika: "∑",
      ipa: "⚗",
      ips: "🌏",
      "bahasa-inggris": "A",
      pjok: "🏃",
      informatika: "⌘",
      "bimbingan-konseling": "♡",
      prakarya: "✂",
      "seni-musik": "♫",
      "seni-tari": "✦",
      "koding-ai": "AI",
    };
    return icons[item.subject] || "◆";
  }

  function cardsHtml(items) {
    if (!items.length) return `<div class="multi-empty-v35"><strong>Materi belum ditemukan.</strong><p>Ubah kelas, semester, mata pelajaran, atau kata pencarian.</p></div>`;
    return items.map((item) => {
      const subject = subjectById[item.subject] || { code: "MAP", color: "#087f68" };
      const title = item.title.replace(/^Bab\s+\d+\s*:\s*/i, "").replace(/^Unit\s+\d+\s*:\s*/i, "");
      return `<article class="multi-module-card-v35" style="--subject:${escapeHtml(subject.color)}">
        <div class="multi-card-visual-v35"><span class="multi-card-icon-v35">${escapeHtml(subjectIcon(item))}</span><span class="multi-card-number-v35">${String(item.number).padStart(2, "0")}</span></div>
        <div class="multi-card-copy-v35"><span>${escapeHtml(item.subjectName)} • Kelas ${escapeHtml(item.grade)}</span><h3>${escapeHtml(title)}</h3><p>Semester ${escapeHtml(item.semester)} • materi, latihan, ringkasan, video, dan LKPD.</p></div>
        <div class="multi-card-actions-v35"><button type="button" data-mm-open="${escapeHtml(item.id)}">Buka paket belajar <b>→</b></button><a href="mapel-${escapeHtml(item.subject)}.html" aria-label="Buka ringkasan ${escapeHtml(item.subjectName)}">Ringkasan mapel</a></div>
      </article>`;
    }).join("");
  }

  function syncControls(root) {
    root.querySelectorAll("[data-mm-subject]").forEach((element) => { element.value = state.subject; });
    root.querySelectorAll("[data-mm-grade]").forEach((element) => { element.value = state.grade; });
    root.querySelectorAll("[data-mm-semester]").forEach((element) => { element.value = state.semester; });
    root.querySelectorAll("[data-mm-query]").forEach((element) => { element.value = state.query; });
  }

  function render(root) {
    const items = filteredModules();
    const grid = root.querySelector("[data-mm-grid]");
    const count = root.querySelector("[data-mm-count]");
    if (grid) grid.innerHTML = cardsHtml(items);
    if (count) count.textContent = `${items.length} paket ditampilkan dari ${db.moduleCount} paket belajar terverifikasi.`;
    syncControls(root);
  }

  function workKey(id) { return `${WORK_PREFIX}${id}`; }
  function loadIdentity() {
    try { return { name: "", attendance: "", className: "", ...JSON.parse(localStorage.getItem(IDENTITY_KEY) || "{}") }; }
    catch { return { name: "", attendance: "", className: "" }; }
  }
  function loadWork(id) {
    try { return JSON.parse(localStorage.getItem(workKey(id)) || "{}"); }
    catch { return {}; }
  }
  function collectFields(viewer) {
    const values = {};
    viewer.querySelectorAll("[data-mm-field]").forEach((field) => { values[field.dataset.mmField] = String(field.value || ""); });
    return values;
  }
  function restoreFields(viewer, id) {
    const work = loadWork(id);
    const identity = loadIdentity();
    viewer.querySelectorAll("[data-mm-field]").forEach((field) => {
      const key = field.dataset.mmField;
      field.value = work.fields?.[key] ?? identity[key] ?? "";
    });
  }
  function saveWork(viewer, id, message = true) {
    const fields = collectFields(viewer);
    localStorage.setItem(workKey(id), JSON.stringify({ fields, savedAt: new Date().toISOString() }));
    const identity = { name: fields.name || "", attendance: fields.attendance || "", className: fields.className || "" };
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
    if (message) setStatus(viewer, "Jawaban dan identitas tersimpan aman di perangkat ini.");
    return { fields, identity };
  }

  function setStatus(viewer, message, error = false) {
    viewer.querySelectorAll("[data-mm-status]").forEach((node) => {
      node.textContent = message;
      node.classList.toggle("is-error", error);
    });
  }

  function filenameSlug(value) {
    return String(value || "paket-belajar").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function meaningful(text) {
    const value = String(text || "").replace(/\s+/g, " ").trim();
    if (value.length < 45) return false;
    if (/^(?:Nama Sekolah|Nama Penyusun|Tahun|Alokasi|Fase|Kelas|Produk \(|Praktik \(|Tes Tertulis|Soal Pilihan Ganda|Essay|Asesmen)/i.test(value)) return false;
    if (/^[A-E]\.?\s+[A-Z\s]{5,}$/.test(value)) return false;
    return true;
  }

  function coreParagraphs(item) {
    const holder = document.createElement("div");
    holder.innerHTML = item.materialHtml || "";
    const list = [...holder.querySelectorAll("p, li")].map((node) => stripHtml(node.innerHTML)).filter(meaningful);
    return [...new Set(list)].slice(0, 18);
  }

  function cleanSummaryPoints(item) {
    const list = (item.summary || []).map(stripHtml).filter(meaningful);
    const objectives = (item.objectives || []).map(stripHtml).filter((value) => value.length > 35);
    return [...new Set([...list, ...objectives])].slice(0, 14);
  }

  function summaryNarrative(item) {
    const title = item.title.replace(/^Bab\s+\d+\s*:\s*/i, "").replace(/^Unit\s+\d+\s*:\s*/i, "");
    const points = cleanSummaryPoints(item);
    let text = `${title} merupakan bagian pembelajaran ${item.subjectName} kelas ${item.grade} yang menuntun murid memahami konsep, prosedur, dan penerapannya secara bertahap. `;
    text += points.join(" ");
    if (text.length < 500) {
      text += ` Pembelajaran tidak berhenti pada hafalan istilah. Murid perlu membaca sumber secara teliti, menghubungkan informasi dengan pengetahuan sebelumnya, mencoba prosedur yang sesuai, menjelaskan alasan, memeriksa kembali hasil, dan menerapkan pemahaman pada situasi nyata. Diskusi, latihan mandiri, kerja kelompok, serta refleksi digunakan untuk memperkuat ketelitian, komunikasi, kreativitas, kolaborasi, dan tanggung jawab. Pada akhir bab, murid diharapkan mampu menyampaikan kembali inti materi dengan bahasa sendiri dan menunjukkan bukti pemahaman melalui jawaban, produk, atau tindakan yang dapat dinilai.`;
    }
    return text.replace(/\s+/g, " ").trim();
  }

  function conceptChips(item) {
    const points = cleanSummaryPoints(item);
    const values = [];
    points.forEach((point) => {
      const cleaned = point.replace(/^[^:]{1,42}:\s*/, "").replace(/^(?:Memahami|Mampu|Murid dapat|Pertemuan \d+:)\s*/i, "");
      const fragments = cleaned.split(/[,;]|\s+serta\s+|\s+dan\s+/i).map((part) => part.trim()).filter((part) => part.length >= 5 && part.length <= 55);
      fragments.slice(0, 2).forEach((fragment) => { if (!values.some((value) => value.toLowerCase() === fragment.toLowerCase())) values.push(fragment); });
    });
    return values.slice(0, 8);
  }

  function directQuestions(item) {
    const objectives = (item.objectives || []).map((value) => stripHtml(value).replace(/^Pertemuan\s+\d+\s*:\s*/i, "")).filter((value) => value.length > 20);
    const summary = cleanSummaryPoints(item);
    const topic = item.title.replace(/^Bab\s+\d+\s*:\s*/i, "").replace(/^Unit\s+\d+\s*:\s*/i, "");
    const source = [...objectives, ...summary];
    return [
      `Jelaskan dengan bahasamu sendiri konsep utama “${topic}” dan mengapa konsep itu penting dipelajari.`,
      source[0] ? `Uraikan langkah atau gagasan yang terkandung dalam tujuan berikut: ${source[0]}` : `Tuliskan tiga gagasan penting yang kamu temukan pada bab ini.`,
      source[1] ? `Berikan contoh penerapan dalam kehidupan nyata yang sesuai dengan pernyataan berikut: ${source[1]}` : `Berikan satu contoh penerapan materi pada kehidupan sehari-hari.`,
      `Analisislah satu kesalahan atau miskonsepsi yang mungkin terjadi ketika mempelajari ${topic}, lalu jelaskan cara memperbaikinya.`,
      `Buat simpulan bab ini dalam lima sampai tujuh kalimat yang runtut, menggunakan sekurang-kurangnya tiga istilah penting dari materi.`,
    ];
  }

  function cleanWorksheetPrompts(item) {
    const list = (item.worksheet || []).map(stripHtml).filter((value) => {
      if (!meaningful(value)) return false;
      if (/^[a-e]\.|^[A-E]\.|KUNCI|rubrik|skor \d|tes tertulis|pilihan ganda/i.test(value)) return false;
      if (/^(?:nama(?:\s+lengkap|\s+murid)?|nomor\s+absen|kelas|tanggal|hari\/tanggal|sekolah|satuan\s+pendidikan|mata\s+pelajaran|tahun\s+(?:ajaran|pelajaran)|semester)\s*[:.]/i.test(value)) return false;
      return true;
    });
    const objectives = (item.objectives || []).map(stripHtml).filter(meaningful);
    return [...new Set([...list, ...objectives])].slice(0, 6);
  }

  function originalCoreHtml(item) {
    const paragraphs = coreParagraphs(item);
    const groups = [paragraphs.slice(0, 6), paragraphs.slice(6, 12), paragraphs.slice(12, 18)];
    const labels = ["Konsep dan istilah penting", "Prosedur, struktur, atau hubungan antarkonsep", "Penerapan dan konteks kehidupan nyata"];
    return groups.map((group, index) => group.length ? `<section class="multi-core-block-v35"><h4><span>${index + 1}</span>${labels[index]}</h4>${group.map((text, subIndex) => `<div class="multi-subpoint-v35"><b>${String.fromCharCode(97 + subIndex)}.</b><p>${escapeHtml(text)}</p></div>`).join("")}</section>` : "").join("");
  }

  function videoCards(item) {
    const topic = item.title.replace(/^Bab\s+\d+\s*:\s*/i, "").replace(/^Unit\s+\d+\s*:\s*/i, "");
    const searches = [
      { label: "Video pembelajaran resmi", source: "Kanal pendidikan Kemendikdasmen", query: `${item.subjectName} ${topic} kelas ${item.grade} Kemendikdasmen` },
      { label: "Penguatan dan contoh", source: "Rumah Belajar dan kanal pendidikan", query: `${topic} ${item.subjectName} SMP Rumah Belajar` },
    ];
    return searches.map((video, index) => `<article class="multi-video-card-v35"><div class="multi-video-visual-v35"><span>${svg.video}</span><b>0${index + 1}</b></div><div><span>${escapeHtml(video.source)}</span><h4>${escapeHtml(video.label)}</h4><p>${escapeHtml(topic)}</p><a href="https://www.youtube.com/results?search_query=${encodeURIComponent(video.query)}" target="_blank" rel="noopener">Buka pencarian video relevan ↗</a></div></article>`).join("");
  }

  function identityFields() {
    const identity = loadIdentity();
    return `<div class="multi-identity-v35"><label>Nama lengkap<input data-mm-field="name" autocomplete="name" maxlength="80" value="${escapeHtml(identity.name)}" required></label><label>Nomor absen<input data-mm-field="attendance" inputmode="numeric" maxlength="4" value="${escapeHtml(identity.attendance)}" required></label><label>Kelas<input data-mm-field="className" maxlength="20" placeholder="Contoh: VIII A" value="${escapeHtml(identity.className)}" required></label></div>`;
  }

  function materialHtml(item) {
    const questions = directQuestions(item);
    const narrative = summaryNarrative(item);
    const chips = conceptChips(item);
    const topic = item.title.replace(/^Bab\s+\d+\s*:\s*/i, "").replace(/^Unit\s+\d+\s*:\s*/i, "");
    return `<article class="multi-document-v35 multi-material-v35" data-mm-panel="material">
      <header class="multi-chapter-cover-v35"><div><span>${escapeHtml(item.subjectName)} • Kelas ${escapeHtml(item.grade)} • Semester ${escapeHtml(item.semester)}</span><b>${escapeHtml(item.title.split(":")[0])}</b><h2>${escapeHtml(topic)}</h2><p>Materi terstruktur • latihan langsung • pendalaman • video penguatan • ringkasan minimal 500 karakter</p></div><div class="multi-cover-symbol-v35">${escapeHtml(subjectIcon(item))}</div></header>
      <section class="multi-numbered-section-v35"><h3><span>A</span>Tujuan Pembelajaran</h3><ol class="multi-decimal-list-v35">${(item.objectives || []).map((objective) => `<li>${escapeHtml(stripHtml(objective))}</li>`).join("")}</ol></section>
      <section class="multi-numbered-section-v35"><h3><span>B</span>Peta Konsep</h3><div class="multi-concept-map-v35">${chips.map((chip, index) => `<span><b>${index + 1}</b>${escapeHtml(chip)}</span>`).join("")}</div></section>
      <section class="multi-numbered-section-v35"><h3><span>C</span>Uraian Materi Inti</h3>${originalCoreHtml(item)}</section>
      <section class="multi-numbered-section-v35 multi-direct-practice-v35"><h3><span>D</span>Latihan Pemahaman Langsung</h3><p class="multi-section-intro-v35">Jawablah setelah membaca uraian. Jawaban tersimpan otomatis dan dapat dikirim sebagai satu paket kepada guru.</p>${questions.map((question, index) => `<label class="multi-question-v35"><b>${index + 1}</b><span>${escapeHtml(question)}</span><textarea rows="4" data-mm-field="answer-${index}" placeholder="Tuliskan jawaban yang runtut dan berbukti…"></textarea></label>`).join("")}</section>
      <section class="multi-numbered-section-v35 multi-deep-task-v35"><h3><span>E</span>Latihan Mendalam</h3><div class="multi-deep-grid-v35"><article><b>Situasi</b><p>Pilih satu persoalan nyata di sekolah, keluarga, lingkungan, atau ruang digital yang dapat dianalisis menggunakan materi “${escapeHtml(topic)}”.</p></article><article><b>Tantangan</b><p>Susun bukti, alasan, langkah penyelesaian, dan ukuran keberhasilan. Hindari jawaban yang hanya berupa pendapat tanpa dasar.</p></article></div><label class="multi-block-field-v35">Analisis dan rancangan solusi<textarea rows="8" data-mm-field="deep-task" placeholder="Tuliskan masalah, data/bukti, analisis, alternatif solusi, pilihan tindakan, dan refleksi…"></textarea></label></section>
      <section class="multi-numbered-section-v35"><h3><span>F</span>Video Penguatan</h3><p class="multi-section-intro-v35">Tautan video diarahkan ke pencarian sumber pendidikan relevan. Video memerlukan internet dan tidak disalin ke repository agar website tetap ringan serta menghormati hak cipta.</p><div class="multi-video-grid-v35">${videoCards(item)}</div><label class="multi-block-field-v35">Ringkasan video pilihan — minimal 500 karakter<textarea rows="8" minlength="500" data-mm-field="video-summary" placeholder="Catat gagasan utama, bukti, hubungan dengan materi, dan hal yang masih perlu dipelajari…"></textarea><small data-mm-char-count="video-summary">0 karakter • minimal 500</small></label></section>
      <section class="multi-numbered-section-v35 multi-summary-panel-v35"><h3><span>G</span>Ringkasan Bab</h3><p>${escapeHtml(narrative)}</p><div class="multi-summary-count-v35">${narrative.length.toLocaleString("id-ID")} karakter</div></section>
      <section class="multi-numbered-section-v35 multi-submit-v35"><h3><span>H</span>Simpan dan Kirim kepada Guru</h3>${identityFields()}<div class="multi-submit-actions-v35 no-print"><button type="button" data-mm-save>💾 Simpan</button><button type="button" data-mm-docx>📄 Unduh DOCX</button><button class="is-primary" type="button" data-mm-send>${svg.send} Kirim kepada guru</button></div><p data-mm-status class="multi-status-v35" aria-live="polite"></p></section><footer class="document-promo-v37"><b>PAIBP SMART SMP</b><span>Belajar • Paham • Berakhlak</span><small>https://paibpsmart.github.io/</small></footer>
    </article>`;
  }

  function summaryHtml(item) {
    const narrative = summaryNarrative(item);
    const points = cleanSummaryPoints(item);
    return `<article class="multi-document-v35 multi-summary-v35" data-mm-panel="summary" hidden><header><span>RINGKASAN PROFESIONAL</span><h2>${escapeHtml(item.title)}</h2><p>${narrative.length.toLocaleString("id-ID")} karakter • dapat dipelajari mandiri</p></header><section class="multi-summary-lead-v35"><p>${escapeHtml(narrative)}</p></section><section class="multi-summary-points-v35"><h3>Pokok Materi</h3><ol>${points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ol></section><section class="multi-summary-recall-v35"><h3>Cek Ingatan Cepat</h3><div>${directQuestions(item).slice(0, 3).map((question, index) => `<label><b>${index + 1}</b><span>${escapeHtml(question)}</span><textarea rows="3" data-mm-field="summary-${index}"></textarea></label>`).join("")}</div></section><footer class="document-promo-v37"><b>PAIBP SMART SMP</b><span>Belajar • Paham • Berakhlak</span><small>https://paibpsmart.github.io/</small></footer></article>`;
  }

  function worksheetHtml(item) {
    const prompts = cleanWorksheetPrompts(item);
    const topic = item.title.replace(/^Bab\s+\d+\s*:\s*/i, "").replace(/^Unit\s+\d+\s*:\s*/i, "");
    const tasks = [
      prompts[0] || `Tuliskan pengetahuan awalmu tentang ${topic}.`,
      prompts[1] || `Identifikasi informasi, data, konsep, atau unsur penting dari materi.`,
      prompts[2] || `Analisis hubungan antargagasan dan jelaskan alasanmu.`,
      prompts[3] || `Buat produk, model, teks, demonstrasi, atau solusi sesuai karakter mata pelajaran.`,
      prompts[4] || `Periksa hasil menggunakan kriteria yang jelas, lalu lakukan perbaikan.`,
      prompts[5] || `Tuliskan refleksi: hal yang dipahami, kesulitan, dan rencana tindak lanjut.`,
    ];
    return `<article class="multi-document-v35 multi-lkpd-v35" data-mm-panel="worksheet" hidden><header class="multi-lkpd-cover-v35"><span>LEMBAR KERJA MURID</span><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.subjectName)} • Kelas ${escapeHtml(item.grade)} • Semester ${escapeHtml(item.semester)}</p></header>${identityFields()}<section class="multi-lkpd-instruction-v35"><h3>A. Petunjuk Kerja</h3><ol><li>Baca materi dan sumber secara teliti.</li><li>Gunakan data atau alasan yang dapat diperiksa.</li><li>Kerjakan dengan jujur; diskusi boleh dilakukan sesuai arahan guru.</li><li>Periksa kembali bahasa, perhitungan, sumber, dan kelengkapan jawaban.</li></ol></section><section class="multi-lkpd-activities-v35"><h3>B. Aktivitas Inti</h3>${tasks.map((task, index) => `<label class="multi-lkpd-task-v35"><span>${index + 1}</span><div><p>${escapeHtml(task)}</p><textarea rows="5" data-mm-field="lkpd-${index}" placeholder="Tuliskan hasil kerja secara lengkap…"></textarea></div></label>`).join("")}</section><section class="multi-lkpd-product-v35"><h3>C. Produk dan Presentasi</h3><label class="multi-block-field-v35">Deskripsi produk atau hasil akhir<textarea rows="7" data-mm-field="lkpd-product" placeholder="Jelaskan bentuk produk, proses pembuatan, sumber, pembagian peran, dan hasil…"></textarea></label></section><section class="multi-lkpd-rubric-v35"><h3>D. Rubrik Pemeriksaan Mandiri</h3><table><thead><tr><th>Aspek</th><th>4 — Sangat Baik</th><th>3 — Baik</th><th>2 — Berkembang</th><th>1 — Perlu Bimbingan</th></tr></thead><tbody><tr><th>Ketepatan konsep</th><td>Tepat, lengkap, dan berbukti</td><td>Tepat, ada bagian kecil kurang</td><td>Sebagian tepat</td><td>Belum menunjukkan konsep</td></tr><tr><th>Proses dan penalaran</th><td>Langkah runtut dan alasan kuat</td><td>Langkah cukup runtut</td><td>Langkah belum konsisten</td><td>Proses tidak dijelaskan</td></tr><tr><th>Komunikasi/produk</th><td>Jelas, menarik, dan sesuai tujuan</td><td>Jelas dan sesuai tujuan</td><td>Masih perlu perbaikan</td><td>Belum selesai</td></tr><tr><th>Refleksi</th><td>Jujur, spesifik, dan ada tindak lanjut</td><td>Ada refleksi dan tindak lanjut</td><td>Refleksi masih umum</td><td>Belum ada refleksi</td></tr></tbody></table></section><section class="multi-submit-v35"><div class="multi-submit-actions-v35 no-print"><button type="button" data-mm-save>💾 Simpan LKPD</button><button type="button" data-mm-print>🖨 Cetak / PDF</button><button class="is-primary" type="button" data-mm-send>${svg.send} Kirim kepada guru</button></div><p data-mm-status class="multi-status-v35" aria-live="polite"></p></section><footer class="document-promo-v37"><b>PAIBP SMART SMP</b><span>Belajar • Paham • Berakhlak</span><small>https://paibpsmart.github.io/</small></footer></article>`;
  }

  function sourceHtml(item) {
    return `<article class="multi-document-v35 multi-source-v35" data-mm-panel="source" hidden><header><span>${svg.source}</span><div><b>RUJUKAN DAN INTEGRITAS KONTEN</b><h2>${escapeHtml(item.title)}</h2></div></header><section><h3>A. Dokumen Dasar</h3><dl><dt>Perangkat sumber</dt><dd>${escapeHtml(item.sourceName || "Dokumen perangkat pembelajaran terverifikasi")}</dd><dt>Lokasi audit</dt><dd>${escapeHtml(item.sourceOriginal || "Arsip pengembangan multimapel")}</dd><dt>Normalisasi</dt><dd>${escapeHtml(item.note || "Konten disusun ulang untuk kebutuhan murid tanpa identitas guru.")}</dd></dl></section><section><h3>B. Rujukan Resmi</h3><div class="multi-official-links-v35"><a href="https://buku.kemendikdasmen.go.id/katalog/" target="_blank" rel="noopener"><b>SIBI Kemendikdasmen</b><span>Buku teks, buku audio, dan buku interaktif resmi ↗</span></a><a href="https://kurikulum.kemendikdasmen.go.id/panduan-mapel" target="_blank" rel="noopener"><b>Panduan Mata Pelajaran</b><span>Acuan penerapan CP dan pembelajaran mendalam ↗</span></a><a href="https://guru.kemendikdasmen.go.id/kurikulum/referensi-penerapan/capaian-pembelajaran/" target="_blank" rel="noopener"><b>Capaian Pembelajaran</b><span>Referensi CP resmi yang berlaku ↗</span></a></div></section><section class="multi-source-note-v35"><strong>Catatan akademik</strong><p>Materi web mempertahankan pokok isi dokumen sumber. Guru tetap perlu mencocokkan urutan bab, keluasan materi, dan edisi buku dengan buku resmi yang digunakan sekolah.</p></section><footer class="document-promo-v37"><b>PAIBP SMART SMP</b><span>Belajar • Paham • Berakhlak</span><small>https://paibpsmart.github.io/</small></footer></article>`;
  }

  function downloadModuleDocx(viewer, item) {
    const status = viewer.querySelector("[data-mm-status]");
    try {
      if (!window.PAIBP_DOCX) throw new Error("Mesin DOCX belum siap");
      const printable = viewer.querySelector("[data-mm-printable]");
      const blob = window.PAIBP_DOCX.createDocument({
        title: `${item.subjectName} Kelas ${item.grade} — ${item.title}`,
        blocks: window.PAIBP_DOCX.blocksFromElement(printable),
      });
      downloadBlob(blob, `${filenameSlug(item.subjectName)}-${item.grade.toLowerCase()}-${filenameSlug(item.title)}.docx`);
      if (status) status.textContent = "DOCX berhasil dibuat dari isi portal yang sedang tampil.";
      return blob;
    } catch (error) {
      if (status) status.textContent = `DOCX belum dapat dibuat: ${error.message}`;
      return null;
    }
  }

  function submissionPayload(viewer, item) {
    const saved = saveWork(viewer, item.id, false);
    const fields = saved.fields;
    const questions = directQuestions(item);
    const reflections = [
      { prompt: "Hal baru yang saya pahami", answer: fields["summary-0"] || fields["lkpd-5"] || "" },
      { prompt: "Bagian yang masih perlu saya pelajari", answer: fields["summary-1"] || "" },
      { prompt: "Tindakan atau perbaikan berikutnya", answer: fields["summary-2"] || "" },
    ];
    return {
      schema: "paibp-smart-submission",
      version: 1,
      submissionId: typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      chapter: { id: item.id, title: item.title, grade: item.grade, semester: item.semester, subject: item.subjectName },
      student: { name: fields.name || "", attendance: fields.attendance || "", className: fields.className || "" },
      work: {
        questions: questions.map((question, index) => ({ question, answer: fields[`answer-${index}`] || "" })),
        project: { prompt: `Latihan mendalam ${item.title}`, answer: fields["deep-task"] || fields["lkpd-product"] || "" },
        reflections,
        videoSummaries: [{ title: `Video penguatan ${item.title}`, channel: "Sumber pendidikan pilihan murid", summary: fields["video-summary"] || "" }],
        lkpd: Object.fromEntries(Object.entries(fields).filter(([key]) => key.startsWith("lkpd-"))),
      },
    };
  }

  async function sendToTeacher(viewer, item) {
    const payload = submissionPayload(viewer, item);
    if (!payload.student.name || !payload.student.attendance || !payload.student.className) {
      setStatus(viewer, "Lengkapi nama, nomor absen, dan kelas sebelum mengirim.", true);
      viewer.querySelector('[data-mm-field="name"]')?.focus();
      return;
    }
    const unanswered = payload.work.questions.filter((entry) => !entry.answer.trim()).length;
    if (unanswered) {
      setStatus(viewer, `Masih ada ${unanswered} jawaban latihan yang belum diisi.`, true);
      return;
    }
    let recap = [];
    try { recap = JSON.parse(localStorage.getItem(SUBMISSION_RECAP_KEY) || "[]"); } catch { recap = []; }
    if (!Array.isArray(recap)) recap = [];
    recap.unshift(payload);
    localStorage.setItem(SUBMISSION_RECAP_KEY, JSON.stringify(recap.slice(0, 500)));

    const blob = downloadModuleDocx(viewer, item);
    const config = window.PAIBP_CONFIG || {};
    if (config.realtimeEndpoint) {
      try {
        await fetch(config.realtimeEndpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "send_assignment", type: "submission", submissionData: payload }) });
      } catch (_) {}
    }
    if (blob && navigator.share && navigator.canShare) {
      const file = new File([blob], `Tugas-${filenameSlug(item.subjectName)}-${filenameSlug(item.title)}.docx`, { type: blob.type });
      if (navigator.canShare({ files: [file] })) {
        try { await navigator.share({ title: `Tugas ${item.subjectName}`, text: `${payload.student.name} • ${payload.student.className} • ${item.title}`, files: [file] }); setStatus(viewer, "Menu berbagi dibuka. Pilih guru atau kanal resmi yang benar."); return; }
        catch (error) { if (error?.name === "AbortError") { setStatus(viewer, "Pengiriman dibatalkan; jawaban tetap tersimpan."); return; } }
      }
    }
    setStatus(viewer, "Tugas masuk ke rekap lokal guru dan DOCX telah disiapkan sebagai cadangan pengiriman.");
  }

  function updateCounters(viewer) {
    viewer.querySelectorAll("[data-mm-char-count]").forEach((node) => {
      const field = viewer.querySelector(`[data-mm-field="${node.dataset.mmCharCount}"]`);
      const count = String(field?.value || "").trim().length;
      node.textContent = `${count.toLocaleString("id-ID")} karakter • minimal 500`;
      node.classList.toggle("is-ready", count >= 500);
    });
  }

  function openModule(root, id) {
    const meta = db.modules.find((item) => item.id === id);
    const item = content[id];
    if (!meta || !item) return;
    const viewer = root.querySelector("[data-mm-viewer]");
    const library = root.querySelector("[data-mm-library]");
    if (!viewer || !library) return;
    viewer.hidden = false;
    viewer.dataset.mmActive = id;
    library.hidden = true;
    viewer.innerHTML = `<div class="multi-viewer-head-v35" style="--subject:${escapeHtml(subjectById[item.subject]?.color || "#087f68")}"><button type="button" data-mm-back>← Kembali</button><div><span>${escapeHtml(item.subjectName)} • Kelas ${escapeHtml(item.grade)} • Semester ${escapeHtml(item.semester)}</span><h1>${escapeHtml(item.title)}</h1></div><div class="multi-viewer-actions-v35"><button type="button" data-mm-docx>DOCX</button><button type="button" data-mm-print>PDF / Cetak</button></div></div><nav class="multi-tabs-v35" aria-label="Bagian paket belajar"><button type="button" aria-pressed="true" data-mm-tab="material">${svg.book} Materi Lengkap</button><button type="button" aria-pressed="false" data-mm-tab="summary">${svg.map} Ringkasan</button><button type="button" aria-pressed="false" data-mm-tab="worksheet">${svg.worksheet} LKPD</button><button type="button" aria-pressed="false" data-mm-tab="source">${svg.source} Rujukan</button></nav><div data-mm-printable>${materialHtml(item)}${summaryHtml(item)}${worksheetHtml(item)}${sourceHtml(item)}</div>`;
    restoreFields(viewer, id);
    updateCounters(viewer);
    viewer.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function bind(root) {
    root.addEventListener("change", (event) => {
      const target = event.target;
      if (target.matches("[data-mm-subject]")) state.subject = target.value;
      else if (target.matches("[data-mm-grade]")) state.grade = target.value;
      else if (target.matches("[data-mm-semester]")) state.semester = target.value;
      else return;
      document.querySelectorAll("[data-multimapel-root]").forEach(render);
    });
    root.addEventListener("input", (event) => {
      if (event.target.matches("[data-mm-query]")) {
        state.query = event.target.value;
        document.querySelectorAll("[data-multimapel-root]").forEach(render);
        return;
      }
      const viewer = event.target.closest("[data-mm-viewer]");
      if (viewer && event.target.matches("[data-mm-field]")) {
        const id = viewer.dataset.mmActive;
        window.clearTimeout(viewer._mmSaveTimer);
        viewer._mmSaveTimer = window.setTimeout(() => saveWork(viewer, id, false), 450);
        updateCounters(viewer);
      }
    });
    root.addEventListener("click", async (event) => {
      const open = event.target.closest("[data-mm-open]");
      if (open) { openModule(root, open.dataset.mmOpen); return; }
      if (event.target.closest("[data-mm-back]")) {
        const viewer = root.querySelector("[data-mm-viewer]");
        const library = root.querySelector("[data-mm-library]");
        if (viewer) { viewer.hidden = true; viewer.innerHTML = ""; }
        if (library) library.hidden = false;
        library?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const tab = event.target.closest("[data-mm-tab]");
      if (tab) {
        const viewer = root.querySelector("[data-mm-viewer]");
        viewer.querySelectorAll("[data-mm-tab]").forEach((button) => button.setAttribute("aria-pressed", String(button === tab)));
        viewer.querySelectorAll("[data-mm-panel]").forEach((panel) => { panel.hidden = panel.dataset.mmPanel !== tab.dataset.mmTab; });
        return;
      }
      const viewer = event.target.closest("[data-mm-viewer]") || root.querySelector("[data-mm-viewer]");
      const id = viewer?.dataset.mmActive;
      const item = content[id];
      if (!viewer || !item) return;
      if (event.target.closest("[data-mm-print]")) { saveWork(viewer, id, false); window.print(); return; }
      if (event.target.closest("[data-mm-docx]")) { saveWork(viewer, id, false); downloadModuleDocx(viewer, item); return; }
      if (event.target.closest("[data-mm-save]")) { saveWork(viewer, id, true); return; }
      if (event.target.closest("[data-mm-send]")) { await sendToTeacher(viewer, item); }
    });
  }

  function initRoot(root) {
    const prefix = root.id || `mm-${Math.random().toString(36).slice(2)}`;
    root.innerHTML = `<div data-mm-library><section class="multi-library-head-v35"><div><span>PORTAL MULTIMAPEL SMP</span><h2>Setiap bab diperlakukan setara dengan PAIBP.</h2><p>Materi terstruktur, latihan langsung, latihan mendalam, video penguatan, ringkasan minimal 500 karakter, LKPD profesional, dan pengiriman tugas kepada guru.</p><div class="multi-head-badges-v35"><b>13 mapel</b><b>${db.moduleCount} paket</b><b>Kelas VII–IX</b><b>Ringan & responsif</b></div></div><strong>${db.moduleCount}<small>paket belajar</small></strong></section>${filtersHtml(prefix)}<p class="multi-count-v35" data-mm-count></p><div class="multi-grid-v35" data-mm-grid></div></div><section data-mm-viewer hidden></section>`;
    bind(root);
    render(root);
    if (requestedModule && db.modules.some((item) => item.id === requestedModule)) {
      window.setTimeout(() => openModule(root, requestedModule), 0);
    }
  }

  document.querySelectorAll("[data-multimapel-root]").forEach(initRoot);

  const paibpLibrary = document.querySelector("#student-library");
  const lessonViewer = document.querySelector("#lesson-viewer");
  const multimapelLibrary = document.querySelector("#student-multimapel-library");
  document.querySelectorAll("[data-student-library-tab]").forEach((button) => button.addEventListener("click", () => {
    const mode = button.dataset.studentLibraryTab;
    document.querySelectorAll("[data-student-library-tab]").forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === button)));
    if (paibpLibrary) paibpLibrary.hidden = mode !== "paibp";
    if (lessonViewer) lessonViewer.hidden = true;
    if (multimapelLibrary) multimapelLibrary.hidden = mode !== "multimapel";
  }));
})();
