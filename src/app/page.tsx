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
    <div className="bg-gradient-mesh min-h-screen flex flex-col items-center justify-center p-4 text-slate-800 relative overflow-hidden">
      {/* Floating Emojis */}
      <div className="absolute top-10 left-10 text-4xl opacity-40 blur-[1px] floating-emoji pointer-events-none">⭐</div>
      <div className="absolute top-20 right-10 text-5xl opacity-30 blur-[1px] floating-emoji-delayed pointer-events-none">🎁</div>
      <div className="absolute bottom-20 left-12 text-5xl opacity-30 blur-[1px] floating-emoji-delayed pointer-events-none">🏆</div>
      <div className="absolute bottom-32 right-12 text-4xl opacity-40 blur-[1px] floating-emoji pointer-events-none">🚀</div>

      <main className="w-full max-w-md z-10 space-y-6">
        {/* Header */}
        <header className="text-center space-y-2 mb-8">
          <h1 className="text-5xl font-black text-white drop-shadow-md tracking-tight">
            כוכבים
            <span className="inline-block animate-pulse"> ✨</span>
          </h1>
          <p className="text-lg font-medium text-white/95 drop-shadow-sm px-4">
            הופכים מטלות למשחק מהנה ומתגמל!
          </p>
        </header>

        {/* Benefits Card */}
        <div className="glass-panel bg-white/55 rounded-3xl p-6 shadow-lg space-y-5">
          <h2 className="text-xl font-bold text-center text-orange-900 flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">📚</span>
            <span>להתפתחות הילד - מחקרים מוכיחים:</span>
          </h2>

          <div className="grid grid-cols-1 gap-3">
            <div className="bg-white/60 p-3 rounded-2xl flex items-center gap-3 shadow-sm border border-white/40">
              <div className="bg-green-100 p-2.5 rounded-full shrink-0">
                <span className="material-symbols-outlined text-green-600 text-xl block">psychology</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 text-base leading-tight">תחושת מסוגלות</h3>
                <p className="text-sm text-slate-600">חיזוק הביטחון העצמי והאמונה ביכולות</p>
              </div>
            </div>

            <div className="bg-white/60 p-3 rounded-2xl flex items-center gap-3 shadow-sm border border-white/40">
              <div className="bg-blue-100 p-2.5 rounded-full shrink-0">
                <span className="material-symbols-outlined text-blue-600 text-xl block">accessibility_new</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 text-base leading-tight">אחריות ועצמאות</h3>
                <p className="text-sm text-slate-600">פיתוח הרגלים אישיים בריאים לעתיד</p>
              </div>
            </div>

            <div className="bg-white/60 p-3 rounded-2xl flex items-center gap-3 shadow-sm border border-white/40">
              <div className="bg-purple-100 p-2.5 rounded-full shrink-0">
                <span className="material-symbols-outlined text-purple-600 text-xl block">school</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 text-base leading-tight">ריכוז וזיכרון</h3>
                <p className="text-sm text-slate-600">שיפור יכולות קוגניטיביות דרך משחק</p>
              </div>
            </div>

            <div className="bg-white/60 p-3 rounded-2xl flex items-center gap-3 shadow-sm border border-white/40">
              <div className="bg-rose-100 p-2.5 rounded-full shrink-0">
                <span className="material-symbols-outlined text-rose-600 text-xl block">favorite</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 text-base leading-tight">מיומנויות חברתיות</h3>
                <p className="text-sm text-slate-600">פיתוח אמפתיה והבנת הזולת</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4 pt-2">
          <Link
            href="/sign-up"
            className="w-full bg-white text-orange-500 hover:bg-orange-50 transition-all transform hover:scale-[1.02] shadow-lg rounded-full py-4 px-6 text-xl font-bold flex items-center justify-center gap-3 group"
          >
            <span className="text-2xl group-hover:animate-bounce">🚀</span>
            <span>התחל עכשיו - חינם!</span>
          </Link>

          <Link
            href="/sign-in"
            className="w-full bg-white/30 backdrop-blur-sm text-white hover:bg-white/40 transition-colors rounded-full py-3 px-6 text-lg font-semibold shadow-sm border border-white/20 block text-center"
          >
            התחברות
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-4 mt-6">
          <div className="glass-panel bg-white/25 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/40 transition-colors">
            <div className="bg-green-100 p-3 rounded-xl shadow-sm">
              <span className="text-3xl">✅</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900">משימות יומיות</h3>
              <p className="text-xs text-slate-700">משימות בוקר וערב מותאמות אישית לכל ילד</p>
            </div>
          </div>

          <div className="glass-panel bg-white/25 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/40 transition-colors">
            <div className="bg-yellow-100 p-3 rounded-xl shadow-sm">
              <span className="text-3xl">🏆</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900">הישגים ורמות</h3>
              <p className="text-xs text-slate-700">10 רמות התקדמות עם הישגים מיוחדים לפתיחה</p>
            </div>
          </div>

          <div className="glass-panel bg-white/25 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/40 transition-colors">
            <div className="bg-red-100 p-3 rounded-xl shadow-sm">
              <span className="text-3xl">🎁</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900">חנות פרסים</h3>
              <p className="text-xs text-slate-700">הילדים קונים פרסים עם הנקודות שצברו</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel bg-white/25 rounded-2xl p-4 flex flex-col items-center text-center gap-2 hover:bg-white/40 transition-colors">
              <div className="bg-orange-100 p-2 rounded-xl shadow-sm inline-block">
                <span className="text-2xl">👨‍👩‍👧‍👦</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">ניהול משפחתי</h3>
                <p className="text-[10px] text-slate-700 leading-tight mt-1">תמיכה במספר ילדים, אישור הורי למשימות</p>
              </div>
            </div>

            <div className="glass-panel bg-white/25 rounded-2xl p-4 flex flex-col items-center text-center gap-2 hover:bg-white/40 transition-colors">
              <div className="bg-rose-100 p-2 rounded-xl shadow-sm inline-block">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">דוחות ומעקב</h3>
                <p className="text-xs text-slate-700 leading-tight mt-1">צפייה בהתקדמות יומית, שבועית וחודשית</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center pt-8 pb-4">
          <p className="text-white/80 text-xs flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-sm">favorite</span>
            נבנה באהבה למשפחות ישראליות
          </p>
          <p className="text-white/60 text-xs mt-1">v{APP_VERSION}</p>
        </footer>
      </main>
    </div>
  );
}
