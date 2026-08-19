import { NextResponse } from 'next/server';
import { getStoredCourses, saveStoredCourses } from '@/lib/classroomStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/admin/courses -> Returns all courses and chapters
export async function GET() {
  try {
    const courses = await getStoredCourses();
    return NextResponse.json(
      { success: true, courses },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('Error fetching courses in API:', error);
    return NextResponse.json({ success: false, error: 'Error reading courses data' }, { status: 500 });
  }
}

// POST /api/admin/courses -> Saves updated courses array
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { courses } = body;

    if (!Array.isArray(courses)) {
      return NextResponse.json({ success: false, error: 'Invalid payload: courses must be an array' }, { status: 400 });
    }

    const success = await saveStoredCourses(courses);
    if (success) {
      return NextResponse.json({ success: true, message: 'Courses updated successfully' });
    } else {
      return NextResponse.json({ success: false, error: 'Failed to write courses to storage' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error saving courses in API:', error);
    return NextResponse.json({ success: false, error: 'Server error saving courses' }, { status: 500 });
  }
}
