package services

import (
	"github.com/chat-note/backend/internal/config"
	"github.com/chat-note/backend/internal/models"
)

// ContextParams holds all parameters needed for context processing
type ContextParams struct {
	Mode             models.ContextMode
	MemoryLevel      models.MemoryLevel
	WindowAutoSize   int // Summary mode: trigger summary when messages >= this
	KeepRecentCount  int // Summary mode: keep this many recent messages as raw
	HistoryLimit     int // Simple mode: number of messages to pass to LLM
	SummaryMaxTokens int // Summary mode: max tokens for summary generation
}

// ContextConfigService provides context processing configuration
type ContextConfigService struct {
	config *config.Config
}

// NewContextConfigService creates a new ContextConfigService
func NewContextConfigService(cfg *config.Config) *ContextConfigService {
	return &ContextConfigService{config: cfg}
}

// GetContextParams returns context parameters based on mode and memory level
func (s *ContextConfigService) GetContextParams(mode models.ContextMode, level models.MemoryLevel) *ContextParams {
	params := &ContextParams{
		Mode:             mode,
		MemoryLevel:      level,
		SummaryMaxTokens: s.config.Context.Summary.MaxTokens,
	}

	switch mode {
	case models.ContextModeSummary:
		var summaryParams config.ContextSummaryParams
		switch level {
		case models.MemoryLevelShort:
			summaryParams = s.config.Context.Summary.Short
		case models.MemoryLevelNormal:
			summaryParams = s.config.Context.Summary.Normal
		case models.MemoryLevelLong:
			summaryParams = s.config.Context.Summary.Long
		default:
			summaryParams = s.config.Context.Summary.Normal
		}
		params.WindowAutoSize = summaryParams.WindowAutoSize
		params.KeepRecentCount = summaryParams.KeepRecentCount
		params.HistoryLimit = 0 // Not used in summary mode

	case models.ContextModeSimple:
		params.WindowAutoSize = 0 // Not used in simple mode
		params.KeepRecentCount = 0
		var simpleParams config.ContextSimpleParams
		switch level {
		case models.MemoryLevelShort:
			simpleParams = s.config.Context.Simple.Short
		case models.MemoryLevelNormal:
			simpleParams = s.config.Context.Simple.Normal
		case models.MemoryLevelLong:
			simpleParams = s.config.Context.Simple.Long
		default:
			simpleParams = s.config.Context.Simple.Normal
		}
		params.HistoryLimit = simpleParams.HistoryLimit
	}

	return params
}

// GetDefaultMode returns the default context mode from config
func (s *ContextConfigService) GetDefaultMode() models.ContextMode {
	return models.ContextMode(s.config.Context.DefaultMode)
}

// GetDefaultLevel returns the default memory level from config
func (s *ContextConfigService) GetDefaultLevel() models.MemoryLevel {
	return models.MemoryLevel(s.config.Context.DefaultLevel)
}

// ShouldGenerateSummary determines if a summary needs to be generated or updated
// In the new algorithm, this is based on: len(messages) >= WindowAutoSize
// This method is kept for backward compatibility but the logic is simplified
func (s *ContextConfigService) ShouldGenerateSummary(newMessagesCount int, params *ContextParams) bool {
	if params.Mode != models.ContextModeSummary {
		return false
	}
	return newMessagesCount >= params.WindowAutoSize
}
