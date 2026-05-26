package phone

import "regexp"

var nonDigit = regexp.MustCompile(`\D`)

// Normalize removes spaces, dashes, parentheses and any non-digit characters.
func Normalize(raw string) string {
	return nonDigit.ReplaceAllString(raw, "")
}
