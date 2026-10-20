// Ranking 1 HSN: aplikasi latihan lomba dengan timer dan skor seperti aturan lomba.
(() => {
  "use strict";

  const app = document.getElementById("app");
  const PER_TAHAP = 10;

  const STAGES = {
    ipa: { nama: "Tahap 1 · IPA", sub: "Ilmu Pilihan Akurat", waktu: 10, tipe: "mc", info: "Pilihan ganda tentang pengetahuan BPS, konsep lapangan, dan etika petugas." },
    ips: { nama: "Tahap 2 · IPS", sub: "Ilmu Peta Statistik", waktu: 10, tipe: "mc", info: "Pilihan ganda tentang provinsi, wilayah, data Kalsel, dan membaca grafik." },
    mtk: { nama: "Tahap 3 · Matematika", sub: "Mari Tebak Cermat Pertanyaan Terbuka", waktu: 15, tipe: "num", info: "Isian angka. Jawaban benar bernilai 10." },
    kbli: { nama: "Tahap 4 · Ekonomi", sub: "Eksplorasi Kode Lapangan Usaha Indonesia", waktu: 45, tipe: "kbli", info: "Tebak kode KBLI. Nilai: 5 digit 10, 4 digit 8, 3 digit 6, 2 digit 4, 1 digit 2. Boleh buka SIBAKU." },
  };
  const KBLI_POIN = { 5: 10, 4: 8, 3: 6, 2: 4, 1: 2, 0: 0 };

  let kbliData = null;
  let S = null;        // sesi aktif
  let timerId = null;
  let keyHandler = null;

  // ---------- util ----------
  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmtNum = (n) => Number(n).toLocaleString("id-ID", { maximumFractionDigits: 2 });
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem("r1hsn:" + k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem("r1hsn:" + k, JSON.stringify(v)); } catch { /* abaikan */ } },
  };

  function parseNum(raw) {
    let s = String(raw).trim().replace(/\s|rp|%|°/gi, "");
    if (!s) return NaN;
    if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
    return Number(s);
  }

  function setTheme(t) {
    if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  }
  setTheme(store.get("theme"));
  document.getElementById("themeBtn").onclick = () => {
    const dark = matchMedia("(prefers-color-scheme: dark)").matches;
    const cur = document.documentElement.dataset.theme || (dark ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    setTheme(next); store.set("theme", next);
  };
  document.getElementById("homeBtn").onclick = () => { if (!S || confirm("Keluar dari latihan ini?")) home(); };

  function stopTimer() { clearInterval(timerId); timerId = null; }
  function setKeys(fn) { if (keyHandler) document.removeEventListener("keydown", keyHandler); keyHandler = fn; if (fn) document.addEventListener("keydown", fn); }

  // ---------- pembuatan soal ----------
  function buildQuestions(stage, n, sumber) {
    if (stage === "ipa" || stage === "ips") {
      const bank = stage === "ipa" ? SOAL_IPA : SOAL_IPS;
      return shuffle(bank).slice(0, n).map((s) => {
        const order = shuffle(s.o.map((t, i) => i));
        return { ...s, opsi: order.map((i) => s.o[i]), benar: order.indexOf(s.a) };
      });
    }
    if (stage === "mtk") {
      const fixed = shuffle(SOAL_MTK);
      const out = [];
      for (let i = 0; i < n; i++) {
        out.push(i % 2 === 0 && fixed.length ? fixed.pop() : (GEN_MTK[Math.floor(Math.random() * GEN_MTK.length)])());
      }
      return out;
    }
    if (stage === "kbli") {
      if (sumber === "acak" && kbliData) {
        const ok = kbliData.filter(([, t]) => !/( yang| dan| di| untuk| atau| dari| selain|,| -)$/i.test(t) && t.length > 8);
        return shuffle(ok).slice(0, n).map(([kode, t]) => ({ q: `Kode KBLI untuk kegiatan: "${t}"`, kode }));
      }
      return shuffle(SOAL_KBLI).slice(0, n);
    }
    return [];
  }

  // ---------- beranda ----------
  function home() {
    stopTimer(); setKeys(null); S = null;
    const best = (k) => { const b = store.get("best:" + k); return b == null ? "" : `<div class="best">Skor terbaik: ${esc(b)}</div>`; };
    app.innerHTML = `
      <section class="hero">
        <h1>Latihan Lomba<br>Hari Statistik Nasional</h1>
        <p>Empat tahap lomba dengan timer yang sama seperti aslinya: IPA 10 detik, IPS 10 detik, Matematika 15 detik, dan KBLI 45 detik.</p>
      </section>
      <div class="grid">
        <button class="mode big" data-mode="sim">
          <span class="tag">SIMULASI LENGKAP</span>
          <h3>Tahap 1 → 4 berurutan</h3>
          <p>10 soal per tahap. Nilai akhir = Tahap 3 + Tahap 4, seperti aturan lomba.</p>
          ${best("sim")}
        </button>
        ${Object.entries(STAGES).map(([k, s]) => `
          <button class="mode" data-mode="${k}">
            <span class="tag">${s.waktu} DETIK/SOAL</span>
            <h3>${s.nama}</h3>
            <p>${s.sub}</p>
            ${best(k)}
          </button>`).join("")}
        <button class="mode" data-mode="kbliacak">
          <span class="tag">1.559 KODE</span>
          <h3>KBLI Acak</h3>
          <p>Soal diambil acak dari seluruh daftar kode KBLI. Bagus untuk melatih kecepatan mencari di SIBAKU.</p>
          ${best("kbliacak")}
        </button>
      </div>
      <div class="opts card" style="margin-top:16px">
        <label>Jumlah soal latihan per tahap
          <select id="nSoal"><option value="10">10</option><option value="20">20</option><option value="30">30</option></select>
        </label>
        <label><input type="checkbox" id="fb" checked> Tampilkan pembahasan setiap soal</label>
        <label><input type="checkbox" id="noTimer"> Tanpa timer (mode belajar)</label>
      </div>
      <p class="hint">Simulasi lengkap selalu memakai 10 soal per tahap. Pembahasan baru muncul di akhir, kecuali kamu mencentang opsi di atas.</p>
    `;
    const prefs = store.get("prefs") || {};
    if (prefs.n) app.querySelector("#nSoal").value = prefs.n;
    if (prefs.fb === false) app.querySelector("#fb").checked = false;
    if (prefs.noTimer) app.querySelector("#noTimer").checked = true;
    app.querySelectorAll(".mode").forEach((b) => b.onclick = () => {
      const n = +app.querySelector("#nSoal").value, fb = app.querySelector("#fb").checked, noTimer = app.querySelector("#noTimer").checked;
      store.set("prefs", { n, fb, noTimer });
      start(b.dataset.mode, n, fb, noTimer);
    });
  }

  // ---------- sesi ----------
  async function start(mode, n, fb, noTimer) {
    let stages, sumber = null;
    if (mode === "sim") { stages = ["ipa", "ips", "mtk", "kbli"]; n = PER_TAHAP; }
    else if (mode === "kbliacak") {
      stages = ["kbli"]; sumber = "acak";
      if (!kbliData) {
        app.innerHTML = `<div class="card transition"><p>Memuat data KBLI…</p></div>`;
        try { kbliData = await (await fetch("data/kbli.json")).json(); }
        catch { app.innerHTML = `<div class="card transition"><h2>Gagal memuat data</h2><p>Coba muat ulang halaman.</p></div>`; return; }
      }
    } else stages = [mode];
    S = { mode, n, fb, noTimer, stages, sumber, si: 0, results: {} };
    stageIntro();
  }

  function stageIntro() {
    stopTimer();
    const key = S.stages[S.si], st = STAGES[key];
    S.qs = buildQuestions(key, S.n, S.sumber);
    S.qi = 0;
    S.results[key] = [];
    app.innerHTML = `
      <div class="card transition">
        <div class="count">${S.stages.length > 1 ? `Tahap ${S.si + 1} dari ${S.stages.length}` : "Latihan"}</div>
        <h2>${st.nama}</h2>
        <p><b>${st.sub}</b><br>${st.info}</p>
        <p>${S.qs.length} soal · ${S.noTimer ? "tanpa timer" : st.waktu + " detik per soal"}</p>
        <button class="btn" id="go">Mulai ▸</button>
        <p class="hint">Tekan Enter untuk mulai</p>
      </div>`;
    app.querySelector("#go").onclick = showQuestion;
    setKeys((e) => { if (e.key === "Enter") { e.preventDefault(); showQuestion(); } });
  }

  function chartHTML(d) {
    const max = Math.max(...d.rows.map((r) => r[1]));
    return `<div class="chart"><div class="ct">${esc(d.title)}</div>${d.rows.map(([l, v]) =>
      `<div class="bar"><span>${esc(l)}</span><div class="track"><div class="fill" style="width:${(v / max * 100).toFixed(1)}%"></div></div><span class="v">${fmtNum(v)}</span></div>`).join("")}</div>`;
  }

  function showQuestion() {
    stopTimer();
    const key = S.stages[S.si], st = STAGES[key], q = S.qs[S.qi];
    S.answered = false;
    let body = "";
    if (st.tipe === "mc") {
      body = `${q.data ? chartHTML(q.data) : ""}<div class="choices">${q.opsi.map((o, i) =>
        `<button class="choice" data-i="${i}"><span class="key">${"ABCD"[i]}</span><span>${esc(o)}</span></button>`).join("")}</div>
        <p class="hint">Tekan A–D atau 1–4 untuk menjawab</p>`;
    } else {
      const isK = st.tipe === "kbli";
      body = `<div class="answer-row">
          <input type="text" id="ans" autocomplete="off" inputmode="${isK ? "numeric" : "decimal"}" ${isK ? 'maxlength="5" placeholder="contoh: 56102"' : 'placeholder="jawaban angka"'}>
          <button class="btn" id="submit">Jawab</button>
        </div>
        <p class="hint">${isK ? "Boleh menjawab kurang dari 5 digit. Nilai dihitung dari digit awal yang benar." : "Gunakan koma untuk desimal (contoh: 8,5). Jangan pakai titik ribuan atau satuan."}</p>`;
    }
    app.innerHTML = `
      <div class="card">
        <div class="qhead">
          <div class="stage">${st.nama} <small>· ${st.sub}</small></div>
          <div class="count">Soal ${S.qi + 1}/${S.qs.length}</div>
        </div>
        ${S.noTimer ? "" : `<div class="timer" id="tbar"><div></div></div><div class="tleft" id="tleft">${st.waktu}</div>`}
        <div class="question">${esc(q.q)}</div>
        ${body}
        <div id="fbBox"></div>
      </div>`;

    if (st.tipe === "mc") {
      app.querySelectorAll(".choice").forEach((b) => b.onclick = () => answer(+b.dataset.i));
      setKeys((e) => {
        if (S.answered) { if (e.key === "Enter") { e.preventDefault(); next(); } return; }
        const k = e.key.toLowerCase(), m = { a: 0, b: 1, c: 2, d: 3, 1: 0, 2: 1, 3: 2, 4: 3 }[k];
        if (m !== undefined && m < q.opsi.length) answer(m);
      });
    } else {
      const inp = app.querySelector("#ans");
      inp.focus();
      app.querySelector("#submit").onclick = () => answer(inp.value);
      setKeys((e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        if (S.answered) next(); else answer(inp.value);
      });
    }

    if (!S.noTimer) {
      const total = st.waktu * 1000, end = performance.now() + total;
      const bar = app.querySelector("#tbar"), fill = bar.firstElementChild, tl = app.querySelector("#tleft");
      timerId = setInterval(() => {
        const left = Math.max(0, end - performance.now());
        fill.style.width = (left / total * 100) + "%";
        tl.textContent = Math.ceil(left / 1000);
        const low = left <= 3000;
        bar.classList.toggle("low", low); tl.classList.toggle("low", low);
        if (left <= 0) {
          stopTimer();
          if (st.tipe === "mc") answer(null, true);
          else answer(app.querySelector("#ans").value, true);
        }
      }, 100);
    }
  }

  function grade(st, q, val) {
    if (st.tipe === "mc") {
      const ok = val === q.benar;
      return { ok, poin: ok ? 1 : 0, jawab: val == null ? "(tidak menjawab)" : q.opsi[val], kunci: q.opsi[q.benar] };
    }
    if (st.tipe === "num") {
      const v = parseNum(val), tol = q.tol ?? 0.001;
      const ok = !isNaN(v) && Math.abs(v - q.ans) <= tol + 1e-9;
      return { ok, poin: ok ? 10 : 0, jawab: String(val).trim() || "(kosong)", kunci: fmtNum(q.ans) };
    }
    // KBLI: hitung digit awal yang cocok dengan kode mana pun yang diterima
    const ans = String(val).replace(/\D/g, "").slice(0, 5);
    const codes = [q.kode, ...(q.alt || [])];
    let best = 0;
    for (const c of codes) {
      let m = 0;
      while (m < ans.length && ans[m] === c[m]) m++;
      best = Math.max(best, m);
    }
    const poin = KBLI_POIN[best];
    return { ok: best === 5, poin, digit: best, jawab: ans || "(kosong)", kunci: q.kode + (q.alt ? ` (KBLI 2020: ${q.alt.join("/")})` : "") };
  }

  function answer(val, timeout = false) {
    if (S.answered) return;
    S.answered = true;
    stopTimer();
    const key = S.stages[S.si], st = STAGES[key], q = S.qs[S.qi];
    const g = grade(st, q, val);
    S.results[key].push({ q, ...g, timeout });

    if (st.tipe === "mc") {
      app.querySelectorAll(".choice").forEach((b) => {
        const i = +b.dataset.i;
        b.disabled = true;
        if (i === q.benar) b.classList.add("ok");
        else if (i === val) b.classList.add("bad");
      });
    } else {
      app.querySelector("#ans").disabled = true;
      app.querySelector("#submit").disabled = true;
    }

    if (!S.fb) { setTimeout(next, timeout ? 500 : 250); return; }

    let head;
    if (st.tipe === "kbli") head = g.ok ? "✔ Tepat 5 digit, nilai 10" : `${g.digit ? "◐" : "✘"} ${g.digit} digit cocok, nilai ${g.poin}. Kunci: ${g.kunci}`;
    else head = g.ok ? "✔ Benar" : `✘ ${timeout ? "Waktu habis. " : ""}Jawaban: ${g.kunci}`;
    let exp = q.e || "";
    if (st.tipe === "kbli" && kbliData) { const f = kbliData.find(([k]) => k === q.kode); if (f) exp = `${q.kode} = ${f[1]}`; }
    app.querySelector("#fbBox").innerHTML = `
      <div class="feedback ${g.ok ? "ok" : "bad"}"><b>${esc(head)}</b>${exp ? `<div class="exp">${esc(exp)}</div>` : ""}</div>
      <div class="nextrow"><button class="btn" id="nextBtn">Lanjut ▸</button></div>`;
    app.querySelector("#nextBtn").onclick = next;
    app.querySelector("#nextBtn").focus();
  }

  function next() {
    if (!S) return;
    S.qi++;
    if (S.qi < S.qs.length) return showQuestion();
    S.si++;
    if (S.si < S.stages.length) return stageIntro();
    finish();
  }

  // ---------- hasil ----------
  function stageScore(key) {
    const r = S.results[key] || [];
    return { benar: r.filter((x) => x.ok).length, poin: r.reduce((a, x) => a + x.poin, 0), n: r.length };
  }

  function finish() {
    stopTimer(); setKeys(null);
    const keys = S.stages;
    const sc = Object.fromEntries(keys.map((k) => [k, stageScore(k)]));
    let headline, best;
    if (S.mode === "sim") {
      const akhir = sc.mtk.poin + sc.kbli.poin;
      headline = `<div class="count">Nilai akhir (Tahap 3 + Tahap 4)</div><div class="score-big">${akhir}</div><div class="count">dari maksimal 200</div>`;
      best = akhir;
    } else {
      const k = keys[0], s = sc[k], st = STAGES[k];
      const maks = st.tipe === "mc" ? s.n : s.n * 10;
      headline = `<div class="count">${st.nama}</div><div class="score-big">${st.tipe === "mc" ? `${s.benar}/${s.n}` : s.poin}</div><div class="count">${st.tipe === "mc" ? "jawaban benar" : `poin dari maksimal ${maks}`}</div>`;
      best = st.tipe === "mc" ? `${s.benar}/${s.n}` : s.poin;
    }
    const prev = store.get("best:" + S.mode);
    const num = (v) => typeof v === "number" ? v : +String(v).split("/")[0] / +String(v).split("/")[1];
    if (prev == null || num(best) > num(prev)) store.set("best:" + S.mode, best);

    const statHTML = keys.map((k) => {
      const st = STAGES[k], s = sc[k];
      const val = st.tipe === "mc" ? `${s.benar}/${s.n}` : `${s.poin}`;
      const lbl = st.tipe === "mc" ? "benar" : "poin";
      return `<div class="stat"><b>${val}</b><span>${st.nama} · ${lbl}</span></div>`;
    }).join("");

    const reviewHTML = keys.map((k) => {
      const st = STAGES[k];
      return `<div class="section-title">${st.nama}</div>` + S.results[k].map((r, i) => `
        <div class="ritem ${r.ok ? "ok" : "bad"}">
          <div class="rq">${i + 1}. ${esc(r.q.q)}</div>
          <div class="ra">Jawabanmu: <b>${esc(r.jawab)}</b>${r.timeout ? " (waktu habis)" : ""} · Kunci: <b>${esc(r.kunci)}</b>${st.tipe === "kbli" ? ` · ${r.poin} poin` : ""}</div>
          ${r.q.e ? `<div class="ra">${esc(r.q.e)}</div>` : ""}
        </div>`).join("");
    }).join("");

    app.innerHTML = `
      <div class="card">
        ${headline}
        <div class="stats">${statHTML}</div>
        <div class="btnrow">
          <button class="btn" id="again">Ulangi</button>
          <button class="btn secondary" id="toHome">Beranda</button>
        </div>
      </div>
      <div class="review">${reviewHTML}</div>`;
    const mode = S.mode, n = S.n, fb = S.fb, noTimer = S.noTimer;
    app.querySelector("#again").onclick = () => start(mode, n, fb, noTimer);
    app.querySelector("#toHome").onclick = home;
    S = null;
  }

  // Muat data KBLI di latar belakang, untuk pembahasan judul kode.
  fetch("data/kbli.json").then((r) => r.json()).then((d) => { kbliData = d; }).catch(() => {});

  home();
})();
