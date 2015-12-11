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

function ProjectView(projectId)
{
	this._projectId = projectId;
	this._lists = {};
	this._tasks = {};
	this._dragInfo = null;

	this._element = document.createElement("div");
	this._element.className = "ProjectView";

	this._pageHeader = document.createElement("div");
	this._pageHeader.className = "PageHeader";
	this._element.appendChild(this._pageHeader);

	this._header = document.createElement("h1");
	this._pageHeader.appendChild(this._header);

	this._backIcon = document.createElement("div");
	this._backIcon.className = "headerButton back";
	this._backIcon.innerHTML = "&#9664;";
	this._backIcon.title = "Back to projects list";
	this._backIcon.addEventListener('click', View.showProjectsList.bind(View));
	this._pageHeader.appendChild(this._backIcon);

	this._menuIcon = document.createElement("div");
	this._menuIcon.className = "headerButton menu";
	this._menuIcon.innerHTML = "i";
	this._menuIcon.title = "About";
	this._menuIcon.addEventListener('click', AboutBox.show);
	this._pageHeader.appendChild(this._menuIcon);

	this._container = document.createElement("div");
	this._container.className = "container";
	this._element.appendChild(this._container);

	Request.send("api/project/fetch.php", {"projectId" : projectId}, function(status, data) {
		if (status == Request.STATUS_SUCCESS) {
			View.setTitle(data.title + " - Task Dimension");
			this._header.innerHTML = data.title.htmlEscape();
			this._header.title = data.description;

			for (var i = 0; i < data.lists.length; i++) {
				var listData = data.lists[i];
				this._addList(listData);
			}

			this._container.addEventListener('contextmenu', this._onWorkspaceContextMenu.bind(this));
			this._container.addEventListener('dragover', this._onWorkspaceDragOver.bind(this));
			this._container.addEventListener('drop', this._onWorkspaceDragDrop.bind(this));
		}
		else {
			View.setTitle("Error");
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

			var backButton = document.createElement("input");
			backButton.type = "button";
			backButton.value = "All Projects"
			backButton.addEventListener('click', View.showProjectsList.bind(View));
			errorBox.appendChild(backButton);
		}
	}.bind(this));
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
		if (event.target != list.header) {
			event.preventDefault();
			event.stopPropagation();
		}
	});

	list.header = document.createElement("h2");
	list.header.addEventListener('dblclick', this._editList.bind(this, list.id));
	list.element.appendChild(list.header);

	list.content = document.createElement("ul");
	list.element.appendChild(list.content);

	list.footer = document.createElement("footer");
	list.element.appendChild(list.footer);

	this._updateList(list, listData);

	if (listData.tasks) {
		for (var j = 0; j < listData.tasks.length; j++) {
			var taskData = listData.tasks[j];
			this._addTask(list, taskData);
		}
	}

	this._container.insertBefore(list.element, insertBeforeElement);
}

ProjectView.prototype._updateList = function(list, listData)
{
	list.title = listData.title;
	list.header.innerHTML = list.title.htmlEscape();
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

	task.element = document.createElement("li");
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

	list.content.insertBefore(task.element, insertBeforeElement);
}

ProjectView.prototype._updateTask = function(task, taskData)
{
	task.title = taskData.title;
	task.description = taskData.description;

	var title = task.title.htmlEscape();
	var tags = "";
	while (title.charAt(0) === '[') {
		var endIdx = title.indexOf(']');
		if (endIdx < 0) break;
		var tagText = title.substr(1, endIdx - 1);
		title = title.substr(endIdx + 1);
		tags += "<span class='tag blue'>" + tagText + "</span>";
	}
	task.element.innerHTML = tags + title.trim();
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
	ph.className = "list-placeholder";
	if (referenceElement) {
		var style = window.getComputedStyle(referenceElement, null);
		ph.style.width = style.getPropertyValue('width');
		ph.style.height = style.getPropertyValue('height');
	}
	return ph;
}

ProjectView.prototype._getListIdFromElement = function(element)
{
	var elementId = null;
	if (element) {
		if (element.id) {
			elementId = element.id;
		}
		else if (element.parentNode) {
			elementId = element.parentNode.id;
		}
	}
	return elementId ? elementId.split('#')[1] : null;
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

	// move new list placeholder into view if needed
	var margin = 20;
	var phRight = ph.offsetLeft + ph.offsetWidth;
	var scrollRight = this._container.scrollLeft + this._container.clientWidth;
	if (ph.offsetLeft - margin < this._container.scrollLeft) {
		this._container.scrollLeft = ph.offsetLeft - margin;
	}
	else if (phRight + margin > scrollRight) {
		this._container.scrollLeft = phRight + margin - this._container.clientWidth;
	}

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

	Alert.show(message, "", ["Delete", "Cancel"], function(buttonIndex) {
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
	var ph = document.createElement("li");
	ph.className = "task-placeholder";
	if (referenceElement) {
		var style = window.getComputedStyle(referenceElement, null);
		ph.style.width = style.getPropertyValue('width');
		ph.style.height = style.getPropertyValue('height');
	}
	return ph;
}

ProjectView.prototype._getTaskIdFromElement = function(element)
{
	return element ? element.id.split('#')[1] : null;
}

ProjectView.prototype._findInsertionPointForTask = function(list, pointerY)
{
	var insertBeforeElement = null;
	var minDist = Infinity;

	pointerY -= this._container.offsetTop;
	pointerY += list.content.scrollTop;

	for (var e = list.content.firstChild; e; e = e.nextSibling) {
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
	list.content.insertBefore(ph, insertBeforeElement);
	var editor = new TaskEditor();

	editor.show(ph, {}, function(taskData) {
		if (!taskData) {
			editor.hide();
			list.content.removeChild(ph);
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
			list.content.removeChild(ph);
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
	Alert.show(message, "", ["Delete", "Cancel"], function(buttonIndex) {
		if (buttonIndex === 0) {
			Request.send("api/task/delete.php", {taskId:taskId}, function(status, result) {
				if (status != Request.STATUS_SUCCESS) return alert(result.message);
				this._removeTask(task);
			}.bind(this));
		}
	}.bind(this));
}

// === Drag & Drop ===

ProjectView.prototype._onDragListStart = function(listId, event)
{
	var list = this._lists[listId];
	var nextListId = this._getListIdFromElement(list.element.nextSibling);
	var ph = this._createListPlaceholder(list.element);

	this._dragInfo = {
		placeholder: ph,
		listId: listId,
		srcNextListId: nextListId
	};

	event.dataTransfer.setData("text", list.title);

	setTimeout(function() {
		this._container.insertBefore(ph, list.element);
		this._container.removeChild(list.element);
	}.bind(this), 0);
}

ProjectView.prototype._onDragTaskStart = function(taskId, event)
{
	var task = this._tasks[taskId];
	var listId = this._getListIdFromElement(task.element.parentNode);
	var nextTaskId = this._getTaskIdFromElement(task.element.nextSibling);
	var ph = this._createTaskPlaceholder(task.element);
	var list = this._lists[listId];

	this._dragInfo = {
		placeholder: ph,
		taskId: taskId,
		srcNextTaskId: nextTaskId,
		srcListId: listId
	}

	event.dataTransfer.setData("text", task.title);

	setTimeout(function() {
		list.content.insertBefore(ph, task.element);
		list.content.removeChild(task.element);
	}.bind(this), 0);

	event.stopPropagation();
}

ProjectView.prototype._onWorkspaceDragOver = function(event)
{
	if (!this._dragInfo) return;

	if (this._dragInfo.listId) {
		var insertBeforeElement = this._findInsertionPointForList(event.pageX);
		var ph = this._dragInfo.placeholder;
		if (ph.nextSibling != insertBeforeElement) {
			this._container.insertBefore(ph, insertBeforeElement);
		}
		event.dataTransfer.dropEffect = "move";
		event.preventDefault();
	}
	else if (this._dragInfo.taskId) {
		var list = this._findNearestList(event.pageX);
		var insertBeforeElement = this._findInsertionPointForTask(list, event.pageY);
		var ph = this._dragInfo.placeholder;
		if (ph.parentNode != list.content || ph.nextSibling != insertBeforeElement) {
			list.content.insertBefore(ph, insertBeforeElement);
		}
		event.dataTransfer.dropEffect = "move";
		event.preventDefault();
	}
}

ProjectView.prototype._onWorkspaceDragDrop = function(event)
{
	if (!this._dragInfo) return;

	if (this._dragInfo.listId) {
		var ph = this._dragInfo.placeholder;
		var list = this._lists[this._dragInfo.listId];
		this._container.insertBefore(list.element, ph);
		this._container.removeChild(ph);
		var nextListId = this._getListIdFromElement(list.element.nextSibling);
		if (nextListId != this._dragInfo.srcNextListId) {
			Request.send("api/list/move.php", {listId: list.id, beforeListId: nextListId}, function(status, result) {
				if (status != Request.STATUS_SUCCESS) return alert(result.message);
			});
		}
		this._dragInfo = null;
		event.preventDefault();
	}
	else if (this._dragInfo.taskId) {
		var ph = this._dragInfo.placeholder;
		var task = this._tasks[this._dragInfo.taskId];
		var newListId = this._getListIdFromElement(ph.parentNode);
		ph.parentNode.insertBefore(task.element, ph);
		ph.parentNode.removeChild(ph);
		var nextTaskId = this._getTaskIdFromElement(task.element.nextSibling);
		if (newListId != this._dragInfo.srcListId || nextTaskId != this._dragInfo.srcNextTaskId) {
			Request.send("api/task/move.php", {taskId: task.id, listId: newListId, beforeTaskId: nextTaskId}, function(status, result) {
				if (status != Request.STATUS_SUCCESS) return alert(result.message);
			});
		}
		this._dragInfo = null;
		event.preventDefault();
	}
}

ProjectView.prototype._onDragEnd = function(event)
{
	if (!this._dragInfo) return;

	if (this._dragInfo.listId) {
		var ph = this._dragInfo.placeholder;
		var list = this._lists[this._dragInfo.listId];
		var srcNextList = this._dragInfo.srcNextListId ? this._lists[this._dragInfo.srcNextListId] : null;
		var insertBeforeElement = srcNextList ? srcNextList.element : null;

		if (navigator.userAgent.indexOf("Firefox") >= 0) {
			// On drag cancel Firefox draws "dragged element flies to its original location"
			// animation, so if I immediately return that element to the DOM, it will look weird.
			// Have to move placeholder there and wait a bit.
			// Does not happen in other browsers.
			this._container.insertBefore(ph, insertBeforeElement);
			window.setTimeout(function() {
				this._container.removeChild(ph);
				this._container.insertBefore(list.element, insertBeforeElement);
			}.bind(this), 400);
		}
		else {
			this._container.removeChild(ph);
			this._container.insertBefore(list.element, insertBeforeElement);
		}

		this._dragInfo = null;
	}
	else if (this._dragInfo.taskId) {
		var ph = this._dragInfo.placeholder;
		var task = this._tasks[this._dragInfo.taskId];
		var srcList = this._lists[this._dragInfo.srcListId];
		var srcNextTask = this._dragInfo.srcNextTaskId ? this._tasks[this._dragInfo.srcNextTaskId] : null;
		var insertBeforeElement = srcNextTask ? srcNextTask.element : null;

		if (navigator.userAgent.indexOf("Firefox") >= 0) {
			srcList.content.insertBefore(ph, insertBeforeElement);
			window.setTimeout(function() {
				ph.parentNode.removeChild(ph);
				srcList.content.insertBefore(task.element, insertBeforeElement);
			}.bind(this), 400);
		}
		else {
			ph.parentNode.removeChild(ph);
			srcList.content.insertBefore(task.element, insertBeforeElement);
		}

		this._dragInfo = null;
	}
}
