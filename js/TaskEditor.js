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
	this._layer.className = "dialogBackground";
	this._layer.addEventListener('mousedown', this._cancel.bind(this));

	this._container = document.createElement("div");
	this._container.className = "TaskEditor";
	this._container.addEventListener('mousedown', function(event) { event.stopPropagation(); });
	this._layer.appendChild(this._container);

	this._titleEditor = document.createElement("textarea");
	this._titleEditor.addEventListener('input', this._onTextChange.bind(this));
	this._titleEditor.addEventListener('contextmenu', function(event) { event.stopPropagation(); });
	this._container.appendChild(this._titleEditor);

	this._saveButton = document.createElement("input");
	this._saveButton.type = "button";
	this._saveButton.value = "Save";
	this._saveButton.addEventListener('click', this._save.bind(this));
	this._container.appendChild(this._saveButton);

	this._cancelButton = document.createElement("input");
	this._cancelButton.type = "button";
	this._cancelButton.value = "Cancel";
	this._cancelButton.addEventListener('click', this._cancel.bind(this));
	this._container.appendChild(this._cancelButton);
}

TaskEditor.prototype.show = function(taskElement, taskDetails, callback)
{
	this._callback = callback;
	this._titleEditor.value = taskDetails.title || "";

	var rect = taskElement.getBoundingClientRect();
	this._container.style.left = rect.left + "px";
	this._container.style.top = rect.top + "px";
	this._container.style.width = rect.width + "px";
	document.body.appendChild(this._layer);

	Keyboard.pushListener(this._onKeyDown.bind(this), null);
	this._titleEditor.focus();
	this._onTextChange();
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
			this._save();
		}
		break;
	}
}

TaskEditor.prototype._onTextChange = function()
{
	this._titleEditor.style.height = "1px";
	var h = this._titleEditor.scrollHeight;
	this._titleEditor.style.height = h + "px";

	var title = this._titleEditor.value.trim();
	this._saveButton.disabled = !title;
}

TaskEditor.prototype._save = function()
{
	var title = this._titleEditor.value.trim();
	if (title) {
		this._callback({ title: title, description: "" });
	}
}

TaskEditor.prototype._cancel = function()
{
	this._callback(null);
}
