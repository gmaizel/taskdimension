"use strict";

LocalSettings.HIDE_CLOSED_TASKS = "hideClosedTasks";

function LocalSettings(projectId)
{
	this._projectId = projectId;
	this._settings = LocalSettings._load(projectId);
}

LocalSettings.prototype.getHideClosedTasks = function()
{
	return this.get(LocalSettings.HIDE_CLOSED_TASKS, true);
}

LocalSettings.prototype.setHideClosedTasks = function(value)
{
	return this.set(LocalSettings.HIDE_CLOSED_TASKS, value);
}

LocalSettings.prototype.get = function(key, defaultValue)
{
	if (key in this._settings) {
		return this._settings[key];
	}
	return defaultValue;
}

LocalSettings.prototype.set = function(key, value)
{
	this._settings[key] = value;
	LocalSettings._save(this._projectId, this._settings);
}

LocalSettings.prototype.remove = function(key)
{
	delete this._settings[key];
	LocalSettings._save(this._projectId, this._settings);
}

LocalSettings._load = function(projectId)
{
	var settings = null;
	try {
		settings = JSON.parse(window.localStorage.getItem(projectId));
	}
	catch (e) {}

	if (!settings || typeof(settings) != "object") {
		settings = {};
	}

	return settings;
}

LocalSettings._save = function(projectId, settings)
{
	window.localStorage.setItem(projectId, JSON.stringify(settings));
}
