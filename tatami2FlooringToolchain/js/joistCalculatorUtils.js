/**
 * 根太計算ユーティリティクラス
 */
class JoistCalculatorUtils {
  /**
   * 根太材のカット方法を計算する静的メソッド
   * @param {number} roomDepth - 畳の枠内の奥行き (mm)
   * @param {number} joistLength - 根太材の長さ (mm)
   * @param {number} joistColCount - 根太の列数
   * @param {boolean} ecoMode - エコモードの状態
   * @returns {Object} カット結果の詳細
   */
  static calculateJoistCutting(roomDepth, joistLength, joistColCount, ecoMode) {
    // 入力値の検証
    if (!this._validateInputs(roomDepth, joistLength, joistColCount)) {
      return this._createEmptyResult();
    }

    // 結果オブジェクトの初期化
    const result = this._initializeResult();
    
    // 根太材の長さが畳の奥行きより長い場合
    if (joistLength > roomDepth) {
      this._handleLongerJoistCase(result, roomDepth, joistLength, joistColCount);
    } 
    // 畳の奥行きが根太材の長さより長い場合
    else {
      if (ecoMode) {
        this._handleEcoMode(result, roomDepth, joistLength, joistColCount);
      } else {
        this._handleNormalMode(result, roomDepth, joistLength, joistColCount);
      }
    }
    
    // 端材から作れる根太の計算
    this._calculateJoistsFromScraps(result, roomDepth);
    
    return result;
  }

  /**
   * 入力値のバリデーション
   * @private
   */
  static _validateInputs(roomDepth, joistLength, joistColCount) {
    return (
      typeof roomDepth === 'number' && roomDepth > 0 &&
      typeof joistLength === 'number' && joistLength > 0 &&
      typeof joistColCount === 'number' && joistColCount > 0
    );
  }

  /**
   * 空の結果オブジェクトを作成
   * @private
   */
  static _createEmptyResult() {
    return {
      totalJoistMaterials: 0,
      fullLengthJoists: 0,
      unprocessedJoists: 0,
      cutJoists: 0,
      scrapsUsedCount: 0,
      scrapsFromJoists: [],
      joistsFromScraps: 0,
      scrapsFromScraps: [],
      joistCompositions: []
    };
  }

  /**
   * 結果オブジェクトの初期化
   * @private
   */
  static _initializeResult() {
    return {
      totalJoistMaterials: 0,      // 必要な根太材の総本数
      fullLengthJoists: 0,         // ノーカットの木材の本数
      unprocessedJoists: 0,        // 未加工の木材の本数
      cutJoists: 0,                // カットした新品の根太の本数
      scrapsUsedCount: 0,          // 端材をカットした回数
      scrapsFromJoists: [],        // 根太材から発生する端材 [{length: 長さ, count: 個数}]
      joistsFromScraps: 0,         // 端材から作れる根太の本数
      scrapsFromScraps: [],        // 端材の端材 [{length: 長さ, count: 個数}]
      joistCompositions: [],       // 根太の構成 [{type: タイプ, lengths: [長さの配列], count: 個数}]
      materialRelationships: []    // 材料の関係 [{originalId: 元の材料ID, originalLength: 元の長さ, parts: [{id: 部品ID, type: タイプ, length: 長さ}]}]
    };
  }

  /**
   * 根太材の長さが畳の奥行きより長い場合の処理
   * @private
   */
  static _handleLongerJoistCase(result, roomDepth, joistLength, joistColCount) {
    // 1本の根太材から切り出せる根太の数
    const joistsPerMaterial = Math.floor(joistLength / roomDepth);
    
    // 必要な根太材の本数
    result.totalJoistMaterials = Math.ceil(joistColCount / joistsPerMaterial);
    // joistColCount: 必要な根太の数
    // totalJoistMaterials: 原料の根太材の本数
    // joistLength: 根太材の長さ
    // roomDepth: 必要な根太の長さ
    // joistsPerMaterial: 1本の根太材から切り出せる根太の数
    // fullLengthJoists: ノーカットの木材の本数
    // joistsPerMaterialが1なら、fullLengthJoists = totalJoistMaterials
    // totalJoistMaterials*joistsPerMaterial>=joistColCountならfullLengthJoists = joistColCount
    result.fullLengthJoists = joistColCount;
    
    // 根太の構成情報を記録
    this._addJoistComposition(result, 'ノーカット', [roomDepth], joistColCount);
    
    // 各根太材ごとに材料の関係を記録
    for (let i = 0; i < result.totalJoistMaterials; i++) {
      const originalId = `original_${result.materialRelationships.length + 1}`;
      const parts = [];
      
      // 各根太材から切り出せる根太を記録
      const joistsFromThisMaterial = (i < result.totalJoistMaterials - 1 || joistColCount % joistsPerMaterial === 0) 
        ? joistsPerMaterial 
        : joistColCount % joistsPerMaterial;
      
      for (let j = 0; j < joistsFromThisMaterial; j++) {
        const partId = `part_${originalId}_${j + 1}`;
        parts.push({
          id: partId,
          type: '根太',
          length: roomDepth
        });
      }
      
      // 端材の長さと本数
      const scrapsLength = joistLength - (roomDepth * joistsFromThisMaterial);
      if (scrapsLength > 0) {
        const scrapId = `part_${originalId}_${joistsFromThisMaterial + 1}`;
        parts.push({
          id: scrapId,
          type: '端材',
          length: scrapsLength
        });
      }
      
      // 材料の関係を追加
      result.materialRelationships.push({
        originalId: originalId,
        originalLength: joistLength,
        parts: parts
      });
    }
    
    // 端材の長さと本数
    const scrapsLength = joistLength - (roomDepth * joistsPerMaterial);
    if (scrapsLength > 0) {
      this._addScrapFromJoist(result, scrapsLength, result.totalJoistMaterials);
      
      // 2つの端材で根太を作れるかチェック
      this._checkTwoScrapsForJoist(result, roomDepth, scrapsLength);
    }
  }

  /**
   * エコモードの処理
   * @private
   */
  static _handleEcoMode(result, roomDepth, joistLength, joistColCount) {
    // 必要な根太材の総本数（初期値）
    let totalMaterials = 0;
    
    // 利用可能な端材のリスト
    let availableScraps = [];
    
    // 各根太に対して処理
    for (let i = 0; i < joistColCount; i++) {
      let remainingDepth = roomDepth;
      let usedMaterials = 0;
      
      // 未加工の根太材を使用
      while (remainingDepth >= joistLength) {
        remainingDepth -= joistLength;
        usedMaterials++;
        
        if (usedMaterials > 0) {
          result.unprocessedJoists++;
          
          // 材料の関係を記録
          const originalId = `original_${result.materialRelationships.length + 1}`;
          const partId = `part_${originalId}_1`;
          
          result.materialRelationships.push({
            originalId: originalId,
            originalLength: joistLength,
            parts: [{
              id: partId,
              type: '未加工',
              length: joistLength
            }]
          });
        }
      }
      
      // 残りの長さが必要な場合
      if (remainingDepth > 0) {
        const { usedScrap, usedScrapLength, usedScrapId } = this._tryUseAvailableScraps(
          result, remainingDepth, availableScraps
        );
        
        if (!usedScrap) {
          // 新しい根太材を使用
          usedMaterials++;
          const newScrapLength = joistLength - remainingDepth;
          
          // 材料の関係を記録
          const originalId = `original_${result.materialRelationships.length + 1}`;
          const partId1 = `part_${originalId}_1`;
          const partId2 = `part_${originalId}_2`;
          
          const relationship = {
            originalId: originalId,
            originalLength: joistLength,
            parts: [{
              id: partId1,
              type: '根太',
              length: remainingDepth
            }]
          };
          
          if (newScrapLength > 0) {
            availableScraps.push({ 
              length: newScrapLength,
              originalId: originalId,
              partId: partId2
            });
            
            relationship.parts.push({
              id: partId2,
              type: '端材',
              length: newScrapLength
            });
          }
          
          result.materialRelationships.push(relationship);
          
          result.cutJoists++;
          this._addJoistComposition(result, '組み合わせ', [joistLength, remainingDepth], 1);
        } else {
          // 端材を使用した場合の構成情報を記録
          this._addJoistComposition(result, '組み合わせ', [usedScrapLength], 1);
          
          // 端材の使用を材料の関係に記録（もし対応するIDがあれば）
          if (usedScrapId) {
            // 対応する材料の関係を探す
            for (const rel of result.materialRelationships) {
              if (rel.originalId === usedScrapId.originalId) {
                // 端材から根太を作成した記録を追加
                const partId = `part_${rel.originalId}_${rel.parts.length + 1}`;
                rel.parts.push({
                  id: partId,
                  type: '根太（端材から）',
                  length: remainingDepth
                });
                break;
              }
            }
          }
        }
      } else if (usedMaterials > 0) {
        // 根太材がちょうど収まる場合の構成情報を記録
        this._addJoistComposition(result, 'ノーカット', [joistLength], 1);
      }
      
      totalMaterials += usedMaterials;
    }
    
    result.totalJoistMaterials = totalMaterials;
    
    // 残った端材を結果オブジェクトに追加
    this._addRemainingScrapToResult(result, availableScraps);
    
    // 端材の組み合わせで根太を作れるか確認
    this._checkScrapsForJoists(result, roomDepth, true);
    
    // デバッグ用に情報を出力
    console.log("エコモード処理後の材料関係:", JSON.parse(JSON.stringify(result.materialRelationships)));
  }

  /**
   * 通常モードの処理
   * @private
   */
  static _handleNormalMode(result, roomDepth, joistLength, joistColCount) {
    // 必要な根太材の総本数（初期値）
    let totalMaterials = 0;
    
    // 利用可能な端材のリスト
    let availableScraps = [];
    
    // 各根太に対して処理
    for (let i = 0; i < joistColCount; i++) {
      let remainingDepth = roomDepth;
      let usedMaterials = 0;
      
      // 未加工の根太材を使用
      while (remainingDepth >= joistLength) {
        remainingDepth -= joistLength;
        usedMaterials++;
        
        if (usedMaterials > 0) {
          result.unprocessedJoists++;
          
          // 材料の関係を記録
          const originalId = `original_${result.materialRelationships.length + 1}`;
          const partId = `part_${originalId}_1`;
          
          result.materialRelationships.push({
            originalId: originalId,
            originalLength: joistLength,
            parts: [{
              id: partId,
              type: '未加工',
              length: joistLength
            }]
          });
        }
      }
      
      // 残りの長さが必要な場合
      if (remainingDepth > 0) {
        const { usedScrap, usedScrapLength, usedScrapId } = this._tryUseAvailableScraps(
          result, remainingDepth, availableScraps
        );
        
        if (!usedScrap) {
          // 新しい根太材を使用
          usedMaterials++;
          const newScrapLength = joistLength - remainingDepth;
          
          // 材料の関係を記録
          const originalId = `original_${result.materialRelationships.length + 1}`;
          const partId1 = `part_${originalId}_1`;
          const partId2 = `part_${originalId}_2`;
          
          const relationship = {
            originalId: originalId,
            originalLength: joistLength,
            parts: [{
              id: partId1,
              type: '根太',
              length: remainingDepth
            }]
          };
          
          if (newScrapLength > 0) {
            availableScraps.push({ 
              length: newScrapLength,
              originalId: originalId,
              partId: partId2
            });
            
            relationship.parts.push({
              id: partId2,
              type: '端材',
              length: newScrapLength
            });
          }
          
          result.materialRelationships.push(relationship);
          
          result.cutJoists++;
          this._addJoistComposition(result, '組み合わせ', [joistLength, remainingDepth], 1);
        } else {
          // 端材を使用した場合の構成情報を記録
          this._addJoistComposition(result, '組み合わせ', [usedScrapLength], 1);
          
          // 端材の使用を材料の関係に記録（もし対応するIDがあれば）
          if (usedScrapId) {
            // 対応する材料の関係を探す
            for (const rel of result.materialRelationships) {
              if (rel.originalId === usedScrapId.originalId) {
                // 端材から根太を作成した記録を追加
                const partId = `part_${rel.originalId}_${rel.parts.length + 1}`;
                rel.parts.push({
                  id: partId,
                  type: '根太（端材から）',
                  length: remainingDepth
                });
                break;
              }
            }
          }
        }
      } else if (usedMaterials > 0) {
        // 根太材がちょうど収まる場合の構成情報を記録
        this._addJoistComposition(result, 'ノーカット', [joistLength], 1);
      }
      
      totalMaterials += usedMaterials;
    }
    
    result.totalJoistMaterials = totalMaterials;
    
    // 残った端材を結果オブジェクトに追加
    this._addRemainingScrapToResult(result, availableScraps);
    
    // 端材の組み合わせで根太を作れるか確認
    this._checkScrapsForJoists(result, roomDepth, false);
  }

  /**
   * 未加工の根太材を使用
   * @private
   */
  static _useUnprocessedJoists(result, remainingDepth, joistLength) {
    let unprocessedCount = 0;
    
    while (remainingDepth >= joistLength) {
      remainingDepth -= joistLength;
      unprocessedCount++;
      
      if (unprocessedCount > 0) {
        result.unprocessedJoists++;
        
        // 材料の関係を記録
        const originalId = `original_${result.materialRelationships.length + 1}`;
        const partId = `part_${originalId}_1`;
        
        result.materialRelationships.push({
          originalId: originalId,
          originalLength: joistLength,
          parts: [{
            id: partId,
            type: '未加工',
            length: joistLength
          }]
        });
      }
    }
    
    // 根太の構成情報を記録（未加工部分）
    if (unprocessedCount > 0) {
      this._addJoistComposition(result, '未加工', [joistLength], 1);
    }
    
    return unprocessedCount;
  }


  /**
   * 利用可能な端材を使用できるか試みる
   * @private
   */
  static _tryUseAvailableScraps(result, requiredLength, availableScraps) {
    let usedScrap = false;
    let usedScrapLength = 0;
    let usedScrapId = null;
    
    // 利用可能な端材をソート（長さの降順）
    availableScraps.sort((a, b) => b.length - a.length);
    
    // 端材を探索
    for (let j = 0; j < availableScraps.length; j++) {
      // 端材が残りの長さ以上ある場合
      if (availableScraps[j].length >= requiredLength) {
        // 端材を使用
        usedScrapLength = requiredLength;
        
        // 端材のIDを記録
        if (availableScraps[j].originalId) {
          usedScrapId = {
            originalId: availableScraps[j].originalId,
            partId: availableScraps[j].partId
          };
        }
        
        availableScraps[j].length -= requiredLength;
        
        // 端材が残らない場合、リストから削除
        if (availableScraps[j].length <= 0) {
          availableScraps.splice(j, 1);
        }
        
        usedScrap = true;
        result.scrapsUsedCount++;
        break;
      }
    }
    
    return { usedScrap, usedScrapLength, usedScrapId };
  }

  /**
   * 残った端材を結果オブジェクトに追加
   * @private
   */
  static _addRemainingScrapToResult(result, availableScraps) {
    availableScraps.forEach(scrap => {
      this._addScrapFromJoist(result, scrap.length, 1);
      
      // 端材のIDがある場合は、対応する材料の関係を更新
      if (scrap.originalId && scrap.partId) {
        // 対応する材料の関係を探す
        for (const rel of result.materialRelationships) {
          if (rel.originalId === scrap.originalId) {
            // 端材の記録を追加（既存の端材の記録がなければ）
            const existingPart = rel.parts.find(p => p.id === scrap.partId);
            if (!existingPart) {
              rel.parts.push({
                id: scrap.partId,
                type: '端材',
                length: scrap.length
              });
            }
            break;
          }
        }
      }
    });
  }

  /**
   * 根太の構成情報を追加
   * @private
   */
  static _addJoistComposition(result, type, lengths, count) {
    // 既存の同じタイプの構成があるか確認
    const existingCompIndex = result.joistCompositions.findIndex(comp => 
      comp.type === type && 
      this._arraysEqual(comp.lengths, lengths)
    );
    
    if (existingCompIndex >= 0) {
      result.joistCompositions[existingCompIndex].count += count;
    } else {
      result.joistCompositions.push({
        type: type,
        lengths: [...lengths],
        count: count
      });
    }
  }

  /**
   * 配列が等しいかチェック
   * @private
   */
  static _arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    
    for (let i = 0; i < arr1.length; i++) {
      if (Math.abs(arr1[i] - arr2[i]) >= 0.1) return false;
    }
    
    return true;
  }

  /**
   * 根太材から発生する端材を追加
   * @private
   */
  static _addScrapFromJoist(result, length, count) {
    // 既存の同じ長さの端材があるか確認
    const existingScrapIndex = result.scrapsFromJoists.findIndex(scrap => 
      Math.abs(scrap.length - length) < 0.1
    );
    
    if (existingScrapIndex >= 0) {
      result.scrapsFromJoists[existingScrapIndex].count += count;
    } else {
      result.scrapsFromJoists.push({
        length: length,
        count: count
      });
    }
  }

  /**
   * 2つの端材で根太を作れるかチェック
   * @private
   */
  static _checkTwoScrapsForJoist(result, roomDepth, scrapsLength) {
    // 2つの端材で根太を作れるかチェック
    const possibleJoistsFromTwoScraps = Math.floor(result.scrapsFromJoists[0].count / 2);
    
    if (possibleJoistsFromTwoScraps > 0 && scrapsLength * 2 >= roomDepth) {
      // 2つの端材から作れる根太の数
      const joistsFromTwoScraps = Math.min(
        possibleJoistsFromTwoScraps,
        Math.floor((scrapsLength * 2) / roomDepth)
      );
      
      if (joistsFromTwoScraps > 0) {
        result.joistsFromScraps += joistsFromTwoScraps;
        // 使用した端材の数を減らす
        result.scrapsFromJoists[0].count -= joistsFromTwoScraps * 2;
        
        // 根太の構成情報を記録
        this._addJoistComposition(result, '同じ端材2つ', [scrapsLength, scrapsLength], joistsFromTwoScraps);
        
        // 端材の端材が発生する場合
        const remainingLength = (scrapsLength * 2) - (joistsFromTwoScraps * roomDepth);
        if (remainingLength > 0) {
          this._addScrapFromScrap(result, remainingLength, joistsFromTwoScraps);
        }
      }
    }
  }

  /**
   * 端材の組み合わせで根太を作れるか確認
   * @private
   */
  static _checkScrapsForJoists(result, roomDepth, isEcoMode) {
    // 端材をソート（長い順）
    result.scrapsFromJoists.sort((a, b) => b.length - a.length);
    
    // 同じ端材同士の組み合わせをチェック
    for (let i = 0; i < result.scrapsFromJoists.length; i++) {
      const scrap1 = result.scrapsFromJoists[i];
      
      // 端材が残っていない場合はスキップ
      if (scrap1.count <= 0) continue;
      
      // 同じ端材同士で根太を作れるか確認
      if (scrap1.count >= 2 && scrap1.length * 2 >= roomDepth) {
        this._createJoistsFromSameScraps(result, roomDepth, scrap1);
      }
      
      // 異なる端材との組み合わせをチェック
      for (let j = i + 1; j < result.scrapsFromJoists.length; j++) {
        const scrap2 = result.scrapsFromJoists[j];
        
        // 端材が残っていない場合はスキップ
        if (scrap2.count <= 0) continue;
        
        // 2つの端材の長さの合計が根太の長さ以上の場合
        if (scrap1.length + scrap2.length >= roomDepth) {
          this._createJoistsFromDifferentScraps(result, roomDepth, scrap1, scrap2);
        }
      }
    }
    
    // 使用済みの端材を削除
    result.scrapsFromJoists = result.scrapsFromJoists.filter(scrap => scrap.count > 0);
  }

  /**
   * 同じ端材から根太を作成
   * @private
   */
  static _createJoistsFromSameScraps(result, roomDepth, scrap) {
    const joistsFromSameScraps = Math.min(
      Math.floor(scrap.count / 2),
      Math.floor((scrap.length * 2) / roomDepth)
    );
    
    if (joistsFromSameScraps > 0) {
      result.joistsFromScraps += joistsFromSameScraps;
      scrap.count -= joistsFromSameScraps * 2;
      
      // 端材の端材が発生する場合
      const remainingLength = (scrap.length * 2) - roomDepth;
      if (remainingLength > 0) {
        this._addScrapFromScrap(result, remainingLength, joistsFromSameScraps);
      }
      
      // 根太の構成情報を記録
      this._addJoistComposition(result, '同じ端材2つ', [scrap.length, scrap.length], joistsFromSameScraps);
    }
  }

  /**
   * 異なる端材から根太を作成
   * @private
   */
  static _createJoistsFromDifferentScraps(result, roomDepth, scrap1, scrap2) {
    const joistsFromDifferentScraps = Math.min(scrap1.count, scrap2.count);
    
    if (joistsFromDifferentScraps > 0) {
      result.joistsFromScraps += joistsFromDifferentScraps;
      scrap1.count -= joistsFromDifferentScraps;
      scrap2.count -= joistsFromDifferentScraps;
      
      // 端材の端材が発生する場合
      const remainingLength = (scrap1.length + scrap2.length) - roomDepth;
      if (remainingLength > 0) {
        this._addScrapFromScrap(result, remainingLength, joistsFromDifferentScraps);
      }
      
      // 根太の構成情報を記録
      this._addJoistComposition(result, '異なる端材2つ', [scrap1.length, scrap2.length], joistsFromDifferentScraps);
    }
  }

  /**
   * 端材の端材を追加
   * @private
   */
  static _addScrapFromScrap(result, length, count) {
    // 既存の同じ長さの端材の端材があるか確認
    const existingScrapIndex = result.scrapsFromScraps.findIndex(scrap => 
      Math.abs(scrap.length - length) < 0.1
    );
    
    if (existingScrapIndex >= 0) {
      result.scrapsFromScraps[existingScrapIndex].count += count;
    } else {
      result.scrapsFromScraps.push({
        length: length,
        count: count
      });
    }
  }

  /**
   * 端材から作れる根太の計算
   * @private
   */
  static _calculateJoistsFromScraps(result, roomDepth) {
    result.scrapsFromJoists.forEach(scrap => {
      // 端材の長さが畳の奥行き以上の場合、根太として使える
      if (scrap.length >= roomDepth) {
        const joistsPerScrap = Math.floor(scrap.length / roomDepth);
        result.joistsFromScraps += joistsPerScrap * scrap.count;
        
        // 端材の端材が発生する場合
        const secondaryScrapLength = scrap.length - (joistsPerScrap * roomDepth);
        if (secondaryScrapLength > 0) {
          this._addScrapFromScrap(result, secondaryScrapLength, scrap.count);
        }
        
        // 根太の構成情報を記録
        this._addJoistComposition(result, '端材から作成', [roomDepth], joistsPerScrap * scrap.count);
      }
      // 端材の長さが畳の奥行きより短い場合は、そのまま残す
    });
  }
}
