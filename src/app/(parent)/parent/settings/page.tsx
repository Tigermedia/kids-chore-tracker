"use client";

import { useState, useEffect, Component, ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { useUser, useClerk } from "@clerk/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { PinInput } from "../../../../components/pin/PinInput";

// Error boundary wrapper for new sections
class SectionErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error) {
    console.error("Section error:", error);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

export default function SettingsPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const family = useQuery(api.users.getUserFamily);
  const hasPin = useQuery(api.families.hasParentPin);

  // Edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingFamily, setIsEditingFamily] = useState(false);
  const [editName, setEditName] = useState("");
  const [editFamily, setEditFamily] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingFamily, setSavingFamily] = useState(false);

  const [showPinChange, setShowPinChange] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);

  const verifyParentPin = useMutation(api.families.verifyParentPin);
  const setParentPin = useMutation(api.families.setParentPin);
  const updateFamilyName = useMutation(api.families.updateFamilyName);

  // Initialize edit values when data loads
  useEffect(() => {
    if (user?.fullName || user?.firstName) {
      setEditName(user.fullName || user.firstName || "");
    }
  }, [user]);

  useEffect(() => {
    if (family?.name) {
      setEditFamily(family.name);
    }
  }, [family]);

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setSavingName(true);
    try {
      await user?.update({
        firstName: editName.split(" ")[0],
        lastName: editName.split(" ").slice(1).join(" ") || undefined,
      });
      setIsEditingName(false);
    } catch (error) {
      console.error("Failed to update name:", error);
    }
    setSavingName(false);
  };

  const handleSaveFamily = async () => {
    if (!editFamily.trim()) return;
    setSavingFamily(true);
    try {
      await updateFamilyName({ name: editFamily.trim() });
      setIsEditingFamily(false);
    } catch (error) {
      console.error("Failed to update family name:", error);
    }
    setSavingFamily(false);
  };

  const handlePinChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");
    setPinSuccess(false);

    if (newPin.length !== 4) {
      setPinError("קוד PIN חייב להכיל 4 ספרות");
      return;
    }

    if (newPin !== confirmPin) {
      setPinError("הקודים אינם תואמים");
      return;
    }

    // If PIN exists, verify current PIN first
    if (hasPin) {
      const isValid = await verifyParentPin({ pin: currentPin });
      if (!isValid) {
        setPinError("קוד PIN הנוכחי שגוי");
        return;
      }
    }

    // Set new PIN
    await setParentPin({ pin: newPin });
    setPinSuccess(true);
    setShowPinChange(false);
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");

    // Clear success message after 3 seconds
    setTimeout(() => setPinSuccess(false), 3000);
  };

  const handleSignOut = async () => {
    if (confirm("האם אתה בטוח שברצונך להתנתק?")) {
      // Clear parent mode session
      localStorage.removeItem("parentModeLastActivity");
      await signOut();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#a29bfe]">הגדרות</h1>

      {/* Account Info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#a29bfe]">person</span>
          פרטי חשבון
        </h2>
        <div className="space-y-3">
          {/* Name - Editable */}
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-gray-500">שם</span>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="border rounded-lg px-3 py-1 text-sm w-40"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="text-[#22d1c6] hover:text-[#1db3a9]"
                >
                  <span className="material-symbols-outlined text-xl">
                    {savingName ? "hourglass_empty" : "check"}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setIsEditingName(false);
                    setEditName(user?.fullName || user?.firstName || "");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-medium">{user?.fullName || user?.firstName || "משתמש"}</span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-gray-400 hover:text-[#a29bfe]"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
              </div>
            )}
          </div>

          {/* Email - Read only */}
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-gray-500">אימייל</span>
            <span className="font-medium">{user?.primaryEmailAddress?.emailAddress}</span>
          </div>

          {/* Family Name - Editable */}
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-500">משפחה</span>
            {isEditingFamily ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editFamily}
                  onChange={(e) => setEditFamily(e.target.value)}
                  className="border rounded-lg px-3 py-1 text-sm w-40"
                  autoFocus
                />
                <button
                  onClick={handleSaveFamily}
                  disabled={savingFamily}
                  className="text-[#22d1c6] hover:text-[#1db3a9]"
                >
                  <span className="material-symbols-outlined text-xl">
                    {savingFamily ? "hourglass_empty" : "check"}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setIsEditingFamily(false);
                    setEditFamily(family?.name || "");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-medium">{family?.name || "טוען..."}</span>
                <button
                  onClick={() => setIsEditingFamily(true)}
                  className="text-gray-400 hover:text-[#a29bfe]"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PIN Settings */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#a29bfe]">lock</span>
          קוד PIN להורים
        </h2>

        {pinSuccess && (
          <div className="bg-green-100 text-green-700 px-4 py-3 rounded-xl mb-4">
            קוד ה-PIN עודכן בהצלחה!
          </div>
        )}

        {!showPinChange ? (
          <div className="flex items-center justify-between">
            <p className="text-gray-500">
              {hasPin ? "קוד PIN מוגדר" : "לא הוגדר קוד PIN"}
            </p>
            <button
              onClick={() => setShowPinChange(true)}
              className="px-4 py-2 bg-[#a29bfe] text-white rounded-xl hover:bg-[#8b84e8] transition-colors"
            >
              {hasPin ? "שנה קוד" : "הגדר קוד"}
            </button>
          </div>
        ) : (
          <form onSubmit={handlePinChange} className="space-y-4">
            {hasPin && (
              <div>
                <label className="block text-sm font-medium mb-2">קוד נוכחי</label>
                <PinInput
                  value={currentPin}
                  onChange={setCurrentPin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">קוד חדש</label>
              <PinInput
                value={newPin}
                onChange={setNewPin}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">אשר קוד חדש</label>
              <PinInput
                value={confirmPin}
                onChange={setConfirmPin}
                error={pinError.includes("תואמים")}
              />
            </div>

            {pinError && (
              <p className="text-red-500 text-sm text-center">{pinError}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPinChange(false);
                  setCurrentPin("");
                  setNewPin("");
                  setConfirmPin("");
                  setPinError("");
                }}
                className="flex-1 px-4 py-3 border rounded-xl hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-[#a29bfe] text-white rounded-xl hover:bg-[#8b84e8] transition-colors font-medium"
              >
                שמור
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Account Sharing */}
      <SectionErrorBoundary>
        <AccountSharingSection />
      </SectionErrorBoundary>

      {/* Pending Invites for Current User */}
      <SectionErrorBoundary>
        <PendingInvitesSection />
      </SectionErrorBoundary>

      {/* Sign Out */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#a29bfe]">logout</span>
          התנתקות
        </h2>
        <p className="text-gray-500 mb-4">התנתק מהחשבון הנוכחי</p>
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-3 border-2 border-red-500 text-red-500 rounded-xl hover:bg-red-50 transition-colors font-medium"
        >
          התנתק
        </button>
      </div>
    </div>
  );
}

// ===== Account Sharing Section =====
function AccountSharingSection() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);

  const familyMembers = useQuery(api.families.getFamilyMembers);
  const pendingInvites = useQuery(api.families.getPendingInvites);
  const inviteParent = useMutation(api.families.inviteParent);
  const cancelInvite = useMutation(api.families.cancelInvite);
  const removeFamilyMember = useMutation(api.families.removeFamilyMember);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess(false);

    if (!inviteEmail.trim()) return;

    setSendingInvite(true);
    try {
      await inviteParent({ email: inviteEmail.trim() });
      setInviteSuccess(true);
      setInviteEmail("");
      setTimeout(() => setInviteSuccess(false), 3000);
    } catch (error: any) {
      setInviteError(error.message || "שגיאה בשליחת ההזמנה");
    }
    setSendingInvite(false);
  };

  const handleCancelInvite = async (inviteId: Id<"familyInvites">) => {
    try {
      await cancelInvite({ inviteId });
    } catch (error: any) {
      console.error("Failed to cancel invite:", error);
    }
  };

  const handleRemoveMember = async (memberId: Id<"familyMembers">, name: string) => {
    if (!confirm(`האם להסיר את ${name} מהמשפחה?`)) return;
    try {
      await removeFamilyMember({ memberId });
    } catch (error: any) {
      console.error("Failed to remove member:", error);
    }
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case "owner":
        return "בעלים";
      case "parent":
        return "הורה";
      case "viewer":
        return "צופה";
      default:
        return role;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#a29bfe]">group_add</span>
        שיתוף חשבון
      </h2>

      {/* Current Family Members */}
      {familyMembers && familyMembers.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">חברי משפחה</h3>
          <div className="space-y-2">
            {familyMembers.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#a29bfe] text-white flex items-center justify-center text-sm font-bold">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{member.name}</div>
                    <div className="text-xs text-gray-400">{member.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                    {roleLabel(member.role)}
                  </span>
                  {member.role !== "owner" && (
                    <button
                      onClick={() => handleRemoveMember(member._id, member.name)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                      title="הסר מהמשפחה"
                    >
                      <span className="material-symbols-outlined text-lg">
                        person_remove
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Invites (sent) */}
      {pendingInvites && pendingInvites.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">הזמנות ממתינות</h3>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite._id}
                className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl border border-yellow-100"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-yellow-500">
                    schedule
                  </span>
                  <span className="text-sm">{invite.invitedEmail}</span>
                </div>
                <button
                  onClick={() => handleCancelInvite(invite._id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="בטל הזמנה"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Form */}
      <form onSubmit={handleInvite} className="space-y-3">
        <h3 className="text-sm font-medium text-gray-500">הזמן הורה נוסף</h3>
        <div className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="כתובת אימייל"
            className="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#a29bfe]"
            dir="ltr"
          />
          <button
            type="submit"
            disabled={sendingInvite || !inviteEmail.trim()}
            className="px-4 py-2 bg-[#a29bfe] text-white rounded-xl hover:bg-[#8b84e8] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendingInvite ? (
              <span className="material-symbols-outlined text-sm animate-spin">
                hourglass_empty
              </span>
            ) : (
              "הזמן"
            )}
          </button>
        </div>

        {inviteError && (
          <p className="text-red-500 text-sm">{inviteError}</p>
        )}
        {inviteSuccess && (
          <p className="text-green-600 text-sm">ההזמנה נשלחה בהצלחה!</p>
        )}
      </form>
    </div>
  );
}

// ===== Pending Invites for Current User (received invites) =====
function PendingInvitesSection() {
  const myInvites = useQuery(api.families.getMyInvites);
  const acceptInvite = useMutation(api.families.acceptInvite);
  const declineInvite = useMutation(api.families.declineInvite);
  const [processing, setProcessing] = useState<string | null>(null);

  if (!myInvites || myInvites.length === 0) return null;

  const handleAccept = async (inviteId: Id<"familyInvites">) => {
    if (
      !confirm(
        "קבלת ההזמנה תעביר אותך למשפחה החדשה. אם יש לך משפחה קיימת ללא ילדים, היא תימחק. להמשיך?"
      )
    )
      return;

    setProcessing(inviteId);
    try {
      await acceptInvite({ inviteId });
    } catch (error: any) {
      console.error("Failed to accept invite:", error);
    }
    setProcessing(null);
  };

  const handleDecline = async (inviteId: Id<"familyInvites">) => {
    setProcessing(inviteId);
    try {
      await declineInvite({ inviteId });
    } catch (error: any) {
      console.error("Failed to decline invite:", error);
    }
    setProcessing(null);
  };

  return (
    <div className="bg-blue-50 rounded-2xl p-6 shadow-sm border border-blue-200">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-blue-500">mail</span>
        הזמנות שהתקבלו
      </h2>
      <div className="space-y-3">
        {myInvites.map((invite) => (
          <div
            key={invite._id}
            className="bg-white p-4 rounded-xl border border-blue-100"
          >
            <div className="mb-3">
              <div className="font-medium">
                {invite.inviterName} מזמין אותך להצטרף ל{invite.familyName}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAccept(invite._id)}
                disabled={processing === invite._id}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
              >
                {processing === invite._id ? "מעבד..." : "קבל"}
              </button>
              <button
                onClick={() => handleDecline(invite._id)}
                disabled={processing === invite._id}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                דחה
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
