package models

type Profissional struct {
	ID       int    `json:"id"`
	Nome     string `json:"nome"`
	Telefone string `json:"telefone"`
	Ativo    bool   `json:"ativo"`
}

func (Profissional) TableName() string {
	return "profissional"
}
