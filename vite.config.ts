import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  const isClerkPlaceholder = 
    !env.VITE_CLERK_PUBLISHABLE_KEY || 
    env.VITE_CLERK_PUBLISHABLE_KEY.includes("placeholder") ||
    env.VITE_CLERK_PUBLISHABLE_KEY === "mock_key"

  const alias: Record<string, string> = {
    "@": path.resolve(__dirname, "./src"),
  }

  if (isClerkPlaceholder) {
    alias["@clerk/clerk-react"] = path.resolve(__dirname, "./src/lib/clerk-mock.tsx")
  }

  return {
    plugins: [react()],
    resolve: {
      alias,
    },
  }
})
