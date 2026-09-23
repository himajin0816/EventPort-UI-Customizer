/**
 * EventPort UI Customizer - Table Controller
 * テーブル行のデータ解析、ソート（イベント名/開催日/開催場所）、過去日非表示、申込状況ハイライト、同日重複グレーアウトのコア制御
 */
window.EP_TableController = class {
  /**
   * @param {HTMLTableElement} tableElement 
   * @param {Object} options 
   */
  constructor(tableElement, options = {}) {
    this.table = tableElement;
    this.tbody = tableElement.querySelector(window.EP_CONFIG.SELECTORS.TBODY);
    this.thead = tableElement.querySelector(window.EP_CONFIG.SELECTORS.THEAD);
    this.options = options; // { isDashboard: boolean, isCirclePart: boolean }

    this.rows = [];
    this.currentSortColumn = null; // 'name' | 'date' | 'venue' | null
    this.currentSortDirection = 'none'; // 'none' | 'asc' | 'desc'
    this.isHidingPast = false;
    this.searchKeyword = '';

    this.initRows();
  }

  /**
   * 全行をスキャンしてメタデータを dataset に付与
   */
  initRows() {
    if (!this.tbody) return;
    const trElements = Array.from(this.tbody.querySelectorAll('tr'));
    this.rows = [];

    trElements.forEach((tr, index) => {
      // 1. 元のDOM順序
      tr.dataset.epOriginalIndex = index.toString();

      // 2. イベント名の抽出（td[0]からモバイル用divを除いたテキスト）
      const firstTd = tr.cells[0];
      let eventName = '';
      if (firstTd) {
        const clone = firstTd.cloneNode(true);
        const mobileDiv = clone.querySelector('.d-md-none');
        if (mobileDiv) mobileDiv.remove();
        eventName = clone.textContent.trim();
      }
      tr.dataset.epEventName = eventName;

      // 3. 開催日の抽出
      let dateCell = tr.cells[1];
      let dateStr = '';
      let dateObj = null;

      if (dateCell) {
        dateObj = window.EP_DateUtils.parseDate(dateCell.textContent);
      }
      if (!dateObj && firstTd) {
        // モバイル用表示内からフォールバック抽出
        dateObj = window.EP_DateUtils.parseDate(firstTd.textContent);
      }

      if (dateObj) {
        dateStr = window.EP_DateUtils.formatDateKey(dateObj);
        tr.dataset.epDateStr = dateStr;
        tr.dataset.epTimestamp = dateObj.getTime().toString();
        const isPast = window.EP_DateUtils.isPastDate(dateObj);
        tr.dataset.epIsPast = isPast ? 'true' : 'false';
        if (isPast) {
          tr.classList.add('ep-past-event');
        }
      } else {
        tr.dataset.epDateStr = '';
        tr.dataset.epTimestamp = '0';
        tr.dataset.epIsPast = 'false';
      }

      // 4. 開催場所・参加サークル名の抽出
      let venue = '';
      let circleName = '';

      const theadThs = this.thead ? Array.from(this.thead.querySelectorAll('th')) : [];
      const venueColIdx = theadThs.findIndex(th => th.textContent.includes('開催場所'));
      const circleColIdx = theadThs.findIndex(th => th.textContent.includes('参加サークル名'));

      if (venueColIdx >= 0 && tr.cells[venueColIdx]) {
        venue = tr.cells[venueColIdx].textContent.trim();
      } else if (firstTd) {
        const m = firstTd.textContent.match(/場所[：:]\s*([^\n\r<]+)/);
        if (m) venue = m[1].trim();
      }

      if (circleColIdx >= 0 && tr.cells[circleColIdx]) {
        circleName = tr.cells[circleColIdx].textContent.trim();
      }

      tr.dataset.epVenue = venue;
      tr.dataset.epCircleName = circleName;

      // 5. 申し込み状況の判定（トップページでのみボタン表示により判定）
      let isApplied = false;
      if (!this.options.isCirclePart && !this.options.isMemberPart && !this.options.isGeneralPart) {
        const lastTd = tr.cells[tr.cells.length - 1];
        const lastTdText = lastTd ? lastTd.textContent.trim() : '';

        // 「申し込む」等のアクション文言が含まれている場合は未申し込み
        const isNotApplied = /申し込む|申込みを行う|エントリー/.test(lastTdText);

        // 「申し込み済み」「申込済み」「申込み済み」「申込完了」等のテキスト
        const hasAppliedText = /(申し込み済み|申込済み|申込み済み|申込完了)/.test(lastTdText);

        // 申し込み内容の確認・編集リンク（/circle/view/ 等）の存在
        const hasViewLink = Array.from(lastTd ? lastTd.querySelectorAll('a') : []).some(a => {
          const href = a.getAttribute('href') || '';
          return href.includes('/circle/view/') || href.includes('/ticket-viewer/');
        });

        isApplied = !isNotApplied && (hasAppliedText || hasViewLink);
      }

      tr.dataset.epIsApplied = isApplied ? 'true' : 'false';
      this.rows.push(tr);
    });

    // 6. 申込済み行の強調 & 同日他イベントのグレーアウト処理
    this.updateAppliedAndConflicts();
  }

  /**
   * 申し込み済み行のハイライト、および同日競合イベントのグレーアウトを更新
   * ※外部データは参照せず、読み込んだページのDOM情報（ボタン表示）のみで判定
   */
  updateAppliedAndConflicts() {
    // 参加イベント一覧（サークル・メンバー・一般共）では行への色付けは一切行わない
    if (this.options.isCirclePart || this.options.isMemberPart || this.options.isGeneralPart) {
      this.rows.forEach(tr => {
        tr.classList.remove('ep-applied-row', 'ep-same-day-conflict-row');
      });
      return;
    }

    // 日付ごとのグループマップ: { "YYYY/MM/DD": [tr, tr, ...] }
    const dateGroups = new Map();

    this.rows.forEach(tr => {
      const isApplied = tr.dataset.epIsApplied === 'true';

      // 申し込み済み表示の行にのみ色を付ける
      if (isApplied) {
        tr.classList.add('ep-applied-row');
      } else {
        tr.classList.remove('ep-applied-row');
      }

      // 開催日グループに分類
      const dateStr = tr.dataset.epDateStr;
      if (dateStr) {
        if (!dateGroups.has(dateStr)) {
          dateGroups.set(dateStr, []);
        }
        dateGroups.get(dateStr).push(tr);
      }
    });

    // 同日グループごとに、申込済みがあるか確認し、あれば他の同日イベントをグレーアウト
    dateGroups.forEach((rowsInDate) => {
      const hasApplied = rowsInDate.some(r => r.dataset.epIsApplied === 'true');
      rowsInDate.forEach(r => {
        if (hasApplied && r.dataset.epIsApplied !== 'true') {
          r.classList.add('ep-same-day-conflict-row');
          r.title = '※同日に申し込み済みのイベントがあります';
        } else {
          r.classList.remove('ep-same-day-conflict-row');
          if (r.title === '※同日に申し込み済みのイベントがあります') {
            r.removeAttribute('title');
          }
        }
      });
    });
  }

  /**
   * 指定列での並べ替え（ソート）
   * @param {'name' | 'date' | 'venue' | 'circle'} columnKey 
   * @param {'none' | 'asc' | 'desc'} direction 
   */
  sortBy(columnKey, direction = 'asc') {
    this.currentSortColumn = direction === 'none' ? null : columnKey;
    this.currentSortDirection = direction;

    const sorted = [...this.rows];

    if (direction === 'none') {
      // 初期状態の並び順に戻す
      sorted.sort((a, b) => {
        const idxA = parseInt(a.dataset.epOriginalIndex || '0', 10);
        const idxB = parseInt(b.dataset.epOriginalIndex || '0', 10);
        return idxA - idxB;
      });
    } else if (columnKey === 'name') {
      // イベント名順
      sorted.sort((a, b) => {
        const nameA = a.dataset.epEventName || '';
        const nameB = b.dataset.epEventName || '';
        return direction === 'asc'
          ? nameA.localeCompare(nameB, 'ja')
          : nameB.localeCompare(nameA, 'ja');
      });
    } else if (columnKey === 'venue') {
      // 開催場所順
      sorted.sort((a, b) => {
        const venA = a.dataset.epVenue || '';
        const venB = b.dataset.epVenue || '';
        return direction === 'asc'
          ? venA.localeCompare(venB, 'ja')
          : venB.localeCompare(venA, 'ja');
      });
    } else if (columnKey === 'circle') {
      // 参加サークル名順
      sorted.sort((a, b) => {
        const cA = a.dataset.epCircleName || '';
        const cB = b.dataset.epCircleName || '';
        return direction === 'asc'
          ? cA.localeCompare(cB, 'ja')
          : cB.localeCompare(cA, 'ja');
      });
    } else {
      // 開催日順（デフォルト）
      sorted.sort((a, b) => {
        const timeA = parseInt(a.dataset.epTimestamp || '0', 10);
        const timeB = parseInt(b.dataset.epTimestamp || '0', 10);
        if (timeA === 0) return 1;
        if (timeB === 0) return -1;
        return direction === 'asc' ? timeA - timeB : timeB - timeA;
      });
    }

    // DOMを再配置
    const fragment = document.createDocumentFragment();
    sorted.forEach(tr => fragment.appendChild(tr));
    this.tbody.appendChild(fragment);
  }

  /**
   * 開催日ソートの互換メソッド
   * @param {'none' | 'asc' | 'desc'} sortType 
   */
  sort(sortType) {
    this.sortBy('date', sortType);
  }

  /**
   * 過去イベントの非表示切り替え
   * @param {boolean} shouldHide 
   */
  setHidePast(shouldHide) {
    this.isHidingPast = shouldHide;
    if (shouldHide) {
      this.tbody.classList.add('ep-hide-past');
    } else {
      this.tbody.classList.remove('ep-hide-past');
    }
  }

  /**
   * キーワード絞り込み
   * @param {string} keyword 
   */
  filter(keyword) {
    this.searchKeyword = (keyword || '').trim().toLowerCase();

    this.rows.forEach(tr => {
      if (!this.searchKeyword) {
        tr.classList.remove('ep-search-hidden');
        return;
      }
      const text = tr.textContent.toLowerCase();
      if (text.includes(this.searchKeyword)) {
        tr.classList.remove('ep-search-hidden');
      } else {
        tr.classList.add('ep-search-hidden');
      }
    });
  }

  /**
   * 現在の表示件数と全件数を取得
   * @returns {{ total: number, visible: number }}
   */
  getCounts() {
    const total = this.rows.length;
    let visible = 0;

    this.rows.forEach(tr => {
      const isSearchHidden = tr.classList.contains('ep-search-hidden');
      const isPastHidden = this.isHidingPast && tr.classList.contains('ep-past-event');
      if (!isSearchHidden && !isPastHidden) {
        visible++;
      }
    });

    return { total, visible };
  }
};
