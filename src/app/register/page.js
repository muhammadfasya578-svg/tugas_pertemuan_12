'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { registerUser } from '@/lib/storage'
import {
  BookOpen,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Check,
  Circle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  // Evaluasi kriteria keamanan password
  const passwordCriteria = useMemo(() => {
    return [
      {
        id: 'length',
        label: 'Minimal 6 karakter',
        valid: password.length >= 6,
      },
      {
        id: 'uppercase',
        label: 'Huruf kapital (A-Z)',
        valid: /[A-Z]/.test(password),
      },
      {
        id: 'lowercase',
        label: 'Huruf kecil (a-z)',
        valid: /[a-z]/.test(password),
      },
      {
        id: 'number',
        label: 'Angka (0-9)',
        valid: /[0-9]/.test(password),
      },
      {
        id: 'symbol',
        label: 'Lambang / simbol khusus',
        valid: /[^A-Za-z0-9]/.test(password),
      },
    ]
  }, [password])

  // Hitung persentase keamanan (0 - 100%)
  const passedCriteriaCount = useMemo(() => {
    return passwordCriteria.filter((c) => c.valid).length
  }, [passwordCriteria])

  const strengthPercent = useMemo(() => {
    if (!password) return 0
    return Math.round((passedCriteriaCount / passwordCriteria.length) * 100)
  }, [password, passedCriteriaCount, passwordCriteria.length])

  // Status dan palet warna indikator keamanan
  const strengthInfo = useMemo(() => {
    if (!password) {
      return {
        label: 'Belum diisi',
        barColor: 'bg-slate-200',
        textColor: 'text-slate-500',
      }
    }
    if (strengthPercent <= 20) {
      return {
        label: 'Sangat Lemah',
        barColor: 'bg-red-500',
        textColor: 'text-red-600',
      }
    }
    if (strengthPercent <= 40) {
      return {
        label: 'Lemah',
        barColor: 'bg-orange-500',
        textColor: 'text-orange-600',
      }
    }
    if (strengthPercent <= 60) {
      return {
        label: 'Cukup',
        barColor: 'bg-amber-500',
        textColor: 'text-amber-600',
      }
    }
    if (strengthPercent <= 80) {
      return {
        label: 'Kuat',
        barColor: 'bg-emerald-600',
        textColor: 'text-emerald-700',
      }
    }
    return {
      label: 'Sangat Kuat',
      barColor: 'bg-emerald-700',
      textColor: 'text-emerald-800',
    }
  }, [password, strengthPercent])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (password.length < 6) {
      setErrorMsg('Password minimal 6 karakter')
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok')
      return
    }

    setLoading(true)
    const res = await registerUser(name, email, password)
    setLoading(false)

    if (res.error) {
      setErrorMsg(res.error)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-emerald-50/50 via-slate-50 to-slate-50">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 mb-3 shadow-xs">
            <BookOpen className="w-7 h-7" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Daftar Akun <span className="text-emerald-700">Perpus</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Buat akun untuk mulai meminjam buku perpustakaan
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-sm" role="alert">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Nama Lengkap
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-5 h-5" aria-hidden="true" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mis. Ahmad Fauzi"
                  className="w-full h-11 pl-10 pr-4 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-5 h-5" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full h-11 pl-10 pr-4 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                  className="w-full h-11 pl-10 pr-11 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-700 transition-colors"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Eye className="w-5 h-5" aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator - Simple & Smooth */}
              {password.length > 0 && (
                <div className="mt-5 space-y-4">
                  {/* Status & Persentase Baris */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Kekuatan password:</span>
                    <span className={`font-semibold transition-colors duration-300 ${strengthInfo.textColor}`}>
                      {strengthPercent}% &bull; {strengthInfo.label}
                    </span>
                  </div>

                  {/* Smooth Continuous Progress Bar */}
                  <div
                    className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-label="Tingkat keamanan password"
                    aria-valuenow={strengthPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${strengthInfo.barColor}`}
                      style={{ width: `${strengthPercent}%` }}
                    />
                  </div>

                  {/* Kriteria Syarat Minimalis */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-[11px]">
                    {passwordCriteria.map((item) => (
                      <span
                        key={item.id}
                        className={`flex items-center gap-1.5 transition-colors duration-300 ${
                          item.valid ? 'text-emerald-800 font-medium' : 'text-slate-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                            item.valid ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                          aria-hidden="true"
                        />
                        <span>{item.label}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Konfirmasi Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" aria-hidden="true" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  minLength={6}
                  className="w-full h-11 pl-10 pr-11 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-700 transition-colors"
                  aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Eye className="w-5 h-5" aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* Status Kesesuaian Password */}
              {confirmPassword.length > 0 && (
                <div className="mt-1.5 text-xs flex items-center gap-1.5">
                  {password === confirmPassword ? (
                    <span className="text-emerald-800 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                      <span>Password cocok</span>
                    </span>
                  ) : (
                    <span className="text-red-700 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" aria-hidden="true" />
                      <span>Konfirmasi password belum cocok</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 rounded-xl bg-emerald-700 text-white font-medium text-sm hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-60 transition flex items-center justify-center gap-2 shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Mendaftarkan...</span>
                </>
              ) : (
                'Daftar'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              Sudah punya akun?{' '}
              <Link
                href="/login"
                className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
