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

class ProjectCreate extends EndPoint
{
	const FIELD_TITLE = "title";
	const FIELD_DESCRIPTION = "description";
	const FIELD_BEFORE_PROJECT_ID = "beforeProjectId";
	const FIELD_PROJECT_ID = "projectId";

	protected function getRequestValidator()
	{
		return new ValidatorObject(array(
			self::FIELD_TITLE		=> new ValidatorString(1, Project::MAX_TITLE_LENGTH),
			self::FIELD_DESCRIPTION	=> new ValidatorString(0, Project::MAX_DESCRIPTION_LENGTH),
			self::FIELD_BEFORE_PROJECT_ID => new ValidatorOptional(new ValidatorID())
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
		$beforeId = $request[self::FIELD_BEFORE_PROJECT_ID];
		$title = $request[self::FIELD_TITLE];
		$description = $request[self::FIELD_DESCRIPTION];

		// FIXME: Global::lock();

		$ord = null;
		if ($beforeId) {
			$beforeProject = Project::fetch($beforeId);
			$ord = $beforeProject->getOrd();
			Project::shiftRight($ord);
		}
		else {
			$ord = Project::getNextOrd();
		}

		$projectId = Project::create($ord, $title, $description);

		return array(
			self::FIELD_PROJECT_ID	=> $projectId
		);
	}
}

(new ProjectCreate())->handle();
