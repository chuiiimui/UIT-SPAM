<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/layout.php';
require_once __DIR__ . '/_helpers.php';
require_login(ROLE_FACULTY);

$user = current_user();
$groupId = (int) ($_GET['id'] ?? 0);

if (!$groupId || !faculty_can_access_group($user['id'], $groupId)) {
    flash('error', 'You are not assigned to that group.');
    redirect('/faculty/index.php');
}

$stmt = db()->prepare('SELECT * FROM project_groups WHERE id = ?');
$stmt->execute([$groupId]);
$group = $stmt->fetch();

$stmt = db()->prepare('SELECT * FROM projects WHERE group_id = ?');
$stmt->execute([$groupId]);
$project = $stmt->fetch() ?: null;

$stmt = db()->prepare('SELECT * FROM students WHERE group_id = ? ORDER BY is_leader DESC, full_name');
$stmt->execute([$groupId]);
$members = $stmt->fetchAll();

$updates = [];
if ($project) {
    $stmt = db()->prepare('SELECT p.*, s.full_name FROM progress_updates p LEFT JOIN students s ON s.id = p.student_id WHERE p.project_id = ? ORDER BY p.created_at DESC');
    $stmt->execute([$project['id']]);
    $updates = $stmt->fetchAll();
}

// Faculty actions: update project meta, change project status, swap leader, add comment inline
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $action = $_POST['action'] ?? '';

    if ($action === 'project_status' && $project) {
        $status = $_POST['status'] ?? 'under_review';
        $allowed = ['draft','submitted','under_review','approved','revision'];
        if (in_array($status, $allowed, true)) {
            db()->prepare('UPDATE projects SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')->execute([$status, $project['id']]);
            log_activity(ROLE_FACULTY, $user['id'], 'project_status', 'project', (int)$project['id'], ['status' => $status]);
            flash('success', 'Project status updated.');
        }
    }

    if ($action === 'edit_project' && $project) {
        $title = trim($_POST['title'] ?? '');
        $abstract = trim($_POST['abstract'] ?? '');
        if ($title !== '') {
            db()->prepare('UPDATE projects SET title=?, abstract=?, domain=?, tech_stack=?, objectives=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
                ->execute([$title, $abstract, trim($_POST['domain'] ?? ''), trim($_POST['tech_stack'] ?? ''), trim($_POST['objectives'] ?? ''), $project['id']]);
            log_activity(ROLE_FACULTY, $user['id'], 'project_edit', 'project', (int)$project['id']);
            flash('success', 'Project details updated by mentor.');
        }
    }

    if ($action === 'set_leader') {
        $sid = (int) ($_POST['student_id'] ?? 0);
        $check = db()->prepare('SELECT id FROM students WHERE id=? AND group_id=?');
        $check->execute([$sid, $groupId]);
        if ($check->fetch()) {
            db()->prepare('UPDATE students SET is_leader=0 WHERE group_id=?')->execute([$groupId]);
            db()->prepare('UPDATE students SET is_leader=1 WHERE id=?')->execute([$sid]);
            log_activity(ROLE_FACULTY, $user['id'], 'team_leader_change', 'group', $groupId, ['student_id' => $sid]);
            flash('success', 'Team leader updated.');
        }
    }

    if ($action === 'rename_group') {
        $name = trim($_POST['group_name'] ?? '');
        db()->prepare('UPDATE project_groups SET group_name=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')->execute([$name, $groupId]);
        flash('success', 'Group name updated.');
    }

    redirect('/faculty/group.php?id=' . $groupId);
}

// refresh after possible redirects skipped
$stmt = db()->prepare('SELECT * FROM projects WHERE group_id = ?');
$stmt->execute([$groupId]);
$project = $stmt->fetch() ?: null;
$stmt = db()->prepare('SELECT * FROM students WHERE group_id = ? ORDER BY is_leader DESC, full_name');
$stmt->execute([$groupId]);
$members = $stmt->fetchAll();
$stmt = db()->prepare('SELECT * FROM project_groups WHERE id = ?');
$stmt->execute([$groupId]);
$group = $stmt->fetch();

render_header($group['group_code'], 'faculty', faculty_nav('groups'));
?>
<div class="page-head">
  <div>
    <h1><?= e($group['group_code']) ?></h1>
    <p><?= e($group['group_name']) ?> · <?= e($group['department']) ?></p>
  </div>
  <div class="actions">
    <a class="btn btn-secondary" href="/faculty/assess.php?group_id=<?= $groupId ?>">Give marks</a>
    <a class="btn btn-primary" href="/faculty/comments.php?group_id=<?= $groupId ?>">Comment</a>
  </div>
</div>

<div class="split">
  <div class="stack">
    <div class="card">
      <h2>Project oversight</h2>
      <?php if (!$project): ?>
        <p class="muted">Students have not created a project yet.</p>
      <?php else: ?>
        <form method="post">
          <?= csrf_field() ?>
          <input type="hidden" name="action" value="edit_project">
          <div class="form-group"><label>Title</label><input class="form-control" name="title" value="<?= e($project['title']) ?>"></div>
          <div class="grid-2">
            <div class="form-group"><label>Domain</label><input class="form-control" name="domain" value="<?= e($project['domain']) ?>"></div>
            <div class="form-group"><label>Tech stack</label><input class="form-control" name="tech_stack" value="<?= e($project['tech_stack']) ?>"></div>
          </div>
          <div class="form-group"><label>Abstract</label><textarea class="form-control" name="abstract"><?= e($project['abstract']) ?></textarea></div>
          <div class="form-group"><label>Objectives</label><textarea class="form-control" name="objectives"><?= e($project['objectives']) ?></textarea></div>
          <button class="btn btn-secondary" type="submit">Save project changes</button>
        </form>
        <hr class="hr">
        <form method="post" class="actions">
          <?= csrf_field() ?>
          <input type="hidden" name="action" value="project_status">
          <select class="form-control" name="status" style="max-width:220px">
            <?php foreach (['draft','submitted','under_review','approved','revision'] as $st): ?>
              <option value="<?= $st ?>" <?= $project['status']===$st?'selected':'' ?>><?= str_replace('_',' ',$st) ?></option>
            <?php endforeach; ?>
          </select>
          <button class="btn btn-primary" type="submit">Update status</button>
        </form>
      <?php endif; ?>
    </div>

    <div class="card">
      <h2>Progress feed</h2>
      <?php if (!$updates): ?>
        <p class="muted">No updates yet.</p>
      <?php else: ?>
        <div class="timeline">
          <?php foreach ($updates as $u): ?>
            <div class="timeline-item">
              <div class="dot"></div>
              <div>
                <strong><?= e($u['title']) ?></strong> · <?= (int)$u['percentage'] ?>%
                <div class="muted"><?= e($u['full_name'] ?? 'Member') ?> · <?= e(MILESTONES[$u['milestone']] ?? $u['milestone']) ?></div>
                <p><?= e($u['description']) ?></p>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </div>
  </div>

  <div class="stack">
    <div class="card">
      <h3>Team controls</h3>
      <form method="post" style="margin-bottom:1rem">
        <?= csrf_field() ?>
        <input type="hidden" name="action" value="rename_group">
        <div class="form-group"><label>Group name</label><input class="form-control" name="group_name" value="<?= e($group['group_name']) ?>"></div>
        <button class="btn btn-sm btn-secondary" type="submit">Rename</button>
      </form>
      <div class="table-wrap">
        <table class="data">
          <thead><tr><th>Member</th><th>Role</th><th></th></tr></thead>
          <tbody>
          <?php foreach ($members as $m): ?>
            <tr>
              <td><?= e($m['full_name']) ?><br><span class="muted"><?= e($m['student_id']) ?></span></td>
              <td><?= (int)$m['is_leader'] ? 'Leader' : 'Member' ?></td>
              <td>
                <?php if (!(int)$m['is_leader']): ?>
                <form method="post">
                  <?= csrf_field() ?>
                  <input type="hidden" name="action" value="set_leader">
                  <input type="hidden" name="student_id" value="<?= (int)$m['id'] ?>">
                  <button class="btn btn-sm btn-ghost" type="submit">Make leader</button>
                </form>
                <?php endif; ?>
              </td>
            </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
<?php render_footer(); ?>
