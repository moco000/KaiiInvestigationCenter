// js/scenarios.js
// シナリオと怪異タイプ関連のデータ

// 怪異タイプ
const YOKAI_TYPES = {
    DROWNED_SPIRIT: "drowned_spirit",
    CHILD_APPARITION: "child_apparition",
    SHADOW_HUMAN: "shadow_human",
};

// ロケーションタイプ
const LOCATION_TYPES = {
    SEA: "sea",
    RESIDENTIAL: "residential",
    STATION: "station",
};

// シナリオ一覧
// ★ここにシナリオを増やしていく★
const SCENARIOS = [
    // 1. 海沿い（所長＋分岐多め）
    {
        id: "seaside_woman",
        title: "防波堤の女",
        locationType: LOCATION_TYPES.SEA,
        yokaiType: YOKAI_TYPES.DROWNED_SPIRIT,

        map: {
            centerLatLng: [35.6295, 139.7705],
            spawnOffset: { xPercent: 70, yPercent: 25 },
        },

        // ★出現時間帯（24h表記）例：11:00〜翌11:59
        timeWindow: {
            startHour: 11,
            endHour: 12,  // 日付またぎは start > end で表現
        },

        background: "assets/bg/bg_seaside_night.jpg",

        introLines: [
            // ▼ 所長パート
            {
                speaker: "所長",
                expression: "neutral",
                text: "今回の案件は海沿いの防波堤だ。夜間に“海を覗き込む影”の通報が続いている。",
            },
            {
                speaker: "所長",
                expression: "angry",
                text: "落水事故が続けば、センターへの風当たりも強くなる。手早く片づけてこい。",
            },
            {
                speaker: "調査員",
                expression: "serious",
                text: "了解。現地で状況を確認する。",
            },
            {
                speaker: "助手",
                expression: "worried",
                text: "現場に着いたら、まずは証言と痕跡を集めましょう。",
            },

            // ▼ 現場パート
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

            // ▼ 選択肢1：どこから調べる？
            {
                speaker: "調査員",
                expression: "neutral",
                text: "さて……どこから見るべきか。",
                choices: [
                    { text: "海面の様子を調べる", gotoLabel: "sea_surface" },
                    { text: "足場・防波堤の上を確認する", gotoLabel: "sea_footprints" },
                    { text: "周囲の人影・街灯の死角を見る", gotoLabel: "sea_shadow" },
                ],
            },

            // ▼ パスA：海面
            {
                label: "sea_surface",
                speaker: "助手",
                expression: "worried",
                text: "海面、波は穏やかですね。でも……時々、揺れ方が不自然です。",
            },
            {
                speaker: "調査員",
                expression: "serious",
                text: "波では説明しづらい揺れか。何かが水面近くをうろついている……？",
            },

            // ▼ パスB：足跡
            {
                label: "sea_footprints",
                speaker: "助手",
                expression: "worried",
                text: "防波堤の上、足跡の跡が薄く残ってます。海へ向かって一方通行ですね。",
            },
            {
                speaker: "調査員",
                expression: "serious",
                text: "戻りの足跡がない……落ちたのか、自分から飛び込んだのか。",
            },

            // ▼ パスC：影・死角
            {
                label: "sea_shadow",
                speaker: "助手",
                expression: "worried",
                text: "街灯の死角、多いですね。ここからなら、誰かが海を覗いていても気づかれにくいです。",
            },
            {
                speaker: "調査員",
                expression: "serious",
                text: "監視されている感覚を覚える位置、というわけか。",
            },

            // ▼ 共通：通報者の話
            {
                speaker: "助手",
                expression: "worried",
                text: "通報者は『海から誰かに呼ばれた気がする』とも言っていました。",
            },

            // ▼ 選択肢2：証言の解釈
            {
                speaker: "調査員",
                expression: "neutral",
                text: "“呼ばれた感覚”か……どう見る？",
                choices: [
                    {
                        text: "通報者の証言を信じ、怪異側の意思と考える",
                        gotoLabel: "route_trust",
                    },
                    {
                        text: "証言の矛盾を疑い、心理的要因を優先する",
                        gotoLabel: "route_doubt",
                    },
                    {
                        text: "どちらとも決めつけず、中立に記録する",
                        gotoLabel: "route_neutral",
                    },
                ],
            },

            // ▼ ルートA：信じる
            {
                label: "route_trust",
                speaker: "調査員",
                expression: "serious",
                text: "呼びかけがあるなら、単なる幻覚では済まないな。明確な“意思”を感じる。",
            },
            {
                speaker: "助手",
                expression: "worried",
                text: "怪異側から“こちらを認識している”可能性があるってこと？",
            },
            {
                speaker: "調査員",
                expression: "serious",
                text: "ああ。向こうもこちらを選んでいるかもしれない。",
            },

            // ▼ ルートB：疑う
            {
                label: "route_doubt",
                speaker: "調査員",
                expression: "serious",
                text: "通報者自身の精神状態も考慮すべきだな。ストレスや噂による誘導もありえる。",
            },
            {
                speaker: "助手",
                expression: "worried",
                text: "たしかに、事故現場の近くに住んでいたら……思い込みも強くなりそう。",
            },
            {
                speaker: "調査員",
                expression: "neutral",
                text: "とはいえ、足跡など物証は実際に残っている。完全な錯覚とも言い切れない。",
            },

            // ▼ ルートC：中立
            {
                label: "route_neutral",
                speaker: "調査員",
                expression: "neutral",
                text: "今は断定を避けよう。『呼ばれた感覚』というキーワードだけ記録しておく。",
            },
            {
                speaker: "助手",
                expression: "worried",
                text: "要因は複合的かもしれませんしね……。",
            },

            // ▼ 選択肢3：考えられる仮説
            {
                speaker: "助手",
                expression: "worried",
                text: "ここまでの情報から、どんな怪異が想定できます？",
                choices: [
                    {
                        text: "“水死者”系の怪異が、同じ場所に人を引き込んでいる",
                        gotoLabel: "sea_hypo_drown",
                    },
                    {
                        text: "この場所そのものに“落ちてくる”よう仕向ける何かがいる",
                        gotoLabel: "sea_hypo_place",
                    },
                    {
                        text: "人の恐怖心が、形のない“声”として増幅しているだけ",
                        gotoLabel: "sea_hypo_mind",
                    },
                ],
            },

            {
                label: "sea_hypo_drown",
                speaker: "調査員",
                expression: "serious",
                text: "過去の水難事故の残滓……溺死した誰かが、同じ結末を繰り返そうとしている可能性が高い。",
            },
            {
                label: "sea_hypo_place",
                speaker: "調査員",
                expression: "serious",
                text: "この防波堤そのものが“境界”になっているのかもしれない。落差と暗さは、格好の誘導装置だ。",
            },
            {
                label: "sea_hypo_mind",
                speaker: "調査員",
                expression: "neutral",
                text: "噂と恐怖が重なれば、人は勝手に“声”を聞き始める。だが、足跡だけは説明がつかないな。",
            },

            // ▼ 共通終端
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
                key: "appearance",
                label: "怪異の姿",
                choices: ["ずぶ濡れの女", "黒い犬", "顔のない子供"],
                correctIndex: 0,
            },
            {
                key: "place",
                label: "出没場所",
                choices: ["廃トンネル", "海沿いの防波堤", "公園のトイレ"],
                correctIndex: 1,
            },
            {
                key: "behavior",
                label: "行動傾向",
                choices: ["海の底を覗き込む", "笑い声を響かせる", "電話ボックスに現れる"],
                correctIndex: 0,
            },
        ],

        menu: {
            evidence: `
        <p>【防波堤の女：証拠品】</p>
        <ul>
          <li>濡れた足跡の写真：防波堤から海に向かって続く足跡。</li>
          <li>釣り人の証言メモ：「ずぶ濡れの女が、海の底を覗き込んでいた」。</li>
        </ul>
      `,
            memo: `
        <p>【防波堤の女：特徴メモ】</p>
        <ul>
          <li>ずぶ濡れの女の姿をしている。</li>
          <li>海沿いの防波堤に出没。</li>
          <li>ひたすら海の底を覗き込んでいる。</li>
        </ul>
      `,
        },
    },

    // 2. 住宅街（選択肢多め）
    {
        id: "residential_noise",
        title: "路地裏の足音",
        locationType: LOCATION_TYPES.RESIDENTIAL,
        yokaiType: YOKAI_TYPES.CHILD_APPARITION,

        map: {
            centerLatLng: [35.646, 139.68],
            spawnOffset: { xPercent: 30, yPercent: 40 },
        },

        background: "assets/bg/bg_residential_night.jpg",

        introLines: [
            // ▼ 所長ブリーフィング
            {
                speaker: "所長",
                expression: "neutral",
                text: "次は住宅街だ。子どもの足音が“ついてくる”という相談が集中している。",
            },
            {
                speaker: "所長",
                expression: "angry",
                text: "住民不安が広がる前に芽を摘め。ご近所トラブルに発展されると面倒だ。",
            },
            {
                speaker: "調査員",
                expression: "serious",
                text: "了解。現場で足取りを追ってみます。",
            },

            // ▼ 現場到着
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

            // ▼ 選択肢1：どの路地を追う？
            {
                speaker: "助手",
                expression: "neutral",
                text: "路地が入り組んでますね……どこから回ります？",
                choices: [
                    { text: "細くて暗い路地から入る", gotoLabel: "resi_narrow" },
                    { text: "人通りの多い通り沿いから歩く", gotoLabel: "resi_main" },
                    { text: "公園の横を抜けるルートを見る", gotoLabel: "resi_park" },
                ],
            },

            {
                label: "resi_narrow",
                speaker: "調査員",
                expression: "serious",
                text: "足音の怪異は、狭いところで響きやすい。まずは一番暗い場所からだ。",
            },
            {
                label: "resi_main",
                speaker: "調査員",
                expression: "neutral",
                text: "人通りがある場所で現れるなら、目撃者も多いはずだ。まずはそこを押さえよう。",
            },
            {
                label: "resi_park",
                speaker: "調査員",
                expression: "neutral",
                text: "子どもの気配が強いなら、公園周辺も怪しい。近くから確認していこう。",
            },

            // ▼ 証拠入手
            {
                speaker: "調査員",
                expression: "serious",
                text: "……この電柱の陰、何か置いてあるな。",
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

            // ▼ 選択肢2：足音が聞こえてきたら？
            {
                speaker: "助手",
                expression: "worried",
                text: "……今、聞こえました？　小さな足音。どうします？",
                choices: [
                    { text: "立ち止まって、足音が追い付くのを待つ", gotoLabel: "resi_wait" },
                    { text: "あえて早歩きして、距離の変化を見る", gotoLabel: "resi_fast" },
                    { text: "路地の曲がり角に隠れて様子をうかがう", gotoLabel: "resi_hide" },
                ],
            },

            {
                label: "resi_wait",
                speaker: "調査員",
                expression: "serious",
                text: "ここで止まる。怪異が“追いついた瞬間”の反応を見たい。",
            },
            {
                label: "resi_fast",
                speaker: "調査員",
                expression: "serious",
                text: "少し早歩きしよう。足音が本当に追ってくるなら、間隔が変わるはずだ。",
            },
            {
                label: "resi_hide",
                speaker: "調査員",
                expression: "neutral",
                text: "角に身を隠す。足音の主が姿を現すかどうか、確認しよう。",
            },

            {
                speaker: "助手",
                expression: "worried",
                text: "……やっぱり、姿は見えないのに足音だけが近づいてきますね。",
            },

            // ▼ 選択肢3：怪異像の仮説
            {
                speaker: "調査員",
                expression: "neutral",
                text: "この挙動から考えられるのは……",
                choices: [
                    {
                        text: "遊び足りない子どもの霊が、誰かと“追いかけっこ”をしている",
                        gotoLabel: "resi_hypo_child",
                    },
                    {
                        text: "過去の事故現場に縛られた足音だけの残滓",
                        gotoLabel: "resi_hypo_residue",
                    },
                    {
                        text: "住民のストレスが“気配”として積もっている",
                        gotoLabel: "resi_hypo_stress",
                    },
                ],
            },

            {
                label: "resi_hypo_child",
                speaker: "調査員",
                expression: "serious",
                text: "“追いかけっこ”が終わっていない子どもの霊。誰かが振り返るのを、ひたすら待っているのかもしれない。",
            },
            {
                label: "resi_hypo_residue",
                speaker: "調査員",
                expression: "serious",
                text: "足音だけが残った残滓……事故当時の“逃げようとした足取り”が再生されている可能性がある。",
            },
            {
                label: "resi_hypo_stress",
                speaker: "調査員",
                expression: "neutral",
                text: "閉塞感のある住宅街だ。住民のストレスが、“誰かがついてくる感覚”として立ち上がっているのかもな。",
            },

            // ▼ 共通終端
            {
                speaker: "助手",
                expression: "worried",
                text: "……でも、子供靴が並べられていたのは、やっぱり気になりますね。",
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
                key: "identity",
                label: "怪異の正体",
                choices: ["元住人の男", "遊び足りない子供の霊", "通りすがりの犬"],
                correctIndex: 1,
            },
            {
                key: "phenomenon",
                label: "特徴的な現象",
                choices: ["窓ガラスが割れる", "背後から足音が追ってくる", "電柱が揺れる"],
                correctIndex: 1,
            },
            {
                key: "time",
                label: "出没しやすい時間帯",
                choices: ["深夜0〜3時", "夕方18〜20時", "昼の12〜15時"],
                correctIndex: 0,
            },
        ],

        menu: {
            evidence: `
        <p>【路地裏の足音：証拠品】</p>
        <ul>
          <li>擦り減った子供靴の写真：路地裏の電柱の陰に並べられていた。</li>
          <li>主婦の証言メモ：「角を曲がるたびに足音が一歩分近づいている気がする」。</li>
        </ul>
      `,
            memo: `
        <p>【路地裏の足音：特徴メモ】</p>
        <ul>
          <li>子供の足音だけが聞こえる。</li>
          <li>住宅街の細い路地に出没。</li>
          <li>背後からついてくるように足音が近づいてくる。</li>
        </ul>
      `,
        },
    },

    // 3. 駅前（選択肢多め）
    {
        id: "station_stalker",
        title: "終電ホームの影",
        locationType: LOCATION_TYPES.STATION,
        yokaiType: YOKAI_TYPES.SHADOW_HUMAN,

        map: {
            centerLatLng: [35.6595, 139.7005],
            spawnOffset: { xPercent: 72, yPercent: 20 },
        },

        background: "assets/bg/bg_station_night.jpg",

        introLines: [
            // ▼ 所長ブリーフィング
            {
                speaker: "所長",
                expression: "neutral",
                text: "最後は駅だ。終電間際のホームで“肩を叩かれる”現象が多発している。",
            },
            {
                speaker: "所長",
                expression: "angry",
                text: "鉄道会社からも正式に依頼が来ている。変な動画がバズる前に処理してこい。",
            },
            {
                speaker: "調査員",
                expression: "serious",
                text: "了解。監視カメラと現場の気配を確認します。",
            },

            // ▼ 現場パート
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

            // ▼ 選択肢1：どこから見る？
            {
                speaker: "助手",
                expression: "neutral",
                text: "ホームも広いですし……どこから見ます？",
                choices: [
                    { text: "ホーム端の線路ぎりぎり", gotoLabel: "st_end" },
                    { text: "階段・エスカレーター周辺", gotoLabel: "st_stairs" },
                    { text: "監視カメラの死角になりやすい場所", gotoLabel: "st_blind" },
                ],
            },

            {
                label: "st_end",
                speaker: "調査員",
                expression: "serious",
                text: "落下や転落が起こりやすいのはホーム端だ。まずはそこを押さえる。",
            },
            {
                label: "st_stairs",
                speaker: "調査員",
                expression: "neutral",
                text: "動線が集中する階段付近は、違和感があっても気づきにくい。要チェックだな。",
            },
            {
                label: "st_blind",
                speaker: "調査員",
                expression: "serious",
                text: "監視カメラの死角は、怪異にとっても“隠れ場所”かもしれない。",
            },

            // ▼ 証拠入手
            {
                system: "unlockEvidence",
                text: "【新規情報】ホーム端の監視カメラ静止画／駅員の証言メモを入手した。",
            },
            {
                speaker: "助手",
                expression: "worried",
                text: "映像では、ホーム端に“映ってはいけない影”が一瞬だけ見えます。",
            },

            // ▼ 選択肢2：駅員から何を聞く？
            {
                speaker: "調査員",
                expression: "neutral",
                text: "駅員にも話を聞こう。何を優先して聞く？",
                choices: [
                    { text: "被害が起きた時間帯", gotoLabel: "st_q_time" },
                    { text: "被害者の共通点", gotoLabel: "st_q_victim" },
                    { text: "ホームの“嫌な場所”の感覚", gotoLabel: "st_q_spot" },
                ],
            },

            {
                label: "st_q_time",
                speaker: "助手",
                expression: "worried",
                text: "終電の一本前から終電まで、が多いみたいですね……。",
            },
            {
                label: "st_q_victim",
                speaker: "助手",
                expression: "worried",
                text: "一人で帰る乗客ばかり、だそうです。酔客も多い時間帯で……。",
            },
            {
                label: "st_q_spot",
                speaker: "助手",
                expression: "worried",
                text: "駅員さん曰く、『ホーム端の、決まった柱の近くがなんとなく嫌な感じがする』とのことです。",
            },

            // ▼ 選択肢3：現象の解釈
            {
                speaker: "調査員",
                expression: "neutral",
                text: "“肩を叩かれる”現象から、どんな意図が見える？",
                choices: [
                    {
                        text: "線路側へ振り向かせて、落とそうとしている",
                        gotoLabel: "st_hypo_push",
                    },
                    {
                        text: "ただ存在を気づいてほしいだけの、弱いアピール",
                        gotoLabel: "st_hypo_notice",
                    },
                    {
                        text: "生前の“クセ”が怪異になって繰り返されている",
                        gotoLabel: "st_hypo_habit",
                    },
                ],
            },

            {
                label: "st_hypo_push",
                speaker: "調査員",
                expression: "serious",
                text: "線路側に体の向きを変えさせて、バランスを崩させる。かなり攻撃的な意図だな。",
            },
            {
                label: "st_hypo_notice",
                speaker: "調査員",
                expression: "neutral",
                text: "ただ“気づいてほしい”だけなら、さらなる段階があるかもしれない。無視され続ければ、行動がエスカレートする。",
            },
            {
                label: "st_hypo_habit",
                speaker: "調査員",
                expression: "neutral",
                text: "生前、人の肩を叩いて呼び止めるクセがあったのかもしれない。その行動だけが残っている、という線もある。",
            },

            // ▼ 共通終端
            {
                speaker: "調査員",
                expression: "serious",
                text: "そろそろ正体を絞り込むか。",
            },
            { goto: "identify" },
        ],

        identifyBlanks: [
            {
                key: "target",
                label: "怪異が狙う相手",
                choices: ["朝の通勤客", "終電間際の一人客", "修学旅行生の集団"],
                correctIndex: 1,
            },
            {
                key: "position",
                label: "怪異の位置",
                choices: ["ホーム中央", "階段付近", "ホーム端の線路ぎりぎり"],
                correctIndex: 2,
            },
            {
                key: "firstSign",
                label: "最初の異変",
                choices: ["肩を叩かれる感覚", "急に寒くなる", "電車のアナウンスが乱れる"],
                correctIndex: 0,
            },
        ],

        menu: {
            evidence: `
        <p>【終電ホームの影：証拠品】</p>
        <ul>
          <li>監視カメラ静止画：ホーム端に“余計な影”が写り込んでいる。</li>
          <li>駅員の証言メモ：「肩を叩かれたと思って振り向いたが誰もいなかった」。</li>
        </ul>
      `,
            memo: `
        <p>【終電ホームの影：特徴メモ】</p>
        <ul>
          <li>ホーム端に立つ人影として現れる。</li>
          <li>終電間際の一人客に近づく傾向。</li>
          <li>最初の異変は「肩を叩かれた感覚」。</li>
        </ul>
      `,
        },
    },

    // ★この下に新しいシナリオを追加していく
    {
        id: "chief_meeting",
        title: "所長との定例ミーティング",
        type: "dialog-only",   // ★これが重要（game.js がこのタイプを見て分岐する）

        background: "assets/bg/bg_office.jpg",

        introLines: [
            {
                speaker: "所長",
                expression: "neutral",
                text: "お、来たな。今月の調査報告をまとめてもらおうか。",
            },
            {
                speaker: "調査員",
                expression: "serious",
                text: "はい。最近は住宅街での怪異発生件数が増えています。",
            },
            {
                speaker: "所長",
                expression: "smile",
                text: "お前の目で見て感じたことを聞きたい。数字じゃなくて、“空気”の話だ。",
            },
            {
                speaker: "調査員",
                text: "……感じること、と言いますと？",
            },

            // ▼ 選択肢もOK（そのまま次の行に進む）
            {
                speaker: "所長",
                expression: "neutral",
                text: "最近の怪異の傾向、どっちだと思う？",
                choices: [
                    { text: "人間を狙うようになっている気がする", gotoLabel: "ans1" },
                    { text: "むしろ大人しくなってきている", gotoLabel: "ans2" }
                ]
            },

            {
                label: "ans1",
                speaker: "調査員",
                text: "確かに……直接干渉する怪異が増えている印象があります。",
            },
            {
                label: "ans1",
                speaker: "所長",
                expression: "angry",
                text: "やはりか。センターの役目がますます重要になるな。",
            },

            {
                label: "ans2",
                speaker: "調査員",
                text: "むしろ最近は痕跡だけ残して消える例も多いですね。",
            },
            {
                label: "ans2",
                speaker: "所長",
                expression: "neutral",
                text: "ふむ……興味深いな。何か理由があるかもしれん。",
            },

            // ▼ 共通
            {
                speaker: "所長",
                expression: "smile",
                text: "あまり無理をするなよ。お前が倒れたら困るんだ。",
            },
            {
                speaker: "調査員",
                expression: "neutral",
                text: "……ありがとうございます、所長。",
            },
            {
                goto: "end"
            }
        ],

        // 怪異特定なしなのでこれらは空
        identifyBlanks: [],
        menu: {},
    }

];
