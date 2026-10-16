<?php
/**
 * Plugin Name: Siavash Service Summary
 * Description: A small, accessible WordPress content component with scoped styles.
 * Version: 1.0.0
 * Requires PHP: 8.3
 * Author: Siavash Zahir
 * Author URI: https://siavash.tech/
 *
 * Public development reference. No CRM credentials or client business rules.
 */

declare(strict_types=1);

namespace Siavash\Portfolio;

if (!defined('ABSPATH')) {
    exit;
}

add_action('wp_enqueue_scripts', static function (): void {
    wp_enqueue_style(
        'siavash-service-summary',
        plugins_url('wordpress-service-summary.css', __FILE__),
        [],
        '1.0.0'
    );
});

add_action('init', static function (): void {
    add_shortcode('siavash_service_summary', __NAMESPACE__ . '\\render_service_summary');
});

/**
 * Render an editor-configurable service card without accepting raw HTML.
 *
 * @param array<string, mixed>|string $attributes Shortcode attributes from WordPress.
 */
function render_service_summary(array|string $attributes = []): string
{
    $attributes = shortcode_atts(
        [
            'title' => 'Connected website and CRM',
            'description' => 'Clear lead capture, reliable ownership and consistent follow-up.',
            'url' => '',
            'link_label' => 'Explore the service',
        ],
        is_array($attributes) ? $attributes : [],
        'siavash_service_summary'
    );

    $heading_id = wp_unique_id('siavash-service-');
    $url = esc_url((string) $attributes['url']);
    $link = $url === '' ? '' : sprintf(
        '<a class="siavash-service-summary__link" href="%s">%s<span aria-hidden="true"> →</span></a>',
        $url,
        esc_html((string) $attributes['link_label'])
    );

    return sprintf(
        '<section class="siavash-service-summary" aria-labelledby="%1$s"><h2 id="%1$s">%2$s</h2><p>%3$s</p>%4$s</section>',
        esc_attr($heading_id),
        esc_html((string) $attributes['title']),
        esc_html((string) $attributes['description']),
        $link
    );
}
