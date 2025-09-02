(() => {
  // ---- Ayarlar: Çalışma saatleri (Pazartesi=1 ... Pazar=7)
  // Gece yarısı için ["09:00","00:00"] kullan. Kapalı gün için null kullan.
  const HOURS = {
    1: ["09:00", "00:00"], // Pazartesi
    2: ["09:00", "00:00"], // Salı
    3: ["09:00", "00:00"], // Çarşamba
    4: ["09:00", "00:00"], // Perşembe
    5: ["09:00", "00:00"], // Cuma
    6: ["09:00", "00:00"], // Cumartesi
    7: ["09:00", "00:00"], // Pazar
  };

  // ---- Elemanlar
  const box = document.getElementById("ltHours");
  if (!box) return;
  const list = document.getElementById("ltHoursList");
  const dot = document.getElementById("ltDot");
  const stateText = document.getElementById("ltStateText");
  const todayRangeEl = document.getElementById("ltTodayRange");

  // ---- Yardımcılar
  const dayNames = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  const pad = n => String(n).padStart(2, "0");
  const toMin = (hhmm) => {
    if (!hhmm) return null;
    let [h, m] = hhmm.split(":").map(Number);
    h = (h === 24 ? 0 : h);
    return h * 60 + m;
  };

  function isOpenNow(now = new Date()) {
    const dow = ((now.getDay() + 6) % 7) + 1; // Pazartesi=1..Pazar=7
    const prevDow = dow === 1 ? 7 : dow - 1;

    // bugünkü zaman aralığı
    const rng = HOURS[dow];
    const prev = HOURS[prevDow];

    const nowMin = now.getHours() * 60 + now.getMinutes();

    // normal aynı gün aralığı
    if (rng && rng[0] && rng[1]) {
      const a = toMin(rng[0]), b = toMin(rng[1]);
      if (a < b && nowMin >= a && nowMin < b) return true;
      if (a > b) { // gece yarısını geçiyorsa (örn. 20:00–02:00)
        if (nowMin >= a) return true; // açılıştan 24:00’e kadar
      }
    }

    // önceki günden devam eden gece aralığı
    if (prev && prev[0] && prev[1]) {
      const a = toMin(prev[0]), b = toMin(prev[1]);
      if (a > b && nowMin < b) return true; // gece yarısından sonra kapanışa kadar
    }

    return false;
  }

  function todayRangeStr() {
    const d = ((new Date().getDay() + 6) % 7) + 1;
    const r = HOURS[d];
    return r && r[0] && r[1] ? `${r[0]} - ${r[1]}` : "Kapalı";
  }

  function buildList() {
    const today = ((new Date().getDay() + 6) % 7) + 1;
    const frag = document.createDocumentFragment();

    dayNames.forEach((name, idx) => {
      const d = idx + 1;
      const row = document.createElement("li");
      row.className = "lt-hours-row" + (d === today ? " lt-today-highlight" : "");
      const day = document.createElement("div");
      day.className = "lt-day";
      day.textContent = name;

      const range = document.createElement("div");
      range.className = "lt-range";
      const r = HOURS[d];
      range.textContent = (r && r[0] && r[1]) ? `${r[0]} - ${r[1]}` : "Kapalı";

      row.append(day, range);
      frag.appendChild(row);
    });

    list.innerHTML = "";
    list.appendChild(frag);
  }

  function renderState() {
    const open = isOpenNow();
    dot.classList.toggle("lt-open", open);
    dot.classList.toggle("lt-closed", !open);
    stateText.textContent = open ? "Şu an açık" : "Şu an kapalı";
    todayRangeEl.textContent = todayRangeStr();
  }

  buildList();
  renderState();

  // Her dakika güncelle
  setInterval(renderState, 60 * 1000);
})();
