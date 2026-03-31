import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-utils";

export async function GET() {
  try {
    const session = await getSession();

    if (session) {
      return NextResponse.json({
        success: true,
        data: {
          id: session.id,
          email: session.email,
          name: session.name,
          image: session.image,
          role: session.role,
          theme: session.theme,
          onboarded: session.onboarded,
        },
      });
    }

    return NextResponse.json({
      success: false,
      data: null,
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({
      success: false,
      data: null,
    });
  }
}
