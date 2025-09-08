# import os
# import requests
# from bs4 import BeautifulSoup
# from tools import parsetool

# EPRINTS_BASE = "https://eprints.cmfri.org.in/"

# def scrape_technical_reports(limit=5):
#     # """
#     # Scrape CMFRI Eprints technical reports page.
#     # Returns list of dicts with {title, url, relative_path}.
#     # """
#     # index_url = EPRINTS_BASE + "view/year/"
#     # r = requests.get(index_url)
#     # r.raise_for_status()
#     # soup = BeautifulSoup(r.text, "html.parser")

#     # reports = []
#     # links = soup.select("a[href*='.pdf']")
#     # for a in links[:limit]:
#     #     href = a["href"]
#     #     title = a.get_text(strip=True)
#     #     reports.append({
#     #         "title": title,
#     #         "url": EPRINTS_BASE + href.lstrip("/"),
#     #         "relative_path": href
#     #     })
#     # return reports
#     pass

# def download_report(relative_path: str, out_dir="downloads") -> str:
#     """Download CMFRI report PDF."""
#     os.makedirs(out_dir, exist_ok=True)
#     url = EPRINTS_BASE + relative_path.lstrip("/")
#     fname = os.path.join(out_dir, os.path.basename(relative_path))
#     if not os.path.exists(fname):
#         r = requests.get(url, stream=True)
#         r.raise_for_status()
#         with open(fname, "wb") as f:
#             for chunk in r.iter_content(1024):
#                 f.write(chunk)
#     return fname

# def parse_report(pdf_path: str) -> dict:
#     """OCR parse report and extract sections + tables."""
#     text_data = parsetool.extract_text_ocr(pdf_path)
#     sections = parsetool.split_sections_from_text(text_data.get("full_text", ""))
#     tables = parsetool.extract_tables_ocr(pdf_path)

#     return {
#         "file": pdf_path,
#         "pages": text_data.get("page_count", 0),
#         "sections": sections,
#         "tables": tables
#     }
