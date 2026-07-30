@echo off
cd /d "%~dp0"
php -d extension_dir=D:\php-8.5.0\ext -d extension=pdo_sqlite -d extension=sqlite3 database\install.php
php -d extension_dir=D:\php-8.5.0\ext -d extension=pdo_sqlite -d extension=sqlite3 -S localhost:8080 router.php
