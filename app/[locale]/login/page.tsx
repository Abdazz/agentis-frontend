'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/i18n/navigation'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const setAccessToken = useAuthStore((s) => s.setAccessToken)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setServerError(null)
    const res = await apiFetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const code = body?.error?.code ?? 'generic'
      setServerError(t(`errors.${code}` as Parameters<typeof t>[0]) ?? t('errors.generic'))
      return
    }
    const { access_token } = await res.json()
    setAccessToken(access_token as string)
    router.push('/')
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-2xl font-bold mb-6">{t('loginTitle')}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">{t('email')}</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="password">{t('password')}</Label>
          <Input id="password" type="password" {...register('password')} />
          {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
        </div>
        {serverError && <p className="text-destructive text-sm">{serverError}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {t('loginSubmit')}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        {t('noAccount')}{' '}
        <Link href="/register" className="text-primary underline">{t('register')}</Link>
      </p>
    </div>
  )
}
