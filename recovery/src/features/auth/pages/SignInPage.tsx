import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { FormError, FormField } from '@/components/common/FormField'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { Button } from '@/components/ui/button'

import { useAuth } from '../auth-context'

export function SignInPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      await signIn(email.trim(), password)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? '/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.')
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout eyebrow="Welcome back" title="Sign in" subtitle="Pick up where you left off.">
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <FormField label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <FormField label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <FormError message={error} />
        <Button type="submit" variant="volt" size="lg" className="w-full" disabled={pending || !email || !password}>
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        New here?{' '}
        <Link to="/sign-up" className="font-medium text-foreground underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
