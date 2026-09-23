/**
 * EventPort UI Customizer - UI Component Builder
 * ツールバー、表タイトル行クリックソート、設定ドロップダウン、バッジ描画等のDOM構築
 */
window.EP_UI = {
  /**
   * ツールバーを生成してテーブルの直前に挿入する
   * @param {Object} context
   * @param {window.EP_TableController} context.controller
   * @param {Object} context.settings
   * @param {boolean} context.showPastToggle 過去非表示トグルを表示するか（参加イベント一覧などでtrue）
   * @param {Function} context.onSettingChange 設定変更時コールバック
   * @param {Function} context.onRefreshVoib ボイベまとめ手動更新コールバック
   * @returns {HTMLElement} 生成されたツールバー要素
   */
  createToolbar({ controller, settings, showPastToggle = false, onSettingChange, onRefreshVoib }) {
    const toolbar = document.createElement('div');
    toolbar.className = 'ep-toolbar';

    // === 左側: フィルター・検索操作 ===
    const leftBox = document.createElement('div');
    leftBox.className = 'ep-toolbar-left';

    // 1. 過去イベント非表示トグル（参加イベント一覧時などに表示）
    let pastToggleInput = null;
    if (showPastToggle) {
      const toggleLabel = document.createElement('label');
      toggleLabel.className = 'ep-toggle-label';

      const switchBox = document.createElement('span');
      switchBox.className = 'ep-switch';

      pastToggleInput = document.createElement('input');
      pastToggleInput.type = 'checkbox';
      pastToggleInput.checked = !!settings.hidePastEvents;

      const slider = document.createElement('span');
      slider.className = 'ep-slider';

      switchBox.appendChild(pastToggleInput);
      switchBox.appendChild(slider);

      const labelText = document.createElement('span');
      labelText.textContent = '過去のイベントを非表示';

      toggleLabel.appendChild(switchBox);
      toggleLabel.appendChild(labelText);
      leftBox.appendChild(toggleLabel);
    }

    // 2. 検索ボックス
    const searchBox = document.createElement('div');
    searchBox.className = 'ep-search-box';

    const searchIcon = document.createElement('span');
    searchIcon.className = 'ep-search-icon';
    searchIcon.textContent = '🔍';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'ep-search-input';
    searchInput.placeholder = 'キーワード絞り込み...';

    searchBox.appendChild(searchIcon);
    searchBox.appendChild(searchInput);
    leftBox.appendChild(searchBox);

    // === 右側: 件数表示 & 設定メニュー ===
    const rightBox = document.createElement('div');
    rightBox.className = 'ep-toolbar-right';

    // 3. 表示件数バッジ
    const countBadge = document.createElement('span');
    countBadge.className = 'ep-count-badge';

    const updateCounts = () => {
      const counts = controller.getCounts();
      countBadge.textContent = `表示: ${counts.visible} / 全 ${counts.total} 件`;
    };
    updateCounts();
    rightBox.appendChild(countBadge);

    // 4. 設定メニュー（歯車アイコン）
    const menuContainer = document.createElement('div');
    menuContainer.className = 'ep-menu-container';

    const menuBtn = document.createElement('button');
    menuBtn.type = 'button';
    menuBtn.className = 'ep-icon-btn';
    menuBtn.innerHTML = '⚙️';
    menuBtn.title = 'EventPort Customizer 設定';

    const dropdown = document.createElement('div');
    dropdown.className = 'ep-dropdown';

    // ドロップダウンメニュー項目
    dropdown.innerHTML = `
      <div style="font-weight: 700; font-size: 12px; color: #4b5563; padding: 4px 8px 6px;">クイック設定</div>
      <label class="ep-dropdown-item" style="cursor: pointer;">
        <input type="checkbox" id="ep-menu-deadline-warn" ${settings.enableDeadlineWarnings ? 'checked' : ''}>
        <span>ボイベまとめ締切警告を表示</span>
      </label>
      <div class="ep-dropdown-divider"></div>
      <button type="button" class="ep-btn ep-btn-sm" id="ep-btn-refresh-voib" style="width: 100%; justify-content: center;">
        🔄 ボイベまとめデータを今すぐ更新
      </button>
    `;

    menuContainer.appendChild(menuBtn);
    menuContainer.appendChild(dropdown);
    rightBox.appendChild(menuContainer);

    toolbar.appendChild(leftBox);
    toolbar.appendChild(rightBox);

    // === イベント登録 ===
    // 過去非表示トグルの適用
    if (pastToggleInput) {
      pastToggleInput.addEventListener('change', (e) => {
        controller.setHidePast(e.target.checked);
        updateCounts();
        if (onSettingChange) onSettingChange({ hidePastEvents: e.target.checked });
      });
      controller.setHidePast(pastToggleInput.checked);
      updateCounts();
    }

    // 検索入力の監視
    searchInput.addEventListener('input', (e) => {
      controller.filter(e.target.value);
      updateCounts();
    });

    // 歯車メニューの開閉制御
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!menuContainer.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });

    // メニュー内設定変更
    const deadlineWarnCheck = dropdown.querySelector('#ep-menu-deadline-warn');
    if (deadlineWarnCheck) {
      deadlineWarnCheck.addEventListener('change', (e) => {
        if (onSettingChange) onSettingChange({ enableDeadlineWarnings: e.target.checked });
      });
    }

    const refreshVoibBtn = dropdown.querySelector('#ep-btn-refresh-voib');
    if (refreshVoibBtn && onRefreshVoib) {
      refreshVoibBtn.addEventListener('click', async () => {
        refreshVoibBtn.disabled = true;
        refreshVoibBtn.textContent = '取得中...';
        await onRefreshVoib();
        refreshVoibBtn.textContent = '更新完了!';
        setTimeout(() => {
          refreshVoibBtn.disabled = false;
          refreshVoibBtn.textContent = '🔄 ボイベまとめデータを今すぐ更新';
        }, 1500);
      });
    }

    // テーブルの直前に挿入
    controller.table.parentNode.insertBefore(toolbar, controller.table);

    // 表タイトル行（イベント名・開催日・開催場所）のクリックソートを有効化
    this.enhanceTableHeaders(controller, settings, updateCounts, onSettingChange);

    return toolbar;
  },

  /**
   * 表のタイトル行（th）をクリック可能にして複数列ソートをサポート
   * @param {window.EP_TableController} controller 
   * @param {Object} settings 
   * @param {Function} updateCountsCallback 
   * @param {Function} onSettingChange 
   */
  enhanceTableHeaders(controller, settings, updateCountsCallback, onSettingChange) {
    if (!controller.thead) return;
    const ths = controller.thead.querySelectorAll('th');

    const sortableConfigs = [
      { key: 'name', labelMatch: 'イベント名' },
      { key: 'date', labelMatch: '開催日' },
      { key: 'venue', labelMatch: '開催場所' },
      { key: 'circle', labelMatch: '参加サークル名' }
    ];

    const sortableThMap = new Map(); // key -> { th, sortIcon, currentDirection }

    ths.forEach(th => {
      const text = th.textContent.trim();
      const matched = sortableConfigs.find(c => text.includes(c.labelMatch));

      if (matched) {
        th.classList.add('ep-sortable-th');
        th.title = `${matched.labelMatch}で並べ替え（昇順 / 降順 / リセット）`;

        const sortIcon = document.createElement('span');
        sortIcon.className = 'ep-th-sort-icon';
        sortIcon.textContent = '⇅';
        th.appendChild(sortIcon);

        const entry = { th, sortIcon, key: matched.key, currentDirection: 'none' };
        sortableThMap.set(matched.key, entry);

        th.addEventListener('click', () => {
          let nextDirection = 'asc';
          if (entry.currentDirection === 'asc') nextDirection = 'desc';
          else if (entry.currentDirection === 'desc') nextDirection = 'none';

          // 他の列のインジケータをリセット
          sortableThMap.forEach((otherEntry, otherKey) => {
            if (otherKey !== matched.key) {
              otherEntry.currentDirection = 'none';
              otherEntry.th.classList.remove('ep-sorted');
              otherEntry.sortIcon.textContent = '⇅';
            }
          });

          // クリックされた列の状態を更新
          entry.currentDirection = nextDirection;
          if (nextDirection === 'asc') {
            entry.th.classList.add('ep-sorted');
            entry.sortIcon.textContent = '▲';
          } else if (nextDirection === 'desc') {
            entry.th.classList.add('ep-sorted');
            entry.sortIcon.textContent = '▼';
          } else {
            entry.th.classList.remove('ep-sorted');
            entry.sortIcon.textContent = '⇅';
          }

          // ソート実行
          controller.sortBy(matched.key, nextDirection);
          updateCountsCallback();

          // 開催日列の場合はデフォルトソート設定にも反映
          if (matched.key === 'date' && onSettingChange) {
            onSettingChange({ defaultSort: nextDirection });
          }
        });
      }
    });

    // 初期ソート（設定のデフォルト日付順ソート）の適用
    if (settings.defaultSort && settings.defaultSort !== 'none' && sortableThMap.has('date')) {
      const dateEntry = sortableThMap.get('date');
      dateEntry.currentDirection = settings.defaultSort;
      dateEntry.th.classList.add('ep-sorted');
      dateEntry.sortIcon.textContent = settings.defaultSort === 'asc' ? '▲' : '▼';
      controller.sortBy('date', settings.defaultSort);
      updateCountsCallback();
    }
  },

  /**
   * ボイベまとめの締切警告バッジを行に追加する
   * @param {window.EP_TableController} controller 
   * @param {Array<Object>} deadlines 
   * @param {number} thresholdDays 警告する日数しきい値
   */
  renderDeadlineBadges(controller, deadlines, thresholdDays = 7) {
    if (!deadlines || !deadlines.length) return;

    controller.rows.forEach(tr => {
      // 既存のバッジがあれば削除して再描画
      const oldBadge = tr.querySelector('.ep-deadline-badge');
      if (oldBadge) oldBadge.remove();

      const eventName = tr.dataset.epEventName;
      const matched = window.EP_VoibApi.findDeadlineForEvent(eventName, deadlines);

      if (matched && matched.remainingDays >= 0 && matched.remainingDays <= thresholdDays) {
        const isUrgent = matched.remainingDays <= 3;
        const badge = document.createElement('div');
        badge.className = `ep-deadline-badge ${isUrgent ? 'danger' : 'warning'}`;

        const remainingText = matched.remainingDays === 0 ? '本日締切！' : `あと${matched.remainingDays}日`;
        badge.innerHTML = `⚠️ ${matched.limitType}: <strong>${remainingText}</strong> (${matched.deadlineDate})`;
        badge.title = `ボイベまとめ情報: ${matched.rawSummary}`;

        // イベント名セル（td[0]）に追加
        const firstTd = tr.cells[0];
        if (firstTd) {
          firstTd.appendChild(badge);
        }
      }
    });
  }
};
