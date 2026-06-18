/* Northeast Cleaning Group — shared booking modal.
   Collects contact + service + address, then a date and a 1-hour arrival
   window (8:00 AM – 4:00 PM), and posts the lead to your CRM.

   >>> CONNECT YOUR CRM IN ONE PLACE <<<
   Set BOOKING_WEBHOOK_URL below to your GoHighLevel / Zapier / Make inbound
   webhook URL. While it's the placeholder, the form still works and shows the
   confirmation screen, but no data is sent anywhere.

   Any link to "#book" or any element with a [data-book] attribute opens it.
   Optional attributes on a trigger:
     data-service="Commercial / office"   -> pre-selects the service type
   Optional on <body>:
     data-city="Braselton"                -> pre-fills the City field         */
(function () {
  "use strict";

  var BOOKING_WEBHOOK_URL = "REPLACE_WITH_YOUR_GHL_WEBHOOK_URL";

  var SLOT_START = 8, SLOT_END = 16;           // windows: 8-9 ... 3-4 (last ends 4pm)
  var MAX_MONTHS_AHEAD = 6;
  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  var sel = { date: null, slot: null };
  var view = { y: 0, m: 0 };
  var lastTrigger = null;
  var basePrice = 0;
  var selectedAddons = {};
  var ADDONS = [
    { id: 'oven',      label: 'Inside the oven',                     price: 35 },
    { id: 'fridge',    label: 'Inside the refrigerator',            price: 30 },
    { id: 'cabinets',  label: 'Inside kitchen cabinets',            price: 35 },
    { id: 'windows',   label: 'Interior windows',                   price: 40 },
    { id: 'laundry',   label: 'Laundry — wash & fold (per load)',   price: 25 },
    { id: 'linens',    label: 'Change bed linens (per bed)',        price: 10 },
    { id: 'pethair',   label: 'Pet-hair deep removal',              price: 30 },
    { id: 'furniture', label: 'Move & clean behind heavy furniture', price: 40 },
    { id: 'garage',    label: 'Garage sweep-out',                   price: 45 },
    { id: 'haul',      label: 'Light junk / trash haul-away',       price: 50 }
  ];

  var MODAL_HTML =
  '<div class="modal-overlay" id="bkOverlay" role="dialog" aria-modal="true" aria-labelledby="bkTitle">' +
    '<div class="modal" id="bkModal">' +
      '<div class="modal-head">' +
        '<div>' +
          '<h3 id="bkTitle">Book your cleaning</h3>' +
          '<p>Tell us about the space, then pick a day &amp; time.</p>' +
          '<span class="modal-price" id="bkPriceChip" style="display:none"></span>' +
        '</div>' +
        '<button type="button" class="modal-close" id="bkClose" aria-label="Close booking">&times;</button>' +
      '</div>' +
      '<div class="steps-ind" id="bkInd"><span class="si active"></span><span class="si"></span></div>' +
      '<div class="modal-body">' +
        '<div class="step-pane active" id="bkStep1">' +
          '<div class="field-row">' +
            '<div class="field"><label for="bkName">Name <span class="req">*</span></label><input type="text" id="bkName" autocomplete="name" placeholder="Your name"></div>' +
            '<div class="field"><label for="bkPhone">Mobile number <span class="req">*</span></label><input type="tel" id="bkPhone" autocomplete="tel" placeholder="(470) 555-0123"></div>' +
          '</div>' +
          '<div class="field"><label for="bkService">Service type <span class="req">*</span></label>' +
            '<select id="bkService"><option value="">Choose one…</option><option>Recurring home cleaning</option><option>One-time deep clean</option><option>Move-in / move-out</option><option>Commercial / office</option></select></div>' +
          '<div class="field"><label for="bkAddress">Street address <span class="req">*</span></label><input type="text" id="bkAddress" autocomplete="address-line1" placeholder="123 Main St"></div>' +
          '<div class="field-row">' +
            '<div class="field"><label for="bkCity">City <span class="req">*</span></label><input type="text" id="bkCity" autocomplete="address-level2" placeholder="City"></div>' +
            '<div class="field"><label for="bkZip">Zip code <span class="req">*</span></label><input type="text" id="bkZip" inputmode="numeric" autocomplete="postal-code" placeholder="30517"></div>' +
          '</div>' +
          '<div class="field"><label for="bkNotes">Anything we should know? <span style="font-weight:400;color:#7A9296">(optional)</span></label><textarea id="bkNotes" rows="2" placeholder="Pets, gate codes, preferred days…"></textarea></div>' +
          '<div class="field-err" id="bkErr1">Please fill in the required fields above.</div>' +
          '<div class="modal-actions"><button type="button" class="btn btn-primary" id="bkNext">Continue to date &amp; time →</button></div>' +
        '</div>' +
        '<div class="step-pane" id="bkStep2">' +
          '<div class="cal" id="bkCal"></div>' +
          '<div class="slots-label" id="bkSlotsLabel" style="display:none">Choose a 1-hour arrival window</div>' +
          '<div class="slots-empty" id="bkSlotEmpty">Pick a date above to see arrival windows.</div>' +
          '<div class="slots" id="bkSlots" style="display:none"></div>' +
          '<div class="addons-head">Add to your clean <span>(optional)</span></div>' +
          '<div class="addons" id="bkAddons"></div>' +
          '<div class="bk-total"><span>Total per visit</span><b id="bkTotalVal">$0</b></div>' +
          '<div class="field-err" id="bkErr2">Please choose a date and an arrival window.</div>' +
          '<div class="modal-actions"><button type="button" class="btn btn-ghost" id="bkBack">← Back</button><button type="button" class="btn btn-sun" id="bkConfirm">Confirm booking</button></div>' +
        '</div>' +
        '<div class="modal-success" id="bkSuccess" style="display:none">' +
          '<div class="tick">✓</div>' +
          '<h3 id="bkSuccessName">You\'re booked!</h3>' +
          '<p id="bkSuccessMsg"></p>' +
          '<div class="modal-actions" style="max-width:240px;margin:22px auto 0"><button type="button" class="btn btn-primary" id="bkDone">Done</button></div>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>';

  function el(id) { return document.getElementById(id); }

  function inject() {
    if (el('bkOverlay')) return;
    var holder = document.createElement('div');
    holder.innerHTML = MODAL_HTML;
    document.body.appendChild(holder.firstChild);
    el('bkClose').addEventListener('click', close);
    el('bkDone').addEventListener('click', close);
    el('bkOverlay').addEventListener('click', function (e) { if (e.target === el('bkOverlay')) close(); });
    el('bkNext').addEventListener('click', function () { if (validateStep1()) goStep(2); });
    el('bkBack').addEventListener('click', function () { goStep(1); });
    el('bkConfirm').addEventListener('click', submit);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && el('bkOverlay') && el('bkOverlay').classList.contains('open')) close();
    });
  }

  function fmtH(h) { var m = h < 12 ? 'AM' : 'PM'; var hh = h % 12; if (hh === 0) hh = 12; return hh + ':00 ' + m; }
  function slotLabel(h) {
    var s = fmtH(h), e = fmtH(h + 1);
    var sm = s.slice(-2), em = e.slice(-2);
    return sm === em ? (s.slice(0, -3) + ' – ' + e) : (s + ' – ' + e);
  }
  function startOfToday() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function isoDate(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function renderCalendar() {
    var today = startOfToday();
    var cal = el('bkCal');
    var first = new Date(view.y, view.m, 1);
    var startDow = first.getDay();
    var daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    var nowM = today.getFullYear() * 12 + today.getMonth();
    var viewM = view.y * 12 + view.m;
    var canPrev = viewM > nowM;
    var canNext = viewM < nowM + MAX_MONTHS_AHEAD;

    var html = '<div class="cal-head">' +
      '<button type="button" class="cal-nav" id="bkPrev"' + (canPrev ? '' : ' disabled') + ' aria-label="Previous month">‹</button>' +
      '<b>' + MONTHS[view.m] + ' ' + view.y + '</b>' +
      '<button type="button" class="cal-nav" id="bkNextM"' + (canNext ? '' : ' disabled') + ' aria-label="Next month">›</button>' +
      '</div><div class="cal-grid">';
    for (var i = 0; i < 7; i++) html += '<div class="cal-dow">' + DOW[i] + '</div>';
    for (var s = 0; s < startDow; s++) html += '<button type="button" class="cal-day empty" disabled></button>';
    for (var d = 1; d <= daysInMonth; d++) {
      var cur = new Date(view.y, view.m, d);
      var past = cur < today;
      var isToday = cur.getTime() === today.getTime();
      var isSel = sel.date && cur.getTime() === sel.date.getTime();
      var cls = 'cal-day' + (isToday ? ' today' : '') + (isSel ? ' selected' : '');
      html += '<button type="button" class="' + cls + '"' + (past ? ' disabled' : '') + ' data-d="' + d + '">' + d + '</button>';
    }
    html += '</div>';
    cal.innerHTML = html;

    if (canPrev) el('bkPrev').addEventListener('click', function () { shiftMonth(-1); });
    if (canNext) el('bkNextM').addEventListener('click', function () { shiftMonth(1); });
    Array.prototype.forEach.call(cal.querySelectorAll('.cal-day[data-d]'), function (b) {
      b.addEventListener('click', function () { selectDate(parseInt(b.getAttribute('data-d'), 10)); });
    });
  }

  function shiftMonth(delta) {
    var m = view.m + delta;
    view.y += Math.floor(m / 12);
    view.m = ((m % 12) + 12) % 12;
    renderCalendar();
  }

  function selectDate(d) {
    sel.date = new Date(view.y, view.m, d);
    sel.slot = null;
    renderCalendar();
    renderSlots();
    hideErr('bkErr2');
  }

  function renderSlots() {
    var wrap = el('bkSlots'), empty = el('bkSlotEmpty'), label = el('bkSlotsLabel');
    if (!sel.date) { wrap.style.display = 'none'; label.style.display = 'none'; empty.style.display = 'block'; return; }
    empty.style.display = 'none'; label.style.display = 'block'; wrap.style.display = 'grid';
    var html = '';
    for (var h = SLOT_START; h < SLOT_END; h++) {
      var cls = sel.slot === h ? 'slot selected' : 'slot';
      html += '<button type="button" class="' + cls + '" data-h="' + h + '">' + slotLabel(h) + '</button>';
    }
    wrap.innerHTML = html;
    Array.prototype.forEach.call(wrap.querySelectorAll('.slot'), function (b) {
      b.addEventListener('click', function () {
        sel.slot = parseInt(b.getAttribute('data-h'), 10);
        renderSlots();
        hideErr('bkErr2');
      });
    });
  }

  function parsePrice(t) { var n = parseInt(String(t).replace(/[^0-9]/g, ''), 10); return isNaN(n) ? 0 : n; }
  function addonsTotal() { var t = 0; ADDONS.forEach(function (a) { if (selectedAddons[a.id]) t += a.price; }); return t; }
  function updateTotal() { var tv = el('bkTotalVal'); if (tv) tv.textContent = '$' + (basePrice + addonsTotal()); }

  function renderAddons() {
    var c = el('bkAddons');
    if (!c) return;
    var html = '';
    ADDONS.forEach(function (a) {
      html += '<button type="button" class="addon' + (selectedAddons[a.id] ? ' selected' : '') + '" data-id="' + a.id + '">' +
        '<span class="addon-check" aria-hidden="true"></span>' +
        '<span class="addon-label">' + a.label + '</span>' +
        '<span class="addon-price">+$' + a.price + '</span>' +
        '</button>';
    });
    c.innerHTML = html;
    Array.prototype.forEach.call(c.querySelectorAll('.addon'), function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-id');
        if (selectedAddons[id]) delete selectedAddons[id]; else selectedAddons[id] = true;
        b.classList.toggle('selected');
        updateTotal();
      });
    });
  }

  function mark(id, bad) { var e = el(id); if (bad) e.classList.add('input-invalid'); else e.classList.remove('input-invalid'); }
  function showErr(id) { el(id).classList.add('show'); }
  function hideErr(id) { el(id).classList.remove('show'); }

  function validateStep1() {
    var ids = ['bkName', 'bkPhone', 'bkService', 'bkAddress', 'bkCity', 'bkZip'];
    var firstBad = null;
    ids.forEach(function (id) {
      var v = el(id).value.trim();
      mark(id, !v);
      if (!v && !firstBad) firstBad = id;
    });
    if (firstBad) { showErr('bkErr1'); el(firstBad).focus(); return false; }
    hideErr('bkErr1');
    return true;
  }

  function goStep(n) {
    el('bkStep1').classList.toggle('active', n === 1);
    el('bkStep2').classList.toggle('active', n === 2);
    var sis = el('bkInd').children;
    sis[0].classList.toggle('active', n >= 1);
    sis[1].classList.toggle('active', n >= 2);
    if (n === 2) { renderCalendar(); renderSlots(); renderAddons(); updateTotal(); }
    if (el('bkModal')) el('bkModal').scrollTop = 0;
    if (el('bkOverlay')) el('bkOverlay').scrollTop = 0;
  }

  function open(trigger) {
    inject();
    lastTrigger = trigger || null;
    sel.date = null; sel.slot = null;
    var t = startOfToday(); view.y = t.getFullYear(); view.m = t.getMonth();
    ['bkName', 'bkPhone', 'bkAddress', 'bkZip', 'bkNotes'].forEach(function (id) { el(id).value = ''; mark(id, false); });
    el('bkService').value = (trigger && trigger.getAttribute('data-service')) || '';
    mark('bkService', false);
    el('bkCity').value = document.body.getAttribute('data-city') || '';
    mark('bkCity', false);
    hideErr('bkErr1'); hideErr('bkErr2');
    basePrice = parsePrice((document.getElementById('priceVal') || {}).textContent);
    selectedAddons = {};
    el('bkStep1').style.display = ''; el('bkStep2').style.display = '';
    el('bkSuccess').style.display = 'none';
    el('bkInd').style.display = '';
    goStep(1);
    renderAddons();
    updateTotal();

    var chip = el('bkPriceChip');
    if (basePrice > 0) { chip.textContent = 'Starting at $' + basePrice + ' / visit'; chip.style.display = 'inline-block'; }
    else chip.style.display = 'none';

    el('bkOverlay').classList.add('open');
    document.body.classList.add('modal-lock');
    setTimeout(function () { try { el('bkName').focus(); } catch (e) {} }, 60);
  }

  function close() {
    var ov = el('bkOverlay');
    if (!ov) return;
    ov.classList.remove('open');
    document.body.classList.remove('modal-lock');
    if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
  }

  function submit() {
    if (!sel.date || sel.slot === null) { el('bkErr2').textContent = 'Please choose a date and an arrival window.'; showErr('bkErr2'); return; }
    var addOnTotal = addonsTotal();
    var total = basePrice + addOnTotal;
    var data = {
      name: el('bkName').value.trim(),
      phone: el('bkPhone').value.trim(),
      service: el('bkService').value,
      address: el('bkAddress').value.trim(),
      city: el('bkCity').value.trim(),
      zip: el('bkZip').value.trim(),
      notes: el('bkNotes').value.trim(),
      booking_date: isoDate(sel.date),
      booking_date_readable: sel.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      arrival_window: slotLabel(sel.slot),
      arrival_start_24h: (sel.slot < 10 ? '0' : '') + sel.slot + ':00',
      base_price: basePrice,
      addons: ADDONS.filter(function (a) { return selectedAddons[a.id]; }).map(function (a) { return a.label + ' (+$' + a.price + ')'; }).join('; '),
      addons_total: addOnTotal,
      total_price: total,
      city_page: document.body.getAttribute('data-city') || '',
      page: location.pathname,
      source: 'booking_modal'
    };

    if (BOOKING_WEBHOOK_URL.indexOf('http') === 0) {
      fetch(BOOKING_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(function () {});
    }

    el('bkStep1').style.display = 'none';
    el('bkStep2').style.display = 'none';
    el('bkInd').style.display = 'none';
    el('bkSuccessName').textContent = "You're booked, " + (data.name || 'neighbor') + "!";
    el('bkSuccessMsg').textContent = "We've got your request for " + data.booking_date_readable +
      ", " + data.arrival_window + " — $" + total + "/visit. We'll confirm shortly with your cleaner's details.";
    el('bkSuccess').style.display = 'block';
    if (el('bkModal')) el('bkModal').scrollTop = 0;
    if (el('bkOverlay')) el('bkOverlay').scrollTop = 0;
  }

  function bind() {
    Array.prototype.forEach.call(document.querySelectorAll('a[href="#book"], [data-book]'), function (node) {
      node.addEventListener('click', function (e) { e.preventDefault(); open(node); });
    });
  }

  function init() { inject(); bind(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
