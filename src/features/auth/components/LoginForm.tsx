import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Sparkles, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { loginSchema, type LoginFormData } from '@/features/auth/schemas/login.schema'

export function LoginForm() {
  const { signIn } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true)
    try {
      await signIn(data.email, data.password)
      toast.success('Login realizado com sucesso!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer login')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-bg-orb login-bg-orb--1" />
        <div className="login-bg-orb login-bg-orb--2" />
        <div className="login-bg-orb login-bg-orb--3" />
      </div>

      {/* Glass card */}
      <div className="login-card">
        {/* Branding */}
        <div className="login-brand">
          <div className="login-icon">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="login-title">Clínica de Atendimento</h1>
          <p className="login-subtitle">
            Acesse seu painel de gestão
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="login-form">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="login-label">E-mail</FormLabel>
                  <FormControl>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      className="login-input"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="login-label">Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="login-input pr-10"
                        autoComplete="current-password"
                        {...field}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              id="login-submit"
              type="submit"
              className="login-button"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </Form>

        {/* Footer */}
        <p className="login-footer">
          Sistema exclusivo para profissionais da clínica
        </p>
      </div>

      <style>{`
        .login-page {
          position: relative;
          display: flex;
          min-height: 100vh;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          overflow: hidden;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);
        }

        .login-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .login-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.5;
          animation: login-float 12s ease-in-out infinite;
        }

        .login-bg-orb--1 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, #38bdf8 0%, transparent 70%);
          top: -10%;
          left: -5%;
          animation-delay: 0s;
        }

        .login-bg-orb--2 {
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, #34d399 0%, transparent 70%);
          bottom: -10%;
          right: -5%;
          animation-delay: -4s;
          animation-duration: 15s;
        }

        .login-bg-orb--3 {
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, #818cf8 0%, transparent 70%);
          top: 50%;
          left: 60%;
          animation-delay: -8s;
          animation-duration: 18s;
        }

        @keyframes login-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }

        .login-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          padding: 2.5rem;
          border-radius: 1.25rem;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 1);
          animation: login-card-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes login-card-enter {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .login-brand {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, #0ea5e9, #14b8a6);
          margin-bottom: 1rem;
          box-shadow: 0 4px 16px rgba(14, 165, 233, 0.2);
          animation: login-icon-pulse 3s ease-in-out infinite;
        }

        @keyframes login-icon-pulse {
          0%, 100% { box-shadow: 0 4px 16px rgba(14, 165, 233, 0.2); }
          50% { box-shadow: 0 4px 24px rgba(14, 165, 233, 0.4); }
        }

        .login-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.025em;
          margin: 0;
        }

        .login-subtitle {
          font-size: 0.875rem;
          color: #475569;
          margin-top: 0.375rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .login-label {
          color: #334155 !important;
          font-size: 0.8125rem;
          font-weight: 600;
        }

        .login-input {
          background: rgba(255, 255, 255, 0.9) !important;
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
          color: #0f172a !important;
          border-radius: 0.75rem !important;
          height: 2.75rem !important;
          padding-left: 0.875rem !important;
          transition: all 0.2s ease !important;
        }

        .login-input::placeholder {
          color: #94a3b8 !important;
        }

        .login-input:focus {
          border-color: #0ea5e9 !important;
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15) !important;
          background: #ffffff !important;
        }

        .login-button {
          width: 100%;
          height: 2.75rem;
          margin-top: 0.5rem;
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: 0.9375rem;
          background: linear-gradient(135deg, #0ea5e9, #0d9488) !important;
          border: none !important;
          color: white !important;
          transition: all 0.2s ease !important;
          box-shadow: 0 2px 12px rgba(14, 165, 233, 0.3);
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(14, 165, 233, 0.45) !important;
        }

        .login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-button:disabled {
          opacity: 0.7;
        }

        .login-footer {
          text-align: center;
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 1.5rem;
        }

        /* Dark mode overrides */
        .dark .login-page {
          background: linear-gradient(135deg, #020617 0%, #0f172a 50%, #0c4a6e 100%);
        }
        .dark .login-card {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }
        .dark .login-title {
          color: #f8fafc;
        }
        .dark .login-subtitle {
          color: #94a3b8;
        }
        .dark .login-label {
          color: #cbd5e1 !important;
        }
        .dark .login-input {
          background: rgba(255, 255, 255, 0.06) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #f1f5f9 !important;
        }
        .dark .login-input::placeholder {
          color: #64748b !important;
        }
        .dark .login-input:focus {
          background: rgba(255, 255, 255, 0.08) !important;
        }
        .dark .login-footer {
          color: #475569;
        }
      `}</style>
    </div>
  )
}
