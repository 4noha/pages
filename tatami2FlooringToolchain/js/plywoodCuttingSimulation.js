/**
 * 合板カットシミュレーション関連の機能
 */

// グローバルオブジェクトの初期化
window.plywoodCuttingSimulation = {};

/**
 * 合板カットシミュレーションを初期化する関数
 */
window.plywoodCuttingSimulation.init = function() {
  // 根太本数計算器の値と同期
  const roomWidthInput = document.getElementById('roomWidth');
  const roomDepthInput = document.getElementById('roomDepth');
  const plywoodRoomWidthInput = document.getElementById('plywoodRoomWidth');
  const plywoodRoomDepthInput = document.getElementById('plywoodRoomDepth');
  
  // 初期値を設定
  plywoodRoomWidthInput.value = roomWidthInput.value;
  plywoodRoomDepthInput.value = roomDepthInput.value;
  
  // 根太本数計算器の値が変更されたら同期する
  roomWidthInput.addEventListener('change', function() {
    plywoodRoomWidthInput.value = this.value;
    window.plywoodCuttingSimulation.calculate();
  });
  
  roomDepthInput.addEventListener('change', function() {
    plywoodRoomDepthInput.value = this.value;
    window.plywoodCuttingSimulation.calculate();
  });
  
  // 初回計算を実行
  window.plywoodCuttingSimulation.calculate();
};

/**
 * 合板カットシミュレーションを計算する関数
 */
window.plywoodCuttingSimulation.calculate = function() {
  const roomWidth = parseFloat(document.getElementById('plywoodRoomWidth').value);
  const roomDepth = parseFloat(document.getElementById('plywoodRoomDepth').value);
  const plywoodWidth = parseFloat(document.getElementById('plywoodWidth').value);
  const plywoodLength = parseFloat(document.getElementById('plywoodLength').value);
  
  if (isNaN(roomWidth) || isNaN(roomDepth) || isNaN(plywoodWidth) || isNaN(plywoodLength)) {
    document.getElementById('plywoodCuttingSummary').textContent = '入力値を確認してください';
    document.getElementById('plywoodCuttingSimulation').innerHTML = '<p class="text-muted">計算できません</p>';
    return;
  }
  
  // 合板の必要枚数と切り出し方法を計算
  const result = calculatePlywoodCutting(roomWidth, roomDepth, plywoodWidth, plywoodLength);
  
  // 結果を表示
  document.getElementById('plywoodCuttingSummary').textContent = 
    `合板の必要枚数: ${result.totalSheets}枚 (使用率: ${result.utilizationRate.toFixed(1)}%)`;
  
  // 切り出し図を描画
  renderPlywoodCuttingSimulation(result, plywoodWidth, plywoodLength);
};

/**
 * 合板の必要枚数と切り出し方法を計算する関数
 * @param {number} roomWidth - 畳の枠内の幅 (mm)
 * @param {number} roomDepth - 畳の枠内の奥行き (mm)
 * @param {number} plywoodWidth - 合板の幅 (mm)
 * @param {number} plywoodLength - 合板の長さ (mm)
 * @returns {Object} 計算結果
 */
function calculatePlywoodCutting(roomWidth, roomDepth, plywoodWidth, plywoodLength) {
  // 合板を横置きと縦置きの両方で試して、より効率の良い方を選択
  const horizontalResult = calculatePlywoodCuttingOrientation(roomWidth, roomDepth, plywoodWidth, plywoodLength);
  const verticalResult = calculatePlywoodCuttingOrientation(roomWidth, roomDepth, plywoodLength, plywoodWidth);
  
  return horizontalResult.utilizationRate > verticalResult.utilizationRate ? horizontalResult : verticalResult;
}

/**
 * 特定の向きでの合板の必要枚数と切り出し方法を計算する関数
 * @param {number} roomWidth - 畳の枠内の幅 (mm)
 * @param {number} roomDepth - 畳の枠内の奥行き (mm)
 * @param {number} sheetWidth - 合板の幅 (mm)
 * @param {number} sheetLength - 合板の長さ (mm)
 * @returns {Object} 計算結果
 */
function calculatePlywoodCuttingOrientation(roomWidth, roomDepth, sheetWidth, sheetLength) {
  // 幅方向に必要な合板の枚数
  const widthSheets = Math.ceil(roomWidth / sheetWidth);
  
  // 奥行き方向に必要な合板の枚数
  const depthSheets = Math.ceil(roomDepth / sheetLength);
  
  // 合計の合板枚数
  const totalSheets = widthSheets * depthSheets;
  
  // 使用率を計算
  const totalArea = roomWidth * roomDepth;
  const sheetArea = sheetWidth * sheetLength;
  const utilizationRate = (totalArea / (totalSheets * sheetArea)) * 100;
  
  // 切り出し情報を作成
  const sheets = [];
  
  for (let i = 0; i < widthSheets; i++) {
    for (let j = 0; j < depthSheets; j++) {
      // 各合板から切り出す部分の幅と高さ
      const cutWidth = Math.min(sheetWidth, roomWidth - i * sheetWidth);
      const cutLength = Math.min(sheetLength, roomDepth - j * sheetLength);
      
      sheets.push({
        index: i * depthSheets + j,
        x: i * sheetWidth,
        y: j * sheetLength,
        width: cutWidth,
        length: cutLength,
        isPartial: cutWidth < sheetWidth || cutLength < sheetLength
      });
    }
  }
  
  return {
    orientation: sheetWidth < sheetLength ? 'horizontal' : 'vertical',
    widthSheets,
    depthSheets,
    totalSheets,
    utilizationRate,
    sheets,
    sheetWidth,
    sheetLength
  };
}

/**
 * 合板の切り出し図を描画する関数
 * @param {Object} result - 計算結果
 * @param {number} originalWidth - 元の合板の幅 (mm)
 * @param {number} originalLength - 元の合板の長さ (mm)
 */
function renderPlywoodCuttingSimulation(result, originalWidth, originalLength) {
  const container = document.getElementById('plywoodCuttingSimulation');
  container.innerHTML = '';
  
  // 向きの説明を表示
  const orientationInfo = document.createElement('p');
  orientationInfo.className = 'text-muted mb-3';
  orientationInfo.textContent = result.orientation === 'horizontal' 
    ? `合板を横置き (${result.sheetWidth}mm x ${result.sheetLength}mm) で配置` 
    : `合板を縦置き (${result.sheetWidth}mm x ${result.sheetLength}mm) で配置`;
  container.appendChild(orientationInfo);
  
  // 全体の配置図を表示
  const layoutTitle = document.createElement('h6');
  layoutTitle.textContent = '合板の配置図';
  container.appendChild(layoutTitle);
  
  // 配置図のコンテナ
  const layoutContainer = document.createElement('div');
  layoutContainer.className = 'border p-3 mb-4';
  layoutContainer.style.position = 'relative';
  layoutContainer.style.width = '100%';
  layoutContainer.style.height = '400px';
  layoutContainer.style.overflow = 'auto';
  
  // 配置図の描画エリア
  const layoutArea = document.createElement('div');
  layoutArea.style.position = 'relative';
  
  // スケールを計算（最大幅を800pxとする）
  const maxWidth = 800;
  const scale = Math.min(maxWidth / (result.widthSheets * result.sheetWidth), 1);
  
  // 描画エリアのサイズを設定
  layoutArea.style.width = `${result.widthSheets * result.sheetWidth * scale}px`;
  layoutArea.style.height = `${result.depthSheets * result.sheetLength * scale}px`;
  
  // 合板を描画
  result.sheets.forEach(sheet => {
    const sheetDiv = document.createElement('div');
    sheetDiv.className = 'border';
    sheetDiv.style.position = 'absolute';
    sheetDiv.style.left = `${sheet.x * scale}px`;
    sheetDiv.style.top = `${sheet.y * scale}px`;
    sheetDiv.style.width = `${result.sheetWidth * scale}px`;
    sheetDiv.style.height = `${result.sheetLength * scale}px`;
    sheetDiv.style.backgroundColor = '#f8f9fa';
    
    // 切り出し部分を描画
    const cutDiv = document.createElement('div');
    cutDiv.style.position = 'absolute';
    cutDiv.style.left = '0';
    cutDiv.style.top = '0';
    cutDiv.style.width = `${sheet.width * scale}px`;
    cutDiv.style.height = `${sheet.length * scale}px`;
    cutDiv.style.backgroundColor = sheet.isPartial ? '#ffc107' : '#28a745';
    cutDiv.style.opacity = '0.7';
    
    // 合板番号を表示
    const indexLabel = document.createElement('div');
    indexLabel.className = 'position-absolute text-center w-100';
    indexLabel.style.top = '50%';
    indexLabel.style.transform = 'translateY(-50%)';
    indexLabel.style.fontSize = '14px';
    indexLabel.style.fontWeight = 'bold';
    indexLabel.textContent = `#${sheet.index + 1}`;
    
    sheetDiv.appendChild(cutDiv);
    sheetDiv.appendChild(indexLabel);
    layoutArea.appendChild(sheetDiv);
  });
  
  layoutContainer.appendChild(layoutArea);
  container.appendChild(layoutContainer);
  
  // 個別の合板切り出し図を表示
  const sheetsTitle = document.createElement('h6');
  sheetsTitle.className = 'mt-4';
  sheetsTitle.textContent = '個別の合板切り出し図';
  container.appendChild(sheetsTitle);
  
  // 合板ごとにグループ化
  const sheetGroups = {};
  result.sheets.forEach(sheet => {
    const key = `${sheet.width}x${sheet.length}`;
    if (!sheetGroups[key]) {
      sheetGroups[key] = [];
    }
    sheetGroups[key].push(sheet);
  });
  
  // 各グループの切り出し図を表示
  Object.keys(sheetGroups).forEach(key => {
    const sheets = sheetGroups[key];
    const firstSheet = sheets[0];
    
    const groupDiv = document.createElement('div');
    groupDiv.className = 'mb-4';
    
    const groupTitle = document.createElement('div');
    groupTitle.className = 'mb-2';
    groupTitle.textContent = `${key}mm の合板 (${sheets.length}枚)`;
    groupDiv.appendChild(groupTitle);
    
    // 合板の切り出し図
    const sheetDiv = document.createElement('div');
    sheetDiv.className = 'border p-2';
    sheetDiv.style.position = 'relative';
    sheetDiv.style.width = '300px';
    sheetDiv.style.height = `${300 * (result.sheetLength / result.sheetWidth)}px`;
    sheetDiv.style.backgroundColor = '#f8f9fa';
    
    // 切り出し部分を描画
    const cutDiv = document.createElement('div');
    cutDiv.style.position = 'absolute';
    cutDiv.style.left = '0';
    cutDiv.style.top = '0';
    cutDiv.style.width = `${(firstSheet.width / result.sheetWidth) * 300}px`;
    cutDiv.style.height = `${(firstSheet.length / result.sheetLength) * 300 * (result.sheetLength / result.sheetWidth)}px`;
    cutDiv.style.backgroundColor = firstSheet.isPartial ? '#ffc107' : '#28a745';
    cutDiv.style.opacity = '0.7';
    
    // 寸法を表示
    const dimensionLabel = document.createElement('div');
    dimensionLabel.className = 'position-absolute text-center';
    dimensionLabel.style.left = '50%';
    dimensionLabel.style.top = '50%';
    dimensionLabel.style.transform = 'translate(-50%, -50%)';
    dimensionLabel.style.fontSize = '14px';
    dimensionLabel.style.fontWeight = 'bold';
    dimensionLabel.style.color = '#000';
    dimensionLabel.textContent = `${firstSheet.width} x ${firstSheet.length} mm`;
    
    sheetDiv.appendChild(cutDiv);
    sheetDiv.appendChild(dimensionLabel);
    groupDiv.appendChild(sheetDiv);
    
    // 元の合板サイズを表示
    const originalSizeLabel = document.createElement('div');
    originalSizeLabel.className = 'text-muted mt-1';
    originalSizeLabel.textContent = `元の合板サイズ: ${originalWidth} x ${originalLength} mm`;
    groupDiv.appendChild(originalSizeLabel);
    
    container.appendChild(groupDiv);
  });
  
  // 使用率の詳細を表示
  const usageDetails = document.createElement('div');
  usageDetails.className = 'alert alert-info mt-3';
  
  const totalArea = (result.widthSheets * result.sheetWidth) * (result.depthSheets * result.sheetLength);
  const usedArea = parseFloat(document.getElementById('plywoodRoomWidth').value) * parseFloat(document.getElementById('plywoodRoomDepth').value);
  const wasteArea = totalArea - usedArea;
  
  usageDetails.innerHTML = `
    <p><strong>使用率の詳細:</strong></p>
    <ul class="mb-0">
      <li>合板の総面積: ${(totalArea / 1000000).toFixed(2)} m²</li>
      <li>使用面積: ${(usedArea / 1000000).toFixed(2)} m²</li>
      <li>端材面積: ${(wasteArea / 1000000).toFixed(2)} m²</li>
      <li>使用率: ${result.utilizationRate.toFixed(1)}%</li>
    </ul>
  `;
  
  container.appendChild(usageDetails);
}
