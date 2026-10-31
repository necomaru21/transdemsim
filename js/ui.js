function scrollToTarget(targetElem) {
  if (!targetElem) return;
  const stickyBar = document.querySelector(".sticky-action-bar");
  const toolbarHeight = stickyBar ? stickyBar.offsetHeight : 0;
  const elementPosition = targetElem.getBoundingClientRect().top + window.pageYOffset;
  const offsetPosition = elementPosition - toolbarHeight - 8;
  window.scrollTo({ top: offsetPosition, behavior: "smooth" });
}

function renderDynamicNavTabs() {
  const container = document.getElementById("dynamicNavTabs");
  const quickContainer = document.getElementById("modeAQuickNavTabs");

  // --- 1. 上部追従バー用（①都市、モードA群、航空機、③結果） ---
  let htmlFull =
    '<button class="btn-nav-jump" style="border-color: #4b5563; color: #9ca3af;" onclick="scrollToTarget(document.getElementById(\'sec-city\'))">① 都市</button>';

  // --- 2. モードAカード固定ヘッダー用（モードA群のみ） ---
  let htmlModeAOnly = "";

  modeA.forEach((mA, idx) => {
    // トグルがオン/オフに関わらず全モードのボタンを生成
    const isEnabled = mA.enabled !== false;
    const modeColor = mA.color || "#3b82f6";

    // トグルオフの場合はグレー系＋半透明で非表示状態を表現
    const btnStyle = isEnabled
      ? "border-color: " + modeColor + "; color: " + modeColor + ";"
      : "border-color: #555555; color: #888888; opacity: 0.55; background: #1a1a1a;";

    const btnHtml =
      '<button class="btn-nav-jump" style="' +
      btnStyle +
      '" onclick="scrollToModeA(' +
      idx +
      ')">' +
      mA.name +
      "</button>";

    htmlFull += btnHtml;
    htmlModeAOnly += btnHtml;
  });

  const hasEnabledModeB =
    typeof airportRoutes !== "undefined" && airportRoutes.some((r) => r.enabled !== false && r.freq > 0);

  if (hasEnabledModeB) {
    htmlFull +=
      '<button class="btn-nav-jump" style="border-color: #f59e0b; color: #f59e0b;" onclick="scrollToTarget(document.getElementById(\'sec-modeb\'))">航空機</button>';
  }

  htmlFull +=
    '<button class="btn-nav-jump" style="border-color: #2563eb; color: #60a5fa; background: #1e293b;" onclick="scrollToTarget(document.getElementById(\'sec-result\'))">③ 結果</button>';

  if (container) container.innerHTML = htmlFull;
  if (quickContainer) quickContainer.innerHTML = htmlModeAOnly;
}

function scrollToModeA(index) {
  const modeItems = document.querySelectorAll("#modeAContainer .mode-item");
  if (!modeItems[index]) return;

  const targetElem = modeItems[index];

  // 1920px 以上の環境：モードAカード内（.card-scroll-body）のみを自動スクロール
  if (window.innerWidth >= 1920) {
    const scrollContainer = targetElem.closest(".card-scroll-body");
    if (scrollContainer) {
      const containerTop = scrollContainer.getBoundingClientRect().top;
      const elemTop = targetElem.getBoundingClientRect().top;

      // 固定ヘッダー直下からの位置を純粋に計算
      const scrollOffset = elemTop - containerTop + scrollContainer.scrollTop - 4;

      scrollContainer.scrollTo({ top: scrollOffset, behavior: "smooth" });
    }
  } else {
    // 1920px 未満の環境：従来のページ全体スクロール
    scrollToTarget(targetElem);
  }
}

function renderCitiesTable() {
  const tbody = document.getElementById("cityTableBody");
  tbody.innerHTML = "";

  cities.forEach((c, idx) => {
    const tr = document.createElement("tr");
    const upDisabled = idx === 0 ? "disabled style='opacity:0.3; cursor:default;'" : "";
    const downDisabled = idx === cities.length - 1 ? "disabled style='opacity:0.3; cursor:default;'" : "";

    tr.innerHTML =
      '<td><input type="text" class="text-left" value="' +
      c.name +
      '" onchange="cities[' +
      idx +
      '].name=this.value; syncCityNames(); onDataChange();"></td>' +
      '<td><input type="number" value="' +
      c.p +
      '" onchange="cities[' +
      idx +
      '].p=Number(this.value); onDataChange();"></td>' +
      '<td style="white-space: nowrap;">' +
      '<button class="btn-del" style="background:#252525; border-color:#444; color:#ccc; margin-right:2px;" onclick="moveCity(' +
      idx +
      ', -1)" ' +
      upDisabled +
      ">▲</button>" +
      '<button class="btn-del" style="background:#252525; border-color:#444; color:#ccc; margin-right:4px;" onclick="moveCity(' +
      idx +
      ', 1)" ' +
      downDisabled +
      ">▼</button>" +
      '<button class="btn-del" onclick="deleteCity(' +
      idx +
      ')">削除</button>' +
      "</td>";

    tbody.appendChild(tr);
  });

  syncCitySelects();
}

// モードB（航空機）の描画処理全体
function renderModeB() {
  renderAirportTable();
  renderAirportAccessTable();
  renderAirportRouteTable();
}

// 1. 空港テーブル描画（並び替えボタン付き）
function renderAirportTable() {
  const tbody = document.getElementById("airportTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  airports.forEach((ap, idx) => {
    const upDisabled = idx === 0 ? "disabled style='opacity:0.3; cursor:default;'" : "";
    const downDisabled = idx === airports.length - 1 ? "disabled style='opacity:0.3; cursor:default;'" : "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-left">
        <input type="text" value="${ap.name}" style="width:100px; font-weight:bold;" onchange="updateAirportName(${idx}, this.value)">
      </td>
      <td style="white-space: nowrap;">
        <button class="btn-del" style="background:#252525; border-color:#444; color:#ccc; margin-right:2px;" onclick="moveAirport(${idx}, -1)" ${upDisabled}>▲</button>
        <button class="btn-del" style="background:#252525; border-color:#444; color:#ccc; margin-right:4px;" onclick="moveAirport(${idx}, 1)" ${downDisabled}>▼</button>
        <button class="btn-del" style="padding: 2px 6px; font-size: 10px;" onclick="deleteAirport(${idx})">削除</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 空港追加
function addAirport() {
  const newName = prompt("追加する空港名を入力してください:", "新空港");
  if (!newName) return;
  airports.push({ name: newName });
  renderModeB();
  onDataChange();
}

// 空港名変更
function updateAirportName(idx, newName) {
  const oldName = airports[idx].name;
  if (!newName || oldName === newName) return;

  airports[idx].name = newName;

  // airportAccess のキー更新
  cities.forEach((c) => {
    if (airportAccess[c.name] && airportAccess[c.name][oldName] !== undefined) {
      airportAccess[c.name][newName] = airportAccess[c.name][oldName];
      delete airportAccess[c.name][oldName];
    }
  });

  // airportRoutes の空港名更新
  airportRoutes.forEach((r) => {
    if (r.origAirport === oldName) r.origAirport = newName;
    if (r.destAirport === oldName) r.destAirport = newName;
  });

  renderModeB();
  onDataChange();
}

// 空港削除（リファクタリング後）
function deleteAirport(idx) {
  const targetName = airports[idx].name;
  if (!confirm(`空港「${targetName}」を削除しますか？`)) return;

  // 1. 配列から対象空港を削除
  airports.splice(idx, 1);

  // 2. 連動するアクセス時間や路線データの削除は共通関数に全お任せ
  cleanupGhostData();

  // 3. 画面の再描画
  renderModeB();
  onDataChange();
}

// 2. 都市 ➔ 空港アクセス時間テーブル描画
function renderAirportAccessTable() {
  const thead = document.getElementById("airportAccessThead");
  const tbody = document.getElementById("airportAccessTbody");
  if (!thead || !tbody) return;

  let thHtml = `<tr><th class="text-left">都市名</th>`;
  airports.forEach((ap) => {
    thHtml += `<th>${ap.name}</th>`;
  });
  thHtml += `</tr>`;
  thead.innerHTML = thHtml;

  tbody.innerHTML = "";
  cities.forEach((c) => {
    if (!airportAccess[c.name]) airportAccess[c.name] = {};
    let trHtml = `<tr><td class="text-left" style="color:#aaa;">${c.name}</td>`;
    airports.forEach((ap) => {
      const val =
        airportAccess[c.name][ap.name] !== undefined && airportAccess[c.name][ap.name] !== null
          ? airportAccess[c.name][ap.name]
          : "-";
      trHtml += `<td><input type="text" value="${val}" style="width:45px;" onchange="updateAirportAccess('${c.name}', '${ap.name}', this.value)"></td>`;
    });
    trHtml += `</tr>`;
    tbody.innerHTML += trHtml;
  });
}

function updateAirportAccess(cityName, airportName, val) {
  if (!airportAccess[cityName]) airportAccess[cityName] = {};
  const num = Number(val);
  if (val === "" || val === "-" || isNaN(num)) {
    airportAccess[cityName][airportName] = null;
  } else {
    airportAccess[cityName][airportName] = num;
  }
  onDataChange();
}

// 3. 拠点間航空路線ペアテーブル描画
function renderAirportRouteTable() {
  const tbody = document.getElementById("airportRouteTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  airportRoutes.forEach((r, idx) => {
    let origOptions = "";
    let destOptions = "";
    airports.forEach((ap) => {
      origOptions += `<option value="${ap.name}" ${ap.name === r.origAirport ? "selected" : ""}>${ap.name}</option>`;
      destOptions += `<option value="${ap.name}" ${ap.name === r.destAirport ? "selected" : ""}>${ap.name}</option>`;
    });

    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td class="text-left"><select onchange="airportRoutes[${idx}].origAirport=this.value; onDataChange();">${origOptions}</select></td>
            <td class="text-left"><select onchange="airportRoutes[${idx}].destAirport=this.value; onDataChange();">${destOptions}</select></td>
            <td><input type="number" value="${r.travel}" style="width:50px;" onchange="airportRoutes[${idx}].travel=Number(this.value); onDataChange();"></td>
            <td><input type="number" step="0.1" value="${r.freq}" style="width:50px;" onchange="airportRoutes[${idx}].freq=Number(this.value); onDataChange();"></td>
            <td>
              <label class="switch-wrap">
                <input type="checkbox" ${r.enabled !== false ? "checked" : ""} onchange="airportRoutes[${idx}].enabled=this.checked; onDataChange();">
                <span class="switch-slider"></span>
              </label>
            </td>
            <td><button class="btn-del" style="padding: 2px 6px; font-size: 10px;" onclick="deleteAirportRouteRow(${idx})">削除</button></td>
          `;
    tbody.appendChild(tr);
  });
}

// 航空路線ペアの追加
function addAirportRouteRow() {
  if (airports.length < 2) {
    alert("路線を追加するには空港が少なくとも2つ必要です。");
    return;
  }
  airportRoutes.push({
    origAirport: airports[0].name,
    destAirport: airports[1].name,
    travel: 60,
    freq: 1.0,
    enabled: true,
  });
  renderAirportRouteTable();
  onDataChange();
}

// 航空路線ペアの削除
function deleteAirportRouteRow(idx) {
  airportRoutes.splice(idx, 1);
  renderAirportRouteTable();
  onDataChange();
}

// 空港の並び替え（▲: -1, ▼: 1）
function moveAirport(idx, direction) {
  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= airports.length) return;

  // 配列要素の入れ替え
  const temp = airports[idx];
  airports[idx] = airports[targetIdx];
  airports[targetIdx] = temp;

  // モードB全体の再描画
  renderModeB();
  onDataChange();
}

function moveCity(idx, direction) {
  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= cities.length) return;

  const temp = cities[idx];
  cities[idx] = cities[targetIdx];
  cities[targetIdx] = temp;

  renderCitiesTable();
  onDataChange();
}

function confirmCityOrder() {
  cleanupGhostData();
  renderModeA();
  renderModeB();
  onDataChange();
}

// モードAの順序を移動（▲: -1, ▼: 1）
function moveModeA(idx, direction) {
  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= modeA.length) return;

  // 配列要素を入れ替え
  const temp = modeA[idx];
  modeA[idx] = modeA[targetIdx];
  modeA[targetIdx] = temp;

  // 画面の再描画と再計算
  renderModeA();
  renderDynamicNavTabs();
  onDataChange();
}

function renderModeA() {
  const container = document.getElementById("modeAContainer");
  container.innerHTML = "";

  const countElem = document.getElementById("modeACount");
  if (countElem) countElem.innerText = `(${modeA.length}/10種)`;

  const btnAdd = document.getElementById("btnAddModeA");
  if (btnAdd) {
    if (modeA.length >= 10) {
      btnAdd.disabled = true;
      btnAdd.style.opacity = "0.5";
      btnAdd.style.cursor = "not-allowed";
    } else {
      btnAdd.disabled = false;
      btnAdd.style.opacity = "1";
      btnAdd.style.cursor = "pointer";
    }
  }

  const currentSegments = [];
  for (let i = 0; i < cities.length - 1; i++) {
    currentSegments.push({
      from: cities[i].name,
      to: cities[i + 1].name,
    });
  }

  modeA.forEach((mA, idx) => {
    if (!mA.overrideTravel) mA.overrideTravel = {};
    if (!mA.overrideFreq) mA.overrideFreq = {};

    const div = document.createElement("div");
    div.className = "mode-item";

    let stationRowsHtml = "";
    cities.forEach((c) => {
      const st = mA.stations.find((s) => s.cityName === c.name) || { travel: null };
      const travelVal = st.travel !== null && st.travel !== undefined ? st.travel : "-";

      stationRowsHtml += `
        <tr>
          <td class="text-left" style="color:#aaa;">${c.name}</td>
          <td><input type="text" value="${travelVal}" style="width:60px;" onchange="updateModeAStation(${idx}, '${c.name}', this.value)"></td>
        </tr>
      `;
    });

    const newSegmentFreqs = [];
    let segmentRowsHtml = "";

    currentSegments.forEach((seg) => {
      let sf = (mA.segmentFreqs || []).find(
        (s) => (s.from === seg.from && s.to === seg.to) || (s.from === seg.to && s.to === seg.from),
      );

      if (!sf) {
        sf = { from: seg.from, to: seg.to, freq: 0 };
      } else {
        sf.from = seg.from;
        sf.to = seg.to;
      }

      newSegmentFreqs.push(sf);

      segmentRowsHtml += `
        <tr>
          <td class="text-left" style="color:#aaa;">${seg.from}─${seg.to}</td>
          <td><input type="number" step="0.5" value="${sf.freq}" style="width:60px;" onchange="updateModeASegmentFreq(${idx}, '${seg.from}', '${seg.to}', this.value)"></td>
        </tr>
      `;
    });

    mA.segmentFreqs = newSegmentFreqs;

    const upDisabled = idx === 0 ? "disabled style='opacity:0.3; cursor:default;'" : "";
    const downDisabled = idx === modeA.length - 1 ? "disabled style='opacity:0.3; cursor:default;'" : "";

    const deleteBtnHtml =
      modeA.length > 1
        ? `<button class="btn-del" style="padding: 2px 6px; font-size: 10px;" onclick="deleteModeA(${idx})">削除</button>`
        : ``;

    div.innerHTML = `
    <div class="mode-item-top">
        <div style="display:flex; align-items:center; gap:6px;">
        <!-- 並び替えボタン（▲ / ▼） -->
        <div style="display:flex; gap:2px;">
            <button class="btn-del" style="background:#252525; border-color:#444; color:#ccc; padding:1px 5px; font-size:9px;" onclick="moveModeA(${idx}, -1)" ${upDisabled}>▲</button>
            <button class="btn-del" style="background:#252525; border-color:#444; color:#ccc; padding:1px 5px; font-size:9px;" onclick="moveModeA(${idx}, 1)" ${downDisabled}>▼</button>
        </div>

        <!-- ★ カラー丸ボタンのみ（タップで60色モーダル＋HEX指定が開く） -->
        <span class="color-picker-dot" style="background-color: ${mA.color || "#3b82f6"};" onclick="openColorPaletteModal(${idx})" title="パレットから色を選択"></span>

        <!-- モード名 -->
        <input type="text" value="${mA.name}" style="background:transparent; border:none; border-bottom:1px dashed #666; color:#fff; font-weight:bold; width:90px;" onchange="modeA[${idx}].name=this.value; renderDynamicNavTabs(); onDataChange();">
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
        <div style="display:flex; align-items:center; gap:2px;">
            <span style="font-size:10px; color:#aaa;">アクセス:</span>
            <input type="number" value="${mA.accessTime || 0}" style="width:38px; padding:2px 3px;" onchange="modeA[${idx}].accessTime=Number(this.value); onDataChange();">
            <span style="font-size:10px; color:#aaa;">分</span>
        </div>
        <label style="font-size:10px; color:#aaa; display:flex; align-items:center; gap:2px; cursor:pointer;" title="短距離ペナルティ適用">
            <input type="checkbox" ${mA.useShortPenalty !== false ? "checked" : ""} onchange="modeA[${idx}].useShortPenalty=this.checked; onDataChange();">
            短距離
        </label>
        <label class="switch-wrap">
            <input type="checkbox" ${mA.enabled ? "checked" : ""} onchange="modeA[${idx}].enabled=this.checked; renderDynamicNavTabs(); onDataChange();">
            <span class="switch-slider"></span>
        </label>
        ${deleteBtnHtml}
        </div>
    </div>

    <div style="margin-bottom: 8px;">
        <button class="btn-config-action" style="width: 100%; border-color: #3b82f6; background: #1e293b; color: #93c5fd;" onclick="openMatrixModalA(${idx})">
        ⚙️ OD詳細設定（マトリクスで直接編集）
        </button>
    </div>

    <!-- ★ 簡易設定部分の折りたたみ -->
    <details style="background:#181818; border:1px solid #333; border-radius:6px; padding:6px 8px;">
        <summary style="font-size:10px; font-weight:bold; color:#888; cursor:pointer; user-select:none; outline:none;">
        📝 始発所要時間・区間本数の簡易入力パネル（クリックで展開）
        </summary>
        <div class="grid-2" style="margin-top:6px;">
        <div>
            <div style="font-size:10px; color:#888; margin-bottom:4px; font-weight:bold;">始発所要時間(分) [簡易]</div>
            <div class="table-container">
            <table>
                <thead><tr><th class="text-left">都市</th><th>時間</th></tr></thead>
                <tbody>${stationRowsHtml}</tbody>
            </table>
            </div>
        </div>
        <div>
            <div style="font-size:10px; color:#888; margin-bottom:4px; font-weight:bold;">区間本数(本/h) [簡易]</div>
            <div class="table-container">
            <table>
                <thead><tr><th class="text-left">区間</th><th>本数</th></tr></thead>
                <tbody>${segmentRowsHtml}</tbody>
            </table>
            </div>
        </div>
        </div>
    </details>
    `;
    container.appendChild(div);
  });
  renderDynamicNavTabs();
}

function updateModeAStation(mAIdx, cityName, val) {
  let st = modeA[mAIdx].stations.find((s) => s.cityName === cityName);
  if (!st) {
    st = { cityName: cityName, travel: null };
    modeA[mAIdx].stations.push(st);
  }
  st.travel = val === "-" || val.trim() === "" ? null : Number(val);
  onDataChange();
}

function updateModeASegmentFreq(mAIdx, fromCity, toCity, val) {
  if (!modeA[mAIdx].segmentFreqs) modeA[mAIdx].segmentFreqs = [];
  let sf = modeA[mAIdx].segmentFreqs.find(
    (s) => (s.from === fromCity && s.to === toCity) || (s.from === toCity && s.to === fromCity),
  );
  if (!sf) {
    sf = { from: fromCity, to: toCity, freq: 0 };
    modeA[mAIdx].segmentFreqs.push(sf);
  }
  sf.freq = Number(val);
  onDataChange();
}

function addCity() {
  const newName = "都市" + (cities.length + 1);
  cities.push({ name: newName, p: 50, accessAir: 90 });
  renderCitiesTable();
  renderModeA();
  onDataChange();
}

// 都市削除（リファクタリング後）
function deleteCity(idx) {
  if (cities.length <= 2) {
    alert("都市は最低2つ必要です。");
    return;
  }

  // 1. 配列から対象都市を削除
  cities.splice(idx, 1);

  // 2. 連動データの削除は共通関数に全お任せ
  cleanupGhostData();

  // 3. 画面の再描画と再計算
  renderCitiesTable();
  renderModeA();
  renderModeB();
  onDataChange();
}

// モードAの動的追加
function addModeA() {
  if (modeA.length >= 10) {
    alert("モードAは最大10種までしか追加できません。");
    return;
  }

  // 被らないプリセット色を用意
  const presetColors = ["#ec4899", "#8b5cf6", "#f59e0b", "#10b981", "#6366f1", "#14b8a6", "#f97316", "#e11d48"];
  const newColor = presetColors[modeA.length % presetColors.length];

  const newModeName = "新モード" + (modeA.length + 1);

  // 都市マスターに基づいた初期駅データを作成
  const defaultStations = cities.map((c, i) => ({
    cityName: c.name,
    travel: i === 0 ? 0 : null, // 起点都市以外は初期未入力
  }));

  // 区間本数の初期データを作成
  const defaultSegmentFreqs = [];
  for (let i = 0; i < cities.length - 1; i++) {
    defaultSegmentFreqs.push({
      from: cities[i].name,
      to: cities[i + 1].name,
      freq: 0,
    });
  }

  modeA.push({
    name: newModeName,
    enabled: true,
    accessTime: 10,
    useShortPenalty: true,
    color: newColor,
    stations: defaultStations,
    segmentFreqs: defaultSegmentFreqs,
    overrideTravel: {},
    overrideFreq: {},
  });

  renderModeA();
  renderDynamicNavTabs();
  onDataChange();
}

// モードAの削除
function deleteModeA(idx) {
  if (modeA.length <= 1) {
    alert("モードAは最低1つ必要です。");
    return;
  }

  const targetName = modeA[idx].name;
  if (!confirm(`[ ${targetName} ] を削除してもよろしいですか？`)) return;

  modeA.splice(idx, 1);

  renderModeA();
  renderDynamicNavTabs();
  onDataChange();
}

function syncCityNames() {
  syncCitySelects();
  renderModeA();
}

// 選択値を localStorage に保存する関数
function saveSelectState() {
  const sOrig = document.getElementById("selectOrig");
  const sDest = document.getElementById("selectDest");
  if (sOrig && sOrig.value) {
    localStorage.setItem("transdemsim_selectOrig", sOrig.value);
  }
  if (sDest && sDest.value) {
    localStorage.setItem("transdemsim_selectDest", sDest.value);
  }
}

// セレクトボックスの同期・初期化処理
function syncCitySelects() {
  const sOrig = document.getElementById("selectOrig");
  const sDest = document.getElementById("selectDest");
  if (!sOrig || !sDest) return;

  // 1. JSON読み込み等で都市データが存在しない（0件）場合
  if (!cities || cities.length === 0) {
    sOrig.innerHTML = "";
    sDest.innerHTML = "";
    sOrig.value = "";
    sDest.value = ""; // 終点は null (空)
    localStorage.removeItem("transdemsim_selectOrig");
    localStorage.removeItem("transdemsim_selectDest");
    if (typeof updatePairAnalysis === "function") updatePairAnalysis();
    return;
  }

  // 2. <option> 選択肢をクリア＆再生成
  sOrig.innerHTML = "";
  sDest.innerHTML = "";

  cities.forEach((c) => {
    sOrig.innerHTML += `<option value="${c.name}">${c.name}</option>`;
    sDest.innerHTML += `<option value="${c.name}">${c.name}</option>`;
  });

  // 3. デフォルト値の定義（始点：先頭都市、終点：末尾都市）
  const defaultOrig = cities[0].name;
  const defaultDest = cities[cities.length - 1].name;

  // 4. localStorage に保存されている値を最優先で取得
  const savedOrig = localStorage.getItem("transdemsim_selectOrig");
  const savedDest = localStorage.getItem("transdemsim_selectDest");

  // 起点都市の確定：保存された都市が現在のリストに存在すれば復元、なければデフォルト(先頭)
  if (savedOrig && cities.some((c) => c.name === savedOrig)) {
    sOrig.value = savedOrig;
  } else {
    sOrig.value = defaultOrig;
  }

  // 終点都市の確定：保存された都市が現在のリストに存在すれば復元、なければデフォルト(末尾)
  if (savedDest && cities.some((c) => c.name === savedDest)) {
    sDest.value = savedDest;
  } else {
    sDest.value = defaultDest;
  }

  // 現在の確定値を Storage に同期保存
  saveSelectState();

  // 5. 描画処理の呼び出し
  if (typeof updatePairAnalysis === "function") {
    updatePairAnalysis();
  }
}

let activeColorTargetModeIdx = null;

// パレットモーダルを開く
function openColorPaletteModal(modeIdx) {
  activeColorTargetModeIdx = modeIdx;
  const mA = modeA[modeIdx];

  const container = document.getElementById("colorPaletteContainer");
  if (!container) return;

  container.innerHTML = "";
  PRESET_COLORS.forEach((colorHex) => {
    const isSelected = (mA.color || "").toLowerCase() === colorHex.toLowerCase();
    const item = document.createElement("div");
    item.className = "color-palette-item" + (isSelected ? " selected" : "");
    item.style.backgroundColor = colorHex;
    item.onclick = function () {
      selectPresetColor(colorHex);
    };
    container.appendChild(item);
  });

  document.getElementById("colorModalHexInput").value = mA.color || "#3b82f6";
  document.getElementById("colorPaletteModal").classList.remove("hidden");
}

// プリセット色を選択時
function selectPresetColor(hex) {
  if (activeColorTargetModeIdx !== null) {
    modeA[activeColorTargetModeIdx].color = hex;
    renderModeA();
    renderDynamicNavTabs();
    onDataChange();
  }
  closeColorPaletteModal();
}

// カラーコード（Hex）を直接変更時
function updateModeAColor(idx, val) {
  let hex = val.trim();
  if (!hex.startsWith("#")) hex = "#" + hex;

  // 正規表現でHEXカラーコード検証（#RGB または #RRGGBB）
  if (/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(hex)) {
    modeA[idx].color = hex;
    renderModeA();
    renderDynamicNavTabs();
    onDataChange();
  } else {
    alert("正しいカラーコード（例: #3B82F6 や #FF0000）を入力してください。");
    renderModeA();
  }
}

function closeColorPaletteModal() {
  document.getElementById("colorPaletteModal").classList.add("hidden");
  activeColorTargetModeIdx = null;
}

// --- モーダルダイアログ制御 ＆ クリップボード機能 ---
function openMatrixModalA(modeIdx) {
  activeModalType = "A";
  activeModalModeIdx = modeIdx;
  const mA = modeA[modeIdx];

  document.getElementById("modalTitle").innerText = `⚙️ OD詳細マトリクス設定 [ ${mA.name} ]`;
  document.getElementById("pasteTextarea").value = "";

  modalMatrixData = { travel: {}, freq: {} };

  // openMatrixModalA 内の修正箇所
  cities.forEach((cOrig, i) => {
    modalMatrixData.travel[cOrig.name] = {};
    modalMatrixData.freq[cOrig.name] = {};

    cities.forEach((cDest, j) => {
      if (i === j) return;

      const stOrig = mA.stations.find((s) => s.cityName === cOrig.name);
      const stDest = mA.stations.find((s) => s.cityName === cDest.name);

      const autoInVehicle =
        stOrig &&
        stDest &&
        stOrig.travel !== null &&
        stOrig.travel !== undefined &&
        stDest.travel !== null &&
        stDest.travel !== undefined
          ? Math.abs(stDest.travel - stOrig.travel)
          : null;

      // ★ stations が null の場合は autoFreq も null として扱う（0 にしない）
      const autoFreq =
        stOrig && stOrig.travel !== null && stDest && stDest.travel !== null ? getPathMinFreq(mA, i, j) : null;

      const overTravel =
        mA.overrideTravel && mA.overrideTravel[cOrig.name] ? mA.overrideTravel[cOrig.name][cDest.name] : undefined;
      const overFreq =
        mA.overrideFreq && mA.overrideFreq[cOrig.name] ? mA.overrideFreq[cOrig.name][cDest.name] : undefined;

      modalMatrixData.travel[cOrig.name][cDest.name] = {
        autoVal: autoInVehicle,
        overrideVal: overTravel !== undefined ? overTravel : null,
      };

      modalMatrixData.freq[cOrig.name][cDest.name] = {
        autoVal: autoFreq,
        overrideVal: overFreq !== undefined ? overFreq : null,
      };
    });
  });

  renderMatrixModalTable();
  document.getElementById("matrixModal").classList.remove("hidden");
}

function openMatrixModalB() {
  activeModalType = "B";
  activeModalModeIdx = null;
  document.getElementById("modalTitle").innerText = `⚙️ OD詳細マトリクス設定 [ 航空機 ]`;
  document.getElementById("pasteTextarea").value = "";

  modalMatrixData = { travel: {}, freq: {} };

  cities.forEach((cOrig, i) => {
    modalMatrixData.travel[cOrig.name] = {};
    modalMatrixData.freq[cOrig.name] = {};

    cities.forEach((cDest, j) => {
      if (i === j) return;

      const matchB = activeModeBList.find(
        (b) => (b.orig === cOrig.name && b.dest === cDest.name) || (b.orig === cDest.name && b.dest === cOrig.name),
      );
      const autoTravel = matchB ? matchB.travel : null;
      const autoFreq = matchB ? matchB.freq : null;

      modalMatrixData.travel[cOrig.name][cDest.name] = {
        autoVal: autoTravel,
        overrideVal: null,
      };
      modalMatrixData.freq[cOrig.name][cDest.name] = {
        autoVal: autoFreq,
        overrideVal: null,
      };
    });
  });

  renderMatrixModalTable();
  document.getElementById("matrixModal").classList.remove("hidden");
}

function closeMatrixModal() {
  document.getElementById("matrixModal").classList.add("hidden");
  activeModalModeIdx = null;
}

function renderMatrixModalTable() {
  const table = document.getElementById("matrixModalTable");
  let headHtml = "<tr><th>発 \\ 着</th>";
  cities.forEach((c) => {
    headHtml += `<th>${c.name}</th>`;
  });
  headHtml += "</tr>";

  let bodyHtml = "";
  cities.forEach((cOrig, i) => {
    bodyHtml += `<tr><td class="text-left" style="font-weight:bold; color:#aaa;">${cOrig.name}</td>`;
    cities.forEach((cDest, j) => {
      if (i === j) {
        bodyHtml += `<td style="color:#444;">-</td>`;
      } else if (i < j) {
        // 右上半分：本数 (freq)
        const cellData = modalMatrixData.freq[cOrig.name][cDest.name];
        const isOverridden = cellData.overrideVal !== null;
        const displayVal = isOverridden ? cellData.overrideVal : cellData.autoVal !== null ? cellData.autoVal : "";
        const bgClass = isOverridden ? "cell-override" : "";

        bodyHtml += `
              <td>
                <input type="number" step="0.5" class="${bgClass}" style="width:55px; color:#60a5fa;" value="${displayVal}" 
                  placeholder="${cellData.autoVal !== null ? cellData.autoVal : "0"}"
                  onchange="updateModalCellValue('freq', '${cOrig.name}', '${cDest.name}', this.value)">
              </td>`;
      } else {
        // 左下半分：所要時間 (travel)
        // 対応する区間の「本数」を判定（対角線を挟んだ右上方向 [j][i] を参照）
        const freqData = modalMatrixData.freq[cDest.name][cOrig.name];
        const currentFreq = freqData.overrideVal !== null ? freqData.overrideVal : freqData.autoVal || 0;

        const cellData = modalMatrixData.travel[cOrig.name][cDest.name];
        const isOverridden = cellData.overrideVal !== null;

        if (currentFreq <= 0) {
          // ★ 本数 0 または停車なしの場合：グレーアウトしてハイフン表示
          bodyHtml += `
                <td style="background: #181818; color: #444;">
                  <span style="font-size: 10px; color: #555;">-</span>
                </td>`;
        } else {
          // 本数 > 0 の場合のみ入力枠を表示
          const displayVal = isOverridden ? cellData.overrideVal : cellData.autoVal !== null ? cellData.autoVal : "";

          // ★ 自動計算値もなく手動値もない（未入力）場合は赤系クラスを付与
          const isRequired = displayVal === "" || displayVal === null || displayVal === undefined;

          let bgClass = "";
          if (isRequired) {
            bgClass = "cell-required";
          } else if (isOverridden) {
            bgClass = "cell-override";
          }

          bodyHtml += `
                <td>
                  <input type="number" step="1" class="${bgClass}" style="width:55px; color:#a78bfa;" value="${displayVal}" 
                    placeholder=""
                    onchange="updateModalCellValue('travel', '${cOrig.name}', '${cDest.name}', this.value)">
                </td>`;
        }
      }
    });
    bodyHtml += "</tr>";
  });

  table.innerHTML = headHtml + bodyHtml;

  // リセットボタンの要素取得（ボタンが存在する場合は常に表示状態に維持）
  const btnReset = document.getElementById("btnModalReset");
  if (btnReset) {
    btnReset.style.display = "inline-block";
  }
}

function resetMatrixModalOverrides() {
  const mA = modeA[activeModalModeIdx];
  if (!mA) return;
  if (!confirm(`[ ${mA.name} ] の手動上書き設定（緑色セル）をすべてクリアし、自動計算値に戻しますか？`)) return;

  cities.forEach((cOrig, i) => {
    cities.forEach((cDest, j) => {
      if (i === j) return;
      if (modalMatrixData.travel[cOrig.name] && modalMatrixData.travel[cOrig.name][cDest.name]) {
        modalMatrixData.travel[cOrig.name][cDest.name].overrideVal = null;
      }
      if (modalMatrixData.freq[cOrig.name] && modalMatrixData.freq[cOrig.name][cDest.name]) {
        modalMatrixData.freq[cOrig.name][cDest.name].overrideVal = null;
      }
    });
  });

  renderMatrixModalTable();
}

function updateModalCellValue(type, orig, dest, valStr) {
  var targetObj = modalMatrixData[type][orig][dest];
  const trimmed = valStr.trim();

  if (trimmed === "") {
    targetObj.overrideVal = null;
  } else {
    var numVal = Number(trimmed);
    // autoVal が存在し、入力値と一致するときだけ自動計算に戻す（autoVal が null の場合は無条件で上書き値として保持）
    if (targetObj.autoVal !== null && targetObj.autoVal !== undefined && numVal === targetObj.autoVal) {
      targetObj.overrideVal = null;
    } else {
      targetObj.overrideVal = numVal;
    }
  }

  // 対角セルへの連動（本数・所要時間）
  const oppType = type;
  if (modalMatrixData[oppType] && modalMatrixData[oppType][dest] && modalMatrixData[oppType][dest][orig]) {
    var oppObj = modalMatrixData[oppType][dest][orig];
    oppObj.overrideVal = targetObj.overrideVal;
  }

  renderMatrixModalTable();
}

function copyMatrixToClipboard() {
  let tsv = "発\\着\t" + cities.map((c) => c.name).join("\t") + "\n";

  cities.forEach((cOrig, i) => {
    let row = [cOrig.name];
    cities.forEach((cDest, j) => {
      if (i === j) {
        row.push("-");
      } else if (i < j) {
        const cell = modalMatrixData.freq[cOrig.name][cDest.name];
        row.push(cell.overrideVal !== null ? cell.overrideVal : cell.autoVal !== null ? cell.autoVal : "");
      } else {
        const cell = modalMatrixData.travel[cOrig.name][cDest.name];
        row.push(cell.overrideVal !== null ? cell.overrideVal : cell.autoVal !== null ? cell.autoVal : "");
      }
    });
    tsv += row.join("\t") + "\n";
  });

  navigator.clipboard
    .writeText(tsv)
    .then(() => {
      alert("都市名ヘッダーを含む数表データをクリップボードにコピーしました！Excelにそのままペーストできます。");
    })
    .catch((err) => {
      console.error("コピー失敗:", err);
    });
}

function applyPastedTSV() {
  const text = document.getElementById("pasteTextarea").value.trim();
  if (!text) return;

  const lines = text.split(/\r?\n/).map((l) => l.split("\t"));

  let startRow = 0;
  let startCol = 0;
  if (isNaN(Number(lines[0][0])) && lines[0][0] !== "" && lines[0][0] !== "-") startRow = 1;
  if (
    lines.length > startRow &&
    isNaN(Number(lines[startRow][0])) &&
    lines[startRow][0] !== "" &&
    lines[startRow][0] !== "-"
  )
    startCol = 1;

  // 行数・列数の不一致チェック
  const dataRows = lines.length - startRow;
  const dataCols = lines[startRow] ? lines[startRow].length - startCol : 0;
  const expectedSize = cities.length;

  if (dataRows !== expectedSize || dataCols !== expectedSize) {
    alert(
      `貼り付けデータのサイズが一致しません。\n\n・現在の都市数: ${expectedSize} × ${expectedSize}\n・検出データサイズ: ${dataRows} 行 × ${dataCols} 列\n\nデータの行列数を確認して再試行してください。`,
    );
    return;
  }

  let updatedCount = 0;

  for (let i = 0; i < cities.length; i++) {
    const lineIdx = startRow + i;
    if (lineIdx >= lines.length) break;

    for (let j = 0; j < cities.length; j++) {
      if (i === j) continue;
      const colIdx = startCol + j;
      if (colIdx >= lines[lineIdx].length) continue;

      const rawVal = lines[lineIdx][colIdx].trim();
      const origName = cities[i].name;
      const destName = cities[j].name;

      if (i < j) {
        updateModalCellValue("freq", origName, destName, rawVal);
      } else {
        updateModalCellValue("travel", origName, destName, rawVal);
      }
      updatedCount++;
    }
  }

  document.getElementById("pasteTextarea").value = "";
  alert(`クリップボードから ${updatedCount} 個のセルデータを一括読み込みしました。`);
}

function saveMatrixModalInternal() {
  if (activeModalModeIdx === null) return;

  const mA = modeA[activeModalModeIdx];
  mA.overrideTravel = {};
  mA.overrideFreq = {};

  cities.forEach((cOrig, i) => {
    cities.forEach((cDest, j) => {
      if (i === j) return;

      // 1. 所要時間（左下半分 i > j）の上書き保存
      if (i > j) {
        const tData = modalMatrixData.travel[cOrig.name] && modalMatrixData.travel[cOrig.name][cDest.name];
        if (tData && tData.overrideVal !== null && tData.overrideVal !== undefined && tData.overrideVal !== "") {
          if (!mA.overrideTravel[cOrig.name]) mA.overrideTravel[cOrig.name] = {};
          mA.overrideTravel[cOrig.name][cDest.name] = parseFloat(tData.overrideVal);
        }
      }

      // 2. 本数（右上半分 i < j）の上書き保存
      if (i < j) {
        const fData = modalMatrixData.freq[cOrig.name] && modalMatrixData.freq[cOrig.name][cDest.name];
        if (fData && fData.overrideVal !== null && fData.overrideVal !== undefined && fData.overrideVal !== "") {
          const val = parseFloat(fData.overrideVal);

          // 往復（両方向）に上書き本数を反映
          if (!mA.overrideFreq[cOrig.name]) mA.overrideFreq[cOrig.name] = {};
          mA.overrideFreq[cOrig.name][cDest.name] = val;

          if (!mA.overrideFreq[cDest.name]) mA.overrideFreq[cDest.name] = {};
          mA.overrideFreq[cDest.name][cOrig.name] = val;
        }
      }
    });
  });

  onDataChange();
}

function applyAndCalculateMatrix() {
  saveMatrixModalInternal();
  calculate();
}

function saveMatrixModal() {
  saveMatrixModalInternal();
  calculate();
  closeMatrixModal();
}

// --- 初期化 ---
document.addEventListener("DOMContentLoaded", function () {
  const loaded = loadFromLocalStorage();

  renderCitiesTable();
  renderModeA();
  renderModeB();

  if (loaded) {
    if (loaded.selectOrig) document.getElementById("selectOrig").value = loaded.selectOrig;
    if (loaded.selectDest) document.getElementById("selectDest").value = loaded.selectDest;
  }

  // 1. マウスホイールによる勝手な値変更を防ぐ
  document.addEventListener(
    "wheel",
    function (e) {
      if (document.activeElement && document.activeElement.type === "number") {
        document.activeElement.blur(); // フォーカスを外してスクロールによる値変更を無効化
      }
    },
    { passive: false },
  );

  // 2. タップ／クリック／フォーカス時に数値全体を自動選択する（ブルブル震え防止策適用）
  document.addEventListener("focusin", function (e) {
    var target = e.target;
    if (target && (target.type === "number" || target.type === "text")) {
      // すでにフォーカス処理中の場合は連鎖発火を防ぐ
      if (target.dataset.isSelecting === "true") return;
      target.dataset.isSelecting = "true";

      setTimeout(function () {
        // 要素がまだドキュメント上に存在し、アクティブである場合のみ選択
        if (document.activeElement === target && typeof target.select === "function") {
          target.select();
        }
        target.dataset.isSelecting = "false";
      }, 50);
    }
  });

  calculate();
  renderDynamicNavTabs();
  pushHistory();
});

document.addEventListener("keydown", function (e) {
  // Escキーでモーダルを閉じる
  if (e.key === "Escape") {
    const matrixModal = document.getElementById("matrixModal");
    const colorPaletteModal = document.getElementById("colorPaletteModal");
    if (matrixModal && !matrixModal.classList.contains("hidden")) {
      closeMatrixModal();
    }
    if (colorPaletteModal && !colorPaletteModal.classList.contains("hidden")) {
      closeColorPaletteModal();
    }
  }

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
    if (e.shiftKey) {
      redo();
    } else {
      undo();
    }
    e.preventDefault();
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
    redo();
    e.preventDefault();
  }
});