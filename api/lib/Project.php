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

require_once('Model.php');

class Project extends Model
{
	const MAX_TITLE_LENGTH = 256;
	const MAX_DESCRIPTION_LENGTH = 16384;

	private $_id;
	private $_ord;
	private $_title;
	private $_description;


	public function getId() { return $this->_id; }
	public function getOrd() { return $this->_ord; }
	public function getTitle() { return $this->_title; }
	public function getDescription() { return $this->_description; }

	public function setTitle($title) { $this->_title = $title; }
	public function setDescription($description) { $this->_description = $description; }

	private function __construct(array $row = null)
	{
		if ($row) {
			$this->_id			= (string)$row["id"];
			$this->_ord			= (int)$row['ord'];
			$this->_title		= (string)$row['title'];
			$this->_description	= (string)$row['description'];
		}
	}

	public static function fetch($projectId)
	{
		$row = self::dbQueryRow("select * from projects where id = ?", array($projectId));
		if (!$row) {
			throw new ObjectNotFoundException("Project with id=$projectId not found");
		}
		return new Project($row);
	}

	public static function create($ord, $title, $description)
	{
		// FIXME:
		$createdBy = 1;

		self::dbExec("insert into projects(ord, title, description, createdBy) values(?, ?, ?, ?)",
			array($ord, $title, $description, $createdBy));
		return self::getLastRowId();
	}

	public static function update($projectId, $title, $description)
	{
		self::dbExec("update projects set title = ?, description = ? where id = ?", array($title, $description, $projectId));
	}

	public static function updateOrd($projectId, $ord)
	{
		self::dbExec("update projects set ord = ? where id = ?", array($ord, $projectId));
	}

	public static function erase($projectId)
	{
		self::dbExec("delete from projects where id = ?", array($projectId));
		self::dbExec("delete from tasks where listId in (select id from lists where projectId = ?)", array($projectId));
		self::dbExec("delete from lists where projectId = ?", array($projectId));
	}

	public static function lock(/* $projectId... */)
	{
		$projectIds = func_get_args();
		self::dbExec("select id from projects where id in ? for update", array($projectIds));
	}

	public static function getNextOrd()
	{
		return self::dbQuerySingle("select ifnull(max(ord), 0) + 1 from projects");
	}
}
