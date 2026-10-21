# POC set 1 (rehearsal): Smart Gate Automation, Container Terminal 2

**Format used:** PDF only · **App:** live AI at http://localhost:3001 (or free demo AI at http://localhost:3000).

## Files (all in this folder)
| File | What it is |
|---|---|
| `Standard-POTS-2026-rules.txt` | The 12 rules to paste (the same block is below) |
| `RFP-NGPA-T-2026-031.pdf` | The RFP, 5 pages, 31 numbered clauses + compliance matrix |
| `Vendor-1-Sahel-Gate-Technologies-Technical.pdf` / `-Commercial.pdf` | Vendor 1: technical (4 p.) and commercial (2 p.) |
| `Vendor-2-Vector-OCR-Systems-Technical.pdf` / `-Commercial.pdf` | Vendor 2: technical (4 p.) and commercial (2 p.) |

## 1. Create the standard
1. **Standards → New standard**, then fill in:

| Field | Value |
|---|---|
| Code | `POTS-2026` |
| Title | `Port Operational Technology Standard` |
| Category | **IT & security** (already selected) |
| Description | `Requirements for operational technology (OT) systems installed at the Authority's terminals, such as gate automation, CCTV, access control and crane automation. Issued by the NGPA Technology Directorate (v1.2, May 2026).` |
| Active | On |

2. Click **Create standard**.
3. Click **Paste rules**, paste this whole block and click **Add 12 rules**:

```text
OT-01 | All data captured by OT systems (images, video, plate and container numbers, logs) shall be stored and processed only in the Authority's own server rooms and data centres; no public cloud service may be used. | mandatory
OT-02 | OT systems shall run on a network segment separated from the corporate network by the Authority's firewalls, with no direct connection to the internet. | mandatory
OT-03 | User accounts shall be managed through the Authority's Active Directory; administrative accounts shall use multi-factor authentication. | mandatory
OT-04 | Audit logs of user and system events shall be kept for at least 3 years and forwarded in real time to the Authority's SIEM. | important
OT-05 | Field equipment installed outdoors shall be rated IP66 or better and for continuous operation from 0 °C to +55 °C. | mandatory
OT-06 | Critical OT systems shall reach at least 99.5 % availability per calendar month, with no single point of failure in servers, network or power, and UPS autonomy of at least 30 minutes. | important
OT-07 | The supplier shall keep a spare-parts stock in the State and respond on site within 4 hours, 24/7, to faults that stop operations. | important
OT-08 | A warranty of at least 24 months from acceptance shall cover all equipment and software, including parts and labour. | mandatory
OT-09 | Interfaces shall use open, documented protocols (REST/JSON, UN/EDIFACT or OPC UA); the documentation shall be delivered to the Authority. | important
OT-10 | Operator and maintenance training, and the user and maintenance manuals, shall be provided in Arabic and English. | desirable
OT-11 | Payments for equipment shall follow delivery and acceptance milestones; any advance payment shall not exceed 20 % and requires an advance-payment guarantee. | important
OT-12 | Maintenance after the warranty shall be priced per year, and these prices shall be fixed for at least 3 years. | important
```

   **Expected:** the header reads **12 rules · 5 mandatory · 6 important · 1 desirable**.

## 2. Create and publish the project
1. **Projects → New project**. **Step 1 · Details:**

| Field | Value |
|---|---|
| Project name | `Smart Gate Automation — Container Terminal 2` |
| Description | `Supply, installation and maintenance of OCR portals, RFID readers, self-service kiosks and a Gate Operating System for the 6 truck lanes of Container Terminal 2. Tender NGPA/T/2026/031.` |
| Category | **IT & security** |
| Submission deadline | **30 November 2026** (type `30/11/2026` or `11/30/2026`, in the order your date field shows) |
| Key requirements / notes | *leave empty* |

   Click **Continue**.
2. **Step 2 · RFP documents:** drop `RFP-NGPA-T-2026-031.pdf`. **Expected:** "5 pages · AI-readable". Click **Continue**.
3. **Step 3 · Standards:** click **None**, then tick only **POTS-2026**. **Expected:** "1 of N selected". Click **Continue**.
4. **Step 4 · Review & publish:** click **Publish to vendors**.

## 3. Submit the two vendors
**Proposals** tab → **Simulate a vendor submission**. Fill in the form, then click **Submit proposal**. Do it once per vendor.

| Field | Vendor 1 | Vendor 2 |
|---|---|---|
| Vendor | **New vendor** | **New vendor** |
| Company name | `Sahel Gate Technologies` | `Vector OCR Systems` |
| Country | `Northern Gulf State` | `Netherlands` |
| Contact name | `Faisal Al-Hinai` | `Joost van Dijk` |
| Contact email | `tenders@sahelgate.example` | `bids@vectorocr.example` |
| Commercial proposal | `Vendor-1-Sahel-Gate-Technologies-Commercial.pdf` | `Vendor-2-Vector-OCR-Systems-Commercial.pdf` |
| Technical proposal | `Vendor-1-Sahel-Gate-Technologies-Technical.pdf` | `Vendor-2-Vector-OCR-Systems-Technical.pdf` |

## 4. Analyse & process
1. Back on **Proposals**, the **Analyse & process** panel shows **2 proposals · POTS-2026 · Steps 8 (3 × 2 + 2)**, plus the time and cost. Live mode estimates ≈ $0.04 on Haiku and ≈ $0.81 on Sonnet.
2. Click **Analyse & process**, then **Start analysis** in the confirmation. Mission control shows the 8 steps live. About 2.5 minutes on Haiku, 3.5 on Sonnet.

## 5. What a good result looks like
Use this to judge the live run. Nothing here is uploaded.
- **Ranking:** Sahel Gate Technologies first and recommended.
  - Sahel is dearer: USD 3,392,089 against USD 2,404,800 for Vector. Vector's figure leaves out a cloud subscription of USD 46,000 a year and options.
- **Sahel: small gaps.**
  - Damage images are kept online 60 days instead of 90 (RFP 3.2).
  - Maintenance prices escalate 3 % a year instead of being fixed (RFP 6.1, POTS-2026 OT-12).
  - The maintenance manuals are in English only (OT-10).
- **Vector: several mandatory breaks.**
  - **Cloud:** licence-plate OCR runs in VectorVision Cloud in Frankfurt, through an internet connection (RFP 3.8, OT-01, OT-02).
  - **OCR:** Arabic plates 94 % instead of 97 %, and valid only up to 10 km/h (3.1).
  - **Gate time:** 70 s per transaction instead of 60 s (3.4).
  - **Kiosks:** IP65 and 0–50 °C (3.10, OT-05).
  - **Customs release:** offered only as a change request (3.7).
  - **Delivery:** all lanes at month 9–10 instead of 8 (4.1).
  - **Warranty:** 12 months instead of 24 (5.1, OT-08).
  - **Bid:** valid 90 days instead of 120, with a bid security from a Rotterdam bank (6.4).
  - **Smaller items:**
    - support next business day (5.3, OT-07);
    - a 30 % advance (6.2, OT-11);
    - UPS for 15 minutes (OT-06);
    - SIEM log forwarding not mentioned (OT-04);
    - no roof camera (3.2).
- **Evidence:** on any finding, click **Page N**: the vendor's sentence opens highlighted. Click an **RFP §…** or **POTS-2026 OT-…** chip under **Breaks**: it opens that clause or rule.
- **Risk:** Vector's register should include data leaving the country, warranty exposure and a delivery delay.
