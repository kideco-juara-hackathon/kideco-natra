
<div align="center">
  <img src="frontend/public/natralogowithbackground.png" alt="NATRA" width="460" />
</div>

<p align="center">
  <br/>
  <strong>NATRA</strong> &mdash; <em>Navigation, Asset, Transport, Routing & Analytics</em>
  <br/>
  Platform pendukung keputusan logistik hauling secara real-time untuk operasi tambang modern.
  <br/><br/>
</p>

<div align="center">

[![KIC 2026](https://img.shields.io/badge/KIC_2026-Hackathon-DC2626?style=flat-square)](https://github.com/kideco-juara-hackathon/kideco-natra)
[![Status](https://img.shields.io/badge/Status-MVP-22C55E?style=flat-square)](https://github.com/kideco-juara-hackathon/kideco-natra)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

</div>

---

## Apa itu NATRA?

NATRA adalah platform kendali logistik hauling terpadu yang dirancang khusus untuk kebutuhan dispatcher tambang batubara. Di balik layar dasbornya yang sederhana, NATRA menyatukan tiga pilar teknologi utama: optimasi rute berbasis algoritma Dijkstra, prediksi ETA dan konsumsi bahan bakar menggunakan model machine learning (RandomForest & XGBoost), serta pemantauan kesehatan armada secara real-time dengan deteksi anomali IsolationForest.

Dalam operasi hauling konvensional, dispatcher seringkali harus mengambil keputusan penting — memilih rute mana, kapan memberangkatkan truk, armada mana yang perlu perhatian — hanya berdasarkan intuisi dan pengalaman. NATRA hadir untuk mengubah proses itu. Setiap keputusan didukung oleh data sensor langsung dari truk, model prediktif yang belajar dari pola operasional, dan antarmuka yang dirancang agar informasi kritis selalu tersedia dalam satu pandangan.

Platform ini memproses telemetri kendaraan setiap 2 detik — mencakup RPM mesin, tekanan oli, suhu coolant, tekanan bahan bakar, dan enam parameter sensor lainnya — lalu menghitung skor kesehatan armada secara kontinu. Ketika skor menurun atau anomali terdeteksi, notifikasi peringatan langsung muncul di Command Center sebelum kerusakan menjadi downtime yang merugikan.

NATRA dibangun sebagai jawaban atas tantangan nyata di lapangan operasi PT Kideco Jaya Agung, dan dikembangkan dalam rangka **KIC 2026 Hackathon**.

> Dibangun untuk **KIC 2026 Hackathon** · PT Kideco Jaya Agung

---

## Fitur Unggulan

<br/>

<div align="center">
  <img src="docs/photosreadme/screenshot.png" alt="NATRA Dashboard — Kendali Operasi Hauling" width="880" />
  <br/>
  <sub><em>Dasbor NATRA — Pemantauan armada, intelijen rute, dan analitik prediktif dalam satu tampilan.</em></sub>
</div>

<br/>

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>🗺️&nbsp; Intelijen Rute</h3>
      <p>Rekomendasi rute optimal berbasis algoritma Dijkstra dengan perbandingan multi-metrik — ETA, konsumsi BBM, payload, waktu antrean, dan risiko jalan. Dispatcher dapat memilih strategi <em>Seimbang</em>, <em>Hemat BBM</em>, atau <em>Antrean Minimum</em>.</p>
    </td>
    <td width="50%" valign="top">
      <h3>📡&nbsp; Command Center</h3>
      <p>Pemantauan armada secara real-time dengan peta interaktif, posisi kendaraan langsung, panel telemetri per truk, dan notifikasi peringatan terintegrasi — semua diperbarui setiap 2 detik dari backend.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>🔧&nbsp; Pemeliharaan Prediktif</h3>
      <p>Penilaian kesehatan berbasis ML menggunakan model <strong>IsolationForest</strong> yang dilatih pada 6 aliran sensor: RPM, tekanan oli, suhu coolant, tekanan bahan bakar, tekanan coolant, dan suhu oli pelumas. Skor kesehatan diperbarui di setiap tick telemetri.</p>
    </td>
    <td width="50%" valign="top">
      <h3>⚡&nbsp; Prediksi ETA & BBM</h3>
      <p>Model <strong>RandomForest</strong> (ETA) dan <strong>XGBoost</strong> (BBM) terintegrasi ke dalam mesin prediksi, dengan fallback berbasis fisika per segmen. Estimasi dihitung per segmen rute dan diakumulasikan untuk perjalanan penuh.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>📊&nbsp; Monitor Rute</h3>
      <p>Tampilan tabel semua perjalanan aktif dalam tiga lensa — Ikhtisar, ETA, dan BBM — dengan panel detail per truk yang menampilkan skor kesehatan, progres perjalanan, dan riwayat telemetri per segmen.</p>
    </td>
    <td width="50%" valign="top">
      <h3>🚛&nbsp; Manajemen Armada</h3>
      <p>Siklus shift penuh: mulai shift, tugaskan truk, berangkatkan ke titik loading, pantau progres perjalanan, dan monitor akumulasi jam mesin untuk deteksi wear-out di seluruh armada.</p>
    </td>
  </tr>
</table>

---

## Alur Kerja Dispatcher

```
Dispatcher memilih truk & tujuan
            ↓
Backend memuat jaringan jalan (node & edge)
            ↓
Mesin rute merekomendasikan jalur optimal (Dijkstra)
            ↓
Model ML menghitung ETA / BBM / skor kesehatan
            ↓
Dispatcher meninjau rekomendasi & memberangkatkan truk
            ↓
Command Center memantau progres & telemetri langsung
```

---

## Armada

<div align="center">
  <img src="frontend/public/hauling_truck.png" width="200" alt="Dump Truck" />
  <br/>
  <sub>Dump Truck</sub>
</div>

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | Next.js 16 (React 19), TypeScript, Tailwind CSS 4 |
| **Komponen UI** | Shadcn/ui, Base UI, Lucide React |
| **Visualisasi** | Recharts, Leaflet / react-leaflet |
| **Backend** | FastAPI 0.115, Python 3.12 |
| **Model ML** | scikit-learn (IsolationForest), XGBoost, RandomForest |
| **Database** | PostgreSQL 16, SQLAlchemy 2.0, Alembic |
| **Simulator** | Python async HTTP telemetry simulator |
| **Infrastruktur** | Docker Compose, Uvicorn ASGI |

---

## Mulai Cepat

### Prasyarat

- Node.js 20+, Python 3.12+, Docker & Docker Compose

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Backend (Docker — direkomendasikan)

```bash
docker compose up --build
# API  → http://localhost:8000
# Docs → http://localhost:8000/docs
```

### Backend (lokal)

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### Simulator Telemetri

```bash
cd simulator
pip install -r requirements.txt

python telemetry_simulator.py                        # skenario normal
python telemetry_simulator.py --scenario degraded    # degradasi mesin bertahap pada DT-03
python telemetry_simulator.py --scenario breakdown   # kegagalan kritis pada DT-03
python telemetry_simulator.py --speed fast           # kompres durasi perjalanan ke ~90 detik
```

---

## Struktur Repositori

```
kideco-main/
├── frontend/     # Dasbor dispatcher Next.js
├── backend/      # FastAPI — rute, telemetri, penilaian kesehatan ML
├── simulator/    # Simulator telemetri kendaraan async
├── docs/         # Arsitektur, kontrak API, kontrak data
└── docker-compose.yml
```

---

## Dokumentasi

| Dokumen | Deskripsi |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | Arsitektur MVP dan keputusan teknis |
| [`docs/api-contract.md`](docs/api-contract.md) | Spesifikasi lengkap endpoint API |
| [`docs/data-contract.md`](docs/data-contract.md) | Model dan skema data |
| [`docs/route-optimization.md`](docs/route-optimization.md) | Algoritma optimasi rute |
| [`docs/ml-eta.md`](docs/ml-eta.md) | Eksperimen model prediksi ETA |
| [`docs/simulator.md`](docs/simulator.md) | Skenario simulator telemetri |

---

<div align="center">
  <br/>
  <img src="frontend/public/kidecologo.png" alt="Kideco Jaya Agung" width="80" />
  <br/><br/>
  <sub>Dibuat dengan ❤️ untuk <strong>KIC 2026 Hackathon</strong> · PT Kideco Jaya Agung</sub>
  <br/>
  <sub>
    <a href="https://github.com/kideco-juara-hackathon/kideco-natra">GitHub</a>
  </sub>
  <br/><br/>
</div>
