package apperror

import (
	"errors"
	"testing"
)

func TestAppError_Error(t *testing.T) {
	err := New("TEST_CODE", "mensagem de teste", 400)
	if err.Error() != "mensagem de teste" {
		t.Fatalf("Error() = %q, want %q", err.Error(), "mensagem de teste")
	}
}

func TestNew(t *testing.T) {
	err := New("CODE", "msg", 422)
	if err.Code != "CODE" || err.Message != "msg" || err.HTTPStatus != 422 {
		t.Fatalf("unexpected AppError: %+v", err)
	}
}

func TestValidation(t *testing.T) {
	err := Validation("campo inválido")
	assertAppError(t, err, "VALIDATION_ERROR", "campo inválido", 400)
}

func TestNotFound(t *testing.T) {
	err := NotFound("recurso não encontrado")
	assertAppError(t, err, "NOT_FOUND", "recurso não encontrado", 404)
}

func TestConflict(t *testing.T) {
	err := Conflict("conflito de horário")
	assertAppError(t, err, "CONFLICT", "conflito de horário", 409)
}

func TestForbidden(t *testing.T) {
	err := Forbidden("acesso negado")
	assertAppError(t, err, "FORBIDDEN", "acesso negado", 403)
}

func TestInternal(t *testing.T) {
	err := Internal("falha interna")
	assertAppError(t, err, "INTERNAL_ERROR", "falha interna", 500)
}

func TestAsAppError_withAppError(t *testing.T) {
	original := Validation("erro de validação")
	got := AsAppError(original)
	if got != original {
		t.Fatalf("expected same pointer, got %+v", got)
	}
}

func TestAsAppError_withGenericError(t *testing.T) {
	got := AsAppError(errors.New("erro genérico"))
	assertAppError(t, got, "INTERNAL_ERROR", "erro interno do servidor", 500)
}

func TestAsAppError_withNil(t *testing.T) {
	got := AsAppError(nil)
	assertAppError(t, got, "INTERNAL_ERROR", "erro interno do servidor", 500)
}

func assertAppError(t *testing.T, err *AppError, code, message string, status int) {
	t.Helper()
	if err.Code != code || err.Message != message || err.HTTPStatus != status {
		t.Fatalf("AppError = %+v, want code=%q message=%q status=%d", err, code, message, status)
	}
}
