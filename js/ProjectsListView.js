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

"use strict";

function ProjectsListView()
{
	this._element = document.createElement("div");
	this._element.className = "ProjectsListView";

	this._pageHeader = document.createElement("div");
	this._pageHeader.className = "PageHeader";
	this._element.appendChild(this._pageHeader);

	this._header = document.createElement("h1");
	this._header.innerHTML = "Task Dimension - Projects";
	this._pageHeader.appendChild(this._header);

	this._menuIcon = document.createElement("div");
	this._menuIcon.className = "headerButton menu";
	this._menuIcon.innerHTML = "i";
	this._menuIcon.title = "About";
	this._menuIcon.addEventListener('click', AboutBox.show);
	this._pageHeader.appendChild(this._menuIcon);

	this._container = document.createElement("div");
	this._container.className = "container";
	this._element.appendChild(this._container);

	this._projects = {};

	Request.send("api/project/list.php", {}, function(status, data) {
		if (status == Request.STATUS_SUCCESS) {

			for (var i = 0; i < data.projects.length; i++) {
				var projectData = data.projects[i];
				this._addProject(projectData);
			}

			this._container.addEventListener('contextmenu', this._onWorkspaceContextMenu.bind(this));
			this._container.addEventListener('dragover', this._onWorkspaceDragOver.bind(this));
			this._container.addEventListener('drop', this._onWorkspaceDragDrop.bind(this));
		}
		else {
			var errorBox = document.createElement("div");
			errorBox.className = "errorMessage";
			errorBox.innerHTML = "<h2>" + data.message.htmlEscape() + "</h2>" +
				"<div>" + data.description.htmlEscape() + "</div>";
			this._container.appendChild(errorBox);

			var retryButton = document.createElement("input");
			retryButton.type = "button";
			retryButton.value = "Try Again"
			retryButton.addEventListener('click', View.reload.bind(View));
			errorBox.appendChild(retryButton);
		}
	}.bind(this));
}

ProjectsListView.prototype.show = function()
{
	document.body.innerHTML = "";
	document.body.appendChild(this._element);
	Keyboard.replaceStack(null, null);
}

ProjectsListView.prototype._addProject = function(projectData, insertBeforeElement)
{
	var project = {};
	project.id = projectData.projectId;
	this._projects[project.id] = project;

	project.element = document.createElement("div");
	project.element.id = "project#" + project.id;
	project.element.className = "project";
	project.element.draggable = true;
	project.element.addEventListener('contextmenu', this._onProjectContextMenu.bind(this, project.id));
	project.element.addEventListener('dragstart', this._onDragProjectStart.bind(this, project.id));
	project.element.addEventListener('dragend', this._onDragEnd.bind(this));
	project.element.addEventListener('mousedown', function(event) {
		if (event.target != project.titleElement) {
			event.preventDefault();
			event.stopPropagation();
		}
	});

	project.titleElement = document.createElement("h2");
	project.titleElement.addEventListener('dblclick', this._editProject.bind(this, project.id, 0));
	project.element.appendChild(project.titleElement);

	project.descriptionElement = document.createElement("div");
	project.descriptionElement.addEventListener('dblclick', this._editProject.bind(this, project.id, 1));
	project.element.appendChild(project.descriptionElement);

	project.openIcon = document.createElement("div");
	project.openIcon.className = "headerButton open";
	project.openIcon.innerHTML = "&#9654;";
	project.openIcon.title = "Open";
	project.openIcon.addEventListener('click', View.showProject.bind(View, project.id));
	project.element.appendChild(project.openIcon);

	this._updateProject(project, projectData);

	this._container.insertBefore(project.element, insertBeforeElement);
}

ProjectsListView.prototype._updateProject = function(project, projectData)
{
	project.title = projectData.title;
	project.description = projectData.description;
	project.titleElement.innerHTML = project.title.htmlEscape();
	project.descriptionElement.innerHTML = project.description.htmlEscape();
}

ProjectsListView.prototype._removeProject = function(project)
{
	this._container.removeChild(project.element);
	delete this._projects[project.id];
}

ProjectsListView.prototype._onProjectContextMenu = function(projectId, event)
{
	event.stopPropagation();
	event.preventDefault();
	var project = this._projects[projectId];
	var insertBeforeProject = this._findInsertionPointForProject(event.pageX, event.pageY);
	PopupMenu.show(event.clientX, event.clientY, [
		{title: "Open", callback: View.showProject.bind(View, projectId)},
		{title: "Edit...", callback: this._editProject.bind(this, projectId, 0)},
		{},
		{title: "Delete Project...", callback: this._deleteProject.bind(this, projectId)},
		{},
		{title:"Create Project...", callback: this._createProject.bind(this, insertBeforeProject)}
	]);
}

ProjectsListView.prototype._onWorkspaceContextMenu = function(event)
{
	var insertBeforeProject = this._findInsertionPointForProject(event.pageX, event.pageY);

	PopupMenu.show(event.clientX, event.clientY, [
		{title:"Create Project...", callback: this._createProject.bind(this, insertBeforeProject)}
	]);
}

ProjectsListView.prototype._createProjectPlaceholder = function(referenceElement)
{
	var ph = document.createElement("div");
	ph.className = "project-placeholder";
	if (referenceElement) {
		var style = window.getComputedStyle(referenceElement, null);
		ph.style.width = style.getPropertyValue('width');
		ph.style.height = style.getPropertyValue('height');
	}
	return ph;
}

ProjectsListView.prototype._getProjectIdFromElement = function(element)
{
	var elementId = element && element.id;
	return elementId ? elementId.split('#')[1] : null;
}

ProjectsListView.prototype._findInsertionPointForProject = function(pointerX, pointerY)
{
	var insertBeforeElement = null;
	var minDist = Infinity;

	pointerX += this._container.scrollLeft;
	pointerY += this._container.scrollTop;

	var grid = [];
	var row = null;
	for (var e = this._container.firstChild; e; e = e.nextSibling) {
		if (!row || e.offsetTop > row.y) {
			row = {y: e.offsetTop, cells:[]};
			grid.push(row);
		}
		row.cells.push({x: e.offsetLeft, width: e.offsetWidth, element: e});
	}

	row = null;
	for (var r = grid.length - 1; r > 0; r--) {
		if (grid[r].y < pointerY) {
			row = grid[r];
			break;
		}
	}
	row = row || grid[0];

	var cell = null;
	for (var c = row.cells.length - 1; c > 0; c--) {
		if (row.cells[c].x < pointerX) {
			cell = row.cells[c];
			break;
		}
	}
	cell = cell || row.cells[0];

	var insertBeforeElement	= null;
	if (cell) {
		if (pointerX < cell.x + cell.width/2) {
			insertBeforeElement = cell.element;
		}
		else {
			insertBeforeElement = cell.element.nextSibling;
		}
	}

	while (insertBeforeElement && insertBeforeElement.className != "project") {
		insertBeforeElement = insertBeforeElement.nextSibling;
	}

	return insertBeforeElement;
}

ProjectsListView.prototype._createProject = function(insertBeforeElement)
{
	var ph = this._createProjectPlaceholder(null);
	this._container.insertBefore(ph, insertBeforeElement);

	var editor = new ProjectEditor();

	editor.show(ph, {}, 0, function(projectData) {
		if (!projectData) {
			editor.hide();
			this._container.removeChild(ph);
			return;
		}

		var request = {
			title: projectData.title,
			description: projectData.description,
			beforeProjectId: this._getProjectIdFromElement(insertBeforeElement)
		};
		Request.send("api/project/create.php", request, function(status, result) {
			if (status != Request.STATUS_SUCCESS) return alert(result.message);
			// editor.hide();
			// this._container.removeChild(ph);
			// projectData.projectId = result.projectId;
			// this._addProject(projectData, insertBeforeElement);
			View.showProject(result.projectId);
		}.bind(this));
	}.bind(this));
}

ProjectsListView.prototype._editProject = function(projectId, field)
{
	var project = this._projects[projectId];
	var editor = new ProjectEditor();

	editor.show(project.element, project, field, function(updatedProjectData) {
		if (!updatedProjectData) {
			editor.hide();
			return;
		}

		var request = {
			projectId: projectId,
			title: updatedProjectData.title,
			description: updatedProjectData.description
		};
		Request.send("api/project/update.php", request, function(status, result) {
			if (status != Request.STATUS_SUCCESS) return alert(result.message);

			editor.hide();
			this._updateProject(project, updatedProjectData);
		}.bind(this));
	}.bind(this));
}

ProjectsListView.prototype._deleteProject = function(projectId)
{
	var project = this._projects[projectId];
	var message = "Are you sure you want to delete project " + project.title + "?";

	Alert.show(message, "", ["Delete", "Cancel"], function(buttonIndex) {
		if (buttonIndex === 0) {
			Request.send("api/project/delete.php", {projectId:projectId}, function(status, result) {
				if (status != Request.STATUS_SUCCESS) return alert(result.message);
				this._removeProject(project);
			}.bind(this));
		}
	}.bind(this));
}

ProjectsListView.prototype._onDragProjectStart = function(projectId, event)
{
	console.log("drag proj start");
	var project = this._projects[projectId];
	var nextProjectId = this._getProjectIdFromElement(project.element.nextSibling);
	var ph = this._createProjectPlaceholder(project.element);

	this._dragInfo = {
		placeholder: ph,
		projectId: projectId,
		srcNextProjectId: nextProjectId
	};

	event.dataTransfer.setData("text", project.title);

	setTimeout(function() {
		this._container.insertBefore(ph, project.element);
		this._container.removeChild(project.element);
	}.bind(this), 0);
}

ProjectsListView.prototype._onWorkspaceDragOver = function(event)
{
	if (!this._dragInfo) return;

	if (this._dragInfo.projectId) {
		var insertBeforeElement = this._findInsertionPointForProject(event.pageX, event.pageY);
		var ph = this._dragInfo.placeholder;
		if (ph.nextSibling != insertBeforeElement) {
			this._container.insertBefore(ph, insertBeforeElement);
		}
		event.dataTransfer.dropEffect = "move";
		event.preventDefault();
	}
}

ProjectsListView.prototype._onWorkspaceDragDrop = function(event)
{
	if (!this._dragInfo) return;

	if (this._dragInfo.projectId) {
		var ph = this._dragInfo.placeholder;
		var project = this._projects[this._dragInfo.projectId];
		this._container.insertBefore(project.element, ph);
		this._container.removeChild(ph);
		var nextProjectId = this._getProjectIdFromElement(project.element.nextSibling);
		if (nextProjectId != this._dragInfo.srcNextProjectId) {
			Request.send("api/project/move.php", {projectId: project.id, beforeProjectId: nextProjectId}, function(status, result) {
				if (status != Request.STATUS_SUCCESS) return alert(result.message);
			});
		}
		this._dragInfo = null;
		event.preventDefault();
	}
}

ProjectsListView.prototype._onDragEnd = function(event)
{
	if (!this._dragInfo) return;

	if (this._dragInfo.projectId) {
		var ph = this._dragInfo.placeholder;
		var project = this._projects[this._dragInfo.projectId];
		var srcNextProject = this._dragInfo.srcNextProjectId ? this._projects[this._dragInfo.srcNextProjectId] : null;
		var insertBeforeElement = srcNextProject ? srcNextProject.element : null;

		if (navigator.userAgent.indexOf("Firefox") >= 0) {
			// See note on Firefox d&d cancel in ProjectView._onDragEnd()
			this._container.insertBefore(ph, insertBeforeElement);
			window.setTimeout(function() {
				this._container.removeChild(ph);
				this._container.insertBefore(project.element, insertBeforeElement);
			}.bind(this), 400);
		}
		else {
			this._container.removeChild(ph);
			this._container.insertBefore(project.element, insertBeforeElement);
		}

		this._dragInfo = null;
	}
}
