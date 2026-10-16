<?php
/** Theme setup and assets. */
if (!defined('ABSPATH')) { exit; }
add_action('after_setup_theme', static function (): void {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('responsive-embeds');
    add_theme_support('html5', ['search-form', 'gallery', 'caption', 'style', 'script']);
    register_nav_menus(['primary' => __('Primary navigation', 'databiologics-portfolio')]);
});
add_action('wp_enqueue_scripts', static function (): void {
    $file = get_theme_file_path('/assets/site.css');
    wp_enqueue_style('databiologics-site', get_theme_file_uri('/assets/site.css'), [], (string) filemtime($file));
});
add_action('customize_register', static function (WP_Customize_Manager $customizer): void {
    $customizer->add_section('databiologics_home', [
        'title' => __('Homepage', 'databiologics-portfolio'),
        'priority' => 30,
    ]);
    $customizer->add_setting('databiologics_heading', [
        'default' => 'Proof that innovation works.',
        'sanitize_callback' => 'sanitize_text_field',
    ]);
    $customizer->add_control('databiologics_heading', [
        'label' => __('Hero heading', 'databiologics-portfolio'),
        'section' => 'databiologics_home',
        'type' => 'text',
    ]);
    $customizer->add_setting('databiologics_description', [
        'default' => 'Turn patient-reported outcomes into a clearer picture of care. Collect feedback, organize the results and put your data to work.',
        'sanitize_callback' => 'sanitize_textarea_field',
    ]);
    $customizer->add_control('databiologics_description', [
        'label' => __('Hero description', 'databiologics-portfolio'),
        'section' => 'databiologics_home',
        'type' => 'textarea',
    ]);
});
