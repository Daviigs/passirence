package services

import (
	"api-passirence/internal/apperror"
	"api-passirence/internal/models"
	"api-passirence/internal/phone"
	"api-passirence/internal/repositories"
	"context"
)

func GetClientes() ([]models.Cliente, error) {
	return repositories.GetClientes()
}

func GetClientesAtivos() ([]models.Cliente, error) {
	return repositories.GetClientesAtivos()
}

func CreateCliente(cliente *models.Cliente) error {
	cliente.Telefone = phone.Normalize(cliente.Telefone)
	return repositories.CreateCliente(cliente)
}

func UpdateCliente(cliente *models.Cliente) error {
	cliente.Telefone = phone.Normalize(cliente.Telefone)
	return repositories.UpdateCliente(cliente)
}

func GetClienteByTelefone(ctx context.Context, rawTelefone string) (*models.Cliente, error) {
	normalized := phone.Normalize(rawTelefone)
	if len(normalized) < 10 || len(normalized) > 11 {
		return nil, apperror.Validation("telefone inválido")
	}

	cliente, err := repositories.GetClienteByTelefone(ctx, normalized)
	if err != nil {
		if repositories.IsRecordNotFound(err) {
			return nil, apperror.New("CLIENT_NOT_FOUND", "Cliente não encontrado", 404)
		}
		return nil, apperror.Internal("falha ao buscar cliente")
	}

	cliente.Telefone = phone.Normalize(cliente.Telefone)
	return cliente, nil
}

func DeleteCliente(cliente *models.Cliente) error {
	return repositories.DeleteCliente(cliente)
}

func ActiveOrInactiveCliente(id int) error {
	cliente, err := repositories.GetClienteByID(context.Background(), id)
	if err != nil {
		return err
	}

	cliente.Ativo = !cliente.Ativo

	return repositories.ActiveOrInactiveCliente(cliente)
}
