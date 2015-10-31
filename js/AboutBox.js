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

var AboutBox = {};

AboutBox.PAGE_ABOUT = 0;
AboutBox.PAGE_LICENSE = 1;

AboutBox.show = function(page)
{
	var filename;
	var title;
	switch (page | 0) {
	case AboutBox.PAGE_LICENSE:
		filename = "LICENSE.md";
		title = "License";
		break;

	case AboutBox.PAGE_ABOUT:
	default:
		filename = "README.md";
		title = "About";
		break;
	}

	Request.fetchText(filename, function(code, response) {
		if (code != 200) return alert(response.message);

		var html = markdown.toHTML(response.text);
		var opts = {isHTML: true, className: "Alert about", enableContextMenu: true};
		Alert.show(title, html, ["About", "License", "Close"], function(idx) {
			switch(idx) {
				case 0: AboutBox.show(AboutBox.PAGE_ABOUT); break;
				case 1: AboutBox.show(AboutBox.PAGE_LICENSE); break;
			}
		}, opts);
	});
}
