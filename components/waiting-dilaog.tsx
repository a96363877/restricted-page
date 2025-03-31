"use client"

import { useEffect, useState } from "react"
import { CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react"

type WaitingDialogProps = {
  isOpen: boolean
  paymentStatus?: "idle" | "processing" | "success" | "error" | "pending"
  onClose?: () => void
  onRefresh?: () => void
}

export default function WaitingDialog({
  isOpen,
  paymentStatus = "processing",
  onClose,
  onRefresh,
}: WaitingDialogProps) {
  const [isVisible, setIsVisible] = useState(false)

  // Handle animation timing for opening/closing
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      // Delay hiding to allow for animation
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // If not visible at all, don't render
  if (!isVisible && !isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
      style={{ pointerEvents: isOpen ? "auto" : "none" }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/25" onClick={onClose} />

      {/* Dialog */}
      <div
        className={`relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-center align-middle shadow-xl transition-all duration-300 ${
          isOpen ? "scale-100" : "scale-95"
        }`}
      >
        <h3 className="text-lg font-medium leading-6 text-gray-900 text-right">
          {paymentStatus === "processing" && "جاري معالجة الدفع"}
          {paymentStatus === "pending" && "عملية الدفع معلقة"}
          {paymentStatus === "success" && "تمت عملية الدفع بنجاح!"}
          {paymentStatus === "error" && "حدث خطأ أثناء معالجة الدفع"}
        </h3>

        <div className="mt-4 flex justify-center">
          {paymentStatus === "processing" && <Loader2 className="h-12 w-12 text-[#146394] animate-spin" />}
          {paymentStatus === "pending" && <RefreshCw className="h-12 w-12 text-yellow-500 animate-spin" />}
          {paymentStatus === "success" && <CheckCircle className="h-12 w-12 text-green-500" />}
          {paymentStatus === "error" && <XCircle className="h-12 w-12 text-red-500" />}
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-500 text-right">
            {paymentStatus === "processing" && "يرجى الانتظار بينما نقوم بمعالجة معلومات الدفع الخاصة بك..."}
            {paymentStatus === "pending" && "عملية الدفع الخاصة بك قيد المعالجة. يرجى الانتظار حتى يتم تحديث الحالة..."}
            {paymentStatus === "success" && "تم تسجيل معلومات الدفع الخاصة بك بنجاح. شكراً لك!"}
            {paymentStatus === "error" && "يرجى التحقق من معلومات الدفع الخاصة بك والمحاولة مرة أخرى."}
          </p>
        </div>

        {paymentStatus === "pending" && onRefresh && <div className="mt-4"></div>}
      </div>
    </div>
  )
}

