<?php
/**
 * ProMent — Student Project Assessment & Mentoring
 * Application configuration
 */

define('APP_NAME', 'ProMent');
define('APP_TAGLINE', 'Student Project Assessment & Mentoring');
define('APP_VERSION', '1.0.0-prototype');
define('APP_URL', ''); // leave empty for relative paths

define('SESSION_NAME', 'proment_session');
define('UPLOAD_DIR', __DIR__ . '/../uploads');
define('MAX_UPLOAD_MB', 10);

// Roles
define('ROLE_ADMIN', 'admin');
define('ROLE_FACULTY', 'faculty');
define('ROLE_STUDENT', 'student');

// Progress milestones (percentage checkpoints)
define('MILESTONES', [
    'proposal'   => 'Project Proposal',
    'srs'        => 'Requirements / SRS',
    'design'     => 'Design & Architecture',
    'prototype'  => 'Working Prototype',
    'testing'    => 'Testing & Validation',
    'final'      => 'Final Submission',
]);

date_default_timezone_set('Asia/Kolkata');

if (session_status() === PHP_SESSION_NONE) {
    session_name(SESSION_NAME);
    session_start();
}
