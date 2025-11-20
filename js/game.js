// js/game.js
// データ（characters.js / scenarios.js）を使ってゲームを動かす本体

// ==============================
// ゲーム全体状態
// ==============================

const gameState = {
    phase: "intro", // intro → identify → seal → outro → end
    evidenceUnlocked: false,
    memoUnlocked: false,
    currentScenario: null,
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

// 位置情報とマップ用
let playerLatLng = null;
let leafletMap = null;
let leafletMarkerLayer = null;

// ==============================
// 共通：画面切り替え
// ==============================

function showScreen(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
    const el = document.getElementById(id);
    if (el) el.classList.remove("hidden");
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

    const targetImg = config.side === "left" ? imgLeft : imgRight;
    if (targetImg) {
        targetImg.src = sprite;
    }
}

// ==============================
// 選択肢表示
// ==============================

function showChoiceLine(line) {
    const choiceContainer = document.getElementById("choice-container");
    const nameBox = document.getElementById("speaker-name");
    const textBox = document.getElementById("dialog-text");
    const lines = dialogScript[gameState.phase] || [];

    if (!choiceContainer || !textBox) return;

    // テキスト・話者表示
    if (line.text) {
        textBox.textContent = line.text;
    }
    if (line.speaker && nameBox) {
        nameBox.textContent = line.speaker;
        setActiveSpeaker(line.speaker);
        applyExpressionForLine(line);
    }

    // 既存選択肢クリア
    choiceContainer.innerHTML = "";

    (line.choices || []).forEach((choice) => {
        const btn = document.createElement("button");
        btn.textContent = choice.text || "選択";

        btn.addEventListener("click", () => {
            // 選択後、選択肢を消して次の行へ
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

// ==============================
// 会話描画
// ==============================

function renderDialogLine() {
    const phase = gameState.phase;
    const lines = dialogScript[phase];
    if (!lines) return;

    const line = lines[currentLineIndex];
    if (!line) return;

    const choiceContainer = document.getElementById("choice-container");
    if (choiceContainer) {
        choiceContainer.classList.add("hidden");
    }

    // goto
    if (line.goto) {
        if (line.goto === "identify") {
            showScreen("screen-identify");
            return;
        }
        if (line.goto === "end") {
            startFadeOut();
            return;
        }
    }

    // system
    if (line.system === "unlockEvidence") {
        gameState.evidenceUnlocked = true;
        gameState.memoUnlocked = true;
    }

    // 選択肢行
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

    const s = gameState.currentScenario;
    let html = "";

    if (tab === "howto") {
        html = `
      <p>会話を進めながら、必要に応じてここで情報を確認してください。</p>
      <ul>
        <li>「証拠品」：現場で手に入れた物証や写真など。</li>
        <li>「怪異の特徴メモ」：証言から分かった怪異の特徴を整理したメモ。</li>
        <li>これらをもとに「怪異特定」パートで正しい組み合わせを選びます。</li>
      </ul>
      <p>怪異や状況によって、参照すべき手掛かりが変わります。<br>
      会話を進めて新しい情報を入手したら、こまめに開いて確認しましょう。</p>
    `;
    } else if (tab === "evidence") {
        if (!gameState.evidenceUnlocked) {
            html = "<p>まだ有効な証拠はありません。会話を進めて情報を集めてください。</p>";
        } else if (s && s.menu && s.menu.evidence) {
            html = s.menu.evidence;
        } else {
            html = "<p>このシナリオには証拠品情報が設定されていません。</p>";
        }
    } else if (tab === "memo") {
        if (!gameState.memoUnlocked) {
            html = "<p>まだ怪異の特徴は整理されていません。会話を進めて情報を集めてください。</p>";
        } else if (s && s.menu && s.menu.memo) {
            html = s.menu.memo;
        } else {
            html = "<p>このシナリオには特徴メモが設定されていません。</p>";
        }
    }

    if (!html) {
        html = "<p>情報が読み込めませんでした。</p>";
    }
    content.innerHTML = html;
}

// ==============================
// 特定パート UI（チップ式）
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

        // 選択肢を毎回シャッフル
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
                // 同じ項目の他の選択肢を解除
                document
                    .querySelectorAll(`.choice-chip[data-blank-index="${idx}"]`)
                    .forEach((el) => el.classList.remove("selected"));

                btn.classList.add("selected");

                // 行の正誤ハイライトを一旦クリア
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

// 特定成功演出
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
    }, 1100);
}

// 特定失敗演出
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
    }, 900);
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
            showScreen("screen-seal");
        });
    } else {
        if (feedback) {
            feedback.textContent = `不正解：${total}問中 ${correctCount}問正解（${identifyAttempts}回目のチャレンジ）`;
        }
        playIdentifyFailEffect(() => {
            // 失敗してもそのまま再チャレンジ
        });
    }
}

// ==============================
// 封印パート
// ==============================

let sealTimer = null;
let sealProgress = 0;
const HOLD_TIME = 1500;

function startSealHold() {
    if (sealTimer) return;

    const gauge = document.getElementById("seal-gauge");
    const effect = document.getElementById("seal-effect");

    sealProgress = 0;
    if (gauge) gauge.style.width = "0%";
    if (effect) effect.classList.remove("active");

    const startTime = performance.now();

    sealTimer = requestAnimationFrame(function step(now) {
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
    });
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
// 黒フェード → 最初に戻る
// ==============================

function resetGameToStart() {
    // 状態リセット
    gameState.evidenceUnlocked = false;
    gameState.memoUnlocked = false;
    gameState.phase = "intro";
    currentLineIndex = 0;
    identifyAttempts = 0;

    // 立ち絵初期化
    const left = document.getElementById("char-left");
    const right = document.getElementById("char-right");
    if (left) left.classList.add("inactive");
    if (right) right.classList.add("inactive");

    // メニュー閉じる
    const overlayMenu = document.getElementById("menu-overlay");
    if (overlayMenu) overlayMenu.classList.add("hidden");

    // マップUIを初期状態に戻す
    const status = document.getElementById("map-status");
    const startBtn = document.getElementById("start-investigation");
    const kaijiDot = document.getElementById("radar-kaiji");
    if (status) status.textContent = "周辺の怪異反応をスキャン中...";
    if (startBtn) startBtn.classList.add("hidden");
    if (kaijiDot) kaijiDot.classList.add("hidden");

    showScreen("screen-map");

    // 前回取得した位置情報を使って再スキャン（なければデフォルト）
    const center = playerLatLng || [35.6595, 139.7005];
    runMapScenario(center);
}

function startFadeOut() {
    const overlay = document.getElementById("overlay-black");
    if (!overlay) return;

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
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                playerLatLng = [lat, lng];
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
                playerLatLng = [35.6595, 139.7005]; // 渋谷付近
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

// シナリオ選択＋マップセットアップ
function runMapScenario(centerLatLng) {
    const status = document.getElementById("map-status");
    const startBtn = document.getElementById("start-investigation");
    const kaijiDot = document.getElementById("radar-kaiji");

    if (!Array.isArray(SCENARIOS) || SCENARIOS.length === 0) {
        console.error("SCENARIOS が定義されていません");
        return;
    }

    // ランダムにシナリオ選択
    const scenario =
        SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];

    gameState.currentScenario = scenario;
    gameState.evidenceUnlocked = false;
    gameState.memoUnlocked = false;

    dialogScript.intro = scenario.introLines || [];
    identifyBlanks = (scenario.identifyBlanks || []).slice();

    // 背景画像
    const bgImg = document.getElementById("bg-image");
    if (bgImg && scenario.background) {
        bgImg.src = scenario.background;
    }

    const center =
        centerLatLng ||
        (scenario.map && scenario.map.centerLatLng) ||
        [35.6595, 139.7005];

    // Leaflet マップ
    try {
        if (!leafletMap) {
            leafletMap = L.map("real-map", {
                zoomControl: false,
                attributionControl: false,
            }).setView(center, 16);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
            }).addTo(leafletMap);

            leafletMarkerLayer = L.layerGroup().addTo(leafletMap);

            setTimeout(() => {
                leafletMap.invalidateSize();
            }, 100);
        } else {
            leafletMap.setView(center, 16);
            setTimeout(() => {
                leafletMap.invalidateSize();
            }, 100);
        }

        if (leafletMarkerLayer) {
            leafletMarkerLayer.clearLayers();
            L.marker(center, { title: "現在地" }).addTo(leafletMarkerLayer);
        }
    } catch (e) {
        console.warn("Leaflet マップ初期化エラー:", e);
    }

    // レーダー内の赤点位置
    if (scenario.map && scenario.map.spawnOffset && kaijiDot) {
        kaijiDot.style.left = scenario.map.spawnOffset.xPercent + "%";
        kaijiDot.style.top = scenario.map.spawnOffset.yPercent + "%";
    }

    renderIdentifyBlanks();

    // スキャン演出
    if (status) {
        setTimeout(() => {
            status.textContent = "……微弱な怪異反応を検知。";
            if (kaijiDot) kaijiDot.classList.remove("hidden");
        }, 1500);

        setTimeout(() => {
            status.textContent = "怪異反応をロックオン。調査を開始できます。";
            if (startBtn) startBtn.classList.remove("hidden");
        }, 2500);
    }
}

// ==============================
// 初期化
// ==============================

document.addEventListener("DOMContentLoaded", () => {
    showScreen("screen-map");
    initMapScreen();

    // 調査開始 → 会話
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

    // 会話画面クリックで進行（メニュー・選択肢以外）
    const dialogScreen = document.getElementById("screen-dialog");
    if (dialogScreen) {
        dialogScreen.addEventListener("click", (e) => {
            if (e.target.closest("#menu-btn") || e.target.closest(".menu-overlay")) return;

            const choiceContainer = document.getElementById("choice-container");
            if (choiceContainer && !choiceContainer.classList.contains("hidden")) return;

            renderDialogLine();
        });
    }

    // 調査メニュー（会話画面）
    const menuBtn = document.getElementById("menu-btn");
    if (menuBtn) {
        menuBtn.addEventListener("click", () => {
            const overlay = document.getElementById("menu-overlay");
            if (!overlay) return;
            overlay.classList.remove("hidden");

            document
                .querySelectorAll(".tab-btn")
                .forEach((btn) => btn.classList.remove("active"));
            const firstTab = document.querySelector('.tab-btn[data-tab="howto"]');
            if (firstTab) firstTab.classList.add("active");
            renderMenu("howto");
        });
    }

    // 調査メニュー（特定画面）
    const menuBtnIdentify = document.getElementById("menu-btn-identify");
    if (menuBtnIdentify) {
        menuBtnIdentify.addEventListener("click", () => {
            const overlay = document.getElementById("menu-overlay");
            if (!overlay) return;
            overlay.classList.remove("hidden");

            document
                .querySelectorAll(".tab-btn")
                .forEach((btn) => btn.classList.remove("active"));
            const firstTab = document.querySelector('.tab-btn[data-tab="howto"]');
            if (firstTab) firstTab.classList.add("active");
            renderMenu("howto");
        });
    }

    // メニュータブ切り替え
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

    // メニュー閉じる
    const menuClose = document.getElementById("menu-close");
    if (menuClose) {
        menuClose.addEventListener("click", () => {
            const overlay = document.getElementById("menu-overlay");
            if (!overlay) return;
            overlay.classList.add("hidden");
        });
    }

    // 特定ボタン
    const confirmIdentityBtn = document.getElementById("confirm-identity");
    if (confirmIdentityBtn) {
        confirmIdentityBtn.addEventListener("click", checkIdentity);
    }

    // 封印 長押し
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
