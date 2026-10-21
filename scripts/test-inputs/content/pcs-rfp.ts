/**
 * Second sample tender (seed Project B): Port Community System. Short, but written like a real
 * RFP and consistent with the Phase 2 standards (CITS-2026 data residency, PCT-07 terms).
 */
import { clause as c, doc, tag as t } from "../lib/pdf";

export const PCS = {
  ref: "NGPA/T/2026/021",
  title: "Port Community System: Web Platform, Messaging Hub and Integration Services",
  issued: "2 November 2026",
  closing: "15 January 2027, 12:00 local time",
};

export function pcsRfpHtml(): string {
  const body = `
<section class="cover">
  <div>
    <div class="small" style="letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8pt">Northern Gulf Ports Authority · Digital Port Programme</div>
    <div class="band">
      <div style="font-size:10pt;opacity:.85;margin-bottom:6pt">REQUEST FOR PROPOSAL · ${PCS.ref}</div>
      <h1>${PCS.title}</h1>
      <div style="font-size:11pt;opacity:.9">Port of Al-Noor and its inland container depot</div>
    </div>
  </div>
  <table class="kv">
    <tr><td>Tender reference</td><td><b>${PCS.ref}</b></td></tr>
    <tr><td>Procedure</td><td>Open tender · two-envelope (technical / financial)</td></tr>
    <tr><td>Date of issue</td><td>${PCS.issued}</td></tr>
    <tr><td>Bid closing date</td><td>${PCS.closing}</td></tr>
    <tr><td>Contact</td><td>Tender Committee Secretariat · tenders@ngpa.example</td></tr>
  </table>
  <div class="warn"><b>SAMPLE DOCUMENT.</b> This tender, the authority and the port are fictional. The document was created to test procurement-evaluation software.</div>
</section>

<section class="pb">
  <h2>1. Background</h2>
  ${c("1.1", "The Port of Al-Noor exchanges most trade documents with shipping agents, freight forwarders, hauliers and the General Customs Directorate by e-mail, fax and paper. Container release requires on average 7 separate submissions and 2.3 days.")}
  ${c("1.2", "The Northern Gulf Ports Authority (NGPA) seeks a <b>Port Community System (PCS)</b>: a single web platform and messaging hub through which the port community submits, tracks and exchanges cargo, vessel and release information.")}
  <h2>2. Scope</h2>
  ${c("2.1", "Web portal for port community users (shipping agents, forwarders, hauliers, customs brokers), with company onboarding, user management and role-based access.")}
  ${c("2.2", "Messaging hub converting between UN/EDIFACT (BAPLIE, COPARN, CODECO, CUSCAR, CUSRES), XML and JSON/REST, with guaranteed delivery and message tracking.")}
  ${c("2.3", "Integration with the Terminal Operating Systems of T1 and T2, the Customs Risk Management System, the Maritime Single Window and the Authority's ERP for port dues invoicing.")}
  ${c("2.4", "Vehicle booking system for truck appointments at the terminal gates, with SMS and app notifications in Arabic and English.")}
  ${c("2.5", "Implementation, data migration of 3 years of vessel-call history, training, and 3 years of support and maintenance after go-live.")}
  <h2>3. Requirements</h2>
  ${c("3.1", `The PCS, including all databases, integration components, monitoring and backups, shall be hosted in the Authority's data centres in the State. No component may depend on a public cloud service. ${t("M")}`)}
  ${c("3.2", `Availability of 99.8 % per calendar month for the portal and the messaging hub, measured at the Authority's monitoring system. ${t("M")}`)}
  ${c("3.3", `Capacity for 4,500 registered users, 600 concurrent users and 250,000 messages per day with a 95th-percentile processing time below 5 seconds. ${t("M")}`)}
  ${c("3.4", `User authentication with multi-factor authentication for all external users; integration with the Authority's Active Directory for internal users. ${t("M")}`)}
  ${c("3.5", `Full user interface in Arabic and English, including right-to-left layout. ${t("M")}`)}
  ${c("3.6", `Open REST APIs documented in OpenAPI 3 for community systems, with a sandbox environment. ${t("I")}`)}
  ${c("3.7", `Dashboards of container dwell time, gate waiting times and release lead times. ${t("I")}`)}
  ${c("3.8", `Mobile application for hauliers (Android and iOS) for truck appointments. ${t("D")}`)}
  ${c("3.9", `Compliance with the Authority's IT Security &amp; Data Residency Standard (CITS-2026). ${t("M")}`)}
  <h2>4. Implementation and support</h2>
  ${c("4.1", `Go-live of the portal, messaging hub and customs/TOS integrations within <b>10 months</b> of contract signature; the vehicle booking system within 12 months. ${t("M")}`)}
  ${c("4.2", "Training of 30 Authority staff (administrators and helpdesk) and community onboarding sessions for at least 150 companies.")}
  ${c("4.3", `Support 24/7 for severity-1 incidents with a 1-hour response and 4-hour restoration; 3 years of support and maintenance priced per year. ${t("M")}`)}
  <h2>5. Evaluation</h2>
  ${c("5.1", "Technical evaluation (70 %): functional coverage 30, architecture and security 25, integration experience 20, implementation plan 15, support 10. Minimum technical score 70.")}
  ${c("5.2", "Financial evaluation (30 %): evaluated price = implementation + 3 years of support and maintenance.")}
  ${c("5.3", "Bid validity 120 days; bid security USD 50,000 issued or confirmed by a bank licensed in the State.")}
  <div class="sig"><div>Chair, Tender Committee<br>Northern Gulf Ports Authority</div><div>Issued: ${PCS.issued}<br>Reference: ${PCS.ref}</div></div>
</section>`;
  return doc(body, `${PCS.ref} RFP`);
}
