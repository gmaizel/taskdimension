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

class ObjectNotFoundException extends Exception
{
	public function __construct($message)
	{
		parent::__construct($message, EndPoint::STATUS_NOT_FOUND);
	}
}

class RecordSet implements Iterator
{
	private $_records;
	private $_index = -1;
	private $_current = null;

	public function __construct($records)
	{
		$this->_records = $records;
		$this->next();
	}

		public function current()
		{
			return $this->_current;
		}

	public function key()
	{
		return $this->_index;
	}

	public function next()
	{
		$this->_index++;
		$this->_current = $this->_records->fetchArray(SQLITE3_ASSOC);
	}

	public function rewind()
	{
		// can't rewind
	}

	public function valid()
	{
		return $this->_current != null;
	}
}

abstract class Model
{
	private static $_db = null;

	protected static function dbExec($query, array $params = null)
	{
		self::getDB()->exec(self::applyQueryParams($query, $params));
	}

	protected static function dbQuery($query, array $params = null)
	{
		$result = self::getDB()->query(self::applyQueryParams($query, $params));
		return new RecordSet($result);
	}

	protected static function dbQuerySingle($query, array $params = null)
	{
		$result = self::getDB()->querySingle(self::applyQueryParams($query, $params));
		return $result;
	}

	protected static function dbQueryRow($query, array $params = null)
	{
		$result = self::getDB()->querySingle(self::applyQueryParams($query, $params), true);
		return $result;
	}

	protected static function getLastRowId()
	{
		return self::getDB()->lastInsertRowID();
	}

	protected static function dbBeginTransaction()
	{
		// FIXME:
	}

	protected static function dbCommitTransaction()
	{
		// FIXME:
	}

	protected static function dbRollbackTransaction()
	{
		// FIXME:
	}

	private static function getDB()
	{
		if (!self::$_db) {
			self::$_db = new SQLite3(__DIR__ . "/../../db/taskdimension.sqlite", SQLITE3_OPEN_READWRITE);
		}
		return self::$_db;
	}

	private static function applyQueryParams($query, array $params = null)
	{
		$params = $params ?: array();

		$lastIdx = 0;
		foreach ($params as $rawParam) {
			$escapedParam = null;
			if (is_null($rawParam)) {
				$escapedParam = "null";
			}
			else if (is_string($rawParam)) {
				$escapedParam = "'" . self::getDB()->escapeString($rawParam) . "'";
			}
			else if (is_numeric($rawParam)) {
				$escapedParam = "$rawParam";
			}
			else {
				$t = var_export($rawParam, true);
				throw new Exception("Failed to escape SQL param: $t in ``$query``");
			}

			$idx = strpos($query, '?', $lastIdx);
			if ($idx === false) {
				throw new Exception("SQL params number mismatch in ``$query``");
			}

			$query = substr($query, 0, $idx) . $escapedParam . substr($query, $idx + 1);
			$lastIdx = $idx + strlen($escapedParam);
		}

		$idx = strpos($query, '?', $lastIdx);
		if ($idx !== false) {
			throw new Exception("SQL params number mismatch in ``$query``");
		}

		return $query;
	}
}
