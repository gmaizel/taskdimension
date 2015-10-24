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

function Confirm(message, buttons, callback)
{
	this._dialogBox = document.createElement("div");
	this._dialogBox.className = "confirmBox";
	var messageBox = document.createElement("h2");
	messageBox.innerHTML = message.htmlEscape();
	this._dialogBox.appendChild(messageBox);

	this._firstButton = null;
	for (var i = 0; i < buttons.length; i++) {
		var button = document.createElement("input");
		button.type = "button";
		button.value = buttons[i];
		button.addEventListener('click', this._onbuttonClick.bind(this, i));
		this._dialogBox.appendChild(button);
		this._firstButton = this._firstButton || button;
	}

	this._layer = document.createElement("div");
	this._layer.className = "uiLayer";
	this._layer.appendChild(this._dialogBox);

	this._callback = callback;
}

Confirm.show = function(message, buttons, callback)
{
	var c = new Confirm(message, buttons, callback);
	c._show();
}

Confirm.prototype._show = function()
{
	document.body.appendChild(this._layer);
	var left = ((this._layer.offsetWidth - this._dialogBox.offsetWidth) / 2) | 0;
	var top = ((this._layer.offsetHeight - this._dialogBox.offsetHeight) / 2) | 0;
	this._dialogBox.style.left = left + "px";
	this._dialogBox.style.top = top + "px";
	Keyboard.pushListener(this._onKeyDown.bind(this), null);
	if (this._firstButton) {
		this._firstButton.focus();
	}
}

Confirm.prototype._hide = function()
{
	Keyboard.popListener();
	document.body.removeChild(this._layer);
}

Confirm.prototype._onKeyDown = function(event)
{
	switch (event.keyCode) {
	case Keyboard.ESCAPE:
		this._hide();
		this._callback(-1);
		break;
	}
}

Confirm.prototype._onbuttonClick = function(index)
{
	this._hide();
	this._callback(index);
}
