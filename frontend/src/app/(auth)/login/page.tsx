'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { AxiosError } from 'axios'
import { useAuthStore } from '@/stores'
import { authApi } from '@/lib/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Loader2, Github, Mail } from 'lucide-react'
import { useTranslations } from '@/i18n'
import VerificationCodeForm from '@/components/auth/VerificationCodeForm'

type OAuthProvider = 'google' | 'github' | 'qq'

interface OAuthProviderConfig {
  id: OAuthProvider
  name: string
  icon: React.ReactNode
}

const oauthProviders: OAuthProviderConfig[] = [
  { id: 'google', name: 'Google', icon: <Mail className="mr-2 h-4 w-4" /> },
  { id: 'github', name: 'GitHub', icon: <Github className="mr-2 h-4 w-4" /> },
  { id: 'qq', name: 'QQ', icon: <span className="mr-2 text-sm font-bold">QQ</span> },
]

interface LoginForm {
  email: string
  password: string
}

function LoginFormContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuthStore()
  const t = useTranslations()

  const redirect = searchParams.get('redirect') || '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const response = await authApi.login({
        email: data.email,
        password: data.password,
      })

      login(response.user, response.token)
      toast.success(t('auth.loginSuccess'))
      router.push(decodeURIComponent(redirect))
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      const message = axiosError.response?.data?.message || axiosError.message || t('auth.loginFailed')
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setOauthLoading(provider)
    try {
      const response = await authApi.getOAuthURL(provider)
      window.location.href = response.auth_url
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      const message = axiosError.response?.data?.message || t('auth.oauth.failed')
      toast.error(message)
      setOauthLoading(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('auth.loginTitle')}</CardTitle>
        <CardDescription>
          {t('auth.loginDesc')}
        </CardDescription>
      </CardHeader>
      <Tabs defaultValue="password" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mx-6 mt-2">
          <TabsTrigger value="password">{t('auth.verificationCode.passwordTab')}</TabsTrigger>
          <TabsTrigger value="code">{t('auth.verificationCode.codeTab')}</TabsTrigger>
        </TabsList>
        <TabsContent value="password">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  {...register('email', {
                    required: t('auth.emailRequired'),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t('auth.emailInvalid'),
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password', {
                    required: t('auth.passwordRequired'),
                    minLength: {
                      value: 8,
                      message: t('auth.passwordMinLength'),
                    },
                  })}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('auth.login')}
              </Button>
              
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t('auth.oauth.or')}
                  </span>
                </div>
              </div>

              <div className="w-full space-y-2">
                <p className="text-sm text-muted-foreground text-center mb-3">
                  {t('auth.oauth.title')}
                </p>
                {oauthProviders.map((provider) => (
                  <Button
                    key={provider.id}
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={oauthLoading !== null}
                    onClick={() => handleOAuthLogin(provider.id)}
                  >
                    {oauthLoading === provider.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      provider.icon
                    )}
                    {t('auth.oauth.loginWith', { provider: provider.name })}
                  </Button>
                ))}
              </div>

              <p className="text-sm text-muted-foreground text-center">
                {t('auth.noAccount')}{' '}
                <Link href="/register" className="text-primary hover:underline">
                  {t('auth.goRegister')}
                </Link>
              </p>
            </CardFooter>
          </form>
        </TabsContent>
        <TabsContent value="code">
          <CardContent className="space-y-4">
            <VerificationCodeForm />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t('auth.oauth.or')}
                </span>
              </div>
            </div>

            <div className="w-full space-y-2">
              <p className="text-sm text-muted-foreground text-center mb-3">
                {t('auth.oauth.title')}
              </p>
              {oauthProviders.map((provider) => (
                <Button
                  key={provider.id}
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={oauthLoading !== null}
                  onClick={() => handleOAuthLogin(provider.id)}
                >
                  {oauthLoading === provider.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    provider.icon
                  )}
                  {t('auth.oauth.loginWith', { provider: provider.name })}
                </Button>
              ))}
            </div>

            <p className="text-sm text-muted-foreground text-center">
              {t('auth.noAccount')}{' '}
              <Link href="/register" className="text-primary hover:underline">
                {t('auth.goRegister')}
              </Link>
            </p>
          </CardFooter>
        </TabsContent>
      </Tabs>
    </Card>
  )
}

export default function LoginPage() {
  const t = useTranslations()

  return (
    <Suspense fallback={
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.loginTitle')}</CardTitle>
          <CardDescription>{t('common.loading')}</CardDescription>
        </CardHeader>
      </Card>
    }>
      <LoginFormContent />
    </Suspense>
  )
}
