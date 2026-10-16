<?php
if (!defined('ABSPATH')) { exit; }
get_header();
?>
<main id="main" class="section">
  <h1><?php esc_html_e('Latest updates', 'databiologics-portfolio'); ?></h1>
<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
  <article <?php post_class(); ?>>
    <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
    <?php the_excerpt(); ?>
  </article>
<?php endwhile; the_posts_pagination(); else : ?>
  <p><?php esc_html_e('No content found', 'databiologics-portfolio'); ?></p>
<?php endif; ?>
</main>
<?php get_footer(); ?>
