# StartDeliver homepage refresh

[Working homepage preview](https://cyavash.github.io/hubspot-crm-portfolio/startdeliver.html)

![Rendered homepage preview](../../startdeliver-preview.webp)

A focused, newly authored HubL homepage package grounded in the original StartDeliver HubSpot theme's Customer Success messaging, blue/pink identity, hero, feature cards and integration section. The integration visual is rebuilt with live HTML/CSS text and layout, based on the original theme graphic. This package is separate from the current Framer production website and from the complete original theme export.

## Contents

- Page template and shared layout with HubSpot header/footer includes and page metadata.
- Hero module with editable plain-text headings and description.
- Feature module with an editable repeater and escaped field output.
- Integration and closing CTA modules, a responsive integration visual and local fonts.
- Responsive shared CSS, explicit keyboard focus and reduced motion support. No jQuery or third-party interaction runtime.

## Preview and source relationship

The public preview is static HTML using the same CSS and content. HubL module fields are edited inside HubSpot. Essential content does not depend on JavaScript. This is a homepage demonstration; blog, account, pricing and form backend routes are outside this package. Demo links navigate to StartDeliver's public site and do not submit client data.

## Installation and checks

Upload this entire directory as a theme to a HubSpot test portal with developer access. Create a page using `StartDeliver Homepage Refresh`, supply page-specific metadata, and preview the hero and repeated feature fields at desktop and mobile widths. Update the layout navigation and CTA destinations to the intended portal routes before production use.

Local static preview checks cover horizontal overflow, image loading and automated WCAG A/AA rules at desktop and mobile sizes. JSON and local asset paths are checked separately. HubL compilation, visual parity in a portal, editor behavior and published metadata require a HubSpot sandbox check and have not been verified in this environment.

## Testimonials and motion

The customer quotes and attributions come from the original theme defaults, excluding obvious placeholder entries. A progressively enhanced slider supports Previous/Next, Arrow keys and Home/End on its controls. It never autoplays or shifts keyboard focus. All quotes remain readable without JavaScript. Scroll reveals use IntersectionObserver, reveal only content below the viewport, and respect changes to the reduced-motion preference.
