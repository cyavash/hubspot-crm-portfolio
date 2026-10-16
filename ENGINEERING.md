# Engineering and validation

The studio runs as static HTML, CSS and native JavaScript. No client framework or runtime package dependency is required. Serve this directory over HTTP or use GitHub Pages from main/root.

## Validation

Ten case previews were rendered at 1560px desktop and 390px mobile widths. The captured pages had no document overflow, JavaScript exceptions or axe WCAG A/AA violations in the configured checks. Interactive checks cover qualification steps, inbox filtering and language context, intake search and CRM record selection. Automated checks do not establish full WCAG conformance.

The native UI reference includes 10 DOM behavior tests for scoped disclosures, keyboard tabs, literal search, filters, dialogs and navigation. The studio is frontend-only and does not submit forms to client systems.

## Deployment boundaries

HubSpot templates still need compilation and end-to-end testing in a sandbox portal with the intended modules, content and subscription features. WordPress PHP needs runtime checks in WordPress; PHP execution was unavailable in this environment. The email reference requires HubSpot compilation and real email-client checks before campaign use. No production CRM, mail or payment actions are performed by the studio.

The standalone quote is a customer-experience and pricing reference, not a deployed HubSpot CPQ template. Private client data and routing logic are excluded. Public source names are retained where HubSpot module and asset references depend on them.

Full client theme modernization remains in local working copies. The public repository contains the independently authored runtime and reference pages, excluding exported client configuration and tracking data.
