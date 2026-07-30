<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/layout.php';
require_once __DIR__ . '/_helpers.php';
require_login(ROLE_STUDENT);

$ctx = student_context();
$user = $ctx['user'];
$group = $ctx['group'];
$mentor = $ctx['mentor'];

$members = [];
if ($group) {
    $stmt = db()->prepare('SELECT * FROM students WHERE group_id = ? ORDER BY is_leader DESC, full_name');
    $stmt->execute([$group['id']]);
    $members = $stmt->fetchAll();
}

render_header('Team', 'student', student_nav('team'));
?>
<div class="page-head">
  <div>
    <h1>Team & mapping</h1>
    <p>Each student maps to one group. Your mentor is assigned by the admin.</p>
  </div>
</div>

<?php if (!$group): ?>
  <div class="card"><p>No group assigned.</p></div>
<?php else: ?>
<div class="split">
  <div class="card">
    <h2><?= e($group['group_name'] ?: 'Unnamed group') ?></h2>
    <p class="muted">Code <strong><?= e($group['group_code']) ?></strong> · <?= status_badge($group['status']) ?></p>
    <div class="table-wrap" style="margin-top:1rem">
      <table class="data">
        <thead><tr><th>Name</th><th>Student ID</th><th>Enrollment</th><th>Role</th></tr></thead>
        <tbody>
        <?php foreach ($members as $m): ?>
          <tr>
            <td><?= e($m['full_name']) ?></td>
            <td><?= e($m['student_id']) ?></td>
            <td><?= e($m['enrollment_no']) ?></td>
            <td><?= (int)$m['is_leader'] ? '<span class="badge badge-ok">Leader</span>' : '<span class="badge badge-muted">Member</span>' ?></td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
  <div class="card">
    <h3>Faculty advisor</h3>
    <?php if ($mentor): ?>
      <p><strong><?= e($mentor['full_name']) ?></strong></p>
      <p class="muted">Faculty ID: <?= e($mentor['faculty_id']) ?></p>
      <p class="muted"><?= e($mentor['email']) ?></p>
      <p class="muted"><?= e($mentor['designation']) ?> · <?= e($mentor['department']) ?></p>
    <?php else: ?>
      <p class="muted">Awaiting admin assignment.</p>
    <?php endif; ?>
  </div>
</div>
<?php endif; ?>
<?php render_footer(); ?>
