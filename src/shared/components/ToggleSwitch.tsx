"use client";

import React, { useId } from "react";

interface ToggleSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  name?: string;
  id?: string;
  "aria-label"?: string;
  disabled?: boolean;
}

export default function ToggleSwitch({
  checked,
  onCheckedChange,
  name,
  id: idProp,
  "aria-label": ariaLabel,
  disabled = false,
}: ToggleSwitchProps) {
  const generatedId = useId();
  const id = idProp ?? `toggle-switch-${generatedId.replace(/:/g, "")}`;

  return (
    <>
      <input
        type="checkbox"
        id={id}
        name={name}
        className="peer hidden"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange(e.currentTarget.checked)}
        aria-label={ariaLabel}
      />
      <label
        htmlFor={id}
        className={`relative block h-8 w-16 rounded-full border-2 border-[#242020] bg-white transition-colors duration-200 peer-checked:bg-black peer-checked:[&>span]:translate-x-8 peer-checked:[&>span]:bg-white ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        <span className="absolute left-1 top-1 z-10 block h-5 w-5 rounded-full bg-black transition-transform duration-200" />
      </label>
    </>
  );
}
