import os
import base64
import subprocess

def main():
    logo_path = 'public/ivc-logo.png'
    logo_base64 = ''
    if os.path.exists(logo_path):
        with open(logo_path, 'rb') as f:
            logo_base64 = f"data:image/png;base64,{base64.b64encode(f.read()).decode('utf-8')}"

    html_content = f"""<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Draf Kajian Komprehensif & FAQ: Ikhtiar Pemakaman Muslim WNI di Jepang - INVAC</title>
<style>
  @page {{
    size: A4;
    margin: 14mm 14mm 14mm 14mm;
    @bottom-right {{
      content: "Halaman " counter(page) " dari 4";
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 7.5pt;
      color: #64748B;
    }}
  }}

  *, *:before, *:after {{
    box-sizing: border-box;
  }}

  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1E293B;
    background-color: #FFFFFF;
    line-height: 1.5;
    font-size: 8.75pt;
    margin: 0;
    padding: 0;
  }}

  .header {{
    border-bottom: 2px solid #1E3A2F;
    padding-bottom: 8px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }}

  .header-left {{
    display: flex;
    align-items: center;
    gap: 12px;
  }}

  .logo {{
    width: 48px;
    height: 48px;
    object-fit: contain;
  }}

  .header-title-box h1 {{
    font-size: 12.5pt;
    font-weight: 800;
    color: #1E3A2F;
    margin: 0 0 1px 0;
    letter-spacing: -0.3px;
    text-transform: uppercase;
  }}

  .header-title-box .sub {{
    font-size: 7.5pt;
    color: #9C6D37;
    font-weight: 600;
    margin: 0;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }}

  .header-right {{
    text-align: right;
    font-size: 7pt;
    color: #64748B;
    line-height: 1.35;
  }}

  .doc-badge {{
    display: inline-block;
    background-color: #FEF3C7;
    color: #92400E;
    border: 1px solid #FCD34D;
    font-size: 6.5pt;
    font-weight: 800;
    padding: 1px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    margin-bottom: 2px;
  }}

  .main-title-block {{
    background: linear-gradient(135deg, #1E3A2F 0%, #294F40 100%);
    color: #FFFFFF;
    padding: 12px 14px;
    border-radius: 6px;
    margin-bottom: 13px;
  }}

  .main-title-block h2 {{
    margin: 0 0 4px 0;
    font-size: 12.5pt;
    font-weight: 800;
    line-height: 1.25;
    letter-spacing: -0.2px;
  }}

  .main-title-block p {{
    margin: 0;
    font-size: 7.75pt;
    color: #E2E8F0;
    line-height: 1.35;
  }}

  .meta-strip {{
    margin-top: 6px;
    padding-top: 5px;
    border-top: 1px solid rgba(255,255,255,0.2);
    display: flex;
    justify-content: space-between;
    font-size: 7pt;
    color: #CBD5E1;
  }}

  .section-block {{
    margin-bottom: 11px;
  }}

  h3.section-title {{
    font-size: 9.75pt;
    font-weight: 800;
    color: #1E3A2F;
    border-left: 3.5px solid #9C6D37;
    padding-left: 7px;
    margin: 11px 0 6px 0;
    letter-spacing: -0.2px;
    page-break-after: avoid;
  }}

  p {{
    margin: 0 0 6px 0;
    text-align: justify;
  }}

  .highlight-box {{
    background-color: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-left: 3px solid #1E3A2F;
    border-radius: 5px;
    padding: 7px 10px;
    margin: 6px 0;
    font-size: 8.25pt;
    page-break-inside: avoid;
  }}

  .highlight-box.gold {{
    border-left-color: #9C6D37;
    background-color: #FCFBF7;
  }}

  .highlight-box strong {{
    color: #0F172A;
  }}

  table.data-table {{
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 7.75pt;
    page-break-inside: avoid;
  }}

  table.data-table th {{
    background-color: #1E3A2F;
    color: #FFFFFF;
    font-weight: 700;
    text-align: left;
    padding: 5px 8px;
    border: 1px solid #1E3A2F;
  }}

  table.data-table td {{
    padding: 5px 8px;
    border: 1px solid #E2E8F0;
    vertical-align: top;
  }}

  table.data-table tr:nth-child(even) td {{
    background-color: #F8FAFC;
  }}

  .qa-card {{
    background-color: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 5px;
    margin-bottom: 7px;
    page-break-inside: avoid;
  }}

  .qa-q {{
    background-color: #F1F5F2;
    padding: 5px 8px;
    font-weight: 800;
    font-size: 8.25pt;
    color: #1E3A2F;
    border-bottom: 1px solid #E2E8F0;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }}

  .qa-a {{
    padding: 6px 8px;
    font-size: 8pt;
    color: #334155;
    line-height: 1.45;
  }}

  .qa-a p:last-child {{
    margin-bottom: 0;
  }}

  ul, ol {{
    margin: 3px 0 6px 15px;
    padding: 0;
  }}

  li {{
    margin-bottom: 2px;
    line-height: 1.4;
  }}

  .page-break {{
    page-break-before: always;
  }}

  .citation-box {{
    background-color: #F8FAFC;
    border-top: 1px dashed #CBD5E1;
    margin-top: 10px;
    padding-top: 6px;
    font-size: 6.75pt;
    color: #64748B;
    line-height: 1.35;
    page-break-inside: avoid;
  }}

  .footer-sign {{
    margin-top: 10px;
    padding: 9px 12px;
    border-radius: 5px;
    background-color: #F8FAFC;
    border: 1px solid #E2E8F0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    page-break-inside: avoid;
  }}

  .footer-sign .internal-info {{
    font-size: 7.25pt;
    color: #475569;
    line-height: 1.4;
  }}

  .footer-sign .internal-info strong {{
    font-size: 8pt;
    color: #1E3A2F;
    display: block;
    margin-bottom: 2px;
  }}

  .footer-sign .sign-box {{
    text-align: right;
    font-size: 7.25pt;
    color: #334155;
  }}
</style>
</head>
<body>

  <!-- ==================== HALAMAN 1 ==================== -->
  <div class="header">
    <div class="header-left">
      {'<img src="' + logo_base64 + '" class="logo" alt="INVAC Logo">' if logo_base64 else ''}
      <div class="header-title-box">
        <h1>INVAC JEPANG</h1>
        <p class="sub">Indonesia Volunteer Community</p>
      </div>
    </div>
    <div class="header-right">
      <div class="doc-badge">DRAFT KAJIAN INTERNAL</div><br>
      Status: <strong>Belum Dipublikasikan (Internal Only)</strong><br>
      Edisi Kerja: September 2026<br>
      Inisiator: <strong>INVAC Japan</strong>
    </div>
  </div>

  <div class="main-title-block">
    <h2>DRAF KAJIAN KOMPREHENSIF & PANDUAN<br>IKHTIAR PEMAKAMAN MUSLIM WNI DI JEPANG</h2>
    <p>Tinjauan Aspek Regulasi Nasional Jepang, Sains Lingkungan (AMDAL & WHO), Kaidah Syariat Islam, Alur Tanggap Darurat, serta Panduan Tanya-Jawab (FAQ).</p>
    <div class="meta-strip">
      <span>Penyusun: Tim Riset & Advokasi INVAC (Indonesia Volunteer Community)</span>
      <span>Klasifikasi: Dokumen Kerja Internal / Draf Terbatas</span>
      <span>Sifat: Konfidensial (Internal Relawan)</span>
    </div>
  </div>

  <div class="section-block">
    <h3 class="section-title">1. LATAR BELAKANG & URGENSI SOSIAL-KEAGAMAAN</h3>
    <p>
      Pertumbuhan komunitas Muslim Indonesia di Jepang selama satu dekade terakhir mengalami lonjakan yang sangat signifikan. Berdasarkan data resmi Imigrasi Jepang, terdapat lebih dari 150.000 warga negara Indonesia (WNI) yang berdomisili di Jepang, terdiri atas pekerja berketerampilan spesifik (<em>Tokutei Ginou</em>), pemagang teknis (<em>Kenshusei</em>), tenaga medis (<em>Kaigo</em>), pelajar/mahasiswa, hingga diaspora keluarga yang telah menetap jangka panjang dan memiliki keturunan yang lahir di Jepang.
    </p>
    <p>
      Di tengah realitas tersebut, kebutuhan akan <strong>fasilitas pemakaman yang sesuai dengan syariat Islam</strong> telah menjadi kebutuhan darurat dan kewajiban kolektif (<em>Fardhu Kifayah</em>) yang tidak dapat ditunda lagi, didasari oleh faktor-faktor krusial berikut:
    </p>
    <ul>
      <li><strong>Kewajiban Syariat Menyegerakan Jenazah:</strong> Dalam ajaran Islam, pengurusan jenazah diwajibkan untuk disegerakan (<em>sunnah ta'jil janazah</em>). Praktik pengiriman jenazah lintas negara (repatriasi kargo udara) memerlukan birokrasi berliku, perizinan kedutaan, karantina internasional, serta koordinasi maskapai yang rata-rata memakan waktu 3 hingga 7 hari lebih.</li>
      <li><strong>Beban Biaya Repatriasi yang Sangat Tinggi:</strong> Biaya kargo udara pemulangan satu jenazah dari Jepang ke Indonesia berkisar antara <strong>¥1.000.000 hingga ¥1.500.000+</strong> (sekitar Rp 110–170 juta). Tidak semua pekerja, pelajar, anak-anak, atau keluarga WNI memiliki cakupan asuransi kematian internasional yang memadai, sehingga kerap menimbulkan beban finansial mendalam bagi keluarga duka.</li>
      <li><strong>Keluarga yang Berdomisili Permanen:</strong> Semakin banyak diaspora Muslim Indonesia yang menikah, beranak-cucu, dan menetap di Jepang. Memiliki tempat pemakaman lokal yang layak memungkinkan keluarga dan keturunannya untuk berziarah dan merawat makam leluhurnya di Jepang secara bermartabat.</li>
    </ul>
  </div>

  <div class="section-block">
    <h3 class="section-title">2. KERANGKA HUKUM & LEGALITAS PEMAKAMAN DI JEPANG</h3>
    <p>
      Terdapat kesalahpahaman di sebagian masyarakat bahwa metode penguburan tanah (<em>土葬 - Doso</em>) adalah tindakan terlarang di Jepang. Secara hukum ketatanegaraan Jepang, pandangan tersebut adalah <strong>keliru</strong>:
    </p>
    <div class="highlight-box">
      <strong>Undang-Undang Pemakaman Jepang (墓地、埋葬等に関する法律 - UU No. 48 Tahun 1948):</strong><br>
      Hukum nasional Jepang pada Pasal 1 dan Pasal 2 secara tegas mendefinisikan dan mengakui dua metode pemakaman yang sah dan setara di mata hukum:
      <strong>Kremasi (火葬 - Kaso)</strong> dan <strong>Penguburan Tanah (埋葬 / 土葬 - Maiso / Doso)</strong>. Pemerintah pusat Jepang tidak pernah melarang <em>doso</em>. Dominasi kremasi di Jepang (>99%) murni disebabkan oleh keterbatasan lahan di kawasan metropolitan pasca-Perang Dunia II, bukan karena pelarangan yuridis.
    </div>
    <p>
      <strong>Model Pendekatan Program INVAC:</strong><br>
      Tim INVAC (Indonesia Volunteer Community) <strong>TIDAK MEMBUKA LAHAN MAKAM BARU DARI NOL</strong> di pemukiman warga. Ikhtiar difokuskan pada akuisisi dan sewa hak kapling jangka panjang pada kompleks pemakaman umum resmi yang <strong>IZIN PENGUBURAN TANAHNYA (土葬) TELAH LENGKAP DAN DITERBITKAN SECARA SAH OLEH PEMERINTAH DAERAH / PREFEKTUR SETEMPAT</strong>. Dengan demikian, seluruh kepatuhan hukum, tata ruang, dan administrasi telah terpenuhi sejak awal tanpa memerlukan permohonan izin baru.
    </p>
  </div>

  <!-- ==================== HALAMAN 2 ==================== -->
  <div class="page-break"></div>

  <div class="section-block">
    <h3 class="section-title">3. KAJIAN ILMIAH: BUKTI BEBAS CEMARAN AIR & LINGKUNGAN</h3>
    <p>
      Kekhawatiran bahwa pemakaman tanah menyebabkan pencemaran air tanah, air sumur, atau penyebaran penyakit adalah prasangka yang terbantahkan oleh ilmu hidrologi dan sanitasi modern:
    </p>

    <div class="highlight-box gold">
      <strong>1. Kajian Resmi World Health Organization (WHO):</strong><br>
      Laporan ilmiah WHO Regional Office for Europe bertajuk <em>"The Impact of Cemeteries on the Environment and Public Health"</em> (Engelbrecht, 1998) menegaskan bahwa lapisan tanah alami (<em>vadose zone</em>) merupakan biofilter biologis yang sangat kuat. Mikroorganisme patogen manusia (bakteri dan virus) memerlukan inang hidup bersuhu tubuh ~37°C. Di dalam tanah alami yang lebih dingin, mikroba patogen mengalami kematian massal alami (<em>die-off</em>) dalam beberapa meter pertama dan tidak bermigrasi ke air tanah jika pemakaman memenuhi standar jarak muka air tanah.
    </div>

    <div class="highlight-box">
      <strong>2. Keunggulan Ekologis Syariat Islam: "Green Burial" Murni:</strong><br>
      Studi lingkungan global menunjukkan bahwa pencemaran di pemakaman Barat bersumber dari <strong>cairan formalin (formaldehyde)</strong> pengawet mayat dan <strong>logam berat</strong> dari peti berhias (seng, timbal, pernis kimia).<br>
      Sebaliknya, dalam syariat Islam:
      <ul>
        <li><strong>0% Pengawet Kimia:</strong> Jenazah Muslim haram diawetkan dengan formalin.</li>
        <li><strong>100% Biodegradable:</strong> Jenazah hanya dibungkus kain katun/mori alami dan diletakkan di liang lahat tanpa peti logam/pernis beracun. Jasad menyatu alami dengan tanah tanpa residu kimia berbahaya.</li>
      </ul>
    </div>

    <p>
      <strong>3. Standar Sanitasi Kementerian Kesehatan Jepang (Koseirodosho):</strong><br>
      Setiap kompleks pemakaman berizin di Jepang wajib melewati evaluasi teknis ketat sebelum izin operasional terbit, mencakup kedalaman lapisan kedap air, jarak aman dari sungai/saluran air, serta kemiringan kontur tanah guna memastikan keamanan air baku konsumsi warga.
    </p>
  </div>

  <div class="section-block">
    <h3 class="section-title">4. KOMPARASI: KASUS HIJI/BEPPU VS INVENTARISASI INVAC</h3>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 25%;">Parameter</th>
          <th style="width: 37%;">Kasus Hiji / Beppu (Oita)</th>
          <th style="width: 38%;">Rencana Pendekatan INVAC</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Status Lokasi</strong></td>
          <td>Membuka lahan hutan/kebun baru dari nol di dekat sumber waduk air warga.</td>
          <td><strong>Membeli kapling di kompleks pemakaman umum resmi yang SUDAH BERDIRI.</strong></td>
        </tr>
        <tr>
          <td><strong>Status Izin Doso</strong></td>
          <td>Belum ada; harus mengajukan izin baru ke bupati dan memicu dinamika politik lokal.</td>
          <td><strong>Izin Doso (土葬) SUDAH LENGKAP & SAH sejak kompleks makam beroperasi.</strong></td>
        </tr>
        <tr>
          <td><strong>Uji AMDAL Lingkungan</strong></td>
          <td>Belum pernah dilakukan sebelumnya sehingga menimbulkan kecurigaan warga sekitar.</td>
          <td><strong>Sudah lolos uji sanitasi & tata kelola air oleh otoritas kesehatan prefektur.</strong></td>
        </tr>
        <tr>
          <td><strong>Risiko Penolakan</strong></td>
          <td>Tinggi, karena merubah peruntukan tata ruang baru.</td>
          <td><strong>Sangat aman, karena memanfaatkan fasilitas berizin peruntukan makam.</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section-block">
    <h3 class="section-title">5. BUKTI EMPIRIS DI JEPANG: PULUHAN TAHUN TANPA INSIDEN</h3>
    <p>
      Penguburan tanah Muslim telah berjalan puluhan tahun di berbagai wilayah Jepang dengan rekam jejak sanitasi 100% aman:
    </p>
    <ul>
      <li><strong>Pemakaman Muslim Enzan (Koshu, Yamanashi):</strong> Dikelola komunitas Muslim sejak tahun 2000-an di tengah sentra perkebunan buah persik dan anggur. Selama lebih dari 20 tahun dan ratusan pemakaman, hasil uji laboratorium air sumur warga sekitar membuktikan kemurnian air tetap terjaga sempurna tanpa ada insiden kontaminasi.</li>
      <li><strong>Pemakaman Muslim Yoichi (Hokkaido):</strong> Melayani umat Islam di kawasan utara Jepang secara tertib dan harmonis berdampingan dengan masyarakat lokal.</li>
      <li><strong>Kobe Foreign Cemetery (Hyogo) & Makam Kristen Kanto:</strong> Praktik penguburan tanah telah berlangsung lebih dari 150 tahun sejak era Meiji di area penyangga perkotaan tanpa pernah mencatat gangguan kesehatan masyarakat.</li>
      <li><strong>Tradisi Kekaisaran Jepang:</strong> Selama ribuan tahun hingga era modern, para Kaisar dan Permaisuri Jepang dimakamkan secara tradisi penguburan tanah (<em>Doso</em>).</li>
    </ul>
  </div>

  <!-- ==================== HALAMAN 3 ==================== -->
  <div class="page-break"></div>

  <div class="section-block">
    <h3 class="section-title">6. TANYA JAWAB RESMI (FAQ) — BAGIAN 1</h3>

    <div class="qa-card">
      <div class="qa-q">Q1: Apakah pemakaman tanah ini berizin resmi dan legal di Jepang?</div>
      <div class="qa-a">
        <strong>Jawaban: Ya, 100% sah dan berizin resmi.</strong><br>
        Berdasarkan UU No. 48 Tahun 1948, penguburan tanah sah di Jepang. Skema yang dirancang adalah mengakuisisi kapling pada pemakaman umum resmi yang izin Doso-nya sudah disahkan pemerintah daerah setempat, sehingga tidak ada perizinan liar maupun sanksi hukum.
      </div>
    </div>

    <div class="qa-card">
      <div class="qa-q">Q2: Apakah pemakaman ini khusus untuk Muslim?</div>
      <div class="qa-a">
        <strong>Jawaban: Ya, 100% Khusus Muslim.</strong><br>
        Kapling dialokasikan khusus bagi jenazah Muslim WNI. Seluruh tata cara pemulasaraan jenazah (memandikan, mengkafani, menyalatkan, dan menguburkan menghadap kiblat) dilaksanakan mutlak sesuai syariat Islam.
      </div>
    </div>

    <div class="qa-card">
      <div class="qa-q">Q3: Mengapa nama kota atau lokasi detail tidak dipublikasikan terbuka di medsos?</div>
      <div class="qa-a">
        <strong>Jawaban:</strong><br>
        1. <em>Menjaga Privasi & Ketenangan:</em> Menghormati regulasi privasi pihak pengelola kompleks makam.<br>
        2. <em>Mencegah Politisasi Pihak Luar:</em> Di Jepang, isu pemakaman tanah rentan dipolitisasi oleh kelompok tertentu jika diekspos sembarangan di ranah terbuka.<br>
        3. <em>Akses Terbuka bagi Pihak Terkait:</em> Informasi detail lokasi, koordinat ziarah, dan dokumen legalitas diakses secara tertutup dan terverifikasi via jalur resmi relawan.
      </div>
    </div>

    <div class="qa-card">
      <div class="qa-q">Q4: Apakah pemakaman jenazah mencemari air tanah atau sumber air minum warga?</div>
      <div class="qa-a">
        <strong>Jawaban: Sama sekali tidak.</strong><br>
        Laporan WHO membuktikan tanah adalah biofilter alami yang menguraikan patogen secara tuntas. Pemakaman Muslim adalah <em>Green Burial</em> murni tanpa formalin pengawet dan tanpa peti logam beracun. Pemakaman Muslim Enzan di sentra perkebunan Yamanashi telah membuktikan selama >20 tahun kualitas air tetap 100% higienis.
      </div>
    </div>

    <div class="qa-card">
      <div class="qa-q">Q5: Mengapa tidak dipulangkan (repatriasi) saja ke Indonesia dengan asuransi?</div>
      <div class="qa-a">
        <strong>Jawaban:</strong><br>
        1. <em>Syariat Menyegerakan Jenazah:</em> Repatriasi kargo udara internasional memerlukan waktu 3–7 hari lebih, bertentangan dengan anjuran menyegerakan pemakaman.<br>
        2. <em>Biaya Sangat Tinggi:</em> Pemulangan memakan biaya ¥1.000.000 s/d ¥1.500.000+ (Rp 110–170 juta). Asuransi tidak selalu mencakup seluruh kalangan keluarga, anak-anak, atau pelajar.<br>
        3. <em>Kemandirian Jangka Panjang:</em> Memiliki pemakaman sendiri di Jepang adalah pemenuhan Fardhu Kifayah dan perlindungan martabat bagi generasi Muslim di perantauan.
      </div>
    </div>
  </div>

  <!-- ==================== HALAMAN 4 ==================== -->
  <div class="page-break"></div>

  <div class="section-block">
    <h3 class="section-title">6. TANYA JAWAB RESMI (FAQ) — BAGIAN 2</h3>

    <div class="qa-card">
      <div class="qa-q">Q6: Bagaimana sistem pemanfaatan lahannya?</div>
      <div class="qa-a">
        <strong>Jawaban:</strong> Menggunakan hak pakai kapling jangka panjang yang dapat digunakan kembali secara bergantian (<em>reusable</em>) setelah masa pakai tertentu (misal 10 tahun) sesuai ketentuan syariat dan tata kelola pemakaman di Jepang, menjamin keberlanjutan pemanfaatan selama puluhan tahun.
      </div>
    </div>

    <div class="qa-card">
      <div class="qa-q">Q7: Bagaimana cara koordinasi dan verifikasi informasi draf ini?</div>
      <div class="qa-a">
        <strong>Jawaban:</strong> Dokumen ini merupakan bahan kajian awal tim kerja INVAC (Indonesia Volunteer Community). Koordinasi dan masukan teknis dikomunikasikan secara internal melalui narahubung koordinator relawan.
      </div>
    </div>
  </div>

  <div class="section-block">
    <h3 class="section-title">7. ALUR TANGGAP DARURAT PENGURUSAN JENAZAH WNI DI JEPANG</h3>
    <p>
      Sebagai panduan praktis bagi keluarga, rekan kerja, dan relawan apabila terjadi musibah kematian saudara kita di Jepang:
    </p>
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; margin: 9px 0;">
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:5px; padding:7px 8px;">
        <div style="font-weight:800; font-size:7pt; color:#9C6D37; margin-bottom:2px;">LANGKAH 1</div>
        <div style="font-weight:700; font-size:7.75pt; color:#1E3A2F; margin-bottom:2px;">Medis / Kepolisian</div>
        <div style="font-size:7pt; color:#475569; line-height:1.35;">Mendapatkan Surat Kematian resmi (<em>Shibou Shindansho / 死亡診断書</em>) dari dokter rumah sakit.</div>
      </div>
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:5px; padding:7px 8px;">
        <div style="font-weight:800; font-size:7pt; color:#9C6D37; margin-bottom:2px;">LANGKAH 2</div>
        <div style="font-weight:700; font-size:7.75pt; color:#1E3A2F; margin-bottom:2px;">Balai Kota (Yakusho)</div>
        <div style="font-size:7pt; color:#475569; line-height:1.35;">Melaporkan ke Balai Kota setempat untuk menerbitkan Izin Pemakaman Tanah (<em>Maiso Kyokasho / 埋葬許可証</em>).</div>
      </div>
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:5px; padding:7px 8px;">
        <div style="font-weight:800; font-size:7pt; color:#9C6D37; margin-bottom:2px;">LANGKAH 3</div>
        <div style="font-weight:700; font-size:7.75pt; color:#1E3A2F; margin-bottom:2px;">Konsuler KBRI/KJRI</div>
        <div style="font-size:7pt; color:#475569; line-height:1.35;">Pelaporan ke perwakilan RI (KBRI Tokyo / KJRI Osaka) untuk pencatatan sipil & penerbitan surat keterangan.</div>
      </div>
      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:5px; padding:7px 8px;">
        <div style="font-weight:800; font-size:7pt; color:#9C6D37; margin-bottom:2px;">LANGKAH 4</div>
        <div style="font-weight:700; font-size:7.75pt; color:#1E3A2F; margin-bottom:2px;">Satgas Relawan INVAC</div>
        <div style="font-size:7pt; color:#475569; line-height:1.35;">Koordinasi pemulasaraan syar'i (memandikan, mengkafani, menyalatkan) & pemakaman di kapling makam Muslim.</div>
      </div>
    </div>
  </div>

  <div class="section-block">
    <h3 class="section-title">8. CATATAN PENGGUNAAN INTERNAL RELAWAN</h3>
    <div class="footer-sign">
      <div class="internal-info">
        <strong>CATATAN INTERNAL INVAC (INDONESIA VOLUNTEER COMMUNITY):</strong>
        • Dokumen ini berstatus draf kerja kajian awal dan <em>TIDAK UNTUK DISEBARLUASKAN</em> ke publik.<br>
        • Disusun sebagai bahan telaah ilmiah, legalitas, dan mitigasi risiko internal tim relawan.<br>
        • Seluruh koordinasi dan masukan teknis ditujukan ke Koordinator Tim Advokasi INVAC.
      </div>
      <div class="sign-box">
        Tokyo, September 2026<br>
        <strong>Tim Riset & Advokasi INVAC</strong><br>
        <em>Indonesia Volunteer Community</em>
      </div>
    </div>
  </div>

  <div class="citation-box">
    <strong>Daftar Rujukan Dokumen Ilmiah & Regulasi:</strong><br>
    1. World Health Organization (WHO). (1998). <em>The Impact of Cemeteries on the Environment and Public Health</em>. WHO Regional Office for Europe, Copenhagen.<br>
    2. 墓地、埋葬等に関する法律 (昭和二十三年法律第四十八号 / <em>Law on Cemeteries, Burials, etc. No. 48 of 1948</em>).<br>
    3. 厚生労働省 (Kementerian Kesehatan, Tenaga Kerja, dan Kesejahteraan Jepang). <em>墓地経営・管理の指針等について (Pedoman Pengelolaan dan Manajemen Pemakaman)</em>.<br>
    4. Dent, B. B., & Knight, M. J. (1998). <em>Cemeteries: a review of groundwater concerns</em>. Environmental Geology, 36(1-2).
  </div>

</body>
</html>
"""

    html_file = '/tmp/draft_kajian_pemakaman_invac.html'
    pdf_file = 'docs/Draft_Kajian_dan_FAQ_Pemakaman_INVAC.pdf'

    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_content)

    chrome_cmd = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_file}",
        html_file
    ]

    res = subprocess.run(chrome_cmd, capture_output=True, text=True)
    if os.path.exists(pdf_file) and os.path.getsize(pdf_file) > 0:
        print(f"PDF successfully generated locally at: {pdf_file} ({os.path.getsize(pdf_file)} bytes)")
    else:
        print(f"Error generating PDF: {res.stderr}")

if __name__ == '__main__':
    main()
