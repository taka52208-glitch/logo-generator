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


async def analyze_brief(brief_text: str, company_name: str) -> dict:
    prompt = f"""あなたはロゴデザインの専門家です。
以下のクラウドソーシングのロゴコンペの案件説明文を分析し、
ロゴ制作に必要な要件を構造化してください。

案件説明文:
{brief_text}

会社名/サービス名:
{company_name}

以下のJSON形式のみ出力してください（説明不要、JSONのみ）:
{{
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
    prompt = f"""あなたは世界トップクラスのAI画像生成プロンプトエンジニアです。
以下の要件から、FLUX.1用のロゴ生成プロンプトを4パターン作成してください。

要件:
{analysis_json}

【重要ルール】
1. 英語で出力
2. 各プロンプトは以下の4つの異なるアプローチ:
   - パターン1: ミニマル幾何学（円、三角、六角形等のシンプルな幾何学図形）
   - パターン2: 業種を象徴するシンボル（具体的なモチーフ）
   - パターン3: ネガティブスペース活用（余白で別の形を表現）
   - パターン4: 抽象的・モダンなマーク（流線型、グラデーション的表現）
3. 絶対に文字・テキスト・アルファベットを含めない指示を入れる
   → 必ず "no text, no letters, no words, no typography" を含める
4. 必ず以下を含める:
   → "single icon mark, minimal flat vector logo, on pure white background"
5. 色は英語の色名で指定（1-2色に限定）
6. 各プロンプトは60-100語程度の詳細な記述にする

以下のJSON配列のみ出力（説明不要、JSON配列のみ）:
["プロンプト1", "プロンプト2", "プロンプト3", "プロンプト4"]"""

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
