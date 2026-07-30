<?php
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/layout.php';
require_once __DIR__ . '/_helpers.php';
require_login(ROLE_ADMIN);

$report = db()->query('SELECT g.group_code, g.group_name, g.department, g.status,
    p.title AS project_title, p.status AS project_status,
    f.full_name AS mentor,
    (SELECT COUNT(*) FROM students s WHERE s.group_id = g.id) AS members,
    (SELECT ROUND(AVG(a.marks * 1.0 / a.max_marks * 100),1) FROM assessments a WHERE a.group_id = g.id) AS avg_pct,
    (SELECT COUNT(*) FROM progress_updates pu JOIN projects pr ON pr.id = pu.project_id WHERE pr.group_id = g.id) AS updates
    FROM project_groups g
    LEFT JOIN projects p ON p.group_id = g.id
    LEFT JOIN group_mentors gm ON gm.group_id = g.id AND gm.is_primary = 1
    LEFT JOIN faculty f ON f.id = gm.faculty_id
    ORDER BY g.group_code')->fetchAll();

render_header('Reports', 'admin', admin_nav('reports'));
?>
<div class="page-head">
  <div>
    <h1>Campus reports</h1>
    <p>Cohort-wide view of progress, mentoring coverage, and assessment averages.</p>
  </div>
</div>

<div class="card">
  <div class="table-wrap">
    <table class="data">
      <thead>
        <tr>
          <th>Group</th>
          <th>Dept</th>
          <th>Mentor</th>
          <th>Members</th>
          <th>Project</th>
          <th>Updates</th>
          <th>Avg marks</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
      <?php foreach ($report as $r): ?>
        <tr>
          <td><strong><?= e($r['group_code']) ?></strong><br><span class="muted"><?= e($r['group_name']) ?></span></td>
          <td><?= e($r['department']) ?></td>
          <td><?= e($r['mentor'] ?? 'Unassigned') ?></td>
          <td><?= (int)$r['members'] ?></td>
          <td><?= e($r['project_title'] ?? '—') ?><?php if ($r['project_status']): ?><br><?= status_badge($r['project_status']) ?><?php endif; ?></td>
          <td><?= (int)$r['updates'] ?></td>
          <td><?= $r['avg_pct'] !== null ? e($r['avg_pct']) . '%' : '—' ?></td>
          <td><?= status_badge($r['status']) ?></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</div>
<?php render_footer(); ?>
