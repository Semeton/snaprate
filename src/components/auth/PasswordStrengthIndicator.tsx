"use client";

import React from "react";
import { validatePassword } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const passwordRules: PasswordRule[] = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "number",
    label: "One number",
    test: (password) => /\d/.test(password),
  },
  {
    id: "special",
    label: "One special character",
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
  },
];

export default function PasswordStrengthIndicator({
  password,
  className = "",
}: PasswordStrengthIndicatorProps) {
  const validation = validatePassword(password);
  const strengthScore = passwordRules.filter((rule) =>
    rule.test(password),
  ).length;
  const strengthPercentage = (strengthScore / passwordRules.length) * 100;

  const getStrengthLabel = (score: number) => {
    if (score === 0) return "Very Weak";
    if (score <= 2) return "Weak";
    if (score <= 3) return "Fair";
    if (score <= 4) return "Good";
    return "Strong";
  };

  const getStrengthColor = (score: number) => {
    if (score === 0) return "bg-gray-200";
    if (score <= 2) return "bg-red-500";
    if (score <= 3) return "bg-orange-500";
    if (score <= 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getTextColor = (score: number) => {
    if (score === 0) return "text-gray-500";
    if (score <= 2) return "text-red-600";
    if (score <= 3) return "text-orange-600";
    if (score <= 4) return "text-yellow-600";
    return "text-green-600";
  };

  if (!password) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Password Strength</span>
          <span className={`font-medium ${getTextColor(strengthScore)}`}>
            {getStrengthLabel(strengthScore)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(
              strengthScore,
            )}`}
            style={{ width: `${strengthPercentage}%` }}
          />
        </div>
      </div>

      {/* Password Rules */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">
          Password Requirements:
        </p>
        <div className="space-y-1">
          {passwordRules.map((rule) => {
            const isValid = rule.test(password);
            return (
              <div
                key={rule.id}
                className={`flex items-center space-x-2 text-sm ${
                  isValid ? "text-green-600" : "text-gray-500"
                }`}
              >
                {isValid ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-gray-400" />
                )}
                <span>{rule.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-red-600">Issues to fix:</p>
          <ul className="space-y-1">
            {validation.errors.map((error, index) => (
              <li
                key={index}
                className="text-sm text-red-500 flex items-center space-x-2"
              >
                <X className="h-3 w-3 text-red-500" />
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
