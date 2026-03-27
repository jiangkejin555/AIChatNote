package services

import (
	"bytes"
	"crypto/tls"
	"errors"
	"fmt"
	"net/smtp"
	"strings"
	"time"

	"github.com/chat-note/backend/internal/config"
	"github.com/chat-note/backend/internal/utils"
)

type EmailService struct {
	config *config.SMTPConfig
}

func NewEmailService(cfg *config.SMTPConfig) *EmailService {
	return &EmailService{
		config: cfg,
	}
}

func (s *EmailService) SendVerificationCode(to, code string) error {
	if !s.config.IsEnabled() {
		return errors.New("SMTP service is not enabled")
	}

	subject := "您的验证码 - AI Chat Notes"
	body := s.buildVerificationCodeEmail(code)

	return s.SendEmail(to, subject, body)
}

func (s *EmailService) SendEmail(to, subject, body string) error {
	if !s.config.IsEnabled() {
		return errors.New("SMTP service is not enabled")
	}

	from := s.config.From
	if from == "" {
		from = s.config.Username
	}

	fromName := s.config.FromName
	if fromName == "" {
		fromName = "AI Chat Notes"
	}

	msg := s.buildMessage(from, fromName, to, subject, body)

	start := time.Now()
	err := s.sendViaSMTP(from, to, []byte(msg))
	latency := time.Since(start)

	if err != nil {
		utils.LogExternalCallError("EmailService", "SMTP", err, "to", utils.MaskEmail(to))
		return err
	}

	utils.LogExternalCall("EmailService", "SMTP", "email", latency, "to", utils.MaskEmail(to))
	return nil
}

func (s *EmailService) sendViaSMTP(from, to string, msg []byte) error {
	addr := fmt.Sprintf("%s:%d", s.config.Host, s.config.Port)

	var auth smtp.Auth
	if s.config.Username != "" && s.config.Password != "" {
		auth = smtp.PlainAuth("", s.config.Username, s.config.Password, s.config.Host)
	}

	if s.config.UseTLS {
		return s.sendWithTLS(addr, auth, from, to, msg)
	}

	return smtp.SendMail(addr, auth, from, []string{to}, msg)
}

func (s *EmailService) sendWithTLS(addr string, auth smtp.Auth, from, to string, msg []byte) error {
	tlsConfig := &tls.Config{
		InsecureSkipVerify: false,
		ServerName:         s.config.Host,
	}

	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err != nil {
		return fmt.Errorf("TLS connection failed: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, s.config.Host)
	if err != nil {
		return fmt.Errorf("failed to create SMTP client: %w", err)
	}
	defer client.Close()

	if auth != nil {
		if err := client.Auth(auth); err != nil {
			return fmt.Errorf("SMTP authentication failed: %w", err)
		}
	}

	if err := client.Mail(from); err != nil {
		return fmt.Errorf("failed to set sender: %w", err)
	}

	if err := client.Rcpt(to); err != nil {
		return fmt.Errorf("failed to set recipient: %w", err)
	}

	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("failed to get data writer: %w", err)
	}

	_, err = w.Write(msg)
	if err != nil {
		return fmt.Errorf("failed to write message: %w", err)
	}

	if err := w.Close(); err != nil {
		return fmt.Errorf("failed to close writer: %w", err)
	}

	return client.Quit()
}

func (s *EmailService) buildMessage(from, fromName, to, subject, body string) string {
	var buf bytes.Buffer

	buf.WriteString(fmt.Sprintf("From: %s <%s>\r\n", fromName, from))
	buf.WriteString(fmt.Sprintf("To: %s\r\n", to))
	buf.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	buf.WriteString("MIME-Version: 1.0\r\n")
	buf.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
	buf.WriteString("\r\n")
	buf.WriteString(body)

	return buf.String()
}

func (s *EmailService) buildVerificationCodeEmail(code string) string {
	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            margin-top: 20px;
        }
        .code-box {
            background-color: #fff;
            border: 2px dashed #4A90E2;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }
        .code {
            font-size: 32px;
            font-weight: bold;
            color: #4A90E2;
            letter-spacing: 8px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
            text-align: center;
        }
        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 10px 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>验证码通知</h2>
        <p>您好！</p>
        <p>您正在登录 <strong>AI Chat Notes</strong>，您的验证码是：</p>
        
        <div class="code-box">
            <span class="code">%s</span>
        </div>
        
        <div class="warning">
            <strong>⚠️ 安全提示：</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>验证码有效期为 <strong>10 分钟</strong></li>
                <li>请勿将验证码告知他人</li>
                <li>如非本人操作，请忽略此邮件</li>
            </ul>
        </div>
        
        <p>如果您没有请求此验证码，请忽略此邮件。</p>
        
        <div class="footer">
            <p>此邮件由系统自动发送，请勿直接回复。</p>
            <p>&copy; %d AI Chat Notes. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`, code, time.Now().Year())
}

func (s *EmailService) IsEnabled() bool {
	return s.config.IsEnabled()
}

func IsValidEmail(email string) bool {
	if email == "" {
		return false
	}

	atIndex := strings.Index(email, "@")
	if atIndex <= 0 || atIndex >= len(email)-1 {
		return false
	}

	dotIndex := strings.LastIndex(email, ".")
	if dotIndex <= atIndex+1 || dotIndex >= len(email)-1 {
		return false
	}

	return true
}
