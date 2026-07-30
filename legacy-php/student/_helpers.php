<?php
function student_nav(string $active = ''): array
{
    $items = [
        ['href' => '/student/index.php', 'label' => 'Project', 'key' => 'project'],
        ['href' => '/student/progress.php', 'label' => 'Progress', 'key' => 'progress'],
        ['href' => '/student/marks.php', 'label' => 'Marks', 'key' => 'marks'],
        ['href' => '/student/team.php', 'label' => 'Team', 'key' => 'team'],
    ];
    foreach ($items as &$i) {
        $i['active'] = ($i['key'] === $active);
    }
    return $items;
}

function student_context(): array
{
    $user = current_user();
    $group = null;
    $project = null;
    $mentor = null;
    if (!empty($user['group_id'])) {
        $stmt = db()->prepare('SELECT * FROM project_groups WHERE id = ?');
        $stmt->execute([$user['group_id']]);
        $group = $stmt->fetch() ?: null;

        $stmt = db()->prepare('SELECT * FROM projects WHERE group_id = ?');
        $stmt->execute([$user['group_id']]);
        $project = $stmt->fetch() ?: null;

        $stmt = db()->prepare('SELECT f.* FROM faculty f JOIN group_mentors gm ON gm.faculty_id = f.id WHERE gm.group_id = ? AND gm.is_primary = 1 LIMIT 1');
        $stmt->execute([$user['group_id']]);
        $mentor = $stmt->fetch() ?: null;
    }
    return compact('user', 'group', 'project', 'mentor');
}
