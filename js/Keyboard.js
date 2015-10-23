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

var Keyboard = {};

Keyboard.ESCAPE = 27;

Keyboard.F1 = 112;
Keyboard.F2 = 113;
Keyboard.F3 = 114;
Keyboard.F4 = 115;
Keyboard.F5 = 116;
Keyboard.F6 = 117;
Keyboard.F7 = 118;
Keyboard.F8 = 119;
Keyboard.F9 = 120;
Keyboard.F10 = 121;
Keyboard.F11 = 122;
Keyboard.F12 = 123;
Keyboard.PAUSE = 19;

Keyboard.LEFT = 37;
Keyboard.RIGHT = 39;
Keyboard.UP = 38;
Keyboard.DOWN = 40;

Keyboard.INSERT = 45;
Keyboard.DELETE = 46;
Keyboard.HOME = 36;
Keyboard.END = 35;
Keyboard.PAGE_UP = 33;
Keyboard.PAGE_DOWN = 34;

Keyboard.TAB = 9;
Keyboard.RETURN = 13;
Keyboard.BACKSPACE = 8;

Keyboard.TILDE = 192;
Keyboard.KEY_1 = 49;
Keyboard.KEY_2 = 50;
Keyboard.KEY_3 = 51;
Keyboard.KEY_4 = 52;
Keyboard.KEY_5 = 53;
Keyboard.KEY_6 = 54;
Keyboard.KEY_7 = 55;
Keyboard.KEY_8 = 56;
Keyboard.KEY_9 = 57;
Keyboard.KEY_0 = 48;
Keyboard.MUNUS = 173;
Keyboard.EQUALS = 61;
Keyboard.PLUS = 61;

Keyboard.SPACE = 32;
Keyboard.KEY_A = 65;
Keyboard.KEY_B = 66;
Keyboard.KEY_C = 67;
Keyboard.KEY_D = 68;
Keyboard.KEY_E = 69;
Keyboard.KEY_F = 70;
Keyboard.KEY_G = 71;
Keyboard.KEY_H = 72;
Keyboard.KEY_I = 73;
Keyboard.KEY_J = 74;
Keyboard.KEY_K = 75;
Keyboard.KEY_L = 76;
Keyboard.KEY_M = 77;
Keyboard.KEY_N = 78;
Keyboard.KEY_O = 79;
Keyboard.KEY_P = 80;
Keyboard.KEY_Q = 81;
Keyboard.KEY_R = 82;
Keyboard.KEY_S = 83;
Keyboard.KEY_T = 84;
Keyboard.KEY_U = 85;
Keyboard.KEY_V = 86;
Keyboard.KEY_W = 87;
Keyboard.KEY_X = 88;
Keyboard.KEY_Y = 89;
Keyboard.KEY_Z = 90;

Keyboard.LEFT_BRACKET = 219;
Keyboard.RIGHT_BARCKET = 221;
Keyboard.PIPE = 220;
Keyboard.BACKSLASH = 220;
Keyboard.SEMICOLON = 59;
Keyboard.APOSTROPHE = 222;
Keyboard.COMMA = 188;
Keyboard.DOT = 190;
Keyboard.SLASH = 191;

Keyboard._stack = [];

Keyboard.pushListener = function(keyDownCallback, keyUpCallback)
{
	Keyboard._stack.push({down:keyDownCallback, up:keyUpCallback});
}

Keyboard.popListener = function()
{
	Keyboard._stack.pop();
}

Keyboard.popAllListeners = function()
{
	Keyboard._stack = [];
}

document.addEventListener("keydown", function(event) {
	if (Keyboard._stack.length > 0) {
		var handler = Keyboard._stack[Keyboard._stack.length - 1].down;
		if (handler) return handler(event);
	}
});

document.addEventListener("keyup", function(event) {
	if (Keyboard._stack.length > 0) {
		var handler = Keyboard._stack[Keyboard._stack.length - 1].up;
		if (handler) return handler(event);
	}
});
