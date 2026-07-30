<?php
function admin_nav(string $active = ''): array
{
    $items = [
        ['href' => '/admin/index.php', 'label' => 'Overview', 'key' => 'dash'],
        ['href' => '/admin/groups.php', 'label' => 'Groups', 'key' => 'groups'],
        ['href' => '/admin/faculty.php', 'label' => 'Faculty', 'key' => 'faculty'],
        ['href' => '/admin/students.php', 'label' => 'Students', 'key' => 'students'],
        ['href' => '/admin/assign.php', 'label' => 'Assign Mentors', 'key' => 'assign'],
        ['href' => '/admin/reports.php', 'label' => 'Reports', 'key' => 'reports'],
    ];
    foreach ($items as &$i) {
        $i['active'] = ($i['key'] === $active);
    }
    return $items;
}
