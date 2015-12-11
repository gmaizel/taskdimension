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

require_once('../lib/EndPoint.php');
require_once('../lib/Validator.php');
require_once('../lib/TasksList.php');
require_once('../lib/Task.php');

class TaskCreate extends EndPoint
{
	const FIELD_LIST_ID = "listId";
	const FIELD_TITLE = "title";
	const FIELD_DESCRIPTION = "description";
	const FIELD_BEFORE_TASK_ID = "beforeTaskId";
	const FIELD_AFTER_LAST_OPEN = "afterLastOpen";
	const FIELD_TASK_ID = "taskId";

	protected function getRequestValidator()
	{
		return new ValidatorObject(array(
			self::FIELD_LIST_ID	=> new ValidatorID(),
			self::FIELD_TITLE	=> new ValidatorString(1, Task::MAX_TITLE_LENGTH),
			self::FIELD_DESCRIPTION	=> new ValidatorString(0, Task::MAX_DESCRIPTION_LENGTH),
			self::FIELD_BEFORE_TASK_ID => new ValidatorOptional(new ValidatorID()),
			self::FIELD_AFTER_LAST_OPEN => new ValidatorOptional(new ValidatorBoolean())
		));
	}

	protected function getResponseValidator()
	{
		return new ValidatorObject(array(
			self::FIELD_TASK_ID	=> new ValidatorID()
		));
	}

	protected function handleRequest(array $request)
	{
		$listId = $request[self::FIELD_LIST_ID];
		$title = $request[self::FIELD_TITLE];
		$description = $request[self::FIELD_DESCRIPTION];
		$beforeId = $request[self::FIELD_BEFORE_TASK_ID];

		if (isset($request[self::FIELD_AFTER_LAST_OPEN])) {
			if ($request[self::FIELD_AFTER_LAST_OPEN]) {
				$beforeId = Task::findNextTaskIdAfterLastOpenTask($listId);
			}
		}

		TasksList::lock($listId);

		$ord = null;
		if ($beforeId) {
			$beforeTask = Task::fetch($beforeId);
			if ($beforeTask->getListId() !== $listId) {
				throw new Exception("Insertion point for a new task is in another list", EndPoint::STATUS_BAD_REQUEST);
			}
			$ord = $beforeTask->getOrd();
			Task::shiftRight($listId, $ord);
		}
		else {
			$ord = Task::getNextOrd($listId);
		}

		$taskId = Task::create($listId, $ord, $title, $description);

		return array(
			self::FIELD_TASK_ID	=> $taskId
		);
	}
}

(new TaskCreate())->handle();
