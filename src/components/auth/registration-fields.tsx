"use client";

import type { FieldErrors, Path, UseFormRegister } from "react-hook-form";
import { PasswordInput } from "@/components/shared/password-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES } from "@/lib/constants/registration";

type NameFieldValues = {
  firstName: string;
  middleName?: string;
  lastName: string;
};

type ContactFieldValues = {
  dateOfBirth: string;
  email: string;
  phone: string;
  country: string;
  regionState: string;
};

type PasswordFieldValues = {
  password: string;
  confirmPassword: string;
};

export function NameFields<T extends NameFieldValues>({
  register,
  errors,
}: {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">First name *</Label>
          <Input
            id="firstName"
            className="mt-1.5"
            {...register("firstName" as Path<T>)}
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-destructive">
              {errors.firstName.message as string}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="middleName">Middle name</Label>
          <Input
            id="middleName"
            className="mt-1.5"
            {...register("middleName" as Path<T>)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="lastName">Last name *</Label>
        <Input id="lastName" className="mt-1.5" {...register("lastName" as Path<T>)} />
        {errors.lastName && (
          <p className="mt-1 text-sm text-destructive">
            {errors.lastName.message as string}
          </p>
        )}
      </div>
    </>
  );
}

export function ContactFields<T extends ContactFieldValues>({
  register,
  errors,
  country,
  onCountryChange,
}: {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  country: string;
  onCountryChange: (value: string) => void;
}) {
  return (
    <>
      <div>
        <Label htmlFor="dateOfBirth">Date of birth *</Label>
        <Input
          id="dateOfBirth"
          type="date"
          className="mt-1.5"
          {...register("dateOfBirth" as Path<T>)}
        />
        {errors.dateOfBirth && (
          <p className="mt-1 text-sm text-destructive">
            {errors.dateOfBirth.message as string}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          className="mt-1.5"
          {...register("email" as Path<T>)}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-destructive">
            {errors.email.message as string}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="phone">Phone number *</Label>
        <Input
          id="phone"
          type="tel"
          className="mt-1.5"
          {...register("phone" as Path<T>)}
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-destructive">
            {errors.phone.message as string}
          </p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Country *</Label>
          <Select value={country} onValueChange={onCountryChange}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.country && (
            <p className="mt-1 text-sm text-destructive">
              {errors.country.message as string}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="regionState">Region / State *</Label>
          <Input
            id="regionState"
            className="mt-1.5"
            {...register("regionState" as Path<T>)}
          />
          {errors.regionState && (
            <p className="mt-1 text-sm text-destructive">
              {errors.regionState.message as string}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export function PasswordFields<T extends PasswordFieldValues>({
  register,
  errors,
}: {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
}) {
  return (
    <>
      <div>
        <Label htmlFor="password">Password *</Label>
        <PasswordInput
          id="password"
          className="mt-1.5"
          {...register("password" as Path<T>)}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-destructive">
            {errors.password.message as string}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm password *</Label>
        <PasswordInput
          id="confirmPassword"
          className="mt-1.5"
          {...register("confirmPassword" as Path<T>)}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-destructive">
            {errors.confirmPassword.message as string}
          </p>
        )}
      </div>
    </>
  );
}

export function TermsCheckbox({
  acceptTerms,
  onAcceptTermsChange,
  error,
}: {
  acceptTerms: boolean;
  onAcceptTermsChange: (checked: boolean) => void;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4">
        <Checkbox
          id="acceptTerms"
          checked={acceptTerms}
          onCheckedChange={(v) => onAcceptTermsChange(v === true)}
        />
        <Label htmlFor="acceptTerms" className="text-sm font-normal leading-relaxed">
          I accept the ZoeLive Terms and Agreements *
        </Label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
