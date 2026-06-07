import { useCallback } from "react"
import { File, Upload, X } from "lucide-react"
import { useDropzone, type Accept } from "react-dropzone"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  value?: File[]
  onChange?: (files: File[]) => void
  accept?: Accept
  maxFiles?: number
  maxSize?: number
  disabled?: boolean
  className?: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileUpload({
  value = [],
  onChange,
  accept,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024,
  disabled = false,
  className,
}: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const combined = [...value, ...acceptedFiles].slice(0, maxFiles)
      onChange?.(combined)
    },
    [value, onChange, maxFiles]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept,
      maxFiles: maxFiles - value.length,
      maxSize,
      disabled: disabled || value.length >= maxFiles,
    })

  const removeFile = (index: number) => {
    const next = value.filter((_, i) => i !== index)
    onChange?.(next)
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
          isDragActive && !isDragReject && "border-primary bg-primary/5",
          isDragReject && "border-destructive bg-destructive/5",
          (disabled || value.length >= maxFiles) &&
            "cursor-not-allowed opacity-50",
          !isDragActive && "hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          {isDragActive
            ? "Solte os arquivos aqui"
            : "Arraste arquivos ou clique para selecionar"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Máximo {maxFiles} arquivo(s), até {formatFileSize(maxSize)} cada
        </p>
      </div>

      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <File className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => removeFile(index)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Remover {file.name}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
