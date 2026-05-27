package apperror

import "errors"

type AppError struct {
	Code       string
	Message    string
	HTTPStatus int
}

func (e *AppError) Error() string {
	return e.Message
}

func New(code, message string, httpStatus int) *AppError {
	return &AppError{
		Code:       code,
		Message:    message,
		HTTPStatus: httpStatus,
	}
}

func Validation(message string) *AppError {
	return New("VALIDATION_ERROR", message, 400)
}

func NotFound(message string) *AppError {
	return New("NOT_FOUND", message, 404)
}

func Conflict(message string) *AppError {
	return New("CONFLICT", message, 409)
}

func Forbidden(message string) *AppError {
	return New("FORBIDDEN", message, 403)
}

func Internal(message string) *AppError {
	return New("INTERNAL_ERROR", message, 500)
}

func AsAppError(err error) *AppError {
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr
	}
	return Internal("erro interno do servidor")
}
