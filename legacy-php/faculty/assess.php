<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/layout.php';
require_once __DIR__ . '/_helpers.php';
require_login(ROLE_FACULTY);

$user = current_user();
$groups = faculty_groups($user['id']);
$selected = (int) ($_GET['group_id'] ?? ($groups[0]['id'] ?? 0));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $groupId = (int) ($_POST['group_id'] ?? 0);
    if (!faculty_can_access_group($user['id'], $groupId)) {
        flash('error', 'Unauthorized group.');
        redirect('/faculty/assess.php');
    }
    $studentId = $_POST['student_id'] !== '' ? (int) $_POST['student_id'] : null;
    $marks = (float) ($_POST['marks'] ?? 0);
    $max = (float) ($_POST['max_marks'] ?? 10);
    $milestone = $_POST['milestone'] ?? '';
    $note = trim($_POST['contribution_note'] ?? '');

    $stmt = db()->prepare('INSERT INTO assessments (group_id, faculty_id, student_id, milestone, marks, max_marks, contribution_note) VALUES (?,?,?,?,?,?,?)');
    $stmt->execute([$groupId, $user['id'], $studentId, $milestone ?: null, $marks, $max, $note]);
    log_activity(ROLE_FACULTY, $user['id'], 'assessment_add', 'group', $groupId);
    flash('success', 'Assessment recorded.');
    redirect('/faculty/assess.php?group_id=' . $groupId);
}

$members = [];
if ($selected && faculty_can_access_group($user['id'], $selected)) {
    $stmt = db()->prepare('SELECT id, full_name, student_id FROM students WHERE group_id = ? ORDER BY is_leader DESC, full_name');
    $stmt->execute([$selected]);
    $members = $stmt->fetchAll();
}

$history = [];
if ($selected) {
    $stmt = db()->prepare('SELECT a.*, s.full_name AS student_name FROM assessments a LEFT JOIN students s ON s.id = a.student_id WHERE a.group_id = ? AND a.faculty_id = ? ORDER BY a.created_at DESC LIMIT 20');
    $stmt->execute([$selected, $user['id']]);
    $history = $stmt->fetchAll();
}

render_header('Assess', 'faculty', faculty_nav('assess'));
?>
<div class="page-head">
  <div>
    <h1>Progress marks</h1>
    <p>Score the whole group or individual contribution per milestone.</p>
  </div>
</div>

<div class="split">
  <div class="card">
    <h2>Record assessment</h2>
    <?php if (!$groups): ?>
      <p class="muted">No groups to assess.</p>
    <?php else: ?>
    <form method="post">
      <?= csrf_field() ?>
      <div class="form-group">
        <label>Group</label>
        <select class="form-control" name="group_id" onchange="location='?group_id='+this.value">
          <?php foreach ($groups as $g): ?>
            <option value="<?= (int)$g['id'] ?>" <?= $selected===(int)$g['id']?'selected':'' ?>><?= e($g['group_code'] . ' — ' . ($g['group_name'] ?: 'Group')) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="form-group">
        <label>Target</label>
        <select class="form-control" name="student_id">
          <option value="">Whole group</option>
          <?php foreach ($members as $m): ?>
            <option value="<?= (int)$m['id'] ?>"><?= e($m['full_name']) ?> (<?= e($m['student_id']) ?>)</option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="form-group">
        <label>Milestone</label>
        <select class="form-control" name="milestone">
          <?php foreach (MILESTONES as $k => $label): ?>
            <option value="<?= e($k) ?>"><?= e($label) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="grid-2">
        <div class="form-group"><label>Marks</label><input class="form-control" type="number" step="0.5" name="marks" value="8" required></div>
        <div class="form-group"><label>Max marks</label><input class="form-control" type="number" step="0.5" name="max_marks" value="10" required></div>
      </div>
      <div class="form-group">
        <label>Contribution note</label>
        <textarea class="form-control" name="contribution_note" placeholder="What stood out about their progress?"></textarea>
      </div>
      <button class="btn btn-primary" type="submit">Save marks</button>
    </form>
    <?php endif; ?>
  </div>
  <div class="card">
    <h3>Recent assessments</h3>
    <?php if (!$history): ?>
      <p class="muted">Nothing recorded for this group yet.</p>
    <?php else: ?>
      <?php foreach ($history as $h): ?>
        <div style="padding:.7rem 0;border-bottom:1px solid var(--line)">
          <strong><?= e($h['marks']) ?>/<?= e($h['max_marks']) ?></strong>
          · <?= e($h['student_name'] ?? 'Whole group') ?>
          <div class="muted"><?= e(MILESTONES[$h['milestone']] ?? $h['milestone']) ?> · <?= e($h['created_at']) ?></div>
          <div><?= e($h['contribution_note']) ?></div>
        </div>
      <?php endforeach; ?>
    <?php endif; ?>
  </div>
</div>
<?php render_footer(); ?>
