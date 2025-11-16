"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useLoginAction } from "../hooks/action";
import { useSessionExpiredAlert } from "../hooks/state";
import {
  loginFormSchema,
  type LoginFormValues,
} from "../types/schemas/login-form.schema";

export function LoginForm() {
  useSessionExpiredAlert();
  const { isValid, invalidText, isPending, submitLogin } = useLoginAction();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <form
      className="flex flex-col font-[family-name:var(--font-geist-mono)]"
      onSubmit={handleSubmit(submitLogin)}
    >
      <div className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="id를 입력하세요"
          className={`border-gray-200 border-solid border rounded-md outline-blue-500 outline-1 py-1 px-2 placeholder:text-gray-400 ${!isValid || errors.email ? "border-red-500" : ""}`}
          {...register("email")}
        />
        <input
          type="password"
          placeholder="비밀번호를 입력하세요"
          className={`border-gray-200 border-solid border rounded-md outline-blue-500 outline-1 py-1 px-2 placeholder:text-gray-400 ${!isValid || errors.password ? "border-red-500" : ""}`}
          {...register("password")}
        />
      </div>
      <div className="min-h-6 my-2 w-60 justify-center">
        {errors.email?.message ? (
          <div className="text-red-500">{errors.email.message}</div>
        ) : errors.password?.message ? (
          <div className="text-red-500">{errors.password.message}</div>
        ) : !isValid ? (
          <div className="text-red-500">{invalidText}</div>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md cursor-pointer border border-solid border-transparent transition-colors flex items-center justify-center bg-[#0C65F2] text-background gap-2 hover:bg-[#448CFF] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 py-2 w-full"
      >
        {isPending ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}
