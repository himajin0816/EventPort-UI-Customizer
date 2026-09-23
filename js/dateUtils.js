/**
 * EventPort UI Customizer - Date Utilities
 */
window.EP_DateUtils = {
  /**
   * テキストから YYYY/MM/DD 形式の日付を抽出して Date オブジェクトを返す
   * @param {string} text 
   * @returns {Date|null}
   */
  parseDate(text) {
    if (!text) return null;
    const match = text.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (!match) return null;
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    return new Date(year, month, day);
  },

  /**
   * Dateオブジェクトを YYYY/MM/DD 形式のキー文字列にする
   * @param {Date} date 
   * @returns {string} 例: "2026/12/13"
   */
  formatDateKey(date) {
    if (!date || isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}/${m}/${d}`;
  },

  /**
   * 対象の日付が「昨日以前（過去）」かどうか判定する
   * ※当日（00:00:00以降）は「過去」に含めない
   * @param {Date} date 
   * @returns {boolean}
   */
  isPastDate(date) {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 今日の 00:00:00
    return date.getTime() < today.getTime();
  },

  /**
   * 今日の00:00:00からの残り日数を計算する
   * @param {Date} targetDate 
   * @returns {number} 残り日数（当日の場合は0、明日は1、過去日はマイナス）
   */
  getRemainingDays(targetDate) {
    if (!targetDate) return -999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(targetDate.getTime());
    target.setHours(0, 0, 0, 0);

    const diffMs = target.getTime() - today.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  },

  /**
   * iCalendar (ICS) 形式の日付文字列（YYYYMMDD または YYYYMMDDTHHMMSS）をパースする
   * @param {string} icsDateStr 
   * @returns {Date|null}
   */
  parseIcsDate(icsDateStr) {
    if (!icsDateStr) return null;
    const clean = icsDateStr.replace(/[^0-9T]/g, '');
    const m = clean.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?/);
    if (!m) return null;
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    const day = parseInt(m[3], 10);
    const hour = m[4] ? parseInt(m[4], 10) : 0;
    const min = m[5] ? parseInt(m[5], 10) : 0;
    const sec = m[6] ? parseInt(m[6], 10) : 0;
    return new Date(year, month, day, hour, min, sec);
  }
};
