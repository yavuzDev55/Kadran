import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "../services/api";
import AuthShell from "../components/AuthShell";
import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import { getAuthErrorMessage } from "../utils/authErrorMessage";

// Map backend validation rules directly to Zod schema
const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setServerError("");
    try {
      // Automatically get the user's timezone from their browser
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Send the payload exactly as the backend expects
      await api.post("/auth/register", {
        email: data.email,
        password: data.password,
        timeZone: userTimeZone,
      });
      
      // Redirect to login page after successful registration
      navigate("/login");
    } catch (err) {
      setServerError(getAuthErrorMessage(err, "Registration failed."));
    }
  };

  return (
    <AuthShell
      title="Make time for what matters"
      lead="Create an account to organize courses, deadlines and your week."
      alternateLabel="Already have an account?"
      alternateTo="/login"
      alternateAction="Sign in"
    >
      {serverError && (
        <div className="mb-5 rounded-md border border-danger/40 bg-danger/5 px-3 py-2.5 text-sm text-danger" role="alert">
          {serverError}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <Field label="Email" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            className="ui-field__control"
            {...register("email")}
          />
        </Field>
        <Field
          label="Password"
          hint="At least 8 characters, including an uppercase letter and a number."
          error={errors.password?.message}
        >
          <input
            type="password"
            autoComplete="new-password"
            className="ui-field__control"
            {...register("password")}
          />
        </Field>
        <Button type="submit" variant="primary" size="lg" className="mt-1 w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create Account"}
        </Button>
      </form>
    </AuthShell>
  );
}