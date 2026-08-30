import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "ایمیل یا شماره موبایل الزامی است"),
  password: z
    .string()
    .min(1, "رمز عبور الزامی است"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "نام باید حداقل ۲ حرف باشد")
      .max(50, "نام خیلی طولانی است"),
    lastName: z
      .string()
      .min(2, "نام خانوادگی باید حداقل ۲ حرف باشد")
      .max(50, "نام خانوادگی خیلی طولانی است"),
    org: z
      .string()
      .min(2, "نام مجموعه باید حداقل ۲ حرف باشد")
      .max(100, "نام مجموعه خیلی طولانی است"),
    email: z
      .string()
      .min(1, "ایمیل الزامی است")
      .email("ایمیل معتبر نیست"),
    password: z
      .string()
      .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد")
      .regex(/[A-Z]/, "رمز عبور باید حداقل یک حرف بزرگ انگلیسی داشته باشد")
      .regex(/[0-9]/, "رمز عبور باید حداقل یک عدد داشته باشد"),
    confirmPassword: z.string().min(1, "تکرار رمز عبور الزامی است"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "پذیرفتن قوانین و مقررات الزامی است",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "رمز عبور و تکرار آن یکسان نیستند",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
