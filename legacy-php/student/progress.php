<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/layout.php';
require_once __DIR__ . '/_helpers.php';
require_login(ROLE_STUDENT);

$ctx = student_context();
$user = $ctx['user'];
$group = $ctx['group'];
$project = $ctx['project'];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $project) {
    verify_csrf();
    $milestone = $_POST['milestone'] ?? 'proposal';
    $title = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $percentage = max(0, min(100, (int) ($_POST['percentage'] ?? 0)));
    if ($title === '') {
        flash('error', 'Update title is required.');
        redirect('/student/progress.php');
    }
    $stmt = db()->prepare('INSERT INTO progress_updates (project_id, student_id, milestone, title, description, percentage) VALUES (?,?,?,?,?,?)');
    $stmt->execute([$project['id'], $user['id'], $milestone, $title, $description, $percentage]);
    log_activity(ROLE_STUDENT, $user['id'], 'progress_add', 'project', (int) $project['id']);
    flash('success', 'Progress update posted.');
    redirect('/student/progress.php');
}

$updates = [];
$comments = [];
if ($project) {
    $stmt = db()->prepare('SELECT p.*, s.full_name FROM progress_updates p LEFT JOIN students s ON s.id = p.student_id WHERE p.project_id = ? ORDER BY p.created_at DESC');
    $stmt->execute([$project['id']]);
    $updates = $stmt->fetchAll();
}
if ($group) {
    $stmt = db()->prepare('SELECT c.*, f.full_name AS faculty_name, s.full_name AS student_name FROM comments c JOIN faculty f ON f.id = c.faculty_id LEFT JOIN students s ON s.id = c.student_id WHERE c.group_id = ? ORDER BY c.created_at DESC');
    $stmt->execute([$group['id']]);
    $comments = $stmt->fetchAll();
}

render_header('Progress', 'student', student_nav('progress'));
?>
<div class="page-head">
  <div>
    <h1>Progress timeline</h1>
    <p>Log milestone updates so your mentor can review and mark contribution.</p>
  </div>
</div>

<?php if (!$project): ?>
  <div class="card"><p>Create and save your project first. <a href="/student/index.php">Go to project →</a></p></div>
<?php else: ?>
<div class="split">
  <div class="card">
    <h2>Post an update</h2>
    <form method="post">
      <?= csrf_field() ?>
      <div class="grid-2">
        <div class="form-group">
          <label>Milestone</label>
          <select class="form-control" name="milestone">
            <?php foreach (MILESTONES as $k => $label): ?>
              <option value="<?= e($k) ?>"><?= e($label) ?></option>
            <?php endforeach; ?>
          </select>
        </div>
        <div class="form-group">
          <label>Completion %</label>
          <input class="form-control" type="number" name="percentage" min="0" max="100" value="25">
        </div>
      </div>
      <div class="form-group">
        <label>Title</label>
        <input class="form-control" name="title" required placeholder="What did you complete?">
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea class="form-control" name="description" placeholder="Details, blockers, next steps..."></textarea>
      </div>
      <button class="btn btn-primary" type="submit">Publish update</button>
    </form>
  </div>
  <div class="card">
    <h3>Mentor comments</h3>
    <?php if (!$comments): ?>
      <p class="muted">No comments yet.</p>
    <?php else: ?>
      <div class="timeline">
        <?php foreach ($comments as $c): ?>
          <div class="timeline-item">
            <div class="dot"></div>
            <div>
              <strong><?= e($c['faculty_name']) ?></strong>
              <?php if ($c['student_name']): ?><span class="muted"> → <?= e($c['student_name']) ?></span><?php else: ?><span class="muted"> → Whole group</span><?php endif; ?>
              <p style="margin:.35rem 0"><?= e($c['body']) ?></p>
              <small class="muted"><?= e($c['created_at']) ?></small>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
  </div>
</div>

<div class="card">
  <h2>Submitted updates</h2>
  <?php if (!$updates): ?>
    <p class="muted">No progress logged yet.</p>
  <?php else: ?>
    <div class="table-wrap">
      <table class="data">
        <thead><tr><th>When</th><th>By</th><th>Milestone</th><th>Update</th><th>%</th></tr></thead>
        <tbody>
        <?php foreach ($updates as $u): ?>
          <tr>
            <td><?= e($u['created_at']) ?></td>
            <td><?= e($u['full_name'] ?? '—') ?></td>
            <td><?= e(MILESTONES[$u['milestone']] ?? $u['milestone']) ?></td>
            <td><strong><?= e($u['title']) ?></strong><br><span class="muted"><?= e($u['description']) ?></span></td>
            <td><?= (int)$u['percentage'] ?>%</td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  <?php endif; ?>
</div>
<?php endif; ?>
<?php render_footer(); ?>
