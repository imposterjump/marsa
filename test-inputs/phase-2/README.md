# Phase 2 — Test guide

**App:** http://localhost:3000 · **Format used:** PDF only

Phase 2 delivers the **Standards library** (create standards, add/edit/reorder rules, upload the standard's PDF) and completes **Settings** (AI model, report language, parallel steps, scoring weights with a live example).

> The three standards are fictional but written like real ones. They are **consistent with the Phase 1 RFP pack**: where they cover the same topic they say the same thing, and otherwise they add rules on topics the RFP doesn't regulate. They contain no hints for the AI.

## Files
| File | Pages | Rules |
|---|---|---|
| `standards/STD-1-CITS-2026-IT-Security-and-Data-Residency.pdf` | ~4 | 14 (CITS-2026) |
| `standards/STD-2-PESE-03-Equipment-Safety-and-Environment.pdf` | ~3 | 12 (PESE-03) |
| `standards/STD-3-PCT-07-Commercial-and-Contract-Terms.pdf` | ~3 | 12 (PCT-07) |

## A. Standards — copy-paste values

### ★ Standard 1: CITS-2026 (test this one first)
1. **Standards → New standard**, then copy-paste:

| Field | Value |
|---|---|
| Code | `CITS-2026` |
| Title | `Customs IT Security & Data Residency Standard` |
| Category | **IT & security** |
| Description | `Security and data-residency requirements for every system that processes customs data, including systems supplied and maintained by vendors. Issued by the General Customs Directorate, Information Security Office (v3.1, March 2026).` |
| Active | On |

2. Click **Create standard**. **Expected:** you land on its page; breadcrumb "Standards › CITS-2026"; toast "CITS-2026 created".
3. Click **Paste rules** and paste this whole block (14 rules):

```text
SEC-01 | All customs data (scan images, metadata, analyst annotations, logs and backups) shall be stored and processed only within the national territory. | mandatory
SEC-02 | Systems shall run on Directorate infrastructure; no component may depend on a public cloud service for operation, licensing, telemetry or updates. | mandatory
SEC-03 | Users shall authenticate through the Directorate's Active Directory over LDAPS, with role-based access control mapped to job functions. | mandatory
SEC-04 | Multi-factor authentication is required for all administrative accounts and for any remote access. | mandatory
SEC-05 | Local accounts shall enforce passwords of at least 12 characters and lock after 5 failed attempts; interactive sessions shall lock after 15 minutes of inactivity. | important
SEC-06 | Tamper-evident audit logs of all user and administrator actions shall be retained for 5 years and forwarded in real time to the Directorate's SIEM using syslog or CEF. | mandatory
SEC-07 | Data shall be encrypted at rest with AES-256 and in transit with TLS 1.2 or higher, using certificates issued by the Directorate's PKI. | mandatory
SEC-08 | In addition to routine patch releases, critical vulnerabilities shall be remediated within 14 days and high-severity vulnerabilities within 30 days of disclosure, throughout warranty and maintenance. | important
SEC-09 | An independent penetration test shall be performed before go-live; all critical and high findings shall be closed before acceptance. | mandatory
SEC-10 | Vendor remote access is allowed only through the Directorate's VPN, approved per session, with the full session recorded. | mandatory
SEC-11 | Backups shall be taken daily, encrypted, and stored on-premise at a second site, with a recovery point objective of 24 hours or better and a recovery time objective of 8 hours or better for image management platforms. | important
SEC-12 | Vendor staff with administrative access shall pass the Directorate's security vetting and sign a confidentiality undertaking before access is granted. | important
SEC-13 | A Software Bill of Materials (SBOM) shall be delivered for all supplied software and updated with every release. | important
SEC-14 | Architecture, data-flow and hardening documentation shall be delivered before the Site Acceptance Test. | desirable
```

   **Expected:** the preview shows 14 rules, 0 errors, then **Add 14 rules**. The header reads "14 rules · 8 mandatory · 5 important · 1 desirable".
4. In **Documents**, drop `standards/STD-1-CITS-2026-IT-Security-and-Data-Residency.pdf`. **Expected:** progress → toast "… uploaded · N pages"; the file appears with **AI-readable**; the ↗ icon opens the PDF in a new tab.


### Standard 2: PESE-03 (optional)
1. **Standards → New standard**, then copy-paste:

| Field | Value |
|---|---|
| Code | `PESE-03` |
| Title | `Port Equipment Safety & Environmental Standard` |
| Category | **Safety & environment** |
| Description | `Health, safety and environmental requirements for equipment installed and operated in the port, including radiation-emitting inspection systems. Issued by the NGPA Health, Safety & Environment Department (v2.0, January 2026).` |
| Active | On |

2. Click **Create standard**. **Expected:** you land on its page; breadcrumb "Standards › PESE-03"; toast "PESE-03 created".
3. Click **Paste rules** and paste this whole block (12 rules):

```text
SAF-01 | No radiation-emitting equipment may be operated before it is licensed by the national radiation regulator. | mandatory
SAF-02 | The annual dose at the boundary of any controlled area shall not exceed 1 mSv (public limit); occupational exposure shall be kept as low as reasonably achievable (ALARA). | mandatory
SAF-03 | Occupied vehicle cabs shall never be exposed to the primary high-energy beam; any cab scanning shall use a low-dose mode delivering 0.25 µSv or less per pass. | mandatory
SAF-04 | Controlled areas shall be marked with bilingual (Arabic and English) radiation warning signs, beam-on warning lights and audible alarms. | mandatory
SAF-05 | Emergency stop buttons, interlocked with the radiation source, shall be reachable within 10 metres from any point inside the controlled area. | mandatory
SAF-06 | The supplier shall provide personal dosimeters for operators during the first 12 months of operation and train all operators in radiation protection. | important
SAF-07 | Outdoor equipment shall be rated for continuous operation from 0 °C to +50 °C and up to 95% relative humidity in a saline atmosphere, with electronics enclosures of at least IP54. | mandatory
SAF-08 | Structural steel shall be protected for corrosivity category C5-M (ISO 12944) with a design durability of at least 15 years. | important
SAF-09 | Noise from equipment, including HVAC units and generators, shall not exceed 70 dB(A) at 1 metre from operator cabins. | important
SAF-10 | Hazardous waste (oils, batteries, lead shielding off-cuts and decommissioned sources) shall be removed by the supplier through licensed contractors, with disposal certificates. | important
SAF-11 | Before civil works start, method statements and risk assessments shall be approved by the HSE Department, and the supplier shall keep a full-time HSE officer on site. | important
SAF-12 | Operator cabins and electrical rooms shall have fire detection; server and electrical rooms shall have clean-agent fire suppression. | desirable
```

   **Expected:** the preview shows 12 rules, 0 errors, then **Add 12 rules**. The header reads "12 rules · 6 mandatory · 5 important · 1 desirable".
4. In **Documents**, drop `standards/STD-2-PESE-03-Equipment-Safety-and-Environment.pdf`. **Expected:** progress → toast "… uploaded · N pages"; the file appears with **AI-readable**; the ↗ icon opens the PDF in a new tab.


### Standard 3: PCT-07 (optional)
1. **Standards → New standard**, then copy-paste:

| Field | Value |
|---|---|
| Code | `PCT-07` |
| Title | `Procurement Commercial & Contract Terms Standard` |
| Category | **Commercial & legal** |
| Description | `Commercial, financial-security and contractual rules that apply to every NGPA procurement. Issued by the NGPA Procurement Directorate (v7.0, July 2025).` |
| Active | On |

2. Click **Create standard**. **Expected:** you land on its page; breadcrumb "Standards › PCT-07"; toast "PCT-07 created".
3. Click **Paste rules** and paste this whole block (12 rules):

```text
COM-01 | Bid securities, advance payment guarantees and performance securities shall be issued or confirmed by a bank licensed in the State. | mandatory
COM-02 | Prices shall be quoted in the currency stated in the tender documents; capital prices are firm unless the contract provides otherwise. | mandatory
COM-03 | Advance payments are made only against an advance payment guarantee of equal value. | mandatory
COM-04 | Apart from the advance payment, no milestone payment may exceed the value of the work delivered or accepted at that milestone. | important
COM-05 | A performance security of at least 10% of the contract price, valid until 28 days after final acceptance, is required. | mandatory
COM-06 | Bidders shall disclose every subcontractor performing more than 10% of the contract value and any conflict of interest. | important
COM-07 | The supplier's own general terms and conditions do not apply to Authority contracts. | mandatory
COM-08 | Bidders claiming local value added shall provide a breakdown certified by an independent auditor. | important
COM-09 | Maintenance, spare-part and support prices for the maintenance period shall be quoted per year; any annual escalation shall not exceed the cap stated in the tender documents. | important
COM-10 | Bidders shall sign the Authority's integrity pledge; any breach leads to disqualification and may lead to debarment. | mandatory
COM-11 | Invoices shall be in English, quote the tender reference, follow the line items of the price schedule and show the supplier's tax registration number. | desirable
COM-12 | Contracts are governed by the laws of the State, with arbitration seated in the capital. | important
```

   **Expected:** the preview shows 12 rules, 0 errors, then **Add 12 rules**. The header reads "12 rules · 6 mandatory · 5 important · 1 desirable".
4. In **Documents**, drop `standards/STD-3-PCT-07-Commercial-and-Contract-Terms.pdf`. **Expected:** progress → toast "… uploaded · N pages"; the file appears with **AI-readable**; the ↗ icon opens the PDF in a new tab.


## B. Standards — behaviours to check
| Try this | Expected |
|---|---|
| Create another standard with code `CITS-2026` | Inline error under Code: "CITS-2026 is already used by another standard." |
| Code `9ABC` or `AB CD` | "Use letters, digits, - . _ and start with a letter." |
| Add a rule with the bottom row, leaving Code empty | It gets the next code automatically (e.g. SEC-15) |
| Paste `SEC-01 | duplicate | M` into Paste rules | Line flagged: "Code SEC-01 already exists in this standard." Add is disabled |
| Paste `X-1 | text | urgent` | "Unknown priority "urgent" …" |
| Click a rule's text | Inline editor opens. Enter saves, Esc cancels, Shift+Enter adds a new line |
| Change a rule's priority pill | Saves instantly; header counts update |
| Drag a rule by its ⋮⋮ handle | Order changes and **stays after reload** |
| Keyboard: Tab to a rule, then Alt+↓ / Alt+↑ | Rule moves down/up |
| ⋯ → Delete on a rule | Toast "Rule … deleted" with **Undo**; Undo restores it in the same place |
| Toggle **Active** off (card or page) | Card dims, "Inactive" filter count +1, notice on the page |
| Search "safety" on the list | Only PESE-03 remains |
| Card ⋯ → Delete standard | Must type the code to enable the button; rules and files are removed |
| Upload `test-inputs/phase-1/edge-cases/oversized-55MB.pdf` as a document | Rejected by the browser (55 MB > 50 MB) |
| Upload `test-inputs/phase-1/rfp-pack/01-RFP-NGPA-T-2026-014.pdf` to any standard (then delete it) | Shows **13 pages** (page count read from the PDF) |

## C. Settings
**Settings → AI & runtime**
- Select **Claude Sonnet 5.5**, then **Opus 5.5**: the selected card gets a teal border, and "Saved ✓" appears. The sidebar's AI chip shows the model only in live mode; mock mode still shows "Demo AI".
- Report language **العربية**, then back to **English**. Parallel AI steps **3**.

**Settings → Scoring → Live example** (10 sample findings)

| Set this | Expected score |
|---|---|
| Defaults: Mandatory 3 · Important 2 · Desirable 1 · Partial 50% | **66.7%** (14 / 21), "1 mandatory failure: flagged at the gate" |
| Partial credit **0%** | **52.4%** (11 / 21) |
| Partial credit **100%** | **81.0%** (17 / 21) |
| Weights **10 · 1 · 0**, partial 50% | **64.0%** (27.5 / 43) |
| All weights **0** | 0% plus the warning "At least one weight must be above 0…" |
| **Reset to defaults** | Back to 66.7% |

Values save automatically ("Saving…" then "Saved ✓") and persist after reload.
