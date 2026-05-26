package services

import (
	"api-passirence/internal/models"
	"api-passirence/internal/repositories"
)

func CreateServico(servico *models.Servico) error {

	return repositories.CreateServico(servico)
}

func GetServicos() ([]models.Servico, error) {

	return repositories.GetServicos()
}

func DeleteServico(id int) error {

	return repositories.DeleteServico(id)
}

func UpdateServico(servico *models.Servico) error {

	return repositories.UpdateServico(servico)
}
