// ==============================
// ゲーム全体状態
// ==============================

const gameState = {
    phase: "intro", // intro → identify → seal → outro → end
    evidenceUnlocked: false,
    memoUnlocked: false,
    currentScenario: null, // 今回選ばれた怪異シナリオ
};

// ==============================
// キャラクター定義（表情差分）
// ==============================

const characters = {
    player: {
        side: "left",
        defaultExpression: "neutral",
        sprites: {
            neutral: "assets/char/player_neutral.png",
            serious: "assets/char/player_serious.png",
            surprised: "assets/char/player_surprised.png",
        },
    },
    assistant: {
        side: "right",
        defaultExpression: "neutral",
        sprites: {
            neutral: "assets/char/partner_neutral.png",
            smile: "assets/char/partner_smile.png",
            worried: "assets/char/partner_worried.png",
        },
    },
};

// セリフ中の speaker 名 → キャラID
const speakerMap = {
    調査員: "player",
    助手: "assistant",
};

// ==============================
// 3種類の怪異プリセット
// ==============================

const yokaiScenarios = [
    // 1. 海沿い
    {
        id: "seaside_woman",
        name: "防波堤の女",
        areaTags: ["sea"],
        centerLatLng: [35.6295, 139.7705], // 例：お台場付近
        mapSpawnLatLng: [35.6303, 139.7718],
        spawnOffset: { xPercent: 70, yPercent: 25 }, // レーダー内の位置
        bg: "assets/bg/bg_seaside_night.jpg",
        dialogIntro: [
            {
                speaker: "調査員",
                expression: "serious",
                text: "潮の匂いが強いな……ここは海沿いの防波堤か。",
            },
            {
                speaker: "助手",
                expression: "worried",
                text: "夜になると、ここで“誰かが海を覗き込んでいる”って通報が相次いでいるそうです。",
            },
            {
                speaker: "調査員",
                expression: "neutral",
                text: "まずは状況を整理しよう。右上の「調査メニュー」から情報を確認できる。",
            },
            {
                system: "unlockEvidence",
                text: "【新規情報】濡れた足跡の写真／釣り人の証言メモを入手した。",
            },
            {
                speaker: "助手",
                expression: "worried",
                text: "『ずぶ濡れの女が、海の底をじっと見ていた』……そんな証言もあります。",
            },
            {
                speaker: "調査員",
                expression: "serious",
                text: "怪異の正体を特定するか。",
            },
            {
                goto: "identify",
            },
        ],
        identifyBlanks: [
            {
                label: "怪異の姿",
                choices: ["ずぶ濡れの女", "黒い犬", "顔のない子供"],
                correctIndex: 0,
            },
            {
                label: "出没場所",
                choices: ["廃トンネル", "海沿いの防波堤", "公園のトイレ"],
                correctIndex: 1,
            },
            {
                label: "行動傾向",
                choices: ["海の底を覗き込む", "笑い声を響かせる", "電話ボックスに現れる"],
                correctIndex: 0,
            },
        ],
    },

    // 2. 住宅街
    {
        id: "residential_noise",
        name: "路地裏の足音",
        areaTags: ["residential"],
        centerLatLng: [35.646, 139.68], // 例：住宅街
        mapSpawnLatLng: [35.6466, 139.6815],
        spawnOffset: { xPercent: 30, yPercent: 40 },
        bg: "assets/bg/bg_residential_night.jpg",
        dialogIntro: [
            {
                speaker: "調査員",
                expression: "neutral",
                text: "静かな住宅街だが……妙に空気が重いな。",
            },
            {
                speaker: "助手",
                expression: "worried",
                text: "ここでは、夜になると“誰もいないのに足音だけがついてくる”という相談が多いみたいです。",
            },
            {
                speaker: "調査員",
                expression: "serious",
                text: "住民の証言と現場の痕跡、両方を押さえておきたい。",
            },
            {
                system: "unlockEvidence",
                text: "【新規情報】擦り減った子供靴の写真／主婦の証言メモを入手した。",
            },
            {
                speaker: "助手",
                expression: "worried",
                text: "『角を曲がるたびに足音が一歩分近づいている気がする』……そんな証言もあります。",
            },
            {
                speaker: "調査員",
                expression: "serious",
                text: "怪異の素性を特定しよう。",
            },
            {
                goto: "identify",
            },
        ],
        identifyBlanks: [
            {
                label: "怪異の正体",
                choices: ["元住人の男", "遊び足りない子供の霊", "通りすがりの犬"],
                correctIndex: 1,
            },
            {
                label: "特徴的な現象",
                choices: ["窓ガラスが割れる", "背後から足音が追ってくる", "電柱が揺れる"],
                correctIndex: 1,
            },
            {
                label: "出没しやすい時間帯",
                choices: ["深夜0〜3時", "夕方18〜20時", "昼の12〜15時"],
                correctIndex: 0,
            },
        ],
    },

    // 3. 駅前
    {
        id: "station_stalker",
        name: "終電ホームの影",
        areaTags: ["station"],
        centerLatLng: [35.6595, 139.7005], // 例：渋谷駅
        mapSpawnLatLng: [35.6608, 139.702],
        spawnOffset: { xPercent: 72, yPercent: 20 },
        bg: "assets/bg/bg_station_night.jpg",
        dialogIntro: [
            {
                speaker: "調査員",
                expression: "serious",
                text: "人通りは多いが……終電を過ぎると、別の顔を見せる場所だ。",
            },
            {
                speaker: "助手",
                expression: "worried",
                text: "この駅では、終電間際に『肩を叩かれて振り返ると誰もいない』という報告が続いています。",
            },
            {
                speaker: "調査員",
                expression: "neutral",
                text: "監視カメラと証言、どちらも照らし合わせたいところだな。",
            },
            {
                system: "unlockEvidence",
                text: "【新規情報】ホーム端の監視カメラ静止画／駅員の証言メモを入手した。",
            },
            {
                speaker: "助手",
                expression: "worried",
                text: "映像では、ホーム端に“映ってはいけない影”が一瞬だけ見えます。",
            },
            {
                speaker: "調査員",
                expression: "serious",
                text: "そろそろ正体を絞り込むか。",
            },
            {
                goto: "identify",
            },
        ],
        identifyBlanks: [
            {
                label: "怪異が狙う相手",
                choices: ["朝の通勤客", "終電間際の一人客", "修学旅行生の集団"],
                correctIndex: 1,
            },
            {
                label: "怪異の位置",
                choices: ["ホーム中央", "階段付近", "ホーム端の線路ぎりぎり"],
                correctIndex: 2,
            },
            {
                label: "最初の異変",
                choices: ["肩を叩かれる感覚", "急に寒くなる", "電車のアナウンスが乱れる"],
                correctIndex: 0,
            },
        ],
    },
];

// ==============================
// 会話スクリプト（outro は共通）
// ==============================

const dialogScript = {
    intro: [], // シナリオ読み込み時に上書き
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
        {
            goto: "end",
        },
    ],
};

let identifyBlanks = []; // シナリオごとに差し替え
let currentLineIndex = 0;

// ==============================
// 共通：画面切り替え
// ==============================

function showScreen(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}

// ==============================
// 立ち絵制御（左右＋アクティブ切り替え）
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
    const charId = speakerMap[line.speaker];
    if (!charId) return;

    const config = characters[charId];
    if (!config) return;

    const imgLeft = document.getElementById("char-left");
    const imgRight = document.getElementById("char-right");

    const expKey = line.expression || config.defaultExpression;
    const sprite =
        config.sprites[expKey] || config.sprites[config.defaultExpression];

    const targetImg = config.side === "left" ? imgLeft : imgRight;
    if (targetImg && sprite) {
        targetImg.src = sprite;
    }
}

// ==============================
// 会話描画
// ==============================

function renderDialogLine() {
    const phase = gameState.phase;
    const lines = dialogScript[phase];
    const line = lines[currentLineIndex];

    if (!line) return;

    // goto / end
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

    // システムイベント
    if (line.system === "unlockEvidence") {
        gameState.evidenceUnlocked = true;
        gameState.memoUnlocked = true;
    }

    const nameBox = document.getElementById("speaker-name");
    const textBox = document.getElementById("dialog-text");

    nameBox.textContent = line.speaker || "";
    textBox.textContent = line.text || "";

    setActiveSpeaker(line.speaker || "");
    applyExpressionForLine(line);

    currentLineIndex++;
}

// ==============================
// 調査メニュー
// ==============================

function renderMenu(tab) {
    const content = document.getElementById("menu-content");
    let html = "";

    if (tab === "howto") {
        html = `
      <p>会話を進めながら、必要に応じてここで情報を確認してください。</p>
      <ul>
        <li>証拠品：実際に手に入れた物証</li>
        <li>怪異の特徴メモ：証言などから整理した怪異の情報</li>
        <li>情報をもとに「怪異特定」パートで正しい組み合わせを選びます</li>
      </ul>
    `;
    } else if (tab === "evidence") {
        if (!gameState.evidenceUnlocked) {
            html = "<p>まだ有効な証拠はありません。</p>";
        } else {
            const s = gameState.currentScenario;
            if (s && s.id === "seaside_woman") {
                html = `
          <ul>
            <li>濡れた足跡の写真：防波堤から海に向かって続く足跡。</li>
            <li>釣り人の証言メモ：「ずぶ濡れの女が、海の底を覗き込んでいた」。</li>
          </ul>
        `;
            } else if (s && s.id === "residential_noise") {
                html = `
          <ul>
            <li>擦り減った子供靴の写真：路地裏の電柱の陰に並べられていた。</li>
            <li>主婦の証言メモ：「曲がり角を曲がるたびに足音が一歩分近づく気がする」。</li>
          </ul>
        `;
            } else if (s && s.id === "station_stalker") {
                html = `
          <ul>
            <li>監視カメラ静止画：ホーム端に“余計な影”が写り込んでいる。</li>
            <li>駅員の証言メモ：「肩を叩かれたと思って振り向いたが誰もいなかった」。</li>
          </ul>
        `;
            } else {
                html = "<p>シナリオ情報を読み込めませんでした。</p>";
            }
        }
    } else if (tab === "memo") {
        if (!gameState.memoUnlocked) {
            html = "<p>まだ怪異の特徴は整理されていません。</p>";
        } else {
            const s = gameState.currentScenario;
            if (s && s.id === "seaside_woman") {
                html = `
          <p>怪異の特徴メモ：</p>
          <ul>
            <li>ずぶ濡れの女の姿をしている。</li>
            <li>海沿いの防波堤に出没。</li>
            <li>ひたすら海の底を覗き込んでいる。</li>
          </ul>
        `;
            } else if (s && s.id === "residential_noise") {
                html = `
          <p>怪異の特徴メモ：</p>
          <ul>
            <li>子供の足音だけが聞こえる。</li>
            <li>住宅街の細い路地に出没。</li>
            <li>背後からついてくるように足音が近づいてくる。</li>
          </ul>
        `;
            } else if (s && s.id === "station_stalker") {
                html = `
          <p>怪異の特徴メモ：</p>
          <ul>
            <li>ホーム端に立つ人影として現れる。</li>
            <li>終電間際の一人客に近づく傾向。</li>
            <li>最初の異変は「肩を叩かれた感覚」。</li>
          </ul>
        `;
            } else {
                html = "<p>シナリオ情報を読み込めませんでした。</p>";
            }
        }
    }

    content.innerHTML = html;
}

// ==============================
// 特定パート
// ==============================

function renderIdentifyBlanks() {
    const container = document.getElementById("fill-blanks");
    container.innerHTML = "";

    identifyBlanks.forEach((blank, idx) => {
        const row = document.createElement("div");
        row.className = "fill-row";

        const label = document.createElement("label");
        label.textContent = blank.label + "：";

        const select = document.createElement("select");
        select.dataset.index = String(idx);

        blank.choices.forEach((choice, cIdx) => {
            const op = document.createElement("option");
            op.value = cIdx;
            op.textContent = choice;
            select.appendChild(op);
        });

        row.appendChild(label);
        row.appendChild(select);
        container.appendChild(row);
    });
}

// 「特定」演出
function playIdentifyEffect(onFinished) {
    const overlay = document.getElementById("identify-overlay");

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

// 「特定失敗」演出
function playIdentifyFailEffect(onFinished) {
    const overlay = document.getElementById("identify-fail-overlay");

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
    const selects = document.querySelectorAll("#fill-blanks select");
    let ok = true;

    selects.forEach((sel) => {
        const idx = Number(sel.dataset.index);
        const val = Number(sel.value);
        if (val !== identifyBlanks[idx].correctIndex) ok = false;
    });

    if (ok) {
        playIdentifyEffect(() => {
            showScreen("screen-seal");
        });
    } else {
        playIdentifyFailEffect(() => {
            // 画面遷移なし
        });
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
    gauge.style.width = "0%";
    effect.classList.remove("active");

    const startTime = performance.now();

    sealTimer = requestAnimationFrame(function step(now) {
        const elapsed = now - startTime;
        sealProgress = Math.min(1, elapsed / HOLD_TIME);
        gauge.style.width = (sealProgress * 100).toFixed(0) + "%";

        if (sealProgress >= 1) {
            sealTimer = null;
            effect.classList.add("active");
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
    document.getElementById("seal-gauge").style.width = "0%";
}

// 黒フェードアウト
function startFadeOut() {
    const overlay = document.getElementById("overlay-black");
    overlay.classList.remove("hidden");
    requestAnimationFrame(() => {
        overlay.classList.add("show");
    });
}

// ==============================
// マップ画面：レーダー円の中に実マップ
// ==============================

function initMapScreen() {
    const status = document.getElementById("map-status");
    const startBtn = document.getElementById("start-investigation");
    const kaijiDot = document.getElementById("radar-kaiji");

    status.textContent = "周辺の怪異反応をスキャン中...";
    startBtn.classList.add("hidden");
    kaijiDot.classList.add("hidden");

    // シナリオをランダム選択
    const scenario =
        yokaiScenarios[Math.floor(Math.random() * yokaiScenarios.length)];
    gameState.currentScenario = scenario;

    // シナリオに応じて会話・特定問題・背景をセット
    dialogScript.intro = scenario.dialogIntro;
    identifyBlanks = scenario.identifyBlanks.slice();
    const bgImg = document.getElementById("bg-image");
    if (bgImg && scenario.bg) {
        bgImg.src = scenario.bg;
    }

    // Leaflet でマップ描画（レーダー円の中）
    try {
        const map = L.map("real-map", {
            zoomControl: false,
            attributionControl: false,
        }).setView(scenario.centerLatLng, 16);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
        }).addTo(map);

        L.marker(scenario.centerLatLng, { title: "調査拠点" }).addTo(map);
        //L.marker(scenario.mapSpawnLatLng, { title: scenario.name }).addTo(map);

        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    } catch (e) {
        console.warn("Leaflet マップ初期化エラー:", e);
    }

    // レーダー内の怪異点位置
    if (scenario.spawnOffset) {
        kaijiDot.style.left = scenario.spawnOffset.xPercent + "%";
        kaijiDot.style.top = scenario.spawnOffset.yPercent + "%";
    }

    // 特定UIもこのシナリオ用に更新
    renderIdentifyBlanks();

    // スキャン演出
    setTimeout(() => {
        status.textContent = "……微弱な怪異反応を検知。";
        kaijiDot.classList.remove("hidden");
    }, 1500);

    setTimeout(() => {
        status.textContent = "怪異反応をロックオン。調査を開始できます。";
        startBtn.classList.remove("hidden");
    }, 2500);
}

// ==============================
// 初期化
// ==============================

document.addEventListener("DOMContentLoaded", () => {
    // 初期画面：マップ
    showScreen("screen-map");
    initMapScreen();

    // 調査開始 → 会話パートへ
    document
        .getElementById("start-investigation")
        .addEventListener("click", () => {
            gameState.phase = "intro";
            currentLineIndex = 0;

            const left = document.getElementById("char-left");
            const right = document.getElementById("char-right");
            if (left) left.classList.remove("inactive");
            if (right) right.classList.add("inactive");

            showScreen("screen-dialog");
            renderDialogLine();
        });

    // 会話画面クリックで進行（メニュー関連は無視）
    document
        .getElementById("screen-dialog")
        .addEventListener("click", (e) => {
            if (e.target.closest("#menu-btn") || e.target.closest(".menu-overlay"))
                return;
            renderDialogLine();
        });

    // 調査メニューボタン（会話画面）
    document.getElementById("menu-btn").addEventListener("click", () => {
        document.getElementById("menu-overlay").classList.remove("hidden");
        document
            .querySelectorAll(".tab-btn")
            .forEach((btn) => btn.classList.remove("active"));
        const firstTab = document.querySelector('.tab-btn[data-tab="howto"]');
        if (firstTab) firstTab.classList.add("active");
        renderMenu("howto");
    });

    // 調査メニューボタン（特定画面）
    document
        .getElementById("menu-btn-identify")
        .addEventListener("click", () => {
            document.getElementById("menu-overlay").classList.remove("hidden");
            document
                .querySelectorAll(".tab-btn")
                .forEach((btn) => btn.classList.remove("active"));
            const firstTab = document.querySelector('.tab-btn[data-tab="howto"]');
            if (firstTab) firstTab.classList.add("active");
            renderMenu("howto");
        });

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
    document.getElementById("menu-close").addEventListener("click", () => {
        document.getElementById("menu-overlay").classList.add("hidden");
    });

    // 特定ボタン
    document
        .getElementById("confirm-identity")
        .addEventListener("click", checkIdentity);

    // 封印 長押し
    const sealBtn = document.getElementById("seal-btn");
    const startEvents = ["mousedown", "touchstart"];
    const endEvents = ["mouseup", "mouseleave", "touchend", "touchcancel"];

    startEvents.forEach((ev) =>
        sealBtn.addEventListener(ev, (e) => {
            e.preventDefault();
            startSealHold();
        }),
    );
    endEvents.forEach((ev) =>
        sealBtn.addEventListener(ev, (e) => {
            e.preventDefault();
            cancelSealHold();
        }),
    );
});
