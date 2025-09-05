; (() => {
    // ---- Config: working hours (Mon=1 ... Sun=7)
    // Use ["09:00","00:00"] for midnight. Use null for closed day.
    const HOURS = {
        1: ["09:00", "22:00"], // Monday
        2: ["09:00", "22:00"], // Tuesday
        3: ["09:00", "22:00"], // Wednesday
        4: ["09:00", "22:00"], // Thursday
        5: ["09:00", "22:00"], // Friday
        6: ["09:00", "22:00"], // Saturday
        7: ["09:00", "22:00"], // Sunday
    };

    // ---- Elements
    const box = document.getElementById("ltHours");
    if (!box) return;
    const list = document.getElementById("ltHoursList");
    const dot = document.getElementById("ltDot");
    const stateText = document.getElementById("ltStateText");
    const todayRangeEl = document.getElementById("ltTodayRange");

    // ---- Helpers
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const pad = n => String(n).padStart(2, "0");
    const toMin = (hhmm) => {
        if (!hhmm) return null;
        let [h, m] = hhmm.split(":").map(Number);
        h = (h === 24 ? 0 : h);
        return h * 60 + m;
    };

    function isOpenNow(now = new Date()) {
        const dow = ((now.getDay() + 6) % 7) + 1; // Mon=1..Sun=7
        const prevDow = dow === 1 ? 7 : dow - 1;

        // today window(s)
        const rng = HOURS[dow];
        const prev = HOURS[prevDow];

        const nowMin = now.getHours() * 60 + now.getMinutes();

        // normal same-day window
        if (rng && rng[0] && rng[1]) {
            const a = toMin(rng[0]), b = toMin(rng[1]);
            if (a < b && nowMin >= a && nowMin < b) return true;
            if (a > b) { // crosses midnight (e.g., 20:00–02:00)
                if (nowMin >= a) return true; // after open until 24:00
            }
        }

        // overnight continuation from previous day (prev crosses midnight)
        if (prev && prev[0] && prev[1]) {
            const a = toMin(prev[0]), b = toMin(prev[1]);
            if (a > b && nowMin < b) return true; // after midnight before close
        }

        return false;
    }

    function todayRangeStr() {
        const d = ((new Date().getDay() + 6) % 7) + 1;
        const r = HOURS[d];
        return r && r[0] && r[1] ? `${r[0]} - ${r[1]}` : "Closed";
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
            range.textContent = (r && r[0] && r[1]) ? `${r[0]} - ${r[1]}` : "Closed";

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
        stateText.textContent = open ? "Open now" : "Closed now";
        todayRangeEl.textContent = todayRangeStr();
    }

    buildList();
    renderState();
    // Refresh every minute
    setInterval(renderState, 60 * 1000);
})();
