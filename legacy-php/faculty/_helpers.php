<?php
function faculty_nav(string $active = ''): array
{
    $items = [
        ['href' => '/faculty/index.php', 'label' => 'Dashboard', 'key' => 'dash'],
        ['href' => '/faculty/groups.php', 'label' => 'My Groups', 'key' => 'groups'],
        ['href' => '/faculty/assess.php', 'label' => 'Assess', 'key' => 'assess'],
        ['href' => '/faculty/comments.php', 'label' => 'Comments', 'key' => 'comments'],
    ];
    foreach ($items as &$i) {
        $i['active'] = ($i['key'] === $active);
    }
    return $items;
}

function faculty_groups(int $facultyPk): array
{
    $stmt = db()->prepare('SELECT g.*, gm.is_primary, p.title AS project_title, p.status AS project_status
        FROM group_mentors gm
        JOIN project_groups g ON g.id = gm.group_id
        LEFT JOIN projects p ON p.group_id = g.id
        WHERE gm.faculty_id = ?
        ORDER BY g.group_code');
    $stmt->execute([$facultyPk]);
    return $stmt->fetchAll();
}
