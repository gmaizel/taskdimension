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

class TaskMove extends EndPoint
{
	const FIELD_TASK_ID = "taskId";
	const FIELD_LIST_ID = "listId";
	const FIELD_BEFORE_TASK_ID = "beforeTaskId";

	protected function getRequestValidator()
	{
		return new ValidatorObject(array(
			self::FIELD_TASK_ID	=> new ValidatorID(),
			self::FIELD_LIST_ID	=> new ValidatorID(),
			self::FIELD_BEFORE_TASK_ID => new ValidatorOptional(new ValidatorID())
		));
	}

	protected function getResponseValidator()
	{
		return new ValidatorNone();
	}

	protected function handleRequest(array $request)
	{
		$taskId = $request[self::FIELD_TASK_ID];
		$dstListId = $request[self::FIELD_LIST_ID];
		$beforeTaskId = $request[self::FIELD_BEFORE_TASK_ID];
		$task = Task::fetch($taskId);
		$srcListId = $task->getListId();

		if ($srcListId !== $dstListId) {
			$srcList = TasksList::fetch($srcListId);
			$dstList = TasksList::fetch($dstListId);
			if ($srcList->getProjectId() !== $dstList->getProjectId()) {
				throw new Exception("Insertion point for a task is in another project list", EndPoint::STATUS_BAD_REQUEST);
			}
		}

		TasksList::lock($srcListId, $dstListId);

		if ($beforeTaskId) {
			Task::shiftLeft($srcListId, $task->getOrd());

			if ($beforeTaskId === $taskId) {
				throw new Exception("Can't move task before itself", EmdPoint::STATUS_BAD_REQUEST);
			}

			$beforeTask = Task::fetch($beforeTaskId);
			if ($beforeTask->getListId() !== $dstListId) {
				throw new Exception("Insertion point for a task is not in destination list", EndPoint::STATUS_BAD_REQUEST);
			}

			Task::shiftRight($dstListId, $beforeTask->getOrd());
			Task::updateListAndOrd($taskId, $dstListId, $beforeTask->getOrd());
		}
		else {
			Task::shiftLeft($srcListId, $task->getOrd());
			Task::updateListAndOrd($taskId, $dstListId, Task::getNextOrd($dstListId));
		}
	}
}

(new TaskMove())->handle();
