package response

import (
	"api-passirence/internal/apperror"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestJSON_success(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	JSON(c, http.StatusOK, map[string]string{"id": "1"})

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}

	var body envelope
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if body.Error != nil {
		t.Fatalf("expected no error field, got %+v", body.Error)
	}
	if body.Data == nil {
		t.Fatal("expected data field")
	}
}

func TestError_withAppError(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	Error(c, apperror.NotFound("agendamento não encontrado"))

	if w.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", w.Code)
	}

	var body envelope
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if body.Error == nil {
		t.Fatal("expected error field")
	}
	if body.Error.Code != "NOT_FOUND" || body.Error.Message != "agendamento não encontrado" {
		t.Fatalf("unexpected error body: %+v", body.Error)
	}
}

func TestError_withGenericError(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	Error(c, assertErr("boom"))

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", w.Code)
	}

	var body envelope
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if body.Error == nil || body.Error.Code != "INTERNAL_ERROR" {
		t.Fatalf("unexpected error body: %+v", body.Error)
	}
}

type assertErr string

func (e assertErr) Error() string { return string(e) }
