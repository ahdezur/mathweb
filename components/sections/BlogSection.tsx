'use client';

import React, { useState, useEffect } from 'react';
import { BlogPost } from '@/lib/mockData';
import { DataService } from '@/lib/dataService';

interface BlogSectionProps {
  onSelectPost: (post: BlogPost) => void;
}

export const BlogSection: React.FC<BlogSectionProps> = ({ onSelectPost }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      const data = await DataService.getBlogPosts();
      setPosts(data);
      setLoading(false);
    }
    loadPosts();
  }, []);

  return (
    <section id="blog" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Lecturas</span>
          <h2 className="section-title">Blog de Educación Matemática</h2>
          <p className="section-subtitle">Explicaciones pedagógicas, artículos de interés científico y guías prácticas escritas para facilitarte el aprendizaje de las matemáticas.</p>
        </div>

        <div className="blog-grid" id="blog-container">
          {loading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: 'var(--accent)' }}>
              <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
              <p style={{ marginTop: '15px', fontFamily: 'var(--font-title)', fontSize: '14px' }}>Cargando lecturas...</p>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="blog-card"
                onClick={() => onSelectPost(post)}
                style={{ cursor: 'pointer' }}
              >
                <div className="blog-card-content">
                  <div className="blog-card-meta">
                    <span className="blog-card-tag">{post.category}</span>
                    <span className="blog-card-time"><i className="fa-regular fa-clock"></i> {post.readTime}</span>
                  </div>
                  <h3 className="blog-card-title">{post.title}</h3>
                  <p className="blog-card-excerpt">{post.excerpt}</p>
                  <div className="blog-card-footer">
                    <span className="blog-card-date">{post.date}</span>
                    <span className="blog-card-link">Leer Más <i className="fa-solid fa-arrow-right"></i></span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
