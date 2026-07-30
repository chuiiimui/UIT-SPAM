<?php
require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/database.php';

function e(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}

function redirect(string $path): never
{
    header('Location: ' . $path);
    exit;
}

function flash(string $type, string $message): void
{
    $_SESSION['flash'] = ['type' => $type, 'message' => $message];
}

function get_flash(): ?array
{
    if (empty($_SESSION['flash'])) {
        return null;
    }
    $f = $_SESSION['flash'];
    unset($_SESSION['flash']);
    return $f;
}

function csrf_token(): string
{
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function csrf_field(): string
{
    return '<input type="hidden" name="csrf" value="' . e(csrf_token()) . '">';
}

function verify_csrf(): void
{
    $token = $_POST['csrf'] ?? '';
    if (!$token || !hash_equals($_SESSION['csrf'] ?? '', $token)) {
        http_response_code(403);
        exit('Invalid CSRF token.');
    }
}

function log_activity(string $role, ?int $actorId, string $action, ?string $entityType = null, ?int $entityId = null, ?array $meta = null): void
{
    $stmt = db()->prepare('INSERT INTO activity_log (actor_role, actor_id, action, entity_type, entity_id, meta) VALUES (?,?,?,?,?,?)');
    $stmt->execute([$role, $actorId, $action, $entityType, $entityId, $meta ? json_encode($meta) : null]);
}

function generate_group_code(): string
{
    $year = date('Y');
    $stmt = db()->query("SELECT COUNT(*) AS c FROM project_groups WHERE group_code LIKE 'GRP-{$year}-%'");
    $n = ((int) $stmt->fetch()['c']) + 1;
    return sprintf('GRP-%s-%03d', $year, $n);
}

function status_badge(string $status): string
{
    $map = [
        'pending' => 'badge-warn',
        'active' => 'badge-ok',
        'completed' => 'badge-info',
        'archived' => 'badge-muted',
        'draft' => 'badge-muted',
        'submitted' => 'badge-info',
        'under_review' => 'badge-warn',
        'approved' => 'badge-ok',
        'revision' => 'badge-danger',
    ];
    $class = $map[$status] ?? 'badge-muted';
    return '<span class="badge ' . $class . '">' . e(str_replace('_', ' ', $status)) . '</span>';
}

function avg_marks_for_group(int $groupId): ?float
{
    $stmt = db()->prepare('SELECT AVG(marks * 1.0 / max_marks * 100) AS avg_pct FROM assessments WHERE group_id = ?');
    $stmt->execute([$groupId]);
    $v = $stmt->fetch()['avg_pct'];
    return $v === null ? null : round((float) $v, 1);
}

function require_post(): void
{
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        exit('Method not allowed');
    }
}
