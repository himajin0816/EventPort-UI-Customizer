/**
 * EventPort UI Customizer - Dashboard Page Controller
 * トップページ（/dashboard）向けのUI改善制御
 * - 開催日順ソート
 * - 申し込み済みイベント行の色変更（強調）
 * - 申し込み済みと同日の他イベントのグレーアウト
 * - ボイベまとめの締切警告バッジ表示
 */
window.EP_DashboardPage = {
  async init(tableElement) {
    console.log('[EventPort UI] Initializing Dashboard Page...');

    const settings = await window.EP_Storage.getSettings();
    const controller = new window.EP_TableController(tableElement, { isDashboard: true });

    // 1. 申し込み状況および同日競合の判定は、ページDOMのボタン表示のみで自動判定済み

    // 2. ボイベまとめ締切データの取得と適用関数
    const applyVoibDeadlines = async (forceRefresh = false) => {
      if (!settings.enableDeadlineWarnings) return;
      const deadlines = await window.EP_VoibApi.getDeadlines(forceRefresh);
      window.EP_UI.renderDeadlineBadges(controller, deadlines, settings.warningDaysThreshold);
    };

    // 3. ツールバーの生成と挿入
    window.EP_UI.createToolbar({
      controller,
      settings,
      showPastToggle: false, // 受付中イベント一覧は基本未来イベントのため通常は不要（検索やソートのみ）
      onSettingChange: async (newSettings) => {
        await window.EP_Storage.saveSettings(newSettings);
        Object.assign(settings, newSettings);
        if (newSettings.enableDeadlineWarnings !== undefined) {
          if (newSettings.enableDeadlineWarnings) {
            applyVoibDeadlines();
          } else {
            // バッジ削除
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

    // 5. 設定が外部（ポップアップ等）から変更された時のリアルタイム反映
    window.EP_Storage.onSettingsChanged((newSettings) => {
      Object.assign(settings, newSettings);
      if (newSettings.enableDeadlineWarnings) {
        applyVoibDeadlines();
      }
    });
  }
};
