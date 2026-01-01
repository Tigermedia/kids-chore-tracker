"use client";

import { ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { heIL } from "@clerk/localizations";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string
);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      localization={heIL}
      appearance={{
        layout: {
          socialButtonsPlacement: "top",
          socialButtonsVariant: "blockButton",
        },
        variables: {
          colorPrimary: "#22d1c6",
          colorBackground: "#f7f9fc",
          fontFamily: "Rubik, Assistant, Arial, sans-serif",
          borderRadius: "12px",
        },
        elements: {
          formButtonPrimary:
            "bg-[#22d1c6] hover:bg-[#1db8ae] text-white font-medium",
          card: "shadow-lg rounded-2xl",
          headerTitle: "text-2xl font-bold",
          headerSubtitle: "text-gray-600",
          socialButtonsBlockButton:
            "border-2 border-gray-200 hover:border-[#22d1c6] transition-colors",
        },
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
