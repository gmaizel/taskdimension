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

class ProjectDelete extends EndPoint
{
	const FIELD_PROJECT_ID = "projectId";

	protected function getRequestValidator()
	{
		return new ValidatorObject(array(
			self::FIELD_PROJECT_ID	=> new ValidatorID()
		));
	}

	protected function getResponseValidator()
	{
		return new ValidatorNone();
	}

	protected function handleRequest(array $request)
	{
		$projectId = $request[self::FIELD_PROJECT_ID];
		$project = Project::fetch($projectId);

		// FIXME: global::lock()

		Project::erase($projectId);
		Project::shiftLeft($project->getOrd());
	}
}

(new ProjectDelete())->handle();
