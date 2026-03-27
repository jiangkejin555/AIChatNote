package services

import (
	"crypto/rand"
	"errors"
	"math/big"
	"sync"
	"time"

	"github.com/chat-note/backend/internal/utils"
)

const (
	codeLength        = 6
	codeExpiry        = 10 * time.Minute
	rateLimitDuration = 60 * time.Second
)

type VerificationCodeData struct {
	Code      string
	ExpiresAt time.Time
	CreatedAt time.Time
}

type VerificationCodeService struct {
	codes     sync.Map
	rateLimit sync.Map
}

func NewVerificationCodeService() *VerificationCodeService {
	service := &VerificationCodeService{}
	go service.cleanupExpiredCodes()
	return service
}

func (s *VerificationCodeService) GenerateCode(email string) (string, error) {
	if s.IsRateLimited(email) {
		return "", errors.New("rate limited: please wait before requesting a new code")
	}

	code, err := s.generateRandomCode()
	if err != nil {
		return "", err
	}

	now := time.Now()
	s.codes.Store(email, VerificationCodeData{
		Code:      code,
		ExpiresAt: now.Add(codeExpiry),
		CreatedAt: now,
	})

	s.rateLimit.Store(email, now.Add(rateLimitDuration))

	utils.LogInfo("VerificationCodeService", "GenerateCode", "email", utils.MaskEmail(email))
	return code, nil
}

func (s *VerificationCodeService) VerifyCode(email, code string) bool {
	value, ok := s.codes.Load(email)
	if !ok {
		return false
	}

	data, ok := value.(VerificationCodeData)
	if !ok {
		return false
	}

	if time.Now().After(data.ExpiresAt) {
		s.codes.Delete(email)
		return false
	}

	if data.Code != code {
		return false
	}

	s.codes.Delete(email)
	s.rateLimit.Delete(email)

	utils.LogInfo("VerificationCodeService", "VerifyCode", "email", utils.MaskEmail(email), "success", true)
	return true
}

func (s *VerificationCodeService) IsRateLimited(email string) bool {
	value, ok := s.rateLimit.Load(email)
	if !ok {
		return false
	}

	expiresAt, ok := value.(time.Time)
	if !ok {
		return false
	}

	return time.Now().Before(expiresAt)
}

func (s *VerificationCodeService) GetRateLimitRemaining(email string) time.Duration {
	value, ok := s.rateLimit.Load(email)
	if !ok {
		return 0
	}

	expiresAt, ok := value.(time.Time)
	if !ok {
		return 0
	}

	remaining := time.Until(expiresAt)
	if remaining < 0 {
		return 0
	}
	return remaining
}

func (s *VerificationCodeService) generateRandomCode() (string, error) {
	code := ""
	for i := 0; i < codeLength; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			return "", err
		}
		code += string(rune(n.Int64() + '0'))
	}
	return code, nil
}

func (s *VerificationCodeService) cleanupExpiredCodes() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		now := time.Now()
		s.codes.Range(func(key, value interface{}) bool {
			if data, ok := value.(VerificationCodeData); ok {
				if now.After(data.ExpiresAt) {
					s.codes.Delete(key)
				}
			}
			return true
		})

		s.rateLimit.Range(func(key, value interface{}) bool {
			if expiresAt, ok := value.(time.Time); ok {
				if now.After(expiresAt) {
					s.rateLimit.Delete(key)
				}
			}
			return true
		})
	}
}
