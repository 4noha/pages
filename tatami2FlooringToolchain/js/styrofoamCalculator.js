/**
 * スタイロフォーム計算関連の機能
 */

/**
 * スタイロフォームパーツ一覧を計算する関数
 * @param {number} roomWidth - 部屋の幅 (mm)
 * @param {number} roomDepth - 部屋の奥行き (mm)
 * @param {number} joistWidth - 根太の幅 (mm)
 * @param {number} joistColCount - 根太の本数
 * @param {number} styrofoamWidth - スタイロフォームの幅 (mm)
 * @param {number} lastStyrofoamWidth - 最後のスタイロフォームの幅 (mm)
 */
window.calculateStyrofoamParts = function(roomWidth, roomDepth, joistWidth, joistColCount, styrofoamWidth, lastStyrofoamWidth) {
  // 引数がない場合は、calculatejoistColCount関数から直接呼び出されていない場合
  if (arguments.length === 0) {
    // 根太本数計算機の値を取得
    const roomWidth = parseFloat(document.getElementById('roomWidth').value);
    const roomDepth = parseFloat(document.getElementById('roomDepth').value);
    
    // 根太サイズを取得
    const selectElement = document.getElementById('selectedJoistSize');
    const selectedIndex = selectElement.selectedIndex;
    
    if (selectedIndex < 0) {
      document.getElementById('styrofoamPartsList').innerHTML = '<tr><td colspan="4" class="text-center text-danger">根太サイズを選択してください</td></tr>';
      return;
    }
    
    const joistSizesText = document.getElementById('joistSizes').value;
    const joistSizes = window.parseJoistSizes(joistSizesText);
    
    if (selectedIndex >= joistSizes.length) {
      document.getElementById('styrofoamPartsList').innerHTML = '<tr><td colspan="4" class="text-center text-danger">根太サイズの選択が無効です</td></tr>';
      return;
    }
    
    const selectedJoist = joistSizes[selectedIndex];
    const toggleDimensions = document.getElementById('toggleJoistDimensions').checked;
    
    let joistWidth = selectedJoist.width;
    if (toggleDimensions) {
      joistWidth = selectedJoist.height;
    }
    
    const joistSpacing = parseFloat(document.getElementById('joistSpacing').value);
    const availableWidth = roomWidth - (joistWidth * 2); // 両端の根太を除いた利用可能な幅
    const styrofoamCount = Math.floor(availableWidth / (joistWidth + joistSpacing));
    const joistColCount = styrofoamCount + 1 + 2; // 内部の根太 + 両端の根太2本
    
    const styrofoamWidth = joistSpacing;
    
    const totalJoistWidth = joistColCount * joistWidth;
    const totalStyrofoamWidth = styrofoamCount * joistSpacing;
    const remainingWidth = roomWidth - totalJoistWidth - totalStyrofoamWidth;
    const lastStyrofoamWidth = Math.max(0, remainingWidth);
  }
  
  // スタイロフォーム材の長さは標準サイズの1820mm固定
  const styrofoamLength = 1820;
  
  // スタイロフォームパーツの一覧を作成
  const parts = [];
  const detailedParts = [];
  
  // 標準サイズのスタイロフォーム材の寸法
  const standardWidth = 910;  // mm
  const standardLength = 1820; // mm
  
  // 通常サイズのスタイロフォーム（最後以外）
  if (styrofoamWidth > 0 && joistColCount > 1) {
    // 部屋の奥行きに対して何枚のスタイロフォーム材が必要か計算
    const area = (styrofoamWidth * roomDepth) / 1000000 * (joistColCount - 2); // m²
    
    parts.push({
      type: '通常サイズ',
      size: `${styrofoamWidth.toFixed(1)} x ${roomDepth.toFixed(1)}`,
      count: joistColCount - 2,
      pieces: joistColCount - 2, // 列数と同じ（1列につき1枚）
      area: area
    });
    
    // 詳細なパーツ計算
    // 部屋の奥行きを標準サイズの長さで分割
    const fullLengthParts = Math.floor(roomDepth / styrofoamLength);
    const remainingLength = roomDepth % styrofoamLength;
    
    // 1枚の標準サイズスタイロフォームから切り出せるパーツ数を計算
    const partsPerWidth = Math.floor(standardWidth / styrofoamWidth);
    
    // 切り出し方法の詳細
    if (partsPerWidth > 0) {
      // 幅方向に切り出せる場合
      const fullWidthParts = Math.floor(standardWidth / styrofoamWidth);
      
      // フルカットのパーツ（標準サイズの長さ）
      if (fullLengthParts > 0) {
        detailedParts.push({
          type: '通常サイズ（フルカット）',
          size: `${styrofoamWidth.toFixed(1)} x ${styrofoamLength.toFixed(1)}`,
          count: fullLengthParts * (joistColCount - 2), // 列数 × 長さ方向の分割数
          note: `標準サイズから${fullWidthParts}枚取れます`
        });
      }
      
      // 端材のパーツ（残りの長さ）
      if (remainingLength > 0) {
        detailedParts.push({
          type: '通常サイズ（端材）',
          size: `${styrofoamWidth.toFixed(1)} x ${remainingLength.toFixed(1)}`,
          count: joistColCount - 2, // 列数と同じ（1列につき1枚）
          note: '長さ方向の端材'
        });
      }
    }
  }
  
  // 最後のスタイロフォーム（幅が異なる場合）
  if (lastStyrofoamWidth > 0 && lastStyrofoamWidth !== styrofoamWidth) {
    // 部屋の奥行きに対して必要な面積を計算
    const areaForLast = (lastStyrofoamWidth * roomDepth) / 1000000; // m²
    
    parts.push({
      type: '最後のスタイロフォーム',
      size: `${lastStyrofoamWidth.toFixed(1)} x ${roomDepth.toFixed(1)}`,
      count: 1,
      pieces: 1, // 1列につき1枚
      area: areaForLast
    });
    
    // 詳細なパーツ計算
    // 部屋の奥行きを標準サイズの長さで分割
    const fullLengthParts = Math.floor(roomDepth / styrofoamLength);
    const remainingLength = roomDepth % styrofoamLength;
    
    // 1枚の標準サイズスタイロフォームから切り出せるパーツ数を計算
    const partsPerWidth = Math.floor(standardWidth / lastStyrofoamWidth);
    
    // 切り出し方法の詳細
    if (partsPerWidth > 0) {
      // 幅方向に切り出せる場合
      const fullWidthParts = Math.floor(standardWidth / lastStyrofoamWidth);
      
      // フルカットのパーツ（標準サイズの長さ）
      if (fullLengthParts > 0) {
        detailedParts.push({
          type: '最後のスタイロフォーム（フルカット）',
          size: `${lastStyrofoamWidth.toFixed(1)} x ${styrofoamLength.toFixed(1)}`,
          count: fullLengthParts, // 長さ方向の分割数
          note: `標準サイズから${fullWidthParts}枚取れます`
        });
      }
      
      // 端材のパーツ（残りの長さ）
      if (remainingLength > 0) {
        detailedParts.push({
          type: '最後のスタイロフォーム（端材）',
          size: `${lastStyrofoamWidth.toFixed(1)} x ${remainingLength.toFixed(1)}`,
          count: 1, // 1列につき1枚
          note: '長さ方向の端材'
        });
      }
    }
  }
  
  // 結果をテーブルに表示
  const tbody = document.getElementById('styrofoamPartsList');
  tbody.innerHTML = '';
  
  let totalPieces = 0;
  let totalArea = 0;
  
  if (parts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">スタイロフォームが必要ありません</td></tr>';
  } else {
    parts.forEach(part => {
      const tr = document.createElement('tr');
      
      const typeCell = document.createElement('td');
      typeCell.textContent = part.type;
      tr.appendChild(typeCell);
      
      const sizeCell = document.createElement('td');
      sizeCell.textContent = part.size;
      tr.appendChild(sizeCell);
      
      const countCell = document.createElement('td');
      countCell.textContent = `${part.count}列 (${part.pieces}枚)`;
      tr.appendChild(countCell);
      
      const areaCell = document.createElement('td');
      areaCell.textContent = `${part.area.toFixed(2)} m²`;
      tr.appendChild(areaCell);
      
      tbody.appendChild(tr);
      
      totalPieces += part.pieces;
      totalArea += part.area;
    });
    
    // 詳細なパーツ情報を表示
    if (detailedParts.length > 0) {
      // セパレータ行を追加
      const separatorRow = document.createElement('tr');
      const separatorCell = document.createElement('td');
      separatorCell.colSpan = 4;
      separatorCell.className = 'table-secondary';
      separatorCell.textContent = '切り出しパーツ詳細';
      separatorRow.appendChild(separatorCell);
      tbody.appendChild(separatorRow);
      
      // 詳細パーツ情報を表示
      detailedParts.forEach(part => {
        const tr = document.createElement('tr');
        
        const typeCell = document.createElement('td');
        typeCell.textContent = part.type;
        tr.appendChild(typeCell);
        
        const sizeCell = document.createElement('td');
        sizeCell.textContent = part.size;
        tr.appendChild(sizeCell);
        
        const countCell = document.createElement('td');
        countCell.textContent = `${part.count}枚`;
        tr.appendChild(countCell);
        
        const noteCell = document.createElement('td');
        noteCell.textContent = part.note || '';
        tr.appendChild(noteCell);
        
        tbody.appendChild(tr);
      });
    }
  }
  
  // 切り出しパーツ詳細の合計枚数を計算
  let detailedTotalPieces = 0;
  detailedParts.forEach(part => {
    detailedTotalPieces += part.count;
  });
  
  // 合計を表示
  document.getElementById('totalStyrofoamPieces').textContent = `${detailedTotalPieces}枚`;
  document.getElementById('totalStyrofoamArea').textContent = `${totalArea.toFixed(2)} m²`;
  
  // 切り出しシミュレーションを表示
  window.renderCuttingSimulation(detailedParts, standardWidth, standardLength);
}

/**
 * 同じレイアウトのシートをグループ化する関数
 * @param {Array} sheets - シートの配列
 * @returns {Object} グループ化されたシート
 */
window.groupSheetsByLayout = function(sheets) {
  const layoutGroups = {};
  
  sheets.forEach(sheet => {
    // レイアウトのハッシュキーを生成
    const layoutKey = window.generateLayoutKey(sheet);
    
    if (!layoutGroups[layoutKey]) {
      layoutGroups[layoutKey] = [];
    }
    
    layoutGroups[layoutKey].push(sheet);
  });
  
  return layoutGroups;
}

/**
 * シートのレイアウトからハッシュキーを生成する関数
 * @param {Object} sheet - シート情報
 * @returns {string} レイアウトキー
 */
window.generateLayoutKey = function(sheet) {
  // パーツの配置情報をソートしてJSON文字列化
  const sortedParts = [...sheet.parts].sort((a, b) => {
    if (a.x !== b.x) return a.x - b.x;
    if (a.y !== b.y) return a.y - b.y;
    if (a.width !== b.width) return a.width - b.width;
    return a.height - b.height;
  });
  
  // 位置と寸法だけを抽出
  const layoutInfo = sortedParts.map(part => ({
    x: part.x,
    y: part.y,
    w: part.width,
    h: part.height,
    t: part.type
  }));
  
  return JSON.stringify(layoutInfo);
}

/**
 * 必要なスタイロフォーム材の枚数と切り出し配置を計算する関数
 * @param {Array} detailedParts - 詳細なパーツ情報
 * @param {number} standardWidth - 標準幅
 * @param {number} standardLength - 標準長さ
 * @returns {Array} 必要なシートの配列
 */
window.calculateRequiredSheets = function(detailedParts, standardWidth, standardLength) {
  // パーツをサイズの大きい順にソート
  const sortedParts = [];
  
  detailedParts.forEach(part => {
    const width = parseFloat(part.size.split(' x ')[0]);
    const height = parseFloat(part.size.split(' x ')[1]);
    
    for (let i = 0; i < part.count; i++) {
      sortedParts.push({
        type: part.type,
        width: width,
        height: height
      });
    }
  });
  
  // 面積の大きい順にソート
  sortedParts.sort((a, b) => (b.width * b.height) - (a.width * a.height));
  
  // シートのリスト
  const sheets = [];
  
  // 各パーツを配置
  sortedParts.forEach(part => {
    let placed = false;
    
    // 既存のシートに配置を試みる
    for (let i = 0; i < sheets.length; i++) {
      if (window.tryPlacePart(sheets[i], part)) {
        placed = true;
        break;
      }
    }
    
    // 既存のシートに配置できなかった場合、新しいシートを作成
    if (!placed) {
      const newSheet = {
        width: standardWidth,
        height: standardLength,
        parts: []
      };
      
      if (window.tryPlacePart(newSheet, part)) {
        sheets.push(newSheet);
      } else {
        console.error('パーツを配置できません:', part);
      }
    }
  });
  
  return sheets;
}

/**
 * パーツをシートに配置を試みる関数
 * @param {Object} sheet - シート情報
 * @param {Object} part - パーツ情報
 * @returns {boolean} 配置できたかどうか
 */
window.tryPlacePart = function(sheet, part) {
  // シートの空きスペースを探す
  const spaces = window.findEmptySpaces(sheet);
  
  // 各空きスペースにパーツを配置できるか試す
  for (const space of spaces) {
    if (space.width >= part.width && space.height >= part.height) {
      // パーツを配置
      sheet.parts.push({
        type: part.type,
        x: space.x,
        y: space.y,
        width: part.width,
        height: part.height
      });
      return true;
    }
    
    // 回転して配置できるか試す
    if (space.width >= part.height && space.height >= part.width) {
      // パーツを回転して配置
      sheet.parts.push({
        type: part.type,
        x: space.x,
        y: space.y,
        width: part.height,
        height: part.width
      });
      return true;
    }
  }
  
  return false;
}

/**
 * シートの空きスペースを見つける関数
 * @param {Object} sheet - シート情報
 * @returns {Array} 空きスペースの配列
 */
window.findEmptySpaces = function(sheet) {
  if (sheet.parts.length === 0) {
    // シートが空の場合、左上から配置
    return [{ x: 0, y: 0, width: sheet.width, height: sheet.height }];
  }
  
  // 単純化のため、左上から順に詰めていく方式を採用
  // より複雑なパッキングアルゴリズムを実装する場合は、ここを拡張する
  
  // 使用済みの領域を特定
  const usedAreas = [];
  sheet.parts.forEach(part => {
    usedAreas.push({
      x1: part.x,
      y1: part.y,
      x2: part.x + part.width,
      y2: part.y + part.height
    });
  });
  
  // 単純な配置方法: 左上から順に、既存のパーツの右側または下側に配置
  const spaces = [];
  
  // 左上の空きスペース
  let minY = sheet.height;
  for (const area of usedAreas) {
    if (area.y1 < minY) {
      minY = area.y1;
    }
  }
  
  if (minY > 0) {
    spaces.push({ x: 0, y: 0, width: sheet.width, height: minY });
  }
  
  // 各パーツの右側と下側の空きスペース
  sheet.parts.forEach(part => {
    // 右側の空きスペース
    if (part.x + part.width < sheet.width) {
      // 右側に他のパーツがないか確認
      let hasOverlap = false;
      for (const otherPart of sheet.parts) {
        if (otherPart !== part && 
            otherPart.x < part.x + part.width + 1 && 
            otherPart.x + otherPart.width > part.x + part.width &&
            otherPart.y < part.y + part.height &&
            otherPart.y + otherPart.height > part.y) {
          hasOverlap = true;
          break;
        }
      }
      
      if (!hasOverlap) {
        spaces.push({
          x: part.x + part.width,
          y: part.y,
          width: sheet.width - (part.x + part.width),
          height: part.height
        });
      }
    }
    
    // 下側の空きスペース
    if (part.y + part.height < sheet.height) {
      // 下側に他のパーツがないか確認
      let hasOverlap = false;
      for (const otherPart of sheet.parts) {
        if (otherPart !== part && 
            otherPart.y < part.y + part.height + 1 && 
            otherPart.y + otherPart.height > part.y + part.height &&
            otherPart.x < part.x + part.width &&
            otherPart.x + otherPart.width > part.x) {
          hasOverlap = true;
          break;
        }
      }
      
      if (!hasOverlap) {
        spaces.push({
          x: part.x,
          y: part.y + part.height,
          width: part.width,
          height: sheet.height - (part.y + part.height)
        });
      }
    }
  });
  
  // 面積の大きい順にソート
  spaces.sort((a, b) => (b.width * b.height) - (a.width * a.height));
  
  return spaces;
}
