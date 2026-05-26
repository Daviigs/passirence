package services

import (
	"api-passirence/internal/models"
	"api-passirence/internal/repositories"
	"context"
)

func GetProfissionais() ([]models.Profissional, error) {
	return repositories.GetProfissionais()
}

func GetProfissionaisAtivos() ([]models.Profissional, error) {
	return repositories.GetProfissionaisAtivos()
}

func CreateProfissional(profissional *models.Profissional) error {

	return repositories.CreateProfissional(profissional)
}

func UpdateProfissional(profissional *models.Profissional) error {

	return repositories.UpdateProfissional(profissional)
}

func DeleteProfissional(profissional *models.Profissional) error {

	return repositories.DeleteProfissional(profissional)
}

func ActiveOrInactiveProfissional(id int) error {

	profissional, err := repositories.GetProfissionalByID(context.Background(), id)
	if err != nil {
		return err
	}

	profissional.Ativo = !profissional.Ativo

	return repositories.ActiveOrInactiveProfissional(profissional)
}
