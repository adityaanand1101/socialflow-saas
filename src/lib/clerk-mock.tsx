import React, { createContext, useContext } from 'react'

// Mock context for authentication state
const MockAuthContext = createContext({
  isSignedIn: true,
  isLoaded: true,
  user: {
    fullName: "Aditya Anand",
    username: "aditya_anand",
    primaryEmailAddress: {
      emailAddress: "aditya@example.com"
    }
  }
})

export const ClerkProvider = ({ children }: { children: React.ReactNode; publishableKey?: string; afterSignOutUrl?: string }) => {
  return (
    <MockAuthContext.Provider value={{
      isSignedIn: true,
      isLoaded: true,
      user: {
        fullName: "Aditya Anand",
        username: "aditya_anand",
        primaryEmailAddress: {
          emailAddress: "aditya@example.com"
        }
      }
    }}>
      {children}
    </MockAuthContext.Provider>
  )
}

export const SignedIn = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

export const SignedOut = ({}: { children: React.ReactNode }) => {
  return null // SignedOut content is not rendered in mock mode
}

export const RedirectToSignIn = () => {
  return null // No redirection needed in mock mode
}

export const useAuth = () => {
  return {
    isLoaded: true,
    isSignedIn: true,
    userId: 'mock_user_123',
    getToken: async () => 'mock_jwt_token_abc'
  }
}

export const useUser = () => {
  const context = useContext(MockAuthContext)
  return {
    isLoaded: true,
    isSignedIn: true,
    user: context.user
  }
}

export const UserButton = ({}: { afterSignOutUrl?: string }) => {
  return (
    <div className="relative group cursor-pointer flex items-center justify-center">
      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-xs shadow-glow">
        AA
      </div>
      {/* Tooltip or popover can be added here if needed */}
    </div>
  )
}
