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

class TasksList extends Model
{
	const MAX_TITLE_LENGTH = 128;

	private $_id;
	private $_projectId;
	private $_title;

	public function getId() { return $this->_id; }
	public function getTitle() { return $this->_title; }

	public function setTitle($title) { $this->_title = $title; }

	private function __construct()
	{
	}

	public static function fetchForProject($projectId)
	{
		$rows = self::dbQuery("select * from lists where projectId = ? order by ord", array($projectId));

		$lists = array();
		foreach ($rows as $row) {
			$list = new TasksList();
			$list->_id = (string)$row['id'];
			$list->_projectId = (string)$row['projectId'];
			$list->_title = $row['title'];
			$lists[] = $list;
		}
		return $lists;
	}

	public static function fetch($listId)
	{
		$row = self::dbQueryRow("select * from lists where id = ?", array($listId));

		if (!$row) {
			throw new ObjectNotFoundException("List with id=$listId not found");
		}

		$list = new TasksList();
		$list->_id = (string)$row['id'];
		$list->_projectId = (string)$row['projectId'];
		$list->_title = $row['title'];
		return $list;
	}

	public static function create($title, $projectId, $beforeListId = null)
	{
		self::dbBeginTransaction();

		$ord = null;
		if ($beforeListId === null) {
			$ord = self::dbQuerySingle("select ifnull(max(ord), 0) + 1 from lists where projectId = ?", array($projectId));
		}
		else {
			$ord = self::dbQuerySingle("select ord from lists where id = ?", array($beforeListId));
			self::dbExec("update lists set ord = ord + 1 where projectId = ? and ord >= ?", array($projectId, $ord));
		}

		// FIXME:
		$createdBy = 1;

		self::dbExec("insert into lists(projectId, title, createdBy, ord) values(?, ?, ?, ?)",
			array($projectId, $title, $createdBy, $ord));

		self::dbCommitTransaction();

		$list = new TasksList();
		$list->_id = (string)self::getLastRowId();
		$list->_projectId = $projectId;
		$list->_title = $title;
		return $list;
	}

	public static function save(TasksList $list)
	{
		self::dbExec("update lists set title = ? where id = ?", array($list->_title, $list->_id));
	}

	public static function move($listId, $beforeListId = null)
	{
		self::dbBeginTransaction();

		$listRow = self::dbQueryRow("select * from lists where id = ?", array($listId));
		if (!$listRow) {
			throw new ObjectNotFoundException("List with id=$listId not found");
		}

		$projectId = $listRow['projectId'];

		self::dbExec("update lists set ord = ord - 1 where projectId = ? and ord >= ?", array($projectId, $listRow['ord']));

		$ord = null;
		if ($beforeListId === null) {
			$ord = self::dbQuerySingle("select ifnull(max(ord), 0) + 1 from lists where projectId = ?", array($projectId));
		}
		else {
			$ord = self::dbQuerySingle("select ord from lists where id = ?", array($beforeListId));
			self::dbExec("update lists set ord = ord + 1 where projectId = ? and ord >= ?", array($projectId, $ord));
		}

		self::dbExec("update lists set ord = ? where id = ?", array($ord, $listId));

		self::dbCommitTransaction();
	}

	public static function erase($listId)
	{
		self::dbBeginTransaction();

		$listRow = self::dbQueryRow("select * from lists where id = ?", array($listId));
		if (!$listRow) {
			throw new ObjectNotFoundException("List with id=$listId not found");
		}

		self::dbExec("update lists set ord = ord - 1 where projectId = ? and ord >= ?",
			array($listRow['projectId'], $listRow['ord']));

		self::dbExec("delete from lists where id = ?", array($listId));
		self::dbExec("delete from tasks where listId = ?", array($listId));

		self::dbCommitTransaction();
	}
}
