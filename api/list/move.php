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

class ListMove extends EndPoint
{
	const FIELD_LIST_ID = "listId";
	const FIELD_BEFORE_LIST_ID = "beforeListId";

	protected function getRequestValidator()
	{
		return new ValidatorObject(array(
			self::FIELD_LIST_ID	=> new ValidatorID(),
			self::FIELD_BEFORE_LIST_ID => new ValidatorOptional(new ValidatorID())
		));
	}

	protected function getResponseValidator()
	{
		return new ValidatorNone();
	}

	protected function handleRequest(array $request)
	{
		$listId = $request[self::FIELD_LIST_ID];
		$beforeListId = $request[self::FIELD_BEFORE_LIST_ID];

		TasksList::move($listId, $beforeListId);
	}
}

(new ListMove())->handle();
