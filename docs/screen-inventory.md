# Screen Inventory - Kideco Logistics Control Prototype

Status: Draft awal untuk mengarahkan implementasi prototype FE.

Dokumen ini menjadi pegangan awal untuk menentukan screen apa saja yang perlu dibuat di prototype. Fokusnya bukan sekadar memecah fitur, tetapi memvisualisasikan alur kerja dispatcher dari perencanaan operasi hauling sampai monitoring dan maintenance.

## 1. Prinsip Penyusunan Screen

Prototype harus menjawab pertanyaan utama:

> Bagaimana dispatcher mengambil keputusan operasional berdasarkan rekomendasi rute, ETA, fuel, kapasitas muatan, dan kondisi kendaraan?

Karena itu, screen disusun berdasarkan workflow:

```text
Overview operasi
-> pilih kendaraan / batch
-> rencanakan trip
-> lihat rekomendasi rute + muatan
-> bandingkan opsi
-> dispatch trip
-> monitoring trip berjalan
-> cek detail trip/unit
-> tindak lanjuti alert atau maintenance risk
```

## 2. Prioritas Implementasi

| Prioritas | Arti |
|---|---|
| P0 | Harus ada untuk menjelaskan core MVP. |
| P1 | Penting agar prototype terasa lengkap dan operasional. |
| P2 | Pendukung demo, boleh dibuat lebih sederhana. |
| P3 | Nice-to-have / future screen. |

## 3. Struktur Navigasi

Struktur sidebar yang disarankan:

```text
Overview

Hauling Darat
- Peta Operasional
- Dispatch Trip
- Rekomendasi Rute
- Monitoring Trip
- Loading Point
- Maintenance

Operasi Kapal
- Overview Kapal
- Rute Kapal
- Monitoring Kapal
- Maintenance Kapal

Analitik
- Fuel & ETA
- Perbandingan
- Alerts
```

Catatan:

- `Overview` tetap menjadi ringkasan global.
- `Hauling Darat` menjadi fokus utama prototype awal.
- `Operasi Kapal` tetap masuk scope, tetapi bisa dimulai lebih sederhana.
- `Analitik` berisi screen lintas fitur yang membantu demo dampak bisnis.

## 4. Core Flow Hauling Darat

### 4.1 Overview

Prioritas: P0

Tujuan:

- Memberikan ringkasan keadaan operasi saat ini.
- Menjadi entry point untuk dispatcher sebelum masuk ke planning atau monitoring.

Konten utama:

| Area | Isi |
|---|---|
| KPI cards | active trucks, trip berjalan, ETA risk, fuel estimate, maintenance risk |
| Operation status | jumlah kendaraan idle, empty travelling, loading, full travelling, dumping |
| Alert summary | delayed trip, high fuel, route deviation, high maintenance risk |
| Recommended action | 2-4 rekomendasi sistem yang bisa langsung ditindaklanjuti |
| Mini map / topology preview | ringkasan posisi kendaraan dan node penting |

Komponen:

- KPI card
- status badge
- alert list
- compact map
- recommendation panel

State yang perlu divisualkan:

- normal operation
- ada delay
- ada kendaraan high risk
- loading point padat

### 4.2 Peta Operasional

Prioritas: P0

Tujuan:

- Menampilkan struktur node dan edge hauling.
- Membuat pengguna paham lokasi dispatch point, checkpoint, pit/front, loading point, stockpile/dumping.

Konten utama:

| Area | Isi |
|---|---|
| Map utama | node operasional dan edge rute |
| Node detail panel | detail node yang dipilih |
| Edge detail | distance, avg speed, ETA empty/full, risk |
| Layer control | street/satellite, node type, active trip |
| Legend | dispatch, pit/front, loading, checkpoint, dumping |

Catatan data:

- Titik UI bisa berupa semantic layer.
- Waypoint dataset mentah tetap dipakai sebagai graph teknis/model.
- Jika memakai OSM, koordinat dapat berupa rebased coordinates untuk demo.

### 4.3 Dispatch Trip

Prioritas: P0

Tujuan:

- Screen awal untuk membuat rencana trip sebelum truk berjalan.
- Dispatcher memilih kendaraan, target muatan, dan tujuan dumping/stockpile.

Konten utama:

| Area | Isi |
|---|---|
| Vehicle selector | pilih kendaraan atau batch kendaraan |
| Vehicle capacity | kapasitas tonase, current status, health score |
| Origin | dispatch point / current location |
| Destination | dumping point / stockpile |
| Loading objective | target tonase dan preferensi loading |
| Constraints | max risk, max ETA, avoid node, priority loading point |

Komponen:

- form
- vehicle cards/table
- capacity input
- select / combobox
- constraint chips
- submit button `Generate Recommendation`

Output screen:

```text
Trip planning request dibuat
-> user diarahkan ke Rekomendasi Rute
```

### 4.4 Rekomendasi Rute

Prioritas: P0

Tujuan:

- Menampilkan hasil optimasi route + load.
- Sistem memberi opsi kombinasi loading point dan rute terbaik.

Definisi fitur:

> Optimasi rute adalah mencari rute dan kombinasi titik loading/pit yang membuat truk terisi optimal, dengan waktu tempuh dan cost serendah mungkin.

Konten utama:

| Area | Isi |
|---|---|
| Recommended option | opsi terbaik berdasarkan score |
| Alternative options | 2-3 opsi lain |
| Route map | preview rute terpilih |
| Loading plan | loading point yang dikunjungi dan tonase diambil |
| Score breakdown | ETA, fuel, distance, underload penalty, risk |
| Decision action | dispatch, compare, adjust constraint |

Contoh opsi:

```text
Option A
Dispatch -> CP-02 -> Loading Point C -> Stockpile
Load fulfillment: 60/60 ton
ETA: 38m
Fuel: 42 L
Risk: Medium
Score: 82
```

Komponen:

- recommendation card
- route stepper
- score breakdown bar
- comparison table
- map preview
- action footer

### 4.5 Perbandingan Opsi Rute

Prioritas: P1

Tujuan:

- Membantu dispatcher memahami kenapa sistem memilih opsi tertentu.
- Menjadi screen demo yang kuat untuk menjelaskan nilai bisnis.

Konten utama:

| Metrik | Opsi A | Opsi B | Opsi C |
|---|---:|---:|---:|
| Total ETA | 38m | 44m | 41m |
| Fuel estimate | 42 L | 39 L | 46 L |
| Distance | 5.8 km | 6.4 km | 5.1 km |
| Load fulfillment | 100% | 92% | 100% |
| Risk | Medium | Low | High |
| Stops | 1 | 2 | 1 |

Komponen:

- comparison table
- route mini map
- reason panel
- selected option badge

### 4.6 Monitoring Trip - Map View

Prioritas: P0

Tujuan:

- Memantau truk yang sudah berjalan.
- Menunjukkan data real-time/simulasi seperti posisi, speed, ETA, fuel, dan status.

Konten utama:

| Area | Isi |
|---|---|
| Live map | posisi kendaraan pada rute |
| Trip timeline | dispatch, loading, full travelling, dumping |
| Real-time telemetry | speed, load state, ETA, fuel rate |
| Route adherence | planned vs actual route |
| Alert panel | delay, overspeed, route deviation, high temp |

Status trip:

```text
idle
empty_travelling
loading
full_travelling
dumping
completed
delayed
exception
```

Komponen:

- map
- vehicle marker
- telemetry cards
- timeline
- alert drawer

### 4.7 Monitoring Trip - List View

Prioritas: P1

Tujuan:

- Menyediakan view tabular untuk banyak kendaraan.
- Cocok untuk dispatcher yang ingin scanning cepat.

Kolom utama:

| Kolom | Isi |
|---|---|
| Unit | ID kendaraan |
| Trip | ID trip |
| Status | current trip status |
| Current node | node saat ini |
| Next node | node berikutnya |
| ETA | estimasi sampai tujuan |
| Load | empty/full/tonase |
| Fuel | estimate/current |
| Health | health score |
| Alert | warning aktif |

Komponen:

- data table
- filter status
- search unit
- row action `View Detail`

### 4.8 Detail Trip

Prioritas: P1

Tujuan:

- Melihat detail satu trip dari planning sampai progress real-time.

Konten utama:

| Area | Isi |
|---|---|
| Trip summary | unit, driver/operator, route, target load |
| Route steps | node-by-node route |
| ETA breakdown | ETA per segment |
| Fuel breakdown | fuel per segment |
| Load plan | loading point dan tonase |
| Telemetry history | speed, temp, fuel rate, load state |
| Event log | dispatched, arrived loading, loaded, delayed |

Komponen:

- detail header
- route stepper
- line chart
- event timeline
- telemetry table

### 4.9 Loading Point Capacity

Prioritas: P1

Tujuan:

- Menampilkan stok/kapasitas loading point.
- Dipakai oleh route + load optimizer untuk menentukan titik loading terbaik.

Konten utama:

| Area | Isi |
|---|---|
| Loading point list | nama titik, pit/front, available coal |
| Queue status | jumlah truk antre |
| Productivity | loading rate ton/min |
| Risk | weather/road/operation risk |
| Recommendation | prioritas loading point |

Komponen:

- table
- capacity bar
- queue badge
- recommendation tag

## 5. Maintenance Hauling

### 5.1 Maintenance Fleet

Prioritas: P0

Tujuan:

- Menampilkan semua kendaraan hauling dan kondisi health-nya.
- Menjadi entry point sebelum membuka detail unit.

Kolom utama:

| Kolom | Isi |
|---|---|
| Unit | ID kendaraan |
| Type | dump truck / hauler |
| Status | available, active, maintenance, warning |
| Health score | 0-100 |
| Failure risk | low, medium, high |
| Main indicator | engine temp, oil pressure, vibration, brake temp |
| Last service | tanggal/jam service terakhir |
| Recommendation | monitor, inspect, stop operation |

Komponen:

- data table
- health score badge
- risk filter
- status filter
- detail action

### 5.2 Detail Maintenance Unit

Prioritas: P0

Tujuan:

- Menjelaskan kenapa satu kendaraan dianggap sehat/berisiko.
- Menampilkan faktor yang mempengaruhi health score.

Konten utama:

| Area | Isi |
|---|---|
| Unit summary | unit ID, status, health score |
| Sensor snapshot | engine temp, RPM, oil pressure, fuel pressure, coolant temp, vibration |
| Risk explanation | faktor penyebab risk naik |
| Trend chart | sensor trend beberapa jam/shift |
| Maintenance history | service, inspection, breakdown |
| Recommendation | tindakan berikutnya |

Komponen:

- health score gauge
- sensor cards
- trend chart
- explanation panel
- maintenance timeline

## 6. Operasi Kapal

Untuk prototype awal, screen kapal dibuat lebih sederhana agar scope tidak mengganggu flow hauling darat. Fokusnya menunjukkan bahwa sistem dapat diperluas ke operasi laut.

### 6.1 Overview Kapal

Prioritas: P2

Konten:

- active vessel
- vessel ETA
- fuel estimate
- loading readiness
- maintenance risk
- vessel status list

### 6.2 Rute Kapal

Prioritas: P2

Konten:

- peta rute jetty ke tujuan laut/sungai
- opsi rute
- ETA
- fuel estimate
- weather/current risk dummy

### 6.3 Monitoring Kapal

Prioritas: P2

Konten:

- posisi vessel
- status loading/departure/sailing/arrived
- ETA
- fuel consumption
- alert kondisi cuaca/rute

### 6.4 Maintenance Kapal

Prioritas: P2

Konten:

- daftar vessel
- health score
- engine temp
- RPM
- vibration
- fuel abnormal indicator
- recommendation

## 7. Analitik dan Decision Support

### 7.1 Fuel & ETA Analytics

Prioritas: P1

Tujuan:

- Menampilkan performa ETA dan fuel secara agregat.
- Menghubungkan route planning dengan dampak efisiensi.

Konten:

- baseline vs optimized ETA
- baseline vs optimized fuel
- fuel per route
- ETA prediction error
- delayed trip trend

### 7.2 Perbandingan Before-After

Prioritas: P2

Tujuan:

- Mendukung demo proposal dengan dampak bisnis yang jelas.

Konten:

| Metrik | Sebelum | Sesudah | Efisiensi |
|---|---:|---:|---:|
| Waktu tempuh | 55m | 43m | -21% |
| Fuel | 40 L | 33 L | -17% |
| Delay | 8 trip | 3 trip | -62% |
| Underload | 14% | 4% | -10 pp |

### 7.3 Alerts

Prioritas: P1

Tujuan:

- Menjadi pusat exception handling.

Kategori alert:

- ETA delay
- route deviation
- overspeed
- high fuel consumption
- high engine temperature
- high maintenance risk
- loading point congestion

Komponen:

- alert inbox
- severity filter
- status filter
- recommended action

## 8. Screen Status Tracker

| Screen | Prioritas | Status Prototype | Catatan |
|---|---|---|---|
| Overview | P0 | Planned | Ringkasan global operasi. |
| Peta Operasional | P0 | In progress | Sudah ada eksperimen topology/map. Perlu dirapikan sesuai flow. |
| Dispatch Trip | P0 | Planned | Screen penting untuk planning. |
| Rekomendasi Rute | P0 | Planned | Core decision screen. |
| Perbandingan Opsi Rute | P1 | Planned | Membantu menjelaskan keputusan sistem. |
| Monitoring Trip - Map View | P0 | Planned | Screen utama untuk real-time simulation. |
| Monitoring Trip - List View | P1 | Planned | Untuk scanning banyak kendaraan. |
| Detail Trip | P1 | Planned | Detail satu trip. |
| Loading Point Capacity | P1 | Planned | Penting untuk load optimization. |
| Maintenance Fleet | P0 | In progress | Sudah dibahas sebagai tabel awal kendaraan. |
| Detail Maintenance Unit | P0 | Planned | Detail health score dan sensor. |
| Overview Kapal | P2 | Planned | Scope kapal dibuat ringkas dulu. |
| Rute Kapal | P2 | Planned | Mirip rute hauling, tapi lebih sederhana. |
| Monitoring Kapal | P2 | Planned | Monitoring vessel. |
| Maintenance Kapal | P2 | Planned | Health score kapal. |
| Fuel & ETA Analytics | P1 | Planned | Agregasi performa. |
| Before-After Comparison | P2 | Planned | Dampak bisnis. |
| Alerts | P1 | Planned | Exception handling. |

## 9. Urutan Implementasi Prototype

Urutan yang disarankan:

```text
1. Peta Operasional
2. Dispatch Trip
3. Rekomendasi Rute
4. Monitoring Trip - Map View
5. Monitoring Trip - List View
6. Maintenance Fleet
7. Detail Maintenance Unit
8. Loading Point Capacity
9. Fuel & ETA Analytics
10. Alerts
11. Overview global
12. Screen kapal ringkas
```

Alasan:

- Prototype perlu segera menunjukkan core flow planning -> recommendation -> monitoring.
- Maintenance perlu tetap ada karena masuk scope utama.
- Overview global lebih efektif dibuat setelah screen operasional lain punya data dummy yang jelas.
- Screen kapal bisa memakai pola hauling yang sudah matang.

## 10. Data Dummy yang Dibutuhkan

Data dummy minimum:

| Data | Contoh field |
|---|---|
| Vehicles | unit_id, capacity_ton, status, health_score, current_trip_id |
| Nodes | node_id, display_name, semantic_type, lat, lng, stock_ton |
| Edges | from, to, distance_m, avg_speed_kmh, eta_empty, eta_full, risk |
| Trips | trip_id, vehicle_id, status, route_id, target_load_ton, current_node |
| Route options | option_id, steps, eta, fuel, distance, load_fulfillment, risk, score |
| Telemetry | timestamp, vehicle_id, speed, rpm, engine_temp, fuel_rate, load_state |
| Maintenance | vehicle_id, sensor snapshot, risk factors, recommendation |
| Alerts | alert_id, severity, type, related_unit, message, recommended_action |

## 11. Catatan Terminologi

Istilah yang perlu konsisten:

| Istilah UI | Makna |
|---|---|
| Dispatch Trip | proses membuat dan menjalankan rencana trip |
| Loading Point | titik pengambilan batubara |
| Dumping/Stockpile | titik bongkar/penyimpanan |
| Route Recommendation | rekomendasi rute dan titik loading |
| Load Fulfillment | persentase kapasitas truk yang terpenuhi |
| Health Score | skor kesehatan unit 0-100 |
| Failure Risk | risiko kerusakan low/medium/high |
| Active Trip | trip yang sedang berjalan |

