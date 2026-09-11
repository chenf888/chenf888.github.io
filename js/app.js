  (function() {
    var html = document.documentElement;
    var toggle = document.getElementById('themeToggle');
    var sunIcon = document.getElementById('sunIcon');
    var moonIcon = document.getElementById('moonIcon');

    var ripple = document.getElementById('themeRipple');
    var ripplePhase = 'idle';
    function getBg() { return getComputedStyle(html).getPropertyValue('--bg').trim(); }

    function setTheme(t, instant) {
      html.setAttribute('data-theme', t);
      sunIcon.style.display  = t === 'light' ? 'block' : 'none';
      moonIcon.style.display = t === 'light' ? 'none'   : 'block';
      localStorage.setItem('site-theme-chenfeng', t);
      if (!instant) setTimeout(function() { ripple.style.backgroundColor = getBg(); }, 50);
    }

    var saved = localStorage.getItem('site-theme-chenfeng') || 'light';
    setTheme(saved, true);

    function startRipple(nextTheme) {
      if (ripplePhase !== 'idle') return;
      var r = ripple.parentElement.getBoundingClientRect();
      ripple.style.display = 'block';
      ripple.style.transformOrigin = (r.width/2) + 'px ' + (r.height/2) + 'px';
      ripple.style.transform = 'scale(0)';
      ripple.style.backgroundColor = getBg();
      ripple.style.transition = 'none';
      ripplePhase = 'expanding';
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          ripple.style.transform = 'scale(1)';
          ripple.style.transition = 'transform 0.45s cubic-bezier(0.4,0,0.2,1)';
        });
      });
    }

    function onRippleEnd(e) {
      if (e.propertyName !== 'transform') return;
      if (ripplePhase === 'expanding') {
        setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', false);
        ripple.style.backgroundColor = getBg();
        ripple.style.transform = 'scale(0)';
        ripple.style.transition = 'transform 0.4s cubic-bezier(0.4,0,0.2,1)';
        ripplePhase = 'shrinking';
      } else if (ripplePhase === 'shrinking') {
        ripple.style.display = 'none';
        ripplePhase = 'idle';
      }
    }
    ripple.addEventListener('transitionend', onRippleEnd);

    toggle.addEventListener('click', function() {
      if (ripplePhase !== 'idle') return;
      startRipple(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });

    var twEl = document.getElementById('typewriterText');
    var enIdentities = ['From China', 'Incremental Game Dev', 'AI Enthusiast', 'Ciallo\uff5e(\u2220\u30fb\u03c9< )\u2312\u2605'];
    var zhIdentities = ['来自中国', '增量游戏开发者', 'AI爱好者', 'Ciallo\uff5e(\u2220\u30fb\u03c9< )\u2312\u2605'];
    var idIdx = 0, chIdx = 0, phase = 'typing', twTimer = null;
    var TSPEED = 70, DSPEED = 40, PAUSE = 2200, WAIT = 500;

    function clearTW() { if (twTimer) { clearTimeout(twTimer); twTimer = null; } }
    function getTWList() { return html.getAttribute('data-lang') === 'zh' ? zhIdentities : enIdentities; }
    function runTW() {
      clearTW();
      var list = getTWList();
      var cur = list[idIdx % list.length];
      if (phase === 'typing') {
        if (chIdx < cur.length) { chIdx++; twEl.textContent = cur.substring(0, chIdx); twTimer = setTimeout(runTW, TSPEED + (Math.random()-0.5)*30); }
        else { phase = 'pausing'; twTimer = setTimeout(runTW, PAUSE); }
      } else if (phase === 'pausing') { phase = 'deleting'; twTimer = setTimeout(runTW, 50); }
      else if (phase === 'deleting') {
        if (chIdx > 0) { chIdx--; twEl.textContent = cur.substring(0, chIdx); twTimer = setTimeout(runTW, DSPEED + (Math.random()-0.5)*20); }
        else { phase = 'waiting'; twTimer = setTimeout(runTW, WAIT); }
      } else if (phase === 'waiting') { idIdx = (idIdx+1) % list.length; chIdx = 0; twEl.textContent = ''; phase = 'typing'; twTimer = setTimeout(runTW, 200); }
    }
    runTW();

    var header = document.getElementById('siteHeader');
    var ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(function() {
          header.classList.toggle('scrolled', window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
    if (window.scrollY > 20) header.classList.add('scrolled');

    var revealEls = document.querySelectorAll('[data-reveal], .hero-reveal');
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.12 });
    revealEls.forEach(function(el) { observer.observe(el); });

    var tabLinks = document.querySelectorAll('.nav-pill .pill-links a');
    var allTabs = document.querySelectorAll('.tab-page');

    function switchTab(tabName, scrollTarget) {
      
      closeVerOverlay();
      
      tabLinks.forEach(function(a) { a.classList.remove('active'); });
      
      allTabs.forEach(function(tp) { tp.classList.remove('anim-in'); });
      
      allTabs.forEach(function(tp) {
        tp.classList.toggle('active', tp.id === 'tab-' + tabName);
      });
      
      var newTab = document.getElementById('tab-' + tabName);
      if (newTab) { newTab.offsetHeight; newTab.classList.add('anim-in'); }
      
      tabLinks.forEach(function(a) {
        var isActive = a.getAttribute('data-tab') === tabName;
        a.classList.toggle('active', isActive);
        a.setAttribute('aria-selected', isActive ? 'true' : 'false');
        a.tabIndex = isActive ? 0 : -1;
      });
      
      if (scrollTarget) {
        var target = document.getElementById(scrollTarget);
        if (target) {
          setTimeout(function() { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
        }
      }
      
      var newReveals = document.querySelectorAll('.tab-page.active [data-reveal], .tab-page.active .hero-reveal');
      newReveals.forEach(function(el) { observer.observe(el); });
    }

    tabLinks.forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        var tab = this.getAttribute('data-tab');
        var scrollTo = this.getAttribute('data-scroll');
        switchTab(tab, scrollTo);
      });
    });

    var tablist = document.querySelector('.pill-links');
    tablist.addEventListener('keydown', function(e) {
      var idx = tabLinks.indexOf(document.activeElement);
      if (idx === -1) return;
      var next = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % tabLinks.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + tabLinks.length) % tabLinks.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabLinks.length - 1;
      if (next >= 0) {
        e.preventDefault();
        switchTab(tabLinks[next].getAttribute('data-tab'));
        tabLinks[next].focus();
      }
    });

    switchTab('home');

    var emailItem = document.getElementById('emailItem');
    var toast = document.getElementById('toast');
    var toastTimer;
    function showToast() {
      var isZh = html.getAttribute('data-lang') === 'zh';
      toast.textContent = isZh ? '邮箱已复制到剪贴板' : 'Email copied to clipboard';
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 2000);
    }
    function copyText(text, done) {
      function legacyCopy() {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (err) {}
        document.body.removeChild(ta);
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function() { legacyCopy(); if (done) done(); });
      } else {
        legacyCopy();
        if (done) done();
      }
    }
    emailItem.addEventListener('click', function() {
      copyText('chenfeng200108@outlook.com', showToast);
    });

    var langToggle = document.getElementById('langToggle');
    var currentLang = localStorage.getItem('site-lang-chenfeng') || 'en';

    function applyLang(lang) {
      html.setAttribute('data-lang', lang);
      html.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
      langToggle.textContent = lang === 'zh' ? 'EN' : '中';
      localStorage.setItem('site-lang-chenfeng', lang);

      var els = document.querySelectorAll('[data-lang-zh]');
      els.forEach(function(el) {
        var text = lang === 'zh' ? el.getAttribute('data-lang-zh') : el.getAttribute('data-lang-en');
        if (text != null && text !== '') el.textContent = text;
      });

      idIdx = 0; chIdx = 0; phase = 'typing'; twEl.textContent = '';
      clearTW();
      runTW();
    }

    applyLang(currentLang);

    langToggle.addEventListener('click', function() {
      applyLang(html.getAttribute('data-lang') === 'zh' ? 'en' : 'zh');
    });

    var dailyData = [];
    var dailyDateFilter = null;
    var dailyFiltered = [];
    var dailyPage = 1;
    var dailyPerPage = 10;
    var dailyLoaded = false;

    var dailyList = document.getElementById('dailyList');
    var dailyPagination = document.getElementById('dailyPagination');
    var dailySearch = document.getElementById('dailySearch');
    var dailyCount = document.getElementById('dailyCount');

    function loadDaily(callback) {
      if (dailyLoaded) { if (callback) callback(); return; }
      dailyList.innerHTML = '<div class="daily-skeleton"></div><div class="daily-skeleton"></div><div class="daily-skeleton"></div>';
      dailyPagination.innerHTML = '';

      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'daily/manifest.json', true);
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var data = JSON.parse(xhr.responseText);
            dailyData = data;
            dailyFiltered = data;
            dailyLoaded = true;
            dailyPage = 1;
            if (callback) callback();
            renderDaily();
          } catch(e) {
            showDailyError();
          }
        } else {
          showDailyError();
        }
      };
      xhr.onerror = showDailyError;
      xhr.send();
    }

    function showDailyError() {
      dailyList.innerHTML = '<div class="daily-empty" data-lang-zh="加载日常失败，请稍后再试。" data-lang-en="Failed to load daily entries. Please try again later.">Failed to load daily entries. Please try again later.</div>';
      dailyPagination.innerHTML = '';
      dailyCount.textContent = '00';
    }

    function renderDaily() {
      var total = dailyFiltered.length;
      dailyCount.textContent = String(total).padStart(2, '0');

      if (total === 0) {
        dailyList.innerHTML = '<div class="daily-empty" data-lang-zh="没有找到匹配的日常条目。" data-lang-en="No matching daily entries found.">No matching daily entries found.</div>';
        dailyPagination.innerHTML = '';
        return;
      }

      var totalPages = Math.ceil(total / dailyPerPage);
      if (dailyPage > totalPages) dailyPage = totalPages;
      if (dailyPage < 1) dailyPage = 1;

      var start = (dailyPage - 1) * dailyPerPage;
      var pageItems = dailyFiltered.slice(start, start + dailyPerPage);

      var html = '';
      pageItems.forEach(function(entry, i) {
        var idx = start + i;
        var preview = entry.content.length > 80 ? entry.content.substring(0, 80) + '…' : entry.content;
        html += '<div class="daily-entry" data-index="' + idx + '">';
        html += '<div class="daily-entry-header">';
        html += '<span class="daily-entry-date">' + entry.date + '</span>';
        html += '<span class="daily-entry-title">' + entry.title + '</span>';
        html += '<span class="daily-entry-arrow">&#9660;</span>';
        html += '</div>';
        html += '<div class="daily-entry-body">';
        html += '<div class="daily-entry-preview">' + preview + '</div>';
        html += '<div class="daily-images"></div>';
        html += '</div>';
        html += '</div>';
      });

      dailyList.innerHTML = html;

      dailyList.querySelectorAll('.daily-entry').forEach(function(el) {
        el.addEventListener('click', function() {
          var entry = dailyFiltered[parseInt(this.getAttribute('data-index'))];
          var body = this.querySelector('.daily-entry-body');
          var previewEl = this.querySelector('.daily-entry-preview');
          var imagesEl = this.querySelector('.daily-images');

          if (this.classList.contains('expanded')) {
            this.classList.remove('expanded');
            collapseBody(body);
            return;
          }

          var others = dailyList.querySelectorAll('.daily-entry.expanded');
          others.forEach(function(e) {
            var ob = e.querySelector('.daily-entry-body');
            ob.style.maxHeight = ob.scrollHeight + 'px';
            requestAnimationFrame(function() { ob.style.maxHeight = '0px'; });
            setTimeout(function() { e.classList.remove('expanded'); }, 360);
          });

          previewEl.textContent = entry.content || '';
          imagesEl.innerHTML = '';
          imagesEl.classList.remove('show');
          if (entry.images && entry.images.length) {
            var added = 0;
            entry.images.forEach(function(src) {
              if (!src) return;
              var img = document.createElement('img');
              img.src = src;
              img.alt = entry.title;
              img.loading = 'eager';
              img.onerror = function() { this.style.display = 'none'; };
              imagesEl.appendChild(img);
              added++;
            });
            if (added) imagesEl.classList.add('show');
          }

          this.classList.add('expanded');
          expandBody(body);
        });
      });

      renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
      var isZh = html.getAttribute('data-lang') === 'zh';
      var h = '';
      h += '<button id="dailyPrev" ' + (dailyPage <= 1 ? 'disabled' : '') + '>' + (isZh ? '← 上一页' : '← Prev') + '</button>';
      h += '<span class="daily-page-info">' + dailyPage + ' / ' + totalPages + '</span>';
      h += '<button id="dailyNext" ' + (dailyPage >= totalPages ? 'disabled' : '') + '>' + (isZh ? '下一页 →' : 'Next →') + '</button>';
      dailyPagination.innerHTML = h;

      var prevBtn = document.getElementById('dailyPrev');
      var nextBtn = document.getElementById('dailyNext');
      if (prevBtn) prevBtn.addEventListener('click', function() {
        if (dailyPage > 1) { dailyPage--; renderDaily(); scrollDaily(); }
      });
      if (nextBtn) nextBtn.addEventListener('click', function() {
        if (dailyPage < totalPages) { dailyPage++; renderDaily(); scrollDaily(); }
      });
    }

    function scrollDaily() {
      dailyList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function collapseBody(body) {
      body.style.maxHeight = body.scrollHeight + 'px';
      requestAnimationFrame(function() { body.style.maxHeight = '0px'; });
    }

    function expandBody(body) {
      var pending = [];
      body.querySelectorAll('img').forEach(function(img) {
        if (img.complete) return;
        pending.push(new Promise(function(res) {
          img.addEventListener('load', res);
          img.addEventListener('error', res);
        }));
      });
      function apply() { body.style.maxHeight = body.scrollHeight + 'px'; }
      if (pending.length === 0) { apply(); return; }
      Promise.all(pending).then(apply);
      setTimeout(apply, 1500);
    }

    var calBtn = document.getElementById('dailyCalBtn');
    var calEl  = document.getElementById('dailyCalendar');
    var calGrid = document.getElementById('calGrid');
    var calMonth = document.getElementById('calMonth');
    var calPrev = document.getElementById('calPrev');
    var calNext = document.getElementById('calNext');
    var calYear, calMonthIdx;

    function openCalendar(y, m) { calYear = y; calMonthIdx = m; renderCalendar(); calEl.classList.add('open'); }
    function closeCalendar() { calEl.classList.remove('open'); }
    calBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (calEl.classList.contains('open')) { closeCalendar(); return; }
      if (!dailyLoaded) return;
      var now = new Date();
      openCalendar(now.getFullYear(), now.getMonth());
    });
    document.addEventListener('click', function(e) {
      if (!calEl.contains(e.target) && e.target !== calBtn) closeCalendar();
    });
    calPrev.addEventListener('click', function(e) { e.stopPropagation(); calMonthIdx = calMonthIdx===0 ? 11 : calMonthIdx-1; if(calMonthIdx===11)calYear--; renderCalendar(); });
    calNext.addEventListener('click', function(e) { e.stopPropagation(); calMonthIdx = calMonthIdx===11 ? 0 : calMonthIdx+1; if(calMonthIdx===0)calYear++; renderCalendar(); });

    function renderCalendar() {
      var monthsZh = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
      calMonth.textContent = calYear + ' ' + monthsZh[calMonthIdx];
      var entryDates = {}; if (dailyData) dailyData.forEach(function(e) { entryDates[e.date] = true; });
      var today = new Date();
      var todayStr = today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
      var firstDay = new Date(calYear, calMonthIdx, 1);
      var startDayOfWeek = (firstDay.getDay() + 6) % 7;
      var daysInMonth = new Date(calYear, calMonthIdx+1, 0).getDate();
      var daysInPrev  = new Date(calYear, calMonthIdx, 0).getDate();
      var prevYear = calMonthIdx===0 ? calYear-1 : calYear, prevMonth = calMonthIdx===0 ? 11 : calMonthIdx-1;
      var nextYear = calMonthIdx===11 ? calYear+1 : calYear, nextMonth = calMonthIdx===11 ? 0 : calMonthIdx+1;
      var totalCells = Math.ceil((startDayOfWeek + daysInMonth) / 7) * 7, html = '';
      for (var i = 0; i < totalCells; i++) {
        var day, dateStr, isOther=false, isToday=false, hasEntry=false;
        if (i < startDayOfWeek) { day = daysInPrev - startDayOfWeek + i + 1; dateStr = prevYear+'-'+String(prevMonth+1).padStart(2,'0')+'-'+String(day).padStart(2,'0'); isOther = true; }
        else if (i - startDayOfWeek >= daysInMonth) { day = i - startDayOfWeek - daysInMonth + 1; dateStr = nextYear+'-'+String(nextMonth+1).padStart(2,'0')+'-'+String(day).padStart(2,'0'); isOther = true; }
        else { day = i - startDayOfWeek + 1; dateStr = calYear+'-'+String(calMonthIdx+1).padStart(2,'0')+'-'+String(day).padStart(2,'0'); if(dateStr===todayStr)isToday=true; if(entryDates[dateStr])hasEntry=true; }
        var cls = 'cal-day';
        if (isOther) cls += ' other-month';
        else { if(hasEntry)cls+=' has-entry'; if(isToday)cls+=' today'; if(dailyDateFilter&&dateStr===dailyDateFilter)cls+=' active'; }
        html += '<span class="'+cls+'" data-date="'+dateStr+'">'+day+'</span>';
      }
      calGrid.innerHTML = html;
      calGrid.querySelectorAll('.cal-day.has-entry:not(.other-month)').forEach(function(cell) { cell.addEventListener('click', function(e) { e.stopPropagation(); var d=this.getAttribute('data-date'); dailySearch.value=''; dailyDateFilter=d; dailyFiltered=dailyData.filter(function(e){return e.date===d}); dailyPage=1; renderDaily(); showFilterChip(); closeCalendar(); dailyList.scrollIntoView({behavior:'smooth',block:'start'}); }); });
    }

    var dailyFilterChip = document.getElementById('dailyFilterChip');
    var dailyFilterLabel = document.getElementById('dailyFilterLabel');
    var dailyFilterClear = document.getElementById('dailyFilterClear');
    function showFilterChip() { if(dailyDateFilter){dailyFilterLabel.textContent=dailyDateFilter;dailyFilterChip.classList.add('show');} }
    function clearDateFilter() { dailyDateFilter=null; dailySearch.value=''; dailyFiltered=dailyData; dailyPage=1; dailyFilterChip.classList.remove('show'); renderDaily(); }
    dailyFilterClear.addEventListener('click', clearDateFilter);

    dailySearch.addEventListener('input', function() {
      if (dailyDateFilter) { dailyDateFilter = null; dailyFilterChip.classList.remove('show'); }
      if (!dailyLoaded) return;
      var q = this.value.toLowerCase().trim();
      if (q === '') { dailyFiltered = dailyData; }
      else { dailyFiltered = dailyData.filter(function(e) { return e.title.toLowerCase().indexOf(q)!==-1 || e.content.toLowerCase().indexOf(q)!==-1; }); }
      dailyPage = 1; renderDaily();
    });

    var _origSwitchTab = switchTab;
    switchTab = function(tabName, scrollTarget) {
      _origSwitchTab(tabName, scrollTarget);
      if (tabName === 'daily') loadDaily();
    };

    var _origApplyLang = applyLang;
    applyLang = function(lang) {
      _origApplyLang(lang);
      if (dailySearch) {
        dailySearch.placeholder = lang === 'zh'
          ? (dailySearch.getAttribute('data-lang-placeholder-zh') || '搜索日常内容…')
          : (dailySearch.getAttribute('data-lang-placeholder-en') || 'Search daily entries…');
      }
      
      if (dailyLoaded && dailyFiltered.length > 0) {
        var totalPages = Math.ceil(dailyFiltered.length / dailyPerPage);
        renderPagination(totalPages);
      }
      
      dailyList.querySelectorAll('[data-lang-zh]').forEach(function(el) {
        var text = lang === 'zh' ? el.getAttribute('data-lang-zh') : el.getAttribute('data-lang-en');
        if (text != null && text !== '') el.textContent = text;
      });
    };

    var verOverlay = document.getElementById('verOverlay');
    var verBtn = document.getElementById('versionBtn');
    var verClose = document.getElementById('verClose');
    var verBackdrop = verOverlay.querySelector('.ver-backdrop');

    function openVerOverlay() {
      if (!verOverlay) return;
      verOverlay.style.display = 'flex';
      verOverlay.classList.remove('closing');
      verOverlay.offsetHeight;
      verOverlay.classList.add('open');
    }
    function closeVerOverlay() {
      if (!verOverlay || !verOverlay.classList.contains('open')) return;
      verOverlay.classList.add('closing');
      verOverlay.classList.remove('open');
      setTimeout(function() {
        verOverlay.classList.remove('closing');
        verOverlay.style.display = 'none';
      }, 360);
    }
    verBtn.addEventListener('click', openVerOverlay);
    verClose.addEventListener('click', closeVerOverlay);
    verBackdrop.addEventListener('click', closeVerOverlay);
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && verOverlay.classList.contains('open')) closeVerOverlay();
    });

  })();
