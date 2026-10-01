import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "../services/api";

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
      setServerError(err.response?.data?.error?.message || "Registration failed");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      
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
          {errors.email && (
            <span className="text-red-500 text-sm block mt-1">{errors.email.message}</span>
          )}
        </div>

        <div>
          <label className="block mb-1">Password</label>
          <input
            type="password"
            {...register("password")}
            className="w-full p-2 text-black"
          />
          {errors.password && (
            <span className="text-red-500 text-sm block mt-1">{errors.password.message}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="p-2 bg-green-600 hover:bg-green-700 text-white font-bold mt-2 disabled:bg-green-800"
        >
          {isSubmitting ? "Creating Account..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}