/**
 * EventPort UI Customizer - Popup Controller
 */
document.addEventListener('DOMContentLoaded', async () => {
  const hidePastInput = document.getElementById('setting-hide-past');
  const dimConflictsInput = document.getElementById('setting-dim-conflicts');
  const defaultSortSelect = document.getElementById('setting-default-sort');
  const deadlineWarnInput = document.getElementById('setting-deadline-warn');
  const warningDaysSelect = document.getElementById('setting-warning-days');
  const btnSyncVoib = document.getElementById('btn-sync-voib');
  const syncStatus = document.getElementById('sync-status');
  const versionElement = document.getElementById('ep-popup-version');

  // manifest.json からバージョン番号を取得して動的に反映
  if (versionElement && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
    const manifest = chrome.runtime.getManifest();
    if (manifest && manifest.version) {
      versionElement.textContent = `v${manifest.version}`;
    }
  }

  // 1. 設定の読み込みと反映
  const settings = await window.EP_Storage.getSettings();

  hidePastInput.checked = !!settings.hidePastEvents;
  dimConflictsInput.checked = settings.dimSameDayConflicts !== false;
  defaultSortSelect.value = settings.defaultSort || 'none';
  deadlineWarnInput.checked = !!settings.enableDeadlineWarnings;
  warningDaysSelect.value = String(settings.warningDaysThreshold || 7);

  // キャッシュ状態の確認
  const cacheKey = window.EP_CONFIG.VOIB_SUMMARY.CACHE_KEY;
  const cached = await window.EP_Storage.get(cacheKey);
  if (cached && cached.timestamp) {
    const d = new Date(cached.timestamp);
    syncStatus.textContent = `最終更新: ${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')} (${cached.data.length}件)`;
  }

  // 2. イベントリスナー登録（変更即保存）
  hidePastInput.addEventListener('change', async (e) => {
    await window.EP_Storage.saveSettings({ hidePastEvents: e.target.checked });
  });

  dimConflictsInput.addEventListener('change', async (e) => {
    await window.EP_Storage.saveSettings({ dimSameDayConflicts: e.target.checked });
  });

  defaultSortSelect.addEventListener('change', async (e) => {
    await window.EP_Storage.saveSettings({ defaultSort: e.target.value });
  });

  deadlineWarnInput.addEventListener('change', async (e) => {
    await window.EP_Storage.saveSettings({ enableDeadlineWarnings: e.target.checked });
  });

  warningDaysSelect.addEventListener('change', async (e) => {
    await window.EP_Storage.saveSettings({ warningDaysThreshold: parseInt(e.target.value, 10) });
  });

  // 3. 手動更新ボタン
  btnSyncVoib.addEventListener('click', async () => {
    btnSyncVoib.disabled = true;
    btnSyncVoib.textContent = 'データ取得中...';
    syncStatus.textContent = '外部サーバーと通信中...';

    try {
      const data = await window.EP_VoibApi.getDeadlines(true);
      const now = new Date();
      syncStatus.textContent = `更新完了: ${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} (${data.length}件)`;
    } catch (e) {
      syncStatus.textContent = '更新に失敗しました。';
    } finally {
      btnSyncVoib.disabled = false;
      btnSyncVoib.textContent = '🔄 最新締切データを手動更新';
    }
  });
});
