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

function PopupMenu(menu)
{
	this._menuBox = document.createElement("div");
	this._menuBox.className = "popupMenu";
	this._menuBox.addEventListener('mousedown', function(evt) { evt.stopPropagation(); });

	for (var i = 0; i < menu.length; i++) {
		var item = document.createElement("div");
		if (menu[i].title && menu[i].callback) {
			item.className = "popupMenuItem";
			item.innerHTML = menu[i].title.htmlEscape();
			item.addEventListener('mouseover', function(evt) { this.style.background='#50a0ff'; });
			item.addEventListener('mouseout', function(evt) { this.style.background=''; });
			item.addEventListener('click', this._onItemClick.bind(this, menu[i].callback));
			this._menuBox.appendChild(item);
		}
		else if (menu[i].title) {
			item.className = "popupMenuItemDisabled";
			item.innerHTML = menu[i].title.htmlEscape();
			this._menuBox.appendChild(item);
		}
		else {
			item.className = "popupMenuSeparator";
			this._menuBox.appendChild(item);
		}
	}

	this._dialogContainer = document.createElement("div");
	this._dialogContainer.className = "dialogBackground";
	this._dialogContainer.addEventListener('mousedown', this._hide.bind(this));
	this._dialogContainer.appendChild(this._menuBox);
}

PopupMenu.show = function(x, y, menu)
{
	var popMenu = new PopupMenu(menu);
	popMenu._show(x, y);
}

PopupMenu.prototype._show = function(x, y)
{
	document.body.appendChild(this._dialogContainer);
	this._menuBox.style.left = x + "px";
	this._menuBox.style.top = y + "px";
	Keyboard.pushListener(this._onKeyDown.bind(this), null);
}

PopupMenu.prototype._hide = function()
{
	Keyboard.popListener();
	document.body.removeChild(this._dialogContainer);
}

PopupMenu.prototype._onKeyDown = function(event)
{
	switch (event.keyCode) {
	case Keyboard.ESCAPE:
		this._hide();
		break;
	}
}

PopupMenu.prototype._onItemClick = function(callback)
{
	this._hide();
	callback();
}
