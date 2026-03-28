package main

import (
	"encoding/json"
	"fmt"
)

type Folder struct {
	ID       uint     `json:"id"`
	Name     string   `json:"name"`
	ParentID *uint    `json:"parent_id"`
	Children []Folder `json:"children,omitempty"`
}

func buildFolderTree(folders []Folder, parentID *uint) []Folder {
	var result []Folder
	for _, folder := range folders {
		if (parentID == nil && folder.ParentID == nil) ||
			(parentID != nil && folder.ParentID != nil && *folder.ParentID == *parentID) {
			children := buildFolderTree(folders, &folder.ID)
			folder.Children = children
			result = append(result, folder)
		}
	}
	return result
}

func main() {
	var p1 uint = 1
	var p2 uint = 2
	folders := []Folder{
		{ID: 1, Name: "root1"},
		{ID: 2, Name: "child1", ParentID: &p1},
		{ID: 3, Name: "child2", ParentID: &p2},
	}
	
	tree := buildFolderTree(folders, nil)
	b, _ := json.MarshalIndent(tree, "", "  ")
	fmt.Println(string(b))
}
