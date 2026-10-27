import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import AuthShell from "../components/AuthShell";
import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import { getAuthErrorMessage } from "../utils/authErrorMessage";

// Define validation rules using Zod
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");

  // Initialize React Hook Form with Zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  // This function only runs if Zod validation passes
  const onSubmit = async (data) => {
    setServerError("");
    try {
      await login(data.email, data.password);
      navigate("/");
    } catch (err) {
      setServerError(getAuthErrorMessage(err, "Login failed."));
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      lead="Sign in to pick up where your week left off."
      alternateLabel="New to Kadran?"
      alternateTo="/register"
      alternateAction="Create an account"
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
        <Field label="Password" error={errors.password?.message}>
          <input
            type="password"
            autoComplete="current-password"
            className="ui-field__control"
            {...register("password")}
          />
        </Field>
        <Button type="submit" variant="primary" size="lg" className="mt-1 w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </AuthShell>
  );
}