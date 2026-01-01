import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { APP_VERSION } from "@/lib/version";

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
            כוכבים ⭐
          </h1>
          <div className="text-xl text-white/90 mb-8 max-w-3xl mx-auto space-y-4">
            <p className="text-2xl">
              <span className="font-bold">לילדים:</span> משחק מהנה עם נקודות, רמות והישגים
            </p>
            <p className="text-2xl">
              <span className="font-bold">להורים:</span> שגרה רגועה בלי מאבקים
            </p>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mt-6">
              <p className="font-bold text-xl mb-3">📚 להתפתחות הילד - מחקרים מוכיחים:</p>
              <p className="text-white/80 text-lg">ילדים שעושים מטלות בבית מפתחים:</p>
              <div className="grid grid-cols-2 gap-2 mt-3 text-right">
                <div>✅ תחושת מסוגלות וביטחון עצמי</div>
                <div>✅ אחריות ועצמאות</div>
                <div>✅ יכולת ריכוז וזיכרון טובים יותר</div>
                <div>✅ אמפתיה ומיומנויות חברתיות</div>
              </div>
            </div>
          </div>

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
        <p className="text-sm mt-2">v{APP_VERSION}</p>
      </footer>
    </div>
  );
}
