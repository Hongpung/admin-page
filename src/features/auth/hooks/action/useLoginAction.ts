"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { tryLogin } from "../../api/auth-api";
import { getLoginErrorMessage } from "../../lib/login-error-message";

type LoginPayload = {
  email: string;
  password: string;
};

export function useLoginAction() {
  const [isValid, setValid] = useState(true);
  const [invalidText, setInvalidText] = useState("");

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: LoginPayload) => tryLogin(email, password),
    onSuccess: () => {
      window.location.replace("/home");
    },
    onError: (error) => {
      setValid(false);
      setInvalidText(getLoginErrorMessage(error));
    },
  });

  const submitLogin = async ({ email, password }: LoginPayload) => {
    setValid(true);
    setInvalidText("");
    await loginMutation.mutateAsync({ email, password });
  };

  return {
    isValid,
    invalidText,
    isPending: loginMutation.isPending,
    submitLogin,
  };
}
