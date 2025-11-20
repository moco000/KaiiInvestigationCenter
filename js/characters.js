// js/characters.js
// キャラクター定義と、会話スクリプト中の speaker 名 → キャラID のマッピング

/**
 * CHARACTERS
 *
 * - key: ゲーム内部で使うキャラID
 * - displayName: テキストに出したい名前（図鑑などで使う想定）
 * - side: "left" or "right"（立ち絵の固定位置）
 * - defaultExpression: セリフに expression 指定がないときの表情キー
 * - sprites: { 表情キー: 画像パス }
 *
 * 画像パスはプロジェクト内の構成に合わせて変更してOK。
 * （今の想定は：assets/char/ 以下に png を置く）
 */

const CHARACTERS = {
    // ▼ プレイヤー（調査員）
    player: {
        id: "player",
        displayName: "調査員",
        side: "left",
        defaultExpression: "neutral",
        sprites: {
            neutral: "assets/char/player_neutral.png",
            serious: "assets/char/player_serious.png",
            surprised: "assets/char/player_surprised.png",
        },
    },

    // ▼ 助手
    assistant: {
        id: "assistant",
        displayName: "助手",
        side: "right",
        defaultExpression: "neutral",
        sprites: {
            neutral: "assets/char/partner_neutral.png",
            smile: "assets/char/partner_smile.png",
            worried: "assets/char/partner_worried.png",
        },
    },

    // ▼ 所長（今はまだシナリオには出してないけど、今後用の枠）
    // 画像ファイルを用意したら sprites のパスを差し替えて使う
    chief: {
        id: "chief",
        displayName: "所長",
        side: "right",
        defaultExpression: "neutral",
        sprites: {
            neutral: "assets/char/chief_neutral.png",
            angry: "assets/char/chief_angry.png",
            smile: "assets/char/chief_smile.png",
        },
    },

    // ▼ 追加キャラ例：依頼人（女子高生）
    client_girl: {
        id: "client_girl",
        displayName: "依頼人（女子高生）",
        side: "right",
        defaultExpression: "neutral",
        sprites: {
            neutral: "assets/char/client_girl_neutral.png",
            sad: "assets/char/client_girl_sad.png",
            scared: "assets/char/client_girl_scared.png",
            smile: "assets/char/client_girl_smile.png",
        },
    },

    // ▼ 追加キャラ例：近所のおばさん
    old_lady: {
        id: "old_lady",
        displayName: "近所の主婦",
        side: "right",
        defaultExpression: "neutral",
        sprites: {
            neutral: "assets/char/old_lady_neutral.png",
            talk: "assets/char/old_lady_talk.png",
            worried: "assets/char/old_lady_worried.png",
        },
    },

    // ▼ 追加キャラ例：サラリーマン
    salaryman: {
        id: "salaryman",
        displayName: "サラリーマン",
        side: "right",
        defaultExpression: "neutral",
        sprites: {
            neutral: "assets/char/salaryman_neutral.png",
            scared: "assets/char/salaryman_scared.png",
            angry: "assets/char/salaryman_angry.png",
        },
    },
};

/**
 * SPEAKER_ALIAS
 *
 * シナリオ側（scenarios.js）の `introLines` などで書く `speaker` の文字列を、
 * どの CHARACTERS に紐付けるかを定義するマッピング。
 *
 * 例：
 *   speaker: "調査員" → CHARACTERS.player
 *   speaker: "助手"   → CHARACTERS.assistant
 *
 * => シナリオを書くときは「セリフに出したい名前」で書けばOK。
 */

const SPEAKER_ALIAS = {
    調査員: "player",
    助手: "assistant",
    所長: "chief",
    依頼人: "client_girl",
    近所の主婦: "old_lady",
    サラリーマン: "salaryman",
};
