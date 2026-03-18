import json
import httpx
from app.config import GROQ_API_KEY, GEMINI_API_KEY

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "qwen/qwen3-32b"


async def _call_llm(prompt: str, *, system: str = "") -> str:
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": messages,
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
    # Convert Japanese colors to hex codes for better AI image generation
    color_map = {
        "青": "#1565C0 blue", "紺": "#1A237E navy", "水色": "#4FC3F7 light blue",
        "赤": "#D32F2F red", "緑": "#388E3C green", "黄": "#FBC02D yellow",
        "オレンジ": "#E65100 orange", "紫": "#7B1FA2 purple", "ピンク": "#E91E63 pink",
        "黒": "#212121 black", "白": "#FFFFFF white", "金": "#C49A6C gold",
        "茶": "#4E342E brown", "グレー": "#757575 gray",
        "深いブラウン": "#3E2723 deep brown", "ゴールド": "#C49A6C warm gold",
        "青色系": "#1565C0 blue", "緑色系": "#388E3C green",
    }

    colors_raw = analysis.get("colors", [])
    colors_hex = []
    for c in colors_raw:
        matched = color_map.get(c)
        if matched:
            colors_hex.append(matched)
        else:
            colors_hex.append(c)
    color_spec = " and ".join(colors_hex) if colors_hex else "brand-appropriate colors"

    keywords = analysis.get("keywords", [])
    motifs = ", ".join(keywords[:5]) if keywords else "industry-relevant motif"
    avoid = analysis.get("avoidElements", [])
    avoid_str = ", ".join(avoid) if avoid else ""
    style = analysis.get("preferredStyle", "")

    prompt = f"""You are a senior art director at a top branding agency. Write 4 image generation prompts for a logo icon.

CLIENT BRIEF:
- Industry: {analysis.get("industry", "")}
- Concept: {analysis.get("concept", "")}
- Colors: {color_spec}
- Mood: {analysis.get("mood", "")}
- Key motifs: {motifs}
{f"- Style preference: {style}" if style else ""}
{f"- AVOID: {avoid_str}" if avoid_str else ""}

Write 4 prompts, each describing a DIFFERENT abstract icon/symbol mark (NO text/letters in the image).

Each prompt MUST:
1. Start with "Abstract icon mark:" or "Geometric symbol:" or "Symbolic logo mark:"
2. Describe the exact shapes (e.g., "five overlapping leaf shapes arranged radially")
3. Specify colors with HEX codes (e.g., "#3E2723 deep brown and #C49A6C warm gold")
4. End with "LARGE icon filling 80% of canvas, crisp vector edges, centered on pure white #FFFFFF background"
5. Be 60-90 words

4 RADICALLY DIFFERENT APPROACHES (each must look completely different from the others):
1. GEOMETRIC EMBLEM: A bold geometric container (circle, shield, hexagon) with the concept embedded as a cutout or inset. Thick lines, solid fills. Think: Starbucks, Porsche, NFL logos.
2. ORGANIC SILHOUETTE: A single recognizable object/creature/plant as a bold black silhouette with clever negative space details. Think: WWF panda, Twitter bird, Apple logo.
3. ABSTRACT LETTERFORM: The first letter of the company name transformed into an abstract icon that hints at the industry. Stylized typography as art. Think: Pinterest P, Beats B.
4. DYNAMIC MARK: Flowing lines, overlapping transparent shapes, or interlocking curves creating movement and energy. Multiple colors with overlap effects. Think: Airbnb, Google Chrome, Olympics rings.

Output ONLY a JSON array:
["prompt1", "prompt2", "prompt3", "prompt4"]"""

    text = await _call_llm(
        prompt,
        system="You are an expert AI image prompt engineer. You MUST write ALL prompts in English only. Output ONLY valid JSON. No explanation, no markdown, no thinking tags.",
    )
    return _extract_json(text)


async def generate_proposal(analysis: dict, selected_prompt: str) -> str:
    # Build a focused brief from analysis, not raw JSON
    company = analysis.get("companyName", "")
    industry = analysis.get("industry", "")
    concept = analysis.get("concept", "")
    colors = "、".join(analysis.get("colors", []))
    mood = analysis.get("mood", "")
    target = analysis.get("target", "")
    keywords = "、".join(analysis.get("keywords", []))

    prompt = f"""あなたはクラウドソーシングのロゴコンペで勝率の高い提案文を書くプロです。
以下の案件に対して、この案件だけに特化した提案文を生成してください。

【この案件の情報】
・会社名/サービス名: {company}
・業種: {industry}
・コンセプト: {concept}
・希望色: {colors}
・雰囲気: {mood}
・ターゲット: {target}
・キーワード: {keywords}

【今回提案するデザインの方向性（英語プロンプトから読み取ってください）】
{selected_prompt}

上記の情報を元に、「{company}」専用の提案文を書いてください。
他の案件や一般論ではなく、この案件の固有の要素（業種・コンセプト・ターゲット）に具体的に言及すること。

提案文の構成（必ずこの構成で）:

はじめまして。ご依頼内容を拝読し、提案させていただきます。

【デザインコンセプト】
→ 3〜5行。クライアントの事業内容・理念をしっかり踏まえ、なぜこのデザインにしたかの理由を具体的に説明

【配色について】
→ 選んだ色の心理効果と業種の整合性を説明。「○○色は△△の印象を与え、□□業にふさわしい」のように具体的に

【モチーフ・シンボルについて】
→ ロゴの形状・シンボルに込めた意味を丁寧に説明。クライアントの要望との紐付けを明確に

【フォントについて】
→ 推奨フォント名を挙げ、その特徴とターゲット層との親和性を説明

【展開イメージ】
→ 名刺・看板・Webサイト・SNSアイコン等での活用イメージを具体的に説明

【修正対応について】
→ 「配色変更、形状の微調整、モチーフの変更など、ご要望に応じて何度でも修正対応いたします。お気軽にお申し付けください。」

注意:
- 「AIで生成しました」とは絶対に書かない
- プロのデザイナーとして自信を持った語調で
- クライアントの要望を深く理解していることが伝わる文章に
- 提案文のみ出力（余計な説明不要）
- マークダウン記法（**, ##, ```等）は絶対に使わない
- 特殊記号（★、☆、●、◆、→、＞、※、♪、△等）は使わない
- 見出しは【】のみ使用し、装飾記号は一切不要
- 箇条書きの「・」は使ってよい
- 自然な日本語の文章で、読みやすくシンプルに"""

    import re
    text = await _call_llm(prompt)
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
    # Remove markdown artifacts
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"```[^`]*```", "", text, flags=re.DOTALL)
    text = text.strip()
    return text


async def generate_mockup_proposal(analysis: dict, selected_prompt: str) -> str:
    company = analysis.get("companyName", "")
    industry = analysis.get("industry", "")
    colors = "、".join(analysis.get("colors", []))
    mood = analysis.get("mood", "")
    target = analysis.get("target", "")

    prompt = f"""あなたはブランディングの専門家です。
以下のロゴデザインが、実際のビジネスシーンでどのように活用されるか、
クライアントに具体的にイメージしてもらうための「展開イメージ説明文」を生成してください。

【案件情報】
・会社名: {company}
・業種: {industry}
・希望色: {colors}
・雰囲気: {mood}
・ターゲット: {target}

【デザインの方向性】
{selected_prompt}

以下の3つの活用シーンについて、それぞれ2〜3行で具体的に説明してください。

【名刺での活用】
→ ロゴの配置位置、余白の取り方、紙質との相性、受け取った相手にどんな印象を与えるか

【看板・サイネージでの活用】
→ 遠目からの視認性、背景色との組み合わせ、昼夜での見え方、通行人への印象

【Webサイト・SNSでの活用】
→ ヘッダーやファビコンでの見え方、SNSアイコンとしての認識性、スマホ画面での視認性

注意:
- 「{company}」の名前を使って具体的に書く
- マークダウン記法は使わない
- 特殊記号は使わない
- 見出しは【】のみ
- 箇条書きの「・」は使ってよい
- 自然な日本語で簡潔に"""

    import re
    text = await _call_llm(prompt)
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.MULTILINE)
    text = text.strip()
    return text


async def revise_prompt(original_prompt: str, revision_instruction: str) -> str:
    prompt = f"""You must COMPLETELY REWRITE the logo prompt below based on the user's revision request.
Do NOT just insert a word or two — write a BRAND NEW prompt from scratch that:
1. Keeps the same core concept/industry/brand
2. Fully incorporates the user's requested changes into every aspect of the description
3. Describes specific NEW shapes, forms, and compositions that reflect the revision
4. Specifies colors with HEX codes
5. Ends with "Crisp vector edges, centered on pure white #FFFFFF background"
6. Is 60-90 words

ORIGINAL PROMPT:
{original_prompt}

USER'S REVISION REQUEST (Japanese):
{revision_instruction}

Example: if user says "もっと丸みを帯びた形にして", you must replace angular shapes with circles, ovals, rounded forms throughout the entire prompt — not just add "rounded".

Write the COMPLETE NEW prompt:"""

    import re
    text = await _call_llm(
        prompt,
        system="You are a senior art director rewriting image generation prompts. FULLY REWRITE the prompt — never just insert a word. Output ONLY the new English prompt. No quotes, no explanation, no markdown.",
    )
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
    text = text.strip('"').strip("'").strip("`")
    return text


GEMINI_TEXT_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.5-flash-lite:generateContent"
)


async def describe_logo_image(image_base64: str) -> str:
    """Use Gemini vision to describe a logo image as an image generation prompt."""
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            GEMINI_TEXT_URL,
            headers={
                "x-goog-api-key": GEMINI_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "contents": [{
                    "parts": [
                        {
                            "inlineData": {
                                "mimeType": "image/png",
                                "data": image_base64,
                            }
                        },
                        {
                            "text": (
                                "Describe this logo as an image generation prompt in English. "
                                "Include: exact shapes, colors with HEX codes, composition, style. "
                                "End with 'Crisp vector edges, centered on pure white #FFFFFF background'. "
                                "Output ONLY the prompt, 60-90 words. No explanation."
                            ),
                        },
                    ]
                }],
            },
        )
        resp.raise_for_status()
        data = resp.json()

        for candidate in data.get("candidates", []):
            for part in candidate.get("content", {}).get("parts", []):
                if "text" in part:
                    import re
                    text = part["text"].strip()
                    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
                    text = text.strip('"').strip("'").strip("`")
                    return text

        raise ValueError("No text in Gemini response")


async def revise_from_image(image_base64: str, revision_instruction: str) -> str:
    """Describe uploaded logo, then rewrite with revision."""
    original_prompt = await describe_logo_image(image_base64)
    revised_prompt = await revise_prompt(original_prompt, revision_instruction)
    return revised_prompt
