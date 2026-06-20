<div align="center">
  <img src="frontend/public/natralogowithbackground.png" alt="NATRA" width="460" />
</div>

<p align="center">
  <strong>NATRA</strong><br/>
  <em>Navigation, Asset, Transport, Routing &amp; Analytics</em><br/>
  Sistem Pendukung Keputusan Logistik Pertambangan Berbasis AI-IoT<br/>
  <sub>Optimasi Rute &nbsp;·&nbsp; Prediksi ETA &nbsp;·&nbsp; Prediksi BBM &nbsp;·&nbsp; Predictive Maintenance</sub>
</p>

<div align="center">

[![KIC 2026](https://img.shields.io/badge/KIC_2026-Hackathon-DC2626?style=flat-square)](https://github.com/kideco-juara-hackathon/kideco-natra)
[![Team](https://img.shields.io/badge/Tim-Ex_Machina-1D4ED8?style=flat-square)](#tim-ex-machina)
[![Status](https://img.shields.io/badge/Status-MVP_Proof_of_Concept-22C55E?style=flat-square)](#status-prototipe)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

<p align="center">
  <a href="https://www.youtube.com/watch?v=M1GgSwF6Syk"><strong>▶&nbsp; Lihat Video Demo</strong></a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="docs/architecture.md">Arsitektur</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="docs/api-contract.md">API Contract</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="docs/data-contract.md">Data Contract</a>
</p>

---

## Apa itu NATRA?

NATRA adalah sistem pendukung keputusan logistik hauling tambang berbasis AI-IoT yang dirancang untuk membantu dispatcher dalam menentukan rute, memantau unit, memperkirakan ETA, memprediksi konsumsi BBM, dan mengevaluasi kesehatan kendaraan sebelum maupun selama proses dispatch.

Masalah utama yang diselesaikan: pemilihan rute statis berbasis jarak saja, konsumsi BBM tidak termonitor per perjalanan, pemeliharaan armada bersifat reaktif, dan keputusan dispatch yang tidak menggabungkan data rute, kondisi unit, ETA, serta risiko maintenance secara terpadu.

Pada tahap MVP, NATRA diwujudkan sebagai proof-of-concept hauling darat melalui dashboard Command Center, Route Intelligence, Route Monitor, simulasi telemetri, API backend, dan rekomendasi rute berbasis data operasional. Dalam rancangan penuh, NATRA dikembangkan sebagai platform AI-IoT end-to-end dengan A* Search, Random Forest (ETA), XGBoost (BBM), Isolation Forest (predictive maintenance), serta pipeline telemetri MQTT/AMQP.

---

## Video Demo

<div align="center">

[![YouTube](https://img.shields.io/badge/Tonton_Demo_NATRA-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/watch?v=M1GgSwF6Syk)

<sub>Demo NATRA untuk KIC 2026 &mdash; Command Center, Route Intelligence, Route Monitor, dan Maintenance Intelligence.</sub>

</div>

---

## Tim Ex Machina

> **Kideco Innovation Challenge 2026** &nbsp;·&nbsp; Institut Teknologi Kalimantan &nbsp;·&nbsp; *AI-Driven Operational Excellence*

| No. | Nama | NIM | Program Studi | Peran |
|:---:|---|:---:|---|---|
| 1 — Ketua | Mahardika Arka | 11231037 | Informatika, ITK | Ketua Tim · PM/Frontend · product flow · proposal · demo |
| 2 | Dicha Wijaya Kusuma | 11231020 | Informatika, ITK | Backend · API contract · database · deployment/CI-CD |
| 3 | Raditya Yusma Nata | 11231080 | Informatika, ITK | Machine Learning · ETA/fuel modeling · model integration |
| 4 | Marsa Naufal | 04231047 | Teknik Elektro, ITK | IoT · telemetry simulation · sensor & maintenance data |

---

## Fitur Utama

<div align="center">
  <img src="docs/photosreadme/screenshot.png" alt="Dashboard NATRA" width="880" />
  <br/>
  <sub>Dashboard NATRA: Command Center, Route Intelligence, Route Monitor, dan Maintenance Intelligence dalam satu workflow dispatcher.</sub>
</div>

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>Route Planning</h3>
      <p>Rekomendasi rute optimal berbasis algoritma <strong>A* Search</strong> pada graf operasional tambang, mempertimbangkan ETA, konsumsi BBM, payload, antrean loading point, risiko jalur, dan kondisi unit secara bersamaan.</p>
    </td>
    <td width="50%" valign="top">
      <h3>Predictive Maintenance</h3>
      <p>Deteksi anomali mesin berbasis <strong>Isolation Forest</strong> (unsupervised) menghasilkan Health Score 0–100% dan early warning sebelum kegagalan terjadi — tanpa memerlukan label data kerusakan historis.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>Fuel Consumption Prediction</h3>
      <p>Prediksi konsumsi BBM per perjalanan menggunakan <strong>XGBoost Regressor</strong> berdasarkan RPM, kecepatan, jarak, dan beban muatan. Didukung SHAP values untuk Explainable AI — dispatcher dapat memahami penyebab pembengkakan BBM.</p>
    </td>
    <td width="50%" valign="top">
      <h3>ETA Prediction</h3>
      <p>Estimasi waktu kedatangan menggunakan <strong>Random Forest Regression</strong> yang robust terhadap outlier operasional (cuaca buruk, insiden jalan, hambatan loading) untuk prediksi ETA yang stabil dan andal.</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>Command Center Dispatcher</h3>
      <p>Pusat kendali shift: pilih unit siap dispatch, mulai operasi, pantau status fleet, terima notifikasi, dan lakukan dispatch dari satu layar terpadu.</p>
    </td>
    <td width="50%" valign="top">
      <h3>Route Monitor</h3>
      <p>Monitoring trip aktif dalam lensa overview, ETA, dan konsumsi BBM — lengkap dengan progres per unit, status keterlambatan, dan data telemetri secara real-time.</p>
    </td>
  </tr>
</table>

---

## Status Prototipe

| Area | Status MVP | Arah Rancangan Penuh |
|---|---|---|
| Hauling darat | Dashboard dispatcher berjalan: Command Center, route recommendation, route monitor, dan maintenance view. | Integrasi scoring rute lebih kaya dengan data real-time, model ETA/fuel, dan telemetry production. |
| Route intelligence | Backend membaca seed graph dan data operasional untuk membandingkan alternatif rute berdasarkan beberapa metrik. | A* Search berbasis graf operasional dengan heuristic koordinat, risiko jalur, cuaca, antrean, dan kesiapan unit. |
| AI/ML | Model loader dan endpoint prediksi tersedia dengan fallback agar demo tetap stabil. | Random Forest untuk ETA, XGBoost untuk fuel, Isolation Forest untuk anomaly detection dan health score. |
| IoT/Telemetry | Simulator telemetri HTTP untuk demo. | MQTT untuk edge telemetry ingestion dan AMQP/RabbitMQ untuk event pipeline dispatch, alert, dan recommendation. |

---


## Alur Kerja Dispatcher

```text
Dispatcher memulai shift
        │
        ▼
Pilih unit yang siap dispatch
        │
        ▼
Backend memuat jaringan operasional dan data rute (node & edge)
        │
        ▼
Mesin rute A* merekomendasikan jalur optimal
        │
        ▼
Model ML menghitung ETA, konsumsi BBM, dan health score unit
        │
        ▼
Dispatcher meninjau rekomendasi dan memberangkatkan unit
        │
        ▼
Command Center memantau progress, ETA, fuel, dan health score
        │
        ▼
Route Monitor dan Maintenance Intelligence memberi evaluasi lanjutan
```

---

## Arsitektur Ringkas

```text
Frontend Dashboard (Next.js)
        │
        ▼
FastAPI Backend
        │
        ├── Route Recommendation Engine (A* Search)
        ├── ML Prediction Services
        │       ├── Random Forest  — ETA
        │       ├── XGBoost        — Fuel Consumption
        │       └── Isolation Forest — Anomaly Detection & Health Score
        ├── Telemetry Ingestion
        └── Operational State
        │
        ▼
PostgreSQL + Seed Operational Data

Telemetry Simulator
        │
        ▼
HTTP API  →  future MQTT  →  AMQP/RabbitMQ pipeline
```

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| UI | Shadcn/ui, Base UI, Lucide React |
| Visualisasi | Recharts, Leaflet / react-leaflet |
| Backend | FastAPI 0.115, Python 3.12, Uvicorn |
| Database | PostgreSQL 16, SQLAlchemy 2.0, Alembic |
| AI/ML | XGBoost, scikit-learn (Random Forest · Isolation Forest), SHAP, joblib, pandas |
| Message Broker | RabbitMQ 4, Eclipse Mosquitto (MQTT/AMQP) |
| Telemetry | Python async simulator, HTTP ingestion |
| Infrastructure | Docker Compose |

---

## Mulai Cepat

### Prasyarat

- Node.js 20+
- Python 3.12+
- Docker dan Docker Compose

### Menjalankan dengan Docker (Direkomendasikan)

```bash
docker compose up --build
```

Endpoint:

```text
Dashboard : http://localhost:3000
API       : http://localhost:8000
API Docs  : http://localhost:8000/docs
```

### Menjalankan Frontend

```bash
cd frontend
npm install
npm run dev
```

### Menjalankan Backend Lokal

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

python telemetry_simulator.py
python telemetry_simulator.py --scenario degraded
python telemetry_simulator.py --scenario breakdown
python telemetry_simulator.py --speed fast
```

---

## Struktur Repositori

```text
kideco-main/
├── frontend/         Dashboard dispatcher berbasis Next.js
├── backend/          FastAPI, route recommendation, telemetry, prediction services
├── simulator/        Simulator telemetri kendaraan untuk demo
├── data/seeds/       Seed graph, trucks, nodes, edges, route scenarios
├── docs/             Arsitektur, API contract, data contract, route optimization
├── scripts/          Utility untuk membangun seed data
└── docker-compose.yml
```

---

## Dokumentasi

| Dokumen | Deskripsi |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Arsitektur MVP dan keputusan teknis |
| [docs/api-contract.md](docs/api-contract.md) | Spesifikasi endpoint API |
| [docs/data-contract.md](docs/data-contract.md) | Model dan skema data |
| [docs/route-optimization.md](docs/route-optimization.md) | Catatan optimasi rute dan seed graph |
| [docs/ml-eta.md](docs/ml-eta.md) | Catatan eksperimen model ETA |
| [docs/simulator.md](docs/simulator.md) | Skenario simulator telemetri |

---

<div align="center">
  <img src="frontend/public/kidecologo.png" alt="Kideco Jaya Agung" width="88" />
  <br/><br/>
  <strong>NATRA &mdash; Tim Ex Machina</strong><br/>
  <sub>Institut Teknologi Kalimantan &nbsp;·&nbsp; KIC 2026 Hackathon &nbsp;·&nbsp; PT Kideco Jaya Agung</sub>
  <br/><br/>
  <a href="https://github.com/kideco-juara-hackathon/kideco-natra">GitHub Repository</a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="https://www.youtube.com/watch?v=M1GgSwF6Syk">Video Demo</a>
</div>
