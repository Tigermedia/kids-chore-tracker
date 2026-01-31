import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4ecdc4] to-[#a29bfe] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            כוכבים ✨
          </h1>
          <p className="text-white/80">התחבר לחשבון שלך</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-2xl rounded-3xl",
            },
          }}
        />
      </div>
    </div>
  );
}
