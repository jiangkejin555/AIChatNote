package services

import (
	"testing"
)

func TestParseMarkdownToNotionBlocks(t *testing.T) {
	md := `
# Heading 1
## Heading 2
### Heading 3

This is a paragraph with **bold** and *italic* and ` + "`code`" + `.

* Bullet 1
* Bullet 2

1. Number 1
2. Number 2

` + "```go\nfunc main() {}\n```" + `

    indented code block
`

	blocks := ParseMarkdownToNotionBlocks([]byte(md))

	if len(blocks) != 10 {
		t.Fatalf("Expected 10 blocks, got %d", len(blocks))
	}

	// Basic assertions to ensure types are correct
	if blocks[0]["type"] != "heading_1" {
		t.Errorf("Expected block 0 to be heading_1, got %v", blocks[0]["type"])
	}
	if blocks[1]["type"] != "heading_2" {
		t.Errorf("Expected block 1 to be heading_2, got %v", blocks[1]["type"])
	}
	if blocks[2]["type"] != "heading_3" {
		t.Errorf("Expected block 2 to be heading_3, got %v", blocks[2]["type"])
	}
	if blocks[3]["type"] != "paragraph" {
		t.Errorf("Expected block 3 to be paragraph, got %v", blocks[3]["type"])
	}
	if blocks[4]["type"] != "bulleted_list_item" {
		t.Errorf("Expected block 4 to be bulleted_list_item, got %v", blocks[4]["type"])
	}
	if blocks[6]["type"] != "numbered_list_item" {
		t.Errorf("Expected block 6 to be numbered_list_item, got %v", blocks[6]["type"])
	}
	if blocks[8]["type"] != "code" {
		t.Errorf("Expected block 8 to be code, got %v", blocks[8]["type"])
	}
	
	codeData, ok := blocks[8]["code"].(map[string]interface{})
	if !ok {
		t.Fatalf("Block 8 missing code data")
	}
	if codeData["language"] != "go" {
		t.Errorf("Expected code block language to be go, got %v", codeData["language"])
	}

	// Verify paragraph text extraction
	paraData, ok := blocks[3]["paragraph"].(map[string]interface{})
	if !ok {
		t.Fatalf("Block 3 missing paragraph data")
	}
	richText, ok := paraData["rich_text"].([]map[string]interface{})
	if !ok || len(richText) == 0 {
		t.Fatalf("Paragraph missing rich_text")
	}
	textData, ok := richText[0]["text"].(map[string]interface{})
	if !ok {
		t.Fatalf("rich_text missing text object")
	}
	content := textData["content"].(string)
	expectedContent := "This is a paragraph with bold and italic and code."
	if content != expectedContent {
		t.Errorf("Expected paragraph content %q, got %q", expectedContent, content)
	}
}
