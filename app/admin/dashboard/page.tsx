'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DataService, DBBooking } from '@/lib/dataService';
import { Course, BlogPost } from '@/lib/mockData';
import { MathFormula } from '@/components/math/MathFormula';

import { CourseContent, ChapterData, UnitData } from '@/lib/classroomData';

// Helper input component that preserves native keyboard composition (dead keys / accents like ´ + a -> á)
function EditableTitleInput({
  initialValue,
  onSave,
  className,
  title,
}: {
  initialValue: string;
  onSave: (val: string) => void;
  className?: string;
  title?: string;
}) {
  const [val, setVal] = useState(initialValue);
  const isComposing = React.useRef(false);

  useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setVal(newVal);
    if (!isComposing.current) {
      onSave(newVal);
    }
  };

  const handleCompositionStart = () => {
    isComposing.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposing.current = false;
    onSave(e.currentTarget.value);
  };

  const handleBlur = () => {
    onSave(val);
  };

  return (
    <input
      type="text"
      value={val}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onBlur={handleBlur}
      className={className}
      title={title}
    />
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'bookings' | 'blog'>('overview');
  const [courses, setCourses] = useState<Course[]>([]);
  const [classroomCourses, setClassroomCourses] = useState<CourseContent[]>([]);
  const [bookings, setBookings] = useState<DBBooking[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Course Create/Edit
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);

  // Modal State for Blog Create/Edit
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);

  useEffect(() => {
    // Check Auth Session Guard
    const session = localStorage.getItem('admin_session');
    if (!session) {
      router.push('/admin/login');
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    const [fetchedCourses, fetchedBookings, fetchedPosts] = await Promise.all([
      DataService.getCourses(),
      DataService.getBookings(),
      DataService.getBlogPosts()
    ]);
    setCourses(fetchedCourses);
    setBookings(fetchedBookings);
    setPosts(fetchedPosts);

    // Fetch rich classroom courses data from API storage
    try {
      const res = await fetch(`/api/admin/courses?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.courses)) {
        const sorted = data.courses.slice().sort((a: CourseContent, b: CourseContent) => (a.number || 0) - (b.number || 0));
        setClassroomCourses(sorted);
      }
    } catch (err) {
      console.error('Error fetching admin classroom courses:', err);
    }

    setLoading(false);
  };

  const handleAddChapterToCourse = async (courseSlug: string, unitId: string) => {
    const course = classroomCourses.find((c) => c.slug === courseSlug);
    if (!course) return;

    const unit = (course.units || []).find((u) => u.id === unitId);
    const nextNum = ((unit?.chapters?.length) || 0) + 1;

    const title = prompt(`Ingrese el título para el Capítulo ${nextNum}:`, `Capítulo ${nextNum}: Nuevo Tema`);
    if (!title) return;

    const newChapterId = `cap-${Date.now()}`;
    const newChapter: ChapterData = {
      id: newChapterId,
      number: nextNum,
      displayNumber: String(nextNum),
      title: title,
      summary: 'Resumen introductorio del nuevo capítulo.',
      mathKey: 'f(x) = ...',
      motivacion: '<h3>Motivación</h3><p>Descripción del contexto...</p>',
      teoria: '<h3>Teoría</h3><p>Contenido teórico en LaTeX...</p>',
      practica: { text: '<p>Ejemplo resuelto...</p>' },
      ejercicios: {
        problems: [
          {
            problem: 'Ejercicio 1: Enunciado propuesto en LaTeX...',
            pauta: '1. Solución paso a paso...',
            dificultad: 'Medio',
            conceptos: ['Concepto Clave'],
            habilidades: ['Cálculo Algorítmico']
          }
        ],
        formulasClave: [{ label: 'Fórmula Clave 1', latex: 'y = f(x)' }]
      }
    };

    // Actualizar unidades y lista de capítulos del curso
    const updatedUnits = (course.units || []).map((u) => {
      if (u.id === unitId) {
        return {
          ...u,
          chapters: [...(u.chapters || []), newChapter].sort((a, b) => a.number - b.number)
        };
      }
      return u;
    });

    const updatedChapters = [...(course.chapters || []).filter((ch) => ch.id !== newChapterId), newChapter].sort((a, b) => a.number - b.number);
    const updatedCourse = { ...course, units: updatedUnits, chapters: updatedChapters };
    const updatedCourses = classroomCourses.map((c) => (c.slug === courseSlug ? updatedCourse : c));

    // Actualizar estado local inmediatamente para la UI
    setClassroomCourses(updatedCourses);

    try {
      await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: updatedCourses })
      });
      await loadData();
    } catch (err) {
      console.error('Error adding chapter:', err);
    }
  };

  const handleDeleteChapter = async (courseSlug: string, chapterId: string) => {
    if (!confirm('¿Estás seguro de eliminar este capítulo?')) return;

    const course = classroomCourses.find((c) => c.slug === courseSlug);
    if (!course) return;

    const updatedChapters = course.chapters.filter((ch) => ch.id !== chapterId);
    const updatedUnits = course.units.map((u) => ({
      ...u,
      chapters: u.chapters.filter((ch) => ch.id !== chapterId)
    }));

    const updatedCourse = { ...course, chapters: updatedChapters, units: updatedUnits };
    const updatedCourses = classroomCourses.map((c) => (c.slug === courseSlug ? updatedCourse : c));

    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: updatedCourses })
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      }
    } catch (err) {
      console.error('Error deleting chapter:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    router.push('/admin/login');
  };

  // Course Handlers
  const handleOpenCourseModal = (course?: Partial<Course>) => {
    if (course) {
      setEditingCourse({ ...course });
    } else {
      setEditingCourse({
        title: '',
        category: 'Cálculo',
        level: 'Pregrado',
        description: '',
        mathFormulaLatex: '\\int_{a}^{b} f(x)dx',
        durationHours: 20,
        featured: true,
        chapters: ['Introducción', 'Conceptos Clave', 'Ejercicios Avanzados']
      });
    }
    setCourseModalOpen(true);
  };

  // Helper function for slug creation
  const slugify = (text: string): string => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !editingCourse.title) return;

    const savedCatCourse = await DataService.saveCourse(editingCourse);

    const baseSlug = slugify(editingCourse.title) || `curso-${Date.now()}`;
    let slug = editingCourse.slug || savedCatCourse.slug || baseSlug;

    // Check if new course needs a unique slug to prevent overwriting existing course
    const isNewCourse = !editingCourse.id && !classroomCourses.some((c) => c.slug === slug || c.id === savedCatCourse.id);
    if (isNewCourse && classroomCourses.some((c) => c.slug === slug)) {
      slug = `${baseSlug}-${Date.now()}`;
    }

    let updatedClassroomCourses = [...classroomCourses];
    const existingIdx = updatedClassroomCourses.findIndex((c) => c.id === savedCatCourse.id || c.slug === slug);

    if (existingIdx >= 0) {
      updatedClassroomCourses[existingIdx] = {
        ...updatedClassroomCourses[existingIdx],
        title: editingCourse.title,
        description: editingCourse.description || updatedClassroomCourses[existingIdx].description,
        category: editingCourse.category || updatedClassroomCourses[existingIdx].category,
        level: editingCourse.level || updatedClassroomCourses[existingIdx].level,
        mathFormulaLatex: editingCourse.mathFormulaLatex || updatedClassroomCourses[existingIdx].mathFormulaLatex,
      };
    } else {
      const newClassroomCourse: CourseContent = {
        id: savedCatCourse.id || `course-${Date.now()}`,
        slug: slug,
        title: editingCourse.title,
        description: editingCourse.description || 'Programa de estudio pedagógico.',
        category: editingCourse.category || 'Cálculo',
        level: editingCourse.level || 'Pregrado',
        mathFormulaLatex: editingCourse.mathFormulaLatex,
        units: [
          {
            id: `unit-${Date.now()}-1`,
            number: 1,
            title: 'Unidad 1: Módulos Introductorios',
            chapters: []
          }
        ],
        chapters: []
      };
      updatedClassroomCourses.push(newClassroomCourse);
    }

    // Immediately update local UI state so new course is visible in TAB 2
    setClassroomCourses(updatedClassroomCourses);

    try {
      await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: updatedClassroomCourses })
      });
    } catch (err) {
      console.error('Error saving classroom course:', err);
    }

    setCourseModalOpen(false);
    setActiveTab('courses');
    await loadData();
  };

  const handleDeleteCourse = async (courseSlug: string, courseId?: string) => {
    if (!confirm('¿Estás seguro de eliminar este curso y todo su contenido?')) return;

    if (courseId) {
      await DataService.deleteCourse(courseId);
    }

    const updatedCourses = classroomCourses.filter((c) => c.slug !== courseSlug && c.id !== courseId);
    setClassroomCourses(updatedCourses);

    try {
      await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: updatedCourses })
      });
    } catch (err) {
      console.error('Error deleting classroom course:', err);
    }

    await loadData();
  };

  // Unit Handlers
  const handleAddUnitToCourse = async (courseSlug: string) => {
    const course = classroomCourses.find((c) => c.slug === courseSlug);
    if (!course) return;

    const nextNum = (course.units?.length || 0) + 1;
    const title = prompt(`Ingrese el título para la Unidad ${nextNum}:`, `Unidad ${nextNum}: Nuevos Contenidos`);
    if (!title) return;

    const newUnit: UnitData = {
      id: `unit-${Date.now()}-${nextNum}`,
      number: nextNum,
      title: title,
      chapters: []
    };

    const updatedUnits = [...(course.units || []), newUnit].sort((a, b) => a.number - b.number);
    const updatedCourse = { ...course, units: updatedUnits };
    const updatedCourses = classroomCourses.map((c) => (c.slug === courseSlug ? updatedCourse : c));

    try {
      await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: updatedCourses })
      });
      loadData();
    } catch (err) {
      console.error('Error adding unit:', err);
    }
  };

  const handleUpdateUnitNumber = async (courseSlug: string, unitId: string, newNumber: number) => {
    const course = classroomCourses.find((c) => c.slug === courseSlug);
    if (!course) return;

    const updatedUnits = course.units
      .map((u) => (u.id === unitId ? { ...u, number: newNumber } : u))
      .sort((a, b) => a.number - b.number);

    const updatedCourse = { ...course, units: updatedUnits };
    const updatedCourses = classroomCourses.map((c) => (c.slug === courseSlug ? updatedCourse : c));

    try {
      await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: updatedCourses })
      });
      loadData();
    } catch (err) {
      console.error('Error updating unit number:', err);
    }
  };

  const handleUpdateUnitTitle = async (courseSlug: string, unitId: string, newTitle: string) => {
    const course = classroomCourses.find((c) => c.slug === courseSlug);
    if (!course) return;

    const updatedUnits = course.units.map((u) => (u.id === unitId ? { ...u, title: newTitle } : u));
    const updatedCourse = { ...course, units: updatedUnits };
    const updatedCourses = classroomCourses.map((c) => (c.slug === courseSlug ? updatedCourse : c));

    try {
      await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: updatedCourses })
      });
      loadData();
    } catch (err) {
      console.error('Error updating unit title:', err);
    }
  };

  const handleDeleteUnit = async (courseSlug: string, unitId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta unidad y todos sus capítulos?')) return;

    const course = classroomCourses.find((c) => c.slug === courseSlug);
    if (!course) return;

    const unitToDelete = course.units.find((u) => u.id === unitId);
    const chapterIdsToDelete = new Set((unitToDelete?.chapters || []).map((ch) => ch.id));

    const updatedUnits = course.units.filter((u) => u.id !== unitId);
    const updatedChapters = (course.chapters || []).filter((ch) => !chapterIdsToDelete.has(ch.id));

    const updatedCourse = { ...course, units: updatedUnits, chapters: updatedChapters };
    const updatedCourses = classroomCourses.map((c) => (c.slug === courseSlug ? updatedCourse : c));

    try {
      await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: updatedCourses })
      });
      loadData();
    } catch (err) {
      console.error('Error deleting unit:', err);
    }
  };

  const handleUpdateChapterNumber = async (courseSlug: string, chapterId: string, newNumber: number) => {
    const course = classroomCourses.find((c) => c.slug === courseSlug);
    if (!course) return;

    const updatedUnits = course.units.map((u) => {
      const updatedChs = u.chapters
        .map((ch) => (ch.id === chapterId ? { ...ch, number: newNumber, displayNumber: String(newNumber) } : ch))
        .sort((a, b) => a.number - b.number);
      return { ...u, chapters: updatedChs };
    });

    const updatedChapters = (course.chapters || [])
      .map((ch) => (ch.id === chapterId ? { ...ch, number: newNumber, displayNumber: String(newNumber) } : ch))
      .sort((a, b) => a.number - b.number);

    const updatedCourse = { ...course, units: updatedUnits, chapters: updatedChapters };
    const updatedCourses = classroomCourses.map((c) => (c.slug === courseSlug ? updatedCourse : c));

    try {
      await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: updatedCourses })
      });
      loadData();
    } catch (err) {
      console.error('Error updating chapter number:', err);
    }
  };

  const handleUpdateChapterTitle = async (courseSlug: string, chapterId: string, newTitle: string) => {
    const course = classroomCourses.find((c) => c.slug === courseSlug);
    if (!course) return;

    const updatedUnits = course.units.map((u) => {
      const updatedChs = u.chapters.map((ch) => (ch.id === chapterId ? { ...ch, title: newTitle } : ch));
      return { ...u, chapters: updatedChs };
    });

    const updatedChapters = (course.chapters || []).map((ch) => (ch.id === chapterId ? { ...ch, title: newTitle } : ch));
    const updatedCourse = { ...course, units: updatedUnits, chapters: updatedChapters };
    const updatedCourses = classroomCourses.map((c) => (c.slug === courseSlug ? updatedCourse : c));

    setClassroomCourses(updatedCourses);

    try {
      await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: updatedCourses })
      });
    } catch (err) {
      console.error('Error updating chapter title:', err);
    }
  };

  const handleMoveChapterToUnit = async (courseSlug: string, chapterId: string, targetUnitId: string) => {
    const course = classroomCourses.find((c) => c.slug === courseSlug);
    if (!course) return;

    let targetChapter: ChapterData | undefined;
    const updatedUnits = course.units.map((u) => {
      const found = u.chapters.find((ch) => ch.id === chapterId);
      if (found) targetChapter = found;
      return { ...u, chapters: u.chapters.filter((ch) => ch.id !== chapterId) };
    });

    if (!targetChapter) return;

    const finalUnits = updatedUnits.map((u) => {
      if (u.id === targetUnitId) {
        return {
          ...u,
          chapters: [...u.chapters, targetChapter!].sort((a, b) => a.number - b.number)
        };
      }
      return u;
    });

    const updatedCourse = { ...course, units: finalUnits };
    const updatedCourses = classroomCourses.map((c) => (c.slug === courseSlug ? updatedCourse : c));

    try {
      await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: updatedCourses })
      });
      loadData();
    } catch (err) {
      console.error('Error moving chapter:', err);
    }
  };

  const handleUpdateCourseNumber = async (courseSlug: string, newNumber: number) => {
    const updatedCourses = classroomCourses.map((c) => {
      if (c.slug === courseSlug) {
        return { ...c, number: newNumber };
      }
      return c;
    }).sort((a, b) => (a.number || 0) - (b.number || 0));

    setClassroomCourses(updatedCourses);

    try {
      await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: updatedCourses })
      });
    } catch (err) {
      console.error('Error updating course number:', err);
    }
  };



  // Booking Handlers
  const handleUpdateBookingStatus = async (id: string, status: 'pending' | 'confirmed' | 'cancelled') => {
    await DataService.updateBookingStatus(id, status);
    loadData();
  };

  const handleDeleteBooking = async (id: string) => {
    if (confirm('¿Eliminar esta reserva de tutoría?')) {
      await DataService.deleteBooking(id);
      loadData();
    }
  };

  // Blog Handlers
  const handleOpenPostModal = (post?: BlogPost) => {
    if (post) {
      setEditingPost({ ...post });
    } else {
      setEditingPost({
        title: '',
        category: 'Cálculo Integral',
        excerpt: '',
        content: '<p>Escribe el contenido del artículo aquí...</p>',
        readTime: '5 min',
        author: 'Dr. Álvaro Hernández'
      });
    }
    setPostModalOpen(true);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    await DataService.saveBlogPost(editingPost);
    setPostModalOpen(false);
    loadData();
  };

  const handleDeletePost = async (id: string) => {
    if (confirm('¿Eliminar este artículo del blog?')) {
      await DataService.deleteBlogPost(id);
      loadData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header Bar */}
      <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 32 32">
                <path d="M 4,16 L 7,16 L 10,26 L 13,4 L 28,4" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round"/>
              </svg>
            </div>
            <span>Álvaro<span className="text-cyan-600 font-normal">Admin</span></span>
          </Link>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <i className="fa-solid fa-shield-halved mr-1"></i> Sesión Administrador Activa
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
            <i className="fa-solid fa-globe mr-1"></i> Ver Sitio Web
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <i className="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Main Admin Area */}
      <div className="flex-1 container mx-auto px-6 py-8 max-w-7xl">
        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-200 mb-8 pb-1">
          <button
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-cyan-600 text-cyan-600 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fa-solid fa-chart-pie"></i> Resumen General
          </button>
          <button
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'courses'
                ? 'border-cyan-600 text-cyan-600 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('courses')}
          >
            <i className="fa-solid fa-graduation-cap"></i> Gestor de Cursos ({classroomCourses.length})
          </button>
          <button
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'bookings'
                ? 'border-cyan-600 text-cyan-600 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('bookings')}
          >
            <i className="fa-regular fa-calendar-check"></i> Reservas Agenda ({bookings.length})
          </button>
          <button
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'blog'
                ? 'border-cyan-600 text-cyan-600 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('blog')}
          >
            <i className="fa-solid fa-book-open"></i> Lecturas / Blog ({posts.length})
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase text-slate-500">Total Cursos</span>
                  <i className="fa-solid fa-graduation-cap text-cyan-600 text-lg"></i>
                </div>
                <span className="text-3xl font-extrabold text-slate-900">{classroomCourses.length}</span>
                <p className="text-xs text-slate-500 mt-1">Cursos activos en catálogo</p>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase text-slate-500">Reservas Solicitadas</span>
                  <i className="fa-regular fa-calendar-check text-indigo-600 text-lg"></i>
                </div>
                <span className="text-3xl font-extrabold text-slate-900">{bookings.length}</span>
                <p className="text-xs text-slate-500 mt-1">Tutorías en agenda</p>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase text-slate-500">Artículos Publicados</span>
                  <i className="fa-solid fa-book-open text-emerald-600 text-lg"></i>
                </div>
                <span className="text-3xl font-extrabold text-slate-900">{posts.length}</span>
                <p className="text-xs text-slate-500 mt-1">Lecturas en el blog</p>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase text-slate-500">Motor Matemático</span>
                  <i className="fa-solid fa-square-root-variable text-purple-600 text-lg"></i>
                </div>
                <span className="text-2xl font-extrabold text-slate-900">KaTeX Nativo</span>
                <p className="text-xs text-slate-500 mt-1">Soporte LaTeX activo</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-bold mb-4 text-cyan-700 flex items-center gap-2">
                <i className="fa-solid fa-rocket"></i> Accesos Rápidos de Administración
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => handleOpenCourseModal()}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-left hover:border-cyan-600 hover:bg-cyan-50/40 transition-all group cursor-pointer"
                >
                  <span className="font-bold text-sm block text-slate-900 group-hover:text-cyan-700">
                    <i className="fa-solid fa-plus-circle mr-2 text-cyan-600"></i> Crear Nuevo Curso
                  </span>
                  <span className="text-xs text-slate-500 block mt-1">
                    Añade un nuevo programa académico con temarios y fórmulas KaTeX.
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('bookings')}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-left hover:border-cyan-600 hover:bg-cyan-50/40 transition-all group cursor-pointer"
                >
                  <span className="font-bold text-sm block text-slate-900 group-hover:text-cyan-700">
                    <i className="fa-regular fa-clock mr-2 text-cyan-600"></i> Revisar Solicitudes de Agenda
                  </span>
                  <span className="text-xs text-slate-500 block mt-1">
                    Gestión de citas confirmadas o pendientes de alumnos.
                  </span>
                </button>

                <button
                  onClick={() => handleOpenPostModal()}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-left hover:border-cyan-600 hover:bg-cyan-50/40 transition-all group cursor-pointer"
                >
                  <span className="font-bold text-sm block text-slate-900 group-hover:text-cyan-700">
                    <i className="fa-solid fa-pen-nib mr-2 text-cyan-600"></i> Publicar Artículo de Lectura
                  </span>
                  <span className="text-xs text-slate-500 block mt-1">
                    Escribe guías y artículos pedagógicos para la comunidad de ingeniería.
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GESTIÓN ESTRUCTURAL DE CURSOS Y CAPÍTULOS */}
        {activeTab === 'courses' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-title">Gestión de Cursos y Estructura de Capítulos</h2>
                <p className="text-xs text-slate-500 mt-1">Crea, edita y organiza las unidades pedagógicas, capítulos y fichas técnicas.</p>
              </div>
              <button
                onClick={() => handleOpenCourseModal()}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-semibold text-sm rounded-xl hover:shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto font-title"
              >
                <i className="fa-solid fa-plus"></i> Crear Nuevo Curso
              </button>
            </div>

            {classroomCourses.map((cContent) => (
              <div key={cContent.id} className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                {/* Header del Curso (Fondo Claro Elegante) */}
                <div className="bg-gradient-to-r from-slate-100 via-cyan-50/70 to-indigo-50/70 text-slate-900 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 bg-white/90 border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs">
                        <span className="text-[11px] font-bold text-slate-500">Curso N°</span>
                        <input
                          type="number"
                          min={1}
                          value={cContent.number || 1}
                          onChange={(e) => handleUpdateCourseNumber(cContent.slug, parseInt(e.target.value) || 1)}
                          className="w-12 text-center text-xs font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-title"
                          title="Cambiar número de orden del curso"
                        />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 font-title flex items-center gap-2.5">
                        <i className="fa-solid fa-graduation-cap text-cyan-600"></i>
                        <span>{cContent.title}</span>
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-800 bg-cyan-100/90 px-3 py-1 rounded-full border border-cyan-200 font-title">
                        {cContent.category} • {cContent.level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-2 max-w-2xl">{cContent.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const catCourse = courses.find((cat) => cat.slug === cContent.slug) || {
                          id: cContent.id,
                          slug: cContent.slug,
                          title: cContent.title,
                          description: cContent.description,
                          category: cContent.category as any,
                          level: cContent.level as any,
                          mathFormulaLatex: cContent.mathFormulaLatex || '\\int_{a}^{b} f(x)dx'
                        };
                        handleOpenCourseModal(catCourse);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 text-xs font-bold transition-all flex items-center gap-2 border border-slate-200 shadow-2xs font-title shrink-0 cursor-pointer"
                      title="Editar Título del Curso, Descripción y Fórmula Principal KaTeX"
                    >
                      <i className="fa-solid fa-pen-to-square text-indigo-600"></i> Editar Datos
                    </button>
                    <button
                      onClick={() => handleAddUnitToCourse(cContent.slug)}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-cyan-700 text-xs font-bold transition-all flex items-center gap-2 border border-slate-200 shadow-2xs font-title shrink-0 cursor-pointer"
                    >
                      <i className="fa-solid fa-folder-plus text-cyan-600"></i> + Agregar Unidad
                    </button>
                    <Link
                      href={`/curso/${cContent.slug}`}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-cyan-800 text-xs font-bold transition-all flex items-center gap-2 border border-slate-200 shadow-2xs font-title shrink-0"
                    >
                      <i className="fa-solid fa-eye text-cyan-600"></i> Vista Alumno
                    </Link>
                    <button
                      onClick={() => handleDeleteCourse(cContent.slug, cContent.id)}
                      className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all border border-rose-200 cursor-pointer shadow-2xs"
                      title="Eliminar Curso"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>

                {/* Lista de Unidades y Capítulos */}
                <div className="p-6 space-y-6">
                  {(cContent.units || [])
                    .slice()
                    .sort((a, b) => a.number - b.number)
                    .map((unit) => (
                      <div key={unit.id} className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                          <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs font-bold text-slate-500 font-title">Unidad N°</span>
                              <input
                                type="number"
                                min="1"
                                value={unit.number}
                                onChange={(e) => handleUpdateUnitNumber(cContent.slug, unit.id, parseInt(e.target.value) || 1)}
                                className="w-12 text-center font-bold text-xs p-1 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-cyan-500 font-title"
                                title="Cambiar número de orden de la unidad"
                              />
                            </div>
                            <EditableTitleInput
                              initialValue={unit.title}
                              onSave={(newTitle) => handleUpdateUnitTitle(cContent.slug, unit.id, newTitle)}
                              className="font-extrabold text-sm md:text-base text-slate-900 bg-transparent border-b border-dashed border-slate-300 hover:border-cyan-500 focus:border-cyan-600 focus:bg-white px-2 py-0.5 rounded transition-all flex-1 min-w-[200px] font-title"
                              title="Editar título de la unidad"
                            />
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleAddChapterToCourse(cContent.slug, unit.id)}
                              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 font-title cursor-pointer shadow-2xs"
                            >
                              <i className="fa-solid fa-plus text-[10px]"></i> + Agregar Capítulo
                            </button>
                            <button
                              onClick={() => handleDeleteUnit(cContent.slug, unit.id)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all border border-rose-200 cursor-pointer"
                              title="Eliminar Unidad"
                            >
                              <i className="fa-solid fa-trash text-xs"></i>
                            </button>
                          </div>
                        </div>

                        {/* Lista de Capítulos dentro de la Unidad */}
                        <div className="grid grid-cols-1 gap-3">
                          {(unit.chapters || [])
                            .slice()
                            .sort((a, b) => a.number - b.number)
                            .map((ch) => {
                              const exerciseCount = Array.isArray(ch.ejercicios?.problems) ? ch.ejercicios.problems.length : 0;
                              const formulaCount = Array.isArray(ch.ejercicios?.formulasClave) ? ch.ejercicios.formulasClave.length : 0;

                              return (
                                <div
                                  key={ch.id}
                                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-cyan-500/50 hover:shadow-xs transition-all"
                                >
                                  <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                                      <span className="text-[10px] font-bold uppercase text-slate-400 font-title">Cap N°</span>
                                      <input
                                        type="number"
                                        min="1"
                                        value={ch.number}
                                        onChange={(e) => handleUpdateChapterNumber(cContent.slug, ch.id, parseInt(e.target.value) || 1)}
                                        className="w-12 text-center font-bold text-xs p-1 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-cyan-500 font-title"
                                        title="Cambiar número de orden del capítulo"
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <EditableTitleInput
                                        initialValue={ch.title}
                                        onSave={(newTitle) => handleUpdateChapterTitle(cContent.slug, ch.id, newTitle)}
                                        className="font-bold text-sm text-slate-900 font-title bg-transparent border-b border-dashed border-slate-300 hover:border-cyan-500 focus:border-cyan-600 focus:bg-white px-1.5 py-0.5 rounded transition-all w-full min-w-[180px]"
                                        title="Editar título del capítulo"
                                      />
                                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{ch.summary}</p>
                                      
                                      <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 font-title">
                                          <i className="fa-solid fa-list-check text-[10px]"></i> {exerciseCount} Ejercicios
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 font-title">
                                          <i className="fa-solid fa-square-root-variable text-[10px]"></i> {formulaCount} Fórmulas Clave
                                        </span>
                                        <div className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                                          <span>Unidad:</span>
                                          <select
                                            value={unit.id}
                                            onChange={(e) => handleMoveChapterToUnit(cContent.slug, ch.id, e.target.value)}
                                            className="text-xs bg-slate-100 border border-slate-300 rounded-md px-1.5 py-0.5 font-bold text-slate-700 cursor-pointer focus:ring-1 focus:ring-cyan-500"
                                            title="Mover capítulo a otra Unidad"
                                          >
                                            {cContent.units.map((u) => (
                                              <option key={u.id} value={u.id}>
                                                U{u.number}: {u.title.slice(0, 22)}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Botones de Acción para Editar o Administrar Capítulo */}
                                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                                    <Link
                                      href={`/admin/editor/${ch.id}?slug=${cContent.slug}`}
                                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center gap-2 font-title"
                                    >
                                      <i className="fa-solid fa-pen-to-square"></i> Editar Capítulo (Paso 4)
                                    </Link>
                                    <button
                                      onClick={() => handleDeleteChapter(cContent.slug, ch.id)}
                                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all border border-rose-200 cursor-pointer"
                                      title="Eliminar Capítulo"
                                    >
                                      <i className="fa-solid fa-trash"></i>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: BOOKINGS MANAGER */}
        {activeTab === 'bookings' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Solicitudes de Reservas de Tutoría</h2>
              <span className="text-xs text-slate-500">Recibidas desde el calendario interactivo</span>
            </div>

            <div className="overflow-x-auto bg-white border border-slate-200 rounded-xl shadow-sm">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100 text-xs uppercase text-slate-600 font-semibold">
                    <th className="p-4">Estudiante</th>
                    <th className="p-4">Universidad</th>
                    <th className="p-4">Asignatura</th>
                    <th className="p-4">Fecha / Hora</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <span className="font-bold text-slate-900 block">{b.studentName}</span>
                        <span className="text-slate-500">{b.email}</span>
                      </td>
                      <td className="p-4 text-slate-700">{b.university}</td>
                      <td className="p-4 text-cyan-700 font-semibold">{b.subject}</td>
                      <td className="p-4">
                        <span className="block font-semibold text-slate-900">{b.bookingDate}</span>
                        <span className="text-slate-500">{b.timeSlot}</span>
                      </td>
                      <td className="p-4">
                        {b.status === 'confirmed' && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                            Confirmado
                          </span>
                        )}
                        {b.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                            Pendiente
                          </span>
                        )}
                        {b.status === 'cancelled' && (
                          <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold">
                            Cancelado
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {b.status !== 'confirmed' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'confirmed')}
                              className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-medium cursor-pointer"
                              title="Confirmar Tutoría"
                            >
                              <i className="fa-solid fa-check"></i>
                            </button>
                          )}
                          {b.status !== 'cancelled' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded font-medium cursor-pointer"
                              title="Cancelar Tutoría"
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteBooking(b.id)}
                            className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded font-medium cursor-pointer"
                            title="Eliminar Registro"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: BLOG MANAGER */}
        {activeTab === 'blog' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">Gestión de Lecturas del Blog</h2>
              <button
                onClick={() => handleOpenPostModal()}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-semibold text-sm rounded-lg hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
              >
                <i className="fa-solid fa-plus"></i> Crear Nuevo Artículo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((p) => (
                <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-cyan-700">{p.category}</span>
                      <span className="text-xs text-slate-500">{p.date} &bull; {p.readTime}</span>
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-slate-900">{p.title}</h3>
                    <p className="text-xs text-slate-600 mb-4 line-clamp-2">{p.excerpt}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="text-slate-500">{p.author}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenPostModal(p)}
                        className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-cyan-700 font-medium transition-all cursor-pointer"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeletePost(p.id)}
                        className="px-3 py-1.5 rounded bg-red-50 hover:bg-red-100 text-red-700 font-medium transition-all cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* COURSE CREATION/EDIT MODAL */}
      {courseModalOpen && editingCourse && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-lg font-bold mb-4 text-slate-900">
              {editingCourse.id ? 'Editar Curso' : 'Crear Nuevo Curso'}
            </h3>

            <form onSubmit={handleSaveCourse} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título del Curso</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-cyan-600"
                  required
                  value={editingCourse.title || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                />
              </div>



              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoría</label>
                  <select
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-cyan-600 font-bold"
                    value={editingCourse.category || 'Cálculo'}
                    onChange={(e) => setEditingCourse({ ...editingCourse, category: e.target.value as any })}
                  >
                    <option value="Cálculo">Cálculo</option>
                    <option value="Álgebra Lineal">Álgebra Lineal</option>
                    <option value="Multivariable">Multivariable</option>
                    <option value="Ecuaciones Diferenciales">Ecuaciones Diferenciales</option>
                    <option value="Topología">Topología</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nivel Académico</label>
                  <select
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-cyan-600 font-bold"
                    value={editingCourse.level || 'Pregrado'}
                    onChange={(e) => setEditingCourse({ ...editingCourse, level: e.target.value as any })}
                  >
                    <option value="Pregrado">Pregrado</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción General</label>
                <textarea
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-cyan-600"
                  required
                  value={editingCourse.description || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fórmula Clave Principal KaTeX (Visual en Portada)</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-cyan-700 font-mono focus:outline-none focus:border-cyan-600"
                  placeholder="\int_{a}^{b} f(x)dx"
                  required
                  value={editingCourse.mathFormulaLatex || ''}
                  onChange={(e) => setEditingCourse({ ...editingCourse, mathFormulaLatex: e.target.value })}
                />
              </div>

              {/* Live KaTeX Preview of Course Formula */}
              {editingCourse.mathFormulaLatex && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-title block">Vista Previa de la Fórmula:</span>
                  <MathFormula latex={editingCourse.mathFormulaLatex} block />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCourseModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                >
                  Guardar Curso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BLOG POST CREATION/EDIT MODAL */}
      {postModalOpen && editingPost && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-lg font-bold mb-4 text-slate-900">
              {editingPost.id ? 'Editar Artículo' : 'Crear Nuevo Artículo'}
            </h3>

            <form onSubmit={handleSavePost} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título del Artículo</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-cyan-600"
                  required
                  value={editingPost.title || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoría</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-cyan-600"
                    required
                    value={editingPost.category || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tiempo de Lectura</label>
                  <input
                    type="text"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-cyan-600"
                    value={editingPost.readTime || '5 min'}
                    onChange={(e) => setEditingPost({ ...editingPost, readTime: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Resumen (Excerpt)</label>
                <textarea
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-cyan-600"
                  required
                  value={editingPost.excerpt || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contenido HTML / KaTeX</label>
                <textarea
                  rows={6}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:border-cyan-600"
                  required
                  value={editingPost.content || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPostModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                >
                  Guardar Artículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
