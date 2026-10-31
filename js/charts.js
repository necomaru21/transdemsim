function updatePairAnalysis() {
  const orig = document.getElementById("selectOrig").value;
  const dest = document.getElementById("selectDest").value;

  const pMtotal = document.getElementById("pairMtotal");
  const pTeff = document.getElementById("pairTeff");
  const pBar = document.getElementById("pairShareBar");
  const pTable = document.getElementById("pairTableBody");
  const pDebug = document.getElementById("pairDebugInfo");

  if (!orig || !dest || orig === dest || !odResultsMatrix[orig] || !odResultsMatrix[orig][dest]) {
    if (pMtotal) pMtotal.innerText = "--";
    if (pTeff) pTeff.innerText = "-- 分";
    if (pBar) pBar.innerHTML = "";
    if (pTable) pTable.innerHTML = `<tr><td colspan="4" style="color:#666;">同一都市またはデータがありません</td></tr>`;
    if (pDebug) pDebug.innerText = "デバッグ情報: 対象外のODペアです";
    return;
  }

  const res = odResultsMatrix[orig][dest];

  if (pMtotal) pMtotal.innerText = isNaN(res.Mtotal) ? "NaN" : res.Mtotal.toFixed(2);
  if (pTeff) pTeff.innerText = isNaN(res.Teff) ? "NaN" : res.Teff < 900 ? res.Teff.toFixed(1) + " 分" : "なし";

  if (pBar) pBar.innerHTML = "";
  if (pTable) pTable.innerHTML = "";

  let debugLog = `=== 内部計算ログ [ ${orig} -> ${dest} ] ===\n`;
  const origObj = cities.find((c) => c.name === orig);
  const destObj = cities.find((c) => c.name === dest);

  debugLog += `・ポテンシャル: p_i=${origObj ? origObj.p : "?"}, p_j=${destObj ? destObj.p : "?"}\n`;

  if (!res.modes || res.modes.length === 0) {
    debugLog += `・有効なモード: なし (T_eff = 999)\n`;
  } else {
    res.modes.forEach((m) => {
      pTable.innerHTML += `
            <tr>
              <td class="text-left"><span class="color-dot" style="background:${m.color}"></span><b>${m.name}</b></td>
              <td class="text-right">${isNaN(m.inVehicleTime) ? "-" : m.inVehicleTime.toFixed(0)}分</td>
              <td class="text-right">${isNaN(m.freq) ? "-" : m.freq.toFixed(1)}本/h</td>
              <td class="text-right">${isNaN(m.Tk) ? "NaN" : m.Tk.toFixed(1)}分</td>
              <td class="text-right" style="color:#60a5fa; font-weight:bold;">${isNaN(m.demand) ? "NaN" : m.demand.toFixed(2)}</td>
              <td class="text-right" style="font-weight:bold;">${isNaN(m.share) ? "NaN" : m.share.toFixed(1)}%</td>
            </tr>
          `;          

      if (m.share > 0 && !isNaN(m.share)) {
        pBar.innerHTML += `<div class="share-segment" style="width:${m.share}%; background-color:${m.color};" title="${m.name}: ${m.share.toFixed(1)}%"></div>`;
      }

      debugLog += `・[${m.name}] Tk=${m.Tk} (expV=${m.expV}), share=${m.share}%, demand=${m.demand}\n`;
    });
  }

  debugLog += `----------------------------------------\n`;
  debugLog += `・T_eff: ${res.Teff}\n`;
  debugLog += `・M_total: ${res.Mtotal}\n`;

  if (pDebug) pDebug.innerText = debugLog;
}

function renderOdFilterControls() {
  const container = document.getElementById("odFilterContainer");
  if (!container) return;

  let names = new Set();
  modeA.forEach((m) => {
    if (m.enabled) names.add(m.name);
  });
  // ★ 個別航空ルート名（航空機 (〜)）ではなく、「航空機」に集約
  names.add("航空機");
  allModeNames = Array.from(names);

  const filterTotal = document.getElementById("filterTotal");
  const isTotalChecked = filterTotal ? filterTotal.checked : true;

  let html = `
          <div style="display:flex; align-items:center; cursor:pointer; opacity:${isTotalChecked ? "1.0" : "0.4"}; text-decoration:${isTotalChecked ? "none" : "line-through"}; font-weight:bold; color:#60a5fa; font-size: 11px; user-select:none;" onclick="toggleOdFilter('total')">
            <input type="checkbox" id="filterTotal" ${isTotalChecked ? "checked" : ""} style="display:none;">
            <span>■ 全表示</span>
          </div>
        `;

  allModeNames.forEach((name) => {
    const matchA = modeA.find((m) => m.name === name);
    const color = matchA ? matchA.color : "#f59e0b"; // 航空機は標準オレンジ

    const filterChecks = document.querySelectorAll(".od-mode-filter");
    let isChecked = false;
    filterChecks.forEach((ck) => {
      if (ck.value === name && ck.checked) isChecked = true;
    });

    const opacity = isTotalChecked ? "1.0" : isChecked ? "1.0" : "0.4";
    const textDecoration = isTotalChecked ? "none" : isChecked ? "none" : "line-through";

    html += `
            <div style="display:flex; align-items:center; cursor:pointer; opacity:${opacity}; text-decoration:${textDecoration}; font-size: 11px; transition:all 0.15s ease; user-select:none;" onclick="toggleOdFilterMode('${name}')">
              <input type="checkbox" class="od-mode-filter" value="${name}" ${isChecked ? "checked" : ""} style="display:none;">
              <span class="color-dot" style="background:${color}"></span>
              <span style="color:#ccc;">${name}</span>
            </div>
          `;
  });

  container.innerHTML = html;
}

function toggleOdFilter(type) {
  const filterTotal = document.getElementById("filterTotal");
  const modeChecks = document.querySelectorAll(".od-mode-filter");

  if (type === "total") {
    filterTotal.checked = true;
    modeChecks.forEach((ck) => (ck.checked = false));
  }
  renderOdFilterControls();
  renderOdMatrixTable();
}

function toggleOdFilterMode(modeName) {
  const filterTotal = document.getElementById("filterTotal");
  const modeChecks = document.querySelectorAll(".od-mode-filter");

  let targetCk = null;
  modeChecks.forEach((ck) => {
    if (ck.value === modeName) targetCk = ck;
  });

  if (targetCk) {
    targetCk.checked = !targetCk.checked;
  }

  const anyModeChecked = Array.from(modeChecks).some((ck) => ck.checked);
  if (anyModeChecked) {
    filterTotal.checked = false;
  } else {
    filterTotal.checked = true;
  }

  renderOdFilterControls();
  renderOdMatrixTable();
}

function renderOdMatrixTable() {
  const table = document.getElementById("odMatrixTable");
  const isTotal = document.getElementById("filterTotal") ? document.getElementById("filterTotal").checked : true;

  const filterChecks = document.querySelectorAll(".od-mode-filter");
  let selectedModes = new Set();
  filterChecks.forEach((ck) => {
    if (ck.checked) selectedModes.add(ck.value);
  });

  let matrixValues = {};
  let maxVal = 0;

  cities.forEach((cOrig) => {
    matrixValues[cOrig.name] = {};
    cities.forEach((cDest) => {
      if (cOrig.name === cDest.name) {
        matrixValues[cOrig.name][cDest.name] = null;
      } else {
        const res = odResultsMatrix[cOrig.name] ? odResultsMatrix[cOrig.name][cDest.name] : null;
        let val = 0;
        if (res) {
          if (isTotal) {
            val = res.Mtotal;
          } else {
            res.modes.forEach((m) => {
              // モードAの完全一致判定
              if (selectedModes.has(m.name)) {
                val += m.demand;
              }
              // ★ 「航空機」選択時：名称が "航空機" で始まる全航空ルートの需要を合算
              else if (selectedModes.has("航空機") && m.name.indexOf("航空機") === 0) {
                val += m.demand;
              }
            });
          }
        }
        matrixValues[cOrig.name][cDest.name] = val;
        if (val > maxVal) maxVal = val;
      }
    });
  });

  let headHtml = "<tr><th>発 \\ 着</th>";
  cities.forEach((c) => {
    headHtml += `<th>${c.name}</th>`;
  });
  headHtml += "</tr>";

  let bodyHtml = "";
  cities.forEach((cOrig) => {
    bodyHtml += `<tr><td class="text-left" style="font-weight:bold; color:#aaa;">${cOrig.name}</td>`;
    cities.forEach((cDest) => {
      const val = matrixValues[cOrig.name][cDest.name];

      if (val === null) {
        bodyHtml += `<td style="color:#444;">-</td>`;
      } else {
        const ratio = maxVal > 0 ? val / maxVal : 0;
        const alpha = ratio > 0 ? (0.12 + ratio * 0.65).toFixed(2) : 0;
        const bgColor = ratio > 0 ? `rgba(59, 130, 246, ${alpha})` : "transparent";
        const textColor = ratio > 0.45 ? "#ffffff" : "#60a5fa";
        const fontWeight = ratio > 0.2 ? "bold" : "normal";

        bodyHtml += `<td style="background-color: ${bgColor}; color: ${textColor}; font-weight: ${fontWeight}; transition: background-color 0.2s ease;">${val.toFixed(2)}</td>`;
      }
    });
    bodyHtml += "</tr>";
  });

  table.innerHTML = headHtml + bodyHtml;
}

function toggleChartMode(modeName) {
  if (modeName === "total") {
    isChartTotalMode = true;
    disabledChartModes.clear();
  } else {
    let activeModeANames = modeA.filter((m) => m.enabled).map((m) => m.name);

    if (isChartTotalMode) {
      isChartTotalMode = false;
      activeModeANames.forEach((name) => {
        if (name !== modeName) disabledChartModes.add(name);
      });
    } else {
      if (disabledChartModes.has(modeName)) {
        disabledChartModes.delete(modeName);
      } else {
        disabledChartModes.add(modeName);
      }

      const remainingCount = activeModeANames.length - disabledChartModes.size;
      if (remainingCount === 0 || remainingCount === activeModeANames.length) {
        isChartTotalMode = true;
        disabledChartModes.clear();
      }
    }
  }
  renderCrossSectionChart();
}

function renderCrossSectionChart() {
  const canvas = document.getElementById("crossSectionCanvas");
  const ctx = canvas.getContext("2d");

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio || 300;
  canvas.height = rect.height * window.devicePixelRatio || 180;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const width = rect.width;
  const height = rect.height;

  ctx.clearRect(0, 0, width, height);

  if (cities.length < 2) return;

  const numSections = cities.length - 1;
  let sections = [];
  for (let s = 0; s < numSections; s++) {
    sections.push({
      label: cities[s].name,
      origIdx: s,
      destIdx: s + 1,
    });
  }

  let allActiveModeA = modeA.filter((m) => m.enabled);
  let activeModeA = allActiveModeA.filter((m) => !disabledChartModes.has(m.name));

  let sectionData = sections.map(() => ({}));

  activeModeA.forEach((mA) => {
    sections.forEach((sec, sIdx) => {
      let sectionDemand = 0;

      for (let i = 0; i < cities.length; i++) {
        for (let j = 0; j < cities.length; j++) {
          if (i === j) continue;
          const passesDown = i <= sec.origIdx && j >= sec.destIdx;
          const passesUp = j <= sec.origIdx && i >= sec.destIdx;

          if (passesDown || passesUp) {
            const res = odResultsMatrix[cities[i].name] ? odResultsMatrix[cities[i].name][cities[j].name] : null;
            if (res && res.modes && res.modes.length > 0) {
              const mMatch = res.modes.find((m) => m.name === mA.name);
              if (mMatch && typeof mMatch.demand === "number" && !isNaN(mMatch.demand)) {
                sectionDemand += mMatch.demand;
              }
            }
          }
        }
      }
      sectionData[sIdx][mA.name] = sectionDemand;
    });
  });

  let maxStack = 0;
  let stackedData = sections.map((sec, sIdx) => {
    let currentHeight = 0;
    let modeY = {};
    activeModeA.forEach((mA) => {
      const dem = sectionData[sIdx][mA.name] || 0;
      modeY[mA.name] = { y0: currentHeight, y1: currentHeight + dem };
      currentHeight += dem;
    });
    if (currentHeight > maxStack) maxStack = currentHeight;
    return modeY;
  });

  if (maxStack === 0) maxStack = 1;

  const paddingLeft = 35;
  const paddingBottom = 30;
  const paddingTop = 10;
  const paddingRight = 10;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  ctx.strokeStyle = "#333333";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(paddingLeft, paddingTop);
  ctx.lineTo(paddingLeft, height - paddingBottom);
  ctx.lineTo(width - paddingRight, height - paddingBottom);
  ctx.stroke();

  ctx.fillStyle = "#888888";
  ctx.font = "9px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(maxStack.toFixed(0), paddingLeft - 4, paddingTop + 8);
  ctx.fillText((maxStack / 2).toFixed(0), paddingLeft - 4, paddingTop + chartH / 2 + 3);
  ctx.fillText("0", paddingLeft - 4, height - paddingBottom);

  const stepX = chartW / numSections;

  ctx.textAlign = "center";
  sections.forEach((sec, idx) => {
    const x = paddingLeft + (idx + 0.5) * stepX;
    ctx.fillText(sec.label, x, height - paddingBottom + 14);
  });

  activeModeA.forEach((mA) => {
    ctx.fillStyle = mA.color + "bb";
    ctx.strokeStyle = mA.color;
    ctx.beginPath();

    sections.forEach((sec, idx) => {
      const x = paddingLeft + (idx + 0.5) * stepX;
      const valY1 = stackedData[idx][mA.name].y1;
      const y = height - paddingBottom - (valY1 / maxStack) * chartH;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    for (let idx = sections.length - 1; idx >= 0; idx--) {
      const x = paddingLeft + (idx + 0.5) * stepX;
      const valY0 = stackedData[idx][mA.name].y0;
      const y = height - paddingBottom - (valY0 / maxStack) * chartH;
      ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  const legendDiv = document.getElementById("chartLegend");
  legendDiv.innerHTML = "";

  const totalOpacity = isChartTotalMode ? "1.0" : "0.4";
  const totalDecoration = isChartTotalMode ? "none" : "line-through";
  legendDiv.innerHTML += `
        <div style="display:flex; align-items:center; cursor:pointer; opacity:${totalOpacity}; text-decoration:${totalDecoration}; font-weight:bold; color:#60a5fa; user-select:none;" onclick="toggleChartMode('total')">
          <span>■ 全表示</span>
        </div>
      `;

  allActiveModeA.forEach((mA) => {
    const isDisabled = !isChartTotalMode && disabledChartModes.has(mA.name);
    const opacity = isChartTotalMode ? "1.0" : !isDisabled ? "1.0" : "0.4";
    const textDecoration = isChartTotalMode ? "none" : !isDisabled ? "none" : "line-through";

    legendDiv.innerHTML += `
          <div style="display:flex; align-items:center; cursor:pointer; opacity:${opacity}; text-decoration:${textDecoration}; transition:all 0.15s ease; user-select:none;" onclick="toggleChartMode('${mA.name}')">
            <span class="color-dot" style="background:${mA.color}"></span>
            <span style="color:#ccc;">${mA.name}</span>
          </div>
        

// 1都市選択時の分析描画エントリーポイント
function renderSingleCityAnalysis() {
  const citySelect = document.getElementById("selectSingleCity");
  if (!citySelect) return;
  const orig = citySelect.value;
  if (!orig || !odResultsMatrix[orig]) return;

  renderSingleCityBarChart(orig);
  renderSingleCityBubbleChart(orig);
}

// ① 横向き積み上げ棒グラフ（都市別需要 ＆ モード内訳）
function renderSingleCityBarChart(orig) {
  const canvas = document.getElementById("singleCityBarCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio || 300;
  canvas.height = rect.height * window.devicePixelRatio || 200;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const width = rect.width;
  const height = rect.height;
  ctx.clearRect(0, 0, width, height);

  const destCities = cities.filter((c) => c.name !== orig);
  if (destCities.length === 0) return;

  const paddingLeft = 60;
  const paddingBottom = 20;
  const paddingTop = 10;
  const paddingRight = 15;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  // 最大需要量の算出
  let maxDemand = 0;
  destCities.forEach((dest) => {
    const res = odResultsMatrix[orig][dest.name];
    if (res && res.Mtotal > maxDemand) maxDemand = res.Mtotal;
  });
  if (maxDemand === 0) maxDemand = 1;

  const barHeight = Math.min(24, (chartH / destCities.length) * 0.65);
  const rowStep = chartH / destCities.length;

  // Y軸都市名 ＆ 棒グラフ描画
  destCities.forEach((dest, idx) => {
    const yCenter = paddingTop + (idx + 0.5) * rowStep;
    const yTop = yCenter - barHeight / 2;

    ctx.fillStyle = "#aaa";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(dest.name, paddingLeft - 6, yCenter + 3);

    const res = odResultsMatrix[orig][dest.name];
    if (!res || !res.modes || res.modes.length === 0) return;

    let currentX = paddingLeft;
    res.modes.forEach((m) => {
      const segW = (m.demand / maxDemand) * chartW;
      if (segW > 0) {
        ctx.fillStyle = m.color;
        ctx.fillRect(currentX, yTop, segW, barHeight);
        currentX += segW;
      }
    });

    // 数値ラベル
    ctx.fillStyle = "#60a5fa";
    ctx.font = "9px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(res.Mtotal.toFixed(1), currentX + 4, yCenter + 3);
  });
}

// ② バブルチャート（横軸:時間距離Teff, 縦軸:需要Mtotal, バブルサイズ:相手都市ポテンシャル）
function renderSingleCityBubbleChart(orig) {
  const canvas = document.getElementById("singleCityBubbleCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio || 300;
  canvas.height = rect.height * window.devicePixelRatio || 220;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const width = rect.width;
  const height = rect.height;
  ctx.clearRect(0, 0, width, height);

  const destCities = cities.filter((c) => c.name !== orig);
  if (destCities.length === 0) return;

  const paddingLeft = 40;
  const paddingBottom = 30;
  const paddingTop = 15;
  const paddingRight = 20;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  let maxTeff = 0;
  let maxMtotal = 0;
  let maxP = 0;

  destCities.forEach((dest) => {
    const res = odResultsMatrix[orig][dest.name];
    if (res) {
      if (res.Teff < 900 && res.Teff > maxTeff) maxTeff = res.Teff;
      if (res.Mtotal > maxMtotal) maxMtotal = res.Mtotal;
    }
    if (dest.p > maxP) maxP = dest.p;
  });

  if (maxTeff === 0) maxTeff = 300;
  if (maxMtotal === 0) maxMtotal = 100;
  if (maxP === 0) maxP = 100;

  // 軸線の描画
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(paddingLeft, paddingTop);
  ctx.lineTo(paddingLeft, height - paddingBottom);
  ctx.lineTo(width - paddingRight, height - paddingBottom);
  ctx.stroke();

  // 軸ラベル
  ctx.fillStyle = "#888";
  ctx.font = "9px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("時間距離 Teff (分)", paddingLeft + chartW / 2, height - 6);

  // バブル描画
  destCities.forEach((dest) => {
    const res = odResultsMatrix[orig][dest.name];
    if (!res || res.Teff >= 900) return;

    const x = paddingLeft + (res.Teff / maxTeff) * chartW;
    const y = height - paddingBottom - (res.Mtotal / maxMtotal) * chartH;
    const radius = Math.max(4, Math.min(20, (dest.p / maxP) * 18));

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(59, 130, 246, 0.4)";
    ctx.fill();
    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 都市名テキスト
    ctx.fillStyle = "#fff";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(dest.name, x, y - radius - 2);
  });
}`;
  });
}
