(function () {
  const STORAGE_KEY = "cycle-tracker-calendar-v4";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  // --- Elements ---
  const phaseEl = $("#phase"), phaseNote = $("#phaseNote");
  const nextPeriodEl = $("#nextPeriod"), daysToNextEl = $("#daysToNext");
  const selStart = $("#selStart"), selEnd = $("#selEnd");
  const addCycleBtn = $("#addCycleBtn"), cancelEditBtn = $("#cancelEditBtn"), logInstr = $("#logInstr");
  const selectionRow = $("#selectionRow");
  const exportBtn = $("#exportBtn"), exportCsvBtn = $("#exportCsvBtn"), importCsvBtn = $("#importCsvBtn"), clearBtn = $("#clearBtn");
  const csvInput = $("#csvInput");
  const tbl = $("#tbl"), tbody = $("#tbody"), noRows = $("#noRows");
  const calendarWrap = document.querySelector(".calendar-wrap");

  // Navigation
  const navItems = $$('.nav-item');
  const views = $$('.view');

  // --- Logic / Math ---
  function ymd(d) { const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12); return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`; }
  function fromYmd(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); }
  function addDays(d, n) { const t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12); t.setDate(t.getDate() + n); return t; }
  function diff(a, b) { return Math.round((fromYmd(a) - fromYmd(b)) / (24 * 60 * 60 * 1000)); }
  function nice(s) { return fromYmd(s).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }); }
  function niceShort(s) { return fromYmd(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); }

  // "9th of Nov, 2025"
  function niceFull(s) {
    const d = fromYmd(s);
    const day = d.getDate();
    const month = d.toLocaleDateString(undefined, { month: 'short' });
    const year = d.getFullYear();

    let suffix = "th";
    if (day % 10 === 1 && day !== 11) suffix = "st";
    else if (day % 10 === 2 && day !== 12) suffix = "nd";
    else if (day % 10 === 3 && day !== 13) suffix = "rd";

    return `${day}${suffix} of ${month}, ${year}`;
  }

  let cycles = [];
  let editingCycle = null;

  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(cycles)); }
  function load() { try { cycles = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { cycles = []; } }

  function cycleLens(starts) { const out = []; for (let i = 1; i < starts.length; i++) out.push(diff(starts[i], starts[i - 1])); return out; }
  function median(arr) { if (!arr.length) return NaN; const s = [...arr].sort((a, b) => a - b), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

  // --- Core Prediction Logic ---
  function getCycleStats() {
    if (!cycles.length) return null;
    cycles.sort((a, b) => a.start.localeCompare(b.start));
    const starts = cycles.map(c => c.start);
    const lens = cycleLens(starts);
    const med = lens.length ? Math.round(median(lens)) : 28;
    return { med, starts };
  }

  function getPhaseForDate(dateStr) {
    const stats = getCycleStats();
    if (!stats) return null;

    // 1. Check if inside a recorded period (Exact Match)
    const recorded = cycles.find(c => c.end && dateStr >= c.start && dateStr <= c.end);
    if (recorded) {
      return { type: 'period', day: diff(dateStr, recorded.start) + 1, recorded: true };
    }

    // 2. Find "Anchor" Cycle (Latest start date <= dateStr)
    const anchorStart = stats.starts.filter(s => s <= dateStr).pop();

    if (!anchorStart) {
      return { type: 'future', msg: 'No data yet' };
    }

    // 3. Calculate Position in Cycle
    const daysSince = diff(dateStr, anchorStart);
    const dayInCycle = daysSince % stats.med; // 0 to med-1
    const cycleNum = Math.floor(daysSince / stats.med);

    // LIMIT PREDICTIONS:
    if (cycleNum > 1) return null;

    // Calculate Key Days
    const med = stats.med;
    const ovuDay = med - 14;
    let fertileStart = ovuDay - 5;
    const fertileEnd = ovuDay + 1;

    // Determine Period Length for Anchor
    let periodLen = 5;
    const anchorObj = cycles.find(c => c.start === anchorStart);
    if (anchorObj && anchorObj.end) {
      periodLen = diff(anchorObj.end, anchorObj.start) + 1;
    }

    // Determine Phase
    if (dayInCycle >= 0 && dayInCycle < periodLen) {
      return { type: 'period', day: dayInCycle + 1, recorded: false };
    }

    // If we are in Cycle 1 (Next Cycle), ONLY show period.
    if (cycleNum === 1) return null;

    // FERTILITY GAP FIX
    if (dayInCycle >= periodLen && dayInCycle < fertileStart) {
      fertileStart = periodLen;
    }

    if (dayInCycle >= fertileStart && dayInCycle <= fertileEnd) {
      const isOvu = (dayInCycle === ovuDay);
      return {
        type: isOvu ? 'ovulation' : 'fertile',
        day: dayInCycle,
        fertileStart: addDays(fromYmd(anchorStart), (cycleNum * med) + fertileStart),
        fertileEnd: addDays(fromYmd(anchorStart), (cycleNum * med) + fertileEnd)
      };
    }
    if (dayInCycle > fertileEnd) {
      return { type: 'luteal', day: dayInCycle };
    }

    return { type: 'follicular', day: dayInCycle };
  }

  // --- Calendar ---
  let fp;
  let savedMonth = null;
  let savedYear = null;

  function getDayClasses(d) {
    const dYmd = ymd(d);
    const phase = getPhaseForDate(dYmd);

    if (!phase) return [];

    if (phase.type === 'period') {
      return phase.recorded ? ["day-period"] : ["day-period-predicted"];
    }
    if (phase.type === 'fertile') return ["day-fertile"];
    if (phase.type === 'ovulation') return ["day-ovulation"];
    if (phase.type === 'luteal') return ["day-luteal"];

    return [];
  }

  function setupCalendar() {
    // Always refresh to current date unless calendar is being preserved during edit
    const now = new Date();

    if (fp) {
      // If we are just refreshing the view (e.g. after edit), keep the user's position
      savedMonth = fp.currentMonth;
      savedYear = fp.currentYear;
      fp.destroy();
    } else {
      // INITIAL LOAD: Always start at current month
      savedMonth = now.getMonth();
      savedYear = now.getFullYear();
    }

    if (!calendarWrap) return;

    fp = flatpickr("#calendar", {
      inline: true,
      appendTo: calendarWrap,
      mode: "range",
      defaultDate: new Date(savedYear, savedMonth, 1), // Set default to saved date
      clickOpens: false,
      // Ensure calendar opens to savedMonth/Year
      onReady: (_, __, inst) => {
        inst.jumpToDate(new Date(savedYear, savedMonth, 1));
        attachSwipe();
      },
      onDayCreate: function (dObj, dStr, fp, dayElem) {
        dayElem.classList.remove("day-period", "day-period-predicted", "day-fertile", "day-ovulation", "day-luteal");
        const cls = getDayClasses(dayElem.dateObj);
        cls.forEach(c => dayElem.classList.add(c));
      },
      onMonthChange: (s, d, inst) => {
        savedMonth = inst.currentMonth;
        savedYear = inst.currentYear;
      },
      onYearChange: (s, d, inst) => {
        savedMonth = inst.currentMonth;
        savedYear = inst.currentYear;
      },
      onChange: (sel) => {
        if (sel.length === 2) {
          const a = ymd(sel[0]), b = ymd(sel[1]);
          if (selStart) selStart.value = nice(a);
          if (selEnd) selEnd.value = nice(b);
          if (selectionRow) selectionRow.style.display = "flex";
        }
      }
    });
    attachSwipe();
  }

  function attachSwipe() {
    const cal = document.querySelector(".flatpickr-calendar"); if (!cal) return;
    let sx = 0, ex = 0;
    cal.addEventListener("touchstart", e => { sx = e.changedTouches[0].screenX; }, { passive: true });
    cal.addEventListener("touchend", e => { ex = e.changedTouches[0].screenX; const dx = ex - sx; if (Math.abs(dx) > 50) { if (dx < 0) fp.changeMonth(1); else fp.changeMonth(-1); } }, { passive: true });
  }

  // --- Edit Mode Logic ---
  function startEdit(cycle) {
    editingCycle = cycle;

    // Switch to Home
    navItems.forEach(n => n.classList.remove('active'));
    views.forEach(v => v.classList.remove('active'));
    $('[data-target="home-view"]').classList.add('active');
    $("#home-view").classList.add('active');

    // Populate inputs
    selStart.value = nice(cycle.start);
    selEnd.value = cycle.end ? nice(cycle.end) : "";
    selectionRow.style.display = "flex";

    // Populate Calendar
    if (fp) {
      fp.setDate([cycle.start, cycle.end || cycle.start], true);
      fp.jumpToDate(cycle.start);
    }

    // Update UI
    addCycleBtn.textContent = "Update Cycle";
    addCycleBtn.style.background = "var(--ovulation)";
    cancelEditBtn.style.display = "block";
    logInstr.textContent = "Editing cycle...";
    logInstr.style.color = "var(--ovulation)";
  }

  function cancelEdit() {
    editingCycle = null;
    selStart.value = "";
    selEnd.value = "";
    selectionRow.style.display = "none";
    if (fp) fp.clear();

    addCycleBtn.textContent = "Log Period";
    addCycleBtn.style.background = "";
    cancelEditBtn.style.display = "none";
    logInstr.textContent = "Select dates on calendar";
    logInstr.style.color = "";
  }

  // --- Rendering ---
  function renderHistory() {
    cycles.sort((a, b) => a.start.localeCompare(b.start));
    if (tbody) tbody.innerHTML = "";
    if (!cycles.length) {
      if (tbl) tbl.classList.add("hidden");
      if (noRows) noRows.classList.remove("hidden");
    }
    else {
      if (tbl) tbl.classList.remove("hidden");
      if (noRows) noRows.classList.add("hidden");
      for (const c of cycles) {
        const len = c.end ? (diff(c.end, c.start) + 1) : "";
        const tr = document.createElement("tr");
        const trashIcon = `<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;

        tr.innerHTML = `<td>${nice(c.start)}</td><td>${c.end ? nice(c.end) : "—"}</td><td>${len}</td>
                      <td class="right" style="display:flex;justify-content:flex-end;gap:8px">
                        <button class="secondary edit" style="padding:6px 10px;font-size:11px">Edit</button>
                        <button class="icon-btn del" aria-label="Delete">${trashIcon}</button>
                      </td>`;

        tr.querySelector(".del").addEventListener("click", () => {
          if (confirm("Delete this cycle?")) {
            cycles = cycles.filter(x => !(x.start === c.start));
            save(); updateAll();
          }
        });

        tr.querySelector(".edit").addEventListener("click", () => {
          startEdit(c);
        });

        if (tbody) tbody.appendChild(tr);
      }
    }
  }

  function renderDashboard() {
    const today = new Date();
    const todayYmd = ymd(today);
    const stats = getCycleStats();

    if (!stats) {
      if (phaseEl) phaseEl.textContent = "—";
      if (phaseNote) phaseNote.textContent = "Log your first period below";
      if (nextPeriodEl) nextPeriodEl.textContent = "—";
      if (daysToNextEl) daysToNextEl.textContent = "";
      return;
    }

    // 1. Current Phase
    const ph = getPhaseForDate(todayYmd);
    let label = "—";
    let note = "";

    if (ph) {
      if (ph.type === 'period') {
        label = "Period";
        note = `Day ${ph.day}`;
      } else if (ph.type === 'fertile' || ph.type === 'ovulation') {
        label = ph.type === 'ovulation' ? "Ovulation" : "Fertile";
        note = `Window: ${niceShort(ymd(ph.fertileStart))} - ${niceShort(ymd(ph.fertileEnd))}`;
      } else if (ph.type === 'luteal') {
        label = "Luteal";
        note = "Post-ovulation";
      } else if (ph.type === 'follicular') {
        label = "Follicular";
        note = "Pre-ovulation";
      } else if (ph.type === 'future') {
        label = "Waiting";
        note = "No past data";
      }
    }

    if (phaseEl) phaseEl.textContent = label;
    if (phaseNote) phaseNote.textContent = note;

    // 2. Next Period
    const anchorStart = stats.starts.filter(s => s <= todayYmd).pop() || stats.starts[0];
    let nextStart = null;

    if (anchorStart) {
      let k = 0;
      while (true) {
        const candidate = ymd(addDays(fromYmd(anchorStart), (k + 1) * stats.med));
        if (candidate > todayYmd) {
          nextStart = candidate;
          break;
        }
        k++;
        if (k > 1000) break;
      }
    } else {
      nextStart = stats.starts[0];
    }

    if (nextPeriodEl) nextPeriodEl.textContent = nice(nextStart);

    const dtn = diff(nextStart, todayYmd);
    if (daysToNextEl) daysToNextEl.textContent = `${dtn} day${dtn === 1 ? "" : "s"} to go`;
  }

  function updateAll() {
    renderDashboard();
    renderHistory();
    setupCalendar();
  }

  // --- CSV Logic ---
  function exportToCsv() {
    if (!cycles.length) return alert("No data to export");
    const headers = ["Start Date,End Date"];
    const rows = cycles.map(c => `${c.start},${c.end || ""}`);
    const csvContent = headers.concat(rows).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "cycles.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function importFromCsv(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const text = e.target.result;
      const lines = text.split('\n');
      let count = 0;
      const startIdx = lines[0].toLowerCase().includes('start') ? 1 : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [start, end] = line.split(',');
        if (start && /^\d{4}-\d{2}-\d{2}$/.test(start)) {
          const exists = cycles.some(c => c.start === start);
          if (!exists) {
            cycles.push({ start, end: end || null });
            count++;
          }
        }
      }
      if (count > 0) {
        save();
        updateAll();
        alert(`Imported ${count} cycles.`);
      } else {
        alert("No new valid cycles found in CSV.");
      }
    };
    reader.readAsText(file);
  }

  // --- Event Listeners ---
  if (addCycleBtn) addCycleBtn.addEventListener("click", () => {
    if (!selStart.value || !selEnd.value) return alert("Select start and end on the calendar");
    const s = new Date(selStart.value), e = new Date(selEnd.value);
    const ys = ymd(s), ye = ymd(e);
    if (fromYmd(ye) < fromYmd(ys)) return alert("End must be on/after start");

    if (editingCycle) {
      // Update existing
      editingCycle.start = ys;
      editingCycle.end = ye;
      cancelEdit(); // Reset UI
    } else {
      // Add new
      cycles.push({ start: ys, end: ye });
      selStart.value = ""; selEnd.value = "";
      if (selectionRow) selectionRow.style.display = "none";
    }

    save(); updateAll();
  });

  if (cancelEditBtn) cancelEditBtn.addEventListener("click", cancelEdit);

  if (exportBtn) exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(cycles, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "cycles.json"; a.click(); URL.revokeObjectURL(url);
  });

  if (exportCsvBtn) exportCsvBtn.addEventListener("click", exportToCsv);

  if (importCsvBtn) importCsvBtn.addEventListener("click", () => csvInput.click());
  if (csvInput) csvInput.addEventListener("change", (e) => {
    if (e.target.files.length) importFromCsv(e.target.files[0]);
    csvInput.value = "";
  });

  if (clearBtn) clearBtn.addEventListener("click", () => { if (confirm("Delete all data?")) { cycles = []; save(); updateAll(); } });

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));
      item.classList.add('active');
      const targetId = item.dataset.target;
      document.getElementById(targetId).classList.add('active');
      if (targetId === 'home-view' && fp) {
        // When returning to home view, jump to current month
        const now = new Date();
        fp.jumpToDate(new Date(now.getFullYear(), now.getMonth(), 1));
      }
    });
  });

  // --- Init ---
  load();
  setupCalendar();
  updateAll();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log('SW registered'))
        .catch(err => console.log('SW failed', err));
    });
  }
})();
