<?php
function render_header(string $title, string $portal = 'public', ?array $nav = null): void
{
    $user = current_user();
    $flash = get_flash();
    ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?= e($title) ?> · <?= e(APP_NAME) ?></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body class="portal-<?= e($portal) ?>">
  <div class="bg-orb bg-orb-a" aria-hidden="true"></div>
  <div class="bg-orb bg-orb-b" aria-hidden="true"></div>

  <header class="topbar">
    <a class="brand" href="/index.php">
      <span class="brand-mark">P</span>
      <span class="brand-text">
        <strong><?= e(APP_NAME) ?></strong>
        <small><?= e(APP_TAGLINE) ?></small>
      </span>
    </a>
    <?php if ($nav): ?>
    <nav class="nav">
      <?php foreach ($nav as $item): ?>
        <a href="<?= e($item['href']) ?>" class="<?= !empty($item['active']) ? 'active' : '' ?>"><?= e($item['label']) ?></a>
      <?php endforeach; ?>
    </nav>
    <?php endif; ?>
    <?php if ($user): ?>
    <div class="user-chip">
      <div>
        <strong><?= e($user['full_name']) ?></strong>
        <small><?= e(ucfirst($user['role'])) ?></small>
      </div>
      <a class="btn btn-ghost btn-sm" href="/auth/logout.php">Sign out</a>
    </div>
    <?php endif; ?>
  </header>

  <main class="shell">
    <?php if ($flash): ?>
      <div class="flash flash-<?= e($flash['type']) ?>"><?= e($flash['message']) ?></div>
    <?php endif; ?>
<?php
}

function render_footer(): void
{
    ?>
  </main>
  <footer class="site-footer">
    <span><?= e(APP_NAME) ?> v<?= e(APP_VERSION) ?></span>
    <span>Built for scalable academic mentoring · Web first · API-ready for Android</span>
  </footer>
  <script src="/assets/js/app.js"></script>
</body>
</html>
<?php
}
