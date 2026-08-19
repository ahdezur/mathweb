'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Hero } from '@/components/hero/Hero';
import { CourseCatalog } from '@/components/sections/CourseCatalog';
import { AboutMe } from '@/components/sections/AboutMe';
import { BlogSection } from '@/components/sections/BlogSection';
import { BookingCalendar } from '@/components/sections/BookingCalendar';
import { ContactSection } from '@/components/sections/ContactSection';
import { Footer } from '@/components/layout/Footer';
import { ReadingModal } from '@/components/ui/ReadingModal';
import { CalculatorModal } from '@/components/ui/CalculatorModal';
import { BookingModal } from '@/components/ui/BookingModal';
import { BlogPost } from '@/lib/mockData';

export default function Home() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<{ date: string; time: string } | null>(null);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <Navbar />

      {/* Hero Section with Animated Math Visualizations */}
      <Hero onOpenCalculator={() => setIsCalculatorOpen(true)} />

      {/* Course Catalog Grid */}
      <CourseCatalog />

      {/* About Me Section (PhD profile) */}
      <AboutMe />

      {/* Blog Readings Section */}
      <BlogSection onSelectPost={(post) => setSelectedPost(post)} />

      {/* Interactive Booking Calendar */}
      <BookingCalendar onSelectSlot={(date, time) => setBookingDetails({ date, time })} />

      {/* Contact Form Section */}
      <ContactSection />

      {/* Footer & Admin Portal Link */}
      <Footer />

      {/* Interactive Modals */}
      <ReadingModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      <CalculatorModal isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
      <BookingModal bookingDetails={bookingDetails} onClose={() => setBookingDetails(null)} />
    </main>
  );
}
