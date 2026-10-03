import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { z } from 'zod'

import { FormError, FormField } from '@/components/common/FormField'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/button'

import { useAuth } from '../auth-context'

const schema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name').max(120),
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
})
type Fields = z.infer<typeof schema>

export function SignUpPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [fields, setFields] = useState<Fields>({ fullName: '', email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Fields, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState(false)

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) => setFields((f) => ({ ...f, [k]: e.target.value }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const parsed = schema.safeParse(fields)
    if (!parsed.success) {
      const errs: Partial<Record<keyof Fields, string>> = {}
      for (const issue of parsed.error.issues) errs[issue.path[0] as keyof Fields] ??= issue.message
      setFieldErrors(errs)
      return
    }
    setFieldErrors({})
    setPending(true)
    try {
      const { needsConfirmation } = await signUp({ ...parsed.data, email: parsed.data.email.toLowerCase() })
      if (needsConfirmation) setConfirmEmail(true)
      else navigate('/onboarding', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed.')
    } finally {
      setPending(false)
    }
  }

  if (confirmEmail) {
    return (
      <AuthLayout eyebrow="Almost there" title="Check your inbox">
        <div className="flex gap-4 rounded-2xl border bg-card p-5">
          <MailCheck className="size-5 shrink-0 text-volt" />
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to <span className="font-medium text-foreground">{fields.email}</span>. Open it to
            finish setting up your account.
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout eyebrow="Start your comeback" title="Create account" subtitle="Athletes and professionals both start here.">
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <FormField label="Full name" autoComplete="name" value={fields.fullName} onChange={set('fullName')} error={fieldErrors.fullName} />
        <FormField label="Email" type="email" autoComplete="email" value={fields.email} onChange={set('email')} error={fieldErrors.email} />
        <FormField label="Password" type="password" autoComplete="new-password" value={fields.password} onChange={set('password')} error={fieldErrors.password} hint="At least 8 characters" />
        <FormError message={error} />
        <Button type="submit" variant="volt" size="lg" className="w-full" disabled={pending}>
          {pending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
