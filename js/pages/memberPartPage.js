/**
 * EventPort UI Customizer - Member Participation Page Controller
 * 参加イベント一覧（メンバー）向けのUI改善制御
 * - 開催日順、イベント名順、参加サークル名順ソート
 * - 昨日以前の過去イベント非表示（トグル切り替え可能）
 * - キーワード検索
 * - 行の色付けおよび締切警告は不要（非表示）
 */
window.EP_MemberPartPage = {
  async init(tableElement) {
    console.log('[EventPort UI] Initializing Member Participation Page...');

    const settings = await window.EP_Storage.getSettings();
    const controller = new window.EP_TableController(tableElement, { isMemberPart: true });

    // ツールバーの生成と挿入（過去イベント非表示トグルを有効化、締切警告は不要）
    window.EP_UI.createToolbar({
      controller,
      settings,
      showPastToggle: true, // 過去イベント非表示トグルを表示
      onSettingChange: async (newSettings) => {
        await window.EP_Storage.saveSettings(newSettings);
        Object.assign(settings, newSettings);
      },
      onRefreshVoib: null // メンバー一覧では締切警告は表示しないため不要
    });
  }
};
