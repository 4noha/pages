/**
 * 根太材の切り出しシミュレーション関連の機能
 */

/**
 * 根太材の切り出しシミュレーションを描画する関数
 * @param {Object} cuttingResult - カット結果の詳細
 * @param {number} roomDepth - 畳の枠内の奥行き (mm)
 * @param {number} joistLength - 根太材の長さ (mm)
 * @param {number} joistWidth - 根太の幅 (mm)
 * @param {number} joistHeight - 根太の高さ (mm)
 */
window.renderJoistCuttingSimulation = function(cuttingResult, roomDepth, joistLength, joistWidth, joistHeight) {
  const container = document.getElementById('joistCuttingSimulation');
  container.innerHTML = '';
  
  if (!cuttingResult || cuttingResult.totalJoistMaterials === 0) {
    container.innerHTML = '<p class="text-muted">根太材が必要ありません</p>';
    return;
  }
  
  // 必要な根太材の本数を表示
  document.getElementById('joistCuttingSummary').textContent = 
    `根太材の必要本数: ${cuttingResult.totalJoistMaterials}本 (長さ ${joistLength}mm)`;
  
  // 根太材の切り出し図を描画
  let joistMaterials = [];
  
  // 材料の関係データ構造を使用して切り出し図を作成
  if (cuttingResult.materialRelationships && cuttingResult.materialRelationships.length > 0) {
    // 端材の利用状況を追跡するマップ
    const scrapUsageMap = new Map();
    const usedMaterialIds = new Set(); // 利用された端材を持つ材料のIDを記録
    
    // まず、すべての端材とその利用状況を特定
    for (const material of cuttingResult.materialRelationships) {
      for (const part of material.parts) {
        if (part.type.includes('端材')) {
          // 端材のIDをキーとして保存
          const scrapKey = `${material.originalId}_${part.id}`;
          scrapUsageMap.set(scrapKey, {
            used: false,
            originalMaterial: material,
            part: part
          });
        }
      }
    }
    
      // 次に、端材が根太として利用されているかをチェック
      for (const material of cuttingResult.materialRelationships) {
        for (const part of material.parts) {
          if (part.type.includes('根太（端材から）')) {
            // この根太は端材から作られている
            // 対応する端材を探す（この実装では簡易的に長さで判断）
            for (const [scrapKey, scrapInfo] of scrapUsageMap.entries()) {
              if (Math.abs(scrapInfo.part.length - part.length) < 0.1) {
                // 長さが一致する端材を見つけた
                scrapUsageMap.set(scrapKey, {
                  ...scrapInfo,
                  used: true
                });
                // 利用された端材を持つ材料のIDを記録
                usedMaterialIds.add(scrapInfo.originalMaterial.originalId);
                break;
              }
            }
          }
        }
      }
      
    
    // 同じカットパターンをグループ化するためのマップ
    const patternGroups = new Map();
    
      // 各材料の関係を処理（利用された端材を持つ材料は除外）
      for (const material of cuttingResult.materialRelationships) {
        // 利用された端材を持つ材料はスキップ
        if (usedMaterialIds.has(material.originalId)) {
          continue;
        }
        
        // 根太材の長さが畳の枠内の奥行きより短い場合の特別処理
        // 端材を持つ材料のうち、消費された端材のみをスキップ
        if (joistLength < roomDepth) {
          // 端材を持つ材料かどうかをチェック
          const hasScrap = material.parts.some(part => part.type.includes('端材'));
          
          // 端材を持つ材料の場合、その端材が消費されたかどうかをチェック
          if (hasScrap) {
            // 端材が消費されたかどうかをチェック
            let isScrapConsumed = false;
            
            // 端材が消費されたかどうかを判断するロジック
            // 根太材の長さが畳の枠内の奥行きより短い場合、
            // 根太部分の長さが根太材の長さと同じ場合は消費されたとみなす
            const rootPart = material.parts.find(part => !part.type.includes('端材'));
            if (rootPart && Math.abs(rootPart.length - joistLength) < 0.1) {
              isScrapConsumed = true;
            }
            
            // 消費された端材を持つ材料はスキップ
            if (isScrapConsumed) {
              continue;
            }
          }
        }
      
      // 各部品の表示タイプを決定（端材が利用される場合は「利用端材」として表示）
      const displayParts = material.parts.map(part => {
        let displayType = part.type;
        
        // 端材の場合、利用状況をチェック
        if (part.type.includes('端材')) {
          const scrapKey = `${material.originalId}_${part.id}`;
          const scrapInfo = scrapUsageMap.get(scrapKey);
          
          if (scrapInfo && scrapInfo.used) {
            // この端材は後で利用される
            displayType = '利用端材';
          }
        }
        
        return {
          originalType: part.type,
          displayType: displayType,
          length: part.length
        };
      });
      
      // パターンキーを作成（部品の表示タイプと長さの組み合わせ）
      const patternKey = displayParts.map(part => `${part.displayType}:${part.length.toFixed(1)}`).join('|');
      
      // パターングループに追加
      if (!patternGroups.has(patternKey)) {
        const parts = [];
        let currentX = 0;
        
        // 各部品を配置
        for (const part of displayParts) {
          parts.push({
            type: part.displayType,
            x: currentX,
            y: 0,
            width: joistWidth,
            height: joistHeight,
            length: part.length,
            label: `${part.length.toFixed(1)}mm`
          });
          currentX += part.length;
        }
        
        // 材料タイプを決定
        let materialType = '根太材';
        if (displayParts.length === 1 && displayParts[0].originalType === '未加工') {
          materialType = 'カットされない木材';
        } else if (displayParts.some(p => p.displayType.includes('端材') || p.displayType.includes('利用端材'))) {
          materialType = '切り出し木材';
        }
        
        patternGroups.set(patternKey, {
          type: materialType,
          count: 1,
          parts: parts,
          materials: [material]
        });
      } else {
        // 既存のパターングループにカウントを追加
        const group = patternGroups.get(patternKey);
        group.count++;
        group.materials.push(material);
      }
    }
    
    // グループ化されたパターンをjoistMaterialsに追加
    for (const group of patternGroups.values()) {
      joistMaterials.push({
        type: group.type,
        count: group.count,
        parts: group.parts
      });
    }
  }
  // 材料の関係データがない場合は従来の方法で処理
  else {
    // 畳の奥行きが根太材の長さより長い場合
    if (roomDepth > joistLength) {
      // 必要な根太の本数を計算
      const joistCount = cuttingResult.totalJoistMaterials;
      
      // 必要な根太の数
      const neededJoists = cuttingResult.joistCompositions.reduce((total, comp) => total + comp.count, 0);
      
      // 未加工の根太材（そのまま使う木材）
      if (cuttingResult.unprocessedJoists > 0) {
        joistMaterials.push({
          type: 'カットされない木材',
          count: cuttingResult.unprocessedJoists,
          parts: [
            {
              type: '根太',
              x: 0,
              y: 0,
              width: joistWidth,
              height: joistHeight,
              length: joistLength,
              label: `${joistLength}mm`
            }
          ]
        });
      }
      
      // 根太材の構成情報から切り出しパターンを作成
      for (const composition of cuttingResult.joistCompositions) {
        // 「未加工」タイプはすでに処理済みなのでスキップ
        if (composition.type === '未加工') continue;
        
        // 「組み合わせ」タイプの場合、切り出しパターンを作成
        if (composition.type === '組み合わせ') {
          const cutParts = [];
          let currentX = 0;
          
          // 必要な長さの根太を配置
          for (let i = 0; i < composition.lengths.length; i++) {
            const partLength = composition.lengths[i];
            
            // 根太部分
            if (i === 0 || partLength >= roomDepth * 0.5) { // 根太として使える長さかどうか
              cutParts.push({
                type: '根太',
                x: currentX,
                y: 0,
                width: joistWidth,
                height: joistHeight,
                length: partLength,
                label: `${partLength.toFixed(1)}mm`
              });
            } 
            // 端材部分
            else {
              cutParts.push({
                type: '端材',
                x: currentX,
                y: 0,
                width: joistWidth,
                height: joistHeight,
                length: partLength,
                label: `${partLength.toFixed(1)}mm`
              });
            }
            currentX += partLength;
          }
          
          // 切り出しパターンを追加
          joistMaterials.push({
            type: `${composition.lengths[0].toFixed(1)}mmを切り出した木材`,
            count: composition.count,
            parts: cutParts
          });
        }
        
        // その他のタイプの場合も同様に処理
        else if (composition.type === '同じ端材2つ' || composition.type === '異なる端材2つ' || composition.type === '端材から作成') {
          const cutParts = [];
          let currentX = 0;
          
          // 各長さを配置
          for (const partLength of composition.lengths) {
            cutParts.push({
              type: '根太',
              x: currentX,
              y: 0,
              width: joistWidth,
              height: joistHeight,
              length: partLength,
              label: `${partLength.toFixed(1)}mm`
            });
            currentX += partLength;
          }
          
          // 切り出しパターンを追加
          joistMaterials.push({
            type: `${composition.type}の木材`,
            count: composition.count,
            parts: cutParts
          });
        }
      }
      
      // 端材がある場合は追加
      if (cuttingResult.scrapsFromJoists.length > 0) {
        for (const scrap of cuttingResult.scrapsFromJoists) {
          if (scrap.count > 0) {
            joistMaterials.push({
              type: `端材 (${scrap.length.toFixed(1)}mm)`,
              count: scrap.count,
              parts: [
                {
                  type: '端材',
                  x: 0,
                  y: 0,
                  width: joistWidth,
                  height: joistHeight,
                  length: scrap.length,
                  label: `${scrap.length.toFixed(1)}mm`
                }
              ]
            });
          }
        }
      }
    } 
    // 根太材の長さが畳の奥行きより長い場合
    else if (joistLength > roomDepth) {
      // 1本の根太材から切り出せる根太の数
      const joistsPerMaterial = Math.floor(joistLength / roomDepth);
      
      // 切り出しパターンを作成
      const parts = [];
      let currentX = 0;
      
      // 根太を配置
      for (let i = 0; i < joistsPerMaterial; i++) {
        parts.push({
          type: '根太',
          x: currentX,
          y: 0,
          width: joistWidth,
          height: joistHeight,
          length: roomDepth,
          label: `${roomDepth}mm`
        });
        currentX += roomDepth;
      }
      
      // 端材があれば追加
      const scrapsLength = joistLength - (roomDepth * joistsPerMaterial);
      if (scrapsLength > 0) {
        parts.push({
          type: '端材',
          x: currentX,
          y: 0,
          width: joistWidth,
          height: joistHeight,
          length: scrapsLength,
          label: `${scrapsLength.toFixed(1)}mm`
        });
      }
      
      // 切り出しパターンを追加
      joistMaterials.push({
        type: `根太材から${joistsPerMaterial}本切り出し`,
        count: cuttingResult.totalJoistMaterials,
        parts: parts
      });
    }
    // 畳の奥行きと根太材の長さが同じ場合
    else {
      joistMaterials.push({
        type: 'カットなしの根太材',
        count: cuttingResult.totalJoistMaterials,
        parts: [{
          type: '根太',
          x: 0,
          y: 0,
          width: joistWidth,
          height: joistHeight,
          length: joistLength,
          label: `${joistLength}mm`
        }]
      });
    }
  }
  
  // 各レイアウトパターンの切り出し図を描画
  let layoutIndex = 1;
  for (const material of joistMaterials) {
    // レイアウトのタイトル
    const layoutTitle = document.createElement('h5');
    layoutTitle.className = 'mt-4';
    layoutTitle.textContent = `${material.type} (${material.count}本)`;
    container.appendChild(layoutTitle);
    
    // 根太材の寸法を表示
    const dimensionLabel = document.createElement('div');
    dimensionLabel.className = 'text-muted small mb-2';
    dimensionLabel.textContent = `${joistWidth}mm x ${joistHeight}mm x ${joistLength}mm`;
    container.appendChild(dimensionLabel);
    
    // 根太材の切り出し図
    const materialDiv = document.createElement('div');
    materialDiv.className = 'border p-2 mb-3';
    materialDiv.style.position = 'relative';
    materialDiv.style.width = '100%';
    materialDiv.style.height = '80px'; // 高さを調整
    materialDiv.style.backgroundColor = '#f8f9fa';
    
    // 元の根太材の全体を表示（グレーの背景）
    const originalJoistDiv = document.createElement('div');
    originalJoistDiv.className = 'border';
    originalJoistDiv.style.position = 'absolute';
    originalJoistDiv.style.left = '0';
    originalJoistDiv.style.top = '20px'; // 位置を調整
    originalJoistDiv.style.width = '100%';
    originalJoistDiv.style.height = '40px';
    originalJoistDiv.style.backgroundColor = '#e9ecef';
    materialDiv.appendChild(originalJoistDiv);
    
    // スケールを計算
    // 常に表示領域に収まるようにスケールを調整
    const containerWidth = 600; // より小さな固定幅を使用して安定させる
    
    // 根太材の長さに関わらず、常に表示領域に収まるようにスケール調整
    // 実際の根太材の長さを基準にスケールを計算
    const scale = (containerWidth * 0.9) / joistLength; // 90%の幅を使用
    
    // materialDivの幅を明示的に設定せず、親要素に合わせる
    materialDiv.style.width = '100%'; // 親要素の幅に合わせる
    materialDiv.style.maxWidth = `${containerWidth}px`; // 最大幅を設定
    
    // 等分マークを表示（根太材の長さに対する等分）
    const joistsPerMaterial = material.parts.filter(p => !p.type.includes('端材')).length;
    if (joistsPerMaterial > 1) {
      const divisionLabel = document.createElement('div');
      divisionLabel.className = 'text-center fw-bold';
      divisionLabel.style.position = 'absolute';
      divisionLabel.style.left = '0';
      divisionLabel.style.top = '2px';
      divisionLabel.style.width = '100%';
      divisionLabel.style.fontSize = '0.8rem';
      divisionLabel.textContent = `${joistsPerMaterial}等分`;
      materialDiv.appendChild(divisionLabel);
    }
    
    // パーツを描画
    material.parts.forEach((part, index) => {
      const partDiv = document.createElement('div');
      partDiv.className = 'border';
      partDiv.style.position = 'absolute';
      partDiv.style.left = `${part.x * scale}px`;
      partDiv.style.top = '20px'; // 位置を調整
      partDiv.style.width = `${part.length * scale}px`;
      partDiv.style.height = '40px';
      partDiv.style.backgroundColor = part.type.includes('端材') ? '#ffd966' : '#c6e0b4';
      partDiv.style.overflow = 'hidden';
      
      // パーツの寸法を表示
      const partLabel = document.createElement('div');
      partLabel.className = 'small text-center';
      partLabel.style.marginTop = '5px';
      partLabel.style.fontSize = '0.7rem';
      partLabel.style.color = part.type.includes('端材') ? '#000' : '#000'; // テキストの色を黒に設定
      partLabel.textContent = part.label;
      partDiv.appendChild(partLabel);
      
      // パーツの種類を表示
      const partTypeLabel = document.createElement('div');
      partTypeLabel.className = 'small text-center';
      partTypeLabel.style.marginTop = '2px';
      partTypeLabel.style.fontSize = '0.7rem';
      partTypeLabel.style.color = '#000'; // テキストの色を黒に設定
      
      // 表示テキストを決定
      if (part.type === '利用端材') {
        partTypeLabel.textContent = '利用端材';
        // 利用端材の背景色を変更
        partDiv.style.backgroundColor = '#a8d08d'; // 薄い緑色（根太と端材の中間色）
      } else if (part.type.includes('端材')) {
        partTypeLabel.textContent = '端材';
      } else {
        partTypeLabel.textContent = '根太';
      }
      
      partDiv.appendChild(partTypeLabel);
      
      materialDiv.appendChild(partDiv);
      
      // 等分マークの区切り線を表示
      if (index > 0 && !part.type.includes('端材')) {
        const dividerLine = document.createElement('div');
        dividerLine.style.position = 'absolute';
        dividerLine.style.left = `${part.x * scale}px`;
        dividerLine.style.top = '5px';
        dividerLine.style.width = '1px';
        dividerLine.style.height = '70px';
        dividerLine.style.backgroundColor = '#dc3545'; // 赤色の区切り線
        materialDiv.appendChild(dividerLine);
      }
    });
    
    // 元の根太材の長さを表示
    const originalLengthLabel = document.createElement('div');
    originalLengthLabel.className = 'text-muted small mt-1';
    originalLengthLabel.textContent = `元の根太材: ${joistLength}mm`;
    container.appendChild(originalLengthLabel);
    
    // 等分情報を表示
    const divisionInfo = document.createElement('div');
    divisionInfo.className = 'text-primary small mt-1';
    // 既に宣言されている joistsPerMaterial 変数を再利用
    if (joistsPerMaterial > 1) {
      divisionInfo.textContent = `1本の木材から${joistsPerMaterial}本の根太を切り出し`;
      container.appendChild(divisionInfo);
    }
    
    container.appendChild(materialDiv);
    layoutIndex++;
  }
  
  // 使用率の表示
  const usageInfo = document.createElement('p');
  usageInfo.className = 'text-muted mt-3';
  
  // 使用面積を計算
  const totalUsedLength = roomDepth * cuttingResult.totalJoistMaterials;
  const totalMaterialLength = joistLength * cuttingResult.totalJoistMaterials;
  
  // 使用率
  const usageRate = (totalUsedLength / totalMaterialLength) * 100;
  
  usageInfo.textContent = `使用率: ${usageRate.toFixed(1)}% (使用長さ: ${(totalUsedLength/1000).toFixed(2)}m / 総長さ: ${(totalMaterialLength/1000).toFixed(2)}m)`;
  container.appendChild(usageInfo);
}
