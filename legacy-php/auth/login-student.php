<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/layout.php';

$u = current_user();
if ($u && ($u['role'] ?? '') === ROLE_STUDENT) {
    redirect('/student/index.php');
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    if (attempt_login(ROLE_STUDENT, $_POST['username'] ?? '', $_POST['password'] ?? '')) {
        redirect('/student/index.php');
    }
    $error = 'Invalid student credentials.';
}

render_header('Student Login', 'student');
?>
<div class="auth-wrap">
  <div class="auth-card">
    <h1>Student login</h1>
    <p class="sub">Use your group credentials to open the project workspace.</p>
    <?php if ($error): ?><div class="flash flash-error"><?= e($error) ?></div><?php endif; ?>
    <form method="post">
      <?= csrf_field() ?>
      <div class="form-group">
        <label for="username">Username</label>
        <input class="form-control" id="username" name="username" required autocomplete="username" value="stu_lead1">
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input class="form-control" id="password" name="password" type="password" required autocomplete="current-password" value="password123">
      </div>
      <button class="btn btn-primary btn-block" type="submit">Sign in</button>
    </form>
    <div class="demo-hint">Demo: <strong>stu_lead1</strong> / password123 · Group GRP-2026-001</div>
    <p class="muted" style="margin-top:1rem;font-size:.85rem"><a href="/index.php">← Back to portals</a></p>
  </div>
</div>
<?php render_footer(); ?>
