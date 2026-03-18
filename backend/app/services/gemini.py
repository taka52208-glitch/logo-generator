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
以下のクラウドソーシングのロゴコンペの案件説明文を分析し、
ロゴ制作に必要な要件を構造化してください。

案件説明文:
{brief_text}

以下のJSON形式のみ出力してください（説明不要、JSONのみ）:
{{
  "companyName": "案件から読み取れる会社名またはサービス名",
  "industry": "業種（例: IT、飲食、医療）",
  "concept": "コンセプト（50字以内）",
  "colors": ["推奨色1", "推奨色2"],
  "mood": "雰囲気（例: モダン、温かい、高級感）",
  "target": "ターゲット層",
  "logoType": "推奨ロゴタイプ（symbol/wordmark/combination）"
}}

業種別の配色セオリー:
- IT・テクノロジー: 青、紺（知性、信頼性）
- 飲食・食品: 赤、オレンジ、黄（食欲増進）
- 医療・ヘルスケア: 青、緑、白（清潔感）
- 高級・ラグジュアリー: 黒、金、紺（洗練）
- 建設・不動産: 青、緑、茶（安定感）
- 美容・コスメ: ピンク、紫、金（華やかさ）
- 法律・士業: 紺、茶、金（格式）
- 環境・エコ: 緑（自然、持続可能性）
- 教育: 青、緑、オレンジ（知性、成長）
- スポーツ: 赤、青、黒（情熱、躍動感）

案件説明文に色の指定がある場合はそれを優先してください。"""

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
- Color: specify exact color names (e.g., "deep navy blue and warm coral")
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
