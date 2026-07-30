<?php
/**
 * Bootstrap database + seed demo data
 * Run once: php database/install.php
 */

require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../config/database.php';

$pdo = db();
$schema = file_get_contents(__DIR__ . '/schema.sql');

// Split and execute (SQLite handles multi-statement via exec)
$pdo->exec($schema);

// Clear existing demo data for re-install
$tables = ['activity_log','comments','assessments','progress_updates','projects','group_mentors','students','project_groups','faculty','admins'];
foreach ($tables as $t) {
    $pdo->exec("DELETE FROM $t");
}

$pass = password_hash('password123', PASSWORD_DEFAULT);

// Admin
$pdo->prepare('INSERT INTO admins (username, password_hash, full_name, email) VALUES (?,?,?,?)')
    ->execute(['principal', $pass, 'Dr. Asha Mehra', 'principal@uit.edu']);

// Faculty
$faculties = [
    ['FAC001', 'faculty1', 'Prof. Rajesh Kumar', 'rajesh@uit.edu', 'Computer Science', 'Associate Professor'],
    ['FAC002', 'faculty2', 'Prof. Priya Sharma', 'priya@uit.edu', 'Information Technology', 'Assistant Professor'],
    ['FAC003', 'faculty3', 'Prof. Amit Verma', 'amit@uit.edu', 'Computer Science', 'Professor'],
];
$facStmt = $pdo->prepare('INSERT INTO faculty (faculty_id, username, password_hash, full_name, email, department, designation) VALUES (?,?,?,?,?,?,?)');
foreach ($faculties as $f) {
    $facStmt->execute([$f[0], $f[1], $pass, $f[2], $f[3], $f[4], $f[5]]);
}

// Groups
$groups = [
    ['GRP-2026-001', 'CodeCrafters', '2025-26', 'VIII', 'Computer Science', 'active', 0],
    ['GRP-2026-002', 'DataNest', '2025-26', 'VIII', 'Information Technology', 'active', 0],
    ['GRP-2026-003', 'NovaLabs', '2025-26', 'VIII', 'Computer Science', 'pending', 1],
];
$gStmt = $pdo->prepare('INSERT INTO project_groups (group_code, group_name, academic_year, semester, department, status, is_temporary) VALUES (?,?,?,?,?,?,?)');
foreach ($groups as $g) {
    $gStmt->execute($g);
}

// Students
$students = [
    ['STU001', 'stu_lead1', 'Ananya Gupta', 'ananya@student.uit.edu', 'Computer Science', 'ENR21001', 1, 1],
    ['STU002', 'stu_mem1', 'Rohan Patel', 'rohan@student.uit.edu', 'Computer Science', 'ENR21002', 1, 0],
    ['STU003', 'stu_mem2', 'Sneha Iyer', 'sneha@student.uit.edu', 'Computer Science', 'ENR21003', 1, 0],
    ['STU004', 'stu_lead2', 'Kabir Singh', 'kabir@student.uit.edu', 'Information Technology', 'ENR21011', 2, 1],
    ['STU005', 'stu_mem3', 'Meera Joshi', 'meera@student.uit.edu', 'Information Technology', 'ENR21012', 2, 0],
    ['STU006', 'stu_lead3', 'Arjun Nair', 'arjun@student.uit.edu', 'Computer Science', 'ENR21021', 3, 1],
    ['STU007', 'stu_mem4', 'Diya Kapoor', 'diya@student.uit.edu', 'Computer Science', 'ENR21022', 3, 0],
];
$sStmt = $pdo->prepare('INSERT INTO students (student_id, username, password_hash, full_name, email, department, enrollment_no, group_id, is_leader) VALUES (?,?,?,?,?,?,?,?,?)');
foreach ($students as $s) {
    $sStmt->execute([$s[0], $s[1], $pass, $s[2], $s[3], $s[4], $s[5], $s[6], $s[7]]);
}

// Mentors (admin assigns faculty to groups 1 and 2)
$mStmt = $pdo->prepare('INSERT INTO group_mentors (group_id, faculty_id, assigned_by, is_primary) VALUES (?,?,?,?)');
$mStmt->execute([1, 1, 1, 1]);
$mStmt->execute([2, 2, 1, 1]);
$mStmt->execute([2, 1, 1, 0]); // secondary mentor demo

// Projects
$pStmt = $pdo->prepare('INSERT INTO projects (group_id, title, abstract, domain, tech_stack, objectives, status, submitted_at) VALUES (?,?,?,?,?,?,?,?)');
$pStmt->execute([
    1,
    'AI-Powered Campus Attendance System',
    'A facial recognition based attendance system integrated with college ERP.',
    'Artificial Intelligence',
    'Python, OpenCV, Flutter, Firebase',
    'Automate attendance; reduce proxy; real-time dashboards for faculty.',
    'under_review',
    date('Y-m-d H:i:s'),
]);
$pStmt->execute([
    2,
    'Smart Library Resource Predictor',
    'ML model to predict book demand and optimize library inventory.',
    'Machine Learning',
    'Python, scikit-learn, React, MySQL',
    'Forecast demand; recommend purchases; student wait-list insights.',
    'approved',
    date('Y-m-d H:i:s'),
]);

// Progress
$prStmt = $pdo->prepare('INSERT INTO progress_updates (project_id, student_id, milestone, title, description, percentage) VALUES (?,?,?,?,?,?)');
$prStmt->execute([1, 1, 'proposal', 'Proposal submitted', 'Initial proposal with literature survey.', 20]);
$prStmt->execute([1, 2, 'srs', 'SRS draft v1', 'Use cases and functional requirements documented.', 40]);
$prStmt->execute([2, 4, 'design', 'Architecture complete', 'System design and ER diagrams finalized.', 55]);
$prStmt->execute([2, 5, 'prototype', 'MVP demo ready', 'Core prediction pipeline working on sample data.', 70]);

// Assessments
$aStmt = $pdo->prepare('INSERT INTO assessments (group_id, faculty_id, student_id, milestone, marks, max_marks, contribution_note) VALUES (?,?,?,?,?,?,?)');
$aStmt->execute([1, 1, 1, 'proposal', 8.5, 10, 'Strong problem statement and clear scope.']);
$aStmt->execute([1, 1, 2, 'srs', 7.0, 10, 'Good documentation; needs tighter non-functional reqs.']);
$aStmt->execute([1, 1, null, 'proposal', 8.0, 10, 'Group proposal accepted with minor revisions.']);
$aStmt->execute([2, 2, 4, 'design', 9.0, 10, 'Excellent architecture and modularity.']);
$aStmt->execute([2, 2, 5, 'prototype', 8.5, 10, 'Solid MVP; improve error handling.']);

// Comments
$cStmt = $pdo->prepare('INSERT INTO comments (group_id, faculty_id, student_id, progress_id, body, is_flagged) VALUES (?,?,?,?,?,?)');
$cStmt->execute([1, 1, null, 1, 'Please refine the dataset collection plan before next review.', 0]);
$cStmt->execute([1, 1, 2, 2, 'Add sequence diagrams for the attendance flow.', 0]);
$cStmt->execute([2, 2, null, null, 'Great pace. Schedule mid-term demo next week.', 0]);

echo "ProMent database installed successfully.\n";
echo "----------------------------------------\n";
echo "Demo credentials (password for all: password123)\n";
echo "  Admin:    principal\n";
echo "  Faculty:  faculty1 / faculty2 / faculty3\n";
echo "  Student:  stu_lead1 / stu_mem1 / stu_lead2 / stu_lead3\n";
echo "----------------------------------------\n";
