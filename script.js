// ==============================
// 基本設定
// ==============================
const DEFAULT_LAT = 35.681236;
const DEFAULT_LNG = 139.767125;

const LIFE_MAX = 5;
const CODEX_KEY = "kaimapp_codex_v1";

// 画面状態
let currentView = "map";
let life = LIFE_MAX;

// 怪異データ（簡略版）
const GHOST_TYPES = [
    {
        id: "poltergeist",
        name: "物投げポルターガイスト",
        desc: "見えない手が物を投げ、叩きつけ、騒音を立てる怪異。今回の「つぼ破壊」との相性が良い。",
        note: "温度は常温〜やや低め。EMFが高く、ノイズ混じりのボイス反応が頻繁に観測される。",
        evidence: {
            temperature: "normal",
            emf: "high",
            voice: "frequent",
        },
    },
];

let currentGhost = null;
let codex = {};

// ==============================
// DOM
// ==============================
const views = document.querySelectorAll(".view");
const stepPills = document.querySelectorAll(".step-pill");
const statusText = document.getElementById("status-text");

// MAP
let map;
let anomalyMarker;
const btnGoStory = document.getElementById("btn-go-story");

// STORY / UI
const courtroomEl = document.getElementById("courtroom");
const leftImg = document.getElementById("char-left-img");
const rightImg = document.getElementById("char-right-img");
const lifeFill = document.getElementById("life-bar-fill");
const phaseLabel = document.getElementById("phase-label");
const nameBox = document.getElementById("name-box");
const messageText = document.getElementById("message-text");
const choiceBox = document.getElementById("choice-box");
const nextButton = document.getElementById("btn-next");

// メニュー＋証拠品
const menuOverlay = document.getElementById("menu-overlay");
const menuPanel = document.getElementById("menu-panel");
const menuClose = document.getElementById("menu-close");
const headerMenuButton = document.getElementById("btn-menu");
const openMenuButton = document.getElementById("btn-open-menu");
const menuTabButtons = document.querySelectorAll("#menu-tabs button");
const menuTabContents = document.querySelectorAll(".tab-content");

const ghostNotesListEl = document.getElementById("ghost-notes-list");
const codexListEl = document.getElementById("codex-list");

const evidenceGrid = document.getElementById("evidence-grid");
const evidenceDetailName = document.getElementById("evidence-detail-name");
const evidenceDetailText = document.getElementById("evidence-detail-text");

// ==============================
// ビュー切り替え
// ==============================
function switchView(view) {
    currentView = view;

    // ページ表示切り替え
    views.forEach((v) => {
        v.classList.toggle("active", v.dataset.view === view);
    });

    // ヘッダーの STEP ハイライト
    stepPills.forEach((p) => {
        p.classList.toggle("active", p.dataset.step === view);
    });

    // ステータス文言
    if (view === "map") {
        statusText.textContent = "異常反応源の位置を確認してください。";
    } else if (view === "story") {
        statusText.textContent =
            "会話ログで状況と証拠を整理し、怪異を特定してください。";
    } else if (view === "seal") {
        statusText.textContent = "封印シーケンスを実行してください。";
    }
}

// ==============================
// MAP 初期化
// ==============================
function initMap() {
    map = L.map("map", {
        zoomControl: false,
        attributionControl: false,
    }).setView([DEFAULT_LAT, DEFAULT_LNG], 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
    }).addTo(map);

    const markerDiv = document.createElement("div");
    markerDiv.className = "anomaly-marker";
    const icon = L.divIcon({
        className: "",
        html: markerDiv,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });

    anomalyMarker = L.marker([DEFAULT_LAT, DEFAULT_LNG], { icon }).addTo(map);
    anomalyMarker.on("click", () => {
        startStoryFromMap();
    });
}

// ==============================
// 怪異・図鑑
// ==============================
function loadCodex() {
    try {
        const raw = localStorage.getItem(CODEX_KEY);
        codex = raw ? JSON.parse(raw) : {};
    } catch {
        codex = {};
    }
}

function saveCodex() {
    try {
        localStorage.setItem(CODEX_KEY, JSON.stringify(codex));
    } catch {
        // ignore
    }
}

function today() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function registerGhostToCodex(g) {
    if (!g) return;
    const id = g.id;
    if (!codex[id]) {
        codex[id] = { id, name: g.name, firstDate: today(), count: 1 };
    } else {
        codex[id].count += 1;
    }
    saveCodex();
    renderCodex();
}

function renderGhostNotes() {
    ghostNotesListEl.innerHTML = "";
    GHOST_TYPES.forEach((g) => {
        const card = document.createElement("div");
        card.className = "ghost-note-card";
        const header = document.createElement("div");
        header.className = "ghost-note-header";
        header.innerHTML = `<span>${g.name}</span><span>ID: ${g.id}</span>`;

        const pills = document.createElement("div");
        pills.className = "ghost-note-evidence";

        const p1 = document.createElement("span");
        p1.className = "evidence-pill";
        p1.textContent = `温度: ${g.evidence.temperature}`;
        const p2 = document.createElement("span");
        p2.className = "evidence-pill";
        p2.textContent = `EMF: ${g.evidence.emf}`;
        const p3 = document.createElement("span");
        p3.className = "evidence-pill";
        p3.textContent = `ボイス: ${g.evidence.voice}`;

        pills.append(p1, p2, p3);

        const note = document.createElement("div");
        note.textContent = g.note;

        card.append(header, pills, note);
        ghostNotesListEl.appendChild(card);
    });
}

function renderCodex() {
    if (!codex || Object.keys(codex).length === 0) {
        codexListEl.textContent = "まだ記録された怪異はありません。";
        return;
    }
    codexListEl.innerHTML = "";
    Object.values(codex).forEach((entry) => {
        const div = document.createElement("div");
        div.className = "codex-item";
        const header = document.createElement("div");
        header.className = "codex-item-header";
        header.innerHTML = `<span>${entry.name}</span><span>遭遇回数：${entry.count}</span>`;
        const body = document.createElement("div");
        body.textContent = `初回記録日：${entry.firstDate}`;
        div.append(header, body);
        codexListEl.appendChild(div);
    });
}

// ==============================
// 証拠品データ＆解放
// ==============================
const evidences = [
    {
        id: "flyer",
        name: "開店セールのチラシ",
        img: "assets/img/evidence_flyer.png",
        description:
            "【開店セールのチラシ】\n\nレストラン『カミナリ亭』の開店セールを告知するチラシ。\n今日の営業時間が「11:00〜」と大きく書かれている。\n\n店主の「朝9時ごろに客がいた」という証言と矛盾している。",
    },
    {
        id: "camera",
        name: "監視カメラの記録",
        img: "assets/img/evidence_camera.png",
        description:
            "【監視カメラの記録】\n\nホールの一部が映った動画ファイルの静止画キャプチャ。\n11:10 頃にはつぼがすでに割れているが、人影は映っていない。\n\n「誰もいないのに割れた」可能性を示唆する。",
    },
    {
        id: "pot",
        name: "割れたつぼの写真",
        img: "assets/img/evidence_pot.png",
        description:
            "【割れたつぼの写真】\n\n事件後に撮影された高級つぼの残骸。細かく砕け散っている。\n\n衝撃の向きから、上方から強い力が加わった可能性が高い。",
    },
    {
        id: "anomaly_log",
        name: "今日の怪異ログ",
        img: "assets/img/evidence_log.png",
        description: () => {
            if (!currentGhost) {
                return "【今日の怪異ログ】\n\nまだ怪異タイプは仮定段階です。会話と状況整理を進めてください。";
            }
            return `【今日の怪異ログ】\n\n名称：${currentGhost.name}\n\nメモ：${currentGhost.note}`;
        },
    },
];

const unlockedEvidenceIds = new Set();

function unlockEvidence(id) {
    if (unlockedEvidenceIds.has(id)) return;
    unlockedEvidenceIds.add(id);
    buildEvidenceUI();
}

function buildEvidenceUI() {
    evidenceGrid.innerHTML = "";

    const unlockedList = evidences.filter((e) => unlockedEvidenceIds.has(e.id));
    if (unlockedList.length === 0) {
        evidenceDetailName.textContent = "";
        evidenceDetailText.textContent = "まだ証拠品は入手されていません。";
        return;
    }

    unlockedList.forEach((ev) => {
        const item = document.createElement("button");
        item.className = "evidence-item";
        item.dataset.id = ev.id;

        const img = document.createElement("img");
        img.src = ev.img;
        img.alt = ev.name;

        const name = document.createElement("div");
        name.className = "evidence-item-name";
        name.textContent = ev.name;

        item.append(img, name);
        item.addEventListener("click", () => selectEvidence(ev.id));
        evidenceGrid.appendChild(item);
    });

    // 何も選ばれてなければ最初を表示
    if (!lastEvidenceId && unlockedList.length > 0) {
        selectEvidence(unlockedList[0].id);
    } else if (lastEvidenceId && unlockedEvidenceIds.has(lastEvidenceId)) {
        selectEvidence(lastEvidenceId);
    }
}

let lastEvidenceId = null;

function selectEvidence(id) {
    lastEvidenceId = id;
    const ev = evidences.find((e) => e.id === id);
    if (!ev) return;

    document.querySelectorAll(".evidence-item").forEach((el) => {
        el.classList.toggle("active", el.dataset.id === id);
    });

    evidenceDetailName.textContent = ev.name;
    const desc =
        typeof ev.description === "function" ? ev.description() : ev.description;
    evidenceDetailText.textContent = desc;
}

// ==============================
// 調査メニュー（4タブ）
// ==============================
function openMenu() {
    menuOverlay.classList.remove("hidden");
}

function closeMenu() {
    menuOverlay.classList.add("hidden");
}

function switchMenuTab(tabId) {
    menuTabButtons.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.tab === tabId);
    });
    menuTabContents.forEach((content) => {
        content.classList.toggle("hidden", content.dataset.tab !== tabId);
    });

    if (tabId === "evidence") {
        buildEvidenceUI();
    }
}

// ==============================
// 会話パート（元・裁判ロジック）
// ==============================

// 背景
const backgrounds = {
    control_room: "assets/img/bg_control_room.png",
    witness_room: "assets/img/bg_witness_room.png",
};

// キャラスプライト設定
const spriteConfig = [
    { match: (s) => s && s.includes("あなた"), base: "agent", side: "left" },
    { match: (s) => s && s.includes("ミカ"), base: "operator", side: "left" },
    { match: (s) => s && s.includes("センター長"), base: "chief", side: "right" },
    { match: (s) => s && s.includes("店主"), base: "witness_owner", side: "right" },
    { match: (s) => s && s.includes("タナカ"), base: "civilian_tanaka", side: "left" },
    { match: (s) => s === "システム", base: null, side: "none" },
];

// シナリオ
const scenes = {
    intro: [
        {
            type: "line",
            speaker: "オペレーター・ミカ",
            face: "smile",
            bg: "control_room",
            phase: "ブリーフィング：導入",
            text: "……エージェント、接続確認できました。今日もタグからの呼び出し、ご苦労さまです。",
            addEvidence: ["anomaly_log"], // 最初に「今日の怪異ログ」を解放
        },
        {
            type: "line",
            speaker: "あなた",
            face: "dazed",
            phase: "ブリーフィング：導入",
            text: "ここは……センターの作戦室。さっきの地図の反応地点とリンクしてるんだな。",
        },
        {
            type: "line",
            speaker: "センター長",
            face: "serious",
            phase: "ブリーフィング：導入",
            text: "うむ。異界調査センター第七班、本日付けミッションを開始する。",
        },
        {
            type: "line",
            speaker: "センター長",
            face: "serious",
            phase: "ブリーフィング：導入",
            text: "対象地点はレストラン『カミナリ亭』。高級つぼが破壊され、それを境に怪異反応が継続している。",
        },
        {
            type: "line",
            speaker: "あなた",
            face: "worried",
            phase: "ブリーフィング：導入",
            text: "器物破損にしては騒ぎすぎじゃないですか？",
        },
        {
            type: "line",
            speaker: "オペレーター・ミカ",
            face: "serious",
            phase: "ブリーフィング：導入",
            text: "普通の器物破損ならそうですね。でも、あのつぼは「何か」が封じられていた可能性が高いんです。",
        },
        {
            type: "line",
            speaker: "オペレーター・ミカ",
            face: "smile",
            phase: "ブリーフィング：導入",
            text: "……というわけで、今回のミッションは『つぼ破壊の真相』と『怪異の特定』です。",
        },
        {
            type: "line",
            speaker: "センター長",
            face: "serious",
            bg: "witness_room",
            phase: "ブリーフィング：導入",
            text: "まずは現場の店主から事情を聞く。準備はいいか、エージェント。",
        },
        {
            type: "line",
            speaker: "あなた",
            face: "serious",
            phase: "ブリーフィング：導入",
            text: "はい、聞き取りを開始します。",
            onNextScene: "testimony",
        },
    ],

    testimony: [
        {
            type: "line",
            speaker: "店主・オオバ",
            face: "normal",
            bg: "witness_room",
            phase: "聞き取り１",
            text: "ワシが『カミナリ亭』のオーナー、オオバじゃ。あの高級つぼを割られて、えらい損をしたんじゃよ。",
        },
        {
            type: "line",
            speaker: "店主・オオバ",
            face: "normal",
            phase: "聞き取り１",
            text: "事件があったのは朝の９時ごろじゃった。店の照明をつけた直後でな。",
        },
        {
            type: "line",
            speaker: "店主・オオバ",
            face: "normal",
            phase: "聞き取り１",
            text: "ワシがホールを掃除しておったら、常連のタナカくんが入ってきての。",
        },
        {
            type: "line",
            speaker: "店主・オオバ",
            face: "normal",
            phase: "聞き取り１",
            text: "タナカくんは、なぜかキョロキョロしながらつぼの近くを歩いておったわい。",
        },
        {
            type: "line",
            speaker: "店主・オオバ",
            face: "angry",
            phase: "聞き取り１",
            text: "その直後じゃ！あの高級つぼが床に落ちて粉々になったのは！",
        },
        {
            type: "line",
            speaker: "店主・オオバ",
            face: "angry",
            phase: "聞き取り１",
            text: "割れる直前、つぼのそばにいたのはタナカくんだけじゃった！ワシの目に狂いはない！",
        },
        {
            type: "line",
            speaker: "あなた",
            face: "worried",
            bg: "control_room",
            phase: "聞き取り１",
            text: "（一見すると、タナカさんが怪しい流れだな……）",
        },
        {
            type: "line",
            speaker: "オペレーター・ミカ",
            face: "serious",
            phase: "聞き取り１",
            text: "今の話、時間と鍵の状態に注目して聞き直してみてください。",
            addEvidence: ["flyer"], // ここでチラシ入手
        },
        {
            type: "line",
            speaker: "オペレーター・ミカ",
            face: "smile",
            phase: "聞き取り１",
            text: "ついでに『開店セールのチラシ』データ送っておきます。証拠品タブから確認できますよ。",
        },
        {
            type: "choice",
            phase: "選択",
            text: "どうする？",
            options: [
                { label: "とりあえずタナカを疑う", nextScene: "panic" },
                {
                    label: "時間と証言を整理してみる（正解）",
                    nextScene: "press1",
                    correct: true,
                },
            ],
        },
    ],

    panic: [
        {
            type: "line",
            speaker: "あなた",
            face: "panic",
            phase: "ミス：早とちり",
            text: "店主さんの言うとおりなら、もうタナカさんが犯人で決まりでは……？",
        },
        {
            type: "line",
            speaker: "センター長",
            face: "serious",
            phase: "ミス：早とちり",
            text: "早計だな。センターは「怪異」の有無を判定する部署だ。人間だけを疑うのなら警察で十分だ。",
        },
        {
            type: "line",
            speaker: "オペレーター・ミカ",
            face: "serious",
            phase: "ミス：早とちり",
            text: "エージェント、証言はそのまま信じるのではなく、どこが不自然かを探すものですよ。",
            onNextScene: "testimony_retry",
        },
    ],

    testimony_retry: [
        {
            type: "line",
            speaker: "センター長",
            face: "normal",
            phase: "聞き取り１・再確認",
            text: "重要な点だけ、もう一度確認しよう。",
        },
        {
            type: "line",
            speaker: "店主・オオバ",
            face: "normal",
            phase: "聞き取り１・再確認",
            text: "事件があったのは朝の９時ごろじゃった。店の照明をつけた直後でな。",
        },
        {
            type: "line",
            speaker: "店主・オオバ",
            face: "normal",
            phase: "聞き取り１・再確認",
            text: "ワシがホールを掃除しておったら、タナカくんが入ってきての。",
        },
        {
            type: "line",
            speaker: "店主・オオバ",
            face: "normal",
            phase: "聞き取り１・再確認",
            text: "タナカくんは、なぜかキョロキョロしながらつぼの近くを歩いておったわい。",
        },
        {
            type: "line",
            speaker: "オペレーター・ミカ",
            face: "serious",
            phase: "聞き取り１・再確認",
            text: "……さて、今度はどう整理します？",
        },
        {
            type: "choice",
            phase: "選択",
            text: "どうする？",
            options: [
                {
                    label: "時間と証言を整理してみる（正解）",
                    nextScene: "press1",
                    correct: true,
                },
            ],
        },
    ],

    press1: [
        {
            type: "line",
            speaker: "あなた",
            face: "serious",
            phase: "状況整理",
            text: "店主さん、整理させてください。事件があったのは『朝９時ごろ』で間違いないですね？",
        },
        {
            type: "line",
            speaker: "店主・オオバ",
            face: "normal",
            phase: "状況整理",
            text: "うむ、そうじゃ。開店準備でバタバタしとった時間じゃな。",
        },
        {
            type: "line",
            speaker: "あなた",
            face: "serious",
            phase: "状況整理",
            text: "その時間、店は営業中でしたか？　客を入れていた？",
        },
        {
            type: "line",
            speaker: "店主・オオバ",
            face: "normal",
            phase: "状況整理",
            text: "いや、その日は１１時開店じゃ。９時はまだ準備中の時間よ。客はおらんはずじゃ。",
        },
        {
            type: "line",
            speaker: "あなた",
            face: "thinking",
            phase: "状況整理",
            text: "準備中は鍵はどうしていました？",
        },
        {
            type: "line",
            speaker: "店主・オオバ",
            face: "normal",
            phase: "状況整理",
            text: "基本的には閉めとる。開店前に入り込まれても困るからのう。",
        },
        {
            type: "line",
            speaker: "あなた",
            face: "thinking",
            phase: "状況整理",
            text: "（鍵が閉まっている店に、タナカさんが普通に入ってきた？）",
        },
        {
            type: "line",
            speaker: "オペレーター・ミカ",
            face: "serious",
            phase: "状況整理",
            text: "エージェント、『開店セールのチラシ』を見てください。そこに決定的なヒントがあります。",
        },
        {
            type: "line",
            speaker: "センター長",
            face: "serious",
            phase: "状況整理",
            text: "証言とチラシの内容を照らし合わせたとき、どこに矛盾が生じる？",
        },
        {
            type: "choice",
            phase: "証拠説明",
            text: "どの証拠を使って説明する？",
            options: [
                { label: "監視カメラの記録", nextScene: "present_wrong1" },
                { label: "割れたつぼの写真", nextScene: "present_wrong2" },
                {
                    label: "開店セールのチラシ（正解）",
                    nextScene: "present_right",
                    correct: true,
                },
            ],
        },
    ],

    present_wrong1: [
        {
            type: "line",
            speaker: "あなた",
            face: "serious",
            phase: "ミス：証拠選択",
            text: "この『監視カメラの記録』が決定的です。",
            addEvidence: ["camera"], // ここでカメラ記録が証拠として正式登録
        },
        {
            type: "line",
            speaker: "センター長",
            face: "serious",
            phase: "ミス：証拠選択",
            text: "ふむ。しかしそれは、つぼが割れた『後』しか映していないようだな。時間の矛盾を語るには材料不足だ。",
        },
        {
            type: "line",
            speaker: "あなた",
            face: "panic",
            phase: "ミス：証拠選択",
            text: "う……たしかに、論点がずれていますね。",
        },
        {
            type: "line",
            speaker: "オペレーター・ミカ",
            face: "serious",
            phase: "ミス：証拠選択",
            text: "時間そのものが問題になっているので、時刻情報がはっきりした証拠を選びましょう。",
            onNextScene: "penalty",
        },
    ],

    present_wrong2: [
        {
            type: "line",
            speaker: "あなた",
            face: "serious",
            phase: "ミス：証拠選択",
            text: "この『割れたつぼの写真』が決定的です。",
            addEvidence: ["pot"], // ここで写真を入手
        },
        {
            type: "line",
            speaker: "センター長",
            face: "serious",
            phase: "ミス：証拠選択",
            text: "……それは結果を示すだけだな。そこから時間の矛盾を導くのは難しい。",
        },
        {
            type: "line",
            speaker: "あなた",
            face: "panic",
            phase: "ミス：証拠選択",
            text: "ぐっ……勢いで出してしまった……。",
        },
        {
            type: "line",
            speaker: "オペレーター・ミカ",
            face: "serious",
            phase: "ミス：証拠選択",
            text: "エージェント、今回重要なのは『いつ店が開いているか』です。チラシに目を通してください。",
            onNextScene: "penalty",
        },
    ],

    penalty: [
        {
            type: "line",
            speaker: "システム",
            phase: "ペナルティ",
            text: "信頼度が少し下がった……。ミスが続くと調査が打ち切られる。",
        },
        {
            type: "line",
            speaker: "オペレーター・ミカ",
            face: "serious",
            phase: "ペナルティ",
            text: "信頼度は画面上部のゲージです。0になる前に、証言と証拠の関係を整理しましょう。",
        },
        {
            type: "choice",
            phase: "証拠説明",
            text: "もう一度、どの証拠で説明する？",
            options: [
                { label: "監視カメラの記録", nextScene: "present_wrong1" },
                { label: "割れたつぼの写真", nextScene: "present_wrong2" },
                {
                    label: "開店セールのチラシ（正解）",
                    nextScene: "present_right",
                    correct: true,
                },
            ],
        },
    ],

    present_right: [
        {
            type: "line",
            speaker: "あなた",
            face: "serious",
            phase: "状況整理：成功",
            text: "この『開店セールのチラシ』をご覧ください。",
        },
        {
            type: "line",
            speaker: "あなた",
            face: "serious",
            phase: "状況整理：成功",
            text: "今日の開店時刻は『11:00〜』と、はっきり印刷されています。",
        },
        {
            type: "line",
            speaker: "あなた",
            face: "serious",
            phase: "状況整理：成功",
            text: "つまり店主の言う『朝９時ごろにタナカさんが店内にいた』という状況は、物理的に成立しません。",
        },
        {
            type: "line",
            speaker: "センター長",
            face: "serious",
            phase: "状況整理：成功",
            text: "鍵も閉めていたと言っていたな。人間の出入りとして説明するには無理がある。",
        },
        {
            type: "line",
            speaker: "オペレーター・ミカ",
            face: "smile",
            phase: "状況整理：成功",
            text: "つまり、『誰もいないはずの店内でつぼが割れた』ってことになりますね。",
        },
        {
            type: "line",
            speaker: "あなた",
            face: "serious",
            phase: "状況整理：成功",
            text: "ポルターガイスト系怪異が、つぼを割った可能性が高い……そう考えるのが自然でしょう。",
        },
        {
            type: "line",
            speaker: "センター長",
            face: "serious",
            phase: "状況整理：成功",
            text: "よろしい。怪異タイプを『物投げポルターガイスト』として仮確定する。",
        },
        {
            type: "line",
            speaker: "システム",
            phase: "状況整理：成功",
            text: "【状況整理完了】怪異タイプの特定に成功しました。図鑑に記録します。",
            onClear: true,
        },
    ],

    gameover: [
        {
            type: "line",
            speaker: "センター長",
            face: "serious",
            phase: "調査打ち切り",
            text: "……今回は、証言と証拠の矛盾を十分に説明しきれなかったようだな。",
        },
        {
            type: "line",
            speaker: "センター長",
            face: "serious",
            phase: "調査打ち切り",
            text: "怪異調査官の仕事は、見えないものを見える形で整理することだ。もう一度やり直し、次こそは掴んでみせろ。",
        },
        {
            type: "line",
            speaker: "システム",
            phase: "調査打ち切り",
            text: "【調査中断】会話パートを最初からやり直します。",
            onNextScene: "intro",
        },
        {
            type: "line",
            speaker: "システム",
            phase: "状況整理：成功",
            text: "【状況整理完了】怪異タイプの特定に成功しました。図鑑に記録し、封印シーケンスを開始できます。",
            onClear: true,   // 図鑑登録
            startSeal: true  // ▶ で封印ページへ
        },
    ],
};

// シーン状態
const state = {
    sceneId: "intro",
    lineIndex: 0,
};

// 背景設定
function setBackground(bgKey) {
    const path = backgrounds[bgKey];
    if (path) courtroomEl.style.backgroundImage = `url("${path}")`;
}

// キャラ画像
function getCharacterSpec(line) {
    const speaker = line.speaker;
    const face = line.face || "normal";
    const entry = spriteConfig.find((cfg) => cfg.match && cfg.match(speaker));
    if (!entry || !entry.base) return { side: "none", img: null };
    const img = `assets/img/${entry.base}_${face}.png`;
    return { side: entry.side, img };
}

function getCurrentScene() {
    return scenes[state.sceneId];
}
function getCurrentLine() {
    const scene = getCurrentScene();
    if (!scene) return null;
    return scene[state.lineIndex] || null;
}

// 信頼度
function updateLifeBar() {
    const ratio = life / LIFE_MAX;
    lifeFill.style.width = `${ratio * 100}%`;
}
function setLife(value) {
    life = Math.max(0, Math.min(LIFE_MAX, value));
    updateLifeBar();
    if (life === 0 && state.sceneId !== "gameover") {
        state.sceneId = "gameover";
        state.lineIndex = 0;
        renderCurrentLine();
    }
}

// 会話描画
function renderCurrentLine() {
    const line = getCurrentLine();

    choiceBox.innerHTML = "";
    choiceBox.classList.add("hidden");
    nextButton.disabled = false;

    if (!line) {
        const scene = getCurrentScene();
        const last = scene && scene[scene.length - 1];

        if (last && last.onNextScene) {
            state.sceneId = last.onNextScene;
            state.lineIndex = 0;
            renderCurrentLine();
            return;
        }
        nextButton.disabled = true;
        return;
    }

    if (line.phase) phaseLabel.textContent = line.phase;
    if (line.bg) setBackground(line.bg);

    // 証拠品解放
    if (line.addEvidence) {
        line.addEvidence.forEach((id) => unlockEvidence(id));
    }

    if (line.type === "line") {
        const spec = getCharacterSpec(line);
        nameBox.textContent = line.speaker || "";
        messageText.textContent = line.text || "";

        if (spec.side === "left") {
            if (spec.img) leftImg.src = spec.img;
            leftImg.style.opacity = 1;
            rightImg.style.opacity = 0.4;
        } else if (spec.side === "right") {
            if (spec.img) rightImg.src = spec.img;
            leftImg.style.opacity = 0.4;
            rightImg.style.opacity = 1;
        } else {
            leftImg.style.opacity = 0.4;
            rightImg.style.opacity = 0.4;
        }

        // クリア処理
        if (line.onClear && currentGhost) {
            registerGhostToCodex(currentGhost);
        }
    } else if (line.type === "choice") {
        nameBox.textContent = line.speaker || "";
        messageText.textContent = line.text || "";
        choiceBox.classList.remove("hidden");
        choiceBox.innerHTML = "";

        line.options.forEach((opt) => {
            const btn = document.createElement("button");
            btn.className = "choice-button";
            btn.textContent = opt.label;
            btn.addEventListener("click", () => {
                if (!opt.correct) setLife(life - 1);
                if (life === 0) return;

                state.sceneId = opt.nextScene;
                state.lineIndex = 0;
                renderCurrentLine();
            });
            choiceBox.appendChild(btn);
        });

        nextButton.disabled = true;
    }
}

// 進行
function advance() {
    const scene = getCurrentScene();
    const line = getCurrentLine();
    if (!scene || !line) return;

    // ★ この行が「封印に進むトリガー」
    if (line.startSeal) {
        setupSealView();    // 封印ページの初期化＋ switchView("seal")
        return;
    }

    if (line.onNextScene) {
        state.sceneId = line.onNextScene;
        state.lineIndex = 0;
    } else {
        state.lineIndex += 1;
    }

    renderCurrentLine();
}

function setupSealView() {
    if (currentGhost) {
        sealTitle.textContent = `封印対象：${currentGhost.name}`;
        sealDesc.textContent =
            currentGhost.desc ||
            "特定された怪異に対して封印シーケンスを実行します。";
    } else {
        sealTitle.textContent = "封印対象：不明";
        sealDesc.textContent =
            "怪異タイプが未特定のため、封印手順は参考表示のみとなります。";
    }

    sealHolding = false;
    sealDone = false;
    sealStartTs = 0;
    sealProgress.style.width = "0%";
    sealButton.disabled = false;
    sealButton.textContent = "長押しで封印開始";
    sealCircle.classList.remove("holding", "sealed");

    switchView("seal");
}

// ==============================
// スタート・初期化
// ==============================
function startStoryFromMap() {
    currentGhost = GHOST_TYPES[0];   // 今回の怪異
    unlockedEvidenceIds.clear();
    lastEvidenceId = null;

    life = LIFE_MAX;
    updateLifeBar();

    state.sceneId = "intro";
    state.lineIndex = 0;
    renderCurrentLine();

    switchView("story");   // ← 会話ページへ
}

// ==============================
// イベント
// ==============================
btnGoStory.addEventListener("click", startStoryFromMap);

// 調査メニュー（ヘッダー・UI両方で開く）
headerMenuButton.addEventListener("click", openMenu);
openMenuButton.addEventListener("click", openMenu);

menuClose.addEventListener("click", closeMenu);
menuOverlay.addEventListener("click", (e) => {
    if (e.target === menuOverlay) closeMenu();
});

menuTabButtons.forEach((btn) => {
    btn.addEventListener("click", () => switchMenuTab(btn.dataset.tab));
});

// 会話進行
nextButton.addEventListener("click", advance);

btnSealBack.addEventListener("click", () => {
    switchView("map");
    statusText.textContent =
        "異常反応は封印済みです。新たなタグをスキャンできます。";
});

// ==============================
// 起動時
// ==============================
document.addEventListener("DOMContentLoaded", () => {
    initMap();
    loadCodex();
    renderCodex();
    renderGhostNotes();
    updateLifeBar();
    switchView("map");
});
