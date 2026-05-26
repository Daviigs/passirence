package response

import (
	"api-passirence/internal/apperror"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

type errorBody struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type envelope struct {
	Data    any        `json:"data,omitempty"`
	Error   *errorBody `json:"error,omitempty"`
	Message string     `json:"message,omitempty"`
}

func JSON(c *gin.Context, status int, data any) {
	c.JSON(status, envelope{Data: data})
}

func Error(c *gin.Context, err error) {
	var appErr *apperror.AppError
	if errors.As(err, &appErr) {
		c.JSON(appErr.HTTPStatus, envelope{
			Error: &errorBody{
				Code:    appErr.Code,
				Message: appErr.Message,
			},
		})
		return
	}

	c.JSON(http.StatusInternalServerError, envelope{
		Error: &errorBody{
			Code:    "INTERNAL_ERROR",
			Message: "erro interno do servidor",
		},
	})
}
