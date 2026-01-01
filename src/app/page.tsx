import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { userId } = await auth();

  // If user is logged in, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4ecdc4] via-[#a29bfe] to-[#ff6b6b]">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-6 drop-shadow-lg">
            משימות ילדים 🌟
          </h1>
          <p className="text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
            הפוך את המשימות היומיות למשחק מהנה! הילדים צוברים נקודות, פותחים
            הישגים ומרוויחים פרסים
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/sign-up"
              className="bg-white text-[#4ecdc4] px-8 py-4 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              התחל עכשיו - חינם! 🚀
            </Link>
            <Link
              href="/sign-in"
              className="bg-white/20 text-white px-8 py-4 rounded-full text-xl font-bold backdrop-blur-sm hover:bg-white/30 transition-all"
            >
              התחברות
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 text-center text-white">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-2xl font-bold mb-2">משימות יומיות</h3>
            <p className="text-white/80">
              משימות בוקר וערב מותאמות אישית לכל ילד
            </p>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 text-center text-white">
            <div className="text-5xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold mb-2">הישגים ורמות</h3>
            <p className="text-white/80">
              10 רמות התקדמות עם הישגים מיוחדים לפתיחה
            </p>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 text-center text-white">
            <div className="text-5xl mb-4">🎁</div>
            <h3 className="text-2xl font-bold mb-2">חנות פרסים</h3>
            <p className="text-white/80">
              הילדים קונים פרסים עם הנקודות שצברו
            </p>
          </div>
        </div>

        {/* More Features */}
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 text-white">
            <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
            <h3 className="text-2xl font-bold mb-2">ניהול משפחתי</h3>
            <p className="text-white/80">
              תמיכה במספר ילדים, אישור הורי למשימות, והתראות בזמן אמת
            </p>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 text-white">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-2xl font-bold mb-2">דוחות ומעקב</h3>
            <p className="text-white/80">
              צפייה בהתקדמות יומית, שבועית וחודשית עם גרפים צבעוניים
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-white/60">
        <p>נבנה באהבה למשפחות ישראליות 💜</p>
      </footer>
    </div>
  );
}
