import { z } from "zod"

// Define the schema for payment form validation
export const PaymentSchema = z.object({
  card_number: z.string().min(16, "رقم البطاقة يجب أن يكون 16 رقم"),
  expiration_date: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "تاريخ انتهاء البطاقة غير صالح"),
  cvv: z.string().regex(/^\d{3,4}$/, "رمز الأمان يجب أن يكون 3 أو 4 أرقام"),
  card_holder_name: z.string().min(3, "اسم حامل البطاقة مطلوب"),
  save_card: z.boolean().optional(),
})