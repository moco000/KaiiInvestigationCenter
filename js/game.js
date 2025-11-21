// ==============================
// 画面切り替えユーティリティ
// ==============================
function showScreen(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
    const el = document.getElementById(id);
    if (el) el.classList.remove("hidden");
}

// ==============================
// 定数・デバッグフラグ
// ==============================

const SAVE_KEY = "kaiji_center_save_v1";

// テスト用：true にすると timeWindow / locationType を無視して
// 「一度見た once シーン以外は全部候補」にする
const DEBUG_IGNORE_SCENE_CONDITION = true;

// 読み込むシナリオJSONのID一覧（data/xxx.json）
const SCENARIO_IDS = [
    "main_01_prologue",
    "main_02_city",
    "main_03_seaside",
    "main_04_ending_chief",
];

// シナリオキャッシュ
const scenarioCache = {};

// ==============================
// セーブデータ管理
// ==============================

function loadSaveData() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) {
            return {
                completedScenarios: [],
                seenScenes: {}, // {scenarioId: [sceneId, ...]}
                flags: {}, // 好感度やルートフラグなど
            };
        }
        const data = JSON.parse(raw);
        if (!data.completedScenarios) data.completedScenarios = [];
        if (!data.seenScenes) data.seenScenes = {};
        if (!data.flags) data.flags = {};
        return data;
    } catch (e) {
        console.warn("save load error:", e);
        return {
            completedScenarios: [],
            seenScenes: {},
            flags: {},
        };
    }
}

function saveGame(data) {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn("save error:", e);
    }
}

// ==============================
// ゲーム状態
// ==============================

const gameState = {
    evidenceUnlocked: false,
    memoUnlocked: false,
    phase: "intro", // intro → identify → seal → outro → end
    currentScenario: null,
    currentScene: null,
};

const dialogScript = {
    intro: [],
    outro: [
        {
            speaker: "助手",
            expression: "smile",
            text: "封印、完了です。周辺の反応も沈静化しました。",
        },
        {
            speaker: "調査員",
            expression: "neutral",
            text: "よし、一件落着だな。……だが、ここだけじゃない。",
        },
        {
            speaker: "調査員",
            expression: "serious",
            text: "この街には、まだまだ“何か”が潜んでいる。",
        },
        { goto: "end" },
    ],
};

let identifyBlanks = [];
let identifyAttempts = 0;
let currentLineIndex = 0;

// 位置情報／マップ
let playerLatLng = null;
let leafletMap = null;
let leafletMarkerLayer = null;

// ==============================
// シナリオ読み込み・選択
// ==============================

async function loadScenarioJSON(id) {
    if (scenarioCache[id]) return scenarioCache[id];
    const path = `data/${id}.json`;
    const res = await fetch(path);
    if (!res.ok) {
        throw new Error(`シナリオ読み込み失敗: ${id}`);
    }
    const json = await res.json();
    scenarioCache[id] = json;
    return json;
}

async function loadAllScenarios() {
    const list = [];
    for (const id of SCENARIO_IDS) {
        try {
            const s = await loadScenarioJSON(id);
            list.push(s);
        } catch (e) {
            console.warn("シナリオ読み込み失敗:", id, e);
        }
    }
    return list;
}

// 位置情報からざっくりロケーションタイプ推定（本番ではちゃんと判定に置き換えてOK）
function getLocationTypeFromLatLng(lat, lng) {
    const types = ["RESIDENTIAL", "STATION", "SEASIDE"];
    const idx = Math.abs(Math.floor((lat + lng) * 1000)) % types.length;
    return types[idx];
}

// フラグ条件（好感度 etc）を満たしているか
function sceneFlagConditionsOk(scene, save) {
    const flags = save.flags || {};
    const cond = scene.conditions;
    if (!cond) return true;

    if (cond.minFlags) {
        for (const key in cond.minFlags) {
            const need = Number(cond.minFlags[key]);
            const current = Number(flags[key] || 0);
            if (current < need) return false;
        }
    }

    if (cond.maxFlags) {
        for (const key in cond.maxFlags) {
            const limit = Number(cond.maxFlags[key]);
            const current = Number(flags[key] || 0);
            if (current > limit) return false;
        }
    }

    if (cond.equalsFlags) {
        for (const key in cond.equalsFlags) {
            const need = cond.equalsFlags[key];
            if (flags[key] !== need) return false;
        }
    }

    return true;
}

// シーンの出現条件チェック
function isSceneAvailableNow(scene, locType, seenList) {
    const once = scene.once !== false; // デフォルト true
    const save = loadSaveData();

    // フラグ条件
    if (!sceneFlagConditionsOk(scene, save)) return false;

    // テストモード：時間／場所条件を無視して once だけ見る
    if (DEBUG_IGNORE_SCENE_CONDITION) {
        if (once && seenList.includes(scene.id)) return false;
        return true;
    }

    // once:true & 既に見たら除外
    if (once && seenList.includes(scene.id)) return false;

    // 位置条件
    if (scene.locationType && locType && scene.locationType !== locType) {
        return false;
    }

    // 時間条件
    if (scene.timeWindow) {
        const now = new Date();
        const hour = now.getHours();
        const start = scene.timeWindow.startHour;
        const end = scene.timeWindow.endHour;
        if (typeof start === "number" && typeof end === "number") {
            if (start < end) {
                if (!(hour >= start && hour < end)) return false;
            } else {
                // 日付またぎ
                if (!(hour >= start || hour < end)) return false;
            }
        }
    }

    return true;
}

// シーン終了時に「見た」＆シナリオ完了チェック
function markSceneSeenAndMaybeComplete() {
    const scenario = gameState.currentScenario;
    const scene = gameState.currentScene;
    if (!scenario || !scene) return;

    const save = loadSaveData();
    if (!save.seenScenes[scenario.id]) {
        save.seenScenes[scenario.id] = [];
    }
    const seenList = save.seenScenes[scenario.id];
    if (!seenList.includes(scene.id)) {
        seenList.push(scene.id);
    }

    // once:true なシーンがすべて見終わったらシナリオ完了扱い
    const scenes = scenario.scenes || [];
    const onceScenes = scenes.filter((s) => s.once !== false);
    const allOnceSeen =
        onceScenes.length > 0 &&
        onceScenes.every((s) => seenList.includes(s.id));

    if (allOnceSeen && !save.completedScenarios.includes(scenario.id)) {
        save.completedScenarios.push(scenario.id);
    }

    saveGame(save);
}

// 現在のセーブ状態から「今遊べるシーン」を選ぶ
async function pickSceneForCurrentState(latLng) {
    const save = loadSaveData();
    const all = await loadAllScenarios();
    if (all.length === 0) return null;

    const completed = save.completedScenarios || [];

    // 前提条件を満たしているシナリオを chapter 順に並べる
    const unlocked = all
        .filter((sc) => {
            const pre = sc.prerequisites || [];
            if (sc.isPrologue) {
                // プロローグは未クリアのときだけ候補
                return !completed.includes(sc.id);
            }
            return pre.every((pid) => completed.includes(pid));
        })
        .sort((a, b) => {
            const ca = typeof a.chapter === "number" ? a.chapter : 999;
            const cb = typeof b.chapter === "number" ? b.chapter : 999;
            return ca - cb;
        });

    if (unlocked.length === 0) return null;

    // ▼「まだ完全クリアしていないシナリオ」の最小chapterを探す
    let targetChapter = null;
    for (const sc of unlocked) {
        const scenes = sc.scenes || [];
        const seenList = save.seenScenes[sc.id] || [];
        const onceScenes = scenes.filter((s) => s.once !== false);
        const allOnceSeen =
            onceScenes.length > 0 &&
            onceScenes.every((s) => seenList.includes(s.id));
        if (!allOnceSeen) {
            targetChapter = sc.chapter || 0;
            break;
        }
    }

    // 全部クリア済みなら「一番最後のシナリオをリプレイ」扱い
    let candidateScenarios;
    if (targetChapter === null) {
        const last = unlocked.at(-1);
        candidateScenarios = last ? [last] : [];
    } else {
        // ★今やるべき章だけを候補にする → 2話に戻らない
        candidateScenarios = unlocked.filter(
            (sc) => (sc.chapter || 0) === targetChapter
        );
    }

    if (candidateScenarios.length === 0) return null;

    const locType = latLng
        ? getLocationTypeFromLatLng(latLng[0], latLng[1])
        : null;

    // 候補章の中から、今出せるシーンを探す
    for (const scenario of candidateScenarios) {
        const scenes = scenario.scenes || [];
        const seenList = save.seenScenes[scenario.id] || [];
        const candidates = scenes.filter((scene) =>
            isSceneAvailableNow(scene, locType, seenList)
        );

        if (candidates.length > 0) {
            const scene =
                candidates[Math.floor(Math.random() * candidates.length)];
            return { scenario, scene };
        } else {
            // once:true シーンを全部見ていたらクリア扱いにしておく
            const onceScenes = scenes.filter((s) => s.once !== false);
            const allOnceSeen =
                onceScenes.length > 0 &&
                onceScenes.every((s) => seenList.includes(s.id));
            if (allOnceSeen && !completed.includes(scenario.id)) {
                completed.push(scenario.id);
                save.completedScenarios = completed;
                saveGame(save);
            }
        }
    }

    // それでも出せるシーンがない場合、とりあえず対象章の最初のシーン
    const sc = candidateScenarios[0];
    const scScenes = sc.scenes || [];
    if (sc && scScenes.length > 0) {
        return { scenario: sc, scene: scScenes[0] };
    }
    return null;
}

// ==============================
// 立ち絵制御
// ==============================

function setActiveSpeaker(speakerName) {
    const left = document.getElementById("char-left");
    const right = document.getElementById("char-right");
    if (!left || !right) return;

    if (speakerName === "調査員") {
        left.classList.remove("inactive");
        right.classList.add("inactive");
    } else if (speakerName && speakerName.length) {
        left.classList.add("inactive");
        right.classList.remove("inactive");
    } else {
        left.classList.add("inactive");
        right.classList.add("inactive");
    }
}

function applyExpressionForLine(line) {
    if (!line.speaker) return;
    if (typeof SPEAKER_ALIAS === "undefined") return;
    if (typeof CHARACTERS === "undefined") return;

    const charKey = SPEAKER_ALIAS[line.speaker];
    if (!charKey) return;
    const config = CHARACTERS[charKey];
    if (!config) return;

    const imgLeft = document.getElementById("char-left");
    const imgRight = document.getElementById("char-right");

    const expKey = line.expression || config.defaultExpression || "neutral";
    const sprite =
        (config.sprites && config.sprites[expKey]) ||
        (config.sprites && config.sprites[config.defaultExpression]) ||
        null;

    if (!sprite) return;
    const target = config.side === "left" ? imgLeft : imgRight;
    if (target) target.src = sprite;
}

// ==============================
// 選択肢の効果（好感度など）
// ==============================

function applyChoiceEffects(choice) {
    if (!choice.effects || !Array.isArray(choice.effects)) return;

    const save = loadSaveData();
    save.flags = save.flags || {};

    choice.effects.forEach((eff) => {
        if (!eff || !eff.type) return;

        if (eff.type === "addFlag") {
            const key = eff.key;
            const delta = Number(eff.delta) || 0;
            const current = Number(save.flags[key] || 0);
            save.flags[key] = current + delta;
        } else if (eff.type === "setFlag") {
            const key = eff.key;
            save.flags[key] = eff.value;
        }
    });

    saveGame(save);
}

// ==============================
// 会話まわり
// ==============================

function showChoiceLine(line) {
    const choiceContainer = document.getElementById("choice-container");
    const nameBox = document.getElementById("speaker-name");
    const textBox = document.getElementById("dialog-text");
    const lines = dialogScript[gameState.phase] || [];
    if (!choiceContainer || !textBox) return;

    if (line.text) textBox.textContent = line.text;
    if (line.speaker && nameBox) {
        nameBox.textContent = line.speaker;
        setActiveSpeaker(line.speaker);
        applyExpressionForLine(line);
    }

    choiceContainer.innerHTML = "";
    (line.choices || []).forEach((choice) => {
        const btn = document.createElement("button");
        btn.textContent = choice.text || "選択";

        btn.addEventListener("click", () => {
            // ★ 選択肢の効果を適用（好感度・ルートなど）
            applyChoiceEffects(choice);

            choiceContainer.classList.add("hidden");
            choiceContainer.innerHTML = "";

            if (choice.gotoLabel) {
                const idx = lines.findIndex((l) => l.label === choice.gotoLabel);
                if (idx >= 0) {
                    currentLineIndex = idx;
                } else {
                    currentLineIndex++;
                }
            } else if (typeof choice.gotoIndex === "number") {
                currentLineIndex = choice.gotoIndex;
            } else {
                currentLineIndex++;
            }

            renderDialogLine();
        });

        choiceContainer.appendChild(btn);
    });

    choiceContainer.classList.remove("hidden");
}

function renderDialogLine() {
    const phase = gameState.phase;
    const lines = dialogScript[phase];
    if (!lines) return;

    const line = lines[currentLineIndex];
    if (!line) return;

    const choiceContainer = document.getElementById("choice-container");
    if (choiceContainer) choiceContainer.classList.add("hidden");

    // goto
    if (line.goto) {
        if (line.goto === "identify") {
            if (identifyBlanks.length > 0) {
                showScreen("screen-identify");
            } else {
                // 特定項目がない場合はそのまま封印へ
                gameState.phase = "seal";
                showScreen("screen-seal");
            }
            return;
        }
        if (line.goto === "end") {
            // シーン終了マーク
            markSceneSeenAndMaybeComplete();
            startFadeOut();
            return;
        }
    }

    // system
    if (line.system === "unlockEvidence") {
        gameState.evidenceUnlocked = true;
        gameState.memoUnlocked = true;
    }

    // choices
    if (line.choices && Array.isArray(line.choices)) {
        showChoiceLine(line);
        return;
    }

    const nameBox = document.getElementById("speaker-name");
    const textBox = document.getElementById("dialog-text");
    if (nameBox) nameBox.textContent = line.speaker || "";
    if (textBox) textBox.textContent = line.text || "";

    setActiveSpeaker(line.speaker || "");
    applyExpressionForLine(line);

    currentLineIndex++;
}

// ==============================
// 調査メニュー
// ==============================

function renderMenu(tab) {
    const content = document.getElementById("menu-content");
    if (!content) return;
    const s = gameState.currentScene;
    let html = "";

    if (tab === "howto") {
        html = `
      <p>会話を進めながら、必要に応じてここで情報を確認してください。</p>
      <ul>
        <li>「証拠品」：現場で手に入れた物証や写真など。</li>
        <li>「怪異の特徴メモ」：証言から分かった特徴を整理したメモ。</li>
        <li>これらをもとに「怪異特定」パートで正しい組み合わせを選びます。</li>
      </ul>
    `;
    } else if (tab === "evidence") {
        if (!gameState.evidenceUnlocked) {
            html = "<p>まだ有効な証拠はありません。会話を進めて情報を集めてください。</p>";
        } else if (s && s.menu && s.menu.evidence) {
            html = s.menu.evidence;
        } else {
            html = "<p>このシーンには証拠品情報が設定されていません。</p>";
        }
    } else if (tab === "memo") {
        if (!gameState.memoUnlocked) {
            html =
                "<p>まだ怪異の特徴は整理されていません。会話を進めて情報を集めてください。</p>";
        } else if (s && s.menu && s.menu.memo) {
            html = s.menu.memo;
        } else {
            html = "<p>このシーンには特徴メモが設定されていません。</p>";
        }
    }

    if (!html) html = "<p>情報がありません。</p>";
    content.innerHTML = html;
}

// ==============================
// 特定パート（チップ式）
// ==============================

function renderIdentifyBlanks() {
    const container = document.getElementById("fill-blanks");
    if (!container) return;

    container.innerHTML = "";

    identifyBlanks.forEach((blank, idx) => {
        const row = document.createElement("div");
        row.className = "fill-row";
        row.dataset.blankIndex = String(idx);

        const label = document.createElement("div");
        label.className = "fill-label";
        label.textContent = blank.label + "：";

        const choicesWrap = document.createElement("div");
        choicesWrap.className = "fill-choices";

        const indices = blank.choices.map((_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        indices.forEach((choiceIdx) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "choice-chip";
            btn.textContent = blank.choices[choiceIdx];
            btn.dataset.blankIndex = String(idx);
            btn.dataset.choiceIndex = String(choiceIdx);

            btn.addEventListener("click", () => {
                document
                    .querySelectorAll(`.choice-chip[data-blank-index="${idx}"]`)
                    .forEach((el) => el.classList.remove("selected"));
                btn.classList.add("selected");
                row.classList.remove("correct", "wrong");
            });

            choicesWrap.appendChild(btn);
        });

        row.appendChild(label);
        row.appendChild(choicesWrap);
        container.appendChild(row);
    });

    const feedback = document.getElementById("identify-feedback");
    if (feedback) {
        feedback.textContent =
            "すべての項目について、当てはまりそうなワードを選んでください。";
    }

    identifyAttempts = 0;
}

function playIdentifyEffect(onFinished) {
    const overlay = document.getElementById("identify-overlay");
    if (!overlay) {
        if (typeof onFinished === "function") onFinished();
        return;
    }
    overlay.classList.remove("hidden");
    requestAnimationFrame(() => {
        overlay.classList.add("show");
    });
    setTimeout(() => {
        overlay.classList.remove("show");
        setTimeout(() => {
            overlay.classList.add("hidden");
            if (typeof onFinished === "function") onFinished();
        }, 300);
    }, 1000);
}

function playIdentifyFailEffect(onFinished) {
    const overlay = document.getElementById("identify-fail-overlay");
    if (!overlay) {
        if (typeof onFinished === "function") onFinished();
        return;
    }
    overlay.classList.remove("hidden");
    requestAnimationFrame(() => {
        overlay.classList.add("show");
    });
    setTimeout(() => {
        overlay.classList.remove("show");
        setTimeout(() => {
            overlay.classList.add("hidden");
            if (typeof onFinished === "function") onFinished();
        }, 300);
    }, 800);
}

function checkIdentity() {
    const total = identifyBlanks.length;
    let correctCount = 0;
    let allChosen = true;

    identifyBlanks.forEach((blank, idx) => {
        const row = document.querySelector(
            `.fill-row[data-blank-index="${idx}"]`
        );
        const selected = document.querySelector(
            `.choice-chip[data-blank-index="${idx}"].selected`
        );

        if (!selected) {
            allChosen = false;
            if (row) row.classList.remove("correct", "wrong");
            return;
        }

        const choiceIdx = Number(selected.dataset.choiceIndex);
        const isCorrect = choiceIdx === blank.correctIndex;

        if (row) {
            row.classList.remove("correct", "wrong");
            row.classList.add(isCorrect ? "correct" : "wrong");
        }

        if (isCorrect) correctCount++;
    });

    const feedback = document.getElementById("identify-feedback");
    if (!allChosen) {
        if (feedback) {
            feedback.textContent = "まだ選んでいない項目があります。すべて選んでください。";
        }
        return;
    }

    identifyAttempts++;

    if (correctCount === total) {
        if (feedback) {
            feedback.textContent = `全問正解！（${identifyAttempts}回目の特定）`;
        }
        playIdentifyEffect(() => {
            gameState.phase = "seal";
            showScreen("screen-seal");
        });
    } else {
        if (feedback) {
            feedback.textContent = `不正解：${total}問中 ${correctCount}問正解（${identifyAttempts}回目のチャレンジ）`;
        }
        playIdentifyFailEffect(() => { });
    }
}

// ==============================
// 封印パート
// ==============================

let sealTimer = null;
let sealProgress = 0;
const HOLD_TIME = 1500; // ms

function startSealHold() {
    if (sealTimer) return;

    const gauge = document.getElementById("seal-gauge");
    const effect = document.getElementById("seal-effect");

    sealProgress = 0;
    if (gauge) gauge.style.width = "0%";
    if (effect) effect.classList.remove("active");

    const startTime = performance.now();

    function step(now) {
        const elapsed = now - startTime;
        sealProgress = Math.min(1, elapsed / HOLD_TIME);
        if (gauge) gauge.style.width = (sealProgress * 100).toFixed(0) + "%";

        if (sealProgress >= 1) {
            sealTimer = null;
            if (effect) effect.classList.add("active");
            setTimeout(() => {
                gameState.phase = "outro";
                currentLineIndex = 0;
                showScreen("screen-dialog");
                renderDialogLine();
            }, 800);
        } else {
            sealTimer = requestAnimationFrame(step);
        }
    }

    sealTimer = requestAnimationFrame(step);
}

function cancelSealHold() {
    if (sealTimer) {
        cancelAnimationFrame(sealTimer);
        sealTimer = null;
    }
    sealProgress = 0;
    const gauge = document.getElementById("seal-gauge");
    if (gauge) gauge.style.width = "0%";
}

// ==============================
// 黒フェード → マップに戻る
// ==============================

function resetGameToStart() {
    // ▼ 封印UIのリセット（追加）
    const gauge = document.getElementById("seal-gauge");
    if (gauge) gauge.style.width = "0%";
    const effect = document.getElementById("seal-effect");
    if (effect) effect.classList.remove("active");

    gameState.evidenceUnlocked = false;
    gameState.memoUnlocked = false;
    gameState.phase = "intro";
    currentLineIndex = 0;
    identifyAttempts = 0;

    const left = document.getElementById("char-left");
    const right = document.getElementById("char-right");
    if (left) left.classList.add("inactive");
    if (right) right.classList.add("inactive");

    const overlayMenu = document.getElementById("menu-overlay");
    if (overlayMenu) overlayMenu.classList.add("hidden");

    const status = document.getElementById("map-status");
    const startBtn = document.getElementById("start-investigation");
    const kaijiDot = document.getElementById("radar-kaiji");
    if (status) status.textContent = "周辺の怪異反応をスキャン中...";
    if (startBtn) startBtn.classList.add("hidden");
    if (kaijiDot) kaijiDot.classList.add("hidden");

    showScreen("screen-map");

    const center = playerLatLng || [35.6595, 139.7005];
    runMapScenario(center);
}

function startFadeOut() {
    const overlay = document.getElementById("overlay-black");
    if (!overlay) {
        resetGameToStart();
        return;
    }
    overlay.classList.remove("hidden");
    requestAnimationFrame(() => {
        overlay.classList.add("show");
        setTimeout(() => {
            overlay.classList.remove("show");
            overlay.classList.add("hidden");
            resetGameToStart();
        }, 1200);
    });
}

// ==============================
// マップ画面（位置情報＋レーダー）
// ==============================

function initMapScreen() {
    const status = document.getElementById("map-status");
    const startBtn = document.getElementById("start-investigation");
    const kaijiDot = document.getElementById("radar-kaiji");

    if (status) status.textContent = "周辺の怪異反応をスキャン中...";
    if (startBtn) startBtn.classList.add("hidden");
    if (kaijiDot) kaijiDot.classList.add("hidden");

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                playerLatLng = [pos.coords.latitude, pos.coords.longitude];
                if (status) status.textContent = "現在地の取得に成功しました。";
                runMapScenario(playerLatLng);
            },
            (err) => {
                console.warn("[geo] error:", err);
                if (status) {
                    if (err.code === 1) {
                        status.textContent =
                            "位置情報の利用がブラウザに拒否されました。テスト用座標でスキャンします。";
                    } else if (err.code === 2) {
                        status.textContent =
                            "位置情報を取得できませんでした。テスト用座標でスキャンします。";
                    } else if (err.code === 3) {
                        status.textContent =
                            "位置情報取得がタイムアウトしました。テスト用座標でスキャンします。";
                    } else {
                        status.textContent =
                            "位置情報取得時に不明なエラーが発生しました。テスト用座標でスキャンします。";
                    }
                }
                playerLatLng = [35.6595, 139.7005];
                runMapScenario(playerLatLng);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    } else {
        console.warn("[geo] geolocation not supported");
        if (status) {
            status.textContent =
                "この端末では位置情報が使用できません。テスト用座標でスキャンします。";
        }
        playerLatLng = [35.6595, 139.7005];
        runMapScenario(playerLatLng);
    }
}

async function runMapScenario(centerLatLng) {
    const status = document.getElementById("map-status");
    const startBtn = document.getElementById("start-investigation");
    const kaijiDot = document.getElementById("radar-kaiji");

    if (!centerLatLng) {
        centerLatLng = playerLatLng || [35.6595, 139.7005];
    }

    // シーン選択
    const picked = await pickSceneForCurrentState(centerLatLng);
    if (!picked) {
        if (status) status.textContent = "利用可能なシナリオがありません。";
        return;
    }
    const scenario = picked.scenario;
    const scene = picked.scene;

    gameState.currentScenario = scenario;
    gameState.currentScene = scene;
    gameState.evidenceUnlocked = false;
    gameState.memoUnlocked = false;

    dialogScript.intro = scene.lines || [];
    identifyBlanks = scene.type === "kaiji" ? scene.identifyBlanks || [] : [];
    renderIdentifyBlanks();

    const bgImg = document.getElementById("bg-image");
    if (bgImg) {
        const bg = scene.background || scenario.background;
        if (bg) bgImg.src = bg;
    }

    // Leaflet マップ
    try {
        if (!leafletMap) {
            leafletMap = L.map("real-map", {
                zoomControl: false,
                attributionControl: false,
            }).setView(centerLatLng, 16);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
            }).addTo(leafletMap);
            leafletMarkerLayer = L.layerGroup().addTo(leafletMap);
            setTimeout(() => leafletMap.invalidateSize(), 100);
        } else {
            leafletMap.setView(centerLatLng, 16);
            setTimeout(() => leafletMap.invalidateSize(), 100);
        }

        if (leafletMarkerLayer) {
            leafletMarkerLayer.clearLayers();
            L.marker(centerLatLng, { title: "現在地" }).addTo(leafletMarkerLayer);
        }
    } catch (e) {
        console.warn("Leaflet error:", e);
    }

    // レーダーの赤点はランダム配置
    if (kaijiDot) {
        const x = 20 + Math.random() * 60;
        const y = 20 + Math.random() * 60;
        kaijiDot.style.left = x + "%";
        kaijiDot.style.top = y + "%";
        kaijiDot.classList.add("hidden");
    }

    if (status) status.textContent = "周辺の怪異反応をスキャン中...";

    setTimeout(() => {
        if (status) status.textContent = "……微弱な反応を検知。";
        if (kaijiDot) kaijiDot.classList.remove("hidden");
    }, 1500);

    setTimeout(() => {
        if (status) status.textContent = "反応をロックオン。調査を開始できます。";
        if (startBtn) startBtn.classList.remove("hidden");
    }, 2500);
}

// ==============================
// 初期化
// ==============================

document.addEventListener("DOMContentLoaded", () => {
    showScreen("screen-map");
    initMapScreen();

    const startBtn = document.getElementById("start-investigation");
    if (startBtn) {
        startBtn.addEventListener("click", () => {
            gameState.phase = "intro";
            currentLineIndex = 0;

            const left = document.getElementById("char-left");
            const right = document.getElementById("char-right");
            if (left) left.classList.remove("inactive");
            if (right) right.classList.add("inactive");

            showScreen("screen-dialog");
            renderDialogLine();
        });
    }

    const dialogScreen = document.getElementById("screen-dialog");
    if (dialogScreen) {
        dialogScreen.addEventListener("click", (e) => {
            if (e.target.closest("#menu-btn") || e.target.closest(".menu-overlay"))
                return;
            const choiceContainer = document.getElementById("choice-container");
            if (
                choiceContainer &&
                !choiceContainer.classList.contains("hidden")
            )
                return;
            renderDialogLine();
        });
    }

    const menuBtn = document.getElementById("menu-btn");
    if (menuBtn) {
        menuBtn.addEventListener("click", () => {
            const overlay = document.getElementById("menu-overlay");
            if (!overlay) return;
            overlay.classList.remove("hidden");
            document
                .querySelectorAll(".tab-btn")
                .forEach((b) => b.classList.remove("active"));
            const first = document.querySelector('.tab-btn[data-tab="howto"]');
            if (first) first.classList.add("active");
            renderMenu("howto");
        });
    }

    const menuBtnIdentify = document.getElementById("menu-btn-identify");
    if (menuBtnIdentify) {
        menuBtnIdentify.addEventListener("click", () => {
            const overlay = document.getElementById("menu-overlay");
            if (!overlay) return;
            overlay.classList.remove("hidden");
            document
                .querySelectorAll(".tab-btn")
                .forEach((b) => b.classList.remove("active"));
            const first = document.querySelector('.tab-btn[data-tab="howto"]');
            if (first) first.classList.add("active");
            renderMenu("howto");
        });
    }

    document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document
                .querySelectorAll(".tab-btn")
                .forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            const tab = btn.dataset.tab;
            renderMenu(tab);
        });
    });

    const menuClose = document.getElementById("menu-close");
    if (menuClose) {
        menuClose.addEventListener("click", () => {
            const overlay = document.getElementById("menu-overlay");
            if (!overlay) return;
            overlay.classList.add("hidden");
        });
    }

    const confirmIdentityBtn = document.getElementById("confirm-identity");
    if (confirmIdentityBtn) {
        confirmIdentityBtn.addEventListener("click", checkIdentity);
    }

    const sealBtn = document.getElementById("seal-btn");
    if (sealBtn) {
        const startEvents = ["mousedown", "touchstart"];
        const endEvents = ["mouseup", "mouseleave", "touchend", "touchcancel"];
        startEvents.forEach((ev) =>
            sealBtn.addEventListener(ev, (e) => {
                e.preventDefault();
                startSealHold();
            })
        );
        endEvents.forEach((ev) =>
            sealBtn.addEventListener(ev, (e) => {
                e.preventDefault();
                cancelSealHold();
            })
        );
    }
});
