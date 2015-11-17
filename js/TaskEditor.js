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

function TaskEditor()
{
	this._layer = document.createElement("div");
	this._layer.className = "uiLayer";
	this._layer.addEventListener('mousedown', this._cancel.bind(this));

	this._container = document.createElement("div");
	this._container.className = "TaskEditor";
	this._container.addEventListener('mousedown', function(event) { event.stopPropagation(); });
	this._layer.appendChild(this._container);

	this._titleEditor = document.createElement("textarea");
	this._titleEditor.className = "title";
	this._titleEditor.addEventListener('input', this._onTitleChanged.bind(this));
	this._titleEditor.addEventListener('contextmenu', function(event) { event.stopPropagation(); });

	this._saveButton = document.createElement("input");
	this._saveButton.type = "button";
	this._saveButton.value = "Save";
	this._saveButton.addEventListener('click', this._save.bind(this));

	this._cancelButton = document.createElement("input");
	this._cancelButton.type = "button";
	this._cancelButton.value = "Cancel";
	this._cancelButton.addEventListener('click', this._cancel.bind(this));

	this._descriptionEditor = document.createElement("textarea");
	this._descriptionEditor.className = "description";
	this._descriptionEditor.addEventListener('contextmenu', function(event) { event.stopPropagation(); });

	this._titleEditor.tabIndex = 1;
	this._descriptionEditor.tabIndex = 2;
	this._saveButton.tabIndex = 3;
	this._cancelButton.tabIndex = 4;

	this._container.appendChild(this._titleEditor);
	this._container.appendChild(this._saveButton);
	this._container.appendChild(this._cancelButton);
	this._container.appendChild(this._descriptionEditor);
}

TaskEditor.prototype.show = function(taskElement, taskDetails, callback)
{
	this._callback = callback;
	this._taskElement = taskElement;
	this._titleEditor.value = taskDetails.title || "";
	this._descriptionEditor.value = taskDetails.description || "";

	var rect = this._taskElement.getBoundingClientRect();
	this._container.style.left = rect.left + "px";
	this._container.style.top = rect.top + "px";
	this._titleEditor.style.width = rect.width + "px";
	document.body.appendChild(this._layer);

	// FIXME: scroll workspace to align task control with the editor if possible
	// With current styles buttons may move when they get more room on the right,
	// therefore alignment requires several iterations.
	while (this._container.offsetLeft > 0 && this._container.offsetLeft + this._container.offsetWidth > this._layer.clientWidth) {
		this._container.style.left = (this._layer.clientWidth - this._container.offsetWidth) + "px";
	}

	Keyboard.pushListener(this._onKeyDown.bind(this), null);
	this._titleEditor.focus();
	this._onTitleChanged();
}

TaskEditor.prototype.hide = function()
{
	Keyboard.popListener();
	document.body.removeChild(this._layer);
}

TaskEditor.prototype._onKeyDown = function(event)
{
	switch (event.keyCode) {
	case Keyboard.ESCAPE:
		this._cancel();
		break;

	case Keyboard.RETURN:
		if (event.ctrlKey) {
			event.preventDefault();
			this._save();
		}
		break;
	}
}

TaskEditor.prototype._onTitleChanged = function()
{
	var title = this._titleEditor.value.trim();
	this._saveButton.disabled = !title;

	this._titleEditor.style.height = "1px";
	var h = this._titleEditor.scrollHeight;
	this._titleEditor.style.height = h + "px";

	// FIXME: scroll taskElement's parent view up to align it with title editor if possible.
	var rect = this._taskElement.getBoundingClientRect();
	var maxTop = this._layer.clientHeight - this._container.offsetHeight;
	this._container.style.top = Math.max(0, Math.min(rect.top, maxTop)) + "px";
}

TaskEditor.prototype._save = function()
{
	var title = this._titleEditor.value.trim();
	var description = this._descriptionEditor.value.trim();
	if (title) {
		this._callback({ title: title, description: description });
	}
}

TaskEditor.prototype._cancel = function()
{
	this._callback(null);
}
