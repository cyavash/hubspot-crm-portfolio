<?php
if (!defined('ABSPATH')) { exit; }
get_header();
?>
<main id="main">
<?php
foreach (['hero', 'platform', 'process', 'cta'] as $section) {
    get_template_part('template-parts/' . $section);
}
?>
</main>
<?php get_footer(); ?>
