import re
from typing import Dict, List, Any
from pdf2image import convert_from_path
import pytesseract
import camelot

SECTION_HEADERS = [
    "ABSTRACT", "INTRODUCTION", "MATERIALS AND METHODS", "METHODS", "METHODOLOGY",
    "RESULTS", "DISCUSSION", "CONCLUSION", "CONCLUSIONS",
    "SUMMARY", "RECOMMENDATIONS", "ACKNOWLEDGEMENTS", "REFERENCES"
]

def extract_text_ocr(pdf_file: str) -> Dict[str, Any]:
    """OCR scanned PDF page by page."""
    try:
        pages_text = []
        images = convert_from_path(pdf_file, dpi=300)
        for img in images:
            text = pytesseract.image_to_string(img, lang="eng")
            pages_text.append(text)
        return {
            "full_text": "\n\n".join(pages_text),
            "pages": pages_text,
            "page_count": len(pages_text)
        }
    except Exception as e:
        return {"full_text": "", "pages": [], "page_count": 0, "error": str(e)}

def split_sections_from_text(full_text: str) -> Dict[str, str]:
    """Split OCR text into sections by headers."""
    sections = {}
    if not full_text:
        return sections

    hdr_regex = r'^(?:\d{0,2}\.?\s*)?(?P<header>' + "|".join([re.escape(h) for h in SECTION_HEADERS]) + r')\b.*$'
    pattern = re.compile(hdr_regex, flags=re.IGNORECASE | re.MULTILINE)

    matches = list(pattern.finditer(full_text))
    if not matches:
        return {"FULL_TEXT": full_text}

    spans = [(m.start(), m.end(), m.group("header").upper()) for m in matches]

    for i, (s_start, s_end, header) in enumerate(spans):
        content_start = s_end
        content_end = spans[i+1][0] if i+1 < len(spans) else len(full_text)
        sections[header] = full_text[content_start:content_end].strip()

    return sections

def extract_tables_ocr(pdf_file: str) -> List[Dict[str, Any]]:
    """Extract tables (if possible) using Camelot."""
    out = []
    try:
        tables = camelot.read_pdf(pdf_file, pages="all", flavor="lattice")
        for t in tables:
            out.append(t.df.to_dict(orient="records"))
    except Exception:
        pass
    return out
