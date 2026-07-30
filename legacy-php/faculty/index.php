<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/layout.php';
require_once __DIR__ . '/_helpers.php';
require_login(ROLE_FACULTY);

$user = current_user();
$groups = faculty_groups($user['id']);
$groupIds = array_column($groups, 'id');

$pendingReviews = 0;
$assessmentCount = 0;
if ($groupIds) {
    $in = implode(',', array_fill(0, count($groupIds), '?'));
    $stmt = db()->prepare("SELECT COUNT(*) c FROM projects WHERE group_id IN ($in) AND status IN ('submitted','under_review')");
    $stmt->execute($groupIds);
    $pendingReviews = (int) $stmt->fetch()['c'];

    $stmt = db()->prepare('SELECT COUNT(*) c FROM assessments WHERE faculty_id = ?');
    $stmt->execute([$user['id']]);
    $assessmentCount = (int) $stmt->fetch()['c'];
}

render_header('Faculty Dashboard', 'faculty', faculty_nav('dash'));
?>
<div class="page-head">
  <div>
    <h1>Monitoring & assessment</h1>
    <p>Welcome, <?= e($user['full_name']) ?> · <?= e($user['faculty_id']) ?></p>
  </div>
</div>

<div class="grid-3" style="margin-bottom:1rem">
  <div class="kpi"><span>Assigned groups</span><strong><?= count($groups) ?></strong></div>
  <div class="kpi"><span>Pending reviews</span><strong><?= $pendingReviews ?></strong></div>
  <div class="kpi"><span>Your assessments</span><strong><?= $assessmentCount ?></strong></div>
</div>

<div class="card">
  <h2>Groups you mentor</h2>
  <?php if (!$groups): ?>
    <p class="muted">No groups assigned yet. The admin will map groups to your faculty ID.</p>
  <?php else: ?>
    <div class="table-wrap">
      <table class="data">
        <thead><tr><th>Group</th><th>Project</th><th>Status</th><th>Role</th><th>Avg marks</th><th></th></tr></thead>
        <tbody>
        <?php foreach ($groups as $g): ?>
          <tr>
            <td><strong><?= e($g['group_code']) ?></strong><br><span class="muted"><?= e($g['group_name']) ?></span></td>
            <td><?= e($g['project_title'] ?? '—') ?><br><?= $g['project_status'] ? status_badge($g['project_status']) : '' ?></td>
            <td><?= status_badge($g['status']) ?></td>
            <td><?= (int)$g['is_primary'] ? '<span class="badge badge-ok">Primary</span>' : '<span class="badge badge-muted">Co-mentor</span>' ?></td>
            <td><?php $avg = avg_marks_for_group((int)$g['id']); echo $avg !== null ? $avg.'%' : '—'; ?></td>
            <td><a class="btn btn-sm btn-secondary" href="/faculty/group.php?id=<?= (int)$g['id'] ?>">Open</a></td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  <?php endif; ?>
</div>
<?php render_footer(); ?>
