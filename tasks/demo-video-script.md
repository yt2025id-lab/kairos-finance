# Kairos Finance — Demo Video Script

> **Total Duration:** ~4 minutes
> **Format:** Screen recording + voiceover
> **Tools:** OBS/Loom untuk recording, CapCut/Premiere untuk edit
> **Upload:** YouTube (Unlisted atau Public)

---

## PRE-RECORDING CHECKLIST

Sebelum mulai recording:

1. Buka **kairosfinance.vercel.app/deposit** di Chrome (fullscreen, dark mode)
2. Login dengan wallet yang sudah punya **Base Sepolia ETH** (untuk gas)
3. Pastikan wallet di **Base Sepolia network**
4. Claim faucet USDC kalau belum ada balance
5. Buka tab kedua: **GitHub repo** (github.com/yt2025id-lab/kairos-finance)
6. Buka tab ketiga: **VS Code** dengan `cre-workflow/src/handler.ts` terbuka
7. Siapkan gambar **Architecture Diagram** (bisa dari pitchdeck slide 4)
8. Test microphone — clear voice, no background noise

---

## SECTION 1: HOOK + PROBLEM
**[0:00 — 0:30] (30 detik)**

### Screen:
- Tampilkan halaman deposit Kairos Finance dengan 4 APY cards terlihat jelas

### Voiceover (English):

> "Right now on Base, there are four major lending protocols for USDC — Aave, Compound, Moonwell, and Morpho. Each one offers a different interest rate, and these rates change constantly.
>
> Most DeFi users pick one protocol and stick with it, leaving better yields on the table. What if an AI could analyze every protocol in real-time, score them across multiple risk dimensions, and automatically deploy your funds to the best one?
>
> That's Kairos Finance."

### Voiceover (Indonesian):

> "Saat ini di Base, ada empat protokol lending utama untuk USDC — Aave, Compound, Moonwell, dan Morpho. Masing-masing menawarkan bunga yang berbeda, dan rate ini berubah terus setiap saat.
>
> Kebanyakan user DeFi memilih satu protokol dan tetap di sana, kehilangan yield yang lebih baik. Bagaimana kalau ada AI yang bisa menganalisis semua protokol secara real-time, memberikan skor dari berbagai dimensi risiko, dan otomatis menempatkan dana kamu di protokol terbaik?
>
> Itulah Kairos Finance."

---

## SECTION 2: SOLUTION OVERVIEW
**[0:30 — 1:00] (30 detik)**

### Screen:
- Tampilkan Architecture Diagram (dari slide 4 pitchdeck)
- Atau animasi sederhana: User → Vault → CRE → AI → Controller → Protocol

### Voiceover (English):

> "Kairos Finance works in three simple steps. First, you deposit USDC into our ERC-4626 vault. Second, you choose your investment timeline — one month, three months, six months, or a year. Third, you click Optimize, and our Chainlink CRE workflow takes over.
>
> The workflow reads live APY data from all four protocols on-chain, sends it to Claude AI for analysis, and delivers a signed recommendation back on-chain. Your funds are automatically deployed to the winning protocol. One click. Best yield."

### Voiceover (Indonesian):

> "Kairos Finance bekerja dalam tiga langkah sederhana. Pertama, deposit USDC ke vault ERC-4626 kami. Kedua, pilih jangka waktu investasi — satu bulan, tiga bulan, enam bulan, atau setahun. Ketiga, klik Optimize, dan Chainlink CRE workflow kami mengambil alih.
>
> Workflow membaca data APY secara live dari keempat protokol di on-chain, mengirimkannya ke Claude AI untuk dianalisis, dan mengirimkan rekomendasi yang sudah ditandatangani kembali ke on-chain. Dana kamu otomatis ditempatkan di protokol pemenang. Satu klik. Yield terbaik."

---

## SECTION 3: CHAINLINK CRE DEEP DIVE
**[1:00 — 1:30] (30 detik)**

### Screen:
- Switch ke **VS Code** — tampilkan `cre-workflow/src/handler.ts`
- Highlight code snippets:
  1. `EVMClient` reading Aave APY (line ~67-68)
  2. `runtime.runInNodeMode()` calling Claude AI (line ~86-91)
  3. `prepareReportRequest()` + `writeReport()` (line ~111-120)
- Atau tampilkan tabel 7 CRE products dari slide 5

### Voiceover (English):

> "Let me show you the Chainlink integration. Our CRE workflow uses SEVEN Chainlink products in a single pipeline.
>
> EVMClient reads live APY directly from on-chain protocol contracts — no external APIs needed. HTTPClient fetches Morpho data and calls Claude AI. CRE Secrets securely stores the API key. And writeReport delivers the AI recommendation on-chain with DON consensus.
>
> Every step is decentralized. Every step is verifiable. This isn't a backend server calling an API — this is Chainlink's oracle network running the entire AI yield optimization pipeline."

### Voiceover (Indonesian):

> "Izinkan saya tunjukkan integrasi Chainlink-nya. CRE workflow kami menggunakan TUJUH produk Chainlink dalam satu pipeline.
>
> EVMClient membaca APY secara live langsung dari kontrak protokol di on-chain — tidak perlu API eksternal. HTTPClient mengambil data Morpho dan memanggil Claude AI. CRE Secrets menyimpan API key secara aman. Dan writeReport mengirimkan rekomendasi AI ke on-chain dengan konsensus DON.
>
> Setiap langkah terdesentralisasi. Setiap langkah bisa diverifikasi. Ini bukan server backend yang memanggil API — ini jaringan oracle Chainlink yang menjalankan seluruh pipeline optimasi yield AI."

---

## SECTION 4: LIVE DEMO
**[1:30 — 3:30] (2 menit)**

> Ini bagian terpenting! Tunjukkan flow lengkap di frontend.

### Step 1: Connect & Faucet [1:30 - 1:50]

**Screen:** kairosfinance.vercel.app/deposit
**Action:** Sudah logged in, tunjukkan wallet address di header

**Voiceover (EN):**
> "Here's our live demo on Base Sepolia testnet. I'm connected with my wallet. First, let me claim some test USDC from our built-in faucet."

**Voiceover (ID):**
> "Ini demo live kami di testnet Base Sepolia. Saya sudah terhubung dengan wallet. Pertama, saya claim USDC test dari faucet bawaan kami."

**Action:** Klik "Claim 100 USDC" → tunjukkan Wallet Balance berubah

---

### Step 2: Show Live APY [1:50 - 2:00]

**Screen:** Scroll ke Live Protocol Rates section

**Voiceover (EN):**
> "Notice these live protocol rates — fetched directly from on-chain contracts on Base mainnet. Aave is offering X percent, Compound X percent, Moonwell X percent, and Morpho X percent. These update every minute."

**Voiceover (ID):**
> "Perhatikan rate protokol live ini — diambil langsung dari kontrak on-chain di Base mainnet. Aave menawarkan X persen, Compound X persen, Moonwell X persen, dan Morpho X persen. Ini update setiap menit."

---

### Step 3: Deposit [2:00 - 2:20]

**Screen:** Scroll ke Deposit section
**Action:**
1. Ketik "100" di amount field
2. Klik "Approve USDC" → confirm di wallet
3. Tunggu approval selesai
4. Klik "Deposit 100 USDC" → confirm di wallet
5. Tunggu deposit selesai → Vault Balance berubah

**Voiceover (EN):**
> "Now I'll deposit 100 USDC. First, approve the vault to spend our USDC... and now deposit. You can see the vault balance updated instantly."

**Voiceover (ID):**
> "Sekarang saya deposit 100 USDC. Pertama, approve vault untuk menggunakan USDC kita... dan sekarang deposit. Vault balance langsung terupdate."

---

### Step 4: Choose Timeline & Optimize [2:20 - 2:40]

**Screen:** Scroll ke timeline selection
**Action:**
1. Klik "6 Months" button
2. Klik "Optimize for 6 Months"
3. Confirm di wallet
4. Tunjukkan "AI Analysis in Progress" card

**Voiceover (EN):**
> "Now I choose a 6-month investment horizon and click Optimize. This triggers a StrategyRequested event on-chain, which activates our Chainlink CRE workflow. The AI is now reading live APY from all four protocols and analyzing which one is best for a 6-month timeline."

**Voiceover (ID):**
> "Sekarang saya pilih horizon investasi 6 bulan dan klik Optimize. Ini memicu event StrategyRequested di on-chain, yang mengaktifkan Chainlink CRE workflow kami. AI sekarang sedang membaca APY live dari keempat protokol dan menganalisis mana yang terbaik untuk jangka waktu 6 bulan."

---

### Step 5: Show AI Analysis Results [2:40 - 3:10]

**Screen:** Setelah CRE workflow selesai, tunjukkan:
1. **Active Position** card — protocol name, amount deployed, timeline
2. **AI Analysis** card — confidence bar, risk score, weighted scores, score breakdown, alternatives
3. **Recommendation History** — past recommendations

> **NOTE:** Jika CRE workflow belum live, bisa tunjukkan mock/screenshot dari design. Atau jalankan DemoE2E.s.sol forge script dan tunjukkan hasilnya.

**Voiceover (EN):**
> "And here are the results. The AI recommended Aave V3 with 85% confidence and a risk score of 91 out of 100. You can see the weighted scores for every protocol — APY, Safety, TVL depth, and Stability — and why Aave won.
>
> Below that, we show the alternatives with explanations. Morpho scored second with slightly higher APY but lower TVL. Compound third. Every decision is transparent and on-chain.
>
> And here's the recommendation history — every AI analysis is stored as an on-chain event, fully auditable."

**Voiceover (ID):**
> "Dan ini hasilnya. AI merekomendasikan Aave V3 dengan confidence 85% dan risk score 91 dari 100. Kamu bisa lihat skor berbobot untuk setiap protokol — APY, Safety, TVL, dan Stability — dan kenapa Aave menang.
>
> Di bawahnya, kami tampilkan alternatif dengan penjelasan. Morpho di urutan kedua dengan APY sedikit lebih tinggi tapi TVL lebih rendah. Compound ketiga. Setiap keputusan transparan dan on-chain.
>
> Dan ini recommendation history — setiap analisis AI tersimpan sebagai event on-chain, bisa diaudit sepenuhnya."

---

### Step 6: Withdraw (Optional) [3:10 - 3:20]

**Screen:** Klik "Withdraw from Protocol"

**Voiceover (EN):**
> "And of course, you can withdraw anytime with one click. Full control, always."

**Voiceover (ID):**
> "Dan tentu saja, kamu bisa withdraw kapan saja dengan satu klik. Kontrol penuh, selalu."

---

## SECTION 5: TECHNICAL HIGHLIGHTS + CLOSING
**[3:20 — 4:00] (40 detik)**

### Screen:
- Tampilkan GitHub repo briefly (folder structure)
- Tampilkan contract addresses di BaseScan (opsional)
- Kembali ke halaman deposit sebagai closing shot

### Voiceover (English):

> "To recap the technical depth: seven deployed smart contracts on Base Sepolia with 17 unit tests all passing. Seven Chainlink CRE products integrated in a single workflow. AI-powered weighted scoring that adapts to each user's timeline. Full ERC-4626 vault with strategy adapter pattern.
>
> And everything is open source — check our GitHub for the complete codebase.
>
> Kairos Finance — the right moment to optimize your yield is now. Thank you."

### Voiceover (Indonesian):

> "Untuk merangkum kedalaman teknis: tujuh smart contract yang sudah di-deploy di Base Sepolia dengan 17 unit test yang semua lulus. Tujuh produk Chainlink CRE terintegrasi dalam satu workflow. Scoring AI berbobot yang menyesuaikan dengan timeline setiap user. Vault ERC-4626 lengkap dengan strategy adapter pattern.
>
> Dan semuanya open source — cek GitHub kami untuk codebase lengkapnya.
>
> Kairos Finance — saat yang tepat untuk mengoptimalkan yield kamu adalah sekarang. Terima kasih."

---

## POST-PRODUCTION TIPS

### Recording:
- **Resolution:** 1920x1080 minimum (1080p)
- **Frame rate:** 30 fps
- **Audio:** Record voiceover separately kalau bisa (kualitas lebih baik)
- **Browser:** Fullscreen, hide bookmarks bar, clean tabs

### Editing:
- Tambahkan **text overlay** di pojok untuk setiap section (Problem, Solution, CRE Integration, Live Demo, etc.)
- Tambahkan **zoom in** saat menunjukkan code atau UI detail
- **Speed up** waiting time (wallet confirmation, transaction processing)
- Tambahkan **subtle background music** (royalty-free, low volume)
- Tambahkan **Kairos Finance logo** di intro dan outro

### Timing Guide:
| Section | Duration | Cumulative |
|---------|----------|------------|
| Hook + Problem | 30s | 0:30 |
| Solution Overview | 30s | 1:00 |
| CRE Deep Dive | 30s | 1:30 |
| Live Demo | 120s | 3:30 |
| Tech + Closing | 30s | 4:00 |

### Upload:
- YouTube Unlisted atau Public
- Title: "Kairos Finance — AI-Powered Yield Optimization | Chainlink Convergence 2025"
- Description: Include GitHub link, live demo link, track names
