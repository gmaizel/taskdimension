<?php /*
TaskDimension - lightweight project management tool
Copyright (c) 2015 George Maizel <gmaizel@gmail.com>

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License version 3 as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for
more details.

You should have received a copy of the GNU Affero General Public License along
with this program. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*/

require_once(__DIR__ . '/Model.php');

class Project extends Model
{
	const MAX_TITLE_LENGTH = 256;
	const MAX_DESCRIPTION_LENGTH = 16384;

	private $_id;
	private $_title;
	private $_description;

	public function getId() { return $this->_id; }
	public function getTitle() { return $this->_title; }
	public function getDescription() { return $this->_description; }

	private function __construct()
	{
	}

	public static function fetch($projectId)
	{
		$row = self::dbQueryRow("select * from projects where id = ?", array($projectId));

		if (!$row) {
			throw new ObjectNotFoundException("Project with id=$projectId not found");
		}

		$project = new Project();
		$project->_id = (string)$row['id'];
		$project->_title = $row['title'];
		$project->_description = $row['description'];
		return $project;
	}
}
