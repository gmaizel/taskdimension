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

class ListCreate extends EndPoint
{
	const FIELD_PROJECT_ID = "projectId";
	const FIELD_TITLE = "title";
	const FIELD_BEFORE_LIST_ID = "beforeListId";
	const FIELD_LIST_ID = "listId";

	protected function getRequestValidator()
	{
		return new ValidatorObject(array(
			self::FIELD_PROJECT_ID	=> new ValidatorID(),
			self::FIELD_TITLE		=> new ValidatorString(1, TasksList::MAX_TITLE_LENGTH),
			self::FIELD_BEFORE_LIST_ID => new ValidatorOptional(new ValidatorID())
		));
	}

	protected function getResponseValidator()
	{
		return new ValidatorObject(array(
			self::FIELD_LIST_ID	=> new ValidatorID()
		));
	}

	protected function handleRequest(array $request)
	{
		$projectId = $request[self::FIELD_PROJECT_ID];
		$beforeId = $request[self::FIELD_BEFORE_LIST_ID];
		$title = $request[self::FIELD_TITLE];

		Project::lock($projectId);

		$ord = null;
		if ($beforeId) {
			$beforeList = TasksList::fetch($beforeId);
			if ($beforeList->getProjectId() !== $projectId) {
				throw new Exception("Insertion point for a new list is in another project", EndPoint::STATUS_BAD_REQUEST);
			}
			$ord = $beforeList->getOrd();
			TasksList::shiftRight($projectId, $ord);
		}
		else {
			$ord = TasksList::getNextOrd($projectId);
		}

		$listId = TasksList::create($projectId, $ord, $title);

		return array(
			self::FIELD_LIST_ID	=> $listId
		);
	}
}

(new ListCreate())->handle();
