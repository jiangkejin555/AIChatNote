package main

import (
	"log"
	"os"

	"github.com/chat-note/backend/internal/config"
	"github.com/chat-note/backend/internal/crypto"
	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/handlers"
	"github.com/chat-note/backend/internal/middleware"

	"net/http"
	"time"

	"github.com/chat-note/backend/internal/repository"

	"github.com/chat-note/backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file if exists (optional, for env var overrides)
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using config.yaml")
	}

	// Load config from config.yaml (required)
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Set Gin mode
	if cfg.Server.GinMode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Connect to database
	if err := database.Connect(cfg); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Run database migrations
	if err := database.Migrate(); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// Initialize services
	jwtService := crypto.NewJWTService(cfg)
	aesCrypto, err := crypto.NewAESCrypto(cfg.Encryption.Key)
	if err != nil {
		log.Fatalf("Failed to initialize crypto: %v", err)
	}

	// Initialize AI service
	aiService := services.NewAIService(cfg.Mock.Enabled)
	aiService.SetCrypto(aesCrypto)
	if cfg.Mock.Enabled {
		log.Println("⚠️  AI service running in MOCK mode - no real API calls will be made")
	}

	// Initialize context config service
	contextConfigService := services.NewContextConfigService(cfg)

	// Initialize verification code service
	verificationCodeService := services.NewVerificationCodeService()

	// Initialize email service
	emailService := services.NewEmailService(&cfg.SMTP)

	// Initialize OAuth service
	oauthService := services.NewOAuthService(&cfg.OAuth)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(jwtService, verificationCodeService, emailService)
	oauthHandler := handlers.NewOAuthHandler(oauthService, jwtService)
	providerHandler := handlers.NewProviderHandler(aesCrypto)
	providerModelHandler := handlers.NewProviderModelHandler()
	conversationHandler := handlers.NewConversationHandler(cfg, aesCrypto, contextConfigService)
	
	folderHandler := handlers.NewFolderHandler()
	tagHandler := handlers.NewTagHandler()
	userSettingsHandler := handlers.NewUserSettingsHandler(contextConfigService)

	// Initialize notification handler
	notificationHandler := handlers.NewNotificationHandler()

	// Initialize feedback handlers
	satisfactionHandler := handlers.NewSatisfactionHandler()
	feedbackHandler := handlers.NewFeedbackHandler()
	featureHandler := handlers.NewFeatureHandler()
	versionHandler := handlers.NewVersionHandler()

	// Initialize Integration handler
	integrationRepo := repository.NewIntegrationRepository()
	notionHttpClient := &http.Client{Timeout: 10 * time.Second}
	notionService, err := services.NewNotionService(&cfg.Notion, cfg.Encryption.Key, integrationRepo, notionHttpClient)
	if err != nil {
		log.Fatalf("Failed to initialize NotionService: %v", err)
	}
	integrationHandler := handlers.NewIntegrationHandler(integrationRepo, notionService)
	noteHandler := handlers.NewNoteHandler(aiService, notionService)

	// Setup router
	r := gin.New()
	r.Use(middleware.Recovery())
	r.Use(middleware.Logger())
	r.Use(middleware.CORS(cfg))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":    "ok",
			"database":  "connected",
			"timestamp": gin.H{},
		})
	})

	// API routes
	api := r.Group("/api")
	{
		// Auth routes (public)
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
			auth.POST("/email/code", authHandler.SendVerificationCode)
			auth.POST("/email/login", authHandler.VerifyCodeAndLogin)
		}

		// OAuth routes (public)
		oauth := api.Group("/oauth")
		{
			oauth.GET("/:provider/auth-url", oauthHandler.GetAuthURL)
			oauth.POST("/:provider/callback", oauthHandler.HandleCallback)
		}

		// OAuth routes (protected)
		oauthProtected := api.Group("/oauth")
		oauthProtected.Use(middleware.Auth(jwtService))
		{
			oauthProtected.GET("/accounts", oauthHandler.GetLinkedAccounts)
			oauthProtected.DELETE("/:provider/unlink", oauthHandler.UnlinkAccount)
			oauthProtected.GET("/:provider/bind", oauthHandler.BindAccount)
		}

		// Auth routes (protected)
		authProtected := api.Group("/auth")
		authProtected.Use(middleware.Auth(jwtService))
		{
			authProtected.POST("/logout", authHandler.Logout)
			authProtected.GET("/me", authHandler.GetCurrentUser)
			authProtected.DELETE("/account", authHandler.DeleteAccount)
			authProtected.PUT("/password", authHandler.ChangePassword)
		}

		// User settings routes
		userSettings := api.Group("/user")
		userSettings.Use(middleware.Auth(jwtService))
		{
			userSettings.GET("/settings", userSettingsHandler.GetUserSettings)
			userSettings.PUT("/settings", userSettingsHandler.UpdateUserSettings)
		}

		// Provider routes
		providers := api.Group("/providers")
		providers.Use(middleware.Auth(jwtService))
		{
			providers.GET("", providerHandler.List)
			providers.POST("", providerHandler.Create)
			providers.GET("/:id", providerHandler.Get)
			providers.PUT("/:id", providerHandler.Update)
			providers.DELETE("/:id", providerHandler.Delete)
			providers.GET("/:id/available-models", providerHandler.GetAvailableModels)
			providers.POST("/:id/test-connection", providerHandler.TestConnection)

			// Provider model routes
			providers.GET("/:id/models", providerModelHandler.List)
			providers.POST("/:id/models", providerModelHandler.Add)
			providers.PUT("/:id/models/:modelId", providerModelHandler.Update)
			providers.DELETE("/:id/models/:modelId", providerModelHandler.Delete)
			providers.POST("/:id/models/batch", providerModelHandler.BatchAdd)
			providers.POST("/:id/models/sync", providerModelHandler.Sync)
		}

		// Conversation routes
		conversations := api.Group("/conversations")
		conversations.Use(middleware.Auth(jwtService))
		{
			conversations.GET("", conversationHandler.List)
			conversations.GET("/search", conversationHandler.Search)
			conversations.POST("", conversationHandler.Create)
			conversations.GET("/:id", conversationHandler.Get)
			conversations.PUT("/:id", conversationHandler.Update)
			conversations.PUT("/:id/model", conversationHandler.UpdateModel)
			conversations.DELETE("/:id", conversationHandler.Delete)
			conversations.PUT("/:id/saved", conversationHandler.MarkSaved)
			conversations.GET("/:id/messages", conversationHandler.GetMessages)
			conversations.POST("/:id/messages", conversationHandler.SendMessage)
			conversations.POST("/:id/messages/:messageId/regenerate", conversationHandler.Regenerate)
			conversations.POST("/:id/generate-title", conversationHandler.GenerateTitle)
		}

		// Note routes
		notes := api.Group("/notes")
		notes.Use(middleware.Auth(jwtService))
		{
			notes.GET("", noteHandler.List)
			notes.POST("", noteHandler.Create)
			notes.POST("/generate", noteHandler.Generate)
			notes.GET("/tasks/:id", noteHandler.GetTask)
			notes.GET("/:id", noteHandler.Get)
			notes.PUT("/:id", noteHandler.Update)
			notes.DELETE("/:id", noteHandler.Delete)
			notes.GET("/:id/export", noteHandler.Export)
			notes.POST("/:id/copy", noteHandler.Copy)
			notes.POST("/:id/sync/notion", noteHandler.SyncNoteToNotion)
			notes.POST("/export", noteHandler.ExportBatch)
			notes.POST("/import", noteHandler.Import)
			notes.POST("/batch-delete", noteHandler.BatchDelete)
			notes.POST("/batch-move", noteHandler.BatchMove)
		}

		// Folder routes
		folders := api.Group("/folders")
		folders.Use(middleware.Auth(jwtService))
		{
			folders.GET("", folderHandler.List)
			folders.POST("", folderHandler.Create)
			folders.GET("/:id", folderHandler.Get)
			folders.PUT("/:id", folderHandler.Update)
			folders.DELETE("/:id", folderHandler.Delete)
			folders.POST("/:id/copy", folderHandler.Copy)
		}

		// Tag routes
		tags := api.Group("/tags")
		tags.Use(middleware.Auth(jwtService))
		{
			tags.GET("", tagHandler.List)
		}

		// Notification routes
		notifications := api.Group("/notifications")
		notifications.Use(middleware.Auth(jwtService))
		{
			notifications.GET("", notificationHandler.List)
			notifications.GET("/unread-count", notificationHandler.GetUnreadCount)
			notifications.PUT("/:id/read", notificationHandler.MarkAsRead)
			notifications.PUT("/read-all", notificationHandler.MarkAllAsRead)
			notifications.DELETE("/:id", notificationHandler.Delete)
			notifications.DELETE("", notificationHandler.DeleteAll)
			notifications.POST("/test", notificationHandler.CreateForTesting)
		}

		// Satisfaction routes
		satisfaction := api.Group("/feedback/satisfaction")
		satisfaction.Use(middleware.Auth(jwtService))
		{
			satisfaction.GET("", satisfactionHandler.Get)
			satisfaction.POST("", satisfactionHandler.CreateOrUpdate)
		}

		// Feedback routes
		feedbacks := api.Group("/feedbacks")
		feedbacks.Use(middleware.Auth(jwtService))
		{
			feedbacks.GET("", feedbackHandler.List)
			feedbacks.POST("", feedbackHandler.Create)
			feedbacks.GET("/:id", feedbackHandler.Get)
			feedbacks.PUT("/:id", feedbackHandler.Update)
		}

		// Feature routes
		features := api.Group("/features")
		features.Use(middleware.Auth(jwtService))
		{
			features.GET("", featureHandler.List)
			features.POST("/:id/vote", featureHandler.Vote)
			features.DELETE("/:id/vote", featureHandler.Unvote)
		}

		// Version routes
		versions := api.Group("/versions")
		{
			versions.GET("", versionHandler.List)
			versions.GET("/current", versionHandler.GetCurrent)
		}

		// Integration routes
		integrations := api.Group("/integrations")
		integrations.Use(middleware.Auth(jwtService))
		{
			integrations.GET("/notion/auth-url", integrationHandler.GetNotionAuthURL)
			integrations.POST("/notion/callback", integrationHandler.NotionCallback)
			integrations.GET("/notion/status", integrationHandler.GetNotionStatus)
			integrations.DELETE("/notion/disconnect", integrationHandler.DisconnectNotion)
		}
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
