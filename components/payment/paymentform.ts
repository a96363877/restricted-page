"use client"

import { useState } from "react"
import { z } from "zod"

  const PaymentSchema = z.object({
  card_holder_name: z
    .string()
    .min(3, { message: "اسم حامل البطاقة يجب أن يكون 3 أحرف على الأقل" })
    .max(50, { message: "اسم حامل البطاقة يجب أن يكون أقل من 50 حرفًا" }),
  card_number: z.string().regex(/^[45][0-9]{15}$/, {
    message: "رقم بطاقة غير صالح",
  }),
  expiration_date: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, {
      message: "تنسيق تاريخ الانتهاء غير صالح (MM/YY)",
    })
    .refine(
      (value) => {
        const [month, year] = value.split("/")
        const expDate = new Date(2000 + Number.parseInt(year), Number.parseInt(month) - 1)
        const today = new Date()
        today.setDate(1)
        today.setHours(0, 0, 0, 0)
        return expDate >= today
      },
      {
        message: "برجاء ادخال تاريخ انتهاء صالح",
      },
    ),
  cvv: z.string().regex(/^[0-9]{3}$/, { message: "رمز الأمان (CVV) يجب أن يكون 3 أرقام" }),
})

export type PaymentFormData = z.infer<typeof PaymentSchema>

export function usePaymentForm() {
  const [formData, setFormData] = useState<PaymentFormData>({
    card_holder_name: "",
    card_number: "",
    expiration_date: "",
    cvv: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isloading, setisLoading] = useState(false)

  const updateFormField = (fields: Partial<PaymentFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }))
  }

  const resetForm = () => {
    setisLoading(true)

    setFormData({
      card_holder_name: "",
      card_number: "",
      expiration_date: "",
      cvv: "",
    })
    setIsSubmitting(false)
  }

  const validateForm = () => {
    // Remove spaces from card number before validation
    const validationData = {
      ...formData,
      card_number: formData.card_number.replace(/\s/g, " "),
    }
    return PaymentSchema.safeParse(validationData)
  }

  return {
    formData,
    isSubmitting,
    updateFormField,
    setIsSubmitting,
    resetForm,
    validateForm,
    isloading,
  }
}

