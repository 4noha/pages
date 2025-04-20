/**
 * メインのアプリケーションロジックとイベントハンドラ
 */

// ページ読み込み時に初期計算を実行
window.onload = function() {
  // 初期計算を実行
  window.joistCalculator.calculateOptions();
  // 根太サイズリストを同期
  window.joistCalculator.syncJoistSizes();
};

// 根太サイズが変更されたときに同期を実行
document.addEventListener('DOMContentLoaded', function() {
  const joistSizesElement = document.getElementById('joistSizes');
  if (joistSizesElement) {
    joistSizesElement.addEventListener('change', window.joistCalculator.syncJoistSizes);
    joistSizesElement.addEventListener('keyup', window.joistCalculator.syncJoistSizes);
  }
});
