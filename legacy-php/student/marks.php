<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/layout.php';
require_once __DIR__ . '/_helpers.php';
require_login(ROLE_STUDENT);

$ctx = student_context();
$user = $ctx['user'];
$group = $ctx['group'];

$assessments = [];
$avg = null;
if ($group) {
    $stmt = db()->prepare('SELECT a.*, f.full_name AS faculty_name, s.full_name AS student_name FROM assessments a JOIN faculty f ON f.id = a.faculty_id LEFT JOIN students s ON s.id = a.student_id WHERE a.group_id = ? ORDER BY a.created_at DESC');
    $stmt->execute([$group['id']]);
    $assessments = $stmt->fetchAll();
    $avg = avg_marks_for_group((int) $group['id']);

    $stmt = db()->prepare('SELECT s.id, s.full_name, AVG(a.marks * 1.0 / a.max_marks * 100) AS pct FROM students s LEFT JOIN assessments a ON a.student_id = s.id WHERE s.group_id = ? GROUP BY s.id ORDER BY s.is_leader DESC, s.full_name');
    $stmt->execute([$group['id']]);
    $contrib = $stmt->fetchAll();
} else {
    $contrib = [];
}

render_header('Marks', 'student', student_nav('marks'));
?>
<div class="page-head">
  <div>
    <h1>Marks & contribution</h1>
    <p>Faculty assessments for your group and individual members.</p>
  </div>
</div>

<div class="grid-3" style="margin-bottom:1rem">
  <div class="kpi"><span>Group average</span><strong><?= $avg !== null ? $avg . '%' : '—' ?></strong></div>
  <div class="kpi"><span>Assessments</span><strong><?= count($assessments) ?></strong></div>
  <div class="kpi"><span>Your ID</span><strong style="font-size:1.1rem"><?= e($user['student_id'] ?? '—') ?></strong></div>
</div>

<div class="split">
  <div class="card">
    <h2>Assessment history</h2>
    <?php if (!$assessments): ?>
      <p class="muted">No marks recorded yet.</p>
    <?php else: ?>
      <div class="table-wrap">
        <table class="data">
          <thead><tr><th>Date</th><th>Faculty</th><th>Target</th><th>Milestone</th><th>Marks</th><th>Note</th></tr></thead>
          <tbody>
          <?php foreach ($assessments as $a): ?>
            <tr>
              <td><?= e($a['created_at']) ?></td>
              <td><?= e($a['faculty_name']) ?></td>
              <td><?= e($a['student_name'] ?? 'Whole group') ?></td>
              <td><?= e(MILESTONES[$a['milestone']] ?? ($a['milestone'] ?: '—')) ?></td>
              <td><strong><?= e($a['marks']) ?></strong> / <?= e($a['max_marks']) ?></td>
              <td class="muted"><?= e($a['contribution_note']) ?></td>
            </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
  </div>
  <div class="card">
    <h3>Member contribution</h3>
    <?php foreach ($contrib as $c): ?>
      <div style="display:flex;justify-content:space-between;padding:.55rem 0;border-bottom:1px solid var(--line)">
        <span><?= e($c['full_name']) ?><?= (int)$user['id'] === (int)$c['id'] ? ' (you)' : '' ?></span>
        <strong><?= $c['pct'] !== null ? round((float)$c['pct'], 1) . '%' : '—' ?></strong>
      </div>
    <?php endforeach; ?>
  </div>
</div>
<?php render_footer(); ?>
