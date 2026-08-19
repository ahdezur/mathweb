'use client';

import React from 'react';
import { BlogPost } from '@/lib/mockData';

interface ReadingModalProps {
  post: BlogPost | null;
  onClose: () => void;
}

export const ReadingModal: React.FC<ReadingModalProps> = ({ post, onClose }) => {
  if (!post) return null;

  return (
    <div id="reading-modal" className={`modal ${post ? 'active' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" id="modal-close" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </button>
        <div className="modal-body">
          <div className="modal-header-meta">
            <span className="category" id="modal-category">{post.category.toUpperCase()}</span>
            <span className="divider">&bull;</span>
            <span className="date" id="modal-date">{post.date}</span>
            <span className="divider">&bull;</span>
            <span className="time" id="modal-read-time">{post.readTime} lectura</span>
          </div>
          <h2 className="modal-title" id="modal-title">{post.title}</h2>
          <div
            className="modal-article-text"
            id="modal-content-area"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </div>
    </div>
  );
};
