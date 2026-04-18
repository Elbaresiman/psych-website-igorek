import re
from features.dicts import INSTRUCTION_MARKERS

def sanitize_response(text: str) -> str:
    if not text:
        return text

    text = text.replace("\r\n", "\n").replace("\r", "\n")

    for tok in ["<|im_start|>", "<|im_end|>", "system", "user", "assistant", "####", "python"]:
        text = text.replace(tok, "")

    cut_positions = []
    for pat in INSTRUCTION_MARKERS:
        m = re.search(pat, text, flags=re.IGNORECASE | re.DOTALL)
        if m:
            cut_positions.append(m.start())

    m_en = re.search(r"(?m)^[ \t]*[A-Za-z']{1,}.*$", text)
    if m_en:
        cut_positions.append(m_en.start())

    if cut_positions:
        cut_at = min(cut_positions)
        text = text[:cut_at].rstrip()

    text = re.sub(r'(</?\|?im_(?:start|end)\|?>|</?>)', '', text)
    text = text.replace("```", "").replace("`", "")
    text = re.sub(r'(?<!\*)\*(?!\*)', '', text)
    text = re.sub(r'(?<!_)_(?!_)', '', text)
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    text = re.sub(r'(?m)^\s{0,3}#+\s*', '', text)
    text = re.sub(r'(?m)^\s{0,3}>\s*', '', text)
    text = re.sub(r'\([A-Za-z\s:.,;!?\'"-]+\)', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text).strip()

    paragraphs = text.split("\n")
    seen = set()
    unique_paragraphs = []
    for p in paragraphs:
        p_stripped = p.strip()
        if not p_stripped:
            continue
        if p_stripped not in seen:
            unique_paragraphs.append(p_stripped)
            seen.add(p_stripped)
    text = "\n\n".join(unique_paragraphs)

    if len(text) > 2100:
        text = text[:2100].rstrip() + "\n\n[Ответ обрезан]"

    return text


def sanitize_response_mood(text: str) -> str:
    for junk in ["system", "user", "assistant", "<|im_start|>", "<|im_end|>", "####", "\""]:
        text = text.replace(junk, "")

    text = re.sub(r'(?<!\*)\*(?!\*)', '', text)
    text = re.sub(r'(?<!_)_(?!_)', '', text)
    text = text.replace("`", "").replace("```", "")
    text = re.sub(r'#+ ', '', text)
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)

    return text.strip()