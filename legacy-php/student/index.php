<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/layout.php';
require_once __DIR__ . '/_helpers.php';
require_login(ROLE_STUDENT);

$ctx = student_context();
$user = $ctx['user'];
$group = $ctx['group'];
$project = $ctx['project'];
$mentor = $ctx['mentor'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    if (!$group) {
        flash('error', 'You are not assigned to a group yet.');
        redirect('/student/index.php');
    }

    $title = trim($_POST['title'] ?? '');
    $abstract = trim($_POST['abstract'] ?? '');
    $domain = trim($_POST['domain'] ?? '');
    $tech = trim($_POST['tech_stack'] ?? '');
    $objectives = trim($_POST['objectives'] ?? '');
    $action = $_POST['action'] ?? 'save';

    if ($title === '') {
        flash('error', 'Project title is required.');
        redirect('/student/index.php');
    }

    $status = $action === 'submit' ? 'submitted' : 'draft';
    $submittedAt = $action === 'submit' ? date('Y-m-d H:i:s') : null;

    if ($project) {
        $stmt = db()->prepare('UPDATE projects SET title=?, abstract=?, domain=?, tech_stack=?, objectives=?, status=?, submitted_at=COALESCE(?, submitted_at), updated_at=CURRENT_TIMESTAMP WHERE id=?');
        $stmt->execute([$title, $abstract, $domain, $tech, $objectives, $status === 'submitted' ? 'submitted' : ($project['status'] === 'approved' ? 'approved' : $status), $submittedAt, $project['id']]);
    } else {
        $stmt = db()->prepare('INSERT INTO projects (group_id, title, abstract, domain, tech_stack, objectives, status, submitted_at) VALUES (?,?,?,?,?,?,?,?)');
        $stmt->execute([$group['id'], $title, $abstract, $domain, $tech, $objectives, $status, $submittedAt]);
    }

    if ($group['status'] === 'pending') {
        db()->prepare("UPDATE project_groups SET status='active', is_temporary=0, updated_at=CURRENT_TIMESTAMP WHERE id=?")->execute([$group['id']]);
    }

    log_activity(ROLE_STUDENT, $user['id'], $action === 'submit' ? 'project_submit' : 'project_save', 'group', (int) $group['id']);
    flash('success', $action === 'submit' ? 'Project submitted for mentor review.' : 'Project draft saved.');
    redirect('/student/index.php');
}

$ctx = student_context();
$project = $ctx['project'];
$group = $ctx['group'];
$mentor = $ctx['mentor'];

render_header('Project Workspace', 'student', student_nav('project'));
?>
<div class="page-head">
  <div>
    <h1>Project creation</h1>
    <p>Define your final-year project. Your mentor will review once submitted.</p>
  </div>
  <?php if ($group): ?>
    <div class="actions">
      <span class="badge badge-info"><?= e($group['group_code']) ?></span>
      <?= status_badge($group['status']) ?>
      <?php if ((int)$group['is_temporary'] === 1): ?><span class="badge badge-warn">Temporary ID</span><?php endif; ?>
    </div>
  <?php endif; ?>
</div>

<?php if (!$group): ?>
  <div class="card"><p>No group mapped to this account. Contact the admin office.</p></div>
<?php else: ?>
<div class="split">
  <div class="card">
    <h2><?= $project ? 'Update project' : 'Create project' ?></h2>
    <form method="post">
      <?= csrf_field() ?>
      <div class="form-group">
        <label>Project title</label>
        <input class="form-control" name="title" required value="<?= e($project['title'] ?? '') ?>">
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label>Domain</label>
          <input class="form-control" name="domain" value="<?= e($project['domain'] ?? '') ?>" placeholder="e.g. Machine Learning">
        </div>
        <div class="form-group">
          <label>Tech stack</label>
          <input class="form-control" name="tech_stack" value="<?= e($project['tech_stack'] ?? '') ?>" placeholder="e.g. PHP, React Native">
        </div>
      </div>
      <div class="form-group">
        <label>Abstract</label>
        <textarea class="form-control" name="abstract"><?= e($project['abstract'] ?? '') ?></textarea>
      </div>
      <div class="form-group">
        <label>Objectives</label>
        <textarea class="form-control" name="objectives"><?= e($project['objectives'] ?? '') ?></textarea>
      </div>
      <div class="actions">
        <button class="btn btn-secondary" name="action" value="save" type="submit">Save draft</button>
        <button class="btn btn-primary" name="action" value="submit" type="submit">Submit for review</button>
      </div>
    </form>
  </div>
  <div class="stack">
    <div class="card">
      <h3>Group snapshot</h3>
      <p><strong><?= e($group['group_name'] ?: $group['group_code']) ?></strong></p>
      <p class="muted"><?= e($group['department']) ?> · <?= e($group['academic_year']) ?> · Sem <?= e($group['semester']) ?></p>
      <hr class="hr">
      <p class="muted" style="margin:0">Project status</p>
      <p><?= $project ? status_badge($project['status']) : '<span class="badge badge-muted">not created</span>' ?></p>
    </div>
    <div class="card">
      <h3>Project mentor</h3>
      <?php if ($mentor): ?>
        <p><strong><?= e($mentor['full_name']) ?></strong></p>
        <p class="muted"><?= e($mentor['faculty_id']) ?> · <?= e($mentor['designation']) ?></p>
        <p class="muted"><?= e($mentor['department']) ?></p>
      <?php else: ?>
        <p class="muted">Mentor not assigned yet. Admin will map a faculty advisor soon.</p>
      <?php endif; ?>
    </div>
  </div>
</div>
<?php endif; ?>
<?php render_footer(); ?>
