/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-muted": "rgb(var(--color-surface-muted) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        muted: "rgb(var(--color-ink-muted) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        "accent-ink": "rgb(var(--color-accent-ink) / <alpha-value>)",
        link: "rgb(var(--color-link) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        task: {
          course: "rgb(var(--color-course) / <alpha-value>)",
          exam: "rgb(var(--color-exam) / <alpha-value>)",
          homework: "rgb(var(--color-homework) / <alpha-value>)",
          custom: "rgb(var(--color-custom) / <alpha-value>)",
        },
        priority: {
          low: "rgb(var(--color-priority-low) / <alpha-value>)",
          medium: "rgb(var(--color-priority-medium) / <alpha-value>)",
          high: "rgb(var(--color-priority-high) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-ui)"],
        title: ["var(--font-title)"],
        numbers: ["var(--font-numbers)"],
      },
    },
  },
  plugins: [],
}
