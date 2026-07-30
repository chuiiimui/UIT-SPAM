<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/layout.php';
require_once __DIR__ . '/_helpers.php';
require_login(ROLE_ADMIN);

$user = current_user();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $action = $_POST['action'] ?? 'assign';

    if ($action === 'assign') {
        $groupId = (int) ($_POST['group_id'] ?? 0);
        $facultyId = (int) ($_POST['faculty_id'] ?? 0);
        $primary = !empty($_POST['is_primary']) ? 1 : 0;
        if ($groupId && $facultyId) {
            if ($primary) {
                db()->prepare('UPDATE group_mentors SET is_primary=0 WHERE group_id=?')->execute([$groupId]);
            }
            // upsert-like
            $exists = db()->prepare('SELECT id FROM group_mentors WHERE group_id=? AND faculty_id=?');
            $exists->execute([$groupId, $facultyId]);
            if ($row = $exists->fetch()) {
                db()->prepare('UPDATE group_mentors SET is_primary=?, assigned_by=?, assigned_at=CURRENT_TIMESTAMP WHERE id=?')
                    ->execute([$primary, $user['id'], $row['id']]);
            } else {
                db()->prepare('INSERT INTO group_mentors (group_id, faculty_id, assigned_by, is_primary) VALUES (?,?,?,?)')
                    ->execute([$groupId, $facultyId, $user['id'], $primary]);
            }
            db()->prepare("UPDATE project_groups SET status=CASE WHEN status='pending' THEN 'active' ELSE status END, is_temporary=0, updated_at=CURRENT_TIMESTAMP WHERE id=?")
                ->execute([$groupId]);
            log_activity(ROLE_ADMIN, $user['id'], 'mentor_assign', 'group', $groupId, ['faculty_pk' => $facultyId]);
            flash('success', 'Faculty mentor assigned. Project timeline is now active.');
        }
    }

    if ($action === 'remove') {
        $id = (int) ($_POST['map_id'] ?? 0);
        db()->prepare('DELETE FROM group_mentors WHERE id=?')->execute([$id]);
        flash('success', 'Mentorship mapping removed.');
    }

    redirect('/admin/assign.php');
}

$groups = db()->query('SELECT id, group_code, group_name FROM project_groups ORDER BY group_code')->fetchAll();
$faculty = db()->query('SELECT id, faculty_id, full_name, department FROM faculty WHERE is_active=1 ORDER BY full_name')->fetchAll();
$maps = db()->query('SELECT gm.*, g.group_code, g.group_name, f.full_name AS faculty_name, f.faculty_id AS fid
    FROM group_mentors gm
    JOIN project_groups g ON g.id = gm.group_id
    JOIN faculty f ON f.id = gm.faculty_id
    ORDER BY g.group_code, gm.is_primary DESC')->fetchAll();

render_header('Assign Mentors', 'admin', admin_nav('assign'));
?>
<div class="page-head">
  <div>
    <h1>Faculty assignment</h1>
    <p>Only admin can map mentors. Assignment starts the monitored project timeline.</p>
  </div>
</div>

<div class="split">
  <div class="card">
    <h2>Assign project mentor</h2>
    <form method="post">
      <?= csrf_field() ?>
      <input type="hidden" name="action" value="assign">
      <div class="form-group">
        <label>Student group</label>
        <select class="form-control" name="group_id" required>
          <option value="">Select group</option>
          <?php foreach ($groups as $g): ?>
            <option value="<?= (int)$g['id'] ?>"><?= e($g['group_code'] . ' — ' . ($g['group_name'] ?: 'Unnamed')) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="form-group">
        <label>Faculty mentor</label>
        <select class="form-control" name="faculty_id" required>
          <option value="">Select faculty</option>
          <?php foreach ($faculty as $f): ?>
            <option value="<?= (int)$f['id'] ?>"><?= e($f['faculty_id'] . ' · ' . $f['full_name'] . ' (' . $f['department'] . ')') ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <label style="display:flex;gap:.5rem;align-items:center;margin-bottom:1rem;font-size:.9rem">
        <input type="checkbox" name="is_primary" value="1" checked> Primary mentor
      </label>
      <button class="btn btn-primary" type="submit">Assign mentor</button>
    </form>
  </div>
  <div class="card">
    <h3>Current mappings</h3>
    <div class="table-wrap">
      <table class="data">
        <thead><tr><th>Group</th><th>Faculty</th><th>Role</th><th>Assigned</th><th></th></tr></thead>
        <tbody>
        <?php foreach ($maps as $m): ?>
          <tr>
            <td><strong><?= e($m['group_code']) ?></strong><br><span class="muted"><?= e($m['group_name']) ?></span></td>
            <td><?= e($m['faculty_name']) ?><br><span class="muted"><?= e($m['fid']) ?></span></td>
            <td><?= (int)$m['is_primary'] ? '<span class="badge badge-ok">Primary</span>' : '<span class="badge badge-muted">Co-mentor</span>' ?></td>
            <td class="muted"><?= e($m['assigned_at']) ?></td>
            <td>
              <form method="post">
                <?= csrf_field() ?>
                <input type="hidden" name="action" value="remove">
                <input type="hidden" name="map_id" value="<?= (int)$m['id'] ?>">
                <button class="btn btn-sm btn-danger" type="submit" data-confirm="Remove this mentor mapping?">Remove</button>
              </form>
            </td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>
<?php render_footer(); ?>
