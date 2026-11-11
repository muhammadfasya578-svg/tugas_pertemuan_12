'use client'

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react'
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Trash2,
  CalendarPlus,
  RotateCcw,
  X,
  Info,
} from 'lucide-react'

const DialogContext = createContext(null)

export function DialogProvider({ children }) {
  const [dialogState, setDialogState] = useState(null)
  const [toasts, setToasts] = useState([])
  const resolveRef = useRef(null)

  const confirm = useCallback((optionsOrMessage) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve

      if (typeof optionsOrMessage === 'string') {
        const isDelete = optionsOrMessage.toLowerCase().includes('hapus')
        setDialogState({
          mode: 'confirm',
          title: isDelete ? 'Konfirmasi Penghapusan' : 'Konfirmasi Tindakan',
          message: optionsOrMessage,
          confirmText: isDelete ? 'Ya, Hapus' : 'Lanjutkan',
          cancelText: 'Batal',
          type: isDelete ? 'danger' : 'primary',
        })
        return
      }

      const {
        title = 'Konfirmasi Tindakan',
        message = '',
        confirmText = 'Lanjutkan',
        cancelText = 'Batal',
        type = 'primary', // 'primary' | 'danger' | 'warning' | 'extend' | 'return'
      } = optionsOrMessage || {}

      setDialogState({
        mode: 'confirm',
        title,
        message,
        confirmText,
        cancelText,
        type,
      })
    })
  }, [])

  const alert = useCallback((optionsOrMessage) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve

      if (typeof optionsOrMessage === 'string') {
        const isError =
          optionsOrMessage.toLowerCase().includes('gagal') ||
          optionsOrMessage.toLowerCase().includes('error') ||
          optionsOrMessage.toLowerCase().includes('tidak')
        const isSuccess =
          optionsOrMessage.toLowerCase().includes('berhasil') ||
          optionsOrMessage.toLowerCase().includes('sukses')

        setDialogState({
          mode: 'alert',
          title: isError
            ? 'Terjadi Kesalahan'
            : isSuccess
            ? 'Berhasil'
            : 'Pemberitahuan',
          message: optionsOrMessage,
          confirmText: 'Mengerti',
          type: isError ? 'error' : isSuccess ? 'success' : 'info',
        })
        return
      }

      const {
        title = 'Pemberitahuan',
        message = '',
        confirmText = 'Mengerti',
        type = 'info', // 'info' | 'error' | 'success' | 'warning'
      } = optionsOrMessage || {}

      setDialogState({
        mode: 'alert',
        title,
        message,
        confirmText,
        type,
      })
    })
  }, [])

  const toast = useCallback((optionsOrMessage) => {
    const id = Date.now() + Math.random()
    let toastItem = { id, message: '', type: 'info' }

    if (typeof optionsOrMessage === 'string') {
      const isError =
        optionsOrMessage.toLowerCase().includes('gagal') ||
        optionsOrMessage.toLowerCase().includes('error')
      const isSuccess =
        optionsOrMessage.toLowerCase().includes('berhasil') ||
        optionsOrMessage.toLowerCase().includes('sukses')
      toastItem = {
        id,
        message: optionsOrMessage,
        type: isError ? 'error' : isSuccess ? 'success' : 'info',
      }
    } else {
      toastItem = { id, ...optionsOrMessage }
    }

    setToasts((prev) => [...prev, toastItem])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const handleClose = (result) => {
    if (resolveRef.current) {
      resolveRef.current(result)
      resolveRef.current = null
    }
    setDialogState(null)
  }

  // Keyboard navigation: Escape to cancel, Enter to confirm
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!dialogState) return
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose(false)
      } else if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
        e.preventDefault()
        handleClose(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dialogState])

  const renderIcon = (type) => {
    switch (type) {
      case 'danger':
        return <Trash2 className="w-5 h-5 text-red-600" aria-hidden="true" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-700" aria-hidden="true" />
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-700" aria-hidden="true" />
      case 'extend':
        return <CalendarPlus className="w-5 h-5 text-emerald-700" aria-hidden="true" />
      case 'return':
        return <RotateCcw className="w-5 h-5 text-emerald-700" aria-hidden="true" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" aria-hidden="true" />
      default:
        return <Info className="w-5 h-5 text-emerald-700" aria-hidden="true" />
    }
  }

  const getIconBg = (type) => {
    switch (type) {
      case 'danger':
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-amber-50 border-amber-200'
      default:
        return 'bg-emerald-50 border-emerald-200'
    }
  }

  return (
    <DialogContext.Provider value={{ confirm, alert, toast }}>
      {children}

      {/* Modal Dialog Kustom */}
      {dialogState && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => handleClose(false)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Dialog */}
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-2xl border flex items-center justify-center flex-shrink-0 ${getIconBg(
                  dialogState.type
                )}`}
              >
                {renderIcon(dialogState.type)}
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <h2 id="dialog-title" className="text-base font-bold text-slate-900 leading-snug">
                  {dialogState.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {dialogState.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleClose(false)}
                aria-label="Tutup dialog"
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tombol Aksi */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              {dialogState.mode === 'confirm' && (
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="min-h-[42px] px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 transition cursor-pointer"
                >
                  {dialogState.cancelText}
                </button>
              )}

              <button
                type="button"
                autoFocus
                onClick={() => handleClose(true)}
                className={`min-h-[42px] px-5 rounded-xl text-xs sm:text-sm font-semibold text-white transition shadow-xs cursor-pointer ${
                  dialogState.type === 'danger' || dialogState.type === 'error'
                    ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                    : dialogState.type === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
                    : 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900'
                }`}
              >
                {dialogState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification Container */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`p-3.5 rounded-2xl border shadow-xl flex items-center justify-between gap-3 pointer-events-auto animate-in slide-in-from-bottom-3 duration-200 ${
                t.type === 'error'
                  ? 'bg-red-50/95 border-red-200 text-red-900'
                  : t.type === 'success'
                  ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {t.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                ) : t.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                ) : (
                  <Info className="w-4 h-4 text-slate-600 flex-shrink-0" />
                )}
                <span className="text-xs font-medium leading-snug">{t.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Tutup notifikasi"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('useDialog harus digunakan di dalam DialogProvider')
  }
  return context
}
