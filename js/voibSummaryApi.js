/**
 * EventPort UI Customizer - Voice Synth Event Summary API Client
 * ボイベまとめ (vo.nrsy.jp) のAPIおよびカレンダー連携モジュール
 * 【重要】アクセス先に負荷を与えないよう、徹底したローカルキャッシュ（24時間）と最小限の通信に制御
 */
window.EP_VoibApi = {
  /**
   * 文字列を正規化してマッチングしやすくする（空白除去、全角半角統一、小文字化）
   * @param {string} str 
   * @returns {string}
   */
  normalizeName(str) {
    if (!str) return '';
    return str
      .replace(/[\s\u3000]+/g, '')
      .replace(/[！-～]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)) // 全角英数を半角に
      .replace(/[\(（].*?[\)）]/g, '') // カッコ内補足の除去
      .toLowerCase();
  },

  /**
   * ボイベまとめの最新締切データを取得する（キャッシュ優先）
   * @param {boolean} forceRefresh 強制更新フラグ
   * @returns {Promise<Array<Object>>}
   */
  async getDeadlines(forceRefresh = false) {
    const cacheKey = window.EP_CONFIG.VOIB_SUMMARY.CACHE_KEY;
    const ttl = window.EP_CONFIG.VOIB_SUMMARY.CACHE_TTL_MS;

    // 1. キャッシュチェック
    if (!forceRefresh) {
      const cached = await window.EP_Storage.get(cacheKey);
      if (cached && cached.timestamp && (Date.now() - cached.timestamp < ttl) && Array.isArray(cached.data)) {
        return cached.data;
      }
    }

    // 2. 外部から取得（負荷を与えないよう並列フェッチし、結果をまとめてキャッシュ）
    try {
      console.log('[EventPort UI] Fetching latest deadline data from vo.nrsy.jp...');
      const icsResponse = await fetch(window.EP_CONFIG.VOIB_SUMMARY.LIMITS_ICS);
      if (!icsResponse.ok) throw new Error(`HTTP ${icsResponse.status}`);
      const icsText = await icsResponse.text();

      // ICSをパース
      const parsedDeadlines = this.parseLimitsIcs(icsText);

      // キャッシュに保存
      await window.EP_Storage.set(cacheKey, {
        timestamp: Date.now(),
        data: parsedDeadlines
      });

      return parsedDeadlines;
    } catch (e) {
      console.warn('[EventPort UI] Failed to fetch data from vo.nrsy.jp (using fallback/silent):', e);
      // 通信失敗時は古いキャッシュがあればそれを返し、なければ空配列
      const stale = await window.EP_Storage.get(cacheKey);
      return (stale && stale.data) ? stale.data : [];
    }
  },

  /**
   * limits.ics (iCalendar) のテキストをパースして扱いやすいオブジェクト配列にする
   * @param {string} icsText 
   * @returns {Array<Object>}
   */
  parseLimitsIcs(icsText) {
    if (!icsText) return [];
    const events = [];
    const eventBlocks = icsText.split('BEGIN:VEVENT');

    for (let i = 1; i < eventBlocks.length; i++) {
      const block = eventBlocks[i].split('END:VEVENT')[0];
      
      // SUMMARY:〆 <イベント名> <募集種別>
      const summaryMatch = block.match(/SUMMARY:(.*)/);
      // DTSTART;VALUE=DATE:<YYYYMMDD> または DTSTART:<YYYYMMDD...>
      const dtStartMatch = block.match(/DTSTART(?:;[^:]+)?:(\d{8}(?:T\d{6})?)/);
      // DESCRIPTION (開催日などが含まれる場合がある)
      const descMatch = block.match(/DESCRIPTION:(.*)/);

      if (summaryMatch && dtStartMatch) {
        const rawSummary = summaryMatch[1].trim();
        const deadlineDate = window.EP_DateUtils.parseIcsDate(dtStartMatch[1]);
        if (!deadlineDate) continue;

        // "〆 " を除去
        let cleanSummary = rawSummary.replace(/^〆\s*/, '');
        
        // イベント名と募集種別を分割（例: "りゅうせいぐん -竜声群- サークル募集 (最終)"）
        let eventName = cleanSummary;
        let limitType = 'サークル締切';
        
        const typeIndex = cleanSummary.search(/(サークル募集|サークル参加|スタッフ参加)/);
        if (typeIndex > 0) {
          eventName = cleanSummary.substring(0, typeIndex).trim();
          limitType = cleanSummary.substring(typeIndex).trim();
        }

        const remainingDays = window.EP_DateUtils.getRemainingDays(deadlineDate);

        // 既に終了した過去の締切（-1日以前）は除外またはステータス設定
        events.push({
          rawSummary,
          eventName,
          normalizedName: this.normalizeName(eventName),
          limitType,
          deadlineDate: window.EP_DateUtils.formatDateKey(deadlineDate),
          remainingDays,
          isExpired: remainingDays < 0
        });
      }
    }

    return events;
  },

  /**
   * 表内のイベント名に対応する締切情報を探す
   * @param {string} targetEventName 
   * @param {Array<Object>} deadlines 
   * @returns {Object|null} 最も直近の有効な締切情報
   */
  findDeadlineForEvent(targetEventName, deadlines) {
    if (!targetEventName || !deadlines || !deadlines.length) return null;
    const targetNorm = this.normalizeName(targetEventName);

    // 有効な（まだ終了していない、または本日締切の）締切を抽出
    const active = deadlines.filter(d => !d.isExpired);

    // 1. 完全一致
    let matched = active.filter(d => d.normalizedName === targetNorm);

    // 2. 部分一致（一方が他方を含む）
    if (matched.length === 0) {
      matched = active.filter(d => {
        return d.normalizedName.length >= 3 && targetNorm.length >= 3 &&
          (targetNorm.includes(d.normalizedName) || d.normalizedName.includes(targetNorm));
      });
    }

    if (matched.length === 0) return null;

    // 最も締め切りが近い（残日数が最小）のものを返す
    matched.sort((a, b) => a.remainingDays - b.remainingDays);
    return matched[0];
  }
};
