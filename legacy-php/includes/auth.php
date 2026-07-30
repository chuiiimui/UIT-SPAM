<?php
require_once __DIR__ . '/functions.php';

function current_user(): ?array
{
    return $_SESSION['user'] ?? null;
}

function require_login(string $role): void
{
    $user = current_user();
    if (!$user || ($user['role'] ?? '') !== $role) {
        $map = [
            ROLE_ADMIN => '/auth/login-admin.php',
            ROLE_FACULTY => '/auth/login-faculty.php',
            ROLE_STUDENT => '/auth/login-student.php',
        ];
        redirect($map[$role] ?? '/index.php');
    }
}

function login_user(string $role, array $row): void
{
    $_SESSION['user'] = [
        'role' => $role,
        'id' => (int) $row['id'],
        'username' => $row['username'],
        'full_name' => $row['full_name'],
        'email' => $row['email'] ?? null,
        'faculty_id' => $row['faculty_id'] ?? null,
        'student_id' => $row['student_id'] ?? null,
        'group_id' => isset($row['group_id']) ? (int) $row['group_id'] : null,
        'is_leader' => (int) ($row['is_leader'] ?? 0),
        'department' => $row['department'] ?? null,
    ];
}

function attempt_login(string $role, string $username, string $password): bool
{
    $username = trim($username);
    if ($username === '' || $password === '') {
        return false;
    }

    if ($role === ROLE_ADMIN) {
        $stmt = db()->prepare('SELECT * FROM admins WHERE username = ? LIMIT 1');
    } elseif ($role === ROLE_FACULTY) {
        $stmt = db()->prepare('SELECT * FROM faculty WHERE username = ? AND is_active = 1 LIMIT 1');
    } else {
        $stmt = db()->prepare('SELECT * FROM students WHERE username = ? AND is_active = 1 LIMIT 1');
    }

    $stmt->execute([$username]);
    $row = $stmt->fetch();
    if (!$row || !password_verify($password, $row['password_hash'])) {
        return false;
    }

    login_user($role, $row);
    log_activity($role, (int) $row['id'], 'login');
    return true;
}

function logout_user(): void
{
    $u = current_user();
    if ($u) {
        log_activity($u['role'], $u['id'], 'logout');
    }
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}

function faculty_can_access_group(int $facultyPk, int $groupId): bool
{
    $stmt = db()->prepare('SELECT 1 FROM group_mentors WHERE faculty_id = ? AND group_id = ?');
    $stmt->execute([$facultyPk, $groupId]);
    return (bool) $stmt->fetch();
}
