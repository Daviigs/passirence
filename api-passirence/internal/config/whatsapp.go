package config

import (
	"os"
	"strconv"
	"time"
)

const (
	defaultWhatsAppAPIURL     = "http://localhost:3001"
	defaultWhatsAppAPITimeout = 5 * time.Second
)

// WhatsAppConfig holds HTTP client settings for the WhatsApp API integration.
type WhatsAppConfig struct {
	BaseURL string
	APIKey  string
	Timeout time.Duration
	Enabled bool
}

// LoadWhatsAppConfig reads WhatsApp integration settings from environment variables.
//
// WHATSAPP_API_URL      — base URL (default http://localhost:3001; empty disables integration)
// WHATSAPP_API_TIMEOUT  — timeout in seconds (default 5)
// WHATSAPP_API_KEY      — optional X-API-Key header
func LoadWhatsAppConfig() WhatsAppConfig {
	baseURL := os.Getenv("WHATSAPP_API_URL")
	if baseURL == "" {
		baseURL = defaultWhatsAppAPIURL
	}

	timeout := defaultWhatsAppAPITimeout
	if raw := os.Getenv("WHATSAPP_API_TIMEOUT"); raw != "" {
		if seconds, err := strconv.Atoi(raw); err == nil && seconds > 0 {
			timeout = time.Duration(seconds) * time.Second
		}
	}

	disabled := os.Getenv("WHATSAPP_API_DISABLED") == "true" || os.Getenv("WHATSAPP_API_DISABLED") == "1"

	return WhatsAppConfig{
		BaseURL: baseURL,
		APIKey:  os.Getenv("WHATSAPP_API_KEY"),
		Timeout: timeout,
		Enabled: !disabled && baseURL != "",
	}
}
