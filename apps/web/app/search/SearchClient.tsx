'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header/Header';
import styles from './search.module.css';
import Link from 'next/link';
import { Filter } from 'lucide-react';

const SUBJECTS_FILTER = [
  { slug: "prompt-engineering", name: "Engenharia de Prompts", count: 124 },
  { slug: "ai-for-devs", name: "IA para Desenvolvedores", count: 98 },
  { slug: "ai-automation", name: "Automação com IA", count: 86 },
  { slug: "ai-agents", name: "AI Agents", count: 91 },
  { slug: "langchain", name: "LangChain & LlamaIndex", count: 72 },
  { slug: "rag-architecture", name: "RAG Architecture", count: 67 },
  { slug: "fine-tuning", name: "Fine-tuning de LLMs", count: 54 },
  { slug: "computer-vision", name: "Computer Vision", count: 43 },
];

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

export default function SearchClient() {
  const [tutors, setTutors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  const fetchTutors = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = '/api/v1/tutors/search?';
      if (searchQuery) url += `q=${encodeURIComponent(searchQuery)}&`;
      if (selectedSubject) url += `subject=${encodeURIComponent(selectedSubject)}&`;
      if (sortBy) url += `sort=${encodeURIComponent(sortBy)}&`;
      
      if (priceRange === '-100') url += `maxPrice=100&`;
      else if (priceRange === '100-150') url += `minPrice=100&maxPrice=150&`;
      else if (priceRange === '150-') url += `minPrice=150&`;

      if (minRating) url += `minRating=${encodeURIComponent(minRating)}&`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTutors(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch tutors:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedSubject, priceRange, minRating, sortBy]);

  useEffect(() => {
    // Debounce the search query
    const timeout = setTimeout(() => {
      fetchTutors();
    }, 300);
    return () => clearTimeout(timeout);
  }, [fetchTutors]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSubject('');
    setPriceRange('');
    setMinRating('');
    setSortBy('rating');
  };

  return (
    <>
      <Header
        variant="light"
        navLinks={[
          { label: 'Matérias', href: '/#subjects' },
          { label: 'Tutores', href: '/search' },
          { label: 'Como Funciona', href: '/#how-it-works' },
          { label: 'Para Empresas', href: '/enterprise' },
        ]}
      />

      <div className={styles.searchPage}>
        {/* Search Header */}
        <div className={styles.searchHeader}>
          <div className={styles.searchHeaderInner}>
            <h1 className={styles.searchTitle}>Encontrar Tutor de IA</h1>
            <p className={styles.searchSubtitle}>
              {tutors.length} tutores disponíveis para aulas 1:1
            </p>
            <div className={styles.searchBar}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Pesquisar por nome, matéria ou habilidade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn--primary">Buscar</button>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className={styles.searchLayout}>
          {/* Filters Sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.filtersCard}>
              <h3 className={styles.filtersTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={18} /> Filtros
              </h3>

              {/* Subject Filter */}
              <div className={styles.filterGroup}>
                <div className={styles.filterLabel}>Matéria</div>
                <div className={styles.filterOptions}>
                  {SUBJECTS_FILTER.map((s) => (
                    <label key={s.slug} className={styles.filterOption}>
                      <input 
                        type="radio" 
                        name="subject" 
                        value={s.slug}
                        checked={selectedSubject === s.slug}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className={styles.filterCheckbox} 
                      />
                      <span>{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className={styles.filterGroup} style={{ marginTop: '24px' }}>
                <div className={styles.filterLabel}>Preço por Hora</div>
                <div className={styles.filterOptions}>
                  <label className={styles.filterOption}>
                    <input type="radio" name="price" value="" checked={priceRange === ''} onChange={(e) => setPriceRange(e.target.value)} className={styles.filterCheckbox} />
                    <span>Qualquer valor</span>
                  </label>
                  <label className={styles.filterOption}>
                    <input type="radio" name="price" value="-100" checked={priceRange === '-100'} onChange={(e) => setPriceRange(e.target.value)} className={styles.filterCheckbox} />
                    <span>Até R$ 100</span>
                  </label>
                  <label className={styles.filterOption}>
                    <input type="radio" name="price" value="100-150" checked={priceRange === '100-150'} onChange={(e) => setPriceRange(e.target.value)} className={styles.filterCheckbox} />
                    <span>R$ 100 - R$ 150</span>
                  </label>
                  <label className={styles.filterOption}>
                    <input type="radio" name="price" value="150-" checked={priceRange === '150-'} onChange={(e) => setPriceRange(e.target.value)} className={styles.filterCheckbox} />
                    <span>Acima de R$ 150</span>
                  </label>
                </div>
              </div>

              {/* Rating Filter */}
              <div className={styles.filterGroup} style={{ marginTop: '24px' }}>
                <div className={styles.filterLabel}>Avaliação Mínima</div>
                <div className={styles.filterOptions}>
                  <label className={styles.filterOption}>
                    <input type="radio" name="rating" value="" checked={minRating === ''} onChange={(e) => setMinRating(e.target.value)} className={styles.filterCheckbox} />
                    <span>Todas</span>
                  </label>
                  <label className={styles.filterOption}>
                    <input type="radio" name="rating" value="4.8" checked={minRating === '4.8'} onChange={(e) => setMinRating(e.target.value)} className={styles.filterCheckbox} />
                    <span>4.8 e acima</span>
                  </label>
                  <label className={styles.filterOption}>
                    <input type="radio" name="rating" value="4.5" checked={minRating === '4.5'} onChange={(e) => setMinRating(e.target.value)} className={styles.filterCheckbox} />
                    <span>4.5 e acima</span>
                  </label>
                  <label className={styles.filterOption}>
                    <input type="radio" name="rating" value="4.0" checked={minRating === '4.0'} onChange={(e) => setMinRating(e.target.value)} className={styles.filterCheckbox} />
                    <span>4.0 e acima</span>
                  </label>
                </div>
              </div>

              <button className={styles.clearFilters} onClick={clearFilters}>
                Limpar Filtros
              </button>
            </div>
          </aside>

          {/* Results */}
          <div className={styles.results}>
            <div className={styles.resultsHeader}>
              <span className={styles.resultsCount}>
                <span className={styles.resultsCountBold}>{tutors.length} tutores</span> encontrados
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <select 
                  className={styles.sortSelect} 
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="rating">Melhor avaliados</option>
                  <option value="price_asc">Menor preço</option>
                  <option value="price_desc">Maior preço</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>Carregando tutores...</div>
            ) : tutors.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>Nenhum tutor encontrado com esses filtros.</div>
            ) : (
              tutors.map((tutor) => (
                <div key={tutor.id} className={styles.tutorResultCard}>
                  <div className={styles.tutorResultAvatar} style={{ background: tutor.gradient || 'var(--gradient-primary)' }}>
                    {tutor.name.substring(0, 2).toUpperCase()}
                    {tutor.online && <span className={styles.tutorResultOnline} />}
                  </div>

                  <div className={styles.tutorResultInfo}>
                    <div className={styles.tutorResultName}>{tutor.name}</div>
                    <div className={styles.tutorResultHeadline}>{tutor.headline}</div>

                    <div className={styles.tutorResultRating}>
                      <span className={styles.tutorResultStars}>{renderStars(tutor.avgRating)}</span>
                      <span className={styles.tutorResultRatingVal}>{tutor.avgRating.toFixed(1)}</span>
                      <span className={styles.tutorResultSessions}>{tutor.totalSessions || 0} aulas</span>
                    </div>

                    <div className={styles.tutorResultTags}>
                      {tutor.subjects.map((s: string) => (
                        <span key={s} className={styles.tutorResultTag}>{s}</span>
                      ))}
                    </div>

                    <p className={styles.tutorResultBio}>{tutor.bio}</p>
                  </div>

                  <div className={styles.tutorResultRight}>
                    <div className={styles.tutorResultPriceBlock}>
                      <div className={styles.tutorResultPrice}>R$ {(tutor.hourlyRateCents / 100).toFixed(2)}</div>
                      <div className={styles.tutorResultPriceLabel}>por hora</div>
                      <div className={styles.tutorResultTrial}>
                        Experimental R$ {(tutor.trialRateCents / 100).toFixed(2)}
                      </div>
                    </div>
                    <div className={styles.tutorResultActions}>
                      <Link href={`/tutor/${tutor.id}`} className={`${styles.tutorResultBtn} ${styles.tutorResultBtnPrimary}`}>
                        Ver Perfil
                      </Link>
                      <Link href={`/tutor/${tutor.id}/book`} className={`${styles.tutorResultBtn} ${styles.tutorResultBtnSecondary}`}>
                        Aula Experimental
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
