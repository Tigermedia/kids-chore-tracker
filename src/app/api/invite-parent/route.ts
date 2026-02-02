import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    const client = await clerkClient();
    await client.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://kids-chore-tracker-theta.vercel.app"}/sign-up`,
      ignoreExisting: true,
      notify: true,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send invitation";
    console.error("Clerk invitation error:", message);
    // Don't fail the whole flow if email sending fails
    // The DB invite was already created
    return NextResponse.json({ success: false, warning: message });
  }
}
