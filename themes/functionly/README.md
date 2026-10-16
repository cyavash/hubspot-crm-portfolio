# Functionly focused templates

[Live preview](https://cyavash.github.io/hubspot-crm-portfolio/functionly.html)

![Rendered preview](../../functionly-preview.webp)

Newly authored focused HubL templates based on the original client website's information architecture and identity, using existing brand artwork. These files are a separate, focused package rather than a complete original theme export.

## Scope and validation

The native HubSpot blog listing uses `contents`, post URLs, featured images, author metadata and server-generated previous/next page links. JavaScript search filters the current loaded page and identifies that scope in its label. The article template renders HubSpot's CMS-authored post body, title, author and publish date. The static preview provides a three-card editorial layout and an independently written sample article with a contents rail. Its category chips demonstrate filtering over the loaded cards; public client article links open their original destinations.

The HubL article is intentionally minimal: the CMS rich-text body supplies article sections; the preview's fixed contents rail is not injected into arbitrary portal articles.

Upload the whole directory as a theme to a HubSpot test portal, configure page metadata and navigation routes, and preview the relevant template. Static desktop/mobile accessibility and interaction checks do not constitute HubL compilation or portal editor validation. Those portal checks remain outstanding.
