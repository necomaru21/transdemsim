const STORAGE_KEY = "traffic_sim_ver3_data";

// 路線・グラフ識別用 60色マトリクスパレット（10列 × 6行）
// 1行目: 超ライト（明） / 2行目: ライト / 3行目: 基本色相 / 4行目: ダーク / 5行目: ディープ（暗） / 6行目: モノトーン
const PRESET_COLORS = [
  // 1行目: 明るい（ペール・ライト）
  "#fca5a5",
  "#fdba74",
  "#fef08a",
  "#bef264",
  "#86efac",
  "#6ee7b7",
  "#67e8f9",
  "#93c5fd",
  "#c4b5fd",
  "#f0abfc",

  // 2行目: やや明るい（ソフト）
  "#f87171",
  "#fb923c",
  "#facc15",
  "#a3e635",
  "#4ade80",
  "#34d399",
  "#22d3ee",
  "#60a5fa",
  "#a78bfa",
  "#e879f9",

  // 3行目: ★ 基本色相（標準）
  "#ef4444",
  "#f97316",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#d946ef",

  // 4行目: やや暗い（ダーク）
  "#dc2626",
  "#ea580c",
  "#ca8a04",
  "#65a30d",
  "#16a34a",
  "#059669",
  "#0891b2",
  "#2563eb",
  "#7c3aed",
  "#c026d3",

  // 5行目: 暗い（ディープ）
  "#991b1b",
  "#9a3412",
  "#854d0e",
  "#3f6212",
  "#14532d",
  "#064e3b",
  "#164e63",
  "#1e40af",
  "#581c87",
  "#701a75",

  // 6行目: モノトーン（白〜灰〜黒）
  "#ffffff",
  "#f3f4f6",
  "#e5e7eb",
  "#d1d5db",
  "#9ca3af",
  "#6b7280",
  "#4b5563",
  "#374151",
  "#1f2937",
  "#000000",
];

const defaultCities = [
  { name: "東京", p: 100, accessAir: 60 },
  { name: "新横浜", p: 60, accessAir: 60 },
  { name: "名古屋", p: 70, accessAir: 65 },
  { name: "新大阪", p: 80, accessAir: 55 },
  { name: "博多", p: 70, accessAir: 50 },
];

const defaultModeA = [
  {
    name: "のぞみ/みずほ",
    enabled: true,
    accessTime: 10,
    useShortPenalty: true,
    color: "#3b82f6",
    stations: [
      { cityName: "東京", travel: 0 },
      { cityName: "新横浜", travel: 18 },
      { cityName: "名古屋", travel: 99 },
      { cityName: "新大阪", travel: 150 },
      { cityName: "博多", travel: 297 },
    ],
    segmentFreqs: [
      { from: "東京", to: "新横浜", freq: 6.5 },
      { from: "新横浜", to: "名古屋", freq: 6.5 },
      { from: "名古屋", to: "新大阪", freq: 6.5 },
      { from: "新大阪", to: "博多", freq: 3 },
    ],
    overrideTravel: {},
    overrideFreq: {},
  },
  {
    name: "ひかり/さくら",
    enabled: true,
    accessTime: 10,
    useShortPenalty: true,
    color: "#06b6d4",
    stations: [
      { cityName: "東京", travel: 0 },
      { cityName: "新横浜", travel: 18 },
      { cityName: "名古屋", travel: 118 },
      { cityName: "新大阪", travel: 174 },
      { cityName: "博多", travel: 337 },
    ],
    segmentFreqs: [
      { from: "東京", to: "新横浜", freq: 2 },
      { from: "新横浜", to: "名古屋", freq: 2 },
      { from: "名古屋", to: "新大阪", freq: 1 },
      { from: "新大阪", to: "博多", freq: 1 },
    ],
    overrideTravel: {},
    overrideFreq: {},
  },
  {
    name: "こだま",
    enabled: true,
    accessTime: 10,
    useShortPenalty: true,
    color: "#10b981",
    stations: [
      { cityName: "東京", travel: 0 },
      { cityName: "新横浜", travel: 18 },
      { cityName: "名古屋", travel: 160 },
      { cityName: "新大阪", travel: 234 },
      { cityName: "博多", travel: 490 },
    ],
    segmentFreqs: [
      { from: "東京", to: "新横浜", freq: 2 },
      { from: "新横浜", to: "名古屋", freq: 2 },
      { from: "名古屋", to: "新大阪", freq: 2 },
      { from: "新大阪", to: "博多", freq: 1 },
    ],
    overrideTravel: {},
    overrideFreq: {},
  },
  {
    name: "リニア",
    enabled: false,
    accessTime: 20,
    useShortPenalty: true,
    color: "#ec4899",
    stations: [
      { cityName: "東京", travel: 0 },
      { cityName: "名古屋", travel: 40 },
      { cityName: "新大阪", travel: 67 },
      { cityName: "博多", travel: 230 },
    ],
    segmentFreqs: [
      { from: "東京", to: "新横浜", freq: 5 },
      { from: "新横浜", to: "名古屋", freq: 5 },
      { from: "名古屋", to: "新大阪", freq: 5 },
      { from: "新大阪", to: "博多", freq: 3 },
    ],
    overrideTravel: {},
    overrideFreq: {},
  },
  {
    name: "在来線",
    enabled: true,
    accessTime: 0,
    useShortPenalty: false,
    color: "#8b5cf6",
    stations: [
      { cityName: "東京", travel: 0 },
      { cityName: "新横浜", travel: 26 },
      { cityName: "名古屋", travel: 370 },
      { cityName: "新大阪", travel: 475 },
      { cityName: "博多", travel: null },
    ],
    segmentFreqs: [
      { from: "東京", to: "新横浜", freq: 6 },
      { from: "新横浜", to: "名古屋", freq: 2 },
      { from: "名古屋", to: "新大阪", freq: 2 },
      { from: "新大阪", to: "博多", freq: 0 },
    ],
    overrideTravel: {},
    overrideFreq: {},
  },
];

// 【新規追加】デフォルト空港マスター
const defaultAirports = [{ name: "羽田" }, { name: "伊丹" }, { name: "関西" }, { name: "福岡" }];

// 【新規追加】都市〜空港アクセス時間(分) [cityName][airportName]
const defaultAirportAccess = {
  東京: { 羽田: 30, 伊丹: null, 関西: null, 福岡: null },
  新横浜: { 羽田: 45, 伊丹: null, 関西: null, 福岡: null },
  名古屋: { 羽田: null, 伊丹: null, 関西: null, 福岡: null },
  新大阪: { 羽田: null, 伊丹: 25, 関西: 50, 福岡: null },
  博多: { 羽田: null, 伊丹: null, 関西: null, 福岡: 15 },
};

// 【新規追加】空港ペア設定（拠点間路線）
const defaultAirportRoutes = [
  { origAirport: "羽田", destAirport: "伊丹", travel: 60, freq: 2.0, color: "#f59e0b", enabled: true },
  { origAirport: "羽田", destAirport: "福岡", travel: 110, freq: 3.5, color: "#f59e0b", enabled: true },
  { origAirport: "伊丹", destAirport: "福岡", travel: 75, freq: 1.0, color: "#f59e0b", enabled: true },
];

let cities = JSON.parse(JSON.stringify(defaultCities));
let modeA = JSON.parse(JSON.stringify(defaultModeA));
let airports = JSON.parse(JSON.stringify(defaultAirports));
let airportAccess = JSON.parse(JSON.stringify(defaultAirportAccess));
let airportRoutes = JSON.parse(JSON.stringify(defaultAirportRoutes));

let odResultsMatrix = {};
let allModeNames = [];

let disabledChartModes = new Set();
let isChartTotalMode = true;

// --- モーダルダイアログ編集中の状態 ---
let activeModalType = "A"; // 'A' または 'B'
let activeModalModeIdx = null;
let modalMatrixData = {};

// --- Undo / Redo 状態管理 ---
const MAX_HISTORY = 30;
let historyStack = [];
let historyIndex = -1;
let isUndoingRedoing = false;

function pushHistory() {
  if (isUndoingRedoing) return;

  const snapshot = JSON.stringify({
    simName: document.getElementById("simNameInput") ? document.getElementById("simNameInput").value : "",
    params: {
      K: Number(document.getElementById("paramK").value),
      alpha: Number(document.getElementById("paramAlpha").value),
      gamma: Number(document.getElementById("paramGamma").value),
      lambda: Number(document.getElementById("paramLambda").value),
      Tmin: Number(document.getElementById("paramTmin").value),
      shortThreshold: Number(document.getElementById("paramShortThreshold").value),
      shortCoeff: Number(document.getElementById("paramShortCoeff").value),
      Tstart: Number(document.getElementById("paramTstart").value),
      paramP: Number(document.getElementById("paramP").value),
    },
    cities: cities,
    modeA: modeA,
    airports: airports, // ★ 空港マスター同期
    airportAccess: airportAccess, // ★ アクセス時間同期
    airportRoutes: airportRoutes, // ★ 航空路線ペア同期
  });

  historyStack = historyStack.slice(0, historyIndex + 1);
  historyStack.push(snapshot);

  if (historyStack.length > MAX_HISTORY) {
    historyStack.shift();
  } else {
    historyIndex++;
  }

  updateUndoRedoButtons();
}

function onDataChange() {
  if (isUndoingRedoing) return;
  pushHistory();
  saveToLocalStorage();
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    applyHistoryState(historyStack[historyIndex]);
  }
}

function redo() {
  if (historyIndex < historyStack.length - 1) {
    historyIndex++;
    applyHistoryState(historyStack[historyIndex]);
  }
}

function applyHistoryState(jsonStr) {
  if (!jsonStr) return;

  isUndoingRedoing = true;

  try {
    const state = JSON.parse(jsonStr);

    if (state.simName && document.getElementById("simNameInput")) {
      document.getElementById("simNameInput").value = state.simName;
    }

    if (state.params) {
      if (state.params.K !== undefined) document.getElementById("paramK").value = state.params.K;
      if (state.params.alpha !== undefined) document.getElementById("paramAlpha").value = state.params.alpha;
      if (state.params.gamma !== undefined) document.getElementById("paramGamma").value = state.params.gamma;
      if (state.params.lambda !== undefined) document.getElementById("paramLambda").value = state.params.lambda;
      if (state.params.Tmin !== undefined) document.getElementById("paramTmin").value = state.params.Tmin;
      if (state.params.shortThreshold !== undefined)
        document.getElementById("paramShortThreshold").value = state.params.shortThreshold;
      if (state.params.shortCoeff !== undefined)
        document.getElementById("paramShortCoeff").value = state.params.shortCoeff;
      if (state.params.Tstart !== undefined) document.getElementById("paramTstart").value = state.params.Tstart;
      if (state.params.paramP !== undefined) document.getElementById("paramP").value = state.params.paramP;
    }

    if (state.cities) cities = JSON.parse(JSON.stringify(state.cities));
    if (state.modeA) modeA = JSON.parse(JSON.stringify(state.modeA));
    if (state.airports) airports = JSON.parse(JSON.stringify(state.airports));
    if (state.airportAccess) airportAccess = JSON.parse(JSON.stringify(state.airportAccess));
    if (state.airportRoutes) airportRoutes = JSON.parse(JSON.stringify(state.airportRoutes));

    renderCitiesTable();
    renderModeA();
    renderModeB();

    renderDynamicNavTabs();

    saveToLocalStorage();
  } catch (e) {
    console.error("Undo/Redo 適用エラー:", e);
  } finally {
    isUndoingRedoing = false;
    updateUndoRedoButtons();
  }
}

function updateUndoRedoButtons() {
  const btnUndo = document.getElementById("btnUndo");
  const btnRedo = document.getElementById("btnRedo");

  if (btnUndo) {
    btnUndo.disabled = historyIndex <= 0;
    btnUndo.style.opacity = historyIndex > 0 ? "1" : "0.5";
    btnUndo.style.cursor = historyIndex > 0 ? "pointer" : "not-allowed";
  }
  if (btnRedo) {
    btnRedo.disabled = historyIndex >= historyStack.length - 1;
    btnRedo.style.opacity = historyIndex < historyStack.length - 1 ? "1" : "0.5";
    btnRedo.style.cursor = historyIndex < historyStack.length - 1 ? "pointer" : "not-allowed";
  }
}

function saveToLocalStorage() {
  try {
    const state = {
      simName: document.getElementById("simNameInput")
        ? document.getElementById("simNameInput").value
        : "東海道・山陽新幹線",
      params: {
        K: Number(document.getElementById("paramK").value),
        alpha: Number(document.getElementById("paramAlpha").value),
        gamma: Number(document.getElementById("paramGamma").value),
        lambda: Number(document.getElementById("paramLambda").value),
        Tmin: Number(document.getElementById("paramTmin").value),
        shortThreshold: Number(document.getElementById("paramShortThreshold").value),
        shortCoeff: Number(document.getElementById("paramShortCoeff").value),
        Tstart: Number(document.getElementById("paramTstart").value),
        paramP: Number(document.getElementById("paramP").value),
      },
      cities: cities,
      modeA: modeA,
      airports: airports,
      airportAccess: airportAccess,
      airportRoutes: airportRoutes,
      selectOrig: document.getElementById("selectOrig") ? document.getElementById("selectOrig").value : "",
      selectDest: document.getElementById("selectDest") ? document.getElementById("selectDest").value : "",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("localStorage への保存に失敗しました:", e);
  }
}

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;

    const state = JSON.parse(saved);

    if (state.simName && document.getElementById("simNameInput")) {
      document.getElementById("simNameInput").value = state.simName;
    }

    if (state.params) {
      if (state.params.K !== undefined) document.getElementById("paramK").value = state.params.K;
      if (state.params.alpha !== undefined) document.getElementById("paramAlpha").value = state.params.alpha;
      if (state.params.gamma !== undefined) document.getElementById("paramGamma").value = state.params.gamma;
      if (state.params.lambda !== undefined) document.getElementById("paramLambda").value = state.params.lambda;
      if (state.params.Tmin !== undefined) document.getElementById("paramTmin").value = state.params.Tmin;
      if (state.params.shortThreshold !== undefined)
        document.getElementById("paramShortThreshold").value = state.params.shortThreshold;
      if (state.params.shortCoeff !== undefined)
        document.getElementById("paramShortCoeff").value = state.params.shortCoeff;
      if (state.params.Tstart !== undefined) document.getElementById("paramTstart").value = state.params.Tstart;
      if (state.params.paramP !== undefined) document.getElementById("paramP").value = state.params.paramP;
    }

    if (state.cities && Array.isArray(state.cities)) cities = state.cities;
    if (state.modeA && Array.isArray(state.modeA)) modeA = state.modeA;
    if (state.airports && Array.isArray(state.airports)) airports = state.airports;
    if (state.airportAccess) airportAccess = state.airportAccess;
    if (state.airportRoutes && Array.isArray(state.airportRoutes)) airportRoutes = state.airportRoutes;

    cleanupGhostData();

    return state;
  } catch (e) {
    console.warn("localStorage からの読み込みに失敗しました:", e);
    return false;
  }
}

function exportConfig() {
  const simName = document.getElementById("simNameInput").value.trim() || "無題シミュレーション";

  const configData = {
    version: "5.0",
    simName: simName,
    timestamp: new Date().toISOString(),
    params: {
      K: Number(document.getElementById("paramK").value),
      alpha: Number(document.getElementById("paramAlpha").value),
      gamma: Number(document.getElementById("paramGamma").value),
      lambda: Number(document.getElementById("paramLambda").value),
      Tmin: Number(document.getElementById("paramTmin").value),
      shortThreshold: Number(document.getElementById("paramShortThreshold").value),
      shortCoeff: Number(document.getElementById("paramShortCoeff").value),
      Tstart: Number(document.getElementById("paramTstart").value),
      paramP: Number(document.getElementById("paramP").value),
    },
    cities: cities,
    modeA: modeA,
    airports: airports,
    airportAccess: airportAccess,
    airportRoutes: airportRoutes,
  };

  let jsonStr = JSON.stringify(configData, null, 2);
  jsonStr = jsonStr.replace(/\{\n\s+("name"|"orig"|"from"|"cityName")[\s\S]*?\n\s+\}/g, (match) =>
    match.replace(/\n\s*/g, " "),
  );

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const safeSimName = simName.replace(/[\\/:*?"<>|]/g, "_");
  const fileName = `traffic_config_${safeSimName}_${dateStr}.json`;

  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importConfig(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const config = JSON.parse(e.target.result);

      if (config.simName && document.getElementById("simNameInput")) {
        document.getElementById("simNameInput").value = config.simName;
      }

      if (config.params) {
        if (config.params.K !== undefined) document.getElementById("paramK").value = config.params.K;
        if (config.params.alpha !== undefined) document.getElementById("paramAlpha").value = config.params.alpha;
        if (config.params.gamma !== undefined) document.getElementById("paramGamma").value = config.params.gamma;
        if (config.params.lambda !== undefined) document.getElementById("paramLambda").value = config.params.lambda;
        if (config.params.Tmin !== undefined) document.getElementById("paramTmin").value = config.params.Tmin;
        if (config.params.shortThreshold !== undefined)
          document.getElementById("paramShortThreshold").value = config.params.shortThreshold;
        if (config.params.shortCoeff !== undefined)
          document.getElementById("paramShortCoeff").value = config.params.shortCoeff;
        if (config.params.Tstart !== undefined) document.getElementById("paramTstart").value = config.params.Tstart;
        if (config.params.paramP !== undefined) document.getElementById("paramP").value = config.params.paramP;
      }

      if (config.cities && Array.isArray(config.cities)) cities = config.cities;
      if (config.modeA && Array.isArray(config.modeA)) modeA = config.modeA;
      if (config.airports && Array.isArray(config.airports)) airports = config.airports;
      if (config.airportAccess) airportAccess = config.airportAccess;
      if (config.airportRoutes && Array.isArray(config.airportRoutes)) airportRoutes = config.airportRoutes;

      cleanupGhostData();

      renderCitiesTable();
      renderModeA();
      renderModeB();

      calculate();
      renderDynamicNavTabs();
      onDataChange();

      alert(`設定「${config.simName || file.name}」を正常に読み込みました。`);
    } catch (err) {
      alert("設定ファイルの読み込みに失敗しました。正しいJSONファイルか確認してください。");
      console.error(err);
    }
    event.target.value = "";
  };
  reader.readAsText(file);
}

function resetDefaults() {
  localStorage.removeItem(STORAGE_KEY);

  document.getElementById("paramK").value = 0.04;
  document.getElementById("paramAlpha").value = 0.9;
  document.getElementById("paramGamma").value = 0.9;
  document.getElementById("paramLambda").value = 0.03;
  document.getElementById("paramTmin").value = 0;
  document.getElementById("paramShortThreshold").value = 60;
  document.getElementById("paramShortCoeff").value = 0.08;
  document.getElementById("paramTstart").value = 120;
  document.getElementById("paramP").value = 1.0;
  document.getElementById("simNameInput").value = "東海道・山陽新幹線";

  cities = JSON.parse(JSON.stringify(defaultCities));
  modeA = JSON.parse(JSON.stringify(defaultModeA));
  airports = JSON.parse(JSON.stringify(defaultAirports));
  airportAccess = JSON.parse(JSON.stringify(defaultAirportAccess));
  airportRoutes = JSON.parse(JSON.stringify(defaultAirportRoutes));

  const debugPanel = document.getElementById("debugPanel");
  if (debugPanel && !debugPanel.classList.contains("hidden")) {
    debugPanel.classList.add("hidden");
  }

  renderCitiesTable();
  renderModeA();
  renderModeB();

  calculate();
  renderDynamicNavTabs();
  onDataChange();
}

// ゴーストデータの一括清掃・整合性チェック関数
function cleanupGhostData() {
  const validCityNames = new Set(cities.map((c) => c.name));
  const validAirportNames = new Set(airports.map((a) => a.name));

  // 1. モードAの掃除（都市チェック）
  modeA.forEach((mA) => {
    if (mA.stations) {
      mA.stations = mA.stations.filter((s) => validCityNames.has(s.cityName));
    }
    if (mA.overrideTravel) {
      Object.keys(mA.overrideTravel).forEach((orig) => {
        if (!validCityNames.has(orig)) {
          delete mA.overrideTravel[orig];
        } else {
          Object.keys(mA.overrideTravel[orig]).forEach((dest) => {
            if (!validCityNames.has(dest)) delete mA.overrideTravel[orig][dest];
          });
        }
      });
    }
    if (mA.overrideFreq) {
      Object.keys(mA.overrideFreq).forEach((orig) => {
        if (!validCityNames.has(orig)) {
          delete mA.overrideFreq[orig];
        } else {
          Object.keys(mA.overrideFreq[orig]).forEach((dest) => {
            if (!validCityNames.has(dest)) delete mA.overrideFreq[orig][dest];
          });
        }
      });
    }
  });

  // 2. 空港アクセス時間の掃除（都市 ＆ 空港のチェック）
  if (typeof airportAccess !== "undefined" && airportAccess) {
    Object.keys(airportAccess).forEach((cityName) => {
      if (!validCityNames.has(cityName)) {
        delete airportAccess[cityName];
      } else {
        Object.keys(airportAccess[cityName]).forEach((apName) => {
          if (!validAirportNames.has(apName)) {
            delete airportAccess[cityName][apName];
          }
        });
      }
    });
  }

  // 3. 航空路線ペアの掃除（空港チェック）
  if (typeof airportRoutes !== "undefined" && Array.isArray(airportRoutes)) {
    airportRoutes = airportRoutes.filter(
      (r) => validAirportNames.has(r.origAirport) && validAirportNames.has(r.destAirport),
    );
  }
}
