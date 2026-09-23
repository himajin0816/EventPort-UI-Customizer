/**
 * EventPort UI Customizer - Content Script Entry Point
 */
(function () {
  'use strict';

  console.log('[EventPort UI Customizer] Content script loaded.');

  /**
   * 現在のページが対象4URLのいずれかに合致するか厳格に判定する
   * @returns {'dashboard' | 'circle_participation' | 'seller_participation' | 'general_participation' | 'local_test' | null}
   */
  function getMatchedPageType() {
    // ローカルテスト用HTML（file://）環境
    if (window.location.protocol === 'file:') {
      return 'local_test';
    }

    // ホスト名判定（event-port.com または www.event-port.com）
    const host = window.location.hostname.toLowerCase();
    if (host !== 'event-port.com' && host !== 'www.event-port.com') {
      return null;
    }

    // パスを正規化（末尾のスラッシュを除去）
    const path = window.location.pathname.replace(/\/+$/, '');

    // 1. トップページ: https://event-port.com/dashboard
    if (path === '/dashboard' || path.startsWith('/dashboard/')) {
      return 'dashboard';
    }

    // 2. 参加イベント一覧（サークル）: https://event-port.com/circle-participation
    if (path === '/circle-participation' || path.startsWith('/circle-participation/')) {
      return 'circle_participation';
    }

    // 3. 参加イベント一覧（メンバー）: https://event-port.com/seller-participation
    if (path === '/seller-participation' || path.startsWith('/seller-participation/')) {
      return 'seller_participation';
    }

    // 4. 参加イベント一覧（一般）: https://event-port.com/general-participation
    if (path === '/general-participation' || path.startsWith('/general-participation/')) {
      return 'general_participation';
    }

    // 上記4URL以外は null（完全に対象外）
    return null;
  }

  const pageType = getMatchedPageType();

  // 対象外ページであれば即座に処理終了（意図しない動作・干渉の完全防止）
  if (!pageType) {
    return;
  }

  console.log(`[EventPort UI Customizer] Matched page: ${pageType}`);

  /**
   * ページとテーブルを検知して適切なページコントローラーを実行する
   */
  function inspectAndInit() {
    const table = document.querySelector(window.EP_CONFIG.SELECTORS.TABLE);
    if (!table || table.dataset.epInitialized === 'true') {
      return;
    }

    if (pageType === 'dashboard') {
      table.dataset.epInitialized = 'true';
      window.EP_DashboardPage.init(table);
    } else if (pageType === 'circle_participation') {
      table.dataset.epInitialized = 'true';
      window.EP_CirclePartPage.init(table);
    } else if (pageType === 'seller_participation') {
      table.dataset.epInitialized = 'true';
      window.EP_MemberPartPage.init(table);
    } else if (pageType === 'general_participation') {
      table.dataset.epInitialized = 'true';
      window.EP_GeneralPartPage.init(table);
    } else if (pageType === 'local_test') {
      // ローカルテストプレビュー（file://）でのみヘッダー判定による動作を許可
      const theadText = table.querySelector('thead') ? table.querySelector('thead').textContent : '';
      if (theadText.includes('参加サークル名')) {
        table.dataset.epInitialized = 'true';
        window.EP_MemberPartPage.init(table);
      } else if (theadText.includes('申し込みリンク')) {
        table.dataset.epInitialized = 'true';
        window.EP_DashboardPage.init(table);
      } else if (theadText.includes('一般参加種別') || theadText.includes('支払い方法')) {
        table.dataset.epInitialized = 'true';
        window.EP_GeneralPartPage.init(table);
      } else if (theadText.includes('各種操作')) {
        table.dataset.epInitialized = 'true';
        window.EP_CirclePartPage.init(table);
      }
    }
  }

  // DOM構築完了時に実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inspectAndInit);
  } else {
    inspectAndInit();
  }

  // SPA等で動的にテーブルがレンダリングされるケースに対応するため MutationObserver でも監視
  const observer = new MutationObserver(() => {
    inspectAndInit();
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });
})();
