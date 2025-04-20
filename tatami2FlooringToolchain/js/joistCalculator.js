/**
 * 根太計算関連の機能
 */

// グローバルオブジェクトの初期化
window.joistCalculator = {};

/**
 * 根太サイズリストを同期させる関数
 */
window.joistCalculator.syncJoistSizes = function() {
  const joistSizesText = document.getElementById('joistSizes').value;
  const joistSizes = window.parseJoistSizes(joistSizesText);
  
  // 根太サイズのセレクトボックスを更新
  const selectElement = document.getElementById('selectedJoistSize');
  selectElement.innerHTML = '';
  
  joistSizes.forEach((joist, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = joist.name 
      ? `${joist.name} (${joist.width}x${joist.height}mm)`
      : `根太 ${joist.width}x${joist.height}mm`;
    selectElement.appendChild(option);
  });
  
  // 根太本数を計算
  window.joistCalculator.calculateJoistCount();
}

/**
 * 根太本数を計算する関数
 */
window.joistCalculator.calculateJoistCount = function() {
  const roomWidth = parseFloat(document.getElementById('roomWidth').value); // mm
  const roomDepth = parseFloat(document.getElementById('roomDepth').value); // mm
  const joistLength = parseFloat(document.getElementById('joistLength').value); // mm
  const joistSpacing = parseFloat(document.getElementById('joistSpacing').value); // mm
  const toggleDimensions = document.getElementById('toggleJoistDimensions').checked;
  const ecoMode = document.getElementById('ecoMode').checked; // エコモードの状態を取得
  
  if (isNaN(roomWidth) || isNaN(roomDepth) || isNaN(joistLength) || isNaN(joistSpacing) || joistSpacing <= 0) {
    document.getElementById('joistCountResult').textContent = '入力値を確認してください';
    document.getElementById('joistTotalLength').textContent = '';
    return;
  }
  
  // 選択された根太サイズを取得
  const selectElement = document.getElementById('selectedJoistSize');
  const selectedIndex = selectElement.selectedIndex;
  
  if (selectedIndex < 0) {
    document.getElementById('joistCountResult').textContent = '根太サイズを選択してください';
    document.getElementById('joistTotalLength').textContent = '';
    return;
  }
  
  // 根太サイズリストから選択された根太サイズを取得
  const joistSizesText = document.getElementById('joistSizes').value;
  const joistSizes = window.parseJoistSizes(joistSizesText);
  
  if (selectedIndex >= joistSizes.length) {
    document.getElementById('joistCountResult').textContent = '根太サイズの選択が無効です';
    document.getElementById('joistTotalLength').textContent = '';
    return;
  }
  
  const selectedJoist = joistSizes[selectedIndex];
  
  // 縦横入替の表示と計算を行う
  let joistWidth = selectedJoist.width;
  let joistHeight = selectedJoist.height;
  
  if (toggleDimensions) {
    // 縦横を入れ替える
    [joistWidth, joistHeight] = [joistHeight, joistWidth];
  }
  
  // 新しい計算ロジック
  // 枠内の両端に根太を配置し、残りの幅で根太とスタイロフォームのセットを配置していく
  
  // 両端の根太を配置
  let remainingWidth = roomWidth - (joistWidth * 2); // 両端の根太を除いた利用可能な幅
  
  // 根太とスタイロフォームのセットを配置していく
  let joistColCount = 2; // 両端の根太
  let styrofoamCount = 0;
  let lastStyrofoamWidth = 0;
  
  // 根太とスタイロフォームのセットを配置できるだけ配置する
  while (remainingWidth >= joistWidth + joistSpacing) {
    // 根太1本とスタイロフォーム1つを配置
    remainingWidth -= (joistWidth + joistSpacing);
    joistColCount++;
    styrofoamCount++;
  }
  
  // 残りの幅があれば、最後のスタイロフォームとして使用
  if (remainingWidth > 0) {
    lastStyrofoamWidth = remainingWidth;
  }
  
  // スタイロフォームの幅はそのまま使用
  const styrofoamWidth = joistSpacing;
  
  // 必要な根太材の合計長さ (mm)
  const totalLength = joistColCount * roomDepth;
  
  // カット方法の計算
  const cuttingResult = window.joistCalculator.calculateJoistCutting(roomDepth, joistLength, joistColCount);
  
  const dimensionInfo = toggleDimensions ? `（縦横入替: ${joistWidth}x${joistHeight}mm）` : '';
  
  // 結果表示を更新
  document.getElementById('joistCountResult').textContent = `必要な根太材の本数: ${cuttingResult.totalJoistMaterials}本 (${joistColCount}列 x ${roomDepth}mm) ${dimensionInfo}`;
  document.getElementById('joistTotalLength').textContent = `根太材の合計長さ: ${(totalLength / 1000).toFixed(1)}m`;
  document.getElementById('styrofoamWidth').textContent = `スタイロフォームの幅: ${styrofoamWidth.toFixed(1)}mm`;
  document.getElementById('lastStyrofoamWidth').textContent = `最後のスタイロフォームの幅: ${lastStyrofoamWidth.toFixed(1)}mm`;
  
  // カット結果の詳細を表示
  window.joistCalculator.displayCuttingDetails(cuttingResult);
  
  // 根太とスタイロフォームの配置図を描画
  window.renderJoistLayout(roomWidth, roomDepth, joistWidth, joistColCount, styrofoamWidth, lastStyrofoamWidth);
  
  // 根太材の切り出しシミュレーションを描画
  window.renderJoistCuttingSimulation(cuttingResult, roomDepth, joistLength, joistWidth, joistHeight);
  
  // スタイロフォームパーツ一覧を計算
  window.calculateStyrofoamParts(roomWidth, roomDepth, joistWidth, joistColCount, styrofoamWidth, lastStyrofoamWidth);
}

/**
 * 根太材のカット方法を計算する関数
 * @param {number} roomDepth - 畳の枠内の奥行き (mm)
 * @param {number} joistLength - 根太材の長さ (mm)
 * @param {number} joistColCount - 根太の本数
 * @returns {Object} カット結果の詳細
 */
window.joistCalculator.calculateJoistCutting = function(roomDepth, joistLength, joistColCount) {
  // エコモードの状態を取得
  const ecoMode = document.getElementById('ecoMode').checked;
  
  // JoistCalculatorUtilsクラスの静的メソッドを使用
  return JoistCalculatorUtils.calculateJoistCutting(roomDepth, joistLength, joistColCount, ecoMode);
}

/**
 * カット結果の詳細を表示する関数
 * @param {Object} cuttingResult - カット結果の詳細
 */
window.joistCalculator.displayCuttingDetails = function(cuttingResult) {
  // 既存の結果表示エリアの下に新しい要素を追加
  const resultCard = document.querySelector('.card-body');
  
  // 既存のカット詳細を削除
  const existingDetails = document.getElementById('cuttingDetails');
  if (existingDetails) {
    existingDetails.remove();
  }
  
  // カット詳細の表示エリアを作成
  const detailsDiv = document.createElement('div');
  detailsDiv.id = 'cuttingDetails';
  detailsDiv.className = 'mt-3';
  
  // カット詳細のタイトル
  const detailsTitle = document.createElement('h6');
  detailsTitle.textContent = 'カット方法の詳細';
  detailsDiv.appendChild(detailsTitle);
  
  // 詳細リストを作成
  const detailsList = document.createElement('ul');
  detailsList.className = 'list-unstyled ms-3 small';

  // ノーカットの根太の本数
  const fullLengthItem = document.createElement('li');
  fullLengthItem.textContent = `ノーカットの根太: ${cuttingResult.fullLengthJoists}本`;
  detailsList.appendChild(fullLengthItem);
  
  // 未加工の根太材の本数
  const newJoistItem = document.createElement('li');
  
  // 根太の列数を取得
  const joistCount = parseInt(document.getElementById('joistCountResult').textContent.match(/\((\d+)列/)[1]);
  newJoistItem.textContent = `未加工の根太材: ${cuttingResult.unprocessedJoists}本`;
  detailsList.appendChild(newJoistItem);
  
  // カットした回数
  if (cuttingResult.cutJoists > 0) {
    const cutJoistsItem = document.createElement('li');
    cutJoistsItem.textContent = `根太材をカットした回数: ${cuttingResult.cutJoists}回`;
    detailsList.appendChild(cutJoistsItem);
  }
  
  // 端材をカットした回数
  if (cuttingResult.scrapsUsedCount > 0) {
    const scrapsUsedItem = document.createElement('li');
    scrapsUsedItem.textContent = `端材をカットした回数: ${cuttingResult.scrapsUsedCount}回`;
    detailsList.appendChild(scrapsUsedItem);
  }
  
  // 根太材から発生する端材
  if (cuttingResult.scrapsFromJoists.length > 0) {
    const scrapsItem = document.createElement('li');
    scrapsItem.textContent = '根太材から発生する端材:';
    
    const scrapsList = document.createElement('ul');
    scrapsList.className = 'ms-3';
    
    cuttingResult.scrapsFromJoists.forEach(scrap => {
      const scrapItem = document.createElement('li');
      scrapItem.textContent = `${scrap.length.toFixed(1)}mm × ${scrap.count}個`;
      scrapsList.appendChild(scrapItem);
    });
    
    scrapsItem.appendChild(scrapsList);
    detailsList.appendChild(scrapsItem);
  }
  
  // 端材から作れる根太の本数
  if (cuttingResult.joistsFromScraps > 0) {
    const joistsFromScrapsItem = document.createElement('li');
    joistsFromScrapsItem.textContent = `端材から作れる根太: ${cuttingResult.joistsFromScraps}本`;
    detailsList.appendChild(joistsFromScrapsItem);
  }
  
  // 端材の端材
  if (cuttingResult.scrapsFromScraps.length > 0) {
    const secondaryScrapsItem = document.createElement('li');
    secondaryScrapsItem.textContent = '端材の端材:';
    
    const secondaryScrapsList = document.createElement('ul');
    secondaryScrapsList.className = 'ms-3';
    
    cuttingResult.scrapsFromScraps.forEach(scrap => {
      const scrapItem = document.createElement('li');
      scrapItem.textContent = `${scrap.length.toFixed(1)}mm × ${scrap.count}個`;
      secondaryScrapsList.appendChild(scrapItem);
    });
    
    secondaryScrapsItem.appendChild(secondaryScrapsList);
    detailsList.appendChild(secondaryScrapsItem);
  }
  
  // 根太の構成情報
  if (cuttingResult.joistCompositions.length > 0) {
    const compositionsItem = document.createElement('li');
    compositionsItem.textContent = '根太の構成:';
    
    const compositionsList = document.createElement('ul');
    compositionsList.className = 'ms-3';
    
    // 畳の枠内の奥行きを取得
    const roomDepth = parseFloat(document.getElementById('roomDepth').value); // mm
    const joistLength = parseFloat(document.getElementById('joistLength').value); // mm
    
    // 根太の列数を取得
    const joistColCount = parseInt(document.getElementById('joistCountResult').textContent.match(/\((\d+)列/)[1]);
    
    // 根太の構成を計算
    // 畳の奥行きが根太材の長さより長い場合
    if (roomDepth > joistLength) {
      // 必要な根太材の長さ
      const remainingLength = roomDepth - joistLength;
      
      const compItem = document.createElement('li');
      compItem.textContent = `${Math.round(joistLength)} + ${Math.round(remainingLength)} x ${joistCount}組`;
      compositionsList.appendChild(compItem);
    } 
    // 根太材の長さが畳の奥行きより長い場合
    else {
      const compItem = document.createElement('li');
      compItem.textContent = `${Math.round(roomDepth)} x ${joistColCount}組`;
      compositionsList.appendChild(compItem);
    }
    
    compositionsItem.appendChild(compositionsList);
    detailsList.appendChild(compositionsItem);
  }
  
  detailsDiv.appendChild(detailsList);
  resultCard.appendChild(detailsDiv);
}

/**
 * 計算を実行する関数
 */
window.joistCalculator.calculateOptions = function() {
  // フローリング材の厚みを取得
  const excludeFlooring = document.getElementById('excludeFlooring').checked;
  let flooringHeight = 0;
  
  if (!excludeFlooring) {
    flooringHeight = parseFloat(document.getElementById('flooringHeight').value);
    if (isNaN(flooringHeight)) {
      alert('フローリング材の厚みを入力してください');
      return;
    }
  }
  
  // テキストエリアから根太サイズを解析
  const joistSizesText = document.getElementById('joistSizes').value;
  const joistSizes = window.parseJoistSizes(joistSizesText);

  // テキストエリアから合板の厚みを解析
  const plywoodText = document.getElementById('plywoodThicknesses').value;
  const plywoodThicknesses = window.parsePlywoodThicknesses(plywoodText);

  const tatamiHeight = parseFloat(document.getElementById('tatamiHeight').value);
  const resultList = document.getElementById('resultList');
  resultList.innerHTML = '';

  // 入力値の検証
  if (joistSizes.length === 0) {
    resultList.innerHTML = '<li class="list-group-item text-danger">有効な根太サイズが入力されていません。</li>';
    return;
  }
  
  if (plywoodThicknesses.length === 0) {
    resultList.innerHTML = '<li class="list-group-item text-danger">有効な合板の厚みが入力されていません。</li>';
    return;
  }

  const targetMin = tatamiHeight - 2;
  const targetMax = tatamiHeight;
  
  // 結果タイトルを更新
  document.getElementById('resultTitle').textContent = 
    `組み合わせ候補 (${targetMin}〜${targetMax}mm 以内)`;

  let results = [];

  for (const joist of joistSizes) {
    for (const ply of plywoodThicknesses) {
      // 高さを使用した場合
      const totalWithHeight = joist.height + ply + flooringHeight;
      if (totalWithHeight >= targetMin && totalWithHeight <= targetMax) {
        let resultText;
        if (excludeFlooring) {
          resultText = joist.name 
            ? `${joist.name} ${joist.width}x${joist.height}mm (高さ使用) + 合板 ${ply}mm → 合計 ${totalWithHeight.toFixed(1)}mm`
            : `根太 ${joist.width}x${joist.height}mm (高さ使用) + 合板 ${ply}mm → 合計 ${totalWithHeight.toFixed(1)}mm`;
        } else {
          resultText = joist.name 
            ? `${joist.name} ${joist.width}x${joist.height}mm (高さ使用) + 合板 ${ply}mm + フローリング ${flooringHeight}mm → 合計 ${totalWithHeight.toFixed(1)}mm`
            : `根太 ${joist.width}x${joist.height}mm (高さ使用) + 合板 ${ply}mm + フローリング ${flooringHeight}mm → 合計 ${totalWithHeight.toFixed(1)}mm`;
        }
        results.push(resultText);
      }
      
      // 幅を使用した場合
      const totalWithWidth = joist.width + ply + flooringHeight;
      if (totalWithWidth >= targetMin && totalWithWidth <= targetMax) {
        let resultText;
        if (excludeFlooring) {
          resultText = joist.name 
            ? `${joist.name} ${joist.width}x${joist.height}mm (幅使用) + 合板 ${ply}mm → 合計 ${totalWithWidth.toFixed(1)}mm`
            : `根太 ${joist.width}x${joist.height}mm (幅使用) + 合板 ${ply}mm → 合計 ${totalWithWidth.toFixed(1)}mm`;
        } else {
          resultText = joist.name 
            ? `${joist.name} ${joist.width}x${joist.height}mm (幅使用) + 合板 ${ply}mm + フローリング ${flooringHeight}mm → 合計 ${totalWithWidth.toFixed(1)}mm`
            : `根太 ${joist.width}x${joist.height}mm (幅使用) + 合板 ${ply}mm + フローリング ${flooringHeight}mm → 合計 ${totalWithWidth.toFixed(1)}mm`;
        }
        results.push(resultText);
      }
    }
  }

  if (results.length === 0) {
    resultList.innerHTML = '<li class="list-group-item text-danger">条件に合う組み合わせがありません。</li>';
  } else {
    // 合計値でソート（昇順）
    results.sort((a, b) => {
      const totalA = parseFloat(a.match(/合計 (\d+\.\d+)mm/)[1]);
      const totalB = parseFloat(b.match(/合計 (\d+\.\d+)mm/)[1]);
      return totalA - totalB;
    });
    
    for (const r of results) {
      const li = document.createElement('li');
      li.className = 'list-group-item result-item';
      li.textContent = r;
      
      // クリックイベントを追加
      li.addEventListener('click', function() {
        // 結果テキストから情報を抽出
        const resultText = this.textContent;
        
        // 根太サイズと向きを抽出
        const joistMatch = resultText.match(/([^ ]+) (\d+)x(\d+)mm \((幅|高さ)使用\)/);
        if (joistMatch) {
          const joistName = joistMatch[1];
          const joistWidth = parseInt(joistMatch[2]);
          const joistHeight = parseInt(joistMatch[3]);
          const useWidth = joistMatch[4] === '幅';
          
          // 根太サイズリストから一致する項目を探す
          const joistSizesText = document.getElementById('joistSizes').value;
          const joistSizes = window.parseJoistSizes(joistSizesText);
          
          // 一致する根太サイズを探す
          let matchedJoist = null;
          for (const joist of joistSizes) {
            if ((joist.name === joistName || (joist.name === null && joistName === '根太')) && 
                joist.width === joistWidth && joist.height === joistHeight) {
              matchedJoist = joist;
              break;
            }
          }
          
          if (matchedJoist) {
            // 根太本数計算機の根太サイズを設定
            const selectElement = document.getElementById('selectedJoistSize');
            selectElement.selectedIndex = matchedJoist.index;
            
            // 縦横入替チェックボックスを設定
            const toggleElement = document.getElementById('toggleJoistDimensions');
            toggleElement.checked = useWidth;
            
            // スクロールして根太本数計算機を表示
            document.querySelector('.card.shadow.p-4:nth-child(2)').scrollIntoView({ behavior: 'smooth' });
            
            // 計算を実行
            window.joistCalculator.calculateJoistCount();
          }
        }
      });
      
      resultList.appendChild(li);
    }
    
    // 結果数を表示
    document.getElementById('resultTitle').textContent = 
      `組み合わせ候補 (${targetMin}〜${targetMax}mm 以内) - ${results.length}件`;
  }
}
