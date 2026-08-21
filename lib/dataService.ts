import { supabase, isSupabaseConfigured } from './supabase';
import { MOCK_COURSES, MOCK_BLOG_POSTS, Course, BlogPost } from './mockData';

export interface DBBooking {
  id: string;
  studentName: string;
  email: string;
  university: string;
  subject: string;
  bookingDate: string;
  timeSlot: string;
  message?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface DBModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
}

export interface DBLesson {
  id: string;
  moduleId: string;
  title: string;
  contentMarkdown: string;
  videoUrl?: string;
  pdfUrl?: string;
  durationMinutes: number;
  isFreePreview: boolean;
  orderIndex: number;
}

const DEFAULT_BOOKINGS: DBBooking[] = [
  {
    id: 'b1',
    studentName: 'Camila Morales',
    email: 'camila.m@uchile.cl',
    university: 'Universidad de Chile',
    subject: 'Cálculo Diferencial',
    bookingDate: '2026-06-15',
    timeSlot: '10:30 - 11:30',
    message: 'Preparación para el Certamen 2 de derivadas implícitas.',
    status: 'confirmed',
    createdAt: new Date().toISOString()
  },
  {
    id: 'b2',
    studentName: 'Mateo Silva',
    email: 'mateo.silva@uc.cl',
    university: 'Pontificia Universidad Católica',
    subject: 'Álgebra Lineal',
    bookingDate: '2026-06-17',
    timeSlot: '15:00 - 16:00',
    message: 'Dudas en diagonalización de matrices.',
    status: 'pending',
    createdAt: new Date().toISOString()
  }
];

// Helper functions for localStorage persistence fallback
function loadLocalStore<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (err) {
    console.error('Error reading localStorage key:', key, err);
  }
  return fallback;
}

function saveLocalStore<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Error saving localStorage key:', key, err);
  }
}

// In-Memory Storage Cache initialized with localStorage fallback
let coursesCache: Course[] | null = null;
let postsCache: BlogPost[] | null = null;
let bookingsCache: DBBooking[] | null = null;

function getCoursesCache(): Course[] {
  if (!coursesCache) {
    const raw = loadLocalStore('app_courses_data', MOCK_COURSES);
    coursesCache = raw.map((c) => ({
      ...c,
      slug: c.slug && c.slug.includes('algebra-lineal')
        ? 'algebra-lineal'
        : c.slug && c.slug.includes('calculo-multivariable')
        ? 'calculo-multivariable'
        : c.slug
    }));
  }
  return coursesCache;
}

function getPostsCache(): BlogPost[] {
  if (!postsCache) {
    postsCache = loadLocalStore('app_blog_posts_data', MOCK_BLOG_POSTS);
  }
  return postsCache;
}

function getBookingsCache(): DBBooking[] {
  if (!bookingsCache) {
    bookingsCache = loadLocalStore('app_bookings_data', DEFAULT_BOOKINGS);
  }
  return bookingsCache;
}

export const DataService = {
  // COURSES
  async getCourses(): Promise<Course[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('order_index', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map(c => ({
          id: c.id,
          slug: c.slug,
          title: c.title,
          category: c.category,
          level: c.level,
          description: c.description,
          mathFormulaLatex: c.math_formula_latex,
          durationHours: c.duration_hours,
          featured: c.is_published,
          imageBg: c.image_bg || 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(99, 102, 241, 0.3) 100%)',
          modulesCount: 5,
          chapters: ['Capítulo 1', 'Capítulo 2', 'Capítulo 3']
        }));
      }
    }
    return getCoursesCache();
  },

  async saveCourse(courseData: Partial<Course>): Promise<Course> {
    if (isSupabaseConfigured && supabase) {
      const dbPayload = {
        slug: courseData.slug || courseData.title?.toLowerCase().replace(/\s+/g, '-') || 'curso',
        title: courseData.title,
        category: courseData.category,
        level: courseData.level,
        description: courseData.description,
        math_formula_latex: courseData.mathFormulaLatex,
        duration_hours: courseData.durationHours || 10,
        is_published: courseData.featured ?? true
      };

      if (courseData.id) {
        await supabase.from('courses').update(dbPayload).eq('id', courseData.id);
      } else {
        await supabase.from('courses').insert([dbPayload]);
      }
    }

    let cache = [...getCoursesCache()];
    let savedItem: Course;

    if (courseData.id) {
      cache = cache.map(c => c.id === courseData.id ? { ...c, ...courseData } as Course : c);
      savedItem = cache.find(c => c.id === courseData.id)!;
    } else {
      savedItem = {
        id: `c_${Date.now()}`,
        slug: courseData.slug || courseData.title?.toLowerCase().replace(/\s+/g, '-') || 'curso',
        title: courseData.title || 'Nuevo Curso',
        category: (courseData.category as any) || 'Cálculo',
        level: (courseData.level as any) || 'Pregrado',
        description: courseData.description || 'Descripción del curso...',
        mathFormulaLatex: courseData.mathFormulaLatex || '\\int f(x)dx',
        modulesCount: courseData.modulesCount || 4,
        durationHours: courseData.durationHours || 20,
        featured: courseData.featured ?? true,
        imageBg: courseData.imageBg || 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(99, 102, 241, 0.3) 100%)',
        chapters: courseData.chapters || ['Módulo 1', 'Módulo 2', 'Módulo 3']
      };
      cache.push(savedItem);
    }

    coursesCache = cache;
    saveLocalStore('app_courses_data', cache);
    return savedItem;
  },

  async deleteCourse(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('courses').delete().eq('id', id);
    }
    const cache = getCoursesCache().filter(c => c.id !== id);
    coursesCache = cache;
    saveLocalStore('app_courses_data', cache);
  },

  // BOOKINGS
  async getBookings(): Promise<DBBooking[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) {
        return data.map(b => ({
          id: b.id,
          studentName: b.student_name,
          email: b.email,
          university: b.university,
          subject: b.subject,
          bookingDate: b.booking_date,
          timeSlot: b.time_slot,
          message: b.message,
          status: b.status,
          createdAt: b.created_at
        }));
      }
    }
    return getBookingsCache();
  },

  async updateBookingStatus(id: string, status: 'pending' | 'confirmed' | 'cancelled'): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('bookings').update({ status }).eq('id', id);
    }
    const cache = getBookingsCache().map(b => b.id === id ? { ...b, status } : b);
    bookingsCache = cache;
    saveLocalStore('app_bookings_data', cache);
  },

  async deleteBooking(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('bookings').delete().eq('id', id);
    }
    const cache = getBookingsCache().filter(b => b.id !== id);
    bookingsCache = cache;
    saveLocalStore('app_bookings_data', cache);
  },

  // BLOG POSTS
  async getBlogPosts(): Promise<BlogPost[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) {
        return data.map(p => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          category: p.category,
          excerpt: p.excerpt,
          content: p.content_html,
          date: p.created_at ? p.created_at.split('T')[0] : '2026-06-01',
          readTime: p.read_time || '5 min',
          author: p.author || 'Dr. Álvaro Hernández'
        }));
      }
    }
    return getPostsCache();
  },

  async saveBlogPost(postData: Partial<BlogPost>): Promise<BlogPost> {
    if (isSupabaseConfigured && supabase) {
      const payload = {
        slug: postData.slug || postData.title?.toLowerCase().replace(/\s+/g, '-'),
        title: postData.title,
        category: postData.category,
        excerpt: postData.excerpt,
        content_html: postData.content,
        read_time: postData.readTime || '5 min',
        author: postData.author || 'Dr. Álvaro Hernández'
      };

      if (postData.id) {
        await supabase.from('blog_posts').update(payload).eq('id', postData.id);
      } else {
        await supabase.from('blog_posts').insert([payload]);
      }
    }

    let cache = [...getPostsCache()];
    let savedItem: BlogPost;

    if (postData.id) {
      cache = cache.map(p => p.id === postData.id ? { ...p, ...postData } as BlogPost : p);
      savedItem = cache.find(p => p.id === postData.id)!;
    } else {
      savedItem = {
        id: `p_${Date.now()}`,
        slug: postData.slug || 'post-' + Date.now(),
        title: postData.title || 'Nuevo Artículo',
        category: postData.category || 'Educación',
        excerpt: postData.excerpt || 'Resumen...',
        content: postData.content || '<p>Contenido del artículo...</p>',
        date: new Date().toISOString().split('T')[0],
        readTime: postData.readTime || '5 min',
        author: postData.author || 'Dr. Álvaro Hernández'
      };
      cache.push(savedItem);
    }

    postsCache = cache;
    saveLocalStore('app_blog_posts_data', cache);
    return savedItem;
  },

  async deleteBlogPost(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('blog_posts').delete().eq('id', id);
    }
    const cache = getPostsCache().filter(p => p.id !== id);
    postsCache = cache;
    saveLocalStore('app_blog_posts_data', cache);
  }
};
