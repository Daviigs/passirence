package repositories

import (
	"api-passirence/internal/database"
	"api-passirence/internal/models"
	"context"
)

func GetProfissionais() ([]models.Profissional, error) {

	var profissionais []models.Profissional

	err := database.DB.Find(&profissionais).Error

	return profissionais, err
}

func GetProfissionaisByIDs(ctx context.Context, ids []int) ([]models.Profissional, error) {
	if len(ids) == 0 {
		return []models.Profissional{}, nil
	}

	var profissionais []models.Profissional
	err := database.DB.WithContext(ctx).Where("id IN ?", ids).Find(&profissionais).Error
	return profissionais, err
}

func GetProfissionaisAtivos() ([]models.Profissional, error) {

	var profissionais []models.Profissional

	err := database.DB.Where("ativo = ?", true).Find(&profissionais).Error

	return profissionais, err
}

func CreateProfissional(profissional *models.Profissional) error {

	return database.DB.Create(profissional).Error
}

func UpdateProfissional(profissional *models.Profissional) error {

	return database.DB.Save(profissional).Error
}

func DeleteProfissional(profissional *models.Profissional) error {

	return database.DB.Delete(profissional).Error
}

func GetProfissionalByID(ctx context.Context, id int) (*models.Profissional, error) {
	var profissional models.Profissional
	err := database.DB.WithContext(ctx).First(&profissional, id).Error
	return &profissional, err
}

func ActiveOrInactiveProfissional(profissional *models.Profissional) error {

	return database.DB.Model(profissional).Update("ativo", profissional.Ativo).Error
}
