<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/layout.php';
require_once __DIR__ . '/_helpers.php';
require_login(ROLE_ADMIN);

$user = current_user();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $action = $_POST['action'] ?? '';

    if ($action === 'create_group') {
        $code = trim($_POST['group_code'] ?? '') ?: generate_group_code();
        $name = trim($_POST['group_name'] ?? '');
        $dept = trim($_POST['department'] ?? '');
        $year = trim($_POST['academic_year'] ?? date('Y') . '-' . substr((string)(date('Y')+1), -2));
        $sem = trim($_POST['semester'] ?? 'VIII');
        try {
            db()->prepare('INSERT INTO project_groups (group_code, group_name, academic_year, semester, department, status, is_temporary) VALUES (?,?,?,?,?,?,1)')
                ->execute([$code, $name, $year, $sem, $dept, 'pending']);
            log_activity(ROLE_ADMIN, $user['id'], 'group_create', 'group', (int) db()->lastInsertId());
            flash('success', "Group $code created with temporary credentials lifecycle.");
        } catch (Throwable $e) {
            flash('error', 'Could not create group (duplicate code?).');
        }
    }

    if ($action === 'set_status') {
        $id = (int) ($_POST['group_id'] ?? 0);
        $status = $_POST['status'] ?? 'pending';
        if (in_array($status, ['pending','active','completed','archived'], true)) {
            $temp = $status === 'active' ? 0 : null;
            if ($temp === 0) {
                db()->prepare('UPDATE project_groups SET status=?, is_temporary=0, updated_at=CURRENT_TIMESTAMP WHERE id=?')
                    ->execute([$status, $id]);
            } else {
                db()->prepare('UPDATE project_groups SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
                    ->execute([$status, $id]);
            }
            flash('success', 'Group status updated.');
        }
    }

    redirect('/admin/groups.php');
}

$rows = db()->query('SELECT g.*,
    (SELECT COUNT(*) FROM students s WHERE s.group_id = g.id) AS member_count,
    (SELECT f.full_name FROM group_mentors gm JOIN faculty f ON f.id = gm.faculty_id WHERE gm.group_id = g.id AND gm.is_primary = 1 LIMIT 1) AS mentor_name,
    p.title AS project_title
    FROM project_groups g
    LEFT JOIN projects p ON p.group_id = g.id
    ORDER BY g.created_at DESC')->fetchAll();

render_header('Groups', 'admin', admin_nav('groups'));
?>
<div class="page-head">
  <div>
    <h1>Project groups</h1>
    <p>Register groups with temporary IDs; activate after mentor mapping and project kickoff.</p>
  </div>
</div>

<div class="split">
  <div class="card">
    <h2>Register group</h2>
    <form method="post">
      <?= csrf_field() ?>
      <input type="hidden" name="action" value="create_group">
      <div class="form-group"><label>Group code (auto if blank)</label><input class="form-control" name="group_code" placeholder="GRP-2026-004"></div>
      <div class="form-group"><label>Group name</label><input class="form-control" name="group_name" placeholder="Team name"></div>
      <div class="grid-2">
        <div class="form-group"><label>Department</label><input class="form-control" name="department" value="Computer Science"></div>
        <div class="form-group"><label>Semester</label><input class="form-control" name="semester" value="VIII"></div>
      </div>
      <div class="form-group"><label>Academic year</label><input class="form-control" name="academic_year" value="2025-26"></div>
      <button class="btn btn-primary" type="submit">Create temporary group</button>
    </form>
  </div>
  <div class="card">
    <h3>All groups</h3>
    <div class="table-wrap">
      <table class="data">
        <thead><tr><th>Code</th><th>Members</th><th>Mentor</th><th>Project</th><th>Status</th><th></th></tr></thead>
        <tbody>
        <?php foreach ($rows as $r): ?>
          <tr>
            <td><strong><?= e($r['group_code']) ?></strong><br><span class="muted"><?= e($r['group_name']) ?></span>
              <?php if ((int)$r['is_temporary']): ?><br><span class="badge badge-warn">Temporary</span><?php endif; ?>
            </td>
            <td><?= (int)$r['member_count'] ?></td>
            <td><?= e($r['mentor_name'] ?? '—') ?></td>
            <td><?= e($r['project_title'] ?? '—') ?></td>
            <td><?= status_badge($r['status']) ?></td>
            <td>
              <form method="post" class="actions">
                <?= csrf_field() ?>
                <input type="hidden" name="action" value="set_status">
                <input type="hidden" name="group_id" value="<?= (int)$r['id'] ?>">
                <select class="form-control" name="status" style="width:auto;padding:.4rem .55rem">
                  <?php foreach (['pending','active','completed','archived'] as $st): ?>
                    <option value="<?= $st ?>" <?= $r['status']===$st?'selected':'' ?>><?= $st ?></option>
                  <?php endforeach; ?>
                </select>
                <button class="btn btn-sm btn-ghost" type="submit">Save</button>
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
