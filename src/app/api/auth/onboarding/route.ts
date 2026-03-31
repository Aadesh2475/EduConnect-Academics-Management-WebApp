import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth-utils";

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
    const { role, profileData } = body;

    // Validate role matches session role
    if (role?.toUpperCase() !== session.role?.toUpperCase()) {
      return NextResponse.json(
        { success: false, error: "Role mismatch" },
        { status: 403 }
      );
    }

    const userId = session.userId;

    // Common updates (User model)
    const userUpdates: any = {};
    if (profileData.name) userUpdates.name = profileData.name;
    if (profileData.image) userUpdates.image = profileData.image;
    userUpdates.onboarded = true;

    await prisma.$transaction(async (tx) => {
      // 1. Update User
      await tx.user.update({
        where: { id: userId },
        data: userUpdates,
      });

      // 2. Update Role-specific profile
      if (role === "TEACHER") {
        await tx.teacher.upsert({
          where: { userId },
          create: {
            userId,
            university: profileData.collegeName || "",
            department: profileData.department || "",
            subject: profileData.subject || "",
            address: profileData.address,
            qualification: profileData.qualifications,
            experience: parseInt(profileData.experience) || 0,
            employeeId: profileData.teacherId,
            phone: profileData.mobileNumber,
            alternateEmail: profileData.alternateEmail,
            purpose: profileData.purpose,
            interests: profileData.interests,
            referralSource: profileData.referralSource,
          },
          update: {
            university: profileData.collegeName,
            department: profileData.department,
            subject: profileData.subject,
            address: profileData.address,
            qualification: profileData.qualifications,
            experience: parseInt(profileData.experience) || 0,
            employeeId: profileData.teacherId,
            phone: profileData.mobileNumber,
            alternateEmail: profileData.alternateEmail,
            purpose: profileData.purpose,
            interests: profileData.interests,
            referralSource: profileData.referralSource,
          },
        });
      } else if (role === "STUDENT") {
        await tx.student.upsert({
          where: { userId },
          create: {
            userId,
            dateOfBirth: profileData.dob ? new Date(profileData.dob) : null,
            department: profileData.department,
            semester: parseInt(profileData.semester) || 1,
            section: profileData.section,
            address: profileData.address,
            guardianName: profileData.guardianName,
            guardianPhone: profileData.guardianPhone,
            alternateEmail: profileData.alternateEmail,
            phone: profileData.mobileNumber,
            interests: profileData.interests,
            referralSource: profileData.referralSource,
          },
          update: {
            dateOfBirth: profileData.dob ? new Date(profileData.dob) : null,
            department: profileData.department,
            semester: parseInt(profileData.semester) || 1,
            section: profileData.section,
            address: profileData.address,
            guardianName: profileData.guardianName,
            guardianPhone: profileData.guardianPhone,
            alternateEmail: profileData.alternateEmail,
            phone: profileData.mobileNumber,
            interests: profileData.interests,
            referralSource: profileData.referralSource,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Onboarding completed successfully",
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
