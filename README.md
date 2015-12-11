Task Dimension
==============

Lightweight project management tool<br/>
Copyright &copy; 2015 George Maizel<br/>

About
-----

Long story short: I was looking for a task management tool for my hobby projects.
Nothing on the net was good enough for me, so I decided to spend a weekend writing my
own tool. And here it is. There are few features missing (like working with multiple
projects or marking tasks as "Complete"), and I'll probably need to spend another
weekend or two to make it really shine. But right now it's already somewhat playable,
so I think it's time to share it on GitHub.

License
-------

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3 as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for
more details: <https://www.gnu.org/licenses/agpl-3.0.txt>.

Installation
------------

### Prerequisites

* MySQL
* PHP
* Apache or Nginx
* Modern web browser. Latest versions of Chrome or Firefox should be good.

### Database setup

* Create new database and user
* Run sql/schema.sql to populate database tables

### Webserver setup

* Make Task Dimension code accessible through the web server (either copy it to www root or configure an alias).
* copy api/lib/config.example.php to api/lib/config.php and change it to match your database settigs.

Usage
-----

* Right-click anywhere on the workspace and select "Create List..." option	from a context menu to add a list.
* Double-click list title to rename the list.
* Drag and drop lists to change their order.
* Right-click anywhere on a list and select "Add Task..." to add a task.
* Double-click a task to edit its text.
** While editing a task, press Shift+Enter to insert a line break.
* Drag and drop tasks to change their order or move between lists.
* To delete list or task, right click on it and select "Delete List" or "Delete Task" from a menu.

Known issues
------------

* Task editor can sometimes extend beyond the bottom edge of the window.
* window/list content is not automatically scrolled while dragging item
  near its edge, which makes it impossible to move task from the end of
  some long list to its beginning without stopping in the middle and scrolling
  manually.
* Line breaks may be inconsistent between task view and task editor.

Change Log
----------

### version 0.2

* Proper support for multiple projects
	* Added projects list view
		* Create/edit/delete projects
	* Added API for exporting/importing a project (UI will be available later)
	* Display current project name in browser tab/window title

* Added description to tasks

* Added status (Open/Closed) to tasks
	* Option to hide/show Closed tasks (hidden by default)
	* Reorder tasks in list according to status (Open, then Closed)

* Decorate [tags] in task titles

### version 0.1

* Initial version

Contacts
--------

Please send feedback and bug reports to <mailto:gmaizel@gmail.com>.
