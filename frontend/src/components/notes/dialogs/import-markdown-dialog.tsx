'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { FileUp, File, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImportResult {
  filename: string
  success: boolean
  error?: string
}

interface ImportMarkdownDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (files: File[]) => Promise<ImportResult[]>
  folderName?: string
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function ImportMarkdownDialog({
  open,
  onOpenChange,
  onImport,
  folderName,
}: ImportMarkdownDialogProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<ImportResult[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        return false
      }
      return file.name.endsWith('.md')
    })
    setFiles(selectedFiles)
    setResults([])
  }

  const handleImport = async () => {
    if (files.length === 0) return

    setIsImporting(true)
    setProgress(0)
    setResults([])

    try {
      const importResults: ImportResult[] = []

      for (let i = 0; i < files.length; i++) {
        setProgress(((i + 1) / files.length) * 100)

        const result = await onImport([files[i]])
        importResults.push(...result)
        setResults([...importResults])
      }

      // Auto-close after successful import
      if (files.length === 1 && importResults[0]?.success) {
        setTimeout(() => {
          onOpenChange(false)
          resetState()
        }, 1000)
      }
    } catch (error) {
      console.error('Import failed:', error)
    } finally {
      setIsImporting(false)
    }
  }

  const resetState = () => {
    setFiles([])
    setProgress(0)
    setResults([])
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState()
    }
    onOpenChange(open)
  }

  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            导入 Markdown
            {folderName && ` 到 "${folderName}"`}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".md"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Drop zone */}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              'hover:border-primary hover:bg-primary/5',
              files.length > 0 && 'border-primary bg-primary/5'
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-1">
              点击选择 Markdown 文件
            </p>
            <p className="text-xs text-muted-foreground">
              支持 .md 文件，单个文件最大 5MB
            </p>
          </div>

          {/* Selected files */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">已选择 {files.length} 个文件：</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <File className="h-4 w-4" />
                    <span className="truncate">{file.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {isImporting && (
            <div className="mt-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2 text-center">
                正在导入... {Math.round(progress)}%
              </p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">
                导入完成：{successCount} 成功，{failCount} 失败
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex items-center gap-2 text-sm p-1.5 rounded',
                      result.success ? 'text-green-600' : 'text-destructive'
                    )}
                  >
                    {result.success ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <span className="truncate">{result.filename}</span>
                    {result.error && (
                      <span className="text-xs text-muted-foreground">
                        - {result.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            取消
          </Button>
          <Button
            onClick={handleImport}
            disabled={files.length === 0 || isImporting}
          >
            {isImporting ? '导入中...' : '导入'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
