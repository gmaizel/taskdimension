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

function ProjectEditor()
{
	this._layer = document.createElement("div");
	this._layer.className = "uiLayer";
	this._layer.addEventListener('mousedown', this._cancel.bind(this));

	this._container = document.createElement("div");
	this._container.className = "ProjectEditor";
	this._container.addEventListener('mousedown', function(event) { event.stopPropagation(); });
	this._layer.appendChild(this._container);

	this._titleEditor = document.createElement("input");
	this._titleEditor.type = "text";
	this._titleEditor.className = "title";
	this._titleEditor.addEventListener('input', this._onTitleChanged.bind(this));
	this._titleEditor.addEventListener('contextmenu', function(event) { event.stopPropagation(); });

	this._descriptionEditor = document.createElement("textarea");
	this._descriptionEditor.className = "description";
	this._descriptionEditor.addEventListener('input', this._onDescriptionChanged.bind(this));
	this._descriptionEditor.addEventListener('contextmenu', function(event) { event.stopPropagation(); });

	this._saveButton = document.createElement("input");
	this._saveButton.type = "button";
	this._saveButton.value = "Save";
	this._saveButton.addEventListener('click', this._save.bind(this));

	this._cancelButton = document.createElement("input");
	this._cancelButton.type = "button";
	this._cancelButton.value = "Cancel";
	this._cancelButton.addEventListener('click', this._cancel.bind(this));

	this._container.appendChild(this._titleEditor);
	this._container.appendChild(this._descriptionEditor);
	this._container.appendChild(this._saveButton);
	this._container.appendChild(this._cancelButton);
}

ProjectEditor.prototype.show = function(projectElement, projectDetails, fieldIndex, callback)
{
	this._callback = callback;
	this._projectElement = projectElement;
	this._titleEditor.value = projectDetails.title || "";
	this._descriptionEditor.value = projectDetails.description || "";

	var rect = this._projectElement.getBoundingClientRect();
	this._container.style.left = rect.left + "px";
	this._container.style.top = rect.top + "px";
	document.body.appendChild(this._layer);

	Keyboard.pushListener(this._onKeyDown.bind(this), null);
	if (fieldIndex == 1) {
		this._descriptionEditor.focus();
	}
	else {
		this._titleEditor.focus();
	}
	this._onTitleChanged();
	this._onDescriptionChanged();
}

ProjectEditor.prototype.hide = function()
{
	Keyboard.popListener();
	document.body.removeChild(this._layer);
}

ProjectEditor.prototype._onKeyDown = function(event)
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

ProjectEditor.prototype._onTitleChanged = function()
{
	var title = this._titleEditor.value.trim();
	this._saveButton.disabled = !title;
}

ProjectEditor.prototype._onDescriptionChanged = function()
{
	this._descriptionEditor.style.height = "1px";
	var h = this._descriptionEditor.scrollHeight;
	this._descriptionEditor.style.height = h + "px";
}

ProjectEditor.prototype._save = function()
{
	var title = this._titleEditor.value.trim();
	var description = this._descriptionEditor.value.trim();
	if (title) {
		this._callback({ title: title, description: description });
	}
}

ProjectEditor.prototype._cancel = function()
{
	this._callback(null);
}
