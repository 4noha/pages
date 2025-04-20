/**
 * 可視化関連の機能
 */

/**
 * 切り出しシミュレーションを描画する関数
 * @param {Array} detailedParts - 詳細なパーツ情報
 * @param {number} standardWidth - 標準幅
 * @param {number} standardLength - 標準長さ
 */
window.renderCuttingSimulation = function(detailedParts, standardWidth, standardLength) {
  const container = document.getElementById('cuttingSimulation');
  container.innerHTML = '';
  
  if (detailedParts.length === 0) {
    container.innerHTML = '<p class="text-muted">スタイロフォームが必要ありません</p>';
    return;
  }
  
  // 必要なスタイロフォーム材の枚数を計算
  const requiredSheets = calculateRequiredSheets(detailedParts, standardWidth, standardLength);
  
  // 同じレイアウトのシートをグループ化
  const layoutGroups = groupSheetsByLayout(requiredSheets);
  
  // 各レイアウトパターンの切り出し図を描画
  let layoutIndex = 1;
  for (const layoutKey in layoutGroups) {
    const sheets = layoutGroups[layoutKey];
    const sheet = sheets[0]; // 同じレイアウトなので最初のシートを使用
    
    // レイアウトのタイトル
    const layoutTitle = document.createElement('h5');
    layoutTitle.className = 'mt-4';
    layoutTitle.textContent = `レイアウトパターン ${layoutIndex} (${sheets.length}枚必要)`;
    container.appendChild(layoutTitle);
    
    // シートの寸法を表示
    const dimensionLabel = document.createElement('div');
    dimensionLabel.className = 'text-muted small mb-2';
    dimensionLabel.textContent = `${standardLength}mm x ${standardWidth}mm`;
    container.appendChild(dimensionLabel);
    
    // シートの切り出し図（横向きに描画）
    const sheetDiv = document.createElement('div');
    sheetDiv.className = 'border p-2 mb-3';
    sheetDiv.style.position = 'relative';
    sheetDiv.style.width = '100%';
    
    // 横向きに描画するため、幅と高さを入れ替える
    // 1820x910の比率を維持
    const aspectRatio = standardWidth / standardLength; // 幅と高さを入れ替え
    const containerWidth = sheetDiv.clientWidth || 800; // デフォルト幅
    const containerHeight = containerWidth * aspectRatio;
    
    sheetDiv.style.height = `${containerHeight}px`;
    sheetDiv.style.backgroundColor = '#f8f9fa';
    
    // 切り出しパーツを描画（横向きに描画）
    sheet.parts.forEach(part => {
      const partDiv = document.createElement('div');
      partDiv.className = 'border';
      partDiv.style.position = 'absolute';
      // 横向きに描画するため、x座標とy座標を入れ替え、さらに座標系を反転
      partDiv.style.left = `${(part.y / standardLength * 100)}%`;
      partDiv.style.top = `${(part.x / standardWidth * 100)}%`;
      // 幅と高さも入れ替え
      partDiv.style.width = `${(part.height / standardLength * 100)}%`;
      partDiv.style.height = `${(part.width / standardWidth * 100)}%`;
      partDiv.style.backgroundColor = part.type.includes('通常サイズ') ? '#c6e0b4' : '#ffd966';
      partDiv.style.overflow = 'hidden';
      
      // パーツの寸法を表示
      const partLabel = document.createElement('div');
      partLabel.className = 'small text-center';
      partLabel.style.fontSize = '10px';
      partLabel.style.transform = 'scale(0.8)';
      partLabel.style.transformOrigin = 'center';
      partLabel.style.marginTop = '2px';
      partLabel.textContent = `${part.height}x${part.width}`;
      partDiv.appendChild(partLabel);
      
      sheetDiv.appendChild(partDiv);
    });
    
    container.appendChild(sheetDiv);
    layoutIndex++;
  }
  
  // 必要なスタイロフォーム材の枚数を計算
  let totalRequiredSheets = 0;
  for (const layoutKey in layoutGroups) {
    totalRequiredSheets += layoutGroups[layoutKey].length;
  }
  
  // スタイロフォーム材の必要枚数を表示
  document.getElementById('styrofoamSummary').textContent = 
    `スタイロフォーム材の必要枚数: ${totalRequiredSheets}枚 (${standardLength}mm x ${standardWidth}mm サイズ)`;
  
  // 使用率の表示
  const usageInfo = document.createElement('p');
  usageInfo.className = 'text-muted mt-3';
  
  // 使用面積を計算
  let totalUsedArea = 0;
  detailedParts.forEach(part => {
    const width = parseFloat(part.size.split(' x ')[0]);
    const height = parseFloat(part.size.split(' x ')[1]);
    totalUsedArea += (width * height * part.count) / 1000000; // m²
  });
  
  // 総面積
  const totalSheetArea = (standardWidth * standardLength * totalRequiredSheets) / 1000000; // m²
  
  // 使用率
  const usageRate = (totalUsedArea / totalSheetArea) * 100;
  
  usageInfo.textContent = `使用率: ${usageRate.toFixed(1)}% (使用面積: ${totalUsedArea.toFixed(2)}m² / 総面積: ${totalSheetArea.toFixed(2)}m²)`;
  container.appendChild(usageInfo);
}

/**
 * 根太とスタイロフォームの配置図を描画する関数
 * @param {number} roomWidth - 部屋の幅 (mm)
 * @param {number} roomDepth - 部屋の奥行き (mm)
 * @param {number} joistWidth - 根太の幅 (mm)
 * @param {number} joistColCount - 根太の本数
 * @param {number} styrofoamWidth - スタイロフォームの幅 (mm)
 * @param {number} lastStyrofoamWidth - 最後のスタイロフォームの幅 (mm)
 */
window.renderJoistLayout = function(roomWidth, roomDepth, joistWidth, joistColCount, styrofoamWidth, lastStyrofoamWidth) {
  const container = document.getElementById('joistLayoutCanvas');
  container.innerHTML = ''; // コンテナをクリア
  
  // コンテナのサイズを取得
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  
  // 描画エリアを作成
  const drawingArea = document.createElement('div');
  drawingArea.style.position = 'relative';
  drawingArea.style.width = '100%';
  drawingArea.style.height = '100%';
  drawingArea.style.backgroundColor = '#ffffff';
  drawingArea.style.border = '1px solid #dee2e6';
  drawingArea.style.overflow = 'hidden';
  
  // 部屋の寸法を表示
  const roomDimensionLabel = document.createElement('div');
  roomDimensionLabel.className = 'position-absolute text-center w-100 small text-muted';
  roomDimensionLabel.style.top = '5px';
  roomDimensionLabel.textContent = `畳の枠内の寸法: ${roomWidth}mm × ${roomDepth}mm`;
  drawingArea.appendChild(roomDimensionLabel);
  
  // 縦方向の高さを設定（コンテナの高さの80%を使用）
  const fixedHeight = Math.floor(containerHeight * 0.8); // コンテナの高さの80%
  
  // 縮尺を計算（余白を考慮）
  const horizontalPadding = 40; // px
  const scale = (containerWidth - horizontalPadding * 2) / roomWidth; // 横方向のスケールのみ使用
  
  // 描画エリアの中央に配置するためのオフセットを計算
  const scaledWidth = roomWidth * scale;
  const offsetX = Math.floor((containerWidth - scaledWidth) / 2);
  const offsetY = Math.floor((containerHeight - fixedHeight) / 2);
  
  // 畳の枠を描画
  const roomFrame = document.createElement('div');
  roomFrame.style.position = 'absolute';
  roomFrame.style.left = `${offsetX}px`;
  roomFrame.style.top = `${offsetY}px`;
  roomFrame.style.width = `${scaledWidth}px`;
  roomFrame.style.height = `${fixedHeight}px`;
  roomFrame.style.border = '2px solid #8b4513'; // 茶色の枠
  roomFrame.style.backgroundColor = '#f5f5dc'; // ベージュ色（畳をイメージ）
  drawingArea.appendChild(roomFrame);
  
  // 根太とスタイロフォームを描画
  let currentX = 0;
  
  // 壁の両端に根太があり、その間にスタイロフォームと根太が交互に配置される
  // 左端の根太を描画
  const leftJoist = document.createElement('div');
  leftJoist.style.position = 'absolute';
  leftJoist.style.left = `${offsetX}px`;
  leftJoist.style.top = `${offsetY}px`;
  leftJoist.style.width = `${joistWidth * scale}px`;
  leftJoist.style.height = `${fixedHeight}px`;
  leftJoist.style.backgroundColor = '#8b4513'; // 茶色（木材をイメージ）
  leftJoist.style.zIndex = '2'; // 根太を前面に表示
  
  // 根太の幅を表示（横書きで単位省略）
  if (joistWidth * scale > 15) { // 幅が十分ある場合のみラベルを表示
    const leftJoistLabel = document.createElement('div');
    leftJoistLabel.className = 'position-absolute text-center w-100 small text-white';
    leftJoistLabel.style.top = '50%';
    leftJoistLabel.style.transform = 'translateY(-50%)';
    leftJoistLabel.style.whiteSpace = 'nowrap';
    leftJoistLabel.textContent = `${joistWidth.toFixed(0)}`;
    leftJoist.appendChild(leftJoistLabel);
  }
  
  drawingArea.appendChild(leftJoist);
  
  currentX = joistWidth;
  
  // 内部の根太とスタイロフォームを描画
  const internaljoistColCount = joistColCount - 2; // 両端の根太を除く
  
  for (let i = 0; i < internaljoistColCount; i++) {
    // スタイロフォームを描画
    const styrofoam = document.createElement('div');
    styrofoam.style.position = 'absolute';
    styrofoam.style.left = `${offsetX + currentX * scale}px`;
    styrofoam.style.top = `${offsetY}px`;
    styrofoam.style.width = `${styrofoamWidth * scale}px`;
    styrofoam.style.height = `${fixedHeight}px`;
    styrofoam.style.backgroundColor = '#87ceeb'; // 水色（スタイロフォームをイメージ）
    styrofoam.style.zIndex = '1';
    
    // スタイロフォームの幅を表示（横書きで単位省略）
    if (styrofoamWidth * scale > 20) { // 幅が十分ある場合のみラベルを表示
      const styrofoamLabel = document.createElement('div');
      styrofoamLabel.className = 'position-absolute text-center w-100 small';
      styrofoamLabel.style.top = '50%';
      styrofoamLabel.style.transform = 'translateY(-50%)';
      styrofoamLabel.style.whiteSpace = 'nowrap';
      styrofoamLabel.textContent = `${styrofoamWidth.toFixed(0)}`;
      styrofoam.appendChild(styrofoamLabel);
    }
    
    drawingArea.appendChild(styrofoam);
    
    currentX += styrofoamWidth;
    
    // 内部の根太を描画
    const joist = document.createElement('div');
    joist.style.position = 'absolute';
    joist.style.left = `${offsetX + currentX * scale}px`;
    joist.style.top = `${offsetY}px`;
    joist.style.width = `${joistWidth * scale}px`;
    joist.style.height = `${fixedHeight}px`;
    joist.style.backgroundColor = '#8b4513'; // 茶色（木材をイメージ）
    joist.style.zIndex = '2'; // 根太を前面に表示
    
    // 根太の幅を表示（横書きで単位省略）
    if (joistWidth * scale > 15) { // 幅が十分ある場合のみラベルを表示
      const joistLabel = document.createElement('div');
      joistLabel.className = 'position-absolute text-center w-100 small text-white';
      joistLabel.style.top = '50%';
      joistLabel.style.transform = 'translateY(-50%)';
      joistLabel.style.whiteSpace = 'nowrap';
      joistLabel.textContent = `${joistWidth.toFixed(0)}`;
      joist.appendChild(joistLabel);
    }
    
    drawingArea.appendChild(joist);
    
    currentX += joistWidth;
  }
  
  // 最後のスタイロフォームを描画（幅が異なる場合もある）
  if (lastStyrofoamWidth > 0) {
    const lastStyrofoam = document.createElement('div');
    lastStyrofoam.style.position = 'absolute';
    lastStyrofoam.style.left = `${offsetX + currentX * scale}px`;
    lastStyrofoam.style.top = `${offsetY}px`;
    lastStyrofoam.style.width = `${lastStyrofoamWidth * scale}px`;
    lastStyrofoam.style.height = `${fixedHeight}px`;
    lastStyrofoam.style.backgroundColor = '#add8e6'; // 薄い水色（最後のスタイロフォームを区別）
    lastStyrofoam.style.zIndex = '1';
    
    // 最後のスタイロフォームの幅を表示（横書きで単位省略）
    if (lastStyrofoamWidth * scale > 20) { // 幅が十分ある場合のみラベルを表示
      const lastStyrofoamLabel = document.createElement('div');
      lastStyrofoamLabel.className = 'position-absolute text-center w-100 small';
      lastStyrofoamLabel.style.top = '50%';
      lastStyrofoamLabel.style.transform = 'translateY(-50%)';
      lastStyrofoamLabel.style.whiteSpace = 'nowrap';
      lastStyrofoamLabel.textContent = `${lastStyrofoamWidth.toFixed(0)}`;
      lastStyrofoam.appendChild(lastStyrofoamLabel);
    }
    
    drawingArea.appendChild(lastStyrofoam);
    
    currentX += lastStyrofoamWidth;
  }
  
  // 右端の根太を描画
  const rightJoist = document.createElement('div');
  rightJoist.style.position = 'absolute';
  rightJoist.style.left = `${offsetX + currentX * scale}px`;
  rightJoist.style.top = `${offsetY}px`;
  rightJoist.style.width = `${joistWidth * scale}px`;
  rightJoist.style.height = `${fixedHeight}px`;
  rightJoist.style.backgroundColor = '#8b4513'; // 茶色（木材をイメージ）
  rightJoist.style.zIndex = '2'; // 根太を前面に表示
  
  // 根太の幅を表示（横書きで単位省略）
  if (joistWidth * scale > 15) { // 幅が十分ある場合のみラベルを表示
    const rightJoistLabel = document.createElement('div');
    rightJoistLabel.className = 'position-absolute text-center w-100 small text-white';
    rightJoistLabel.style.top = '50%';
    rightJoistLabel.style.transform = 'translateY(-50%)';
    rightJoistLabel.style.whiteSpace = 'nowrap';
    rightJoistLabel.textContent = `${joistWidth.toFixed(0)}`;
    rightJoist.appendChild(rightJoistLabel);
  }
  
  drawingArea.appendChild(rightJoist);
  
  // コンテナに描画エリアを追加
  container.appendChild(drawingArea);
  
  // 合板をイメージした矩形を追加
  const plywoodContainer = document.createElement('div');
  plywoodContainer.style.position = 'relative';
  plywoodContainer.style.width = '100%';
  plywoodContainer.style.height = '50px'; // 合板の高さは短く設定
  plywoodContainer.style.marginTop = '240px'; // 根太配置図との間隔
  
  // 合板の説明ラベル
  const plywoodLabel = document.createElement('div');
  plywoodLabel.className = 'position-absolute text-center w-100 small text-muted';
  plywoodLabel.style.top = '-15px';
  plywoodLabel.textContent = '合板 (910mm幅)';
  plywoodContainer.appendChild(plywoodLabel);
  
  // 合板の枚数を計算（roomWidthを910mmで割る）
  const plywoodWidth = 910; // mm
  const plywoodCount = Math.ceil(roomWidth / plywoodWidth);
  
  // 合板の描画
  for (let i = 0; i < plywoodCount; i++) {
    const plywood = document.createElement('div');
    plywood.style.position = 'absolute';
    plywood.style.left = `${offsetX + (i * plywoodWidth) * scale}px`;
    plywood.style.top = '0px';
    // 最後の合板は残りの幅に合わせる
    const width = (i === plywoodCount - 1 && roomWidth % plywoodWidth !== 0) 
      ? (roomWidth % plywoodWidth) * scale 
      : plywoodWidth * scale;
    plywood.style.width = `${width}px`;
    plywood.style.height = '30px';
    plywood.style.backgroundColor = '#d2b48c'; // 木材色
    plywood.style.border = '1px solid #a0522d';
    plywood.style.zIndex = '3';
    
    // 合板の幅を表示
    if (width > 40) { // 幅が十分ある場合のみラベルを表示
      const plywoodSizeLabel = document.createElement('div');
      plywoodSizeLabel.className = 'position-absolute text-center w-100 small';
      plywoodSizeLabel.style.top = '50%';
      plywoodSizeLabel.style.transform = 'translateY(-50%)';
      plywoodSizeLabel.style.whiteSpace = 'nowrap';
      plywoodSizeLabel.textContent = (i === plywoodCount - 1 && roomWidth % plywoodWidth !== 0) 
        ? `${(roomWidth % plywoodWidth).toFixed(0)}mm` 
        : `${plywoodWidth}mm`;
      plywood.appendChild(plywoodSizeLabel);
    }
    
    plywoodContainer.appendChild(plywood);
  }
  
  drawingArea.appendChild(plywoodContainer);
    
  // 凡例を追加
  const legend = document.createElement('div');
  legend.className = 'position-absolute d-flex align-items-center';
  legend.style.bottom = '5px';
  legend.style.left = '5px';
  legend.style.fontSize = '10px';
  
  // 根太の凡例
  const joistLegend = document.createElement('div');
  joistLegend.className = 'd-flex align-items-center me-3';
  
  const joistColor = document.createElement('div');
  joistColor.style.width = '12px';
  joistColor.style.height = '12px';
  joistColor.style.backgroundColor = '#8b4513';
  joistColor.style.marginRight = '3px';
  joistLegend.appendChild(joistColor);
  
  const joistText = document.createElement('span');
  joistText.textContent = '根太';
  joistLegend.appendChild(joistText);
  
  legend.appendChild(joistLegend);
  
  // スタイロフォームの凡例
  const styrofoamLegend = document.createElement('div');
  styrofoamLegend.className = 'd-flex align-items-center';
  
  const styrofoamColor = document.createElement('div');
  styrofoamColor.style.width = '12px';
  styrofoamColor.style.height = '12px';
  styrofoamColor.style.backgroundColor = '#87ceeb';
  styrofoamColor.style.marginRight = '3px';
  styrofoamLegend.appendChild(styrofoamColor);
  
  const styrofoamText = document.createElement('span');
  styrofoamText.textContent = 'スタイロフォーム';
  styrofoamLegend.appendChild(styrofoamText);
  
  legend.appendChild(styrofoamLegend);
  
  drawingArea.appendChild(legend);
}
