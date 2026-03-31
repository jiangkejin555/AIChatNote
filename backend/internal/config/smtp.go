package config

type SMTPConfig struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	Username string `yaml:"username"`
	Password string `yaml:"password"`
	From     string `yaml:"from"`
	FromName string `yaml:"from_name"`
	UseTLS   bool   `yaml:"use_tls"`
	Enabled  bool   `yaml:"enabled"`
}

func (c *SMTPConfig) IsEnabled() bool {
	return c.Enabled && c.Host != "" && c.Username != "" && c.Password != ""
}

type ResendConfig struct {
	APIKey   string `yaml:"api_key"`
	From     string `yaml:"from"`
	FromName string `yaml:"from_name"`
	Enabled  bool   `yaml:"enabled"`
}

func (c *ResendConfig) IsEnabled() bool {
	return c.Enabled && c.APIKey != "" && c.From != ""
}
