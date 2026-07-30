<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/layout.php';
require_once __DIR__ . '/_helpers.php';
require_login(ROLE_ADMIN);

$user = current_user();
$groups = db()->query('SELECT id, group_code, group_name FROM project_groups ORDER BY group_code')->fetchAll();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $sid = trim($_POST['student_id'] ?? '');
    $username = trim($_POST['username'] ?? '');
    $name = trim($_POST['full_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $dept = trim($_POST['department'] ?? '');
    $enr = trim($_POST['enrollment_no'] ?? '');
    $groupId = $_POST['group_id'] !== '' ? (int) $_POST['group_id'] : null;
    $isLeader = !empty($_POST['is_leader']) ? 1 : 0;
    $pass = $_POST['password'] ?? 'password123';

    if ($sid && $username && $name) {
        try {
            if ($isLeader && $groupId) {
                db()->prepare('UPDATE students SET is_leader=0 WHERE group_id=?')->execute([$groupId]);
            }
            db()->prepare('INSERT INTO students (student_id, username, password_hash, full_name, email, department, enrollment_no, group_id, is_leader) VALUES (?,?,?,?,?,?,?,?,?)')
                ->execute([$sid, $username, password_hash($pass, PASSWORD_DEFAULT), $name, $email, $dept, $enr, $groupId, $isLeader]);
            log_activity(ROLE_ADMIN, $user['id'], 'student_create', 'student', (int) db()->lastInsertId());
            flash('success', 'Student created and mapped to group.');
        } catch (Throwable $e) {
            flash('error', 'Could not create student (duplicate?).');
        }
    } else {
        flash('error', 'Student ID, username and name are required.');
    }
    redirect('/admin/students.php');
}

$rows = db()->query('SELECT s.*, g.group_code FROM students s LEFT JOIN project_groups g ON g.id = s.group_id ORDER BY s.full_name')->fetchAll();

render_header('Students', 'admin', admin_nav('students'));
?>
<div class="page-head">
  <div>
    <h1>Students</h1>
    <p>Each student maps to a single group and receives login credentials.</p>
  </div>
</div>

<div class="split">
  <div class="card">
    <h2>Add student</h2>
    <form method="post">
      <?= csrf_field() ?>
      <div class="grid-2">
        <div class="form-group"><label>Student ID</label><input class="form-control" name="student_id" required></div>
        <div class="form-group"><label>Username</label><input class="form-control" name="username" required></div>
      </div>
      <div class="form-group"><label>Full name</label><input class="form-control" name="full_name" required></div>
      <div class="grid-2">
        <div class="form-group"><label>Enrollment no.</label><input class="form-control" name="enrollment_no"></div>
        <div class="form-group"><label>Email</label><input class="form-control" name="email" type="email"></div>
      </div>
      <div class="form-group"><label>Department</label><input class="form-control" name="department"></div>
      <div class="form-group">
        <label>Map to group</label>
        <select class="form-control" name="group_id">
          <option value="">— Unassigned —</option>
          <?php foreach ($groups as $g): ?>
            <option value="<?= (int)$g['id'] ?>"><?= e($g['group_code'] . ' ' . ($g['group_name'] ?: '')) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <label style="display:flex;gap:.5rem;align-items:center;margin-bottom:1rem;font-size:.9rem">
        <input type="checkbox" name="is_leader" value="1"> Group leader
      </label>
      <div class="form-group"><label>Temp password</label><input class="form-control" name="password" value="password123"></div>
      <button class="btn btn-primary" type="submit">Create student</button>
    </form>
  </div>
  <div class="card">
    <h3>Directory</h3>
    <div class="table-wrap">
      <table class="data">
        <thead><tr><th>Student</th><th>Group</th><th>Login</th><th>Role</th></tr></thead>
        <tbody>
        <?php foreach ($rows as $r): ?>
          <tr>
            <td><strong><?= e($r['full_name']) ?></strong><br><span class="muted"><?= e($r['student_id']) ?></span></td>
            <td><?= e($r['group_code'] ?? '—') ?></td>
            <td><?= e($r['username']) ?></td>
            <td><?= (int)$r['is_leader'] ? '<span class="badge badge-ok">Leader</span>' : '<span class="badge badge-muted">Member</span>' ?></td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>
<?php render_footer(); ?>
