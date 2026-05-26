package phone

import "testing"

func TestNormalize(t *testing.T) {
	tests := []struct {
		in   string
		want string
	}{
		{"11999999999", "11999999999"},
		{"(11) 99999-9999", "11999999999"},
		{"11 99999 9999", "11999999999"},
		{"", ""},
		{"+55 (11) 98888-7777", "5511988887777"},
	}

	for _, tt := range tests {
		if got := Normalize(tt.in); got != tt.want {
			t.Errorf("Normalize(%q) = %q, want %q", tt.in, got, tt.want)
		}
	}
}
