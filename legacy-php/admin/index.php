<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/layout.php';
require_once __DIR__ . '/_helpers.php';
require_login(ROLE_ADMIN);

$counts = [
    'groups' => (int) db()->query('SELECT COUNT(*) c FROM project_groups')->fetch()['c'],
    'students' => (int) db()->query('SELECT COUNT(*) c FROM students')->fetch()['c'],
    'faculty' => (int) db()->query('SELECT COUNT(*) c FROM faculty')->fetch()['c'],
    'unassigned' => (int) db()->query('SELECT COUNT(*) c FROM project_groups g WHERE NOT EXISTS (SELECT 1 FROM group_mentors gm WHERE gm.group_id = g.id AND gm.is_primary = 1)')->fetch()['c'],
    'projects' => (int) db()->query('SELECT COUNT(*) c FROM projects')->fetch()['c'],
    'assessments' => (int) db()->query('SELECT COUNT(*) c FROM assessments')->fetch()['c'],
];

$recent = db()->query('SELECT * FROM activity_log ORDER BY id DESC LIMIT 12')->fetchAll();

render_header('Admin Overview', 'admin', admin_nav('dash'));
?>
<div class="page-head">
  <div>
    <h1>Campus command center</h1>
    <p>Full database access · Mentor assignment · Cross-role oversight</p>
  </div>
</div>

<div class="grid-3" style="margin-bottom:1rem">
  <div class="kpi"><span>Groups</span><strong><?= $counts['groups'] ?></strong></div>
  <div class="kpi"><span>Students</span><strong><?= $counts['students'] ?></strong></div>
  <div class="kpi"><span>Faculty</span><strong><?= $counts['faculty'] ?></strong></div>
  <div class="kpi"><span>Unassigned mentors</span><strong><?= $counts['unassigned'] ?></strong></div>
  <div class="kpi"><span>Projects</span><strong><?= $counts['projects'] ?></strong></div>
  <div class="kpi"><span>Assessments</span><strong><?= $counts['assessments'] ?></strong></div>
</div>

<div class="split">
  <div class="card">
    <h2>Quick actions</h2>
    <div class="actions">
      <a class="btn btn-primary" href="/admin/assign.php">Assign faculty mentors</a>
      <a class="btn btn-secondary" href="/admin/groups.php">Register new group</a>
      <a class="btn btn-secondary" href="/admin/students.php">Add student</a>
      <a class="btn btn-secondary" href="/admin/faculty.php">Add faculty</a>
      <a class="btn btn-ghost" href="/admin/reports.php">View reports</a>
    </div>
    <hr class="hr">
    <p class="muted">Admin inherits every faculty and student capability, plus exclusive mentor assignment and global CRUD.</p>
  </div>
  <div class="card">
    <h3>Activity trail</h3>
    <?php foreach ($recent as $r): ?>
      <div style="padding:.55rem 0;border-bottom:1px solid var(--line);font-size:.9rem">
        <strong><?= e($r['actor_role']) ?></strong> · <?= e($r['action']) ?>
        <div class="muted"><?= e($r['created_at']) ?></div>
      </div>
    <?php endforeach; ?>
  </div>
</div>
<?php render_footer(); ?>
