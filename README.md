# Mizan (codename Marsa)

A procurement-evaluation prototype for a ports and customs authority. Customers publish RFPs, vendors submit technical and commercial proposals, and Claude checks every proposal against the RFP and the applied standards, builds risk registers, and writes a consultant report per vendor. Mizan computes the scores and the recommendation.

**New here? Read [docs/FRESHLY-CLONED.md](docs/FRESHLY-CLONED.md)**: setup, the free demo AI vs live AI, sample data, the test tenders in `test-inputs/`, and where the rest of the documentation lives.

```bash
npm install
npx playwright install chromium
npm run dev   # http://localhost:3000
```
