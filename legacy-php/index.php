<?php
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/layout.php';

$user = current_user();
if ($user) {
    $dest = match ($user['role']) {
        ROLE_ADMIN => '/admin/index.php',
        ROLE_FACULTY => '/faculty/index.php',
        ROLE_STUDENT => '/student/index.php',
        default => '/index.php',
    };
    redirect($dest);
}

// Ensure DB exists for first visit (silent bootstrap)
if (!file_exists(__DIR__ . '/database/proment.db')) {
    ob_start();
    require_once __DIR__ . '/database/install.php';
    ob_end_clean();
}

$stats = [
    'groups' => (int) db()->query('SELECT COUNT(*) c FROM project_groups')->fetch()['c'],
    'students' => (int) db()->query('SELECT COUNT(*) c FROM students')->fetch()['c'],
    'faculty' => (int) db()->query('SELECT COUNT(*) c FROM faculty')->fetch()['c'],
];

render_header('Welcome', 'public');
?>
<section class="hero">
  <div class="hero-copy">
    <p class="hero-brand"><?= e(APP_NAME) ?></p>
    <h1>Final-year projects, mentored with clarity.</h1>
    <p>
      One campus system for student groups, faculty mentors, and principal oversight —
      from temporary group credentials to progress marks and contribution tracking.
    </p>
    <div class="portal-grid">
      <a class="portal-card" href="/auth/login-student.php">
        <h3>Student Portal</h3>
        <p>Create projects, log progress, view mentor feedback and marks.</p>
        <div class="meta">Enter as Student →</div>
      </a>
      <a class="portal-card" href="/auth/login-faculty.php">
        <h3>Faculty Portal</h3>
        <p>Monitor assigned groups, assess contribution, comment and guide.</p>
        <div class="meta">Enter as Faculty →</div>
      </a>
      <a class="portal-card" href="/auth/login-admin.php">
        <h3>Admin Portal</h3>
        <p>Assign mentors, manage the full database, and oversee every cohort.</p>
        <div class="meta">Enter as Principal →</div>
      </a>
    </div>
  </div>
  <aside class="visual-panel">
    <h2>Built for scale</h2>
    <p style="opacity:.9;margin:0;max-width:28rem">
      Role-separated experiences today. REST-ready APIs tomorrow for Android.
      Structured data for thousands of groups, assessments, and activity trails.
    </p>
    <div class="stat-row">
      <div class="stat"><strong><?= $stats['groups'] ?></strong><span>Project groups</span></div>
      <div class="stat"><strong><?= $stats['students'] ?></strong><span>Students</span></div>
      <div class="stat"><strong><?= $stats['faculty'] ?></strong><span>Faculty mentors</span></div>
    </div>
  </aside>
</section>
<?php render_footer(); ?>
