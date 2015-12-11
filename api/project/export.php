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

class ProjectExport extends EndPoint
{
	const CURRENT_PROTOCOL_VERSION = 2;

	const FIELD_PROJECT_ID = "projectId";

	const FIELD_PROTOCOL_VERSION = "version";
	const FIELD_TITLE = "title";
	const FIELD_DESCRIPTION = "description";
	const FIELD_TASK_STATUS = "status";
	const FIELD_LISTS = "lists";
	const FIELD_TASKS = "tasks";

	protected function getRequestValidator()
	{
		return new ValidatorObject(array(
			self::FIELD_PROJECT_ID => new ValidatorID()
		));
	}

	protected function getResponseValidator()
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
					self::FIELD_TASK_STATUS => new ValidatorInteger(0)
				)))
			)))
		));
	}

	protected function handleRequest(array $request)
	{
		$projectId = $request[self::FIELD_PROJECT_ID];
		$project = Project::fetch($projectId);

		$lists = TasksList::fetchAllInProject($projectId);
		$listsRep = array();
		foreach ($lists as $list) {
			$tasks = Task::fetchAllInList($list->getId());
			$tasksRep = array();
			foreach ($tasks as $task) {
				$tasksRep[] = array(
					self::FIELD_TITLE	=> $task->getTitle(),
					self::FIELD_DESCRIPTION => $task->getDescription(),
					self::FIELD_TASK_STATUS => $task->getStatus()

				);
			}

			$listsRep[] = array(
				self::FIELD_TITLE	=> $list->getTitle(),
				self::FIELD_TASKS	=> $tasksRep
			);
		}

		return array(
			self::FIELD_PROTOCOL_VERSION => self::CURRENT_PROTOCOL_VERSION,
			self::FIELD_TITLE 		=> $project->getTitle(),
			self::FIELD_DESCRIPTION => $project->getDescription(),
			self::FIELD_LISTS		=> $listsRep,
		);
	}
}

(new ProjectExport())->handle();
