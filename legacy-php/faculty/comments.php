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
        redirect('/faculty/comments.php');
    }
    $body = trim($_POST['body'] ?? '');
    if ($body === '') {
        flash('error', 'Comment cannot be empty.');
        redirect('/faculty/comments.php?group_id=' . $groupId);
    }
    $studentId = $_POST['student_id'] !== '' ? (int) $_POST['student_id'] : null;
    $flagged = !empty($_POST['is_flagged']) ? 1 : 0;
    db()->prepare('INSERT INTO comments (group_id, faculty_id, student_id, body, is_flagged) VALUES (?,?,?,?,?)')
        ->execute([$groupId, $user['id'], $studentId, $body, $flagged]);
    log_activity(ROLE_FACULTY, $user['id'], 'comment_add', 'group', $groupId);
    flash('success', 'Comment posted.');
    redirect('/faculty/comments.php?group_id=' . $groupId);
}

$members = [];
$comments = [];
if ($selected && faculty_can_access_group($user['id'], $selected)) {
    $stmt = db()->prepare('SELECT id, full_name FROM students WHERE group_id = ? ORDER BY full_name');
    $stmt->execute([$selected]);
    $members = $stmt->fetchAll();

    $stmt = db()->prepare('SELECT c.*, s.full_name AS student_name FROM comments c LEFT JOIN students s ON s.id = c.student_id WHERE c.group_id = ? ORDER BY c.created_at DESC');
    $stmt->execute([$selected]);
    $comments = $stmt->fetchAll();
}

render_header('Comments', 'faculty', faculty_nav('comments'));
?>
<div class="page-head">
  <div>
    <h1>Mentor comments</h1>
    <p>Comment on one student or the whole group. Flag items that need urgent action.</p>
  </div>
</div>

<div class="split">
  <div class="card">
    <h2>New comment</h2>
    <?php if (!$groups): ?>
      <p class="muted">No groups available.</p>
    <?php else: ?>
    <form method="post">
      <?= csrf_field() ?>
      <div class="form-group">
        <label>Group</label>
        <select class="form-control" name="group_id" onchange="location='?group_id='+this.value">
          <?php foreach ($groups as $g): ?>
            <option value="<?= (int)$g['id'] ?>" <?= $selected===(int)$g['id']?'selected':'' ?>><?= e($g['group_code']) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="form-group">
        <label>Audience</label>
        <select class="form-control" name="student_id">
          <option value="">Whole group</option>
          <?php foreach ($members as $m): ?>
            <option value="<?= (int)$m['id'] ?>"><?= e($m['full_name']) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="form-group">
        <label>Comment</label>
        <textarea class="form-control" name="body" required></textarea>
      </div>
      <label style="display:flex;gap:.5rem;align-items:center;margin-bottom:1rem;font-size:.9rem">
        <input type="checkbox" name="is_flagged" value="1"> Flag for attention
      </label>
      <button class="btn btn-primary" type="submit">Post comment</button>
    </form>
    <?php endif; ?>
  </div>
  <div class="card">
    <h3>Thread</h3>
    <?php if (!$comments): ?>
      <p class="muted">No comments yet.</p>
    <?php else: ?>
      <div class="timeline">
        <?php foreach ($comments as $c): ?>
          <div class="timeline-item">
            <div class="dot" style="<?= (int)$c['is_flagged'] ? 'background:var(--danger)' : '' ?>"></div>
            <div>
              <strong><?= e($c['student_name'] ?? 'Whole group') ?></strong>
              <?php if ((int)$c['is_flagged']): ?><span class="badge badge-danger">Flagged</span><?php endif; ?>
              <p><?= e($c['body']) ?></p>
              <small class="muted"><?= e($c['created_at']) ?></small>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
  </div>
</div>
<?php render_footer(); ?>
