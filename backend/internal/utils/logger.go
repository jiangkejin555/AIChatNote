package utils

import (
	"log/slog"
	"strings"
	"time"
)

// MaskAPIKey masks an API key, showing only first 4 and last 4 characters
func MaskAPIKey(key string) string {
	if key == "" {
		return "<empty>"
	}
	if len(key) <= 8 {
		return "****"
	}
	return key[:4] + "****" + key[len(key)-4:]
}

// MaskToken masks a token, showing only first 8 characters
func MaskToken(token string) string {
	if token == "" {
		return "<empty>"
	}
	if len(token) <= 16 {
		return "****"
	}
	return token[:8] + "****"
}

// MaskEmail partially masks an email address
func MaskEmail(email string) string {
	if email == "" {
		return "<empty>"
	}
	atIndex := strings.Index(email, "@")
	if atIndex <= 1 {
		return "****"
	}
	if atIndex <= 3 {
		return email[:1] + "****" + email[atIndex:]
	}
	return email[:2] + "****" + email[atIndex:]
}

// LogOperationStart logs the start of an operation
func LogOperationStart(module, operation string, fields ...any) {
	args := []any{"module", module, "operation", operation}
	args = append(args, fields...)
	slog.Info("["+module+"] "+operation+" started", args...)
}

// LogOperationSuccess logs successful completion of an operation
func LogOperationSuccess(module, operation string, fields ...any) {
	args := []any{"module", module, "operation", operation}
	args = append(args, fields...)
	slog.Info("["+module+"] "+operation+" success", args...)
}

// LogOperationError logs an operation failure
func LogOperationError(module, operation string, err error, fields ...any) {
	args := []any{"module", module, "operation", operation, "error", err}
	args = append(args, fields...)
	slog.Error("["+module+"] "+operation+" failed", args...)
}

// LogLatency logs operation latency information
func LogLatency(module, operation string, latency time.Duration, fields ...any) {
	args := []any{"module", module, "operation", operation, "latency_ms", latency.Milliseconds()}
	args = append(args, fields...)
	slog.Info("["+module+"] "+operation+" completed", args...)
}

// LogLatencyWithSlowWarning logs latency and warns if slow (>5s)
func LogLatencyWithSlowWarning(module, operation string, latency time.Duration, fields ...any) {
	args := []any{"module", module, "operation", operation, "latency_ms", latency.Milliseconds()}
	args = append(args, fields...)
	if latency > 5*time.Second {
		args = append(args, "slow", true)
		slog.Warn("["+module+"] "+operation+" completed (slow)", args...)
	} else {
		slog.Info("["+module+"] "+operation+" completed", args...)
	}
}

// LogExternalCall logs an external API call
func LogExternalCall(module, provider, model string, latency time.Duration, fields ...any) {
	args := []any{
		"module", module,
		"provider", provider,
		"model", model,
		"latency_ms", latency.Milliseconds(),
	}
	args = append(args, fields...)
	slog.Info("["+module+"] external call completed", args...)
}

// LogExternalCallError logs an external API call failure
func LogExternalCallError(module, provider string, err error, fields ...any) {
	args := []any{
		"module", module,
		"provider", provider,
		"error", err,
	}
	args = append(args, fields...)
	slog.Error("["+module+"] external call failed", args...)
}

// LogAuthEvent logs authentication-related events
func LogAuthEvent(event string, success bool, fields ...any) {
	args := []any{"event", event, "success", success}
	args = append(args, fields...)
	if success {
		slog.Info("[Auth] "+event, args...)
	} else {
		slog.Warn("[Auth] "+event+" failed", args...)
	}
}

// LogInfo logs a general info message with module context
func LogInfo(module, operation string, fields ...any) {
	args := []any{"module", module, "operation", operation}
	args = append(args, fields...)
	slog.Info("["+module+"] "+operation, args...)
}

// LogWarn logs a warning message with module context
func LogWarn(module, operation string, fields ...any) {
	args := []any{"module", module, "operation", operation}
	args = append(args, fields...)
	slog.Warn("["+module+"] "+operation, args...)
}
