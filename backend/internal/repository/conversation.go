package repository

import (
	"strings"

	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/models"
	"gorm.io/gorm"
)

type ConversationRepository struct{}

func NewConversationRepository() *ConversationRepository {
	return &ConversationRepository{}
}

func (r *ConversationRepository) Create(conv *models.Conversation) error {
	return database.DB.Create(conv).Error
}

func (r *ConversationRepository) FindByUserID(userID uint) ([]models.Conversation, error) {
	var conversations []models.Conversation
	err := database.DB.Where("user_id = ?", userID).
		Order("updated_at DESC").
		Find(&conversations).Error
	return conversations, err
}

// FindByIDAndUserID 根据 ID 和 UserID 查询会话（推荐使用，确保数据隔离）
func (r *ConversationRepository) FindByIDAndUserID(id, userID uint) (*models.Conversation, error) {
	var conv models.Conversation
	err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&conv).Error
	if err != nil {
		return nil, err
	}
	return &conv, nil
}

// FindByIDWithMessagesAndUserID 根据 ID 和 UserID 查询会话及其消息（推荐使用，确保数据隔离）
func (r *ConversationRepository) FindByIDWithMessagesAndUserID(id, userID uint) (*models.Conversation, error) {
	var conv models.Conversation
	err := database.DB.Where("id = ? AND user_id = ?", id, userID).
		Preload("Messages", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC")
		}).First(&conv).Error
	if err != nil {
		return nil, err
	}
	return &conv, nil
}

func (r *ConversationRepository) Update(conv *models.Conversation) error {
	return database.DB.Save(conv).Error
}

func (r *ConversationRepository) Delete(id, userID uint) error {
	return database.DB.Transaction(func(tx *gorm.DB) error {
		// Delete associated message_requests first
		if err := tx.Where("conversation_id = ?", id).Delete(&models.MessageRequest{}).Error; err != nil {
			return err
		}
		// Then delete the conversation
		return tx.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Conversation{}).Error
	})
}

// UpdateTitle 更新对话标题（同时更新 updated_at 以触发排序刷新）
func (r *ConversationRepository) UpdateTitle(id, userID uint, title string) error {
	return database.DB.Model(&models.Conversation{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(map[string]interface{}{
			"title":      title,
			"updated_at": gorm.Expr("CURRENT_TIMESTAMP"),
		}).Error
}

// UpdateCurrentModel 更新对话的当前模型
func (r *ConversationRepository) UpdateCurrentModel(id, userID uint, providerModelID *string, modelID string) error {
	updates := map[string]interface{}{
		"current_provider_model_id": providerModelID,
		"model_id":                 modelID,
		"updated_at":               gorm.Expr("CURRENT_TIMESTAMP"),
	}
	return database.DB.Model(&models.Conversation{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(updates).Error
}

// ClearCurrentModelByProviderModelID clears the current_provider_model_id for all conversations
// using the specified provider_model_id (used when a model is deleted)
func (r *ConversationRepository) ClearCurrentModelByProviderModelID(providerModelID string) error {
	return database.DB.Model(&models.Conversation{}).
		Where("current_provider_model_id = ?", providerModelID).
		Updates(map[string]any{
			"current_provider_model_id": nil,
			"updated_at":               gorm.Expr("CURRENT_TIMESTAMP"),
		}).Error
}

// SearchResult represents a search result from the conversation_search_index view
type SearchResult struct {
	ID         uint    `json:"id"`
	Title      string  `json:"title"`
	Snippet    string  `json:"snippet"`
	MatchedIn  string  `json:"matched_in"`
	Rank       float64 `json:"rank"`
	UpdatedAt  string  `json:"updated_at"`
}

// Search 搜索对话，支持标题和消息内容的模糊匹配
// 搜索策略：先过滤用户对话，再在用户对话范围内搜索（与 note.go 保持一致）
// 排序规则：标题匹配优先（rank=1.0），内容匹配次之（rank=0.5）
func (r *ConversationRepository) Search(userID uint, query string, limit int) ([]SearchResult, error) {
	var results []SearchResult

	// 默认返回 20 条结果
	if limit <= 0 {
		limit = 20
	}

	// ========== 第一步：获取用户所有对话ID（确保数据隔离）==========
	// 先过滤出用户自己的对话，后续搜索只在这些对话中进行
	// SQL: SELECT id FROM conversations WHERE user_id = ?
	var userConversationIDs []uint
	if err := database.DB.Model(&models.Conversation{}).
		Where("user_id = ?", userID).
		Pluck("id", &userConversationIDs).Error; err != nil {
		return nil, err
	}

	// 用户没有任何对话，直接返回空结果
	if len(userConversationIDs) == 0 {
		return []SearchResult{}, nil
	}

	// ========== 第二步：准备搜索模式 ==========
	// 使用 LOWER() 实现大小写不敏感匹配，兼容 PostgreSQL 和 SQLite
	// 例如：query="Hello" → lowerPattern="%hello%"
	lowerPattern := "%" + strings.ToLower(query) + "%"

	// ========== 第三步：搜索标题匹配的对话（优先级高，rank=1.0）==========
	// SQL: SELECT id, title, title as snippet, 'title' as matched_in, 1.0 as rank, updated_at
	//      FROM conversations WHERE id IN (?) AND LOWER(title) LIKE ?
	//      ORDER BY updated_at DESC LIMIT ?
	var titleMatches []SearchResult
	database.DB.Model(&models.Conversation{}).
		Select(`id, COALESCE(title, '') as title, COALESCE(title, '') as snippet,
				'title' as matched_in, 1.0 as rank, updated_at`).
		Where("id IN ?", userConversationIDs).      // 只在用户对话中搜索
		Where("LOWER(title) LIKE ?", lowerPattern). // 标题包含搜索词
		Order("updated_at DESC").                   // 按更新时间倒序
		Limit(limit).
		Scan(&titleMatches)

	// 如果标题匹配结果已达上限，直接返回（标题匹配优先级最高，无需搜索内容）
	if len(titleMatches) >= limit {
		return titleMatches[:limit], nil
	}

	// ========== 第四步：准备内容匹配查询 ==========
	// 收集已标题匹配的对话ID，后续内容匹配时排除这些对话（避免重复）
	titleMatchIDs := make([]uint, len(titleMatches))
	for i, r := range titleMatches {
		titleMatchIDs[i] = r.ID
	}

	// 防止 SQL 错误：NOT IN (?) 不能为空，用不存在的 ID（0）占位
	if len(titleMatchIDs) == 0 {
		titleMatchIDs = []uint{0}
	}

	// ========== 第五步：查找内容匹配的对话ID ==========
	// SQL: SELECT DISTINCT conversation_id FROM messages
	//      WHERE conversation_id IN (?) AND conversation_id NOT IN (?)
	//      AND LOWER(content) LIKE ?
	var contentMatchIDs []uint
	if err := database.DB.Table("messages").
		Distinct("conversation_id").                          // 去重，一个对话只返回一次
		Where("conversation_id IN ?", userConversationIDs).   // 只在用户对话中
		Where("conversation_id NOT IN ?", titleMatchIDs).     // 排除已标题匹配的
		Where("LOWER(content) LIKE ?", lowerPattern).         // 消息内容包含搜索词
		Pluck("conversation_id", &contentMatchIDs).Error; err != nil {
		return titleMatches, err
	}

	// 没有内容匹配，直接返回标题匹配结果
	if len(contentMatchIDs) == 0 {
		return titleMatches, nil
	}

	// ========== 第六步：获取内容匹配的详细信息 ==========
	var contentMatches []SearchResult
	for _, convID := range contentMatchIDs {
		// 控制总数不超过 limit
		if len(titleMatches)+len(contentMatches) >= limit {
			break
		}

		// 获取对话基本信息
		var conv models.Conversation
		if err := database.DB.First(&conv, convID).Error; err != nil {
			continue
		}

		// 获取匹配的消息内容（作为摘要 snippet）
		// SQL: SELECT * FROM messages WHERE conversation_id = ? AND LOWER(content) LIKE ?
		//      ORDER BY created_at DESC LIMIT 1
		var msg models.Message
		if err := database.DB.Where("conversation_id = ? AND LOWER(content) LIKE ?", convID, lowerPattern).
			Order("created_at DESC"). // 取最新的一条匹配消息
			First(&msg).Error; err != nil {
			continue
		}

		// 截取消息内容前100个字符作为摘要
		snippet := msg.Content
		if len(snippet) > 100 {
			snippet = snippet[:100]
		}

		// 构建搜索结果
		contentMatches = append(contentMatches, SearchResult{
			ID:        conv.ID,
			Title:     conv.Title,     // 对话标题
			Snippet:   snippet,        // 匹配消息的摘要（前100字符）
			MatchedIn: "content",      // 标记：内容匹配
			Rank:      0.5,            // 优先级低于标题匹配
			UpdatedAt: conv.UpdatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	// ========== 第七步：合并结果 ==========
	// 标题匹配在前（rank=1.0），内容匹配在后（rank=0.5）
	results = append(titleMatches, contentMatches...)

	return results, nil
}

type MessageRepository struct{}

func NewMessageRepository() *MessageRepository {
	return &MessageRepository{}
}

func (r *MessageRepository) Create(msg *models.Message) error {
	return database.DB.Create(msg).Error
}

func (r *MessageRepository) FindByID(id uint) (*models.Message, error) {
	var msg models.Message
	err := database.DB.First(&msg, id).Error
	if err != nil {
		return nil, err
	}
	return &msg, nil
}

func (r *MessageRepository) FindByConversationID(convID uint) ([]models.Message, error) {
	var messages []models.Message
	err := database.DB.Where("conversation_id = ?", convID).
		Order("created_at ASC").
		Find(&messages).Error
	return messages, err
}

// FindRecentByConversationID returns the most recent N messages for a conversation
// in chronological order (oldest first). Used for simple context mode.
func (r *MessageRepository) FindRecentByConversationID(convID uint, limit int) ([]models.Message, error) {
	var messages []models.Message
	// Use subquery to get the most recent N messages, then order them chronologically
	subQuery := database.DB.Model(&models.Message{}).
		Select("id").
		Where("conversation_id = ?", convID).
		Order("created_at DESC").
		Limit(limit)

	err := database.DB.Where("id IN (?)", subQuery).
		Order("created_at ASC").
		Find(&messages).Error
	return messages, err
}

func (r *MessageRepository) FindByConversationIDBefore(convID uint, beforeID uint, limit int) ([]models.Message, error) {
	var messages []models.Message
	query := database.DB.Where("conversation_id = ?", convID)
	if beforeID > 0 {
		query = query.Where("id < ?", beforeID)
	}
	err := query.Order("created_at DESC").Limit(limit).Find(&messages).Error
	return messages, err
}

func (r *MessageRepository) Delete(id uint) error {
	return database.DB.Delete(&models.Message{}, id).Error
}

func (r *MessageRepository) GetLastAssistantMessage(convID uint) (*models.Message, error) {
	var msg models.Message
	err := database.DB.Where("conversation_id = ? AND role = ?", convID, models.RoleAssistant).
		Order("created_at DESC").
		First(&msg).Error
	if err != nil {
		return nil, err
	}
	return &msg, nil
}

// GetFirstUserMessage 获取对话的首条用户消息
func (r *MessageRepository) GetFirstUserMessage(convID uint) (*models.Message, error) {
	var msg models.Message
	err := database.DB.Where("conversation_id = ? AND role = ?", convID, models.RoleUser).
		Order("created_at ASC").
		First(&msg).Error
	if err != nil {
		return nil, err
	}
	return &msg, nil
}

// FindByIDRange 查询指定ID范围内的消息（用于摘要模式）
// 返回 ID > startID 且 ID <= endID 的消息，按创建时间升序排列
func (r *MessageRepository) FindByIDRange(convID uint, startID uint, endID uint) ([]models.Message, error) {
	var messages []models.Message
	query := database.DB.Where("conversation_id = ?", convID)
	if startID > 0 {
		query = query.Where("id > ?", startID)
	}
	if endID > 0 {
		query = query.Where("id <= ?", endID)
	}
	err := query.Order("created_at ASC").Find(&messages).Error
	return messages, err
}

// GetLatestMessageID 获取会话最新消息ID
func (r *MessageRepository) GetLatestMessageID(convID uint) (uint, error) {
	var msg models.Message
	err := database.DB.Where("conversation_id = ?", convID).
		Order("id DESC").
		First(&msg).Error
	if err != nil {
		return 0, err
	}
	return msg.ID, nil
}
