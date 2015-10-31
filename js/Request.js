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

var Request = {};

Request.STATUS_SUCCESS = 200;
Request.STATUS_BAD_REQUEST = 400;
Request.STATUS_AUTH_FAIL = 401;
Request.STATUS_ACCESS_DENIED = 403;
Request.STATUS_NOT_FOUND = 404;
Request.STATUS_SERVER_ERROR = 500;

Request.send = function(url, params, callback)
{
	var rq = new XMLHttpRequest();

	rq.onreadystatechange = function(event)
	{
		if(rq.readyState == 4) {
			var responseBody = null;
			try { responseBody = JSON.parse(rq.responseText); } catch(e) { }
			if (rq.status != Request.STATUS_SUCCESS && !(responseBody && responseBody.message)) {
				responseBody = {message: "Request Failed"};
			}
			callback(rq.status, responseBody);
		}
	};

	var body = JSON.stringify(params);

	rq.open("POST", url);
	rq.setRequestHeader("content-type", "application/json; charset=UTF-8");
	rq.send(body);
}

Request.fetchText = function(url, callback)
{
	var rq = new XMLHttpRequest();

	rq.onreadystatechange = function(event)
	{
		if(rq.readyState == 4) {
			var responseBody = null;
			if (rq.status != Request.STATUS_SUCCESS) {
				responseBody = {message: "Request Failed"};
			}
			else {
				responseBody = {text: rq.responseText};
			}
			callback(rq.status, responseBody);
		}
	};

	rq.open("GET", url);
	rq.send();
}
