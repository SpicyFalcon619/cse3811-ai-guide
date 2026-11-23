/* A themed replacement for native <select>. The browser draws the native list
   itself and ignores the page theme, so each select is kept (it still holds
   the value and fires "change") but hidden, and a button plus a menu drawn by
   the page take its place. */
(function () {
  var openDD = null;
  function close(focusBtn) {
    if (!openDD) return;
    var d = openDD; openDD = null;
    d.menu.hidden = true; d.btn.setAttribute('aria-expanded', 'false');
    if (d.menu.parentNode) d.menu.parentNode.removeChild(d.menu);
    if (focusBtn) d.btn.focus();
  }
  function place(d) {
    var r = d.btn.getBoundingClientRect(), m = d.menu, vh = window.innerHeight;
    m.style.minWidth = r.width + 'px'; m.style.maxWidth = (window.innerWidth - 16) + 'px'; m.style.left = '0px';
    m.style.left = Math.max(8, Math.min(r.left, window.innerWidth - m.offsetWidth - 8)) + 'px';
    var below = vh - r.bottom - 8, above = r.top - 8, h = m.scrollHeight;
    if (h > below && above > below) { m.style.maxHeight = Math.min(300, above) + 'px'; m.style.top = (r.top - Math.min(h, Math.min(300, above)) - 6) + 'px'; }
    else { m.style.maxHeight = Math.min(300, below) + 'px'; m.style.top = (r.bottom + 6) + 'px'; }
  }
  function enhance(sel) {
    if (sel.__dd) return;
    var d = sel.__dd = { sel: sel, active: 0 };
    var wrap = document.createElement('span'); wrap.className = 'dd';
    sel.parentNode.insertBefore(wrap, sel);
    var btn = d.btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'dd-btn'; btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
    if (sel.getAttribute('aria-label')) btn.setAttribute('aria-label', sel.getAttribute('aria-label'));
    wrap.appendChild(btn); wrap.appendChild(sel);
    sel.classList.add('dd-native'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
    var menu = d.menu = document.createElement('ul');
    menu.className = 'dd-menu' + (sel.closest('.sim-top') ? ' dk' : ''); menu.setAttribute('role', 'listbox'); menu.hidden = true;
    function sync() { var o = sel.options[sel.selectedIndex]; btn.textContent = o ? o.text : ''; }
    function build() {
      menu.innerHTML = '';
      Array.prototype.forEach.call(sel.options, function (o, i) {
        var li = document.createElement('li'); li.setAttribute('role', 'option'); li.dataset.i = i; li.textContent = o.text;
        li.setAttribute('aria-selected', String(i === sel.selectedIndex)); menu.appendChild(li);
      });
    }
    function mark(i) {
      d.active = Math.max(0, Math.min(sel.options.length - 1, i));
      Array.prototype.forEach.call(menu.children, function (li, k) { li.classList.toggle('act', k === d.active); });
      var a = menu.children[d.active]; if (a && a.scrollIntoView) a.scrollIntoView({ block: 'nearest' });
    }
    function open() {
      if (openDD === d) return close(true);
      close(); sync(); build(); openDD = d;
      document.body.appendChild(menu); menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
      place(d); mark(sel.selectedIndex);
    }
    function choose(i) {
      var changed = i !== sel.selectedIndex; sel.selectedIndex = i; sync(); close(true);
      if (changed) sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    btn.addEventListener('click', function (e) { e.preventDefault(); open(); });
    btn.addEventListener('keydown', function (e) {
      var k = e.key;
      if (openDD !== d) { if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); open(); } return; }
      if (k === 'ArrowDown') { e.preventDefault(); mark(d.active + 1); }
      else if (k === 'ArrowUp') { e.preventDefault(); mark(d.active - 1); }
      else if (k === 'Home') { e.preventDefault(); mark(0); }
      else if (k === 'End') { e.preventDefault(); mark(sel.options.length - 1); }
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); choose(d.active); }
      else if (k === 'Escape' || k === 'Tab') { close(k === 'Escape'); }
    });
    menu.addEventListener('pointerdown', function (e) { e.preventDefault(); });
    menu.addEventListener('click', function (e) { var li = e.target.closest('li'); if (li) choose(+li.dataset.i); });
    menu.addEventListener('pointermove', function (e) { var li = e.target.closest('li'); if (li) mark(+li.dataset.i); });
    sel.addEventListener('change', sync); sel.addEventListener('sync', sync);
    new MutationObserver(function () { sync(); }).observe(sel, { childList: true });
    sync();
  }
  function scan(root) { Array.prototype.forEach.call((root || document).querySelectorAll('select'), enhance); }
  document.addEventListener('pointerdown', function (e) { if (openDD && !openDD.menu.contains(e.target) && !openDD.btn.contains(e.target)) close(); });
  window.addEventListener('resize', function () { if (openDD) place(openDD); });
  window.addEventListener('scroll', function () { if (openDD) place(openDD); }, { passive: true, capture: true });
  window.enhanceSelects = scan;
  new MutationObserver(function (list) {
    list.forEach(function (m) { Array.prototype.forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) { if (n.tagName === 'SELECT') enhance(n); else scan(n); } }); });
  }).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState !== 'loading') scan(); else document.addEventListener('DOMContentLoaded', function () { scan(); });
})();
