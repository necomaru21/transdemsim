function getPathMinFreq(mA, origIdx, destIdx) {
  if (origIdx === destIdx) return 0;

  const cOrigName = cities[origIdx].name;
  const cDestName = cities[destIdx].name;

  // 1. 手動上書き（overrideFreq）が設定されている場合は、stations の null 判定をスキップしてその値を返す
  if (mA.overrideFreq && mA.overrideFreq[cOrigName] && mA.overrideFreq[cOrigName][cDestName] !== undefined) {
    return Number(mA.overrideFreq[cOrigName][cDestName]) || 0;
  }
  if (mA.overrideFreq && mA.overrideFreq[cDestName] && mA.overrideFreq[cDestName][cOrigName] !== undefined) {
    return Number(mA.overrideFreq[cDestName][cOrigName]) || 0;
  }

  // 2. 上書きがない場合：発着駅の始発時刻（stations）が未設定(null)なら停車しないため 0
  const stOrig = mA.stations ? mA.stations.find((s) => s.cityName === cOrigName) : null;
  const stDest = mA.stations ? mA.stations.find((s) => s.cityName === cDestName) : null;
  if (
    !stOrig ||
    stOrig.travel === null ||
    stOrig.travel === undefined ||
    !stDest ||
    stDest.travel === null ||
    stDest.travel === undefined
  ) {
    return 0;
  }

  // 3. 全区間の最小本数を算出
  if (!mA.segmentFreqs || mA.segmentFreqs.length === 0) return 0;
  const minIdx = Math.min(origIdx, destIdx);
  const maxIdx = Math.max(origIdx, destIdx);

  let minFreq = Infinity;
  for (let k = minIdx; k < maxIdx; k++) {
    const c1 = cities[k].name;
    const c2 = cities[k + 1].name;
    const sf = mA.segmentFreqs.find((s) => (s.from === c1 && s.to === c2) || (s.from === c2 && s.to === c1));
    const f = sf ? Number(sf.freq) : 0;
    if (f < minFreq) minFreq = f;
  }
  return minFreq === Infinity || isNaN(minFreq) ? 0 : minFreq;
}

// ==========================================
// ヘルパー関数: 指定モードの区間所要時間(分)を取得
// ==========================================
function getModeTime(modeObj, origName, destName) {
  if (!modeObj || !modeObj.enabled) return null;

  // 1. 簡易入力(travelTime)がある場合
  if (typeof modeObj.travelTime === "number" && modeObj.travelTime > 0) {
    // 隣接区間チェック等の判定、またはOD詳細マトリクスから取得
  }

  // 2. OD詳細マトリクス(odMatrix)から参照する標準的な構造
  if (modeObj.odMatrix && modeObj.odMatrix[origName] && modeObj.odMatrix[origName][destName]) {
    const val = modeObj.odMatrix[origName][destName];
    if (typeof val === "number" && val > 0) return val;
  }

  return null;
}

// ==========================================
// ヘルパー関数: 直行便（乗り換えなし）の最速時間を取得
// ==========================================
function getDirectMinTime(origName, destName) {
  let minTime = Infinity;

  modeA.forEach((mA) => {
    if (!mA.enabled) return;
    const t = getModeTime(mA, origName, destName);
    const f = Number(mA.frequency || mA.freq || 0);
    if (t !== null && f > 0 && t < minTime) {
      minTime = t;
    }
  });

  return minTime;
}

// 手動上書きデータを保持するオブジェクト (初期状態)
window.customTransferMatrix = window.customTransferMatrix || {};

// 有効な乗継データ（手動優先、次点で自動計算）を取得する関数
function getEffectiveTransferData(origName, destName) {
  const autoData = (window.transferMatrixResults && window.transferMatrixResults[origName])
    ? window.transferMatrixResults[origName][destName]
    : { time: null, freq: null };

  const customData = (window.customTransferMatrix[origName])
    ? window.customTransferMatrix[origName][destName]
    : null;

  const effectiveTime = (customData && customData.time !== undefined && customData.time !== null)
    ? customData.time
    : autoData.time;

  const effectiveFreq = (customData && customData.freq !== undefined && customData.freq !== null)
    ? customData.freq
    : autoData.freq;

  return {
    time: effectiveTime,
    freq: effectiveFreq,
    isCustom: customData && (customData.time !== null || customData.freq !== null)
  };
}

// ==========================================
// 乗継マトリクス (最大2回乗継対応) 自動計算関数
// ==========================================
function calculateTransferMatrix() {
  const transferMatrix = {};

  if (!cities || cities.length === 0) return transferMatrix;

  cities.forEach((origCity) => {
    transferMatrix[origCity.name] = {};

    cities.forEach((destCity) => {
      if (origCity.name === destCity.name) {
        transferMatrix[origCity.name][destCity.name] = { time: null, freq: null };
        return;
      }

      // 直行便の最速時間 (存在しなければ Infinity)
      const directMinTime = getDirectMinTime(origCity.name, destCity.name);

      let bestTime = Infinity;
      let bestFreq = null;

      // ----------------------------------------------------
      // 1. 1回乗継の探索 (orig -> k1 -> dest)
      // ----------------------------------------------------
      cities.forEach((k1) => {
        if (k1.name === origCity.name || k1.name === destCity.name) return;

        modeA.forEach((m1) => {
          if (!m1.enabled) return;
          const t1 = getModeTime(m1, origCity.name, k1.name);
          const f1 = Number(m1.frequency || m1.freq || 0);
          if (t1 === null || f1 <= 0) return;

          modeA.forEach((m2) => {
            if (!m2.enabled) return;
            const t2 = getModeTime(m2, k1.name, destCity.name);
            const f2 = Number(m2.frequency || m2.freq || 0);
            if (t2 === null || f2 <= 0) return;

            // 乗継待ち時間 (分) = 30 / 後続モード本数
            const wait1 = 30 / f2;
            const totalT = t1 + wait1 + t2;

            if (totalT < directMinTime && totalT < bestTime) {
              bestTime = totalT;
              bestFreq = Math.min(f1, f2);
            }
          });
        });
      });

      // ----------------------------------------------------
      // 2. 2回乗継の探索 (orig -> k1 -> k2 -> dest)
      // ----------------------------------------------------
      cities.forEach((k1) => {
        if (k1.name === origCity.name || k1.name === destCity.name) return;

        cities.forEach((k2) => {
          if (k2.name === origCity.name || k2.name === destCity.name || k2.name === k1.name) return;

          modeA.forEach((m1) => {
            if (!m1.enabled) return;
            const t1 = getModeTime(m1, origCity.name, k1.name);
            const f1 = Number(m1.frequency || m1.freq || 0);
            if (t1 === null || f1 <= 0) return;

            modeA.forEach((m2) => {
              if (!m2.enabled) return;
              const t2 = getModeTime(m2, k1.name, k2.name);
              const f2 = Number(m2.frequency || m2.freq || 0);
              if (t2 === null || f2 <= 0) return;

              modeA.forEach((m3) => {
                if (!m3.enabled) return;
                const t3 = getModeTime(m3, k2.name, destCity.name);
                const f3 = Number(m3.frequency || m3.freq || 0);
                if (t3 === null || f3 <= 0) return;

                const wait1 = 30 / f2;
                const wait2 = 30 / f3;
                const totalT = t1 + wait1 + t2 + wait2 + t3;

                if (totalT < directMinTime && totalT < bestTime) {
                  bestTime = totalT;
                  bestFreq = Math.min(f1, f2, f3);
                }
              });
            });
          });
        });
      });

      // ----------------------------------------------------
      // 結果の格納
      // ----------------------------------------------------
      if (bestTime < Infinity) {
        transferMatrix[origCity.name][destCity.name] = {
          time: Number(bestTime.toFixed(1)),
          freq: bestFreq
        };
      } else {
        transferMatrix[origCity.name][destCity.name] = { time: null, freq: null };
      }
    });
  });

  return transferMatrix;
}

// --- 需要計算コアロジック ---
function calculate() {
  const K = Number(document.getElementById("paramK").value) || 0.04;
  const alpha = Number(document.getElementById("paramAlpha").value) || 0.9;
  const gamma = Number(document.getElementById("paramGamma").value) || 0.9;
  const lambda = Number(document.getElementById("paramLambda").value) || 0.03;

  const Tmin = Number(document.getElementById("paramTmin").value) || 0;
  const shortThreshold = Number(document.getElementById("paramShortThreshold").value) || 60;
  const shortCoeff = Number(document.getElementById("paramShortCoeff").value) || 0.08;

  const TstartElem = document.getElementById("paramTstart");
  const paramPElem = document.getElementById("paramP");
  const Tstart = TstartElem ? Number(TstartElem.value) || 120 : 120;
  const paramP = paramPElem ? Number(paramPElem.value) || 1.0 : 1.0;

  odResultsMatrix = {};

  for (let i = 0; i < cities.length; i++) {
    const cOrig = cities[i];
    odResultsMatrix[cOrig.name] = {};

    for (let j = 0; j < cities.length; j++) {
      const cDest = cities[j];

      if (i === j) {
        odResultsMatrix[cOrig.name][cDest.name] = {
          Teff: 0,
          Mtotal: 0,
          modes: [],
        };
        continue;
      }

      let availableModes = [];
      // 1. 乗継マトリクスの更新
  window.transferMatrixResults = calculateTransferMatrix();

      // --- 1. モードA（路線型）の探索 ---
      modeA.forEach((mA) => {
        if (!mA.enabled) return;

        let minFreq = 0;
        if (mA.overrideFreq && mA.overrideFreq[cOrig.name] && mA.overrideFreq[cOrig.name][cDest.name] !== undefined) {
          minFreq = mA.overrideFreq[cOrig.name][cDest.name];
        } else {
          minFreq = getPathMinFreq(mA, i, j);
        }

        if (minFreq > 0) {
          let inVehicleTime = null;

          // 1. 手動上書き（overrideTravel）を最優先で取得
          if (
            mA.overrideTravel &&
            mA.overrideTravel[cOrig.name] &&
            mA.overrideTravel[cOrig.name][cDest.name] !== undefined
          ) {
            inVehicleTime = mA.overrideTravel[cOrig.name][cDest.name];
          } else if (
            mA.overrideTravel &&
            mA.overrideTravel[cDest.name] &&
            mA.overrideTravel[cDest.name][cOrig.name] !== undefined
          ) {
            inVehicleTime = mA.overrideTravel[cDest.name][cOrig.name];
          } else {
            // 2. 上書きがない場合のみ、stations（簡易パネル）の始発時刻から自動計算
            const stOrig = mA.stations.find((s) => s.cityName === cOrig.name);
            const stDest = mA.stations.find((s) => s.cityName === cDest.name);
            if (
              stOrig &&
              stDest &&
              stOrig.travel !== null &&
              stOrig.travel !== undefined &&
              stDest.travel !== null &&
              stDest.travel !== undefined
            ) {
              inVehicleTime = Math.abs(stDest.travel - stOrig.travel);
            }
          }

          if (inVehicleTime !== null && inVehicleTime > 0) {
            const waitTime = 60 / (2 * minFreq);
            const accessTime = mA.accessTime || 0;

            let shortPenalty = 0;
            if (mA.useShortPenalty !== false && inVehicleTime < shortThreshold) {
              shortPenalty = shortCoeff * Math.pow(shortThreshold - inVehicleTime, 2);
            }

            const Tk = inVehicleTime + waitTime + accessTime + shortPenalty;

            availableModes.push({
              name: mA.name,
              type: "A",
              inVehicleTime: inVehicleTime,
              freq: minFreq, // ★ 追加: 運行頻度(本/h)
              Tk: Tk,
              color: mA.color,
            });
          }
        }
      });

      // --- 2. モードB（航空機）の探索（複数空港ルートの個別評価・合成対応） ---
      const activeModeBList = expandAirportRoutesToModeB();

      // ★ 最速1本に絞らず、利用可能な全航空ルートを独立した選択肢として抽出
      activeModeBList.forEach((mB) => {
        if (!mB.enabled || mB.freq <= 0) return;

        if ((mB.orig === cOrig.name && mB.dest === cDest.name) || (mB.orig === cDest.name && mB.dest === cOrig.name)) {
          const waitTime = 60 / (2 * mB.freq);
          const Tk = mB.travel + waitTime;

          // 空港ペア名や経由情報が判定できる場合は名称を判別しやすく設定
          const airName = mB.routeLabel ? "航空機 (" + mB.routeLabel + ")" : "航空機";

          availableModes.push({
            name: airName,
            inVehicleTime: mB.travel,
            freq: mB.freq, // ★ 追加: 運行頻度(本/h)
            type: "B",
            Tk: Tk,
            color: mB.color || "#f59e0b",
          });
        }
      });

      // --- 3. 選択確率（シェア）および需要量（Logsum/重力モデル）の計算 ---
      if (availableModes.length === 0) {
        odResultsMatrix[cOrig.name][cDest.name] = {
          Teff: 999,
          Mtotal: 0,
          modes: [],
        };
      } else {
        let sumExp = 0;
        availableModes.forEach((m) => {
          m.expV = Math.exp(-lambda * m.Tk);
          sumExp += m.expV;
        });

        const rawTeff = -Math.log(sumExp) / lambda;

        const minInVehicleTime = Math.min(...availableModes.map((m) => m.inVehicleTime));
        const Teff = Math.max(Math.max(1.0, minInVehicleTime * 0.5), rawTeff);

        const maxInVehicleTime = Math.max(...availableModes.map((m) => m.inVehicleTime));
        const u = Math.min(1.0, Math.max(0.0, maxInVehicleTime / Tstart));
        const scalingS = Math.pow(u, paramP);

        const Mtotal = ((K * Math.pow(cOrig.p * cDest.p, alpha)) / Math.pow(Teff + Tmin, gamma)) * scalingS;

        availableModes.forEach((m) => {
          m.share = (m.expV / sumExp) * 100;
          m.demand = Mtotal * (m.share / 100);
        });

        odResultsMatrix[cOrig.name][cDest.name] = {
          Teff: Teff,
          Mtotal: isNaN(Mtotal) ? 0 : Mtotal,
          modes: availableModes,
        };
      }
    }
  }

  // 描画およびグラフ・OD表のリアルタイム同期
  updatePairAnalysis();
  renderOdFilterControls();
  renderOdMatrixTable();
  renderBoardingAlightingChart();
renderCrossSectionChart();
  renderSingleCityAnalysis();

  saveToLocalStorage();
}

// 空港ペア設定とアクセス時間から都市ペア（モードB）を一括自動展開する
function expandAirportRoutesToModeB() {
  const expandedModeB = [];

  airportRoutes.forEach((route, routeIdx) => {
    if (!route.enabled || route.freq <= 0) return;

    const apA = route.origAirport;
    const apB = route.destAirport;

    const citiesA = cities.filter((c) => airportAccess[c.name] && airportAccess[c.name][apA] > 0);
    const citiesB = cities.filter((c) => airportAccess[c.name] && airportAccess[c.name][apB] > 0);

    // ルート固有の少しずらしたカラーコードを生成
    const routeColor = getShiftedColor(route.color || "#f59e0b", routeIdx);

    citiesA.forEach((cA) => {
      citiesB.forEach((cB) => {
        if (cA.name === cB.name) return;

        const accessA = airportAccess[cA.name][apA];
        const accessB = airportAccess[cB.name][apB];
        const totalInVehicleTravel = route.travel + accessA + accessB;

        expandedModeB.push({
          orig: cA.name,
          dest: cB.name,
          travel: totalInVehicleTravel,
          freq: route.freq,
          color: routeColor, // ★ トーンを少し変えたカラー
          enabled: true,
          fromAirportRoute: true,
          routeLabel: apA + "─" + apB, // ★ 例: 羽田─伊丹
        });
      });
    });
  });

  return expandedModeB;
}

// 同一系統（オレンジ系）の明るさ・鮮やかさだけを微調整する関数
function getShiftedColor(baseHex, index) {
  // 1番目は基準色、2番目以降は明度(L)と彩度(S)をわずかに変化させる設定
  const lightnessShifts = [50, 62, 38, 56, 44]; // 明度 (%)
  const saturationShifts = [92, 85, 95, 78, 88]; // 彩度 (%)

  const l = lightnessShifts[index % lightnessShifts.length];
  const s = saturationShifts[index % saturationShifts.length];

  // 色相(H)は38度（オレンジ）で固定し、明度と彩度のみでバリエーションを作成
  return "hsl(38, " + s + "%, " + l + "%)";
}
