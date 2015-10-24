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

require_once('config.php');

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
		$this->_current = $this->_records->fetch_assoc();
		Model::dbCheckError();
		if (!$this->_current) {
			$this->_records->free();
		}
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
		self::getDB()->query(self::applyQueryParams($query, $params));
		self::dbCheckError();
	}

	protected static function dbQuery($query, array $params = null)
	{
		$result = self::getDB()->query(self::applyQueryParams($query, $params));
		self::dbCheckError();
		return new RecordSet($result);
	}

	protected static function dbQuerySingle($query, array $params = null)
	{
		$result = self::getDB()->query(self::applyQueryParams($query, $params));
		self::dbCheckError();
		$row = $result->fetch_row();
		self::dbCheckError();
		$result->free();
		return ($row && isset($row[0])) ? $row[0] : null;
	}

	protected static function dbQueryRow($query, array $params = null)
	{
		$result = self::getDB()->query(self::applyQueryParams($query, $params));
		self::dbCheckError();
		$row = $result->fetch_assoc();
		self::dbCheckError();
		$result->free();
		return $row;
	}

	protected static function getLastRowId()
	{
		return (string)(self::getDB()->insert_id);
	}

	public static function beginTransaction()
	{
		self::getDB()->begin_transaction();
		self::dbCheckError();
	}

	public static function commitTransaction()
	{
		self::getDB()->commit();
		self::dbCheckError();
	}

	public static function rollbackTransaction()
	{
		self::getDB()->rollback();
		self::dbCheckError();
	}

	private static function getDB()
	{
		if (!self::$_db) {
			self::$_db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE);
			if (self::$_db->connect_error) {
				throw new Exception("SQL connect failed: " . self::$_db->connect_error);
			}
			self::$_db->set_charset("utf8mb4");
			self::dbCheckError();
		}
		return self::$_db;
	}

	public static function dbCheckError()
	{
		if (self::$_db) {
			if (self::$_db->error) {
				throw new Exception("SQL error: " . self::$_db->error);
			}
		}
	}

	private static function applyQueryParams($query, array $params = null)
	{
		$params = $params ?: array();

		$lastIdx = 0;
		foreach ($params as $rawParam) {
			$escapedParam = self::escapeParam($rawParam);
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

	private static function escapeParam($rawParam)
	{
		if (is_null($rawParam)) {
			return "null";
		}
		else if (is_string($rawParam)) {
			return "'" . self::getDB()->escape_string($rawParam) . "'";
		}
		else if (is_numeric($rawParam)) {
			return "$rawParam";
		}
		else if (is_array($rawParam)) {
			$escapedParams = array();
			foreach ($rawParam as $p) {
				$escapedParams[] = self::escapeParam($p);
			}
			return "(" . implode(", ", $escapedParams) . ")";
		}
		else {
			$t = var_export($rawParam, true);
			throw new Exception("Failed to escape SQL param: $t in ``$query``");
		}
	}
}
