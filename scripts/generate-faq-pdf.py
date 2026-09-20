#!/usr/bin/env python3
"""
Generator PDF Draf Kajian & FAQ Pemakaman INVAC.
Membaca file template HTML mandiri di docs/Draft_Kajian_dan_FAQ_Pemakaman_INVAC.html
dan merendernya menjadi PDF 4 halaman A4 standar percetakan menggunakan Google Chrome headless.
"""

import os
import subprocess
import sys

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    html_file = os.path.join(base_dir, 'docs', 'Draft_Kajian_dan_FAQ_Pemakaman_INVAC.html')
    pdf_file = os.path.join(base_dir, 'docs', 'Draft_Kajian_dan_FAQ_Pemakaman_INVAC.pdf')

    if not os.path.exists(html_file):
        print(f"Error: File HTML tidak ditemukan di: {html_file}")
        sys.exit(1)

    chrome_cmd = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_file}",
        html_file
    ]

    print(f"Merender PDF dari: {html_file} ...")
    res = subprocess.run(chrome_cmd, capture_output=True, text=True)

    if os.path.exists(pdf_file) and os.path.getsize(pdf_file) > 0:
        print(f"PDF berhasil di-generate di: {pdf_file} ({os.path.getsize(pdf_file):,} bytes)")
    else:
        print(f"Error saat generate PDF: {res.stderr}")
        sys.exit(1)

if __name__ == '__main__':
    main()
