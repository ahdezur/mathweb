import fs from 'fs/promises';
import path from 'path';
import { CourseContent, ChapterData, MOCK_CLASSROOM_DATA, getCourseContentBySlug } from './classroomData';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORAGE_FILE = path.join(DATA_DIR, 'courses_storage.json');

const ALL_COURSE_SLUGS = [
  'calculo-diferencial',
  'calculo-integral',
  'algebra-lineal',
  'calculo-multivariable',
  'ecuaciones-diferenciales',
  'introduccion-calculo',
  'introduccion-algebra',
  'topologia-rn',
  'calculo-avanzado'
];

function getAllDefaultCourses(): CourseContent[] {
  return ALL_COURSE_SLUGS.map((slug) => getCourseContentBySlug(slug));
}

// Ensure data directory and initial JSON file exist with all courses
async function ensureStorageFile(): Promise<CourseContent[]> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    let existing: CourseContent[] = [];
    try {
      const data = await fs.readFile(STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        existing = parsed;
      }
    } catch {
      // File doesn't exist or is invalid
    }

    const defaultCourses = getAllDefaultCourses();
    const merged: CourseContent[] = [...existing];

    defaultCourses.forEach((defCourse) => {
      const existingIdx = merged.findIndex((c) => c.slug === defCourse.slug);
      if (existingIdx === -1) {
        merged.push(defCourse);
      } else {
        merged[existingIdx].title = defCourse.title;
        merged[existingIdx].category = defCourse.category;
        merged[existingIdx].level = defCourse.level;
      }
    });

    await fs.writeFile(STORAGE_FILE, JSON.stringify(merged, null, 2), 'utf-8');
    return merged;
  } catch (error) {
    console.error('Error in ensureStorageFile:', error);
    return getAllDefaultCourses();
  }
}

// Read all courses from JSON file
export async function getStoredCourses(): Promise<CourseContent[]> {
  const rawCourses = await ensureStorageFile();
  return rawCourses.map((course) => {
    const unitChapters = (course.units || []).flatMap((u) => u.chapters || []);
    const topChapters = course.chapters || [];
    
    // Map by ID to combine and eliminate duplicates while preserving latest edits
    const chapterMap = new Map<string, ChapterData>();
    unitChapters.forEach((ch) => chapterMap.set(ch.id, ch));
    topChapters.forEach((ch) => chapterMap.set(ch.id, ch));

    const finalChapters = Array.from(chapterMap.values());
    return {
      ...course,
      chapters: finalChapters
    };
  });
}

// Get single course by slug
export async function getStoredCourseBySlug(slug: string): Promise<CourseContent | null> {
  const courses = await getStoredCourses();
  return courses.find((c) => c.slug === slug) || courses[0] || null;
}

// Save all courses array to JSON file
export async function saveStoredCourses(courses: CourseContent[]): Promise<boolean> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STORAGE_FILE, JSON.stringify(courses, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving stored courses:', error);
    return false;
  }
}

// Save or update an individual chapter inside a course by slug
export async function saveStoredChapter(courseSlug: string, updatedChapter: ChapterData): Promise<boolean> {
  try {
    const courses = await getStoredCourses();
    const courseIndex = courses.findIndex((c) => c.slug === courseSlug);
    
    if (courseIndex === -1) {
      console.error(`Course with slug "${courseSlug}" not found.`);
      return false;
    }

    const course = courses[courseIndex];
    const chapterIndex = course.chapters.findIndex((ch) => ch.id === updatedChapter.id);

    if (chapterIndex !== -1) {
      course.chapters[chapterIndex] = updatedChapter;
    } else {
      course.chapters.push(updatedChapter);
    }

    // Also update chapter inside unit if present
    course.units.forEach((unit) => {
      const unitChapterIdx = unit.chapters.findIndex((ch) => ch.id === updatedChapter.id);
      if (unitChapterIdx !== -1) {
        unit.chapters[unitChapterIdx] = updatedChapter;
      }
    });

    return await saveStoredCourses(courses);
  } catch (error) {
    console.error('Error in saveStoredChapter:', error);
    return false;
  }
}
