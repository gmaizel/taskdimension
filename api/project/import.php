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
require_once('../lib/Project.php');
require_once('../lib/TasksList.php');
require_once('../lib/Task.php');

class ProjectImport extends EndPoint
{
	const FIELD_PROTOCOL_VERSION = "version";
	const FIELD_TITLE = "title";
	const FIELD_DESCRIPTION = "description";
	const FIELD_TASK_STATUS = "status";
	const FIELD_LISTS = "lists";
	const FIELD_TASKS = "tasks";

	const FIELD_PROJECT_ID = "projectId";

	protected function getRequestValidator()
	{
		return new ValidatorObject(array(
			self::FIELD_PROTOCOL_VERSION => new ValidatorInteger(1),
			self::FIELD_TITLE 			=> new ValidatorString(1, Project::MAX_TITLE_LENGTH),
			self::FIELD_DESCRIPTION 	=> new ValidatorString(0, Project::MAX_DESCRIPTION_LENGTH),
			self::FIELD_LISTS			=> new ValidatorArray(new ValidatorObject(array(
				self::FIELD_TITLE		=> new ValidatorString(1, TasksList::MAX_TITLE_LENGTH),
				self::FIELD_TASKS		=> new ValidatorArray(new ValidatorObject(array(
					self::FIELD_TITLE	=> new ValidatorString(1, Task::MAX_TITLE_LENGTH),
					self::FIELD_DESCRIPTION => new ValidatorString(0, Task::MAX_DESCRIPTION_LENGTH),
					self::FIELD_TASK_STATUS => new ValidatorOptional(new ValidatorInteger(0))
				)))
			)))
		));
	}

	protected function getResponseValidator()
	{
		return new ValidatorObject(array(
			self::FIELD_PROJECT_ID => new ValidatorID()
		));
	}

	protected function handleRequest(array $request)
	{
		$version = $request[self::FIELD_PROTOCOL_VERSION];
		$projectTitle = $request[self::FIELD_TITLE];
		$projectDescription = $request[self::FIELD_DESCRIPTION];
		$projectId = Project::create(Project::getNextOrd(), $projectTitle, $projectDescription);

		$listsRep = $request[self::FIELD_LISTS];
		$listOrd = 0;
		foreach ($listsRep as $listRep) {
			$listTitle = $listRep[self::FIELD_TITLE];
			$listId = TasksList::create($projectId, ++$listOrd, $listTitle);
			$tasksRep = $listRep[self::FIELD_TASKS];
			$taskOrd = 0;
			foreach ($tasksRep as $taskRep) {
				$taskTitle = $taskRep[self::FIELD_TITLE];
				$taskDescription = $taskRep[self::FIELD_DESCRIPTION];
				$taskId = Task::create($listId, ++$taskOrd, $taskTitle, $taskDescription);
				if ($version > 1) {
					$taskStatus = $taskRep[self::FIELD_TASK_STATUS];
					Task::updateStatus($taskId, $taskStatus);
				}
			}
		}

		return array(
			self::FIELD_PROJECT_ID => $projectId
		);
	}
}

(new ProjectImport())->handle();
