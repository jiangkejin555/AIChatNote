package services

import (
	"testing"

	"github.com/chat-note/backend/internal/config"
	"github.com/chat-note/backend/internal/models"
	"github.com/stretchr/testify/assert"
)

func TestContextConfigService(t *testing.T) {
	// Create test config with known values
	cfg := &config.Config{
		Context: config.ContextConfig{
			DefaultMode:  "simple",
			DefaultLevel: "normal",
			Summary: config.ContextSummaryConfig{
				MaxTokens: 300,
				Short: config.ContextSummaryParams{
					WindowAutoSize:         10,
					KeepRecentCount:        5,
					SummaryUpdateFrequency: 3,
				},
				Normal: config.ContextSummaryParams{
					WindowAutoSize:         20,
					KeepRecentCount:        10,
					SummaryUpdateFrequency: 5,
				},
				Long: config.ContextSummaryParams{
					WindowAutoSize:         40,
					KeepRecentCount:        20,
					SummaryUpdateFrequency: 10,
				},
			},
			Simple: config.ContextSimpleConfig{
				Short: config.ContextSimpleParams{
					HistoryLimit: 5,
				},
				Normal: config.ContextSimpleParams{
					HistoryLimit: 10,
				},
				Long: config.ContextSimpleParams{
					HistoryLimit: 15,
				},
			},
		},
	}

	svc := NewContextConfigService(cfg)

	t.Run("GetDefaultMode returns configured default", func(t *testing.T) {
		mode := svc.GetDefaultMode()
		assert.Equal(t, models.ContextModeSimple, mode)
	})

	t.Run("GetDefaultLevel returns configured default", func(t *testing.T) {
		level := svc.GetDefaultLevel()
		assert.Equal(t, models.MemoryLevelNormal, level)
	})

	t.Run("GetContextParams for summary mode with short level", func(t *testing.T) {
		params := svc.GetContextParams(models.ContextModeSummary, models.MemoryLevelShort)
		assert.Equal(t, models.ContextModeSummary, params.Mode)
		assert.Equal(t, models.MemoryLevelShort, params.MemoryLevel)
		assert.Equal(t, 10, params.WindowAutoSize)
		assert.Equal(t, 5, params.KeepRecentCount)
		assert.Equal(t, 3, params.SummaryUpdateFrequency)
		assert.Equal(t, 0, params.HistoryLimit) // Not used in summary mode
		assert.Equal(t, 300, params.SummaryMaxTokens)
	})

	t.Run("GetContextParams for summary mode with normal level", func(t *testing.T) {
		params := svc.GetContextParams(models.ContextModeSummary, models.MemoryLevelNormal)
		assert.Equal(t, 20, params.WindowAutoSize)
		assert.Equal(t, 10, params.KeepRecentCount)
		assert.Equal(t, 5, params.SummaryUpdateFrequency)
	})

	t.Run("GetContextParams for summary mode with long level", func(t *testing.T) {
		params := svc.GetContextParams(models.ContextModeSummary, models.MemoryLevelLong)
		assert.Equal(t, 40, params.WindowAutoSize)
		assert.Equal(t, 20, params.KeepRecentCount)
		assert.Equal(t, 10, params.SummaryUpdateFrequency)
	})

	t.Run("GetContextParams for simple mode with short level", func(t *testing.T) {
		params := svc.GetContextParams(models.ContextModeSimple, models.MemoryLevelShort)
		assert.Equal(t, models.ContextModeSimple, params.Mode)
		assert.Equal(t, models.MemoryLevelShort, params.MemoryLevel)
		assert.Equal(t, 0, params.WindowAutoSize)         // Not used in simple mode
		assert.Equal(t, 0, params.KeepRecentCount)        // Not used in simple mode
		assert.Equal(t, 0, params.SummaryUpdateFrequency) // Not used in simple mode
		assert.Equal(t, 5, params.HistoryLimit)
	})

	t.Run("GetContextParams for simple mode with normal level", func(t *testing.T) {
		params := svc.GetContextParams(models.ContextModeSimple, models.MemoryLevelNormal)
		assert.Equal(t, 10, params.HistoryLimit)
	})

	t.Run("GetContextParams for simple mode with long level", func(t *testing.T) {
		params := svc.GetContextParams(models.ContextModeSimple, models.MemoryLevelLong)
		assert.Equal(t, 15, params.HistoryLimit)
	})

	t.Run("ShouldGenerateSummary returns false for simple mode", func(t *testing.T) {
		params := svc.GetContextParams(models.ContextModeSimple, models.MemoryLevelNormal)
		should := svc.ShouldGenerateSummary(50, params, 0)
		assert.False(t, should)
	})

	t.Run("ShouldGenerateSummary returns false when messages <= WindowAutoSize", func(t *testing.T) {
		params := svc.GetContextParams(models.ContextModeSummary, models.MemoryLevelNormal)
		// Normal level has WindowAutoSize = 20
		should := svc.ShouldGenerateSummary(20, params, 0)
		assert.False(t, should)
		should = svc.ShouldGenerateSummary(15, params, 0)
		assert.False(t, should)
	})

	t.Run("ShouldGenerateSummary returns true when no summary exists and messages > WindowAutoSize", func(t *testing.T) {
		params := svc.GetContextParams(models.ContextModeSummary, models.MemoryLevelNormal)
		// Normal level has WindowAutoSize = 20
		should := svc.ShouldGenerateSummary(21, params, 0)
		assert.True(t, should)
	})

	t.Run("ShouldGenerateSummary returns false when not enough new messages", func(t *testing.T) {
		params := svc.GetContextParams(models.ContextModeSummary, models.MemoryLevelNormal)
		// Normal level has SummaryUpdateFrequency = 5
		// Summary ends at message 15, current total is 18 (3 new messages)
		should := svc.ShouldGenerateSummary(18, params, 15)
		assert.False(t, should)
	})

	t.Run("ShouldGenerateSummary returns true when enough new messages", func(t *testing.T) {
		params := svc.GetContextParams(models.ContextModeSummary, models.MemoryLevelNormal)
		// Normal level has SummaryUpdateFrequency = 5
		// Summary ends at message 15, current total is 21 (6 new messages)
		should := svc.ShouldGenerateSummary(21, params, 15)
		assert.True(t, should)
	})
}
