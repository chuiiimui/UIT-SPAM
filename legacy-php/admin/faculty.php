<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/layout.php';
require_once __DIR__ . '/_helpers.php';
require_login(ROLE_ADMIN);

$user = current_user();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $fid = trim($_POST['faculty_id'] ?? '');
    $username = trim($_POST['username'] ?? '');
    $name = trim($_POST['full_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $dept = trim($_POST['department'] ?? '');
    $desig = trim($_POST['designation'] ?? 'Assistant Professor');
    $pass = $_POST['password'] ?? 'password123';

    if ($fid && $username && $name) {
        try {
            db()->prepare('INSERT INTO faculty (faculty_id, username, password_hash, full_name, email, department, designation) VALUES (?,?,?,?,?,?,?)')
                ->execute([$fid, $username, password_hash($pass, PASSWORD_DEFAULT), $name, $email, $dept, $desig]);
            log_activity(ROLE_ADMIN, $user['id'], 'faculty_create', 'faculty', (int) db()->lastInsertId());
            flash('success', 'Faculty account created.');
        } catch (Throwable $e) {
            flash('error', 'Could not create faculty (duplicate ID/username?).');
        }
    } else {
        flash('error', 'Faculty ID, username and name are required.');
    }
    redirect('/admin/faculty.php');
}

$rows = db()->query('SELECT f.*, (SELECT COUNT(*) FROM group_mentors gm WHERE gm.faculty_id = f.id) AS group_count FROM faculty f ORDER BY f.full_name')->fetchAll();

render_header('Faculty', 'admin', admin_nav('faculty'));
?>
<div class="page-head">
  <div>
    <h1>Faculty mentors</h1>
    <p>Tracked by faculty ID and name — one mentor may oversee many groups.</p>
  </div>
</div>

<div class="split">
  <div class="card">
    <h2>Add faculty</h2>
    <form method="post">
      <?= csrf_field() ?>
      <div class="grid-2">
        <div class="form-group"><label>Faculty ID</label><input class="form-control" name="faculty_id" required placeholder="FAC004"></div>
        <div class="form-group"><label>Username</label><input class="form-control" name="username" required></div>
      </div>
      <div class="form-group"><label>Full name</label><input class="form-control" name="full_name" required></div>
      <div class="form-group"><label>Email</label><input class="form-control" name="email" type="email"></div>
      <div class="grid-2">
        <div class="form-group"><label>Department</label><input class="form-control" name="department"></div>
        <div class="form-group"><label>Designation</label><input class="form-control" name="designation" value="Assistant Professor"></div>
      </div>
      <div class="form-group"><label>Temp password</label><input class="form-control" name="password" value="password123"></div>
      <button class="btn btn-primary" type="submit">Create faculty</button>
    </form>
  </div>
  <div class="card">
    <h3>Directory</h3>
    <div class="table-wrap">
      <table class="data">
        <thead><tr><th>Faculty</th><th>Dept</th><th>Login</th><th>Groups</th></tr></thead>
        <tbody>
        <?php foreach ($rows as $r): ?>
          <tr>
            <td><strong><?= e($r['full_name']) ?></strong><br><span class="muted"><?= e($r['faculty_id']) ?> · <?= e($r['designation']) ?></span></td>
            <td><?= e($r['department']) ?></td>
            <td><?= e($r['username']) ?></td>
            <td><?= (int)$r['group_count'] ?></td>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>
  </div>
</div>
<?php render_footer(); ?>
