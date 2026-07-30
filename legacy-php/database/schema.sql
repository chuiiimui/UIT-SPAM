-- ProMent Database Schema
-- Compatible with SQLite (prototype) and MySQL 8+ (production)
-- For MySQL: change AUTOINCREMENT -> AUTO_INCREMENT, TEXT -> appropriate types

CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faculty (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    faculty_id TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    department TEXT,
    phone TEXT,
    designation TEXT DEFAULT 'Assistant Professor',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_code TEXT NOT NULL UNIQUE,
    group_name TEXT,
    academic_year TEXT,
    semester TEXT,
    department TEXT,
    status TEXT DEFAULT 'pending', -- pending | active | completed | archived
    is_temporary INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    department TEXT,
    enrollment_no TEXT,
    group_id INTEGER,
    is_leader INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES project_groups(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS group_mentors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    faculty_id INTEGER NOT NULL,
    assigned_by INTEGER,
    assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
    is_primary INTEGER DEFAULT 1,
    UNIQUE(group_id, faculty_id),
    FOREIGN KEY (group_id) REFERENCES project_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES admins(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL UNIQUE,
    title TEXT NOT NULL,
    abstract TEXT,
    domain TEXT,
    tech_stack TEXT,
    objectives TEXT,
    status TEXT DEFAULT 'draft', -- draft | submitted | under_review | approved | revision
    submitted_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES project_groups(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS progress_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    student_id INTEGER,
    milestone TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    percentage INTEGER DEFAULT 0,
    attachment_path TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    faculty_id INTEGER NOT NULL,
    student_id INTEGER, -- NULL = whole group mark
    milestone TEXT,
    marks REAL NOT NULL,
    max_marks REAL DEFAULT 10,
    contribution_note TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES project_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    faculty_id INTEGER NOT NULL,
    student_id INTEGER, -- NULL = whole group comment
    progress_id INTEGER,
    body TEXT NOT NULL,
    is_flagged INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES project_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
    FOREIGN KEY (progress_id) REFERENCES progress_updates(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_role TEXT,
    actor_id INTEGER,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    meta TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_students_group ON students(group_id);
CREATE INDEX IF NOT EXISTS idx_mentors_faculty ON group_mentors(faculty_id);
CREATE INDEX IF NOT EXISTS idx_mentors_group ON group_mentors(group_id);
CREATE INDEX IF NOT EXISTS idx_assessments_group ON assessments(group_id);
CREATE INDEX IF NOT EXISTS idx_comments_group ON comments(group_id);
