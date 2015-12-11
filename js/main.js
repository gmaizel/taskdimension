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

var View = {};

View.showProject = function(projectId)
{
	history.pushState(null, null, "#projectId=" + projectId);
	View._onHashChange();
}

View.showProjectsList = function()
{
	history.pushState(null, null, "#");
	View._onHashChange();
}

View.reload = function()
{
	View._onHashChange();
}

View.setTitle = function(title)
{
	document.title = title;
}

View._onHashChange = function()
{
	var params = document.location.hash.replace(/^#\??/, '').split('&');
	var paramsMap = {};
	for (var i = 0; i < params.length; i++) {
		var idx = params[i].indexOf('=');
		if (idx <= 0) {
			continue;
		}
		var key = params[i].substr(0, idx);
		if (!/^[a-zA-Z]+$/.test(key)) {
			continue;
		}
		var value = decodeURIComponent(params[i].substr(idx + 1));
		paramsMap[key] = value;
	}

	if ('projectId' in paramsMap) {
		var view = new ProjectView(paramsMap['projectId']);
	}
	else {
		var view = new ProjectsListView();
	}

	Keyboard.replaceStack(null, null);
	document.body.innerHTML = "";
	document.body.appendChild(view._element);
}

function main()
{
	window.addEventListener("hashchange", View._onHashChange.bind(View));
	View._onHashChange();
}
