package models

type Cliente struct {
	ID       int    `json:"id"`
	Nome     string `json:"nome"`
	Telefone string `json:"telefone" gorm:"index"`
	Ativo    bool   `json:"ativo"`
}

func (Cliente) TableName() string {
	return "cliente"
}
