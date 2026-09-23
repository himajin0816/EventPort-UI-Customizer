/**
 * EventPort UI Customizer - Configuration & Constants
 */
window.EP_CONFIG = {
  // 厳格に対象とする4つのページURL
  URLS: {
    DASHBOARD: '/dashboard',
    CIRCLE_PARTICIPATION: '/circle-participation',
    SELLER_PARTICIPATION: '/seller-participation',
    GENERAL_PARTICIPATION: '/general-participation'
  },

  // テーブルセレクタ（idの有無に関わらずtable.bl_listTableにマッチ）
  SELECTORS: {
    TABLE: 'table.bl_listTable',
    THEAD: 'thead',
    TBODY: 'tbody',
    ROWS: 'tbody > tr'
  },

  // デフォルト設定値
  DEFAULT_SETTINGS: {
    defaultSort: 'none',             // 'none' | 'asc' | 'desc'
    hidePastEvents: true,            // 参加イベント一覧で過去イベントを非表示にするか
    highlightApplied: true,          // 申込済み行をハイライトするか
    dimSameDayConflicts: true,       // 申込済みと同日の他イベントをグレーアウトするか
    enableDeadlineWarnings: true,    // ボイベまとめの締切警告を表示するか
    warningDaysThreshold: 7          // 締切何日前から警告するか
  },

  // ボイベまとめ API / フィード設定
  VOIB_SUMMARY: {
    BASE_URL: 'https://vo.nrsy.jp',
    EVENTS_API: 'https://vo.nrsy.jp/api/2025-02-04/events.json',
    LIMITS_ICS: 'https://vo.nrsy.jp/limits.ics',
    CACHE_KEY: 'ep_voib_cache',
    CACHE_TTL_MS: 24 * 60 * 60 * 1000 // 24時間キャッシュ（負荷軽減）
  },

  // ストレージキー
  STORAGE_KEYS: {
    SETTINGS: 'ep_settings',
    APPLIED_EVENTS: 'ep_applied_events'
  }
};
