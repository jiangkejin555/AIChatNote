package middleware

import (
	"strings"

	"github.com/chat-note/backend/internal/config"
	"github.com/gin-gonic/gin"
)

func CORS(cfg *config.Config) gin.HandlerFunc {
	// Support comma-separated allowed origins (e.g. "http://localhost:3000,https://ai-chat-note.vercel.app")
	allowedOrigins := parseAllowedOrigins(cfg.CORS.FrontendURL)

	return func(c *gin.Context) {
		reqOrigin := c.Request.Header.Get("Origin")

		origin := ""
		if len(allowedOrigins) == 1 && allowedOrigins[0] == "*" {
			origin = reqOrigin
		} else if reqOrigin != "" {
			for _, o := range allowedOrigins {
				if o == reqOrigin {
					origin = reqOrigin
					break
				}
			}
		}

		if origin != "" {
			// 允许访问该资源的来源（origin）
			c.Header("Access-Control-Allow-Origin", origin)
			// 允许跨域请求使用的 HTTP 方法
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			// 允许跨域请求携带的请求头
			c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization, Accept")
			// 是否允许跨域请求携带凭证（如 Cookie、Authorization 头）
			c.Header("Access-Control-Allow-Credentials", "true")
			// 预检请求（OPTIONS）结果的缓存时间，单位为秒，43200 = 12 小时
			c.Header("Access-Control-Max-Age", "43200")
		}

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func parseAllowedOrigins(frontendURL string) []string {
	if frontendURL == "" || frontendURL == "*" {
		return []string{"*"}
	}
	parts := strings.Split(frontendURL, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			result = append(result, p)
		}
	}
	if len(result) == 0 {
		return []string{"*"}
	}
	return result
}
