package services

import (
	"bytes"

	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/text"
)

func ParseMarkdownToNotionBlocks(md []byte) []map[string]interface{} {
	reader := text.NewReader(md)
	parser := goldmark.DefaultParser()
	doc := parser.Parse(reader)

	var blocks []map[string]interface{}

	ast.Walk(doc, func(n ast.Node, entering bool) (ast.WalkStatus, error) {
		if !entering {
			return ast.WalkContinue, nil
		}

		switch node := n.(type) {
		case *ast.Paragraph:
			content := string(node.Text(md))
			// Text() might not get all child text if there are multiple lines or inline elements.
			// Let's implement a better text extraction function.
			content = extractTextFromNode(node, md)
			if content != "" {
				blocks = append(blocks, createParagraphBlock(content))
			}
			return ast.WalkSkipChildren, nil
		case *ast.Heading:
			content := extractTextFromNode(node, md)
			if content != "" {
				blocks = append(blocks, createHeadingBlock(node.Level, content))
			}
			return ast.WalkSkipChildren, nil
		case *ast.FencedCodeBlock:
			content := extractTextFromLines(node.Lines(), md)
			language := string(node.Language(md))
			if language == "" {
				language = "plain_text"
			}
			blocks = append(blocks, createCodeBlock(language, content))
			return ast.WalkSkipChildren, nil
		case *ast.CodeBlock:
			content := extractTextFromLines(node.Lines(), md)
			blocks = append(blocks, createCodeBlock("plain_text", content))
			return ast.WalkSkipChildren, nil
		case *ast.List:
			// For list, we let the walker visit the ListItem nodes
			return ast.WalkContinue, nil
		case *ast.ListItem:
			content := extractTextFromNode(node, md)
			// Need to determine if it's bulleted or numbered. We can check the parent list.
			parentList, ok := node.Parent().(*ast.List)
			if ok && parentList.IsOrdered() {
				blocks = append(blocks, createNumberedListItemBlock(content))
			} else {
				blocks = append(blocks, createBulletedListItemBlock(content))
			}
			return ast.WalkSkipChildren, nil
		}
		
		return ast.WalkContinue, nil
	})

	if len(blocks) == 0 {
		return []map[string]interface{}{}
	}

	return blocks
}

func extractTextFromNode(node ast.Node, source []byte) string {
	var buf bytes.Buffer
	ast.Walk(node, func(n ast.Node, entering bool) (ast.WalkStatus, error) {
		if entering {
			if n.Type() == ast.TypeInline {
				switch textNode := n.(type) {
				case *ast.Text:
					buf.Write(textNode.Segment.Value(source))
				case *ast.String:
					buf.Write(textNode.Value)
				case *ast.CodeSpan:
					// Just extract text
				}
			}
		}
		return ast.WalkContinue, nil
	})
	return buf.String()
}

func extractTextFromLines(lines *text.Segments, source []byte) string {
	var buf bytes.Buffer
	for i := 0; i < lines.Len(); i++ {
		segment := lines.At(i)
		buf.Write(segment.Value(source))
	}
	return buf.String()
}

func createRichText(content string) []map[string]interface{} {
	if content == "" {
		content = " "
	}
	
	runes := []rune(content)
	var richTexts []map[string]interface{}
	
	// Notion has a 2000 character limit per rich text object
	for len(runes) > 0 {
		chunkSize := 2000
		if len(runes) < chunkSize {
			chunkSize = len(runes)
		}
		
		chunk := string(runes[:chunkSize])
		richTexts = append(richTexts, map[string]interface{}{
			"type": "text",
			"text": map[string]interface{}{
				"content": chunk,
			},
		})
		
		runes = runes[chunkSize:]
	}
	
	return richTexts
}

func createParagraphBlock(content string) map[string]interface{} {
	return map[string]interface{}{
		"object": "block",
		"type":   "paragraph",
		"paragraph": map[string]interface{}{
			"rich_text": createRichText(content),
		},
	}
}

func createHeadingBlock(level int, content string) map[string]interface{} {
	headingType := "heading_1"
	if level == 2 {
		headingType = "heading_2"
	} else if level >= 3 {
		headingType = "heading_3"
	}

	return map[string]interface{}{
		"object": "block",
		"type":   headingType,
		headingType: map[string]interface{}{
			"rich_text": createRichText(content),
		},
	}
}

func createCodeBlock(language string, content string) map[string]interface{} {
	// Notion supports specific languages, we can just use the provided language
	// or fallback to "plain_text" if not supported, but Notion API handles invalid languages 
	// by falling back or throwing an error. We'll pass the string directly.
	return map[string]interface{}{
		"object": "block",
		"type":   "code",
		"code": map[string]interface{}{
			"language":  language,
			"rich_text": createRichText(content),
		},
	}
}

func createBulletedListItemBlock(content string) map[string]interface{} {
	return map[string]interface{}{
		"object": "block",
		"type":   "bulleted_list_item",
		"bulleted_list_item": map[string]interface{}{
			"rich_text": createRichText(content),
		},
	}
}

func createNumberedListItemBlock(content string) map[string]interface{} {
	return map[string]interface{}{
		"object": "block",
		"type":   "numbered_list_item",
		"numbered_list_item": map[string]interface{}{
			"rich_text": createRichText(content),
		},
	}
}
