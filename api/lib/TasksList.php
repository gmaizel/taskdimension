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

class TasksList extends Model
{
	const MAX_TITLE_LENGTH = 128;

	private $_id;
	private $_projectId;
	private $_ord;
	private $_title;

	public function getId() { return $this->_id; }
	public function getProjectId() { return $this->_projectId; }
	public function getOrd() { return $this->_ord; }
	public function getTitle() { return $this->_title; }

	public function setTitle($title) { $this->_title = $title; }

	private function __construct(array $row = null)
	{
		if ($row) {
			$this->_id 			= (string)$row['id'];
			$this->_projectId	= (string)$row['projectId'];
			$this->_ord 		= (int)$row['ord'];
			$this->_title		= (string)$row['title'];
		}
	}

	public static function fetch($listId)
	{
		$row = self::dbQueryRow("select * from lists where id = ?", array($listId));
		if (!$row) {
			throw new ObjectNotFoundException("List with id=$listId not found");
		}
		return new TasksList($row);
	}

	public static function fetchAllInProject($projectId)
	{
		$rows = self::dbQuery("select * from lists where projectId = ? order by ord", array($projectId));
		$lists = array();
		foreach ($rows as $row) {
			$lists[] = new TasksList($row);
		}
		return $lists;
	}

	public static function create($projectId, $ord, $title)
	{
		// FIXME:
		$createdBy = 1;

		self::dbExec("insert into lists(projectId, ord, title, createdBy) values(?, ?, ?, ?)",
			array($projectId, $ord, $title, $createdBy));
		return self::getLastRowId();
	}

	public static function update($listId, $title)
	{
		self::dbExec("update lists set title = ? where id = ?", array($title, $listId));
	}

	public static function updateOrd($listId, $ord)
	{
		self::dbExec("update lists set ord = ? where id = ?", array($ord, $listId));
	}

	public static function erase($listId)
	{
		self::dbExec("delete from lists where id = ?", array($listId));
		self::dbExec("delete from tasks where listId = ?", array($listId));
	}

	public static function lock(/* $listId... */)
	{
		$listIds = func_get_args();
		self::dbExec("select id from lists where id in ? for update", array($listIds));
	}

	public static function getNextOrd($projectId)
	{
		return self::dbQuerySingle("select ifnull(max(ord), 0) + 1 from lists where projectId = ?", array($projectId));
	}

	public static function shiftRight($projectId, $startOrd)
	{
		self::dbExec("update lists set ord = ord + 1 where projectId = ? and ord >= ?", array($projectId, $startOrd));
	}

	public static function shiftLeft($projectId, $startOrd)
	{
		self::dbExec("update lists set ord = ord - 1 where projectId = ? and ord >= ?", array($projectId, $startOrd));
	}
}
