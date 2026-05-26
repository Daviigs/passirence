package handlers

import (
	"api-passirence/internal/models"
	"api-passirence/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetProfissionaisHandler(c *gin.Context) {

	profissionais, err := services.GetProfissionais()

	if err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})

		return
	}

	c.JSON(http.StatusOK, profissionais)
}

func GetProfissionaisAtivosHandler(c *gin.Context) {

	profissionais, err := services.GetProfissionaisAtivos()

	if err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})

		return
	}

	c.JSON(http.StatusOK, profissionais)
}

func CreateProfissionalHandler(c *gin.Context) {

	var profissional models.Profissional

	if err := c.ShouldBindJSON(&profissional); err != nil {

		c.JSON(400, gin.H{
			"error": err.Error(),
		})

		return
	}

	err := services.CreateProfissional(&profissional)

	if err != nil {

		c.JSON(500, gin.H{
			"error": err.Error(),
		})

		return
	}

	c.JSON(201, profissional)
}

func UpdateProfissionalHandler(c *gin.Context) {

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var profissional models.Profissional

	if err := c.ShouldBindJSON(&profissional); err != nil {

		c.JSON(400, gin.H{
			"error": err.Error(),
		})

		return
	}

	profissional.ID = id

	err = services.UpdateProfissional(&profissional)

	if err != nil {

		c.JSON(500, gin.H{
			"error": err.Error(),
		})

		return
	}

	c.JSON(200, profissional)
}

func DeleteProfissionalHandler(c *gin.Context) {

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	var profissional models.Profissional

	profissional.ID = id

	err = services.DeleteProfissional(&profissional)

	if err != nil {

		c.JSON(500, gin.H{
			"error": err.Error(),
		})

		return
	}

	c.JSON(200, gin.H{
		"message": "Profissional deletado com sucesso",
	})
}

func ToggleAtivoProfissionalHandler(c *gin.Context) {

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id inválido"})
		return
	}

	if err := services.ActiveOrInactiveProfissional(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Status do profissional alterado com sucesso",
	})
}
