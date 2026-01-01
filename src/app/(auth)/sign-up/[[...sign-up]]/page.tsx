import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4ecdc4] to-[#a29bfe] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            משימות ילדים 🌟
          </h1>
          <p className="text-white/80">צור חשבון חדש</p>
        </div>
        <SignUp
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
