package models

type Servico struct {
	ID      int     `json:"id"`
	Nome    string  `json:"nome"`
	Duracao int     `json:"duracao"`
	Preco   float64 `json:"preco"`
}
