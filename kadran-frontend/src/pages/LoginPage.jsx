import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
      setServerError(err.response?.data?.error?.message || "Login failed");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      
      {serverError && (
        <div className="mb-4 text-red-500 border border-red-500 p-2">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="block mb-1">Email</label>
          <input
            type="email"
            {...register("email")}
            className="w-full p-2 text-black"
          />
          {/* Show Zod validation error for email */}
          {errors.email && (
            <span className="text-red-500 text-sm">{errors.email.message}</span>
          )}
        </div>

        <div>
          <label className="block mb-1">Password</label>
          <input
            type="password"
            {...register("password")}
            className="w-full p-2 text-black"
          />
          {/* Show Zod validation error for password */}
          {errors.password && (
            <span className="text-red-500 text-sm">{errors.password.message}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="p-2 bg-blue-600 text-white font-bold mt-2"
        >
          {isSubmitting ? "Logging in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}