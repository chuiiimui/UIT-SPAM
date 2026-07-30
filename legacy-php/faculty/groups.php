<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/layout.php';
require_once __DIR__ . '/_helpers.php';
require_login(ROLE_FACULTY);

$user = current_user();
$groups = faculty_groups($user['id']);

render_header('My Groups', 'faculty', faculty_nav('groups'));
?>
<div class="page-head">
  <div>
    <h1>Assigned groups</h1>
    <p>One faculty can mentor multiple groups. Each student belongs to a single group.</p>
  </div>
</div>

<div class="grid-2">
<?php foreach ($groups as $g): ?>
  <a class="portal-card" href="/faculty/group.php?id=<?= (int)$g['id'] ?>">
    <h3><?= e($g['group_code']) ?> · <?= e($g['group_name'] ?: 'Group') ?></h3>
    <p><?= e($g['project_title'] ?? 'Project not created yet') ?></p>
    <div class="meta"><?= e($g['department']) ?> · Open workspace →</div>
  </a>
<?php endforeach; ?>
<?php if (!$groups): ?>
  <div class="card"><p class="muted">No mentorship mappings yet.</p></div>
<?php endif; ?>
</div>
<?php render_footer(); ?>
