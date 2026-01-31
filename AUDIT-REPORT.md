# 🔍 דוח ביקורת מקיף - אפליקציית "כוכבים" (Kids Chore Tracker)

**תאריך:** 2026-01-31  
**גרסה:** 1.1.3  
**כתובת:** https://kids-chore-tracker-theta.vercel.app  
**סטאק:** Next.js 16.1.1 + Convex + Clerk + Tailwind CSS 4

---

## 📊 סיכום מנהלים

| קטגוריה | סטטוס |
|---------|--------|
| דף כניסה / Welcome | ✅ עובד |
| אימות (Clerk) | ⚠️ מצב פיתוח בלבד |
| מסד נתונים (Convex) | ✅ סכמה מלאה |
| ניהול ילדים | ✅ CRUD מלא |
| ניהול משימות | ✅ עובד |
| חנות פרסים | ✅ עובד |
| הישגים | ⚠️ חלקי |
| דוחות | ✅ עובד |
| PWA | ❌ שבור |
| אבטחה | ⚠️ דרוש שיפור |

---

## ✅ דברים שעובדים

### דף הבית (Welcome Page)
- ✅ עיצוב מודרני עם Glassmorphism ורקע Gradient Mesh מונפש
- ✅ תוכן שיווקי בעברית עם כרטיסי יתרונות ותכונות
- ✅ ניתוב אוטומטי למשתמשים מחוברים (→ /dashboard)
- ✅ כפתורי הרשמה והתחברות ברורים
- ✅ מספר גרסה בפוטר (v1.1.3)
- ✅ אמוג'ים צפים מונפשים

### אימות (Authentication)
- ✅ Clerk עובד עם Google ו-Facebook OAuth
- ✅ לוקליזציה לעברית (heIL) עם Placeholders מותאמים
- ✅ Webhook ל-Clerk ליצירת משתמשים אוטומטית ב-Convex
- ✅ Fallback: `ensureUser` במקרה שה-webhook לא עובד
- ✅ Middleware מוגדר נכון עם route matcher

### דשבורד ילדים
- ✅ בחירת ילד עם selector
- ✅ כרטיסי סטטיסטיקות (נקודות, רצף, משימות, רמה)
- ✅ פס התקדמות XP עם 10 רמות
- ✅ צבע נושא מותאם לכל ילד מיושם ב-UI
- ✅ ניתוב אוטומטי למצב הורה אם אין ילדים
- ✅ תפריט ניווט תחתון למובייל + ראשי לדסקטופ
- ✅ פעמון התראות עם dropdown ומונה

### ניהול משימות
- ✅ CRUD מלא (יצירה, עריכה, מחיקה)
- ✅ חלוקה לבוקר/ערב/מיוחד
- ✅ סימון משימות כהושלמו עם undo
- ✅ אנימציית חגיגה (Confetti) בהשלמת משימה
- ✅ פס התקדמות יומי
- ✅ עדכון נקודות ו-XP אוטומטי בהשלמת משימה
- ✅ משימות ברירת מחדל נוצרות אוטומטית (4 בוקר + 4 ערב)

### חנות פרסים
- ✅ רכישת פרסים עם אישור
- ✅ יתרת נקודות מוצגת
- ✅ פרסי ברירת מחדל נוצרים אוטומטית עם יצירת משפחה
- ✅ מודאל אישור רכישה
- ✅ מעקב אחרי רכישות שלא מומשו
- ✅ CRUD מלא לניהול פרסים (מצב הורה)
- ✅ מימוש פרסים על ידי ההורה

### מצב הורה
- ✅ הגנת PIN 4 ספרות עם timeout של 15 דקות
- ✅ מעקב פעילות (click, keydown, scroll, touch)
- ✅ PIN Modal עם מצב הגדרה ואימות
- ✅ דשבורד הורה עם סיכום כל הילדים
- ✅ ניהול ילדים: הוספה, עריכה, מחיקה
- ✅ הורדת נקודות עם סיבה + העלאת תמונה
- ✅ דוחות מפורטים עם היסטוריה
- ✅ הגדרות: עריכת שם, שם משפחה, PIN, התנתקות
- ✅ ניווט טאבים בראש העמוד

### מערכת דוחות
- ✅ דוח ילדים: היסטוריית משימות מקובצת לפי תאריך
- ✅ דוח הורה: סיכום נקודות (נצברו/הורדו/נוצלו)
- ✅ גרף פעילות שבועי (בר צ'ארט פשוט)
- ✅ היסטוריית הורדות נקודות
- ✅ היסטוריית רכישות
- ✅ סטטיסטיקות כלליות

### התראות
- ✅ פעמון עם מונה unread
- ✅ Dropdown עם רשימת התראות
- ✅ סימון כנקרא (בודד / הכל)
- ✅ התראות נוצרות אוטומטית: הורדת נקודות, הישגים, רכישות

### מסד נתונים (Convex)
- ✅ סכמה מלאה ומתועדת עם אינדקסים מתאימים
- ✅ 13 טבלאות מוגדרות
- ✅ כל הקוריות ומוטציות מיושמות ומיוצאות כראוי

---

## ❌ דברים שבורים / חסרים

### 1. PWA Manifest שבור — קריטי
- **manifest.json מחזיר 404** בסביבת Production
- הקובץ קיים ב-`public/manifest.json` אבל Vercel לא מגיש אותו
- **שגיאות Console:** `Manifest fetch from .../manifest.json failed, code 404`
- **השפעה:** האפליקציה לא ניתנת להתקנה כ-PWA
- **פתרון:** לבדוק את ה-build ב-Vercel; ייתכן שצריך `next.config.ts` עם `output: 'standalone'` או לוודא ש-public folder מועתק

### 2. שם ישן בדפי Auth — בינוני
- **sign-in/page.tsx** ו-**sign-up/page.tsx** עדיין מציגים "משימות ילדים 🌟" במקום "כוכבים ✨"
- אחרי ה-rebranding של v1.1.1, הדפים האלה לא עודכנו

### 3. Clerk במצב Development — בינוני
- הודעת "Development mode" מופיעה בדפי Auth
- נדרש custom domain לעבור ל-Production (vercel.app לא נתמך)
- כתובת Clerk: `organic-wasp-45.accounts.dev` (ברירת מחדל)

### 4. Streak לא מתעדכן — בינוני
- **currentStreak** ו-**longestStreak** מוגדרים בסכמה ומוצגים ב-UI
- **אבל:** שום קוד לא מעדכן אותם! `completeTask` לא מעדכן streak
- הם תמיד יישארו 0
- **פתרון:** להוסיף לוגיקת streak ב-`completeTask` (בדיקה אם יש completions מאתמול)

### 5. Achievement Auto-Check לא מחובר — בינוני
- `checkAndUnlock` קיים כ-mutation אבל **אף פעם לא נקרא**
- הישגים לא ייפתחו אוטומטית אחרי השלמת משימות
- **פתרון:** לקרוא ל-`checkAndUnlock` אחרי `completeTask` (או מה-frontend)

---

## ⚠️ דברים שדורשים שיפור

### אבטחה

#### 1. PIN Hash חלש — בינוני
- PIN מוצפן ב-`hashPin()` - פונקציית hash פשוטה מבוססת char codes
- לא cryptographically secure (כמו שהקוד עצמו מציין)
- עבור PIN של 4 ספרות (10,000 אפשרויות בלבד), זה מספיק למניעת casual access
- **שיפור:** שימוש ב-`bcrypt` או `Argon2` לחיזוק, אם רוצים

#### 2. בדיקות הרשאה חלקיות — בינוני
- `getChild`, `updateChild`, `deleteChild` - **לא מוודאים שהמשתמש שייך למשפחה של הילד!**
- `children.getChild` - כל משתמש מאומת יכול לקרוא כל ילד לפי ID
- `tasks.getTemplates`, `tasks.getTodayTasks` - מקבלים `childId` ללא אימות בעלות
- **השפעה:** משתמש יכול לגשת לנתוני ילדים של משפחות אחרות
- **פתרון:** להוסיף בדיקת familyId מול המשתמש המחובר בכל query/mutation

#### 3. `pointReductions.create` - מוגן כראוי ✅
- יש אימות בעלות על המשפחה

#### 4. Rate Limiting חסר — נמוך
- אין הגבלה על מספר ניסיונות PIN
- **פתרון:** הוספת מונה ניסיונות ו-lockout

### קוד מת / לא בשימוש

#### 1. תלויות שלא בשימוש — נמוך
- **`recharts`** - מותקן ב-package.json אבל **לא מיובא בשום קובץ**
- **`sonner`** - מותקן אבל **לא מיובא בשום קובץ**
- **`class-variance-authority`** - מותקן אבל **לא מיובא בשום קובץ**
- **`clsx`** - מותקן אבל **לא מיובא בשום קובץ**
- **`tailwind-merge`** - מותקן אבל **לא מיובא בשום קובץ**
- **חיסכון:** הסרתם תקטין את ה-bundle ותמנע בלבול

#### 2. פונקציות Convex שלא נקראות — נמוך
- **`children.getChild`** - מוגדר אבל לא נקרא מהפרונט
- **`children.addXP`** - מוגדר אבל לא נקרא (XP מתעדכן ישירות ב-`completeTask`)
- **`children.addPoints`** - מוגדר אבל לא נקרא
- **`users.getUserByClerkId`** - מוגדר אבל לא נקרא מהפרונט
- **`achievements.getUnlocked`** - מוגדר אבל לא נקרא מהפרונט
- **`rewards.initializeDefaultRewards`** (הציבורי) - מוגדר אבל לא נקרא (הגרסה ה-internal משמשת)

#### 3. טבלאות סכמה ללא Backend — נמוך
- **`dailyStats`** - מוגדר בסכמה, אין שום קוד שכותב אליו
- **`challenges`** (אתגרים שבועיים) - מוגדר בסכמה, אין שום קוד שמשתמש בו
- **`dailyRewards`** (פרס יומי) - מוגדר בסכמה, אין שום קוד שמשתמש בו

### UI/UX

#### 1. Dark Mode לא מיושם — נמוך
- CSS מכיל media query ל-`prefers-color-scheme: dark` עם משתנים
- אבל רוב ה-UI משתמש בצבעים הרדקודד (bg-white, text-gray-500 וכו')
- **תוצאה:** אפליקציה תמיד נראית Light Mode

#### 2. יום מושלם (Perfect Day) לא ממומש — נמוך
- הישג "יום מושלם" מוגדר אבל אין לוגיקה שבודקת אם כל המשימות הושלמו ביום אחד
- `checkAndUnlock` לא בודק perfect day

#### 3. `confirm()` נייטיבי — נמוך
- מחיקת משימה ב-parent/tasks משתמשת ב-`window.confirm()` נייטיבי
- שאר העמודים משתמשים במודאלים יפים

#### 4. אין Service Worker — נמוך
- PWA manifest קיים אבל אין service worker לאופליין support
- לא בהכרח נדרש, אבל ישלים את חווית ה-PWA

#### 5. חוסר עקביות ב-Notification Dropdown — נמוך
- ב-Dashboard layout, notifications מבוססים על הילד הראשון (ברירת מחדל)
- אם יש מספר ילדים, ההתראות מציגות רק של הראשון
- `selectedChildId` ב-layout לא מסונכרן עם ה-selectedChildId בדף עצמו

---

## 📋 רשימת עדיפויות

### קריטי 🔴
| # | בעיה | קובץ | מאמץ |
|---|------|------|------|
| 1 | manifest.json מחזיר 404 (PWA שבור) | public/manifest.json + Vercel config | נמוך |
| 2 | חוסר בדיקות הרשאה ב-children/tasks queries | convex/children.ts, convex/tasks.ts | בינוני |

### בינוני 🟡
| # | בעיה | קובץ | מאמץ |
|---|------|------|------|
| 3 | Streak לא מתעדכן | convex/tasks.ts (completeTask) | בינוני |
| 4 | Achievement auto-check לא מחובר | convex/tasks.ts + src/dashboard/tasks | נמוך |
| 5 | שם ישן בדפי Auth | src/app/(auth)/sign-in, sign-up | נמוך |
| 6 | Clerk Development Mode | הגדרות Clerk | בינוני |

### נמוך 🟢
| # | בעיה | קובץ | מאמץ |
|---|------|------|------|
| 7 | 5 תלויות שלא בשימוש | package.json | נמוך |
| 8 | 6 פונקציות Convex מתות | convex/ | נמוך |
| 9 | 3 טבלאות סכמה ריקות | convex/schema.ts | נמוך |
| 10 | Dark Mode לא עובד | globals.css + components | גבוה |
| 11 | Perfect Day הישג לא ממומש | convex/achievements.ts | בינוני |
| 12 | Service Worker חסר | public/ | בינוני |
| 13 | confirm() נייטיבי | parent/tasks/page.tsx | נמוך |
| 14 | Rate limiting ל-PIN | convex/families.ts | בינוני |

---

## 🧪 בדיקת האפליקציה החיה

| בדיקה | תוצאה |
|------|--------|
| דף Welcome נטען | ✅ נטען מהר עם עיצוב מלא |
| כפתור "התחל עכשיו" | ✅ מנתב ל-/sign-up |
| כפתור "התחברות" | ✅ מנתב ל-/sign-in |
| דף Sign In | ✅ Clerk נטען עם Facebook + Google |
| לוקליזציה עברית | ✅ טקסטים בעברית |
| RTL | ✅ כיוון ימין-לשמאל תקין |
| שגיאות Console | ❌ manifest.json 404 (x4) |
| גופן Rubik | ✅ נטען ומוצג |
| Material Icons | ✅ נטענים |
| גרסה בפוטר | ✅ v1.1.3 |

---

## 📁 סיכום קבצי הפרויקט

### Frontend (src/)
| קובץ | סטטוס |
|------|--------|
| app/page.tsx (Welcome) | ✅ מלא |
| app/layout.tsx (Root) | ✅ מלא |
| middleware.ts | ✅ מלא |
| (auth)/sign-in | ⚠️ שם ישן |
| (auth)/sign-up | ⚠️ שם ישן |
| (dashboard)/layout.tsx | ✅ מלא |
| (dashboard)/dashboard/page.tsx | ✅ מלא |
| (dashboard)/dashboard/tasks | ✅ מלא |
| (dashboard)/dashboard/shop | ✅ מלא |
| (dashboard)/dashboard/achievements | ✅ מלא |
| (dashboard)/dashboard/reports | ✅ מלא |
| (parent)/layout.tsx | ✅ מלא |
| (parent)/parent/page.tsx | ✅ מלא |
| (parent)/parent/children | ✅ מלא |
| (parent)/parent/tasks | ✅ מלא |
| (parent)/parent/reduce-points | ✅ מלא |
| (parent)/parent/rewards | ✅ מלא |
| (parent)/parent/reports | ✅ מלא |
| (parent)/parent/settings | ✅ מלא |
| components/pin/ | ✅ מלא |
| components/celebration/ | ✅ מלא |
| components/providers/ | ✅ מלא |

### Backend (convex/)
| קובץ | סטטוס |
|------|--------|
| schema.ts | ✅ מלא (13 טבלאות) |
| users.ts | ✅ מלא |
| families.ts | ✅ מלא |
| children.ts | ⚠️ חסרות בדיקות הרשאה |
| tasks.ts | ⚠️ חסרות בדיקות הרשאה + streak |
| rewards.ts | ✅ מלא |
| achievements.ts | ⚠️ לא מחובר אוטומטית |
| notifications.ts | ✅ מלא |
| pointReductions.ts | ✅ מלא + אבטחה |
| auth.config.ts | ✅ מלא |

---

## 💡 המלצות לשלב הבא

1. **תקן את manifest.json** - בדוק למה Vercel לא מגיש את הקובץ
2. **הוסף בדיקות הרשאה** ל-children, tasks queries/mutations
3. **חבר את streak logic** ב-completeTask
4. **חבר checkAndUnlock** אחרי השלמת משימה
5. **נקה תלויות מיותרות** (recharts, sonner, cva, clsx, tailwind-merge)
6. **עדכן שם בדפי Auth** ל-"כוכבים"
7. **שקול הסרת טבלאות ריקות** (dailyStats, challenges, dailyRewards) או מימושן

---

*דוח זה נוצר באמצעות ביקורת קוד מקיפה + בדיקת האפליקציה החיה*
