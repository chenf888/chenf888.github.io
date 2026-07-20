// app.js – 主应用逻辑（数字生成、揭示、按钮交互）
(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        // ---------- 检查必要元素 ----------
        const container = document.getElementById('digitsContainer');
        if (!container) {
            console.error('Error: Required element #digitsContainer not found in DOM.');
            return;
        }
        const btn = document.getElementById('generateBtn');
        if (!btn) {
            console.error('Error: Required element #generateBtn not found.');
            return;
        }
        const card = document.getElementById('numberCard');
        if (!card) {
            console.error('Error: Required element #numberCard not found.');
            return;
        }
        const badgeList = document.getElementById('badgeList');
        const currentScoreSpan = document.getElementById('currentScore');
        const totalScoreSpan = document.getElementById('totalScore');

        // ---------- 初始化徽章模块 ----------
        if (window.Badges && typeof window.Badges.initBadgeUI === 'function') {
            if (badgeList && totalScoreSpan) {
                window.Badges.initBadgeUI(badgeList, totalScoreSpan, currentScoreSpan);
            } else {
                console.warn('Badge UI elements missing, skipping badge initialization.');
            }
        } else {
            console.warn('Badges module not loaded properly.');
        }

        const TOTAL_DIGITS = 307;

        // ---------- 创建数字占位 ----------
        let digitEls = createDigitSpans(TOTAL_DIGITS);
        let isGenerating = false;

        function createDigitSpans(count) {
            const frag = document.createDocumentFragment();
            for (let i = 0; i < count; i++) {
                const span = document.createElement('span');
                span.className = 'digit';
                span.textContent = '?';
                span.dataset.index = i;
                frag.appendChild(span);
            }
            container.appendChild(frag);
            return container.querySelectorAll('.digit');
        }

        function generateRandomNDigit() {
            let result = '';
            for (let i = 0; i < TOTAL_DIGITS; i++) {
                result += Math.floor(Math.random() * 10);
            }
            return result;
        }

        function resetDigits() {
            digitEls.forEach(el => {
                el.textContent = '?';
                el.className = 'digit';
            });
            card.classList.remove('number-card--glow');
            card.style.borderColor = '';
        }

        // ---------- 批量揭示（适配307位） ----------
        function revealNumber(numberStr) {
            return new Promise((resolve) => {
                const digits = numberStr.split('');
                const total = digits.length;
                const BATCH_SIZE = 20;
                const MAX_FLICKER = 3;
                const FLICKER_INTERVAL = 30;

                // 前导零遮罩（有效位之前的零标记为 leading-zero）
                const leadingZeroMask = new Array(total).fill(false);
                let foundNonZero = false;
                for (let i = 0; i < total - 1; i++) {
                    if (digits[i] === '0' && !foundNonZero) {
                        leadingZeroMask[i] = true;
                    } else {
                        foundNonZero = true;
                    }
                }

                // 所有位设为占位符
                digitEls.forEach(el => {
                    el.textContent = '·';
                    el.className = 'digit';
                });

                const totalBatches = Math.ceil(total / BATCH_SIZE);
                let batchIdx = totalBatches - 1; // 从右向左

                function revealBatch() {
                    if (batchIdx < 0) { resolve(); return; }

                    const start = batchIdx * BATCH_SIZE;
                    const end = Math.min(start + BATCH_SIZE, total);
                    let flickerCount = 0;

                    const flickerInterval = setInterval(() => {
                        if (flickerCount < MAX_FLICKER - 1) {
                            // 闪烁阶段：该批次所有位一起随机
                            for (let i = start; i < end; i++) {
                                digitEls[i].textContent = Math.floor(Math.random() * 10);
                                digitEls[i].className = 'digit digit--active';
                            }
                        } else {
                            // 定格阶段
                            for (let i = start; i < end; i++) {
                                digitEls[i].textContent = digits[i];
                                if (leadingZeroMask[i]) {
                                    digitEls[i].className = 'digit digit--leading-zero';
                                    digitEls[i].style.transform = 'scale(0.92)';
                                } else {
                                    digitEls[i].className = 'digit digit--revealed';
                                }
                            }
                            clearInterval(flickerInterval);
                            // 发光脉冲
                            card.classList.add('number-card--glow');
                            clearTimeout(card._borderTimer);
                            card._borderTimer = setTimeout(() => {
                                card.classList.remove('number-card--glow');
                            }, 400);
                            batchIdx--;
                            setTimeout(revealBatch, 10);
                        }
                        flickerCount++;
                    }, FLICKER_INTERVAL);
                }

                revealBatch();
            });
        }

        // ---------- 主流程 ----------
        async function handleGenerate() {
            if (isGenerating) return;

            isGenerating = true;
            btn.disabled = true;
            btn.classList.add('is-loading');

            resetDigits();
            await new Promise(resolve => setTimeout(resolve, 200));

            const numStr = generateRandomNDigit();
            await revealNumber(numStr);

            // 调用徽章检查
            if (window.Badges && typeof window.Badges.checkAndAwardBadges === 'function') {
                window.Badges.checkAndAwardBadges(numStr);
            } else {
                console.warn('Badges module not available');
            }

            btn.disabled = false;
            btn.classList.remove('is-loading');
            isGenerating = false;

            if (navigator.vibrate) navigator.vibrate(12);
        }

        // ---------- 事件绑定 ----------
        btn.addEventListener('click', handleGenerate);
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleGenerate();
            }
        });

        // 初始加载后自动生成一次
        resetDigits();
        setTimeout(handleGenerate, 1000);
    });
})();