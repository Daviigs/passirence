package repositories

import (
	"api-passirence/internal/database"
	"api-passirence/internal/models"
	"context"
)

func CreateServico(servico *models.Servico) error {

	return database.DB.Create(servico).Error
}

func GetServicos() ([]models.Servico, error) {

	var servicos []models.Servico

	err := database.DB.Find(&servicos).Error

	return servicos, err
}

func DeleteServico(id int) error {

	return database.DB.Delete(&models.Servico{}, id).Error
}

func UpdateServico(servico *models.Servico) error {

	return database.DB.Save(servico).Error
}

func GetServicosByIDs(ctx context.Context, ids []int) ([]models.Servico, error) {
	var servicos []models.Servico

	err := database.DB.WithContext(ctx).Where("id IN ?", ids).Find(&servicos).Error

	return servicos, err
}
