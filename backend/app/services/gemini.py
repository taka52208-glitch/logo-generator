import json
import httpx
from app.config import GROQ_API_KEY

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "qwen/qwen3-32b"


async def _call_llm(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


def _extract_json(text: str):
    # Remove <think> blocks if present (Qwen3 thinking mode)
    import re
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()

    start = text.find("{") if "{" in text else text.find("[")
    end = text.rfind("}") + 1 if "}" in text else text.rfind("]") + 1
    if start == -1 or end == 0:
        raise ValueError(f"No JSON found in response: {text[:200]}")
    return json.loads(text[start:end])


async def analyze_brief(brief_text: str) -> dict:
    prompt = f"""あなたはロゴデザインの専門家です。
以下のクラウドソーシングのロゴコンペの案件説明文を**一行も見逃さず**精読し、
ロゴ制作に必要な要件を構造化してください。

案件説明文:
{brief_text}

以下のJSON形式のみ出力してください（説明不要、JSONのみ）:
{{
  "companyName": "会社名・サービス名・店舗名・ブランド名・屋号のいずれか。案件文中に明示されている名称を優先。見つからない場合は空文字",
  "industry": "業種（例: IT、飲食、医療、美容、建設、教育）",
  "concept": "ロゴに込めたいコンセプトや世界観（50字以内）",
  "colors": ["案件に色指定があれば必ずその色を入れる。指定がなければ業種セオリーに基づく推奨色"],
  "mood": "雰囲気・トーン（例: モダン、温かい、高級感、ナチュラル、ポップ）",
  "target": "ターゲット層（年齢・性別・属性など案件文から読み取れる情報）",
  "logoType": "推奨ロゴタイプ（symbol/wordmark/combination）",
  "keywords": ["案件文に登場する重要キーワード・コンセプトワード・モチーフ候補の単語リスト"],
  "avoidColors": ["案件文で『使わないでほしい』『避けてほしい』と明示されている色。なければ空配列"],
  "avoidElements": ["案件文でNGとされているデザイン要素・表現・モチーフ。なければ空配列"],
  "preferredStyle": "案件文でクライアントが言及しているスタイル・デザイン傾向（例: シンプル、手書き風、和風）。なければ空文字",
  "additionalNotes": "サイズ・納品形式・締切・修正回数・参考サイトURLなど、上記項目に収まらない具体的な要求事項。なければ空文字"
}}

抽出ルール（必ず守ること）:
1. 色に関して: 案件文に「○○色」「#XXXXXX」「RGBで〜」等の具体的な色指定があれば、colors に必ずその値を入れる。「青系」「暖色系」のような抽象表現も忠実に反映する
2. モチーフに関して: 「桜」「山」「波」「鳥」等の具体的なモチーフの言及があれば keywords に含める
3. 形状に関して: 「丸いイメージ」「角ばった感じ」等の形状指定は additionalNotes または keywords に反映する
4. NGに関して: 「派手にしないで」「複雑にしないで」「文字だけはNG」等の否定表現は avoidElements に含める
5. companyName: 「株式会社〜」「〜サロン」「〜屋」「〜.com」等、固有名詞として機能している名称を正確に抽出する
6. 案件文に情報がない項目は推測せず、文字列なら空文字、配列なら空配列を返す

業種別の配色セオリー（案件に色指定がない場合のみ使用）:
- IT・テクノロジー: 青、紺（知性、信頼性）
- 飲食・食品: 赤、オレンジ、黄（食欲増進）
- 医療・ヘルスケア: 青、緑、白（清潔感）
- 高級・ラグジュアリー: 黒、金、紺（洗練）
- 建設・不動産: 青、緑、茶（安定感）
- 美容・コスメ: ピンク、紫、金（華やかさ）
- 法律・士業: 紺、茶、金（格式）
- 環境・エコ: 緑（自然、持続可能性）
- 教育: 青、緑、オレンジ（知性、成長）
- スポーツ: 赤、青、黒（情熱、躍動感）"""

    text = await _call_llm(prompt)
    return _extract_json(text)


async def generate_prompts(analysis: dict) -> list[str]:
    analysis_json = json.dumps(analysis, ensure_ascii=False)
    prompt = f"""You are a world-class AI image prompt engineer specializing in logo design for FLUX.1 model.

Requirements:
{analysis_json}

Create 4 distinct logo generation prompts. Each prompt must follow this exact structure:

[Subject description], [Style keywords], [Color specification], [Composition rules]

4 APPROACHES (one per prompt):
1. GEOMETRIC MINIMAL: Use a single clean geometric shape (circle, hexagon, triangle, shield) with the industry concept embedded. Think Apple, Nike simplicity.
2. SYMBOLIC ICON: One iconic symbol representing the industry. Think Starbucks mermaid, Twitter bird. Bold, recognizable silhouette.
3. NEGATIVE SPACE: Clever use of negative space to create dual meaning. Think FedEx arrow, NBC peacock. Two shapes forming one.
4. ABSTRACT MODERN: Flowing, dynamic abstract mark. Think Pepsi globe, Airbnb bélo. Organic curves meeting geometric precision.

MANDATORY RULES:
- Write in English only
- Each prompt: 80-120 words, highly detailed
- Color: use EXACTLY the colors from "colors" field. If "avoidColors" is specified, NEVER use those colors
- If "keywords" contains specific motifs (e.g., "cherry blossom", "mountain"), incorporate them into the design
- If "avoidElements" is specified, explicitly exclude those elements
- If "preferredStyle" is specified (e.g., "Japanese style", "hand-drawn"), reflect that style
- NEVER include any text/letters/words/typography instructions — the prompt must describe ONLY a visual icon/symbol
- Include: "single icon mark, flat vector, centered on pure white background"
- Describe the shape, proportions, and visual weight precisely
- Reference real design principles: golden ratio, rule of thirds, visual balance

Output ONLY a JSON array (no explanation):
["prompt1", "prompt2", "prompt3", "prompt4"]"""

    text = await _call_llm(prompt)
    return _extract_json(text)


async def generate_proposal(analysis: dict, selected_prompt: str) -> str:
    analysis_json = json.dumps(analysis, ensure_ascii=False)
    prompt = f"""あなたはクラウドソーシングのロゴコンペで勝率の高い提案文を書くプロです。

以下の情報から、採用されやすい提案文を日本語で生成してください。

案件要件:
{analysis_json}

使用したプロンプト（デザイン方向性の参考）:
{selected_prompt}

提案文の構成（必ずこの構成で）:
【デザインコンセプト】
→ 3〜5行。企業理念・事業内容とロゴデザインの関連を論理的に説明

【配色について】
→ 色の心理効果と業種との整合性を説明

【フォントについて】
→ 推奨フォントの特徴とターゲット層との親和性を説明

【モチーフについて】
→ ロゴのシンボル・形状に込めた意味を説明

【展開イメージ】
→ 名刺・看板・Webサイト等での活用イメージを説明

最後に「ご要望に応じて修正対応いたします。お気軽にお申し付けください。」を添える。

注意:
- 「AIで生成しました」とは絶対に書かない
- プロのデザイナーとして自信を持った語調で
- クライアントの要望を深く理解していることが伝わる文章に
- 提案文のみ出力（余計な説明不要）"""

    import re
    text = await _call_llm(prompt)
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
    return text
