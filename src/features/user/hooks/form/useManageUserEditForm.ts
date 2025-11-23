"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import {
  buildManageUserAdminUpdateRequest,
  createManageUserAdminUpdateDefaultValues,
  createManageUserAdminUpdateFormSchema,
  type ManageUserAdminUpdateFormValues,
} from "../../lib";
import type { User } from "../../types";

export function useManageUserEditForm({ user }: { user: User | null }) {
  const schema = useMemo(() => createManageUserAdminUpdateFormSchema(), []);

  const defaultValues = useMemo(
    () => createManageUserAdminUpdateDefaultValues(user),
    [user],
  );

  const form = useForm<ManageUserAdminUpdateFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onSubmit",
  });

  const { reset, getValues } = form;

  useEffect(() => {
    reset(createManageUserAdminUpdateDefaultValues(user));
  }, [reset, user]);

  const buildRequest = () =>
    buildManageUserAdminUpdateRequest({ user, formValues: getValues() });

  return {
    form,
    buildRequest,
  };
}
