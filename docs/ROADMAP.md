# Brief Group product roadmap

This roadmap separates what is implemented from what is required for a dependable
multi-company product. A page or dashboard card is not considered complete until its
data, access policy, failure states, and operational ownership are implemented.

## MVP: controlled client pilot

### Implemented foundation

- Firebase email/password and Google authentication with protected dashboard routes.
- User-scoped energy/fault data, AI reports, and visual inspection flows.
- Gemini-backed chat, report generation, and image inspection APIs.
- Country/industry-aware company onboarding and persisted company profiles.
- Company owners, admins, managers, members, and viewers, with server-checked role
  management for workspace administration.
- Seven-day, single-use, email-matched invitations; owners can manage the company,
  admins cannot promote or alter other admins, and managers can invite members/viewers.
- Viewer write restrictions for energy/fault records, report creation, and inspection
  creation.
- Stripe, Paystack, and Flutterwave hosted checkout entry points with provider webhook
  handlers and environment-driven recurring plan configuration.

### Required before a paid pilot

1. Deploy Firebase rules and create staging accounts for every role. Test all allow and
   deny paths, including direct Firestore/Storage requests.
2. Move operational records from per-user ownership to company/site ownership. Add
   migration tooling and tenant-scoped queries before showing one teammate another
   teammate's equipment, inspections, energy readings, or reports.
3. Add per-module permissions and site assignments; a single `viewer` read-only role is
   not a substitute for access policies tailored to safety, billing, and operations.
4. Complete payment lifecycle coverage for subscription changes, cancellations, failed
   renewals, refunds, duplicate webhooks, and entitlement reconciliation for all three
   providers.
5. Test invitation email delivery and revocation in staging; add resend support and
   delivery-status visibility. If email is unavailable, admins must share the generated
   invite link themselves.
6. Add verified-email enforcement and account recovery policy; test on the production
   Firebase authorized-domain list.
7. Remove any remaining placeholder KPI or “live” wording that is not backed by actual
   measurements. Publish metric definitions and data freshness.
8. Review privacy, terms, retention, support, and data-processing agreements with legal
   counsel for each launch market.

## Production hardening

- Tenant/site data model, migration reports, audit events for role changes and billing,
  and export/delete workflows.
- Automated integration tests for company creation, invite lifecycle, authorization
  matrices, payment webhook idempotency, and tenant isolation.
- Observability: structured logs with correlation IDs, error tracking, provider health
  dashboards, alert routing, and an on-call/support owner.
- Scheduled backups and tested restore; data retention and deletion jobs.
- Rate/usage budgets per tenant, model cost dashboards, image limits, abuse review, and
  operational kill switches.
- Safety/compliance content with country and state/region versioning, authoritative
  sources, review dates, and qualified human review. Keep AI output advisory.
- Real company sites and map locations with geocoding consent, API-key restrictions,
  and location-privacy controls.
- Accessible onboarding, domain verification, invitation emails, and deployment parity
  across preview, staging, and production.

## Enterprise

- SSO (SAML/OIDC), MFA policy, SCIM provisioning, domain claims, and managed identity.
- Custom roles/permissions, site/region segmentation, approval workflows, and separation
  of duties for safety-critical operations.
- Organization-level APIs and signed event webhooks with versioning and idempotency.
- IoT ingestion pipeline, device registry, offline capture/sync, telemetry retention and
  tenant quotas.
- Multi-region/data-residency controls, documented disaster recovery targets, and
  customer-specific retention/export.
- Contracted SLA, support escalation, procurement/security questionnaires, and
  independently reviewed security and privacy controls.
- Multi-currency/tax/proration support, reconciliation, invoicing, and contract billing.

## Explicit current boundaries

- Company workspaces currently govern company metadata and team administration. Most
  operational records remain per-user; do not describe the platform as fully shared
  multi-tenant operations until the data migration is complete.
- The admin dashboard now reports actual company/team facts rather than fabricated
  equipment and compliance numbers.
- Payment checkout and webhook code still needs staged provider testing before any
  customer is promised automated recurring billing.
- A production deployment from this repository cannot replace the separate newer
  `briefgroup.net` experience unless that experience's source is brought into this repo
  or its Vercel project is intentionally remapped.
