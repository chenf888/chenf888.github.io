// app.js – CFRNGdlePlus 307 位主逻辑
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        // ========== 元素引用 ==========
        var container = document.getElementById('digitsContainer');
        var btn = document.getElementById('generateBtn');
        var card = document.getElementById('numberCard');
        if (!container || !btn || !card) return;

        var badgeList = document.getElementById('badgeList');
        var totalScoreSpan = document.getElementById('totalScore');
        var currentScoreSpan = document.getElementById('currentScore');
        var rollCountSpan = document.getElementById('rollCount');
        var bestRollNumSpan = document.getElementById('bestRollNum');
        var bestRollTPSpan = document.getElementById('bestRollTP');
        var bestRollBox = document.getElementById('bestRollBox');

        // ========== 初始化徽章模块 ==========
        if (window.Badges && typeof window.Badges.initBadgeUI === 'function') {
            window.Badges.initBadgeUI(badgeList, totalScoreSpan, currentScoreSpan, rollCountSpan, bestRollNumSpan, bestRollTPSpan, bestRollBox);
        }

        var TOTAL_DIGITS = 307;
        var BATCH_SIZE = 20;
        var MAX_FLICKER = 3;
        var FLICKER_INTERVAL = 30;

        // ========== 创建数字占位 ==========
        var digitEls = [];
        var frag = document.createDocumentFragment();
        for (var i = 0; i < TOTAL_DIGITS; i++) {
            var span = document.createElement('span');
            span.className = 'digit';
            span.textContent = '?';
            span.dataset.index = i;
            frag.appendChild(span);
        }
        container.appendChild(frag);
        digitEls = container.querySelectorAll('.digit');

        // ========== 生成 307 位随机数 ==========
        function generateRandomNDigit() {
            var result = '';
            for (var i = 0; i < TOTAL_DIGITS; i++) {
                result += Math.floor(Math.random() * 10);
            }
            return result;
        }

        var isGenerating = false;

        function resetDigits() {
            for (var i = 0; i < digitEls.length; i++) {
                digitEls[i].textContent = '?';
                digitEls[i].className = 'digit';
            }
            card.classList.remove('number-card--glow');
            card.style.borderColor = '';
        }

        function displayNumber(numberStr) {
            var digits = numberStr.split('');
            for (var i = 0; i < digitEls.length; i++) {
                digitEls[i].textContent = digits[i];
                digitEls[i].className = 'digit digit--revealed';
            }
            // 前导零处理
            var trimmed = numberStr.replace(/^0+/, '');
            var leadingZeroCount = numberStr.length - trimmed.length;
            for (var i = 0; i < leadingZeroCount && i < TOTAL_DIGITS - 1; i++) {
                digitEls[i].className = 'digit digit--leading-zero';
                digitEls[i].style.transform = 'scale(0.92)';
            }
            card.classList.add('number-card--glow');
            setTimeout(function() { card.classList.remove('number-card--glow'); }, 400);
        }

        // ========== 批量揭示（从右向左） ==========
        function revealNumber(numberStr) {
            return new Promise(function(resolve) {
                var digits = numberStr.split('');
                var total = digits.length;
                var leadingZeroMask = [];
                var foundNonZero = false;
                for (var i = 0; i < total - 1; i++) {
                    if (digits[i] === '0' && !foundNonZero) { leadingZeroMask[i] = true; }
                    else { foundNonZero = true; }
                }

                for (var i = 0; i < digitEls.length; i++) {
                    digitEls[i].textContent = '\u00b7';
                    digitEls[i].className = 'digit';
                }

                var totalBatches = Math.ceil(total / BATCH_SIZE);
                var batchIdx = totalBatches - 1;

                function revealBatch() {
                    if (batchIdx < 0) { resolve(); return; }
                    var start = batchIdx * BATCH_SIZE;
                    var end = Math.min(start + BATCH_SIZE, total);
                    var flickerCount = 0;

                    var flickerInterval = setInterval(function() {
                        if (flickerCount < MAX_FLICKER - 1) {
                            for (var i = start; i < end; i++) {
                                digitEls[i].textContent = Math.floor(Math.random() * 10);
                                digitEls[i].className = 'digit digit--active';
                            }
                        } else {
                            for (var i = start; i < end; i++) {
                                digitEls[i].textContent = digits[i];
                                if (leadingZeroMask[i]) {
                                    digitEls[i].className = 'digit digit--leading-zero';
                                    digitEls[i].style.transform = 'scale(0.92)';
                                } else {
                                    digitEls[i].className = 'digit digit--revealed';
                                }
                            }
                            clearInterval(flickerInterval);
                            card.classList.add('number-card--glow');
                            clearTimeout(card._borderTimer);
                            card._borderTimer = setTimeout(function() { card.classList.remove('number-card--glow'); }, 400);
                            batchIdx--;
                            setTimeout(revealBatch, 10);
                        }
                        flickerCount++;
                    }, FLICKER_INTERVAL);
                }
                revealBatch();
            });
        }

        // ========== 主流程 ==========
        var handleGenerate = async function() {
            if (isGenerating) return;

            isGenerating = true;
            btn.disabled = true;
            btn.classList.add('is-loading');

            resetDigits();
            await new Promise(function(r) { setTimeout(r, 200); });

            var numStr = generateRandomNDigit();
            window.__currentNumber = numStr;
            await revealNumber(numStr);

            if (window.Badges && typeof window.Badges.checkAndAwardBadges === 'function') {
                window.Badges.checkAndAwardBadges(numStr);
            }

            btn.disabled = false;
            btn.classList.remove('is-loading');
            isGenerating = false;

            if (navigator.vibrate) navigator.vibrate(12);
        };

        btn.addEventListener('click', handleGenerate);

        // 初始加载后自动生成一次
        resetDigits();
        setTimeout(handleGenerate, 1000);

        // ========== 双经典切换（双击最佳行） ==========
        var isShowingBest = false;
        var savedCurrentNumber = '';

        var bestRollBoxEl = document.getElementById('bestRollBox');
        if (bestRollBoxEl) {
            bestRollBoxEl.addEventListener('dblclick', function() {
                if (isGenerating) return;
                var best = window.Badges && window.Badges.getBest ? window.Badges.getBest() : null;
                if (!best || !best.number) return;
                if (isShowingBest) {
                    if (savedCurrentNumber) {
                        displayNumber(savedCurrentNumber);
                        window.Badges.previewNumber(savedCurrentNumber);
                    }
                    isShowingBest = false;
                    savedCurrentNumber = '';
                } else {
                    savedCurrentNumber = window.__currentNumber || '';
                    if (!savedCurrentNumber) return;
                    displayNumber(best.number);
                    window.Badges.previewNumber(best.number);
                    isShowingBest = true;
                }
            });
        }

        // 生成时自动退出最佳模式
        var origHandleGenerate = handleGenerate;
        handleGenerate = function() {
            if (isShowingBest) { isShowingBest = false; savedCurrentNumber = ''; }
            return origHandleGenerate();
        };

        // ========== 主题切换 ==========
        (function initTheme() {
            var STORAGE_KEY = 'cfrngdleplus_theme';
            var saved = localStorage.getItem(STORAGE_KEY) || 'dark';
            document.documentElement.setAttribute('data-theme', saved);
            var themeBtn = document.getElementById('themeToggle');
            if (themeBtn) {
                themeBtn.addEventListener('click', function() {
                    var current = document.documentElement.getAttribute('data-theme');
                    var next = current === 'light' ? 'dark' : 'light';
                    document.documentElement.setAttribute('data-theme', next);
                    localStorage.setItem(STORAGE_KEY, next);
                });
            }
        })();

        // ========== 重置按钮 ==========
        (function initReset() {
            var resetBtn = document.getElementById('resetBtn');
            if (!resetBtn) return;
            resetBtn.addEventListener('click', function() {
                if (confirm('\u786e\u5b9a\u8981\u91cd\u7f6e\u6240\u6709\u6570\u636e\u5417\uff1f\u6b64\u64cd\u4f5c\u4e0d\u53ef\u64a4\u9500\u3002')) {
                    if (window.Badges && window.Badges.resetBadges) window.Badges.resetBadges();
                    isShowingBest = false;
                    savedCurrentNumber = '';
                    window.__currentNumber = '';
                    resetDigits();
                }
            });
        })();

        // ========== 自动随机按钮 ==========
        (function initAuto() {
            var autoBtn = document.getElementById('autoBtn');
            if (!autoBtn) return;
            var autoRunning = false;
            var autoTimer = null;
            var AUTO_COOLDOWN = 500;

            function runAuto() {
                if (!autoRunning) return;
                if (!isGenerating) {
                    handleGenerate();
                    autoTimer = setTimeout(runAuto, AUTO_COOLDOWN);
                } else {
                    autoTimer = setTimeout(runAuto, 50);
                }
            }

            autoBtn.addEventListener('click', function() {
                if (autoRunning) {
                    autoRunning = false;
                    autoBtn.classList.remove('is-running');
                    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
                } else {
                    autoRunning = true;
                    autoBtn.classList.add('is-running');
                    if (!isGenerating) handleGenerate();
                    autoTimer = setTimeout(runAuto, AUTO_COOLDOWN);
                }
            });
        })();

        // ========== 仅当前切换 ==========
        (function initToggleActive() {
            var toggleActiveBtn = document.getElementById('toggleActiveBtn');
            var toggleActiveValue = document.getElementById('toggleActiveValue');
            if (toggleActiveBtn && toggleActiveValue && window.Badges && window.Badges.toggleShowActiveOnly) {
                var initialActive = window.Badges.getShowActiveOnly();
                if (initialActive) {
                    toggleActiveValue.textContent = '\u5f53\u524d';
                    toggleActiveValue.style.color = '#fbbf24';
                }
                toggleActiveBtn.addEventListener('click', function() {
                    window.Badges.toggleShowActiveOnly();
                    var now = window.Badges.getShowActiveOnly();
                    toggleActiveValue.textContent = now ? '\u5f53\u524d' : '\u5168\u90e8';
                    toggleActiveValue.style.color = now ? '#fbbf24' : '';
                });
            }
        })();

        // ========== 分享按钮 ==========
        (function initShare() {
            var shareBtn = document.getElementById('shareBtn');
            if (!shareBtn) return;

            var RARITY_EMOJI = {
                '\u7ec8\u7ed3': '\uD83D\uDFE5',
                '\u8d85\u8d8a': '\uD83D\uDD35',
                '\u795e\u8bdd': '\uD83D\uDFE2',
                '\u4f20\u8bf4': '\uD83D\uDC96',
                '\u53f2\u8bd7': '\uD83D\uDFE8',
                '\u7a00\u6709': '\uD83D\uDFE3',
                '\u7f55\u89c1': '\uD83D\uDFE6',
                '\u666e\u901a': '\uD83D\uDFE9',
                '\u5e73\u5eb8': '\u2B1C'
            };
            var RARITY_ORDER = ['\u7ec8\u7ed3','\u8d85\u8d8a','\u795e\u8bdd','\u4f20\u8bf4','\u53f2\u8bd7','\u7a00\u6709','\u7f55\u89c1','\u666e\u901a','\u5e73\u5eb8'];

            var toast = document.getElementById('toast');
            var copiedTimer = null;

            shareBtn.addEventListener('click', function() {
                var currentNum = window.Badges && window.Badges.getCurrentNumberStr ? window.Badges.getCurrentNumberStr() : '';
                var totalTP = window.Badges && window.Badges.getTotalTP ? window.Badges.getTotalTP() : 0;
                var activeBadges = window.Badges && window.Badges.getCurrentActiveBadges ? window.Badges.getCurrentActiveBadges() : [];

                // 格式化数字：去前导零，前15 + … + 后15 + (有效位数)
                var displayNum = currentNum;
                if (currentNum && currentNum.length > 35) {
                    var trimmed = currentNum.replace(/^0+/, '') || '0';
                    displayNum = trimmed.substring(0, 15) + '…' + trimmed.substring(trimmed.length - 15) + ' (' + trimmed.length + '位)';
                }

                var lines = [];
                lines.push('CFRNGDLEPlus 307');
                lines.push('\uD83C\uDFB2' + (displayNum || '---'));
                lines.push('');

                // 按稀有度排序（从高到低）
                var sorted = activeBadges.slice().sort(function(a, b) {
                    return RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity);
                });

                var topN = 4;
                var showBadges = sorted.slice(0, topN);
                for (var i = 0; i < showBadges.length; i++) {
                    var b = showBadges[i];
                    var rarityEmoji = RARITY_EMOJI[b.rarity] || '\u2B1C';
                    lines.push(rarityEmoji + ' ' + b.emoji + ' ' + b.name);
                }
                var remaining = sorted.length - topN;
                if (remaining > 0) {
                    lines.push('+' + remaining + ' more');
                }

                lines.push('');
                lines.push(totalTP.toLocaleString() + ' TP');
                lines.push('https://chenf888.github.io/CFRNGdlePlus/');

                var text = lines.join('\n');
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(function() {
                        shareBtn.classList.add('is-copied');
                        if (toast) { toast.classList.add('toast--show'); setTimeout(function() { toast.classList.remove('toast--show'); }, 1800); }
                        if (copiedTimer) clearTimeout(copiedTimer);
                        copiedTimer = setTimeout(function() { shareBtn.classList.remove('is-copied'); }, 2000);
                    }).catch(function() { fallbackCopy(text); });
                } else {
                    fallbackCopy(text);
                }
                function fallbackCopy(t) {
                    var ta = document.createElement('textarea');
                    ta.value = t; ta.style.position = 'fixed'; ta.style.left = '-9999px';
                    document.body.appendChild(ta);
                    ta.select();
                    try { document.execCommand('copy'); } catch(e) {}
                    document.body.removeChild(ta);
                    shareBtn.classList.add('is-copied');
                    if (toast) { toast.classList.add('toast--show'); setTimeout(function() { toast.classList.remove('toast--show'); }, 1800); }
                    if (copiedTimer) clearTimeout(copiedTimer);
                    copiedTimer = setTimeout(function() { shareBtn.classList.remove('is-copied'); }, 2000);
                }
            });        })();
    });
})();
