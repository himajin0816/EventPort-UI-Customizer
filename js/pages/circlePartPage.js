/**
 * EventPort UI Customizer - Circle Participation Page Controller
 * 参加イベント一覧（/circle-participation）向けのUI改善制御
 * - 開催日順ソート
 * - 昨日以前の過去イベント非表示（トグル切り替え可能）
 * - 申し込んでいるイベント一覧の自動記録・同期
 * - 各種操作（確認・編集）と締切情報の補助
 */
window.EP_CirclePartPage = {
  async init(tableElement) {
    console.log('[EventPort UI] Initializing Circle Participation Page...');

    const settings = await window.EP_Storage.getSettings();
    const controller = new window.EP_TableController(tableElement, { isCirclePart: true });

    // 参加イベント一覧では全イベントが申込済みのため、行への色付けや外部同期は不要

    // 2. ボイベまとめ締切データの取得と適用
    const applyVoibDeadlines = async (forceRefresh = false) => {
      if (!settings.enableDeadlineWarnings) return;
      const deadlines = await window.EP_VoibApi.getDeadlines(forceRefresh);
      window.EP_UI.renderDeadlineBadges(controller, deadlines, settings.warningDaysThreshold);
    };

    // 3. ツールバーの生成と挿入（過去イベント非表示トグルを有効化）
    window.EP_UI.createToolbar({
      controller,
      settings,
      showPastToggle: true, // 過去イベント非表示トグルを表示
      onSettingChange: async (newSettings) => {
        await window.EP_Storage.saveSettings(newSettings);
        Object.assign(settings, newSettings);
        if (newSettings.enableDeadlineWarnings !== undefined) {
          if (newSettings.enableDeadlineWarnings) {
            applyVoibDeadlines();
          } else {
            controller.rows.forEach(tr => {
              const b = tr.querySelector('.ep-deadline-badge');
              if (b) b.remove();
            });
          }
        }
      },
      onRefreshVoib: async () => {
        await applyVoibDeadlines(true);
      }
    });

    // 4. 初回ボイベまとめデータ適用
    await applyVoibDeadlines(false);
  }
};
