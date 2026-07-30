<?php
/**
 * Lightweight JSON API foundation for future Android / mobile clients.
 * Authenticate with session for web, or extend with bearer tokens later.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../includes/auth.php';

$path = $_GET['resource'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

function json_out($data, int $code = 200): never
{
    http_response_code($code);
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}

if ($path === 'health') {
    json_out(['ok' => true, 'app' => APP_NAME, 'version' => APP_VERSION]);
}

if ($path === 'login' && $method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $role = $body['role'] ?? '';
    $username = $body['username'] ?? '';
    $password = $body['password'] ?? '';
    if (!in_array($role, [ROLE_ADMIN, ROLE_FACULTY, ROLE_STUDENT], true)) {
        json_out(['error' => 'Invalid role'], 400);
    }
    if (!attempt_login($role, $username, $password)) {
        json_out(['error' => 'Invalid credentials'], 401);
    }
    json_out(['user' => current_user(), 'message' => 'Authenticated']);
}

$user = current_user();
if (!$user) {
    json_out(['error' => 'Unauthorized'], 401);
}

if ($path === 'me') {
    json_out(['user' => $user]);
}

if ($path === 'groups' && $user['role'] === ROLE_FACULTY) {
    require_once __DIR__ . '/../faculty/_helpers.php';
    json_out(['groups' => faculty_groups($user['id'])]);
}

if ($path === 'groups' && $user['role'] === ROLE_ADMIN) {
    $rows = db()->query('SELECT * FROM project_groups ORDER BY group_code')->fetchAll();
    json_out(['groups' => $rows]);
}

if ($path === 'project' && $user['role'] === ROLE_STUDENT) {
    $stmt = db()->prepare('SELECT * FROM projects WHERE group_id = ?');
    $stmt->execute([$user['group_id']]);
    json_out(['project' => $stmt->fetch() ?: null]);
}

json_out(['error' => 'Unknown resource'], 404);
