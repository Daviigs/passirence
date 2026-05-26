package repositories

import (
	"api-passirence/internal/database"
	"api-passirence/internal/models"
	"context"
)

func GetClientes() ([]models.Cliente, error) {
	var clientes []models.Cliente
	err := database.DB.Find(&clientes).Error
	return clientes, err
}

func GetClientesByIDs(ctx context.Context, ids []int) ([]models.Cliente, error) {
	if len(ids) == 0 {
		return []models.Cliente{}, nil
	}

	var clientes []models.Cliente
	err := database.DB.WithContext(ctx).Where("id IN ?", ids).Find(&clientes).Error
	return clientes, err
}

func GetClientesAtivos() ([]models.Cliente, error) {
	var clientes []models.Cliente
	err := database.DB.Where("ativo = ?", true).Find(&clientes).Error
	return clientes, err
}

func CreateCliente(cliente *models.Cliente) error {
	return database.DB.Create(cliente).Error
}

func UpdateCliente(cliente *models.Cliente) error {
	return database.DB.Save(cliente).Error
}

func DeleteCliente(cliente *models.Cliente) error {
	return database.DB.Delete(cliente).Error
}

func GetClienteByID(ctx context.Context, id int) (*models.Cliente, error) {
	var cliente models.Cliente
	err := database.DB.WithContext(ctx).First(&cliente, id).Error
	return &cliente, err
}

// GetClienteByTelefone returns a client whose phone matches exactly after normalization.
func GetClienteByTelefone(ctx context.Context, telefone string) (*models.Cliente, error) {
	var cliente models.Cliente
	err := database.DB.WithContext(ctx).
		Where("regexp_replace(telefone, '[^0-9]', '', 'g') = ?", telefone).
		First(&cliente).Error
	return &cliente, err
}

func ActiveOrInactiveCliente(cliente *models.Cliente) error {
	return database.DB.Model(cliente).Update("ativo", cliente.Ativo).Error
}
