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

class Log
{
	const LEVEL_TRACE = 0;
	const LEVEL_DEBUG = 1;
	const LEVEL_INFO = 2;
	const LEVEL_WARNING = 3;
	const LEVEL_ERROR = 4;

	public static function trace($message) { self::message(self::LEVEL_TRACE, $message); }
	public static function debug($message) { self::message(self::LEVEL_DEBUG, $message); }
	public static function info($message) { self::message(self::LEVEL_INFO, $message); }
	public static function warning($message) { self::message(self::LEVEL_WARNING, $message); }
	public static function error($message) { self::message(self::LEVEL_ERROR, $message); }

	public static function message($level, $message)
	{
		if (LOG_FILE_NAME != null && $level >= LOG_LEVEL) {
			$levelNames = array("T", "D", "I", "W", "E");
			$level = max(0, min($level, count($levelNames) - 1));

			$formattedMessage = $levelNames[$level] . "/" . date("Y-m-d H:i:s") . ": " . $message . "\n";
			file_put_contents(LOG_FILE_NAME, $formattedMessage, FILE_APPEND | LOCK_EX);
		}
	}
}
