// badges.js – 徽章管理模块（307位 + 完整基础设施）
(function() {
    'use strict';

    var RARITY_ORDER = ['终结','超越','神话','传说','史诗','稀有','罕见','普通','平庸'];
    var DISPLAY_LIMIT = 20;

    function rarityRank(rarity) {
        var idx = RARITY_ORDER.indexOf(rarity);
        return idx === -1 ? RARITY_ORDER.length : idx;
    }

    // ========== 307 位工具函数 ==========
    function modString(digitsStr, divisor) {
        var remainder = 0;
        for (var i = 0; i < digitsStr.length; i++) {
            remainder = (remainder * 10 + (digitsStr.charCodeAt(i) - 48)) % divisor;
        }
        return remainder;
    }

    function hasConsecutiveSame(digitsStr, minRun) {
        var run = 1;
        for (var i = 1; i < digitsStr.length; i++) {
            if (digitsStr[i] === digitsStr[i - 1]) { run++; if (run >= minRun) return true; }
            else run = 1;
        }
        return minRun <= 1;
    }

    function hasMonotonicRun(digitsStr, minRun, ascending) {
        var run = 1;
        for (var i = 1; i < digitsStr.length; i++) {
            var prev = digitsStr.charCodeAt(i - 1) - 48;
            var curr = digitsStr.charCodeAt(i) - 48;
            if (ascending && curr === prev + 1) { run++; if (run >= minRun) return true; }
            else if (!ascending && curr === prev - 1) { run++; if (run >= minRun) return true; }
            else run = 1;
        }
        return false;
    }

    function hasPalindromeSlice(digitsStr, minLen) {
        for (var i = 0; i <= digitsStr.length - minLen; i++) {
            var ok = true;
            for (var j = 0; j < Math.floor(minLen / 2); j++) {
                if (digitsStr[i + j] !== digitsStr[i + minLen - 1 - j]) { ok = false; break; }
            }
            if (ok) return true;
        }
        return false;
    }

    function everyDigitMinCount(digitsStr, minCount) {
        var counts = [0,0,0,0,0,0,0,0,0,0];
        for (var i = 0; i < digitsStr.length; i++) {
            counts[digitsStr.charCodeAt(i) - 48]++;
        }
        for (var d = 0; d < 10; d++) { if (counts[d] < minCount) return false; }
        return true;
    }

    function oddEvenSumEqual(digitsStr) {
        var oddSum = 0, evenSum = 0;
        for (var i = 0; i < digitsStr.length; i++) {
            var d = digitsStr.charCodeAt(i) - 48;
            if ((i + 1) % 2 === 1) oddSum += d; else evenSum += d;
        }
        return oddSum === evenSum;
    }
    // 任意数字出现 ≥ minCount 次
    function hasDigitMinCount(digitsStr, minCount) {
        var counts = [0,0,0,0,0,0,0,0,0,0];
        for (var i = 0; i < digitsStr.length; i++) { counts[digitsStr.charCodeAt(i) - 48]++; }
        for (var d = 0; d < 10; d++) { if (counts[d] >= minCount) return true; }
        return false;
    }

    // 每个数字出现次数在 [lo, hi] 内
    function everyDigitInRange(digitsStr, lo, hi) {
        var counts = [0,0,0,0,0,0,0,0,0,0];
        for (var i = 0; i < digitsStr.length; i++) { counts[digitsStr.charCodeAt(i) - 48]++; }
        for (var d = 0; d < 10; d++) { if (counts[d] < lo || counts[d] > hi) return false; }
        return true;
    }

    // 前 firstN 位 == 后 firstN 位的逆序
    function firstLastMirror(digitsStr, firstN) {
        if (digitsStr.length < firstN * 2) return false;
        for (var i = 0; i < firstN; i++) {
            if (digitsStr[i] !== digitsStr[digitsStr.length - 1 - i]) return false;
        }
        return true;
    }

    // 前后半数字之和相等
    function halfSumEqual(digitsStr) {
        var half = Math.floor(digitsStr.length / 2);
        var left = 0, right = 0;
        for (var i = 0; i < half; i++) left += digitsStr.charCodeAt(i) - 48;
        var start = digitsStr.length % 2 === 0 ? half : half + 1;
        for (var i = start; i < digitsStr.length; i++) right += digitsStr.charCodeAt(i) - 48;
        return left === right;
    }

    // 整个数字是回文
    function isFullPalindrome(digitsStr) {
        for (var i = 0, j = digitsStr.length - 1; i < j; i++, j--) {
            if (digitsStr[i] !== digitsStr[j]) return false;
        }
        return true;
    }

    // 区间 [start, end) 是回文
    function isRangePalindrome(digitsStr, start, end) {
        for (var i = start, j = end - 1; i < j; i++, j--) {
            if (digitsStr[i] !== digitsStr[j]) return false;
        }
        return true;
    }

    // 质数判定（BigInt Miller-Rabin + 小质数试除）
    function isPrime(digitsStr) {
        var last = digitsStr.charCodeAt(digitsStr.length - 1) - 48;
        if (last % 2 === 0 || last === 5) return false;
        if (digitsStr === '2' || digitsStr === '3' || digitsStr === '5') return true;
        var sum = 0;
        for (var i = 0; i < digitsStr.length; i++) sum += digitsStr.charCodeAt(i) - 48;
        if (sum % 3 === 0) return false;
        // 小质数试除
        var smallPrimes = [7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199];
        for (var p = 0; p < smallPrimes.length; p++) {
            if (digitsStr === String(smallPrimes[p])) return true;
            if (modString(digitsStr, smallPrimes[p]) === 0) return false;
        }
        // BigInt Miller-Rabin（9 个基）
        if (typeof BigInt !== 'function') {
            // 无 BigInt 回退：再做几轮试除
            for (var pp = 211; pp <= 1000; pp += 2) {
                if (pp % 3 === 0 || pp % 5 === 0 || pp % 7 === 0) continue;
                if (modString(digitsStr, pp) === 0) return false;
            }
            return true; // 可能是质数
        }
        try {
            var n = BigInt(digitsStr);
            var bases = [2n,3n,5n,7n,11n,13n,17n,19n,23n];
            var n1 = n - 1n;
            var d = n1;
            var s = 0;
            while (d % 2n === 0n) { d = d / 2n; s++; }
            for (var b = 0; b < bases.length; b++) {
                var a = bases[b];
                if (a >= n) continue;
                var x = modPowBI(a, d, n);
                if (x === 1n || x === n1) continue;
                var composite = true;
                for (var r = 0; r < s - 1; r++) {
                    x = (x * x) % n;
                    if (x === n1) { composite = false; break; }
                }
                if (composite) return false;
            }
            return true;
        } catch(e) { return false; }
    }

    function modPowBI(base, exp, mod) {
        var result = 1n;
        base = base % mod;
        while (exp > 0n) {
            if (exp % 2n === 1n) result = (result * base) % mod;
            exp = exp / 2n;
            base = (base * base) % mod;
        }
        return result;
    }

    // ========== 徽章定义（307 位专属） ==========
    window.BadgeDefs = [
        { id: 'leading-nonzero', name: '黄金开端', emoji: '👑', score: 5, rarity: '平庸',
            check: function(d) { return d[0] !== '0'; } },
        { id: 'triple-same', name: '三重奏', emoji: '🎰', score: 30, rarity: '平庸',
            check: function(d) { return hasConsecutiveSame(d, 3); } },
        { id: 'quad-same', name: '四重奏', emoji: '🎵', score: 300, rarity: '普通',
            check: function(d) { return hasConsecutiveSame(d, 4); } },
        { id: 'quint-same', name: '五连珠', emoji: '💎', score: 3000, rarity: '罕见',
            check: function(d) { return hasConsecutiveSame(d, 5); } },
        { id: 'ascending-run', name: '递增阶梯', emoji: '📈', score: 100, rarity: '普通',
            check: function(d) { return hasMonotonicRun(d, 8, true); } },
        { id: 'descending-run', name: '递减阶梯', emoji: '📉', score: 100, rarity: '普通',
            check: function(d) { return hasMonotonicRun(d, 8, false); } },
        { id: 'palindromic-slice', name: '对称切片', emoji: '🪞', score: 10000, rarity: '史诗',
            check: function(d) { return hasPalindromeSlice(d, 7); } },
        { id: 'digit-republic', name: '数字共和国', emoji: '🏛', score: 1000, rarity: '罕见',
            check: function(d) { return everyDigitMinCount(d, 18); } },
        { id: 'perfect-balance', name: '完美平衡', emoji: '⚖', score: 2500, rarity: '罕见',
            check: function(d) { return oddEvenSumEqual(d); } },

        { id: 'multiple-of-three', name: '三的倍数', emoji: '➗3️⃣', score: 4, rarity: '平庸',
            check: function(d) { return modString(d, 3) === 0; } },
        { id: 'first-last-equal', name: '首尾相等', emoji: '☸', score: 10, rarity: '平庸',
            check: function(d) { var t = d.replace(/^0+/, ''); return t.length > 0 && t[0] === t[t.length - 1]; } },
        { id: 'no-zero', name: '攻', emoji: '⚔', score: 3, rarity: '平庸',
            check: function(d) { return !d.includes('0'); } },
        { id: 'no-one', name: '受', emoji: '🎪', score: 3, rarity: '平庸',
            check: function(d) { return !d.includes('1'); } },
        { id: 'no-one-has-zero', name: '受受', emoji: '🎪🎪', score: 5, rarity: '平庸',
            check: function(d) { return !d.includes('1') && d.includes('0'); } },
        { id: 'multiple-of-11', name: '11的倍数', emoji: '➗1️⃣1️⃣', score: 11, rarity: '普通',
            check: function(d) { var o=0,e=0; for(var i=0;i<d.length;i++){var v=d.charCodeAt(i)-48;if((i+1)%2===1)o+=v;else e+=v;} return Math.abs(o-e)%11===0; } },
        { id: 'multiple-of-9', name: '9的倍数', emoji: '➗9️⃣', score: 9, rarity: '平庸',
            check: function(d) { var s=0;for(var i=0;i<d.length;i++)s+=d.charCodeAt(i)-48;return s%9===0; } },
        { id: 'multiple-of-13', name: '13的倍数', emoji: '➗1️⃣3️⃣', score: 13, rarity: '普通',
            check: function(d) { return modString(d, 13) === 0; } },
        { id: 'multiple-of-17', name: '17的倍数', emoji: '➗1️⃣7️⃣', score: 17, rarity: '普通',
            check: function(d) { return modString(d, 17) === 0; } },
        { id: 'multiple-of-19', name: '19的倍数', emoji: '➗1️⃣9️⃣', score: 19, rarity: '普通',
            check: function(d) { return modString(d, 19) === 0; } },
        { id: 'multiple-of-23', name: '23的倍数', emoji: '➗2️⃣3️⃣', score: 23, rarity: '普通',
            check: function(d) { return modString(d, 23) === 0; } },
        { id: 'multiple-of-29', name: '29的倍数', emoji: '➗2️⃣9️⃣', score: 29, rarity: '普通',
            check: function(d) { return modString(d, 29) === 0; } },
        { id: 'multiple-of-7', name: '7的倍数', emoji: '➗7️⃣', score: 7, rarity: '平庸',
            check: function(d) { return modString(d, 7) === 0; } },
        { id: 'hex-same', name: '六连珠', emoji: '🔮', score: 30000, rarity: '罕见',
            check: function(d) { return hasConsecutiveSame(d, 6); } },
        { id: 'dozen-ascend', name: '天梯', emoji: '🪜', score: 8000, rarity: '罕见',
            check: function(d) { return hasMonotonicRun(d, 12, true); } },
        { id: 'dozen-descend', name: '瀑布', emoji: '🌊', score: 8000, rarity: '罕见',
            check: function(d) { return hasMonotonicRun(d, 12, false); } },
        { id: 'digit-overlord', name: '数字霸王', emoji: '🦖', score: 15000, rarity: '罕见',
            check: function(d) { return hasDigitMinCount(d, 50); } },
        { id: 'mid-palindrome', name: '镜中世界', emoji: '🪟', score: 30000, rarity: '罕见',
            check: function(d) { return hasPalindromeSlice(d, 12); } },
        { id: 'multiple-of-97', name: '97的倍数', emoji: '➗9️⃣7️⃣', score: 97, rarity: '罕见',
            check: function(d) { return modString(d, 97) === 0; } },
        { id: 'sept-same', name: '七连珠', emoji: '🌈', score: 300000, rarity: '稀有',
            check: function(d) { return hasConsecutiveSame(d, 7); } },
        { id: 'long-palindrome', name: '长镜', emoji: '🔭', score: 150000, rarity: '稀有',
            check: function(d) { return hasPalindromeSlice(d, 18); } },
        { id: 'long-ascend', name: '登天', emoji: '🚀', score: 80000, rarity: '稀有',
            check: function(d) { return hasMonotonicRun(d, 15, true); } },
        { id: 'long-descend', name: '坠渊', emoji: '🕳', score: 80000, rarity: '稀有',
            check: function(d) { return hasMonotonicRun(d, 15, false); } },
        { id: 'first-last-mirror', name: '首尾镜', emoji: '🦋', score: 60000, rarity: '稀有',
            check: function(d) { return firstLastMirror(d, 10); } },
        { id: 'digit-king', name: '数字之王', emoji: '🦁', score: 100000, rarity: '稀有',
            check: function(d) { return hasDigitMinCount(d, 60); } },
        { id: 'oct-same', name: '八连珠', emoji: '⚡', score: 3000000, rarity: '史诗',
            check: function(d) { return hasConsecutiveSame(d, 8); } },
        { id: 'mega-palindrome', name: '巨型回文', emoji: '🌀', score: 1000000, rarity: '史诗',
            check: function(d) { return hasPalindromeSlice(d, 25); } },
        { id: 'digit-empire-25', name: '数字帝国', emoji: '🏰', score: 80000, rarity: '稀有',
            check: function(d) { return everyDigitMinCount(d, 28); } },
        { id: 'half-sum-equal', name: '天平', emoji: '🏋', score: 200000, rarity: '史诗',
            check: function(d) { return halfSumEqual(d); } },
        { id: 'multiple-of-1009', name: '1009的倍数', emoji: '➗1️⃣0️⃣0️⃣9️⃣', score: 1009, rarity: '史诗',
            check: function(d) { return modString(d, 1009) === 0; } },
        { id: 'nona-same', name: '九连珠', emoji: '🌠', score: 30000000, rarity: '传说',
            check: function(d) { return hasConsecutiveSame(d, 9); } },
        { id: 'giant-palindrome', name: '回文巨兽', emoji: '🐉', score: 20000000, rarity: '传说',
            check: function(d) { return hasPalindromeSlice(d, 40); } },
        { id: 'digit-utopia', name: '数字乌托邦', emoji: '🌟', score: 500000, rarity: '传说',
            check: function(d) { return everyDigitInRange(d, 28, 35); } },
        { id: 'giant-ascend', name: '通天梯', emoji: '🗼', score: 12000000, rarity: '传说',
            check: function(d) { return hasMonotonicRun(d, 20, true); } },
        { id: 'head-50-pal', name: '半百回文', emoji: '🎭', score: 40000000, rarity: '传说',
            check: function(d) { return isRangePalindrome(d, 0, 50); } },
        { id: 'deca-same', name: '十连星', emoji: '💫', score: 300000000, rarity: '神话',
            check: function(d) { return hasConsecutiveSame(d, 10); } },
        { id: 'huge-palindrome', name: '回文巨像', emoji: '🗿', score: 200000000, rarity: '神话',
            check: function(d) { return hasPalindromeSlice(d, 60); } },
        { id: 'full-palindrome', name: '完美镜面', emoji: '♾', score: 1000000000, rarity: '神话',
            check: function(d) { return isFullPalindrome(d); } },
        { id: 'prime-307', name: '307位质数', emoji: '🔐', score: 500000000, rarity: '神话',
            check: function(d) { return isPrime(d); } },
        { id: 'eleven-same', name: '十一连星', emoji: '🌌', score: 3000000000, rarity: '超越',
            check: function(d) { return hasConsecutiveSame(d, 11); } },
        { id: 'perfect-dist', name: '完美均衡', emoji: '☯', score: 5000000000, rarity: '超越',
            check: function(d) { return everyDigitInRange(d, 29, 32); } },
        { id: 'double-pal', name: '双回文', emoji: '🪬', score: 20000000000, rarity: '超越',
            check: function(d) { return isRangePalindrome(d, 0, 100) && isRangePalindrome(d, 207, 307); } },
        { id: 'palprime-307', name: '上帝之数', emoji: '👁', score: 500000000000, rarity: '终结',
            check: function(d) { return isFullPalindrome(d) && isPrime(d); } },
    ];

    var BADGE_DESC_OVERRIDES = {
        'leading-nonzero': '首位不为0',
        'triple-same': '含连续3个相同数字',
        'quad-same': '含连续4个相同数字',
        'quint-same': '含连续5个相同数字',
        'ascending-run': '含连续8位递增',
        'descending-run': '含连续8位递减',
        'palindromic-slice': '含长度≥7的回文片段',
        'digit-republic': '每个数字至少出现18次',
        'perfect-balance': '奇数位数字之和等于偶数位数字之和',
        'multiple-of-three': '能被3整除',
        'first-last-equal': '首位和末位相同（忽略前导零）',
        'no-zero': '不含数字0',
        'no-one': '不含数字1',
        'no-one-has-zero': '不含1且含0',
        'multiple-of-11': '能被11整除',
        'multiple-of-9': '能被9整除',
        'multiple-of-13': '能被13整除',
        'multiple-of-17': '能被17整除',
        'multiple-of-19': '能被19整除',
        'multiple-of-23': '能被23整除',
        'multiple-of-29': '能被29整除',
        'multiple-of-7': '能被7整除',
        'hex-same': '含连续6个相同数字',
        'dozen-ascend': '含连续12位递增',
        'dozen-descend': '含连续12位递减',
        'digit-overlord': '某个数字出现≥50次',
        'mid-palindrome': '含长度≥12的回文片段',
        'multiple-of-97': '能被97整除',
        'sept-same': '含连续7个相同数字',
        'long-palindrome': '含长度≥18的回文片段',
        'long-ascend': '含连续15位递增',
        'long-descend': '含连续15位递减',
        'first-last-mirror': '前10位与后10位互为逆序',
        'digit-king': '某个数字出现≥60次',
        'oct-same': '含连续8个相同数字',
        'mega-palindrome': '含长度≥25的回文片段',
        'digit-empire-25': '每个数字至少出现28次',
        'half-sum-equal': '前后半数字之和相等',
        'multiple-of-1009': '能被1009整除',
        'nona-same': '含连续9个相同数字',
        'giant-palindrome': '含长度≥40的回文片段',
        'digit-utopia': '每个数字出现28~35次',
        'giant-ascend': '含连续20位递增',
        'head-50-pal': '前50位是回文',
        'deca-same': '含连续10个相同数字',
        'huge-palindrome': '含长度≥60的回文片段',
        'full-palindrome': '整个307位数字是回文',
        'prime-307': '整个307位数字是质数',
        'eleven-same': '含连续11个相同数字',
        'perfect-dist': '每个数字出现29~32次',
        'double-pal': '前100位和后100位各是回文',
        'palprime-307': '既是回文又是质数',
    };

    function getBadgeDesc(def) {
        if (!def) return '';
        if (BADGE_DESC_OVERRIDES.hasOwnProperty(def.id)) return BADGE_DESC_OVERRIDES[def.id];
        if (/^multiple-of-(\d+)$/.test(def.id)) { return '能被 ' + RegExp.$1 + ' 整除'; }
        return def.rarity + ' · ' + def.score.toLocaleString() + ' TP';
    }

    // ========== 全局状态 ==========
    var STORAGE_KEY = 'cfrngdleplus_save';
    var earnedBadges = [];
    var totalTP = 0;
    var currentTP = 0;
    var currentNumberStr = '';
    var newBadgeIds = {};
    var showAllBadges = false;
    var totalRolls = 0;
    var bestRollNum = '';
    var bestRollTP = 0;
    var showActiveOnly = false;

    // ========== localStorage ==========
    function saveToStorage() {
        try {
            var data = {
                earnedBadges: earnedBadges,
                totalTP: totalTP,
                totalRolls: totalRolls,
                bestRollNum: bestRollNum,
                bestRollTP: bestRollTP,
                showActiveOnly: showActiveOnly
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch(e) {}
    }

    function loadFromStorage() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            var data = JSON.parse(raw);
            if (data.earnedBadges && Array.isArray(data.earnedBadges)) earnedBadges = data.earnedBadges;
            if (typeof data.totalTP === 'number') totalTP = data.totalTP;
            if (typeof data.totalRolls === 'number') totalRolls = data.totalRolls;
            if (typeof data.bestRollTP === 'number') bestRollTP = data.bestRollTP;
            if (typeof data.bestRollNum === 'string') bestRollNum = data.bestRollNum;
            if (typeof data.showActiveOnly === 'boolean') showActiveOnly = data.showActiveOnly;
        } catch(e) { earnedBadges = []; totalTP = 0; totalRolls = 0; }
    }

    // ========== DOM 引用 ==========
    var badgeListEl = null;
    var totalScoreSpan = null;
    var currentScoreSpan = null;
    var rollCountSpan = null;
    var bestRollNumSpan = null;
    var bestRollTPSpan = null;
    var bestRollBox = null;

    // ========== 创建徽章 pill ==========
    function createBadgePill(badge, isActive, isNew) {
        if (!badge) return document.createTextNode('');
        var pill = document.createElement('span');
        var activeClass = isActive ? '' : 'badge-pill--inactive';
        pill.className = 'badge-pill badge-pill--' + badge.rarity + ' ' + activeClass;
        var countDisplay = badge.count > 1 ? ' \u00d7' + badge.count : '';
        var newTag = isNew ? '<span class="badge-new">\u65b0\uff01</span>' : '';
        pill.innerHTML =
            '<span class="badge-emoji">' + badge.emoji + '</span>' +
            '<span class="badge-name">' + badge.name + countDisplay + '</span>' +
            newTag +
            '<span class="badge-rarity">' + badge.rarity + '</span>' +
            '<span class="badge-score">+' + badge.score.toLocaleString() + 'TP</span>';
        var defs = window.BadgeDefs || [];
        for (var i = 0; i < defs.length; i++) {
            if (defs[i].id === badge.id) {
                pill.dataset.badgeId = badge.id;
                pill.dataset.badgeDesc = getBadgeDesc(defs[i]);
                break;
            }
        }
        return pill;
    }

    function createSeparator(label) {
        var sep = document.createElement('div');
        sep.className = 'badge-separator';
        sep.innerHTML = '<span><span class="badge-separator__line"></span>' +
            '<span class="badge-separator__label">' + label + '</span>' +
            '<span class="badge-separator__line"></span></span>';
        return sep;
    }

    function createLoadMoreButton(visibleCount, totalCount) {
        var container = document.createElement('div');
        container.className = 'badge-load-more';
        var btn = document.createElement('button');
        btn.className = 'badge-load-more__btn';
        btn.textContent = '\u663e\u793a\u5168\u90e8\uff08' + visibleCount + '/' + totalCount + '\uff09';
        btn.addEventListener('click', function() { showAllBadges = !showAllBadges; updateBadgeUI(); });
        container.appendChild(btn);
        return container;
    }

    // ========== Tooltip ==========
    var tooltipEl = null;
    var tooltipTimer = null;
    var tooltipPinned = false;
    var tooltipPinnedPill = null;

    function showTooltipAt(e, pill, desc) {
        if (!tooltipEl) { tooltipEl = document.getElementById('badgeTooltip'); if (!tooltipEl) return; }
        tooltipEl.innerHTML = '<div class="tooltip__desc">' + desc + '</div>';
        tooltipEl.classList.add('tooltip--show');
        var pillRect = pill.getBoundingClientRect();
        var tooltipRect = tooltipEl.getBoundingClientRect();
        var left = pillRect.left + pillRect.width / 2 - tooltipRect.width / 2;
        var top = pillRect.top - tooltipRect.height - 8;
        left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));
        top = Math.max(8, top);
        if (top < 8) top = pillRect.bottom + 8;
        tooltipEl.style.left = left + 'px';
        tooltipEl.style.top = top + 'px';
    }

    function hideTooltip() {
        if (tooltipEl) tooltipEl.classList.remove('tooltip--show');
    }

    function initTooltip() {
        tooltipEl = document.getElementById('badgeTooltip');
        if (!tooltipEl || !badgeListEl) return;
        badgeListEl.addEventListener('mouseenter', function(e) {
            var pill = e.target.closest('.badge-pill');
            if (!pill) { hideTooltip(); return; }
            if (tooltipPinned) return;
            showTooltipAt(e, pill, pill.dataset.badgeDesc || '');
        }, true);
        badgeListEl.addEventListener('mousemove', function(e) {
            if (tooltipPinned || !tooltipEl) return;
            var pill = e.target.closest('.badge-pill');
            if (!pill) { hideTooltip(); return; }
            showTooltipAt(e, pill, pill.dataset.badgeDesc || '');
        });
        badgeListEl.addEventListener('mouseleave', function(e) {
            if (!tooltipPinned) hideTooltip();
        }, true);
        badgeListEl.addEventListener('click', function(e) {
            var pill = e.target.closest('.badge-pill');
            if (!pill) { tooltipPinned = false; tooltipPinnedPill = null; hideTooltip(); return; }
            e.stopPropagation();
            if (tooltipPinned && pill === tooltipPinnedPill) { tooltipPinned = false; tooltipPinnedPill = null; hideTooltip(); return; }
            tooltipPinned = true; tooltipPinnedPill = pill;
            showTooltipAt(e, pill, pill.dataset.badgeDesc || '');
        });
        document.addEventListener('click', function() { tooltipPinned = false; tooltipPinnedPill = null; hideTooltip(); });
    }

    // ========== 初始化 ==========
    function initBadgeUI(badgeListElement, totalScoreElement, currentScoreElement, rollCountElement, bestRollNumElement, bestRollTPElement, bestRollBoxElement) {
        badgeListEl = badgeListElement;
        totalScoreSpan = totalScoreElement;
        currentScoreSpan = currentScoreElement || null;
        rollCountSpan = rollCountElement || null;
        bestRollNumSpan = bestRollNumElement || null;
        bestRollTPSpan = bestRollTPElement || null;
        bestRollBox = bestRollBoxElement || null;
        loadFromStorage();
        updateBadgeUI();
        initTooltip();
    }

    // ========== 格式化最佳数字显示 ==========
    function formatBestNum(numStr) {
        if (!numStr || numStr.length <= 12) return numStr;
        var len = numStr.length;
        return numStr.substring(0, 3) + '…' + numStr.substring(len - 3) + ' (' + len + '位)';
    }

    // ========== 更新 UI ==========
    function updateBadgeUI() {
        if (!badgeListEl || !totalScoreSpan) return;

        if (rollCountSpan) rollCountSpan.textContent = totalRolls.toLocaleString();
        totalScoreSpan.textContent = totalTP.toLocaleString();
        if (currentScoreSpan) currentScoreSpan.textContent = currentTP.toLocaleString();

        if (bestRollBox && bestRollTP > 0) {
            bestRollBox.style.display = '';
            bestRollBox.classList.remove('no-record');
            if (bestRollNumSpan) bestRollNumSpan.textContent = formatBestNum(bestRollNum);
            if (bestRollTPSpan) bestRollTPSpan.textContent = '+' + bestRollTP.toLocaleString() + 'TP';
        } else if (bestRollBox) {
            bestRollBox.style.display = '';
            bestRollBox.classList.add('no-record');
            if (bestRollNumSpan) bestRollNumSpan.textContent = '\u2014';
            if (bestRollTPSpan) bestRollTPSpan.textContent = '0TP';
        }

        badgeListEl.innerHTML = '';

        var defs = window.BadgeDefs || [];
        var hasCurrentNumber = currentNumberStr && currentNumberStr.length > 0;

        function isActiveBadge(badge) {
            if (!hasCurrentNumber) return false;
            for (var i = 0; i < defs.length; i++) {
                if (defs[i].id === badge.id) {
                    try { return defs[i].check(currentNumberStr); } catch(e) { return false; }
                }
            }
            return false;
        }

        var sorted = earnedBadges.slice().sort(function(a, b) { return rarityRank(a.rarity) - rarityRank(b.rarity); });
        var newBadges = [], oldBadges = [];
        sorted.forEach(function(badge) {
            if (showActiveOnly && !isActiveBadge(badge)) return;
            if (newBadgeIds.hasOwnProperty(badge.id)) newBadges.push(badge);
            else oldBadges.push(badge);
        });

        var showAll = showAllBadges;
        var newLimit = Math.min(newBadges.length, DISPLAY_LIMIT);
        var oldLimit = showAll ? oldBadges.length : Math.min(oldBadges.length, Math.max(0, DISPLAY_LIMIT - newLimit));

        if (newBadges.length > 0) {
            badgeListEl.appendChild(createSeparator('\u2728 \u65b0\u83b7\u5f97'));
            for (var ni = 0; ni < newLimit; ni++) {
                badgeListEl.appendChild(createBadgePill(newBadges[ni], isActiveBadge(newBadges[ni]), true));
            }
            if (!showAll && newBadges.length > newLimit) {
                var nExtra = document.createElement('span');
                nExtra.className = 'badge-more-hint';
                nExtra.textContent = '\u2026\u8fd8\u6709 ' + (newBadges.length - newLimit) + ' \u4e2a\u65b0\u5fbd\u7ae0';
                badgeListEl.appendChild(nExtra);
            }
        }

        if (newBadges.length > 0 && oldBadges.length > 0) {
            badgeListEl.appendChild(createSeparator('\u5df2\u6536\u96c6'));
        }

        for (var oi = 0; oi < oldLimit; oi++) {
            badgeListEl.appendChild(createBadgePill(oldBadges[oi], isActiveBadge(oldBadges[oi]), false));
        }

        var totalVisible = newLimit + oldLimit;
        var totalAll = newBadges.length + oldBadges.length;
        if (totalVisible < totalAll || showAll) {
            badgeListEl.appendChild(createLoadMoreButton(totalVisible, totalAll));
        }
    }

    // ========== 检查并颁发徽章 ==========
    function checkAndAwardBadges(numberStr) {
        newBadgeIds = {};
        currentNumberStr = numberStr;
        currentTP = 0;
        showAllBadges = false;
        totalRolls++;
        var newlyEarnedIds = [];

        var defs = window.BadgeDefs || [];
        for (var i = 0; i < defs.length; i++) {
            var def = defs[i];
            if (!tryCheck(def, numberStr)) continue;
            currentTP += def.score;
            var existing = findBadge(def.id);
            if (existing) { existing.count++; totalTP += def.score; }
            else {
                earnedBadges.push({ id: def.id, name: def.name, emoji: def.emoji, score: def.score, rarity: def.rarity, count: 1 });
                totalTP += def.score;
                newlyEarnedIds.push(def.id);
            }
        }

        if (currentTP > bestRollTP) { bestRollTP = currentTP; bestRollNum = numberStr; }

        for (var k = 0; k < newlyEarnedIds.length; k++) { newBadgeIds[newlyEarnedIds[k]] = true; }

        updateBadgeUI();
        saveToStorage();
    }

    // ========== 预览指定数字的徽章（不计数、不保存） ==========
    function previewNumber(numberStr) {
        currentNumberStr = numberStr;
        currentTP = 0;
        var defs = window.BadgeDefs || [];
        for (var i = 0; i < defs.length; i++) {
            var def = defs[i];
            if (tryCheck(def, numberStr)) { currentTP += def.score; }
        }
        showAllBadges = false;
        updateBadgeUI();
    }

    function tryCheck(def, num) { try { return def.check(num); } catch(e) { return false; } }

    function findBadge(id) {
        for (var i = 0; i < earnedBadges.length; i++) { if (earnedBadges[i].id === id) return earnedBadges[i]; }
        return null;
    }

    // ========== 重置 ==========
    function resetBadges() {
        earnedBadges = []; totalTP = 0; currentTP = 0;
        currentNumberStr = ''; newBadgeIds = {}; showAllBadges = false;
        totalRolls = 0; bestRollNum = ''; bestRollTP = 0;
        saveToStorage(); updateBadgeUI();
    }

    // ========== 暴露 ==========
    window.Badges = {
        initBadgeUI: initBadgeUI,
        checkAndAwardBadges: checkAndAwardBadges,
        resetBadges: resetBadges,
        previewNumber: previewNumber,
        getEarnedBadges: function() { return earnedBadges.slice(); },
        getTotalTP: function() { return totalTP; },
        getCurrentTP: function() { return currentTP; },
        getBest: function() { return { number: bestRollNum, score: bestRollTP }; },
        getCurrentNumberStr: function() { return currentNumberStr; },
        toggleShowActiveOnly: function() { showActiveOnly = !showActiveOnly; saveToStorage(); updateBadgeUI(); },
        getShowActiveOnly: function() { return showActiveOnly; },
        getCurrentActiveBadges: function() {
            if (!currentNumberStr) return [];
            var defs = window.BadgeDefs || [];
            return earnedBadges.filter(function(badge) {
                for (var i = 0; i < defs.length; i++) {
                    if (defs[i].id === badge.id) { try { return defs[i].check(currentNumberStr); } catch(e) { return false; } }
                }
                return false;
            });
        }
    };
})();
