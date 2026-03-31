package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/smtp"
	"strings"
	"time"

	"github.com/chat-note/backend/internal/config"
	"github.com/chat-note/backend/internal/utils"
)

type EmailService struct {
	smtpConfig   *config.SMTPConfig
	resendConfig *config.ResendConfig
}

func NewEmailService(smtpCfg *config.SMTPConfig, resendCfg *config.ResendConfig) *EmailService {
	return &EmailService{
		smtpConfig:   smtpCfg,
		resendConfig: resendCfg,
	}
}

func (s *EmailService) SendVerificationCode(to, code string) error {
	if !s.IsEnabled() {
		return errors.New("email service is not enabled")
	}

	subject := "您的验证码 - AI Chat Note"
	body := s.buildVerificationCodeEmail(code)

	return s.SendEmail(to, subject, body)
}

func (s *EmailService) SendEmail(to, subject, body string) error {
	if s.resendConfig.IsEnabled() {
		return s.sendViaResend(to, subject, body)
	}
	if s.smtpConfig.IsEnabled() {
		return s.sendViaSMTP(to, subject, body)
	}
	return errors.New("email service is not enabled")
}

func (s *EmailService) sendViaResend(to, subject, body string) error {
	fromName := s.resendConfig.FromName
	if fromName == "" {
		fromName = "AI Chat Note"
	}

	payload := map[string]interface{}{
		"from":    fmt.Sprintf("%s <%s>", fromName, s.resendConfig.From),
		"to":      []string{to},
		"subject": subject,
		"html":    body,
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal email payload: %w", err)
	}

	start := time.Now()
	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.resendConfig.APIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	latency := time.Since(start)

	if err != nil {
		utils.LogExternalCallError("EmailService", "Resend", err, "to", utils.MaskEmail(to))
		return fmt.Errorf("resend API request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		err := fmt.Errorf("resend API returned status %d: %s", resp.StatusCode, string(respBody))
		utils.LogExternalCallError("EmailService", "Resend", err, "to", utils.MaskEmail(to))
		return err
	}

	utils.LogExternalCall("EmailService", "Resend", "email", latency, "to", utils.MaskEmail(to))
	return nil
}

func (s *EmailService) sendViaSMTP(to, subject, body string) error {
	from := s.smtpConfig.From
	if from == "" {
		from = s.smtpConfig.Username
	}

	fromName := s.smtpConfig.FromName
	if fromName == "" {
		fromName = "AI Chat Note"
	}

	msg := s.buildMessage(from, fromName, to, subject, body)

	addr := fmt.Sprintf("%s:%d", s.smtpConfig.Host, s.smtpConfig.Port)

	var auth smtp.Auth
	if s.smtpConfig.Username != "" && s.smtpConfig.Password != "" {
		auth = smtp.PlainAuth("", s.smtpConfig.Username, s.smtpConfig.Password, s.smtpConfig.Host)
	}

	start := time.Now()
	err := smtp.SendMail(addr, auth, from, []string{to}, []byte(msg))
	latency := time.Since(start)

	if err != nil {
		utils.LogExternalCallError("EmailService", "SMTP", err, "to", utils.MaskEmail(to))
		return err
	}

	utils.LogExternalCall("EmailService", "SMTP", "email", latency, "to", utils.MaskEmail(to))
	return nil
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
        <p>您正在登录 <strong>AI Chat Note</strong>，您的验证码是：</p>

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
            <p>&copy; %d AI Chat Note. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`, code, time.Now().Year())
}

func (s *EmailService) IsEnabled() bool {
	return s.resendConfig.IsEnabled() || s.smtpConfig.IsEnabled()
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
