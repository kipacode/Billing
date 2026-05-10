# RT-NET Billing & Invoice Management System - PRD

## 1. Overview
Aplikasi ini bertujuan untuk membantu admin dalam mengelola pelanggan, tagihan dan pembayaran pelanggan internet.

Masalah utama yang ingin diselesaikan adalah kesulitan melacak jumlah invoice yang belum dibayar, jumlah invoice yang sudah dibayar serta jumlah tunggakan pada setiap pelanggan setiap bulannya. Selain itu admin juga kesulitan dalam mencatat pengeluaran operasional serta jumlah profit yang didapatkan dan mem-filter laporan berdasarkan bulan dan tahun.

Tujuan utama aplikasi ini adalah menyediakan platform bebasis web dan bisa digunakan di perangkat mobile yang sederhana bagi admin tunggal untuk mencatat tagihan dan operasional secara langsung (real-time).
---

## 2. Requirements
Berikut adalah persyaratan tingkat tinggi untuk pengembangan sistem:

- **Aksesibilitas:** Aplikasi harus dapat diakses melalui Web Browser dan perangkat mobile.

- **Mata Uang** Mata uang menggunakan IDR Rupiah(Rp).

- **Pengguna:** Sistem dirancang untuk satu pengguna (Admin Tunggal) dengan akses penuh.

- **Pencatatan Transaksi:** Pencatatan transaksi invoice dan pembayaran dilakukan secara manual.

- **Spesifisitas Invoice:** Invoice dibuat secara otomatis berdasarkan paket yang dipilih oleh pelanggan setiap bulannya.

- **Notifikasi:** Ringkasan Overdue (Invoice) ditampilkan secara real-time di halaman Dashboard.

## 3. Core Features
Fitur-fitur kunci yang harus ada dalam versi pertama (MVP):

1. **Dasbor** 
- Filter bulan dan tahun
- Panel Ringkasan (Active)Customer, (Total) Revenue, Pending (Invoice), Overdue (Invoice) berdasarkan filter bulan dan tahun.

2. **Pelanggan**
- **Profil**: Mangatur data pelanggan
- Fitur Tambah, Edit, Hapus
- Field wajib: Nama pelanggan, alamat instalasi, area(1-8), nomor whatsapp, Paket(Plan) yang dipilih, tanggal registrasi, **Diskon**: Admin bisa menetukan jumlah diskon untuk pelanggan dan **Status**: Mencatat status pelanggan (Active or Suspended).

3. **Paket**: Mengatur jenis paket/layanan
- Fitur Tambah, Edit, Hapus
- Paket yang ada sebagai default: Basic 5Mbps 120k/bulan, Standard 8Mbps 150k/bulan, Premium 10Mbps 200k/bulan .

4. **Invoice**: Mengatur invoice
- Filter bulan dan tahun
- Menampilkan Tabel invoice (Paid & Overdue) berdasarkan filter bulan dan tahun

5. **Operasional**: Mengatur biaya operasional
- Fitur Tambah, Edit, Hapus
- Field wajib: Nama operasional, harga operasional, tanggal operasional.

6. **Laporan**: Mengatur laporan
- Filter bulan dan tahun
- Menampilkan Tabel laporan (Paid & Overdue) berdasarkan filter bulan dan tahun
- menampilkan total revenue, total operasional, total profit berdasarkan filter bulan dan tahun.

7. **Pengingat**: Mengatur pengingat
- Filter bulan dan tahun
- Menampilkan List invoice yang overdue, admin bisa mengirimkan pengingat ke pelanggan melalui whatsapp secara manual.
- Berisi template text pengingat yang bisa diubah.
- Berisi template text laporan struk laporan untuk pelanggan ketika pelanggan membayar invoice.



### 4. User Flow
1. **Login**: Admin masuk menggunakan username dan password

2. **Monitoring**: Admin melihat Dashboard untuk mengecek apakah ada invoice yang perlu dikirim pengingat dan yang perlu dibayar.

3. **Menambahkan Pelanggan**: Admin bisa menambahkan pelanggan baru.

4. **Menambahkan Paket**: Admin bisa menambahkan paket baru.

5. **Mengatur Invoice**: Admin mengatur invoice manual.

5. **Menambahkan Operasional**: Admin mengatur biaya operasional.

6. **Menambahkan Laporan**: Admin melihat laporan dan bisa meng-export laporan.

7. **Menambahkan Pengingat**: Admin menandai dan mangirim pengingat ke pelanggan dengan invoice yang overdue.

---

## 5. Database Schema

### 5.1 Entity Relationship Diagram

```
  ┌──────────┐       ┌──────────┐
  │  admins   │       │  plans   │
  └──────────┘       └────┬─────┘
                          │ 1
                          │
                          ▼ N
  ┌───────────────────────────────────┐
  │           customers               │
  └──────────────┬────────────────────┘
                 │ 1
                 │
                 ▼ N
  ┌──────────────────────┐     ┌──────────────┐
  │      invoices         │────▶│   payments   │
  └──────────────────────┘ 1:1 └──────────────┘

  ┌──────────────┐    ┌─────────────────────┐
  │ operationals │    │ reminder_templates   │
  └──────────────┘    └─────────────────────┘
```

**Relasi:**
- `plans` 1 → N `customers` (satu paket bisa digunakan banyak pelanggan)
- `customers` 1 → N `invoices` (satu pelanggan bisa punya banyak invoice)
- `invoices` 1 → 1 `payments` (satu invoice satu pembayaran)

---

### 5.2 Detail Tabel

#### `admins` — Pengguna Sistem
| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT | ID unik admin |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | Username login |
| `password_hash` | VARCHAR(255) | NOT NULL | Password ter-hash |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Waktu pembuatan akun |

> Sistem dirancang untuk Admin Tunggal, namun tabel ini mendukung skalabilitas.

---

#### `plans` — Paket Layanan Internet
| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT | ID unik paket |
| `name` | VARCHAR(100) | NOT NULL | Nama paket |
| `speed_mbps` | INT | NOT NULL | Kecepatan (Mbps) |
| `price` | DECIMAL(12,2) | NOT NULL | Harga/bulan (IDR) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Waktu dibuat |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Waktu diedit |

**Data Default:** Basic 5Mbps Rp120.000, Standard 8Mbps Rp150.000, Premium 10Mbps Rp200.000

---

#### `customers` — Data Pelanggan
| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT | ID unik pelanggan |
| `name` | VARCHAR(150) | NOT NULL | Nama pelanggan |
| `address` | TEXT | NOT NULL | Alamat instalasi |
| `area` | TINYINT | NOT NULL, CHECK(1-8) | Area (1–8) |
| `whatsapp` | VARCHAR(20) | NOT NULL | Nomor WhatsApp |
| `plan_id` | INT | FK → plans.id, NOT NULL | Paket yang dipilih |
| `discount` | DECIMAL(12,2) | DEFAULT 0 | Jumlah diskon (IDR) |
| `status` | ENUM | 'active','suspended' | Status pelanggan |
| `registration_date` | DATE | NOT NULL | Tanggal registrasi |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Waktu dibuat |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Waktu diedit |

> `discount` disimpan sebagai nominal IDR (bukan persen).

---

#### `invoices` — Data Invoice/Tagihan
| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT | ID unik invoice |
| `customer_id` | INT | FK → customers.id | Pelanggan terkait |
| `invoice_number` | VARCHAR(50) | UNIQUE, NOT NULL | Nomor invoice (INV-2026-03-001) |
| `billing_month` | TINYINT | NOT NULL (1-12) | Bulan tagihan |
| `billing_year` | SMALLINT | NOT NULL | Tahun tagihan |
| `amount` | DECIMAL(12,2) | NOT NULL | Harga paket saat invoice dibuat |
| `discount` | DECIMAL(12,2) | DEFAULT 0 | Diskon snapshot dari pelanggan |
| `total` | DECIMAL(12,2) | NOT NULL | amount - discount |
| `status` | ENUM | 'paid','unpaid','overdue' | Status invoice |
| `due_date` | DATE | NOT NULL | Tanggal jatuh tempo (tgl 20) |
| `paid_date` | DATE | NULLABLE | Tanggal pembayaran |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Waktu dibuat |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Waktu diedit |

> `amount` dan `discount` di-snapshot pada saat invoice dibuat agar perubahan harga paket tidak mempengaruhi invoice lama.
> Index tambahan: `(billing_month, billing_year)` untuk filter laporan.

---

#### `payments` — Data Pembayaran
| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT | ID unik pembayaran |
| `invoice_id` | INT | FK → invoices.id, UNIQUE | Invoice terkait (1:1) |
| `amount` | DECIMAL(12,2) | NOT NULL | Jumlah yang dibayar |
| `method` | VARCHAR(50) | NULLABLE | Metode bayar (cash/transfer) |
| `notes` | TEXT | NULLABLE | Catatan pembayaran |
| `paid_at` | TIMESTAMP | NOT NULL | Waktu pembayaran |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Waktu record dibuat |

---

#### `operationals` — Biaya Operasional
| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT | ID unik |
| `name` | VARCHAR(200) | NOT NULL | Nama biaya operasional |
| `amount` | DECIMAL(12,2) | NOT NULL | Jumlah biaya (IDR) |
| `expense_date` | DATE | NOT NULL | Tanggal pengeluaran |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Waktu dibuat |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Waktu diedit |

---

#### `reminder_templates` — Template Pesan Pengingat
| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT | ID unik |
| `type` | VARCHAR(50) | UNIQUE, NOT NULL | Tipe: `reminder` / `receipt` |
| `template_content` | TEXT | NOT NULL | Isi template pesan |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Waktu dibuat |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Waktu diedit |

**Tipe Template:** `reminder` (pengingat tagihan overdue via WhatsApp), `receipt` (struk/bukti bayar pelanggan). Mendukung placeholder: `{{nama}}`, `{{total}}`, `{{bulan}}`.

---

### 5.3 Catatan Desain
1. **Snapshot harga di Invoice** — Harga & diskon di-copy ke tabel invoices agar data historis tetap akurat.
2. **Diskon sebagai nominal IDR** — Lebih sederhana untuk admin tunggal.
3. **Payment 1:1 dengan Invoice** — Setiap invoice maksimal satu record pembayaran.
4. **Area sebagai integer (1-8)** — Tanpa tabel terpisah, menggunakan CHECK constraint.
5. **Template fleksibel** — Mendukung placeholder variabel untuk pesan WhatsApp.

## 6. Design & Technical Constraints

1.  **High-Level Technology:**
    Sistem harus dibangun menggunakan teknologi modern yang mendukung pengembangan cepat (rapid development) dan kemudahan pemeliharaan (maintainability). Pengembang dibebaskan memilih tools yang tepat selama tidak terikat pada stack spesifik secara kaku, namun tetap memprioritaskan performa dan skalabilitas untuk penggunaan skala kecil hingga menengah.

2.  **Typography Rules:**
    Sistem antarmuka (UI) wajib menggunakan konfigurasi font variable sebagai berikut untuk menjaga konsistensi visual:
    -   **Sans:** `Geist Mono, ui-monospace, monospace`
    -   **Serif:** `serif`
    -   **Mono:** `JetBrains Mono, monospace`
