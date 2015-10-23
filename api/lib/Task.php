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

class Task extends Model
{
	const MAX_TITLE_LENGTH = 256;
	const MAX_DESCRIPTION_LENGTH = 4096;

	private $_id;
	private $_listId;
	private $_title;
	private $_description;

	public function getId() { return $this->_id; }
	public function getTitle() { return $this->_title; }
	public function getDescription() { return $this->_description; }

	public function setTitle($title) { $this->_title = $title; }
	public function setDescription($description) { $this->_description = $description; }

	private function __construct()
	{
	}

	public static function fetchForList($listId)
	{
		$rows = self::dbQuery("select * from tasks where listId = ? order by ord", array($listId));
		$tasks = array();
		foreach ($rows as $row) {
			$task = new Task();
			$task->_id = (string)$row['id'];
			$task->_listId = (string)$row['listId'];
			$task->_title = $row['title'];
			$task->_description = $row['description'];
			$tasks[] = $task;
		}
		return $tasks;
	}

	public static function fetch($taskId)
	{
		$row = self::dbQueryRow("select * from tasks where id = ?", array($taskId));

		if (!$row) {
			throw new ObjectNotFoundException("Task with id=$taskId not found");
		}

		$task = new Task();
		$task->_id = (string)$row['id'];
		$task->_listId = (string)$row['listId'];
		$task->_title = $row['title'];
		$task->_description = $row['description'];
		return $task;
	}

	public static function create($title, $description, $listId, $beforeTaskId = null)
	{
		self::dbBeginTransaction();

		$ord = null;
		if ($beforeTaskId === null) {
			$ord = self::dbQuerySingle("select ifnull(max(ord), 0) + 1 from tasks where listId = ?", array($listId));
		}
		else {
			$ord = self::dbQuerySingle("select ord from tasks where id = ?", array($beforeTaskId));
			self::dbExec("update tasks set ord = ord + 1 where listId = ? and ord >= ?", array($listId, $ord));
		}

		// FIXME:
		$createdBy = 1;

		self::dbExec("insert into tasks(listId, title, description, createdBy, ord) values(?, ?, ?, ?, ?)",
			array($listId, $title, $description, $createdBy, $ord));

		self::dbCommitTransaction();

		$task = new Task();
		$task->_id = (string)self::getLastRowId();
		$task->_listId = $listId;
		$task->_title = $title;
		$task->_description = $description;
		return $task;
	}

	public static function save(Task $task)
	{
		self::dbExec("update tasks set title = ?, description = ? where id = ?",
			array($task->_title, $task->_description, $task->_id));
	}

	public static function move($taskId, $newListId, $beforeTaskId = null)
	{
		self::dbBeginTransaction();

		$taskRow = self::dbQueryRow("select * from tasks where id = ?", array($taskId));
		if (!$taskRow) {
			throw new ObjectNotFoundException("Task with id=$taskId not found");
		}

		$oldListId = $taskRow['listId'];
		self::dbExec("update tasks set ord = ord - 1 where listId = ? and ord >= ?", array($oldListId, $taskRow['ord']));

		$ord = null;
		if ($beforeTaskId === null) {
			$ord = self::dbQuerySingle("select ifnull(max(ord), 0) + 1 from tasks where listId = ?", array($newListId));
		}
		else {
			$ord = self::dbQuerySingle("select ord from tasks where id = ?", array($beforeTaskId));
			self::dbExec("update tasks set ord = ord + 1 where listId = ? and ord >= ?", array($newListId, $ord));
		}

		self::dbExec("update tasks set listId = ?, ord = ? where id = ?", array($newListId, $ord, $taskId));

		self::dbCommitTransaction();
	}

	public static function erase($taskId)
	{
		self::dbBeginTransaction();

		$taskRow = self::dbQueryRow("select * from tasks where id = ?", array($taskId));
		if (!$taskRow) {
			throw new ObjectNotFoundException("Task with id=$taskId not found");
		}

		self::dbExec("update tasks set ord = ord - 1 where listId = ? and ord >= ?",
			array($taskRow['listId'], $taskRow['ord']));

		self::dbExec("delete from tasks where id = ?", array($taskId));

		self::dbCommitTransaction();
	}
}
