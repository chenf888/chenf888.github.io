// badges.js – 徽章管理模块
(function() {
    'use strict';

    // ---------- 字符串模运算（支持任意长度数字） ----------
    function modString(digitsStr, divisor) {
        let remainder = 0;
        for (let i = 0; i < digitsStr.length; i++) {
            remainder = (remainder * 10 + (digitsStr.charCodeAt(i) - 48)) % divisor;
        }
        return remainder;
    }

    // ---------- 连续相同数字检测 ----------
    function hasConsecutiveSame(digitsStr, minRun) {
        let run = 1;
        for (let i = 1; i < digitsStr.length; i++) {
            if (digitsStr[i] === digitsStr[i - 1]) {
                run++;
                if (run >= minRun) return true;
            } else {
                run = 1;
            }
        }
        return minRun <= 1;
    }

    // ---------- 单调递增/递减检测 ----------
    function hasMonotonicRun(digitsStr, minRun, ascending) {
        let run = 1;
        for (let i = 1; i < digitsStr.length; i++) {
            const prev = digitsStr.charCodeAt(i - 1) - 48;
            const curr = digitsStr.charCodeAt(i) - 48;
            if (ascending && curr === prev + 1) {
                run++;
                if (run >= minRun) return true;
            } else if (!ascending && curr === prev - 1) {
                run++;
                if (run >= minRun) return true;
            } else {
                run = 1;
            }
        }
        return false;
    }

    // ---------- 回文片段检测 ----------
    function hasPalindromeSlice(digitsStr, minLen) {
        for (let i = 0; i <= digitsStr.length - minLen; i++) {
            let ok = true;
            for (let j = 0; j < Math.floor(minLen / 2); j++) {
                if (digitsStr[i + j] !== digitsStr[i + minLen - 1 - j]) {
                    ok = false;
                    break;
                }
            }
            if (ok) return true;
        }
        return false;
    }

    // ---------- 每位数字至少出现次数 ----------
    function everyDigitMinCount(digitsStr, minCount) {
        const counts = new Array(10).fill(0);
        for (let i = 0; i < digitsStr.length; i++) {
            counts[digitsStr.charCodeAt(i) - 48]++;
        }
        return counts.every(c => c >= minCount);
    }

    // ---------- 奇数位与偶数位数字之和相等 ----------
    function oddEvenSumEqual(digitsStr) {
        let oddSum = 0, evenSum = 0;
        for (let i = 0; i < digitsStr.length; i++) {
            const d = digitsStr.charCodeAt(i) - 48;
            if ((i + 1) % 2 === 1) oddSum += d;
            else evenSum += d;
        }
        return oddSum === evenSum;
    }

    // ---------- 徽章定义 ----------
    const BADGE_DEFS = [
        // 307 位专属徽章
        { id: 'leading-nonzero', name: '黄金开端', emoji: '👑', score: 5, rarity: '平庸',
            check: d => d[0] !== '0' },
        { id: 'triple-same', name: '三重奏', emoji: '🎰', score: 30, rarity: '平庸',
            check: d => hasConsecutiveSame(d, 3) },
        { id: 'quad-same', name: '四重奏', emoji: '🎵', score: 300, rarity: '普通',
            check: d => hasConsecutiveSame(d, 4) },
        { id: 'quint-same', name: '五连珠', emoji: '💎', score: 3000, rarity: '罕见',
            check: d => hasConsecutiveSame(d, 5) },
        { id: 'ascending-run', name: '递增阶梯', emoji: '📈', score: 100, rarity: '普通',
            check: d => hasMonotonicRun(d, 8, true) },
        { id: 'descending-run', name: '递减阶梯', emoji: '📉', score: 100, rarity: '普通',
            check: d => hasMonotonicRun(d, 8, false) },
        { id: 'palindromic-slice', name: '对称切片', emoji: '🪞', score: 10000, rarity: '稀有',
            check: d => hasPalindromeSlice(d, 7) },
        { id: 'digit-republic', name: '数字共和国', emoji: '🏛', score: 100000, rarity: '史诗',
            check: d => everyDigitMinCount(d, 18) },
        { id: 'perfect-balance', name: '完美平衡', emoji: '⚖', score: 2500, rarity: '罕见',
            check: d => oddEvenSumEqual(d) },

        // ---- 条件徽章 ----
        {
            id: 'multiple-of-three',
            name: '三的倍数',
            emoji: '➗3️⃣',
            score: 4,
            rarity: '平庸',
            check: d => modString(d, 3) === 0
        },
        {
            id: 'first-last-equal',
            name: '首尾相等',
            emoji: '☸',
            score: 10,
            rarity: '平庸',
            check: function(d) {
                const trimmed = d.replace(/^0+/, '');
                if (trimmed.length === 0) return false;
                return trimmed[0] === trimmed[trimmed.length - 1];
            }
        },
        {
            id: 'no-zero',
            name: '攻',
            emoji: '⚔',
            score: 3,
            rarity: '平庸',
            check: d => !d.includes('0')
        },
        {
            id: 'no-one',
            name: '受',
            emoji: '🎪',
            score: 3,
            rarity: '平庸',
            check: d => !d.includes('1')
        },
        {
            id: 'no-one-has-zero',
            name: '受受',
            emoji: '🎪🎪',
            score: 5,
            rarity: '平庸',
            check: function(digitsStr) {
                return !digitsStr.includes('1') && digitsStr.includes('0');
            }
        },
        {
            id: 'multiple-of-11',
            name: '11的倍数',
            emoji: '➗1️⃣1️⃣',
            score: 11,
            rarity: '普通',
            check: function(digitsStr) {
                let oddSum = 0, evenSum = 0;
                for (let i = 0; i < digitsStr.length; i++) {
                    const digit = digitsStr.charCodeAt(i) - 48;
                    if ((i + 1) % 2 === 1) { // 从1开始计数，奇数位
                        oddSum += digit;
                    } else {
                        evenSum += digit;
                    }
                }
                const diff = Math.abs(oddSum - evenSum);
                return diff % 11 === 0;
            }
        },
        {
            id: 'multiple-of-9',
            name: '9的倍数',
            emoji: '➗9️⃣',
            score: 9,
            rarity: '平庸',
            check: function(digitsStr) {
                let sum = 0;
                for (let i = 0; i < digitsStr.length; i++) {
                    sum += digitsStr.charCodeAt(i) - 48;
                }
                return sum % 9 === 0;
            }
        },
        {
            id: 'multiple-of-13',
            name: '13的倍数',
            emoji: '➗1️⃣3️⃣',
            score: 13,
            rarity: '普通',
            check: function(digitsStr) {
                if (digitsStr.length === 0) return false;
                return modString(digitsStr, 13) === 0;
            }
        },
        {
            id: 'multiple-of-17',
            name: '17的倍数',
            emoji: '➗1️⃣7️⃣',
            score: 17,
            rarity: '普通',
            check: function(digitsStr) {
                if (digitsStr.length === 0) return false;
                return modString(digitsStr, 17) === 0;
            }
        },
        {
            id: 'multiple-of-19',
            name: '19的倍数',
            emoji: '➗1️⃣9️⃣',
            score: 19,
            rarity: '普通',
            check: function(digitsStr) {
                if (digitsStr.length === 0) return false;
                return modString(digitsStr, 19) === 0;
            }
        },
                {
            id: 'multiple-of-23',
            name: '23的倍数',
            emoji: '➗2️⃣3️⃣',
            score: 23,
            rarity: '普通',
            check: function(digitsStr) {
                if (digitsStr.length === 0) return false;
                return modString(digitsStr, 23) === 0;
            }
        },
        {
            id: 'multiple-of-29',
            name: '29的倍数',
            emoji: '➗2️⃣9️⃣',
            score: 29,
            rarity: '普通',
            check: function(digitsStr) {
                if (digitsStr.length === 0) return false;
                return modString(digitsStr, 29) === 0;
            }
        },
        {
            id: 'multiple-of-7',
            name: '7的倍数',
            emoji: '➗7️⃣',
            score: 7,
            rarity: '平庸',
            check: function(digitsStr) {
                if (digitsStr.length === 0) return false;
                return modString(digitsStr, 7) === 0;
            }
        },
    ];

    // ---------- 全局状态 ----------
    let earnedBadges = [];        // 每个徽章对象：{ id, name, emoji, score, rarity, count }
    let totalTP = 0;
    let currentTP = 0;
    let currentNumberStr = '';
    let newBadgeIds = new Set();  // 本轮首次获得的徽章 id

    // ---------- DOM 引用 ----------
    let badgeListEl = null;
    let totalScoreSpan = null;
    let currentScoreSpan = null;

    // ---------- 初始化绑定 ----------
    function initBadgeUI(badgeListElement, totalScoreElement, currentScoreElement) {
        badgeListEl = badgeListElement;
        totalScoreSpan = totalScoreElement;
        currentScoreSpan = currentScoreElement || null;
        updateBadgeUI();
    }

    // ---------- 更新 UI ----------
    function updateBadgeUI() {
        if (!badgeListEl || !totalScoreSpan) return;
        totalScoreSpan.textContent = totalTP;
        if (currentScoreSpan) {
            currentScoreSpan.textContent = currentTP;
        }
        badgeListEl.innerHTML = '';

        const hasCurrentNumber = currentNumberStr && currentNumberStr.length > 0;

        earnedBadges.forEach(badge => {
            const def = BADGE_DEFS.find(d => d.id === badge.id);
            let isActive = false;
            if (hasCurrentNumber && def) {
                isActive = def.check(currentNumberStr);
            }

            const isNew = newBadgeIds.has(badge.id);
            const activeClass = isActive ? '' : 'badge-pill--inactive';
            const rarityClass = 'badge-pill--' + badge.rarity;

            const pill = document.createElement('span');
            pill.className = `badge-pill ${rarityClass} ${activeClass}`;

            const countDisplay = badge.count > 1 ? ` ×${badge.count}` : '';
            const newTag = isNew ? `<span class="badge-new">新！</span>` : '';

            pill.innerHTML = `
                <span class="badge-emoji">${badge.emoji}</span>
                <span class="badge-name">${badge.name}${countDisplay}</span>
                ${newTag}
                <span class="badge-rarity">${badge.rarity}</span>
                <span class="badge-score">+${badge.score.toLocaleString()}TP</span>
            `;

            badgeListEl.appendChild(pill);
        });
    }

    // ---------- 检查并颁发徽章（重复可叠加） ----------
    function checkAndAwardBadges(numberStr) {
        currentNumberStr = numberStr;
        currentTP = 0;
        const newlyEarnedIds = [];

        for (const def of BADGE_DEFS) {
            if (def.check(numberStr)) {
                currentTP += def.score;

                const existing = earnedBadges.find(b => b.id === def.id);
                if (existing) {
                    existing.count += 1;
                    totalTP += def.score;
                } else {
                    earnedBadges.push({
                        id: def.id,
                        name: def.name,
                        emoji: def.emoji,
                        score: def.score,
                        rarity: def.rarity,
                        count: 1
                    });
                    totalTP += def.score;
                    newlyEarnedIds.push(def.id);
                }
            }
        }

        newBadgeIds = new Set(newlyEarnedIds);
        updateBadgeUI();
    }

    // ---------- 重置徽章 ----------
    function resetBadges() {
        earnedBadges = [];
        totalTP = 0;
        currentTP = 0;
        currentNumberStr = '';
        newBadgeIds.clear();
        updateBadgeUI();
    }

    // ---------- 暴露全局接口 ----------
    window.Badges = {
        initBadgeUI,
        checkAndAwardBadges,
        resetBadges,
        getEarnedBadges: () => earnedBadges.slice(),
        getTotalTP: () => totalTP,
        getCurrentTP: () => currentTP,
    };
})();