import re
import httpx


async def fetch_page_text(url: str) -> str:
    async with httpx.AsyncClient(
        timeout=30,
        follow_redirects=True,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            ),
        },
    ) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        html = resp.text

    text = _html_to_text(html)

    # Site-specific extraction
    if "crowdworks.jp" in url:
        text = _extract_crowdworks(text)
    elif "lancers.jp" in url:
        text = _extract_lancers(text)
    elif "coconala.com" in url:
        text = _extract_coconala(text)

    if len(text) > 5000:
        text = text[:5000]

    return text


def _html_to_text(html: str) -> str:
    html = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.DOTALL)
    html = re.sub(r"<style[^>]*>.*?</style>", "", html, flags=re.DOTALL)
    html = re.sub(r"<nav[^>]*>.*?</nav>", "", html, flags=re.DOTALL)
    html = re.sub(r"<footer[^>]*>.*?</footer>", "", html, flags=re.DOTALL)
    html = re.sub(r"<!--.*?-->", "", html, flags=re.DOTALL)
    html = re.sub(r"<br\s*/?>", "\n", html, flags=re.IGNORECASE)
    html = re.sub(r"<[^>]+>", "\n", html)
    html = re.sub(r"&nbsp;", " ", html)
    html = re.sub(r"&amp;", "&", html)
    html = re.sub(r"&lt;", "<", html)
    html = re.sub(r"&gt;", ">", html)
    html = re.sub(r"&#\d+;", "", html)
    html = re.sub(r"&\w+;", "", html)

    lines = [line.strip() for line in html.splitlines() if line.strip()]
    return "\n".join(lines)


def _extract_crowdworks(text: str) -> str:
    # Extract between "仕事の詳細" and common end markers
    markers_start = ["仕事の詳細", "【 概要 】", "【概要】", "【依頼内容】"]
    markers_end = [
        "クライアント情報", "最近応募したクラウドワーカー",
        "会員登録して", "ツイート", "他の求人・仕事を探す",
    ]

    start_idx = 0
    for marker in markers_start:
        idx = text.find(marker)
        if idx != -1:
            start_idx = idx
            break

    end_idx = len(text)
    for marker in markers_end:
        idx = text.find(marker, start_idx + 1)
        if idx != -1 and idx < end_idx:
            end_idx = idx

    extracted = text[start_idx:end_idx].strip()

    # Also grab title and overview info from before
    title_section = text[:start_idx]
    title_match = re.search(
        r"(ロゴ|ロゴマーク|ロゴデザイン|ロゴ制作|ロゴ作成)[^\n]*",
        title_section, re.IGNORECASE,
    )
    title = title_match.group(0) if title_match else ""

    # Grab key metadata
    meta_parts = []
    for pattern in [
        r"固定報酬制|プロジェクト形式|コンペ形式|タスク形式",
        r"納品希望日[^\n]*",
        r"応募期限[^\n]*",
    ]:
        m = re.search(pattern, title_section)
        if m:
            meta_parts.append(m.group(0))

    result = ""
    if title:
        result += f"案件タイトル: {title}\n"
    if meta_parts:
        result += "\n".join(meta_parts) + "\n\n"
    result += extracted

    return result


def _extract_lancers(text: str) -> str:
    markers_start = ["仕事の詳細", "依頼の詳細", "【概要】", "【 概要 】"]
    markers_end = ["この仕事に似た仕事", "ランサーズ株式会社", "会員登録"]

    start_idx = 0
    for marker in markers_start:
        idx = text.find(marker)
        if idx != -1:
            start_idx = idx
            break

    end_idx = len(text)
    for marker in markers_end:
        idx = text.find(marker, start_idx + 1)
        if idx != -1 and idx < end_idx:
            end_idx = idx

    return text[start_idx:end_idx].strip()


def _extract_coconala(text: str) -> str:
    markers_start = ["依頼の詳細", "相談の詳細", "やりたいこと"]
    markers_end = ["提案一覧", "この相談に似た", "会員登録"]

    start_idx = 0
    for marker in markers_start:
        idx = text.find(marker)
        if idx != -1:
            start_idx = idx
            break

    end_idx = len(text)
    for marker in markers_end:
        idx = text.find(marker, start_idx + 1)
        if idx != -1 and idx < end_idx:
            end_idx = idx

    return text[start_idx:end_idx].strip()
