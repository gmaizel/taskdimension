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

class ProjectFetch extends EndPoint
{
	const FIELD_PROJECT_ID = "projectId";

	const FIELD_TITLE = "title";
	const FIELD_DESCRIPTION = "description";
	const FIELD_LISTS = "lists";
	const FIELD_LIST_ID = "listId";
	const FIELD_TASKS = "tasks";
	const FIELD_TASK_ID = "taskId";

	protected function getRequestValidator()
	{
		return new ValidatorObject(array(
			self::FIELD_PROJECT_ID => new ValidatorID()
		));
	}

	protected function getResponseValidator()
	{
		return new ValidatorObject(array(
			self::FIELD_PROJECT_ID		=> new ValidatorID(),
			self::FIELD_TITLE 			=> new ValidatorString(1, Project::MAX_TITLE_LENGTH),
			self::FIELD_DESCRIPTION 	=> new ValidatorString(0, Project::MAX_DESCRIPTION_LENGTH),
			self::FIELD_LISTS			=> new ValidatorArray(new ValidatorObject(array(
				self::FIELD_LIST_ID		=> new ValidatorID(),
				self::FIELD_TITLE		=> new ValidatorString(1, TasksList::MAX_TITLE_LENGTH),
				self::FIELD_TASKS		=> new ValidatorArray(new ValidatorObject(array(
					self::FIELD_TASK_ID	=> new ValidatorID(),
					self::FIELD_TITLE	=> new ValidatorString(1, Task::MAX_TITLE_LENGTH),
					self::FIELD_DESCRIPTION => new ValidatorString(0, Task::MAX_DESCRIPTION_LENGTH)
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
					self::FIELD_TASK_ID	=> $task->getId(),
					self::FIELD_TITLE	=> $task->getTitle(),
					self::FIELD_DESCRIPTION => $task->getDescription()
				);
			}

			$listsRep[] = array(
				self::FIELD_LIST_ID	=> $list->getId(),
				self::FIELD_TITLE	=> $list->getTitle(),
				self::FIELD_TASKS	=> $tasksRep
			);
		}

		return array(
			self::FIELD_PROJECT_ID	=> $project->getId(),
			self::FIELD_TITLE 		=> $project->getTitle(),
			self::FIELD_DESCRIPTION => $project->getDescription(),
			self::FIELD_LISTS		=> $listsRep,
		);
	}
}

(new ProjectFetch())->handle();
