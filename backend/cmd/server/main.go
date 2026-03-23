package main

import (
	"log"
	"os"

	"github.com/ai-chat-notes/backend/internal/config"
	"github.com/ai-chat-notes/backend/internal/crypto"
	"github.com/ai-chat-notes/backend/internal/database"
	"github.com/ai-chat-notes/backend/internal/handlers"
	"github.com/ai-chat-notes/backend/internal/middleware"
	"github.com/ai-chat-notes/backend/internal/services"
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

	// Initialize services
	jwtService := crypto.NewJWTService(cfg)
	aesCrypto, err := crypto.NewAESCrypto(cfg.Encryption.Key)
	if err != nil {
		log.Fatalf("Failed to initialize crypto: %v", err)
	}

	// Initialize AI service
	var aiService *services.AIService
	if cfg.Mock.Enabled {
		aiService = services.NewAIService(&cfg.NoteLLM, true)
		log.Println("⚠️  AI service running in MOCK mode - no real API calls will be made")
	} else if cfg.NoteLLM.DeepSeekAPIKey != "" {
		aiService = services.NewAIService(&cfg.NoteLLM, false)
		log.Println("AI service initialized with DeepSeek")
	} else {
		log.Println("Warning: DeepSeek API key not configured, AI features will be unavailable")
	}

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(jwtService)
	providerHandler := handlers.NewProviderHandler(aesCrypto)
	providerModelHandler := handlers.NewProviderModelHandler()
	conversationHandler := handlers.NewConversationHandler(aesCrypto, cfg.Mock.Enabled)
	noteHandler := handlers.NewNoteHandler(aiService)
	folderHandler := handlers.NewFolderHandler()
	tagHandler := handlers.NewTagHandler()

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
		}

		// Auth routes (protected)
		authProtected := api.Group("/auth")
		authProtected.Use(middleware.Auth(jwtService))
		{
			authProtected.POST("/logout", authHandler.Logout)
			authProtected.GET("/me", authHandler.GetCurrentUser)
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
			providers.GET("/:providerId/models", providerModelHandler.List)
			providers.POST("/:providerId/models", providerModelHandler.Add)
			providers.PUT("/:providerId/models/:modelId", providerModelHandler.Update)
			providers.DELETE("/:providerId/models/:modelId", providerModelHandler.Delete)
			providers.POST("/:providerId/models/batch", providerModelHandler.BatchAdd)
		}

		// Conversation routes
		conversations := api.Group("/conversations")
		conversations.Use(middleware.Auth(jwtService))
		{
			conversations.GET("", conversationHandler.List)
			conversations.POST("", conversationHandler.Create)
			conversations.GET("/:id", conversationHandler.Get)
			conversations.PUT("/:id", conversationHandler.Update)
			conversations.DELETE("/:id", conversationHandler.Delete)
			conversations.PUT("/:id/saved", conversationHandler.MarkSaved)
			conversations.GET("/:id/messages", conversationHandler.GetMessages)
			conversations.POST("/:id/messages", conversationHandler.SendMessage)
			conversations.POST("/:id/messages/:messageId/regenerate", conversationHandler.Regenerate)
		}

		// Note routes
		notes := api.Group("/notes")
		notes.Use(middleware.Auth(jwtService))
		{
			notes.GET("", noteHandler.List)
			notes.POST("", noteHandler.Create)
			notes.POST("/generate", noteHandler.Generate)
			notes.GET("/:id", noteHandler.Get)
			notes.PUT("/:id", noteHandler.Update)
			notes.DELETE("/:id", noteHandler.Delete)
			notes.GET("/:id/export", noteHandler.Export)
			notes.POST("/:id/copy", noteHandler.Copy)
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
