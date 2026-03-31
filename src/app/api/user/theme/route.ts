import { NextRequest, NextResponse } from "next/server";
import { getSession, updateUserTheme } from "@/lib/auth-utils";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({
        success: false,
        error: "Unauthorized",
        theme: "light",
      });
    }

    return NextResponse.json({
      success: true,
      theme: session.theme || "light",
    });
  } catch (error) {
    console.error("Get theme error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to get theme",
      theme: "light",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { theme } = body;

    // Validate theme value
    const validThemes = ["light", "dark", "system"];
    if (!theme || !validThemes.includes(theme)) {
      return NextResponse.json(
        { success: false, error: "Invalid theme value" },
        { status: 400 }
      );
    }

    // Update theme in database
    await updateUserTheme(session.id, theme);

    return NextResponse.json({
      success: true,
      theme,
      message: "Theme updated successfully",
    });
  } catch (error) {
    console.error("Update theme error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update theme" },
      { status: 500 }
    );
  }
}
