import { NextResponse } from 'next/server';
import { saveStoredChapter } from '@/lib/classroomStore';
import { ChapterData } from '@/lib/classroomData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// POST /api/admin/chapters -> Saves an individual updated or new chapter
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { courseSlug, chapter } = body as { courseSlug: string; chapter: ChapterData };

    if (!courseSlug || !chapter || !chapter.id) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload: courseSlug and chapter object with id are required' },
        { status: 400 }
      );
    }

    const success = await saveStoredChapter(courseSlug, chapter);
    if (success) {
      return NextResponse.json({ success: true, message: `Chapter ${chapter.id} updated successfully`, chapter });
    } else {
      return NextResponse.json({ success: false, error: 'Failed to write chapter data' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error saving chapter in API:', error);
    return NextResponse.json({ success: false, error: 'Server error saving chapter' }, { status: 500 });
  }
}
