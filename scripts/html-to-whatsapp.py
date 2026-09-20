#!/usr/bin/env python3
"""
Konverter Template HTML ke Format Teks WhatsApp.
Membaca docs/Draft_Kajian_dan_FAQ_Pemakaman_INVAC.html dan menghasilkan teks berformat
WhatsApp (*bold*, _italic_, bullet list, emoji indikator) yang siap dibagikan ke grup WA.

Penggunaan:
    python3 scripts/html-to-whatsapp.py           # Menghasilkan file docs/Draft_Kajian_dan_FAQ_Pemakaman_INVAC_WA.txt
    python3 scripts/html-to-whatsapp.py --copy    # Otomatis menyalin teks ke Clipboard (khusus macOS)
"""

import os
import re
import html
import subprocess
import sys

def clean_inline(text):
    if not text:
        return ""
    # Ganti strong/b menjadi *bold*
    text = re.sub(r'<(strong|b)[^>]*>(.*?)</\1>', r'*\2*', text, flags=re.DOTALL)
    # Ganti em/i menjadi _italic_
    text = re.sub(r'<(em|i)[^>]*>(.*?)</\1>', r'_\2_', text, flags=re.DOTALL)
    # Ganti code menjadi `code`
    text = re.sub(r'<code[^>]*>(.*?)</code>', r'`\1`', text, flags=re.DOTALL)
    # Ganti <br> menjadi baris baru
    text = re.sub(r'<br\s*/?>', '\n', text)
    # Bersihkan tag HTML lainnya
    text = re.sub(r'<[^>]+>', '', text)
    text = html.unescape(text)

    # Bersihkan duplikasi tanda bintang/garis bawah yang tidak sengaja terbentuk
    text = re.sub(r'\*{2,}', '*', text)
    text = re.sub(r'_{2,}', '_', text)

    # Rapikan spasi per baris
    lines = [re.sub(r'[ \t]+', ' ', l).strip() for l in text.split('\n')]
    
    # Hapus baris kosong berlebih berturut-turut
    result = []
    blank = False
    for l in lines:
        if not l:
            if not blank:
                result.append('')
                blank = True
        else:
            result.append(l)
            blank = False
    return '\n'.join(result).strip()

def html_to_whatsapp(html_content):
    wa = []

    # 1. Header & Identitas Draf
    wa.append("📋 *[DRAFT KAJIAN INTERNAL — BELUM DIPUBLIKASIKAN]*")
    wa.append("🏛️ *INVAC JEPANG (Indonesia Volunteer Community)*")
    wa.append("📅 _Edisi Kerja: September 2026 | Sifat: Konfidensial (Internal Relawan)_")
    wa.append("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    wa.append("📖 *DRAF KAJIAN KOMPREHENSIF & PANDUAN:*")
    wa.append("*IKHTIAR PEMAKAMAN MUSLIM WNI DI JEPANG*")
    wa.append("_Tinjauan Aspek Regulasi Nasional Jepang, Sains Lingkungan (AMDAL & WHO), Kaidah Syariat Islam, Alur Tanggap Darurat, serta Panduan Tanya-Jawab (FAQ)._")
    wa.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

    # 2. Ambil Bab 1: Latar Belakang & Urgensi
    b1_match = re.search(r'<h3 class="section-title">1\. LATAR BELAKANG.*?</h3>(.*?)(?=<div class="section-block">)', html_content, re.DOTALL)
    if b1_match:
        wa.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        wa.append("📌 *1. LATAR BELAKANG & URGENSI SOSIAL-KEAGAMAAN*")
        wa.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
        content = b1_match.group(1)
        paragraphs = re.findall(r'<p>(.*?)</p>', content, re.DOTALL)
        for p in paragraphs:
            wa.append(clean_inline(p) + "\n")
        
        items = re.findall(r'<li>(.*?)</li>', content, re.DOTALL)
        if items:
            for it in items:
                wa.append(f"• {clean_inline(it)}")
            wa.append("")

    # 3. Ambil Bab 2: Kerangka Hukum & Legalitas
    b2_match = re.search(r'<h3 class="section-title">2\. KERANGKA HUKUM.*?</h3>(.*?)(?=<div class="page-break">|<div class="section-block">)', html_content, re.DOTALL)
    if b2_match:
        wa.append("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        wa.append("📌 *2. KERANGKA HUKUM & LEGALITAS PEMAKAMAN DI JEPANG*")
        wa.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
        content = b2_match.group(1)
        p1 = re.search(r'<p>(.*?)</p>', content, re.DOTALL)
        if p1:
            wa.append(clean_inline(p1.group(1)) + "\n")
        
        hb = re.search(r'<div class="highlight-box">(.*?)</div>', content, re.DOTALL)
        if hb:
            wa.append(f"💡 {clean_inline(hb.group(1))}\n")
        
        p2_match = re.findall(r'<p>(.*?)</p>', content, re.DOTALL)
        if len(p2_match) > 1:
            wa.append(clean_inline(p2_match[1]) + "\n")

    # 4. Ambil Bab 3: Kajian Ilmiah & Lingkungan
    b3_match = re.search(r'<h3 class="section-title">3\. KAJIAN ILMIAH.*?</h3>(.*?)(?=<div class="section-block">)', html_content, re.DOTALL)
    if b3_match:
        wa.append("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        wa.append("📌 *3. KAJIAN ILMIAH: BUKTI BEBAS CEMARAN AIR & LINGKUNGAN*")
        wa.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
        content = b3_match.group(1)
        p_intro = re.search(r'<p>(.*?)</p>', content, re.DOTALL)
        if p_intro:
            wa.append(clean_inline(p_intro.group(1)) + "\n")
        
        # Highlight box WHO
        hb_who = re.search(r'<div class="highlight-box gold">(.*?)</div>', content, re.DOTALL)
        if hb_who:
            wa.append(f"🔬 {clean_inline(hb_who.group(1))}\n")
        
        # Highlight box Green Burial
        hb_green = re.search(r'<div class="highlight-box">(.*?)</div>', content, re.DOTALL)
        if hb_green:
            wa.append(f"🌱 {clean_inline(hb_green.group(1))}\n")
        
        # Standar Kemenkes
        p_all = re.findall(r'<p>(.*?)</p>', content, re.DOTALL)
        if len(p_all) > 1:
            wa.append(f"🏛️ {clean_inline(p_all[-1])}\n")

    # 5. Ambil Bab 4: Bukti Empiris di Jepang
    b4_match = re.search(r'<h3 class="section-title">4\. BUKTI EMPIRIS.*?</h3>(.*?)(?=<div class="page-break">|<div class="section-block">)', html_content, re.DOTALL)
    if b4_match:
        wa.append("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        wa.append("📌 *4. BUKTI EMPIRIS DI JEPANG: PULUHAN TAHUN TANPA INSIDEN*")
        wa.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
        content = b4_match.group(1)
        p_intro = re.search(r'<p>(.*?)</p>', content, re.DOTALL)
        if p_intro:
            wa.append(clean_inline(p_intro.group(1)) + "\n")
        
        items = re.findall(r'<li>(.*?)</li>', content, re.DOTALL)
        for it in items:
            wa.append(f"• {clean_inline(it)}")
        wa.append("")

    # 6. Ambil Bab 5: Alur Pengurusan Jenazah (Ref: kmii.jp)
    b5_match = re.search(r'<h3 class="section-title">5\.\s*(?:ALUR RESMI PENGURUSAN JENAZAH|ALUR TANGGAP DARURAT).*?</h3>(.*?)(?=<div class="page-break">|<div class="section-block">)', html_content, re.DOTALL)
    if b5_match:
        wa.append("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        wa.append("🚑 *5. ALUR RESMI PENGURUSAN JENAZAH WNI DI JEPANG (REF: KMII.JP)*")
        wa.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
        content = b5_match.group(1)
        p_intro = re.search(r'<p>(.*?)</p>', content, re.DOTALL)
        if p_intro:
            wa.append(clean_inline(p_intro.group(1)) + "\n")
        
        steps = re.findall(r'<div style="font-weight:800;[^>]*>(.*?)</div>\s*<div style="font-weight:700;[^>]*>(.*?)</div>\s*<div style="font-size:[^>]*>(.*?)</div>', content, re.DOTALL)
        emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣"]
        for idx, (s_num, s_title, s_desc) in enumerate(steps):
            emoji = emojis[idx] if idx < len(emojis) else "▫️"
            wa.append(f"{emoji} *{clean_inline(s_num)}: {clean_inline(s_title)}*")
            cleaned_desc = clean_inline(s_desc)
            desc_lines = cleaned_desc.split('\n')
            for dl in desc_lines:
                if dl.strip():
                    wa.append(f"   {dl.strip()}")
            wa.append("")

    # 7. Ambil Bab 6: Tanya Jawab Resmi (FAQ Q1 - Q8 di bagian akhir dokumen)
    qa_pairs = re.findall(r'<div class="qa-card">\s*<div class="qa-q">(.*?)</div>\s*<div class="qa-a">(.*?)</div>\s*</div>', html_content, re.DOTALL)
    if qa_pairs:
        wa.append("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        wa.append("❓ *6. TANYA JAWAB RESMI (FAQ SEPUTAR PEMAKAMAN MUSLIM)*")
        wa.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
        for q, a in qa_pairs:
            q_clean = clean_inline(q)
            a_clean = clean_inline(a)
            wa.append(f"❓ *{q_clean}*")
            wa.append(f"💬 {a_clean}\n")

    # 8. Ambil Bab 7: Catatan Penggunaan Internal Relawan
    internal_info = re.search(r'<div class="internal-info">(.*?)</div>', html_content, re.DOTALL)
    sign_box = re.search(r'<div class="sign-box">(.*?)</div>', html_content, re.DOTALL)
    if internal_info:
        wa.append("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        wa.append("🔒 *7. CATATAN PENGGUNAAN INTERNAL RELAWAN*")
        wa.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")
        wa.append(clean_inline(internal_info.group(1)) + "\n")
        if sign_box:
            wa.append(clean_inline(sign_box.group(1)) + "\n")

    # 10. Daftar Rujukan
    cit_match = re.search(r'<div class="citation-box">(.*?)</div>', html_content, re.DOTALL)
    if cit_match:
        wa.append("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        wa.append(f"📚 {clean_inline(cit_match.group(1))}")
        wa.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

    return "\n".join(wa)

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    html_file = os.path.join(base_dir, 'docs', 'Draft_Kajian_dan_FAQ_Pemakaman_INVAC.html')
    wa_file = os.path.join(base_dir, 'docs', 'Draft_Kajian_dan_FAQ_Pemakaman_INVAC_WA.txt')

    if not os.path.exists(html_file):
        print(f"Error: File HTML tidak ditemukan di: {html_file}")
        sys.exit(1)

    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()

    wa_text = html_to_whatsapp(html_content)

    with open(wa_file, 'w', encoding='utf-8') as f:
        f.write(wa_text)

    print(f"✅ Teks format WhatsApp berhasil dibuat di: {wa_file} ({len(wa_text):,} karakter)")

    # Jika ada opsi --copy di macOS
    if '--copy' in sys.argv:
        try:
            p = subprocess.Popen(['pbcopy'], stdin=subprocess.PIPE, close_fds=True)
            p.communicate(input=wa_text.encode('utf-8'))
            print("📋 Teks berhasil disalin ke Clipboard Mac Anda! Tinggal tekan Cmd + V di WhatsApp.")
        except Exception as e:
            print(f"Gagal menyalin ke clipboard: {e}")

if __name__ == '__main__':
    main()
