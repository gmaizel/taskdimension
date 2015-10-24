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

abstract class EndPoint
{
	// Request completed successfully.
	const STATUS_SUCCESS = 200;

	// Server failed to parse the request body, or request does not contain all
	// required fields, or some of these fields are not in expected format or range.
	const STATUS_BAD_REQUEST = 400;

	// User is not authenticated or session expired.
	const STATUS_AUTH_FAIL = 401;

	// Current user does not have permission to perform requested operation.
	// For example, guest users cannot request to modify data.
	const STATUS_ACCESS_DENIED = 403;

	// Specified object does not exist or is not visible to the current user.
	const STATUS_NOT_FOUND = 404;

	// HTTP method is not supported (must be POST).
	const STATUS_BAD_METHOD = 405;

	// HTTP content type is not supported (must be application/json).
	const STATUS_BAD_MEDIA_TYPE = 415;

	// Request failed due to server-related problem.
	const STATUS_SERVER_ERROR = 500;

	const FIELD_ERROR_MESSAGE = "message";

	const COOKIE_AUTH = "auth";

	private $_session = null;
	private $_db = null;

	protected abstract function getRequestValidator();
	protected abstract function getResponseValidator();
	protected abstract function handleRequest(array $request);
	protected function shouldValidteSession() { return true; }

	protected final function getSession()
	{
		return $this->_session;
	}

	public function handle()
	{
		try {
			// Make sure all warnings are properly intercepted
			set_error_handler(function($errno, $errstr, $errfile, $errline, array $errcontext) {
				error_log("$errstr in $errfile on line $errline");
				throw new Exception("PHP error at $errfile:$errline: $errstr");
			});

			if ($this->shouldValidteSession()) {
				$this->validateSession();
			}

			$args = $this->parseRequest();

			try {
				$args = $this->getRequestValidator()->exec("REQUEST", $args);
			}
			catch (Validator\ValidationException $e) {
				throw new Exception($e->getMessage(), self::STATUS_BAD_REQUEST);
			}

			$result = null;
			Model::beginTransaction();
			try {
				$result = $this->handleRequest($args);
				$result = $this->getResponseValidator()->exec("RESPONSE", $result);
				Model::commitTransaction();
			}
			catch (Validator\ValidationException $e) {
				Model::rollbackTransaction();
				throw new Exception($e->getMessage(), self::STATUS_SERVER_ERROR);
			}
			catch (Exception $e) {
				Model::rollbackTransaction();
				throw $e;
			}

			$this->sendResponse(self::STATUS_SUCCESS, $result);
		}
		catch(Exception $e) {
			$code = $e->getCode() ?: self::STATUS_SERVER_ERROR;
			$message = $e->getMessage();
			$this->sendResponse($code, array(
				self::FIELD_ERROR_MESSAGE => $message
			));
		}
	}

	private function validateSession()
	{
		// FIXME:
	}

	private function parseRequest()
	{
		if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
			throw new Exception("Unsupported HTTP method", self::STATUS_BAD_METHOD);
		}

		if ($_SERVER['CONTENT_TYPE'] !== 'application/json; charset=UTF-8') {
			throw new Exception("Unsupported content type", self::STATUS_BAD_MEDIA_TYPE);
		}

		$requestJson = file_get_contents("php://input");
		$request = json_decode($requestJson, true);

		if ($request == null) {
			throw new Exception("Failed to parse request body", self::STATUS_BAD_REQUEST);
		}

		return $request;
	}

	private function sendResponse($code, array $response)
	{
		header("HTTP/1.0 $code");
		header("Content-Type: application/json; charset=UTF-8");
		$json = json_encode($response) ?: "{}";
		echo ($json === "[]") ? "{}" : $json;
	}
}
