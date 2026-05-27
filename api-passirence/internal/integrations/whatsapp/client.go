package whatsapp

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"api-passirence/internal/config"
)

// Client performs HTTP calls to the WhatsApp API.
type Client struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
	enabled    bool
}

func NewClient(cfg config.WhatsAppConfig) *Client {
	return &Client{
		baseURL: cfg.BaseURL,
		apiKey:  cfg.APIKey,
		httpClient: &http.Client{
			Timeout: cfg.Timeout,
		},
		enabled: cfg.Enabled,
	}
}

func (c *Client) Enabled() bool {
	return c.enabled
}

func (c *Client) SendAppointmentConfirmation(
	ctx context.Context,
	payload AppointmentConfirmationRequest,
) error {
	if !c.enabled {
		return nil
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("whatsapp: marshal payload: %w", err)
	}

	url := c.baseURL + "/messages/appointment/confirmation"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("whatsapp: create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if c.apiKey != "" {
		req.Header.Set("X-API-Key", c.apiKey)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("whatsapp: request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return nil
	}

	var errResp apiErrorResponse
	if json.Unmarshal(respBody, &errResp) == nil && errResp.Error != "" {
		return fmt.Errorf("whatsapp: status %d: %s", resp.StatusCode, errResp.Error)
	}

	return fmt.Errorf("whatsapp: status %d: %s", resp.StatusCode, string(respBody))
}
