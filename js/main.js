/*
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

// prevent unwanted context menus
document.addEventListener('contextmenu', function(evt) { evt.preventDefault(); });

function main()
{
	Request.send("api/project/fetch.php", {"projectId" : "1"}, function(status, data) {
		if (status != Request.STATUS_SUCCESS) return alert(data.message);

		var pView = new ProjectView(data);
		document.body.innerHTML = "";
		document.body.appendChild(pView.getDOM());
	});
}
