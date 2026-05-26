package handlers

import (
	"api-passirence/internal/models"
	"api-passirence/internal/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

func CreateServicoHandler(c *gin.Context) {

	var servico models.Servico

	if err := c.ShouldBindJSON(&servico); err != nil {

		c.JSON(400, gin.H{
			"error": err.Error(),
		})

		return
	}

	err := services.CreateServico(&servico)

	if err != nil {

		c.JSON(500, gin.H{
			"error": err.Error(),
		})

		return
	}

	c.JSON(201, servico)
}

func GetAllServicosHandler(c *gin.Context) {

	servicos, err := services.GetServicos()

	if err != nil {

		c.JSON(500, gin.H{
			"error": err.Error(),
		})

		return
	}

	c.JSON(200, servicos)
}

func DeleteServicoHandler(c *gin.Context) {

	id := c.Param("id")

	idInt, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(400, gin.H{"error": "id inválido"})
		return
	}

	err = services.DeleteServico(idInt)

	if err != nil {

		c.JSON(500, gin.H{
			"error": err.Error(),
		})

		return
	}

	c.Status(204)
}

func UpdateServicoHandler(c *gin.Context) {

	idInt, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "id inválido"})
		return
	}

	var servico models.Servico

	if err := c.ShouldBindJSON(&servico); err != nil {

		c.JSON(400, gin.H{
			"error": err.Error(),
		})

		return
	}

	servico.ID = idInt

	err = services.UpdateServico(&servico)

	if err != nil {

		c.JSON(500, gin.H{
			"error": err.Error(),
		})

		return
	}

	c.JSON(200, servico)
}
