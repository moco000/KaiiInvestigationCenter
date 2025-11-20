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
  // 怪異シナリオ 9本
  // （※必要なら bg パスは手元の画像に合わせて変えてください）
  // ==============================
  
  const yokaiScenarios = [
    // 1. 海沿い（元のやつ）
    {
      id: "seaside_woman",
      name: "防波堤の女",
      kaijiType: "drowned_spirit",
      areaTags: ["sea"],
      centerLatLng: [35.6295, 139.7705],
      mapSpawnLatLng: [35.6303, 139.7718],
      spawnOffset: { xPercent: 70, yPercent: 25 },
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
          text: "『ずぶ濡れの女が、海の底を覗き込んでいた』……そんな証言もあります。",
        },
        {
          speaker: "調査員",
          expression: "serious",
          text: "怪異の正体を特定するか。",
        },
        { goto: "identify" },
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
  
    // 2. 住宅街（元のやつ）
    {
      id: "residential_noise",
      name: "路地裏の足音",
      kaijiType: "child_apparition",
      areaTags: ["residential"],
      centerLatLng: [35.646, 139.68],
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
        { goto: "identify" },
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
  
    // 3. 駅前（元のやつ）
    {
      id: "station_stalker",
      name: "終電ホームの影",
      kaijiType: "shadow_human",
      areaTags: ["station"],
      centerLatLng: [35.6595, 139.7005],
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
        { goto: "identify" },
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
  
    // 4. 山林：境界の守り人
    {
      id: "forest_boundary",
      name: "境界の守り人",
      kaijiType: "forest_guardian",
      areaTags: ["forest"],
      centerLatLng: [35.689, 139.11],
      mapSpawnLatLng: [35.6895, 139.112],
      spawnOffset: { xPercent: 20, yPercent: 35 },
      bg: "assets/bg/bg_forest_night.jpg",
      dialogIntro: [
        {
          speaker: "調査員",
          expression: "neutral",
          text: "森の入口か……やけに静かだな。",
        },
        {
          speaker: "助手",
          expression: "worried",
          text: "風の音もしないね。“境界に立つ者”の噂、知ってる？",
        },
        {
          speaker: "調査員",
          expression: "serious",
          text: "森と人の世界、その境目を見張っているってやつか。",
        },
        {
          system: "unlockEvidence",
          text: "【新規情報】獣道の写真／古い言い伝えのメモを入手した。",
        },
        {
          speaker: "助手",
          expression: "worried",
          text: "通り過ぎる人を、じっと無言で見ているらしいよ。",
        },
        {
          speaker: "調査員",
          expression: "serious",
          text: "ここにいる“何か”を特定しよう。",
        },
        { goto: "identify" },
      ],
      identifyBlanks: [
        {
          label: "怪異の種類",
          choices: ["森の守り人", "影人間", "異界の子供"],
          correctIndex: 0,
        },
        {
          label: "特徴",
          choices: ["境界に立つ", "足音が近づく", "水音がする"],
          correctIndex: 0,
        },
      ],
    },
  
    // 5. 川辺：水面を覗く娘
    {
      id: "riverside_girl",
      name: "水面を覗く娘",
      kaijiType: "river_woman",
      areaTags: ["riverside"],
      centerLatLng: [35.6894, 139.551],
      mapSpawnLatLng: [35.6899, 139.552],
      spawnOffset: { xPercent: 40, yPercent: 65 },
      bg: "assets/bg/bg_river_night.jpg",
      dialogIntro: [
        {
          speaker: "調査員",
          expression: "neutral",
          text: "川音はしているのに……人の気配が薄いな。",
        },
        {
          speaker: "助手",
          expression: "worried",
          text: "あそこ、しゃがみ込んでる影が見える。水面を覗き込んでる？",
        },
        {
          speaker: "調査員",
          expression: "serious",
          text: "“川で呼ぶ女”の噂を思い出すな。",
        },
        {
          system: "unlockEvidence",
          text: "【新規情報】録音データ／古い事故記事のコピーを入手した。",
        },
        {
          speaker: "助手",
          expression: "worried",
          text: "溺れた人の声を真似して、名前を呼ぶって話だよ。",
        },
        {
          speaker: "調査員",
          expression: "serious",
          text: "その実態を特定しよう。",
        },
        { goto: "identify" },
      ],
      identifyBlanks: [
        {
          label: "怪異の種類",
          choices: ["水辺の女", "溺れ女", "影人間"],
          correctIndex: 0,
        },
        {
          label: "特徴",
          choices: ["呼ぶ声", "水滴", "足音"],
          correctIndex: 0,
        },
      ],
    },
  
    // 6. 廃墟：顔なしの住人
    {
      id: "ruin_faceless",
      name: "顔なしの住人",
      kaijiType: "faceless_guest",
      areaTags: ["ruin"],
      centerLatLng: [35.667, 139.777],
      mapSpawnLatLng: [35.6675, 139.778],
      spawnOffset: { xPercent: 70, yPercent: 52 },
      bg: "assets/bg/bg_ruin_night.jpg",
      dialogIntro: [
        {
          speaker: "調査員",
          expression: "neutral",
          text: "この廃ビル、まだ誰か住んでいるように見えるな。",
        },
        {
          speaker: "助手",
          expression: "worried",
          text: "窓のところ…誰か立ってなかった？",
        },
        {
          speaker: "調査員",
          expression: "serious",
          text: "顔が……無いように見えたな。",
        },
        {
          system: "unlockEvidence",
          text: "【新規情報】割れた鏡の写真／都市伝説の切り抜きを入手した。",
        },
        {
          speaker: "助手",
          expression: "worried",
          text: "ここ、“顔を無くす怪異”の噂がある場所だったよね。",
        },
        {
          speaker: "調査員",
          expression: "serious",
          text: "その正体をはっきりさせよう。",
        },
        { goto: "identify" },
      ],
      identifyBlanks: [
        {
          label: "怪異の種類",
          choices: ["顔なし", "影人間", "異界の子供"],
          correctIndex: 0,
        },
        {
          label: "特徴",
          choices: ["顔がない", "立ち止まる", "水音"],
          correctIndex: 0,
        },
      ],
    },
  
    // 7. トンネル：囁く声まね
    {
      id: "tunnel_voice",
      name: "囁く声まね",
      kaijiType: "mimic_voice",
      areaTags: ["tunnel"],
      centerLatLng: [35.543, 139.321],
      mapSpawnLatLng: [35.5434, 139.322],
      spawnOffset: { xPercent: 50, yPercent: 10 },
      bg: "assets/bg/bg_tunnel_night.jpg",
      dialogIntro: [
        {
          speaker: "調査員",
          expression: "neutral",
          text: "トンネル内か……音がよく響く。",
        },
        {
          speaker: "助手",
          expression: "worried",
          text: "今、“ねえ”って呼ばれなかった？",
        },
        {
          speaker: "調査員",
          expression: "serious",
          text: "このトンネル、知り合いの声で呼ばれるって噂があるな。",
        },
        {
          system: "unlockEvidence",
          text: "【新規情報】ボイスレコーダーの音声／事故記録のメモを入手した。",
        },
        {
          speaker: "助手",
          expression: "worried",
          text: "振り向いたらいけないってやつ、実話だったりして。",
        },
        {
          speaker: "調査員",
          expression: "serious",
          text: "声の主を特定しよう。",
        },
        { goto: "identify" },
      ],
      identifyBlanks: [
        {
          label: "怪異の種類",
          choices: ["声まね霊", "影人間", "廃墟の住人"],
          correctIndex: 0,
        },
        {
          label: "特徴",
          choices: ["呼び声", "子供の姿", "濡れた跡"],
          correctIndex: 0,
        },
      ],
    },
  
    // 8. 裏路地：もう1つの足音
    {
      id: "backalley_steps",
      name: "もう1つの足音",
      kaijiType: "child_apparition",
      areaTags: ["residential"],
      centerLatLng: [35.615, 139.721],
      mapSpawnLatLng: [35.6155, 139.722],
      spawnOffset: { xPercent: 60, yPercent: 28 },
      bg: "assets/bg/bg_backalley_night.jpg",
      dialogIntro: [
        {
          speaker: "調査員",
          expression: "neutral",
          text: "細い路地だな。人通りもない。",
        },
        {
          speaker: "助手",
          expression: "worried",
          text: "今さ、足音が“2つ”じゃなかった？",
        },
        {
          speaker: "調査員",
          expression: "serious",
          text: "俺たちは2人だ。……増えてたな。",
        },
        {
          system: "unlockEvidence",
          text: "【新規情報】足音の録音／近隣住民の証言メモを入手した。",
        },
        {
          speaker: "助手",
          expression: "worried",
          text: "『曲がり角を曲がるたびに足音が増える』って噂もあったよ。",
        },
        {
          speaker: "調査員",
          expression: "serious",
          text: "この足音の主を特定しよう。",
        },
        { goto: "identify" },
      ],
      identifyBlanks: [
        {
          label: "怪異の種類",
          choices: ["子供の霊", "影人間", "溺れ女"],
          correctIndex: 0,
        },
        {
          label: "特徴",
          choices: ["足音が増える", "濡れた跡", "呼び声"],
          correctIndex: 0,
        },
      ],
    },
  
    // 9. 駅前派生：ホーム端の影
    {
      id: "station_shadow",
      name: "ホーム端の影",
      kaijiType: "shadow_human",
      areaTags: ["station"],
      centerLatLng: [35.658, 139.702],
      mapSpawnLatLng: [35.6585, 139.703],
      spawnOffset: { xPercent: 15, yPercent: 48 },
      bg: "assets/bg/bg_station_night2.jpg",
      dialogIntro: [
        {
          speaker: "調査員",
          expression: "neutral",
          text: "また駅か。人が多いほど、見えないものも混ざりやすい。",
        },
        {
          speaker: "助手",
          expression: "worried",
          text: "ホーム端にさ、影だけの人が立ってない？",
        },
        {
          speaker: "調査員",
          expression: "serious",
          text: "光源と逆方向に伸びている……“影人間”のパターンだな。",
        },
        {
          system: "unlockEvidence",
          text: "【新規情報】監視カメラ静止画／駅員の追加証言メモを入手した。",
        },
        {
          speaker: "助手",
          expression: "worried",
          text: "実体は見えないのに、こっちを見てる気がする。",
        },
        {
          speaker: "調査員",
          expression: "serious",
          text: "あの影の正体を特定する。",
        },
        { goto: "identify" },
      ],
      identifyBlanks: [
        {
          label: "怪異の種類",
          choices: ["影人間", "子供の霊", "溺れ女"],
          correctIndex: 0,
        },
        {
          label: "特徴",
          choices: ["影だけ存在", "足音が増える", "呼び声"],
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
      { goto: "end" },
    ],
  };
  
  let identifyBlanks = []; // シナリオごとに差し替え
  let currentLineIndex = 0;
  
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
    const charId = speakerMap[line.speaker];
    if (!charId) return;
  
    const config = characters[charId];
    if (!config) return;
  
    const imgLeft = document.getElementById("char-left");
    const imgRight = document.getElementById("char-right");
  
    const expKey = line.expression || config.defaultExpression;
    const sprite =
      (config.sprites && config.sprites[expKey]) ||
      (config.sprites && config.sprites[config.defaultExpression]);
  
    if (!sprite) return;
  
    const targetImg = config.side === "left" ? imgLeft : imgRight;
    if (targetImg) {
      targetImg.src = sprite;
    }
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
  
    // goto シーケンス
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
      } else if (!s) {
        html = "<p>シナリオ情報を読み込めませんでした。</p>";
      } else {
        switch (s.id) {
          case "seaside_woman":
            html = `
              <p>【防波堤の女：証拠品】</p>
              <ul>
                <li>濡れた足跡の写真：防波堤から海に向かって続く足跡。</li>
                <li>釣り人の証言メモ：「ずぶ濡れの女が、海の底を覗き込んでいた」。</li>
              </ul>
            `;
            break;
          case "residential_noise":
            html = `
              <p>【路地裏の足音：証拠品】</p>
              <ul>
                <li>擦り減った子供靴の写真：路地裏の電柱の陰に並べられていた。</li>
                <li>主婦の証言メモ：「角を曲がるたびに足音が一歩分近づいている気がする」。</li>
              </ul>
            `;
            break;
          case "station_stalker":
            html = `
              <p>【終電ホームの影：証拠品】</p>
              <ul>
                <li>監視カメラ静止画：ホーム端に“余計な影”が写り込んでいる。</li>
                <li>駅員の証言メモ：「肩を叩かれたと思って振り向いたが誰もいなかった」。</li>
              </ul>
            `;
            break;
          case "forest_boundary":
            html = `
              <p>【境界の守り人：証拠品】</p>
              <ul>
                <li>獣道には足跡が一切残っていない。</li>
                <li>森の入口で「誰かが立っていた」との目撃証言。</li>
              </ul>
            `;
            break;
          case "riverside_girl":
            html = `
              <p>【水面を覗く娘：証拠品】</p>
              <ul>
                <li>録音データ：水辺で“誰かの名前を呼ぶ声”が入っている。</li>
                <li>その声の主は現場にはいなかった。</li>
              </ul>
            `;
            break;
          case "ruin_faceless":
            html = `
              <p>【顔なしの住人：証拠品】</p>
              <ul>
                <li>鏡に“輪郭だけの顔”が写り込んだ写真。</li>
                <li>元住人が「顔を無くす夢を繰り返し見ていた」という記録。</li>
              </ul>
            `;
            break;
          case "tunnel_voice":
            html = `
              <p>【囁く声まね：証拠品】</p>
              <ul>
                <li>ボイスレコーダーには、知り合いに似た声が残っている。</li>
                <li>だが、録音時にその人物は別の場所にいた。</li>
              </ul>
            `;
            break;
          case "backalley_steps":
            html = `
              <p>【もう1つの足音：証拠品】</p>
              <ul>
                <li>録音された足音は、人数と合わない“余分な一歩”が含まれている。</li>
                <li>「後ろを歩いていたら足音が増えた」という住民の証言。</li>
              </ul>
            `;
            break;
          case "station_shadow":
            html = `
              <p>【ホーム端の影：証拠品】</p>
              <ul>
                <li>光源と逆方向に伸びる影が映った監視カメラ静止画。</li>
                <li>影の位置に“誰もいなかった”という当直駅員の報告。</li>
              </ul>
            `;
            break;
          default:
            html = "<p>シナリオ情報を読み込めませんでした。</p>";
        }
      }
    } else if (tab === "memo") {
      if (!gameState.memoUnlocked) {
        html = "<p>まだ怪異の特徴は整理されていません。会話を進めて情報を集めてください。</p>";
      } else if (!s) {
        html = "<p>シナリオ情報を読み込めませんでした。</p>";
      } else {
        switch (s.id) {
          case "seaside_woman":
            html = `
              <p>【防波堤の女：特徴メモ】</p>
              <ul>
                <li>ずぶ濡れの女の姿をしている。</li>
                <li>海沿いの防波堤に出没。</li>
                <li>ひたすら海の底を覗き込んでいる。</li>
              </ul>
            `;
            break;
          case "residential_noise":
            html = `
              <p>【路地裏の足音：特徴メモ】</p>
              <ul>
                <li>子供の足音だけが聞こえる。</li>
                <li>住宅街の細い路地に出没。</li>
                <li>背後からついてくるように足音が近づいてくる。</li>
              </ul>
            `;
            break;
          case "station_stalker":
            html = `
              <p>【終電ホームの影：特徴メモ】</p>
              <ul>
                <li>ホーム端に立つ人影として現れる。</li>
                <li>終電間際の一人客に近づく傾向。</li>
                <li>最初の異変は「肩を叩かれた感覚」。</li>
              </ul>
            `;
            break;
          case "forest_boundary":
            html = `
              <p>【境界の守り人：特徴メモ】</p>
              <ul>
                <li>森と人の世界の“境界”に現れる。</li>
                <li>通り過ぎる者を黙って見つめている。</li>
                <li>近づくと森の音が消える。</li>
              </ul>
            `;
            break;
          case "riverside_girl":
            html = `
              <p>【水面を覗く娘：特徴メモ】</p>
              <ul>
                <li>川辺で水面を覗き込んでいる姿が目撃される。</li>
                <li>溺れた誰かの声を真似て名前を呼ぶ。</li>
                <li>声の主を追って水辺に近づくと危険。</li>
              </ul>
            `;
            break;
          case "ruin_faceless":
            html = `
              <p>【顔なしの住人：特徴メモ】</p>
              <ul>
                <li>顔が存在しないが、視線だけは強く感じる。</li>
                <li>廃墟に長くいる者の夢にたびたび現れる。</li>
                <li>近づくと輪郭が曖昧になっていく。</li>
              </ul>
            `;
            break;
          case "tunnel_voice":
            html = `
              <p>【囁く声まね：特徴メモ】</p>
              <ul>
                <li>知っている人物の声で呼びかけてくる。</li>
                <li>振り向くかどうかで被害の有無が変わるという噂。</li>
                <li>トンネル内でのみ声が聞こえることが多い。</li>
              </ul>
            `;
            break;
          case "backalley_steps":
            html = `
              <p>【もう1つの足音：特徴メモ】</p>
              <ul>
                <li>人数より足音の数が多くなる。</li>
                <li>曲がり角を曲がるたびに距離が縮まる。</li>
                <li>振り返っても姿は見えない。</li>
              </ul>
            `;
            break;
          case "station_shadow":
            html = `
              <p>【ホーム端の影：特徴メモ】</p>
              <ul>
                <li>光源とは矛盾した方向に影が伸びる。</li>
                <li>終電間際のホーム端に出没する。</li>
                <li>視線を向けると動きを止めるが、目を離すと位置が変わっている。</li>
              </ul>
            `;
            break;
          default:
            html = "<p>シナリオ情報を読み込めませんでした。</p>";
        }
      }
    }
  
    if (!html) {
      html = "<p>情報が読み込めませんでした。</p>";
    }
    content.innerHTML = html;
  }
  
  // ==============================
  // 特定パート UI
  // ==============================
  
  function renderIdentifyBlanks() {
    const container = document.getElementById("fill-blanks");
    if (!container) return;
  
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
  
  // 「特定失敗」演出
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
  
  // 黒フェードアウト → リロード
  function startFadeOut() {
    const overlay = document.getElementById("overlay-black");
    if (!overlay) return;
  
    overlay.classList.remove("hidden");
    requestAnimationFrame(() => {
      overlay.classList.add("show");
      setTimeout(() => {
        location.reload();
      }, 1500);
    });
  }
  
  // ==============================
  // マップ画面：位置情報 → レーダー円の中に実マップ
  // ==============================
  
  function initMapScreen() {
    const status = document.getElementById("map-status");
    const startBtn = document.getElementById("start-investigation");
    const kaijiDot = document.getElementById("radar-kaiji");
  
    if (status) status.textContent = "周辺の怪異反応をスキャン中...";
    if (startBtn) startBtn.classList.add("hidden");
    if (kaijiDot) kaijiDot.classList.add("hidden");
  
    console.log("[geo] initMapScreen start");
  
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log("[geo] success:", pos.coords);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (status) {
            status.textContent = "現在地の取得に成功しました。";
          }
          runMapScenario([lat, lng]);
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
  
          // フォールバック（渋谷駅付近）
          runMapScenario([35.6595, 139.7005]);
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
      runMapScenario([35.6595, 139.7005]);
    }
  }
  
  function runMapScenario(playerLatLng) {
    const status = document.getElementById("map-status");
    const startBtn = document.getElementById("start-investigation");
    const kaijiDot = document.getElementById("radar-kaiji");
  
    // ★ シナリオはここからランダムで選ばれる
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
  
    const center = playerLatLng || scenario.centerLatLng;
  
    // Leaflet マップ
    try {
      const map = L.map("real-map", {
        zoomControl: false,
        attributionControl: false,
      }).setView(center, 16);
  
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);
  
      L.marker(center, { title: "現在地" }).addTo(map);
  
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    } catch (e) {
      console.warn("Leaflet マップ初期化エラー:", e);
    }
  
    // レーダー内の怪異点位置
    if (scenario.spawnOffset && kaijiDot) {
      kaijiDot.style.left = scenario.spawnOffset.xPercent + "%";
      kaijiDot.style.top = scenario.spawnOffset.yPercent + "%";
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
  
    // 調査開始 → 会話へ
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
  
    // 会話クリックで進行（メニュー以外）
    const dialogScreen = document.getElementById("screen-dialog");
    if (dialogScreen) {
      dialogScreen.addEventListener("click", (e) => {
        if (e.target.closest("#menu-btn") || e.target.closest(".menu-overlay"))
          return;
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
  