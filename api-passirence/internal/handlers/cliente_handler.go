package handlers

import (
	"api-passirence/internal/apperror"
	"api-passirence/internal/models"
	"api-passirence/internal/response"
	"api-passirence/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetClientesHandler(c *gin.Context) {
	clientes, err := services.GetClientes()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, clientes)
}

func GetClienteByPhoneHandler(c *gin.Context) {
	telefone := c.Query("telefone")
	if telefone == "" {
		response.Error(c, apperror.Validation("telefone é obrigatório"))
		return
	}

	cliente, err := services.GetClienteByTelefone(c.Request.Context(), telefone)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.JSON(c, http.StatusOK, cliente)
}

func GetClientesAtivosHandler(c *gin.Context) {
	clientes, err := services.GetClientesAtivos()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, clientes)
}

func CreateClienteHandler(c *gin.Context) {
	var cliente models.Cliente

	if err := c.ShouldBindJSON(&cliente); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	if err := services.CreateCliente(&cliente); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, cliente)
}

func UpdateClienteHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var cliente models.Cliente

	if err := c.ShouldBindJSON(&cliente); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	cliente.ID = id

	if err := services.UpdateCliente(&cliente); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, cliente)
}

func DeleteClienteHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	cliente := models.Cliente{ID: id}

	if err := services.DeleteCliente(&cliente); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Cliente deletado com sucesso",
	})
}

func ToggleAtivoClienteHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	if err := services.ActiveOrInactiveCliente(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Status do cliente alterado com sucesso",
	})
}
