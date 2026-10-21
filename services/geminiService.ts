import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const APPEAL_POINTS = [
  '頑張りをしっかり評価',
  '転勤の心配なし',
  '残業少め(1日1時間以内)',
  '駅近の快適なオフィス',
  'ワークライフバランスを重視',
  '福利厚生が自慢',
  '教育制度・研修が充実',
  '専門性・スキルが身につく',
  '商品・サービスの知名度が高い',
  '新規事業に挑戦できる',
  '裁量を持って働ける',
];

interface AppealPointInstruction {
  pointName: string;
  customInstruction: string;
}

const RE_KATSU_GUIDELINES = `
求人原稿基本ルール
★求人広告各項目での規定

項目 | 規定
--- | ---
##求める人材 | 
【作成ルール】
1. **冒頭の導入文（必須）**: 最上部に50文字以内のシンプルで引きのあるタイトル／導入文を記載する。
   （例: ・社会人未経験もOK／安定した環境で一生のものの専門性・スキルを身につけたい方）
2. **文字数制限**: 取材内容から条件やターゲット要素を詰め込み、【400文字以内】で再構成する。
3. **構成フォーマット**: 以下の要素を用いて構成する。
   ・＜必須条件＞（学歴・資格・経験など）
   ・★育成やサポート体制のコメント（未経験でも安心できるフォロー体制）
   ・＜こんな方を歓迎します！＞ または ＜歓迎条件＞
   ・＼こんな方が活躍しています／（先輩の前職例や求める想い）
4. **法令・媒体禁止事項**:
   ・「29歳まで」「女性限定」など年齢・性別制限は不可（例外事由を除く）。
   ・「明るい方」などの主観的性格ではなく「明るく元気な対応ができる方」など具体的行動で示す。

##勤務地 | 
【作成ルール】
・取材内容に基づき、都道府県名から正確に記載する。「関東」「関西」などの広域表現は禁止。
・郵便番号・住所が判明している場合はセットで記載する（例: 〒577-0034 大阪府東大阪市御厨南1-4-38）。
・最寄り駅からのアクセス（近鉄奈良線「八戸ノ里駅」より徒歩6分 など）を明記する。
・転勤の有無、リモートワーク可否、U・I・Jターン歓迎などの補足も記載する。

##勤務時間 | 
【作成ルール】
・取材内容に基づき、実働時間・休憩時間を必ず明記する。
・時刻区切りのコロンは【全角（：）】を厳守すること（NG: 9:00～18:00 → OK: 9：00～18：00）。
・シフト制やフレックスタイム制の場合は、標準的な勤務時間例を記載する。

##給与 | 
「月給」「年俸」などを明記し、手当やインセンティブが含まれる場合は「一律〇〇手当含む」「＋インセンティブ」などの注釈を入れる。
試用期間中に待遇が変わる場合はその詳細を記載する。

##選考の案内 | 
【作成ルール】
・応募から内定までのステップ（①Web応募 → ②カジュアル面談／面接 → ③内定）を明確に記載する。
・面接形態（対面／Web面接）、面接回数、カジュアル面談の実施有無を明記する。
・求職者の応募ハードルを下げる温かいメッセージを含めて記載する。

■RULES DEFINITION
#### 1. Unification (Strict Literal Match Only)
| NG Pattern | Correct | Note |
| そんな中 | そんななか | |
| する時 | するとき | |
| 更に | さらに | |
| 為 | ため | |
| …| …… |…を連続させる |
| 作る / 造る | つくる | Exception: "未来を創る", "市場を創る" are OK. |
| その上 | そのうえ | |
| みなさん | 皆さん | |
| 上手く | うまく | |
| 是非 | ぜひ | |
| 分かる | わかる | |
| ～の度に | ～のたびに | |
| ～な所 | ～なところ | |
| その分 | そのぶん | |
| 気付く | 気づく | Strictly "気付" only. |
| 身に付く | 身につく | Strictly "身に付" only. |
| 要りません | いりません | |
| ～が無い | ～がない | |
| 無し | なし | |
| 沢山 | たくさん | |
| ～し得る | ～しうる | |
| ～の他 | ～のほか | |
| ～の様に | ～のように | |
| 事 | こと | (Abstract noun) |
| 例えば | たとえば | |
| 致します | いたします | |
| ～と共に | ～とともに | |
| ～するさい | ～する際 | |
| 手掛ける | 手がける | |
| 全て | すべて | |
| もつ | 持つ | |
| ～を元に / 基に | ～をもとに | |
| かかわる | 関わる | |
| 捉われず / 囚われず | とらわれず | |
| 生かす | 活かす | |
| 確かに | たしかに | |
| 踏まえて | ふまえて | |
| ～に繋がる | ～につながる | |
| ～の頃 | ～のころ | |
| ～当たり / 当り | ～あたり | |
| ～過ぎる | ～すぎる | |
| 基づく | もとづく | |
| 一つ | ひとつ / 1つ | |
| 一人 | ひとり | |
| 一から | イチから | | 
| 弊社 | 当社 | Exception: President's message. |
| ヶ月 / カ月 / か月 | ヵ月 | Small "ヵ". |
| 年休 | 年間休日 | |
| WEB / ＷＥＢ | Web | |
| ZOOM / ＺＯＯＭ | Zoom | |
| YOUTUBE / Youtube | YouTube | |
| Re就活 | Ｒｅ就活 | Must be Full-width Ｒｅ. |
| 階 | F | (Address only) |
| 一日 | 1日 | |
| 特徴 | 特長 | (For strong points) |
| 思い | 想い | (Noun usage) |
| 適正を見る | 適性を見る | |
| 話ます | 話します | |

#### 2. Formatting & Numbers
* **Numbers:** Must be Half-width with commas for thousands (e.g., 1,000).
* **Alphanumerics:** Standard is Half-width (e.g., Web, AI).
* **Symbols:** Standard is Full-width (e.g., （）, ％, ！, ？).
* **Environment Dependent:** NG: ①, ⅰ, ㎡.

#### 3. Prohibited & Legal
* NO Age limits or Gender limits.
* Subjective traits (e.g. "明るい方" -> "明るく対応ができる方").
* Absolute NG: （仕事を）こなす/まわす -> （仕事に）取り組む, 作業 -> 業務.
* Re-Shukatsu Media Specific NG: "若年層", "フレッシュ", "人物重視", "ポテンシャル重視".
`;

const CATCHPHRASE_EXAMPLES = `
# 職種キャッチコピーと求人の概要の優れた例
**基本構成内容**
・Short and catchy
・Reflective of the job’s key selling points
・Free of extraneous information not found in the 【Job description】

For each of the 10 【Titles】: 50 Japanese letters, generate 3 corresponding 【Hooks】: 30 Japanese letters each.
Each hook should be a short, impactful bullet point based on concrete facts/numbers.

■Rules to follow
「～が私たちの使命です」といったメッセージ性の強すぎる表現は避け、各テンプレートのトーンと語り口を再現してください。

パターン①
【技術系事務職】未経験から病院設備を支える仕事へ！残業ほぼなし｜転勤なし｜年間休日120日
【事業安定性】日本最大級の医療インフラを支える、安定基盤
【教育体制◎】3～4年の「育成期間」で、未経験から着実に成長
個別説明会あり／住宅手当 各種休暇制度も充実

パターン②
【店長候補】お菓子専門店を220店舗展開！自由なアイデアで“ワクワクするお店”を創りませんか？
「このお菓子、絶対売れる」そう思ったら発注できる自由度の高さ
半年間かけてじっくり育成。少しずつ経験を積んでいける環境です
新店の出店が続いているからこそ、新たなポストも増えています

# 企業キャッチコピーの優れた例
・【東証スタンダード上場】2027年に設立100周年/地域に密着しながら人々の移動を支えています。
・【1937年創立】淡路島・神戸・明石に密着！Face to Faceで地域社会を支える信用金庫
・【自動車業界×IT】自社パッケージシステムで2,000社超の導入実績を誇るシステム会社！
・スマホ、デジカメ、webアプリ etc…身近な製品の「検証」≪未経験入社約95%・定着率90%≫
`;

export interface TemplateItem {
  name: string;
  path: string;
}

export interface TemplatePattern {
  name: string;
  items: TemplateItem[];
}

export interface TemplateSubsection {
  name: string;
  patterns: TemplatePattern[];
}

export interface TemplateSection {
  name: string;
  subsections: TemplateSubsection[];
}

export const parseTemplates = (templates: string): TemplateSection[] => {
  const lines = templates.split('\n');
  const allSections: TemplateSection[] = [];
  let currentSection: TemplateSection | null = null;
  let currentSubsection: TemplateSubsection | null = null;
  let currentPattern: TemplatePattern | null = null;

  const itemRegex = /^(①|②|③|④|⑤|⑥|⑦|⑧|⑨|⑩|Q\.)/;
  let currentItemContent: string[] = [];

  const flushCurrentItem = () => {
    if (currentItemContent.length > 0 && currentPattern) {
      const fullText = currentItemContent.join('\n').trim();
      const firstLine = currentItemContent[0].trim();
      currentPattern.items.push({
        name: firstLine,
        path: fullText,
      });
      currentItemContent = [];
    }
  };

  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      if (currentItemContent.length > 0) {
        currentItemContent.push(line);
      }
      return;
    }

    const isNewSection = trimmedLine.startsWith('## ');
    const isNewSubsection = trimmedLine.startsWith('### ');
    const isNewPattern = trimmedLine.startsWith('#### ');
    const isNewItem = itemRegex.test(trimmedLine) && currentPattern;

    if (isNewSection || isNewSubsection || isNewPattern || isNewItem) {
      flushCurrentItem();
    }
    
    if (isNewSection) {
      const name = trimmedLine.substring(3).trim();
      currentSection = { name, subsections: [] };
      allSections.push(currentSection);
      currentSubsection = null;
      currentPattern = null;
    } else if (isNewSubsection) {
      if (currentSection) {
        const name = trimmedLine.substring(4).trim();
        currentSubsection = { name, patterns: [] };
        currentSection.subsections.push(currentSubsection);
        currentPattern = null;
      }
    } else if (isNewPattern) {
      if (currentSection && currentSubsection) {
        const name = trimmedLine.substring(5).trim();
        currentPattern = { name, items: [] };
        currentSubsection.patterns.push(currentPattern);
      }
    } else if (isNewItem) {
      currentItemContent.push(trimmedLine);
    } else if (currentItemContent.length > 0) {
      currentItemContent.push(line);
    }
  });

  flushCurrentItem();
  return allSections;
};

const buildManuscriptChunk1Prompt = (
  interviewLog: string,
  sampleMessage: string,
  recruitmentTemplates: string
): string => {
  const sampleMessageSection = sampleMessage.trim()
    ? `
# 参照用サンプル原稿 (構造・トーンのベース)
以下のサンプル原稿の構造・見出し分け・トーン＆マナーを参考に原稿を作成してください。
※指示されているPR要素がある場合はすべて漏らさず網羅してください。
※文章の丸写しは厳禁とし、取材内容（インタビュー文字起こし）の事実情報に置き換えて執筆してください。
---
${sampleMessage}
---
`
    : '';

  return `
あなたは20代・若手向け転職サイト「Re就活」のプロの採用コピーライターです。
提供された【インタビュー文字起こし】から企業の魅力・リアリティを抽出し、ターゲット求職者の心に刺さる求人原稿の【第1段階チャンク】を作成してください。

■ 作成対象セクション（順序厳守）
1. **職種キャッチコピーと求人の概要のセット** (訴求角度が異なる3セット。各【タイトル】と【フック3点】で構成。フックは各日本語30文字以内厳守)
2. **企業キャッチコピー** (5つの提案)
3. **【企業からのメッセージ】** (見出しは太字 \`**【企業からのメッセージ】**\`。日本語1000文字〜1200文字以内。指示がある場合は要求要素をすべて網羅)
4. **【仕事内容】** (見出しは \`【仕事内容】\`。下に2つの提案を \`### 提案1\` \`### 提案2\` で提示。各提案最大950文字以内)

■ トーン＆マナー・執筆ガイド
・**親しみやすさと熱量:** 硬すぎるビジネス文体を避け、20代求職者の背中を優しく押すような、柔らかくポジティブな語り口（必要に応じて「！」や「〜してみませんか？」等の親しみやすい文末表現）にしてください。
・**テンプレの柔軟活用:** テンプレート集内の多様なトーン（安心感、成長・挑戦、フランクな解説等）を参考に、取材内容に最も合うニュアンスを組み合わせて表現してください。
・**見出しの表記ルール:** セクションタイトルには①、②などの番号や■、◆などの記号は一切付けず、Markdown H4（例: \`#### 未経験から一生モノのスキルを身につける\`）として作成してください。
・**事実遵守:** 誇張表現や事実と異なる創作は禁止し、インタビューの内容のみをソースとしてください。

■ 執筆ルール・NG表現
${RE_KATSU_GUIDELINES}

${CATCHPHRASE_EXAMPLES}

${sampleMessageSection}

【出力に関するルール】
・Markdownの太字装飾（**）は【企業からのメッセージ】の見出しおよびメッセージ内の項目の小見出しのみに使用してください。
・会話文や説明文（「承知しました」等）は含めず、セクション1〜4の本文のみを出力してください。

# インタビュー文字起こし (一次情報)
---
${interviewLog}
---

# ■ テンプレート集 (参照用)
---
${recruitmentTemplates}
---
`;
};

const buildManuscriptChunk2Prompt = (
  interviewLog: string,
  appealPointRules: AppealPointInstruction[],
  recruitmentTemplates: string,
  chunk1Text: string
): string => {
  const buildAppealPointInstructions = (rules: AppealPointInstruction[]): string => {
    if (rules.length === 0) return '選択されたアピールポイントはありません。';

    const instructions = rules.map(rule => {
      const customText = rule.customInstruction.trim();
      const hasSample = customText.length > 0;

      return `■ アピールポイント名: #### ${rule.pointName}
${hasSample ? `【語り口・文体・ボリュームの参照サンプル（※具体的数字や制度はインタビューから抽出してください）】\n${customText}` : '取材内容に基づいて、求職者に刺さる具体的な理由とエピソードを詳しく記述してください。'}`;
    }).join('\n\n---');

    return instructions;
  };

  const appealPointsContent = buildAppealPointInstructions(appealPointRules);

  return `
あなたは「Re就活」のプロの採用コピーライターです。
【インタビュー文字起こし】および【第1段階チャンクの原稿】を踏まえ、求人原稿の【第2段階チャンク】を完成させてください。

■ 作成対象セクション（順序厳守）
5. **# 募集要項** (ヘッダー行を持たない2列Markdown表形式。セル内改行は <br> タグを活用)
6. **【人事コメント】** (「#### 募集の背景」「#### 選考のポイント」に分けてそれぞれ約200文字)
7. **【アピールポイント】** (見出し \`【アピールポイント】\` の下に、指定された各ポイントを \`**#### 項目名**\` として太字出力し、各250文字以上を目安に詳細記述)
8. **【企業情報】** (設立, 代表者, 従業員数, 資本金, 売上高, 本社所在地, 事業所, 事業内容, HP, 採用サイト を抽出)

■ アピールポイント（AP）指示内容
---
${appealPointsContent}
---

■ 執筆・トーン＆マナーガイド
・第1段階で構築したトーン（親しみやすさ・温かみ・未経験者への寄り添い）を統一して維持してください。
・アピールポイントで参照サンプルが提示されている場合は、その「柔らかく親しみやすい語り口」や「制度・背景の丁寧な掘り下げ方」を再現してください（サンプル内の固有名詞や条件はコピーせず、取材内容の事実を使用すること）。
・人事コメントの見出しには①、②や記号等を付与せず、テキストのみ（#### 募集の背景）で記述してください。

■ 執筆ルール・NG表現
${RE_KATSU_GUIDELINES}

# 【参考】第1段階チャンクで生成された原稿
---
${chunk1Text}
---

【出力に関するルール】
・会話文や説明文は含めず、セクション5〜8の原稿本文のみを出力してください。

# インタビュー文字起こし (一次情報)
---
${interviewLog}
---

# ■ テンプレート集 (参照用)
---
${recruitmentTemplates}
---
`;
};

interface GenerationResult {
  text: string;
  sources: { uri: string; title: string }[];
}

export const generateJobDescription = async (
  interviewLog: string, 
  sampleMessage: string,
  appealPointRules: AppealPointInstruction[],
  recruitmentTemplates: string,
  catchphraseTemperature: number,
  manuscriptTemperature: number
): Promise<GenerationResult> => {
  try {
    const model = 'gemini-3.1-pro-preview';

    const chunk1Prompt = buildManuscriptChunk1Prompt(
      interviewLog, 
      sampleMessage,
      recruitmentTemplates
    );
    const chunk1Response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: chunk1Prompt }] },
      config: { temperature: manuscriptTemperature }
    });
    const chunk1Text = chunk1Response.text || '';
    
    const chunk2Prompt = buildManuscriptChunk2Prompt(
      interviewLog, 
      appealPointRules, 
      recruitmentTemplates,
      chunk1Text
    );
    const chunk2Response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: chunk2Prompt }] },
      config: { temperature: manuscriptTemperature }
    });
    const chunk2Text = chunk2Response.text || '';

    const sources = [
      ...(chunk1Response.candidates?.[0]?.groundingMetadata?.groundingChunks || []),
      ...(chunk2Response.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
    ]
      ?.map(chunk => chunk.web)
      .filter(web => web?.uri && web.title) as { uri: string; title: string }[] || [];

    const fullManuscript = `${chunk1Text.trim()}\n\n${chunk2Text.trim()}`;

    return { text: fullManuscript, sources };
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    const errorMessage = error?.message || error?.toString() || '';
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('credits')) {
      throw new Error("APIの利用制限（クレジット不足またはリクエスト上限）に達しました。しばらく時間をおいてから再度お試しいただくか、Google AI Studioのプロジェクトの支払い情報を確認してください。");
    }

    if (error instanceof Error) {
      throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("予期せぬエラーが発生しました。");
  }
};

export const formatForWebEditor = async (
  currentDescription: string
): Promise<string> => {
  const model = 'gemini-3.1-pro-preview';
  const prompt = `あなたはプロのWeb編集者です。
以下の【求人原稿の生テキスト】を読み込み、視覚的に階層がわかる綺麗なレイアウトに整形して出力してください。

【整形・レイアウトの厳格なルール】
1. 見出しの装飾（階層の表現）
   元テキストの HTMLタグ（<h2> 等）や Markdownの見出し記号（#）は一切出力しないでください。
   ※ただし、元テキストでMarkdownの太字装飾（**）が使われている場合は、そのまま出力して太字を保持してください。
   見出しについては、代わりに以下の記号のみを使用してください。
   ・大見出し（h2相当）：【〇〇】 （隅付き括弧のみ）
   ・小見出し（h3相当）：■ 〇〇 （四角マークのみ。ただし、「企業からのメッセージ」「人事コメント」「アピールポイント」内の小見出しやタイトルには、■や◆などの追加記号を付与せず、テキストのみを出力してください。元からある太字装飾（**）はそのまま残してください。）

2. <br>タグの改行処理
   テキスト内に含まれる <br> や <br><br> という文字列は、実際の改行に変換してください。

3. 箇条書き記号の自動改行
   文章中に「■」「・」「※」「▼」などの記号がある場合、必ずその記号の直前で改行し、リストとして見やすくしてください。

4. 項目と内容の分離
   項目名と内容が結合してしまっている部分は改行を挟み分離してください。

5. 本文の保持
   見出し以外の本文やメッセージの内容は省略や要約をせずにそのまま残してください。

【出力ルール】
会話文や説明文は含めず、整形された原稿のみを直接出力してください。

【求人原稿の生テキスト】
---
${currentDescription}
---`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: { temperature: 0.1 }
    });
    return response.text || currentDescription;
  } catch (error) {
    console.error("Error formatting for web editor:", error);
    throw new Error("Failed to format job description.");
  }
};

export const refineJobDescription = async (
  currentDescription: string,
  instruction: string,
  temperature: number,
  recruitmentTemplates?: string,
  tone: number = 50
): Promise<string> => {
  const model = 'gemini-3.1-pro-preview';

  let toneInstruction = "";
  if (tone !== 50 && recruitmentTemplates) {
    const direction = tone < 50 ? "カジュアル・柔らか・親しみやすい" : "堅実・フォーマル・論理的";
    const intensity = Math.abs(tone - 50) * 2;
    
    toneInstruction = `
    **Tone Adjustment Task:**
    Adjust the tone of the manuscript.
    - **Target Direction:** ${direction} (Scale: ${tone}/100)
    - **Intensity:** ${intensity}%
    
    Reference styles in the Template Collection to adjust phrasing, warmth, sentence endings, and vocabulary strength. Apply this tone shift to the entire manuscript while preserving core facts.
    `;
  }

  const prompt = `
  あなたはプロフェッショナルな求人原稿の編集者です。
  以下の「現在の求人原稿」に対して、ユーザーからの「修正指示」および「トーン調整」を適用し、原稿を改善・更新してください。
  
  **重要:**
  1. 修正指示に関連しない部分は、可能な限り元の内容と構造を維持してください。
  2. 「Re就活」のガイドラインに従ってください。
  3. 会話文や説明文は含めず、修正後の原稿本文のみを出力してください。

  **Re就活ガイドライン (抜粋):**
  ${RE_KATSU_GUIDELINES}
  
  ${toneInstruction}

  **修正指示:**
  ${instruction ? instruction : "特になし（トーン調整のみ適用してください）"}

  **現在の求人原稿:**
  ---
  ${currentDescription}
  ---
  
  ${recruitmentTemplates ? `
  **■ テンプレート集 (トーン参照用)**
  ---
  ${recruitmentTemplates}
  ---
  ` : ''}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: { temperature: temperature }
    });
    return response.text || currentDescription;
  } catch (error: any) {
    console.error("Error refining job description:", error);
    const errorMessage = error?.message || error?.toString() || '';
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('credits')) {
      throw new Error("APIの利用制限に達しました。しばらく時間をおいてから再度お試しください。");
    }
    throw new Error("Failed to refine job description.");
  }
};

export const generateSeniorEmployeeVoice = async (interviewLog: string): Promise<string> => {
  const model = 'gemini-3.1-pro-preview';
  const systemInstruction = `株式会社学情が提供するサービス「Ｒｅ就活」のライターとして、ユーザーが送信する取材内容を基に先輩社員の声を作成する。

取材内容から最も適する項目を3つ選択し、各約400文字で構成する。

IMPORTANT: Before the Q&A draft, output the senior employee's profile based on the interview log using exact bold labels:

【先輩社員】
**■先輩のイニシャル：**
**■職種：**
**■社歴：**
**■転職時の年齢：**
**■前職：**

Q&A Formatting: Format each question label in bold (e.g. **入社理由を教えてください。**).
Do not include conversational text or explanation. Output only the final manuscript.`;

  const prompt = `【interview】\n${interviewLog}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
      config: {
        temperature: 0.30,
        topP: 0.75,
        systemInstruction: systemInstruction,
      }
    });
    return response.text || '';
  } catch (error) {
    console.error("Error generating senior employee voice:", error);
    throw new Error("Failed to generate senior employee voice.");
  }
};

export interface NGWordMatch {
  original: string;
  replaceInstruction: string;
}

export const extractNGWords = (text: string): NGWordMatch[] => {
  const found: NGWordMatch[] = [];
  for (const [flag, replace] of Object.entries(NG_WORDS_MAP)) {
    if (flag.startsWith('[') && flag.endsWith(']')) {
      try {
        const regex = new RegExp(flag);
        if (regex.test(text)) {
          found.push({ original: flag, replaceInstruction: replace });
        }
      } catch (e) {}
    } else if (flag === '\\d:') {
      if (/\d:/.test(text)) {
        found.push({ original: flag, replaceInstruction: replace });
      }
    } else {
      if (text.includes(flag)) {
        found.push({ original: flag, replaceInstruction: replace });
      }
    }
  }
  return found;
};

export const replaceNGWords = async (currentDescription: string, matches: NGWordMatch[]): Promise<string> => {
  if (matches.length === 0) return currentDescription;

  let replacedText = currentDescription;

  for (const match of matches) {
    if (match.original.startsWith('[') && match.original.endsWith(']')) {
      try {
        const regex = new RegExp(match.original, 'g');
        replacedText = replacedText.replace(regex, match.replaceInstruction);
      } catch (e) {}
    } else if (match.original === '\\d:') {
      const regex = new RegExp('\\\\d:', 'g');
      replacedText = replacedText.replace(regex, match.replaceInstruction);
    } else {
      const escapedOriginal = match.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedOriginal, 'g');
      replacedText = replacedText.replace(regex, match.replaceInstruction);
    }
  }
  
  return replacedText;
};

export const NG_WORDS_MAP: Record<string, string> = {
  "そんな中": "そんななか",
  "その中": "そのなか",
  "む中": "むなか",
  "む中で": "むなかで",
  "な中で": "ななかで",
  "る中で": "るなかで",
  "な中": "ななか",
  "る中": "るなか",
  "る時": "るとき",
  "な時に": "なときに",
  "時は": "ときは",
  "時や": "ときや",
  "時など": "ときなど",
  "更に": "さらに",
  "更なる": "さらなる",
  "為": "ため",
  "…": "……",
  "~": "～",
  "作る": "つくる",
  "造る": "つくる",
  "その上": "そのうえ",
  "の上": "のうえ",
  "な上": "なうえ",
  "みなさん": "皆さん",
  "上手く": "うまく",
  "是非": "ぜひ",
  "分かる": "わかる",
  "分かり": "わかり",
  "分から": "わから",
  "の度に": "のたびに",
  "な所": "なところ",
  "その分": "その分",
  "気付": "気づ",
  "身に付": "身につ",
  "要りません": "いりません",
  "が無い": "がない",
  "無し": "なし",
  "沢山": "たくさん",
  "し得る": "しえる",
  "の他に": "のほかに",
  "他に": "ほかに",
  "の様に": "のように",
  "の様な": "のような",
  "様々": "さまざま",
  "例えば": "たとえば",
  "致し": "いたし",
  "と共": "ととも",
  "共に": "ともに",
  "するさい": "するさい",
  "のさい": "のさい",
  "さいには": "さいには",
  "手掛け": "手がけ",
  "全て": "すべて",
  "もつ": "持つ",
  "を元に": "をもとに",
  "の元に": "のもとに",
  "の元": "のもと",
  "かかわる": "関わる",
  "かかわり": "関り",
  "捉われ": "とらわれ",
  "囚われ": "とらわれ",
  "生かす": "いかす",
  "生かせ": "いかせ",
  "確かに": "たしかに",
  "踏まえて": "ふまえて",
  "繋が": "つなが",
  "繋げ": "つなげ",
  "繋ぐ": "つなぐ",
  "繋ご": "つなご",
  "の頃": "のころ",
  "な頃": "なころ",
  "する頃": "するころ",
  "頃に": "ころに",
  "当たり": "あたり",
  "当り": "あたり",
  "し過ぎる": "しすぎる",
  "基づ": "もとづ",
  "一つ一つの": "一つひとつの",
  "一つ一つが": "一つひとつが",
  "一つ一つは": "一つひとつは",
  "一つ一つ": "一つひとつ",
  "1つ1つ": "一つひとつ",
  "1つ1つの": "一つひとつの",
  "1つ1つは": "一つひとつは",
  "1つ1つが": "一つひとつが",
  "1人1人": "一人ひとり",
  "1人1人で": "一人ひとりで",
  "1人1人の": "一人ひとりの",
  "ひとりひとり": "一人ひとり",
  "ひとりひとりで": "一人ひとりで",
  "ひとりひとりの": "一人ひとりの",
  "ひとりひとりが": "一人ひとりが",
  "一から": "イチから",
  "1から": "イチから",
  "弊社": "当社",
  "ヶ月": "ヵ月",
  "カ月": "ヵ月",
  "か月": "ヵ月",
  "年休": "年間休日",
  "WEB": "Web",
  "ＷＥＢ": "Web",
  "ZOOM": "Zoom",
  "ＺＯＯＭ": "Zoom",
  "YOUTUBE": "YouTube",
  "Youtube": "YouTube",
  "Re就活": "Ｒｅ就活",
  "Re": "Ｒｅ",
  "一日": "1日",
  "特徴": "特長",
  "思いで": "想いで",
  "思いを": "想いを",
  "思いの": "想いの",
  "思いが": "想いが",
  "話ます": "話します",
  "明るい方": "コミュニケーションをとれる方",
  "こなす": "取り組む",
  "作業": "業務",
  "お人柄": "マッチ度",
  "営業マン": "営業担当",
  "人物重視": "✖",
  "ポテンシャル": "意欲",
  "や、": "や",
  "と、": "と",
  ":": "：",
};