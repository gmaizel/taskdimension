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

function ProjectView(projectData)
{
	this._projectId = projectData.projectId;

	this._container = document.createElement("div");
	this._container.className = "ProjectView";
	this._container.addEventListener('contextmenu', this._onWorkspaceContextMenu.bind(this));
	this._container.addEventListener('dragover', this._onWorkspaceDragOver.bind(this));
	this._container.addEventListener('drop', this._onWorkspaceDragDrop.bind(this));

	this._header = document.createElement("h1");
	this._header.innerHTML = projectData.title.htmlEscape();
	this._header.title = projectData.description;
	this._container.appendChild(this._header);

	this._lists = {};
	this._tasks = {};

	for (var i = 0; i < projectData.lists.length; i++) {
		var listData = projectData.lists[i];
		this._addList(listData);
	}
}

ProjectView.prototype.getDOM = function()
{
	return this._container;
}

ProjectView.prototype._addList = function(listData, insertBeforeElement)
{
	var list = {};
	list.id = listData.listId;
	this._lists[list.id] = list;

	list.element = document.createElement("div");
	list.element.id = "list#" + list.id;
	list.element.className = "list";
	list.element.draggable = true;
	list.element.addEventListener('contextmenu', this._onListContextMenu.bind(this, list.id));
	list.element.addEventListener('dragstart', this._onDragListStart.bind(this, list.id));
	list.element.addEventListener('dragend', this._onDragEnd.bind(this));
	list.element.addEventListener('mousedown', function(event) {
		if (event.target != list.titleElement) {
			event.preventDefault();
			event.stopPropagation();
		}
	});

	list.titleElement = document.createElement("h2");
	list.titleElement.addEventListener('dblclick', this._editList.bind(this, list.id));
	list.element.appendChild(list.titleElement);

	this._updateList(list, listData);

	this._container.insertBefore(list.element, insertBeforeElement);

	if (listData.tasks) {
		for (var j = 0; j < listData.tasks.length; j++) {
			var taskData = listData.tasks[j];
			this._addTask(list, taskData);
		}
	}
}

ProjectView.prototype._updateList = function(list, listData)
{
	list.title = listData.title;
	list.titleElement.innerHTML = list.title.htmlEscape();
}

ProjectView.prototype._removeList = function(list)
{
	this._container.removeChild(list.element);
	delete this._lists[list.id];
}

ProjectView.prototype._addTask = function(list, taskData, insertBeforeElement)
{
	var task = {};
	task.id = taskData.taskId;
	this._tasks[task.id] = task;

	task.element = document.createElement("div");
	task.element.id = "task#" + task.id;
	task.element.className = "task";
	task.element.draggable = true;
	task.element.addEventListener('contextmenu', this._onTaskContextMenu.bind(this, task.id));
	task.element.addEventListener('dblclick', this._editTask.bind(this, task.id));
	task.element.addEventListener('dragstart', this._onDragTaskStart.bind(this, task.id));
	task.element.addEventListener('dragend', this._onDragEnd.bind(this));
	task.element.addEventListener('mousedown', function(event) {
		event.stopPropagation();
	});


	this._updateTask(task, taskData);

	list.element.insertBefore(task.element, insertBeforeElement);
}

ProjectView.prototype._updateTask = function(task, taskData)
{
	task.title = taskData.title;
	task.description = taskData.description;
	task.element.innerHTML = task.title.htmlEscape();
	task.element.title = task.description;
}

ProjectView.prototype._removeTask = function(task)
{
	task.element.parentNode.removeChild(task.element);
	delete this._tasks[task.id];
}

// === Context menu handlers ===

ProjectView.prototype._onWorkspaceContextMenu = function(event)
{
	event.stopPropagation();
	event.preventDefault();
	var insertBeforeList = this._findInsertionPointForList(event.pageX);
	PopupMenu.show(event.clientX, event.clientY, [
		{title:"Create List...", callback: this._createList.bind(this, insertBeforeList)}
	]);
}

ProjectView.prototype._onListContextMenu = function(listId, event)
{
	event.stopPropagation();
	event.preventDefault();
	var list = this._lists[listId];
	var insertBeforeList = this._findInsertionPointForList(event.pageX);
	var insertBeforeTask = this._findInsertionPointForTask(list, event.pageY);
	PopupMenu.show(event.clientX, event.clientY, [
		{title:"Add Task...", callback: this._createTask.bind(this, listId, insertBeforeTask)},
		{},
		{title:"Rename List...", callback: this._editList.bind(this, listId)},
		{title:"Delete List", callback: this._deleteList.bind(this, listId)},
		{},
		{title:"Create List...", callback: this._createList.bind(this, insertBeforeList)}
	]);
}

ProjectView.prototype._onTaskContextMenu = function(taskId, event)
{
	event.stopPropagation();
	event.preventDefault();
	var task = this._tasks[taskId];
	var listId = this._getListIdFromElement(task.element.parentNode);
	var list = this._lists[listId];
	var insertBeforeList = this._findInsertionPointForList(event.pageX);
	var insertBeforeTask = this._findInsertionPointForTask(list, event.pageY);

	PopupMenu.show(event.clientX, event.clientY, [
		{title:"Edit Task...", callback: this._editTask.bind(this, taskId)},
		{title:"Delete Task", callback: this._deleteTask.bind(this, taskId)},
		{},
		{title:"Add Task...", callback: this._createTask.bind(this, listId, insertBeforeTask)},
		{},
		{title:"Rename List...", callback: this._editList.bind(this, listId)},
		{title:"Delete List", callback: this._deleteList.bind(this, listId)},
		{},
		{title:"Create List...", callback: this._createList.bind(this, insertBeforeList)}
	]);
}

// === List CRUD operations ===

ProjectView.prototype._createListPlaceholder = function(referenceElement)
{
	var ph = document.createElement("div");
	ph.id = "list#ph";
	ph.className = "list-placeholder";
	if (referenceElement) {
		var style = window.getComputedStyle(referenceElement, null);
		ph.style.width = style.getPropertyValue('width');
		ph.style.height = style.getPropertyValue('height');
	}
	return ph;
}

ProjectView.prototype._findListPlaceholder = function()
{
	return document.getElementById("list#ph");
}

ProjectView.prototype._getListIdFromElement = function(element)
{
	return element ? element.id.split('#')[1] : null;
}

ProjectView.prototype._findInsertionPointForList = function(pointerX)
{
	var insertBeforeElement = null;
	var minDist = Infinity;

	pointerX += this._container.scrollLeft;

	for (var e = this._container.firstChild; e; e = e.nextSibling) {
		if (e.className != "list") continue;

		var distLeft = Math.abs(e.offsetLeft - pointerX);
		if (distLeft < minDist) {
			insertBeforeElement = e;
			minDist = distLeft;
		}

		var distRight = Math.abs(e.offsetLeft + e.offsetWidth - pointerX);
		if (distRight < minDist) {
			insertBeforeElement = e.nextSibling;
			minDist = distRight;
		}
	}

	while (insertBeforeElement && insertBeforeElement.className != "list") {
		insertBeforeElement = insertBeforeElement.nextSibling;
	}

	return insertBeforeElement;
}

ProjectView.prototype._findNearestList = function(pointerX)
{
	var listElement = null;
	var minDist = Infinity;

	pointerX += this._container.scrollLeft;

	for (var e = this._container.firstChild; e && minDist != 0; e = e.nextSibling) {
		if (e.className != "list") continue;

		var dist = 0;
		if (pointerX < e.offsetLeft) {
			dist = e.offsetLeft - pointerX;
		}
		else if (pointerX > e.offsetLeft + e.offsetWidth) {
			dist = pointerX - e.offsetLeft + e.offsetWidth;
		}

		if (dist < minDist) {
			listElement = e;
			minDist = dist;
		}
	}

	return listElement ? this._lists[this._getListIdFromElement(listElement)] : null;
}

ProjectView.prototype._createList = function(insertBeforeElement)
{
	var ph = this._createListPlaceholder(null);
	this._container.insertBefore(ph, insertBeforeElement);
	var editor = new ListEditor();

	editor.show(ph, {}, function(listData) {
		if (!listData) {
			editor.hide();
			this._container.removeChild(ph);
			return;
		}

		var request = {
			projectId: this._projectId,
			title: listData.title,
			beforeListId: this._getListIdFromElement(insertBeforeElement)
		};
		Request.send("api/list/create.php", request, function(status, result) {
			if (status != Request.STATUS_SUCCESS) return alert(result.message);

			editor.hide();
			this._container.removeChild(ph);
			listData.listId = result.listId;
			this._addList(listData, insertBeforeElement);
		}.bind(this));
	}.bind(this));
}

ProjectView.prototype._editList = function(listId)
{
	var list = this._lists[listId];
	var editor = new ListEditor();

	editor.show(list.element, list, function(updatedListData) {
		if (!updatedListData) {
			editor.hide();
			return;
		}

		var request = {
			listId: listId,
			title: updatedListData.title
		};
		Request.send("api/list/update.php", request, function(status, result) {
			if (status != Request.STATUS_SUCCESS) return alert(result.message);
			editor.hide();
			this._updateList(list, updatedListData);
		}.bind(this));
	}.bind(this));
}

ProjectView.prototype._deleteList = function(listId)
{
	var list = this._lists[listId];
	var message = "Are you sure you want to delete list " + list.title + "?";

	Confirm.show(message, ["Delete", "Cancel"], function(buttonIndex) {
		if (buttonIndex === 0) {
			Request.send("api/list/delete.php", {listId:listId}, function(status, result) {
				if (status != Request.STATUS_SUCCESS) return alert(result.message);
				this._removeList(list);
			}.bind(this));
		}
	}.bind(this));
}

// === Task CRUD operations ===

ProjectView.prototype._createTaskPlaceholder = function(referenceElement)
{
	var ph = document.createElement("div");
	ph.id = "task#ph";
	ph.className = "task-placeholder";
	if (referenceElement) {
		var style = window.getComputedStyle(referenceElement, null);
		ph.style.width = style.getPropertyValue('width');
		ph.style.height = style.getPropertyValue('height');
	}
	return ph;
}

ProjectView.prototype._findTaskPlaceholder = function()
{
	return document.getElementById("task#ph");
}

ProjectView.prototype._getTaskIdFromElement = function(element)
{
	return element ? element.id.split('#')[1] : null;
}

ProjectView.prototype._findInsertionPointForTask = function(list, pointerY)
{
	var insertBeforeElement = null;
	var minDist = Infinity;

	pointerY -= list.element.offsetTop;
	pointerY += list.element.scrollTop;

	for (var e = list.element.firstChild; e; e = e.nextSibling) {
		if (e.className != "task") continue;

		var distTop = Math.abs(e.offsetTop - pointerY);
		if (distTop < minDist) {
			insertBeforeElement = e;
			minDist = distTop;
		}

		var distBottom = Math.abs(e.offsetTop + e.offsetHeight - pointerY);
		if (distBottom < minDist) {
			insertBeforeElement = e.nextSibling;
			minDist = distBottom;
		}
	}

	while (insertBeforeElement && insertBeforeElement.className != "task") {
		insertBeforeElement = insertBeforeElement.nextSibling;
	}

	return insertBeforeElement;
}

ProjectView.prototype._createTask = function(listId, insertBeforeElement)
{
	var list = this._lists[listId];
	var ph = this._createTaskPlaceholder(null);
	list.element.insertBefore(ph, insertBeforeElement);
	var editor = new TaskEditor();

	editor.show(ph, {}, function(taskData) {
		if (!taskData) {
			editor.hide();
			list.element.removeChild(ph);
			return;
		}
		var request = {
			listId: listId,
			title: taskData.title,
			description: taskData.description,
			beforeTaskId: this._getTaskIdFromElement(insertBeforeElement)
		};
		Request.send("api/task/create.php", request, function(status, result) {
			if (status != Request.STATUS_SUCCESS) return alert(result.message);

			editor.hide();
			list.element.removeChild(ph);
			taskData.taskId = result.taskId;
			this._addTask(list, taskData, insertBeforeElement);
		}.bind(this));
	}.bind(this));
}

ProjectView.prototype._editTask = function(taskId)
{
	var task = this._tasks[taskId];
	var editor = new TaskEditor();

	editor.show(task.element, task, function(updatedTaskData) {
		if (!updatedTaskData) {
			editor.hide();
			return;
		}

		var request = {
			taskId: taskId,
			title: updatedTaskData.title,
			description: updatedTaskData.description
		};
		Request.send("api/task/update.php", request, function(status, result) {
			if (status != Request.STATUS_SUCCESS) return alert(result.message);

			editor.hide();
			this._updateTask(task, updatedTaskData);
		}.bind(this));
	}.bind(this));
}

ProjectView.prototype._deleteTask = function(taskId)
{
	var task = this._tasks[taskId];

	var message = "Are you sure you want to delete task " + task.title + "?";
	Confirm.show(message, ["Delete", "Cancel"], function(buttonIndex) {
		if (buttonIndex === 0) {
			Request.send("api/task/delete.php", {taskId:taskId}, function(status, result) {
				if (status != Request.STATUS_SUCCESS) return alert(result.message);
				this._removeTask(task);
			}.bind(this));
		}
	}.bind(this));
}

// === Drag & Drop ===

ProjectView.prototype._getBundle = function(event)
{
	try {
		return JSON.parse(event.dataTransfer.getData("text/json"));
	}
	catch (e) {
		return null;
	}
}

ProjectView.prototype._onDragListStart = function(listId, event)
{
	var list = this._lists[listId];
	var ph = this._createListPlaceholder(list.element);
	var nextListId = this._getListIdFromElement(list.element.nextSibling);
	var bundle = {listId: listId, nextListId: nextListId};
	event.dataTransfer.setData("text/json", JSON.stringify(bundle));

	setTimeout(function() {
		this._container.insertBefore(ph, list.element);
		this._container.removeChild(list.element);
	}.bind(this), 0);
}

ProjectView.prototype._onDragTaskStart = function(taskId, event)
{
	var task = this._tasks[taskId];
	var listId = this._getListIdFromElement(task.element.parentNode);
	var list = this._lists[listId];
	var ph = this._createTaskPlaceholder(task.element);
	var nextTaskId = this._getTaskIdFromElement(task.element.nextSibling);
	var bundle = {taskId: taskId, srcListId: listId, nextTaskId: nextTaskId};
	event.dataTransfer.setData("text/json", JSON.stringify(bundle));

	setTimeout(function() {
		list.element.insertBefore(ph, task.element);
		list.element.removeChild(task.element);
	}.bind(this), 0);

	event.stopPropagation();
}

ProjectView.prototype._onWorkspaceDragOver = function(event)
{
	var bundle = this._getBundle(event);

	if (bundle && bundle.listId) {
		var insertBeforeElement = this._findInsertionPointForList(event.pageX);
		var ph = this._findListPlaceholder();
		if (ph) {
			if (ph.nextSibling != insertBeforeElement) {
				this._container.insertBefore(ph, insertBeforeElement);
			}
			event.dataTransfer.dropEffect = "move";
			event.preventDefault();
		}
	}
	else if (bundle && bundle.taskId) {
		var list = this._findNearestList(event.pageX);
		var insertBeforeElement = this._findInsertionPointForTask(list, event.pageY);
		var ph = this._findTaskPlaceholder();
		if (ph) {
			if (ph.parentNode != list.element || ph.nextSibling != insertBeforeElement) {
				list.element.insertBefore(ph, insertBeforeElement);
			}
			event.dataTransfer.dropEffect = "move";
			event.preventDefault();
		}
	}
}

ProjectView.prototype._onWorkspaceDragDrop = function(event)
{
	var bundle = this._getBundle(event);

	if (bundle && bundle.listId) {
		var ph = this._findListPlaceholder();
		var list = this._lists[bundle.listId];
		this._container.insertBefore(list.element, ph);
		this._container.removeChild(ph);
		var nextListId = this._getListIdFromElement(list.element.nextSibling);
		if (nextListId != bundle.nextListId) {
			Request.send("api/list/move.php", {listId: list.id, beforeListId: nextListId}, function(status, result) {
				if (status != Request.STATUS_SUCCESS) return alert(result.message);
			});
		}
		event.preventDefault();
	}
	else if (bundle && bundle.taskId) {
		var ph = this._findTaskPlaceholder();
		var task = this._tasks[bundle.taskId];
		var newListId = this._getListIdFromElement(ph.parentNode);
		ph.parentNode.insertBefore(task.element, ph);
		ph.parentNode.removeChild(ph);
		var nextTaskId = this._getTaskIdFromElement(task.element.nextSibling);
		if (newListId != bundle.srcListId || nextTaskId != bundle.nextTaskId) {
			Request.send("api/task/move.php", {taskId: task.id, listId: newListId, beforeTaskId: nextTaskId}, function(status, result) {
				if (status != Request.STATUS_SUCCESS) return alert(result.message);
			});
		}
		event.preventDefault();
	}
}

ProjectView.prototype._onDragEnd = function(event)
{
	if (event.dataTransfer.dropEffect != "none") {
		// should already be handled by drop event
		return;
	}

	var bundle = this._getBundle(event);

	if (bundle && bundle.listId) {
		var ph = this._findListPlaceholder();
		var list = this._lists[bundle.listId];
		var nextList = bundle.nextListId ? this._lists[bundle.nextListId] : null;
		var insertBeforeElement = nextList ? nextList.element : null;

		this._container.insertBefore(ph, insertBeforeElement);
		window.setTimeout(function() {
			this._container.removeChild(ph);
			this._container.insertBefore(list.element, insertBeforeElement);
		}.bind(this), 400);
	}
	else if (bundle && bundle.taskId) {
		var ph = this._findTaskPlaceholder();
		var task = this._tasks[bundle.taskId];
		var list = this._lists[bundle.srcListId];
		var nextTask = bundle.nextTaskId ? this._tasks[bundle.nextTaskId] : null;
		var insertBeforeElement = nextTask ? nextTask.element : null;

		list.element.insertBefore(ph, insertBeforeElement);
		window.setTimeout(function() {
			list.element.removeChild(ph);
			list.element.insertBefore(task.element, insertBeforeElement);
		}.bind(this), 400);
	}
}
