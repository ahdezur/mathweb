'use client';

import React, { useState, useRef, useEffect } from 'react';

interface TagAutocompleteSelectorProps {
  selectedTags: string[];
  availableTags: string[];
  onChange: (tags: string[]) => void;
  onAddNewTag?: (tag: string) => void;
  placeholder?: string;
  colorTheme?: 'cyan' | 'purple';
}

export function TagAutocompleteSelector({
  selectedTags = [],
  availableTags = [],
  onChange,
  onAddNewTag,
  placeholder = 'Buscar o crear etiqueta...',
  colorTheme = 'cyan'
}: TagAutocompleteSelectorProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter available tags based on search query
  const normalizedQuery = query.trim().toLowerCase();

  const filteredTags = availableTags.filter((tag) => {
    const isAlreadySelected = selectedTags.includes(tag);
    if (isAlreadySelected) return false;
    if (!normalizedQuery) return true;
    return tag.toLowerCase().includes(normalizedQuery);
  });

  // Check if query exactly matches an existing available tag (case insensitive)
  const exactExistingMatch = availableTags.find(
    (t) => t.trim().toLowerCase() === normalizedQuery
  );

  const isNewQuery = normalizedQuery.length > 0 && !exactExistingMatch && !selectedTags.includes(query.trim());

  const handleSelectTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      onChange([...selectedTags, tag]);
    }
    setQuery('');
    setIsOpen(false);
  };

  const handleCreateNewTag = () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    if (exactExistingMatch) {
      handleSelectTag(exactExistingMatch);
      return;
    }

    if (!selectedTags.includes(trimmed)) {
      const updated = [...selectedTags, trimmed];
      onChange(updated);
      if (onAddNewTag) {
        onAddNewTag(trimmed);
      }
    }
    setQuery('');
    setIsOpen(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(selectedTags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (exactExistingMatch) {
        handleSelectTag(exactExistingMatch);
      } else if (filteredTags.length > 0 && query.trim() === '') {
        handleSelectTag(filteredTags[0]);
      } else if (isNewQuery) {
        handleCreateNewTag();
      }
    } else if (e.key === 'Backspace' && query === '' && selectedTags.length > 0) {
      handleRemoveTag(selectedTags[selectedTags.length - 1]);
    }
  };

  const chipBgClass =
    colorTheme === 'purple'
      ? 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200'
      : 'bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-200';

  const badgeThemeClass =
    colorTheme === 'purple' ? 'text-purple-600 bg-purple-50' : 'text-cyan-600 bg-cyan-50';

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Selected Tag Chips & Input Box */}
      <div
        className="min-h-[42px] p-2 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center gap-1.5 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-all cursor-text"
        onClick={() => setIsOpen(true)}
      >
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${chipBgClass} font-title`}
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTag(tag);
              }}
              className="hover:opacity-75 cursor-pointer ml-0.5"
            >
              <i className="fa-solid fa-xmark text-[10px]"></i>
            </button>
          </span>
        ))}

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent text-xs font-medium outline-none text-slate-800 placeholder-slate-400 p-1"
        />
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-xs">
          {filteredTags.length > 0 && (
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 font-title">
              Sugerencias Disponibles:
            </div>
          )}

          {filteredTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleSelectTag(tag)}
              className="w-full text-left px-3 py-2 hover:bg-slate-100 text-slate-800 font-medium transition-colors flex items-center justify-between cursor-pointer font-title"
            >
              <span>{tag}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${badgeThemeClass}`}>
                + Asignar
              </span>
            </button>
          ))}

          {/* Option to create a new tag if query doesn't match existing */}
          {isNewQuery && (
            <button
              type="button"
              onClick={handleCreateNewTag}
              className="w-full text-left px-3 py-2.5 bg-gradient-to-r from-emerald-50 to-cyan-50 hover:from-emerald-100 hover:to-cyan-100 text-emerald-900 font-bold border-t border-slate-100 flex items-center justify-between cursor-pointer font-title transition-all"
            >
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-sparkles text-emerald-600"></i>
                <span>Crear nueva etiqueta: <strong>"{query.trim()}"</strong></span>
              </div>
              <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded">
                + Crear
              </span>
            </button>
          )}

          {filteredTags.length === 0 && !isNewQuery && (
            <div className="px-3 py-3 text-slate-400 text-center font-medium italic">
              No hay más sugerencias disponibles. Escribe para crear una nueva etiqueta.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
