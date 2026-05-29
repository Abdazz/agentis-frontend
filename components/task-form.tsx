'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { apiFetch } from '@/lib/api'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB
const MAX_FILES = 5
const ALLOWED_TYPES = [
  'application/pdf', 'text/plain', 'text/markdown',
  'application/json', 'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

export function TaskForm() {
  const t = useTranslations('home')
  const router = useRouter()
  const [goal, setGoal] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null)
    const selected = Array.from(e.target.files ?? [])
    if (selected.length > MAX_FILES) {
      setFileError(`Maximum ${MAX_FILES} files allowed.`)
      return
    }
    for (const f of selected) {
      if (f.size > MAX_FILE_SIZE) {
        setFileError(`File "${f.name}" exceeds the 50 MB limit.`)
        return
      }
      if (!ALLOWED_TYPES.includes(f.type)) {
        setFileError(`File type "${f.type}" is not allowed.`)
        return
      }
    }
    setFiles(selected)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!goal.trim()) return
    setIsSubmitting(true)
    try {
      let body: BodyInit
      let headers: Record<string, string> = {}
      if (files.length > 0) {
        const fd = new FormData()
        fd.append('goal', goal)
        for (const f of files) fd.append('files[]', f)
        body = fd
      } else {
        body = JSON.stringify({ goal })
        headers['Content-Type'] = 'application/json'
      }
      const res = await apiFetch('/api/v1/tasks', { method: 'POST', headers, body })
      if (res.ok) {
        const data = await res.json()
        router.push(`/tasks/${data.id as string}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-3">
      <Textarea
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder={t('placeholder')}
        className="min-h-[120px] resize-none text-base"
        aria-label={t('title')}
      />
      {fileError && <p className="text-destructive text-sm">{fileError}</p>}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            {t('attach')}
          </Button>
          {files.length > 0 && (
            <span className="text-sm text-muted-foreground">{files.length} file(s)</span>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_TYPES.join(',')}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <Button type="submit" disabled={!goal.trim() || isSubmitting}>
          {t('submit')}
        </Button>
      </div>
    </form>
  )
}
