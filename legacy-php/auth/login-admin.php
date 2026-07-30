<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/layout.php';

$u = current_user();
if ($u && ($u['role'] ?? '') === ROLE_ADMIN) {
    redirect('/admin/index.php');
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    if (attempt_login(ROLE_ADMIN, $_POST['username'] ?? '', $_POST['password'] ?? '')) {
        redirect('/admin/index.php');
    }
    $error = 'Invalid admin credentials.';
}

render_header('Admin Login', 'admin');
?>
<div class="auth-wrap">
  <div class="auth-card">
    <h1>Admin login</h1>
    <p class="sub">Principal oversight — full campus database and mentor assignment.</p>
    <?php if ($error): ?><div class="flash flash-error"><?= e($error) ?></div><?php endif; ?>
    <form method="post">
      <?= csrf_field() ?>
      <div class="form-group">
        <label for="username">Username</label>
        <input class="form-control" id="username" name="username" required value="principal">
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input class="form-control" id="password" name="password" type="password" required value="password123">
      </div>
      <button class="btn btn-primary btn-block" type="submit">Sign in</button>
    </form>
    <div class="demo-hint">Demo: <strong>principal</strong> / password123</div>
    <p class="muted" style="margin-top:1rem;font-size:.85rem"><a href="/index.php">← Back to portals</a></p>
  </div>
</div>
<?php render_footer(); ?>
