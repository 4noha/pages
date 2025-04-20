/**
 * 共通ユーティリティ関数
 */

/**
 * テキストエリアから根太サイズを解析する
 * @param {string} joistSizesText - 根太サイズのテキスト
 * @returns {Array} 解析された根太サイズの配列
 */
window.parseJoistSizes = function(joistSizesText) {
  return joistSizesText.split('\n')
    .filter(line => line.trim() !== '')
    .map((line, index) => {
      const parts = line.split(',').map(part => part.trim());
      
      // 幅,高さ,名前 の形式の場合
      if (parts.length >= 3) {
        const width = parseFloat(parts[0]);
        const height = parseFloat(parts[1]);
        const name = parts[2];
        return { index, name, width, height };
      } 
      // 幅,高さ の形式の場合
      else if (parts.length === 2) {
        const width = parseFloat(parts[0]);
        const height = parseFloat(parts[1]);
        return { index, name: null, width, height };
      }
      
      return null;
    })
    .filter(size => size !== null && !isNaN(size.width) && !isNaN(size.height));
}

/**
 * テキストエリアから合板の厚みを解析する
 * @param {string} plywoodText - 合板の厚みのテキスト
 * @returns {Array} 解析された合板の厚みの配列
 */
window.parsePlywoodThicknesses = function(plywoodText) {
  return plywoodText.split(',')
    .map(num => parseFloat(num.trim()))
    .filter(thickness => !isNaN(thickness));
}
