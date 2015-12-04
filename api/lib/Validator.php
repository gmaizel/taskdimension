<?php /*
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

class ValidationException extends Exception
{
}

abstract class Validator
{
	abstract public function exec($name, $value);
}

class ValidatorNone extends Validator
{
	public function exec($name, $value)
	{
		return array();
	}
}

class ValidatorObject extends Validator
{
	private $_fieldValidators;

	public function __construct(array $fieldValidators)
	{
		$this->_fieldValidators = $fieldValidators;
	}

	public function exec($name, $value)
	{
		if (!is_array($value)) {
			throw new ValidationException("$name should be an object");
		}

		$result = array();
		foreach ($this->_fieldValidators as $field => $validator) {
			$fieldValue = isset($value[$field]) ? $value[$field] : null;
			$result[$field] = $validator->exec("$name/$field", $fieldValue);
		}
		return $result;
	}
}

class ValidatorOptional extends Validator
{
	private $_innerValidator;

	public function __construct(Validator $innerValidator)
	{
		$this->_innerValidator = $innerValidator;
	}

	public function exec($name, $value)
	{
		return $value === null ? null : $this->_innerValidator->exec($name, $value);
	}
}

class ValidatorArray extends Validator
{
	private $_memberValidator;

	public function __construct(Validator $memberValidator)
	{
		$this->_memberValidator = $memberValidator;
	}

	public function exec($name, $value)
	{
		if (!is_array($value)) {
			throw new ValidationException("$name should be an array");
		}

		$result = array();
		foreach ($value as $index => $memberValue) {
			$result[] = $this->_memberValidator->exec("$name\[$index\]", $memberValue);
		}
		return $result;
	}
}

class ValidatorID extends Validator
{
	public function exec($name, $value)
	{
		if (!is_string($value) || !preg_match("/^[1-9][0-9]{0,13}$/", $value)) {
			throw new ValidationException("$name should be an ID");
		}

		return $value;
	}
}

class ValidatorInteger extends Validator
{
	private $_min;
	private $_max;

	public function __construct($min = null, $max = null)
	{
		$this->_min = $min;
		$this->_max = $max;
	}

	public function exec($name, $value)
	{
		if (!is_integer($value)) {
			throw new ValidationException("$name should be an integer");
		}

		if (($this->_min !== null && $value < $this->_min)
			|| ($this->_max !== null && $value > $this->_max)) {
			if ($this->_min === null) {
				throw new ValidationException("$name should not be greater than $this->_max");
			}
			else if ($this->_max === null) {
				throw new ValidationException("$name should not be less than $this->_min");
			}
			else {
				throw new ValidationException("$name should be between $this->_min and $this->_max");
			}
		}

		return $value;
	}
}


class ValidatorString extends Validator
{
	private $_minLength;
	private $_maxLength;

	public function __construct($minLength, $maxLength)
	{
		$this->_minLength = $minLength;
		$this->_maxLength = $maxLength;
	}

	public function exec($name, $value)
	{
		if (!is_string($value)) {
			throw new ValidationException("$name should be a string");
		}

		$len = strlen($value);
		if ($len < $this->_minLength || $len > $this->_maxLength) {
			throw new ValidationException("$name length should be between $this->_minLength and $this->_maxLength");
		}

		return $value;
	}
}
