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

function Alert(title, message, buttons, callback, options)
{
	options = options || {};
	this._alertBox = document.createElement("div");
	this._alertBox.className = options.className || "Alert";
	var titleBox = document.createElement("h2");
	titleBox.innerHTML = title.htmlEscape();
	this._alertBox.appendChild(titleBox);
	var messageBox = document.createElement("div");
	messageBox.innerHTML = options.isHTML ? message : message.htmlEscape();
	this._alertBox.appendChild(messageBox);

	if (options.enableContextMenu) {
		this._alertBox.addEventListener('contextmenu', function(event) { event.stopPropagation(); });
	}

	this._firstButton = null;
	for (var i = 0; i < buttons.length; i++) {
		var button = document.createElement("input");
		button.type = "button";
		button.value = buttons[i];
		button.addEventListener('click', this._onbuttonClick.bind(this, i));
		this._alertBox.appendChild(button);
		this._firstButton = this._firstButton || button;
	}

	this._layer = document.createElement("div");
	this._layer.className = "uiLayer";
	this._layer.appendChild(this._alertBox);

	this._callback = callback;
}

Alert.show = function(title, message, buttons, callback, options)
{
	var c = new Alert(title, message, buttons, callback, options);
	c._show();
}

Alert.prototype._show = function()
{
	document.body.appendChild(this._layer);
	var left = ((this._layer.offsetWidth - this._alertBox.offsetWidth) / 2) | 0;
	var top = ((this._layer.offsetHeight - this._alertBox.offsetHeight) / 2) | 0;
	this._alertBox.style.left = left + "px";
	this._alertBox.style.top = top + "px";
	Keyboard.pushListener(this._onKeyDown.bind(this), null);
	if (this._firstButton) {
		this._firstButton.focus();
	}
}

Alert.prototype._hide = function()
{
	Keyboard.popListener();
	document.body.removeChild(this._layer);
}

Alert.prototype._onKeyDown = function(event)
{
	switch (event.keyCode) {
	case Keyboard.ESCAPE:
		this._hide();
		if (this._callback) {
			this._callback(-1);
		}
		break;
	}
}

Alert.prototype._onbuttonClick = function(index)
{
	this._hide();
	if (this._callback) {
		this._callback(index);
	}
}
