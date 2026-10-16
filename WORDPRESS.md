# WordPress component reference

A portable shortcode component with scoped CSS, output escaping and unique heading IDs. This is a public code reference, separate from the client website's production theme.

## Try it in a WordPress sandbox

1. Put `wordpress-service-summary.php` and `wordpress-service-summary.css` in one plugin directory.
2. Activate **Siavash Service Summary**.
3. Add a Shortcode block:

```text
[siavash_service_summary title="Connected website and CRM" description="Clear lead capture and consistent follow-up." url="/contact/" link_label="Discuss your project"]
```

The component accepts plain text and a URL, not arbitrary HTML. It does not connect to a CRM or transmit form data. It requires PHP 8.3 or newer.

## Review before deployment

Check the component within the target theme, including keyboard focus, heading order, color inheritance and editor previews. WordPress runtime behavior requires a WordPress sandbox; JavaScript tests do not verify PHP integration.
