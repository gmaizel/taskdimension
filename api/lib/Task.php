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

class Task extends Model
{
	const STATUS_MIN = 0;
	const STATUS_CLOSED = 0;
	const STATUS_OPEN = 1;
	const STATUS_MAX = 1;

	const MAX_TITLE_LENGTH = 256;
	const MAX_DESCRIPTION_LENGTH = 4096;

	private $_id;
	private $_listId;
	private $_ord;
	private $_title;
	private $_description;
	private $_status;

	public function getId() { return $this->_id; }
	public function getListId() { return $this->_listId; }
	public function getOrd() { return $this->_ord; }
	public function getTitle() { return $this->_title; }
	public function getDescription() { return $this->_description; }
	public function getStatus() { return $this->_status; }

	public function setTitle($title) { $this->_title = $title; }
	public function setDescription($description) { $this->_description = $description; }
	public function setStatus($status) { $this->_status = $status; }

	private function __construct(array $row = null)
	{
		if ($row) {
			$this->_id			= (string)$row['id'];
			$this->_listId		= (string)$row['listId'];
			$this->_ord			= (int)$row['ord'];
			$this->_title		= (string)$row['title'];
			$this->_description	= (string)$row['description'];
			$this->_status		= (int)$row['status'];
		}
	}

	public static function fetch($taskId)
	{
		$row = self::dbQueryRow("select * from tasks where id = ?", array($taskId));
		if (!$row) {
			throw new ObjectNotFoundException("Task with id=$taskId not found");
		}
		return new Task($row);
	}

	public static function fetchAllInList($listId)
	{
		$rows = self::dbQuery("select * from tasks where listId = ? order by ord", array($listId));
		$tasks = array();
		foreach ($rows as $row) {
			$tasks[] = new Task($row);
		}
		return $tasks;
	}

	public static function create($listId, $ord, $title, $description)
	{
		// FIXME:
		$createdBy = 1;

		self::dbExec("insert into tasks(listId, ord, title, description, status, createdBy) values(?, ?, ?, ?, ?, ?)",
			array($listId, $ord, $title, $description, self::STATUS_OPEN, $createdBy));
		return self::getLastRowId();
	}

	public static function update($taskId, $title, $description)
	{
		self::dbExec("update tasks set title = ?, description = ? where id = ?", array($title, $description, $taskId));
	}

	public static function updateStatus($taskId, $status)
	{
		self::dbExec("update tasks set status = ? where id = ?", array($status, $taskId));
	}

	public static function updateListAndOrd($taskId, $listId, $ord)
	{
		self::dbExec("update tasks set listId = ?, ord = ? where id = ?", array($listId, $ord, $taskId));
	}

	public static function erase($taskId)
	{
		self::dbExec("delete from tasks where id = ?", array($taskId));
	}

	public static function lock(/* $taskId... */)
	{
		$taskIds = func_get_args();
		self::dbExec("select id from tasks where id in ? for update", array($taskIds));
	}

	public static function getNextOrd($listId)
	{
		return self::dbQuerySingle("select ifnull(max(ord), 0) + 1 from tasks where listId = ?", array($listId));
	}

	public static function shiftRight($listId, $startOrd)
	{
		self::dbExec("update tasks set ord = ord + 1 where listId = ? and ord >= ?", array($listId, $startOrd));
	}

	public static function shiftLeft($listId, $startOrd)
	{
		self::dbExec("update tasks set ord = ord - 1 where listId = ? and ord >= ?", array($listId, $startOrd));
	}

	public static function reorderByStatus($listId)
	{
		$rows = self::dbQuery("select id from tasks where listId = ? order by status desc, ord", array($listId));
		$taskIds = array();
		$ord = 1;
		foreach ($rows as $row) {
			$taskId = (string)$row['id'];
			$taskIds[] = $taskId;
			self::updateListAndOrd($taskId, $listId, $ord);
			$ord++;
		}
		return $taskIds;
	}

	public static function findNextTaskIdAfterLastOpenTask($listId)
	{
		$ord = self::dbQuerySingle("select ord from tasks where listId = ? and status <> ? "
			. "order by ord desc limit 1", array($listId, Task::STATUS_CLOSED));
		if ($ord !== null) {
			return self::dbQuerySingle("select id from tasks where listId = ? and ord = ?", array($listId, $ord + 1));
		}
		return null;
	}
}
