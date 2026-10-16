<?php if (!defined('ABSPATH')) { exit; } ?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <?php wp_head(); ?>
</head>
<body <?php body_class('databiologics'); ?>>
<?php wp_body_open(); ?>
<a class="skip" href="#main"><?php esc_html_e('Skip to content', 'databiologics-portfolio'); ?></a>
<header class="client-nav">
  <a class="client-brand" href="<?php echo esc_url(home_url('/')); ?>">DataBiologics<span>.</span></a>
  <nav aria-label="<?php esc_attr_e('Main navigation', 'databiologics-portfolio'); ?>">
  <?php if (has_nav_menu('primary')) {
      wp_nav_menu(['theme_location' => 'primary', 'container' => false, 'depth' => 1]);
  } else { ?>
    <a href="#platform">Platform</a>
    <a href="#process">How it works</a>
    <a class="button" href="<?php echo esc_url(home_url('/book-a-demo/')); ?>">Request demo</a>
  <?php } ?>
  </nav>
</header>
