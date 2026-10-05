'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '../components/Header/Header';
import AIMatchmaker from './AIMatchmaker';
import styles from './search.module.css';
import Link from 'next/link';
import { 
  Filter, 
  X, 
  Star, 
  CheckCircle2, 
  Sparkles, 
  Search, 
  SlidersHorizontal,
  Clock, 
  GraduationCap,
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface SubjectItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  count: number;
}

interface TutorItem {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  headline: string;
  bio: string;
  hourlyRateCents: number;
  trialRateCents?: number;
  avgRating: number;
  totalSessions: number;
  subjects: string[];
}

function renderStars(rating: number) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return (
    <span className={styles.starRatingDisplay}>
      {[...Array(5)].map((_, i) => {
        if (i < full) {
          return <Star key={i} size={14} className={styles.starFilled} fill="currentColor" />;
        }
        if (i === full && hasHalf) {
          return <Star key={i} size={14} className={styles.starHalf} fill="currentColor" />;
        }
        return <Star key={i} size={14} className={styles.starEmpty} />;
      })}
    </span>
  );
}

export default function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State from URL
  const initialQ = searchParams.get('q') || '';
  const initialSubject = searchParams.get('subject') || '';
  const initialSort = searchParams.get('sort') || 'rating';
  const initialPrice = searchParams.get('price') || '';
  const initialRating = searchParams.get('rating') || '';

  const [tutors, setTutors] = useState<TutorItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);

  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [priceRange, setPriceRange] = useState(initialPrice);
  const [minRating, setMinRating] = useState(initialRating);
  const [sortBy, setSortBy] = useState(initialSort);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Sync state to URL params smoothly
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedSubject) params.set('subject', selectedSubject);
    if (sortBy && sortBy !== 'rating') params.set('sort', sortBy);
    if (priceRange) params.set('price', priceRange);
    if (minRating) params.set('rating', minRating);

    const queryString = params.toString();
    const newPath = queryString ? `/search?${queryString}` : '/search';
    router.replace(newPath, { scroll: false });
  }, [searchQuery, selectedSubject, sortBy, priceRange, minRating, router]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedSubject) count++;
    if (priceRange) count++;
    if (minRating) count++;
    if (searchQuery) count++;
    return count;
  }, [selectedSubject, priceRange, minRating, searchQuery]);

  // Fetch subjects from backend API
  useEffect(() => {
    async function loadSubjects() {
      try {
        const res = await fetch('/api/v1/subjects');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSubjects(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch subjects', err);
      } finally {
        setIsLoadingSubjects(false);
      }
    }
    loadSubjects();
  }, []);

  // Fetch tutors
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
      if (data.success && Array.isArray(data.data)) {
        setTutors(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch tutors:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedSubject, priceRange, minRating, sortBy]);

  // Debounced search trigger
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchTutors();
      updateUrlParams();
    }, 280);
    return () => clearTimeout(timeout);
  }, [fetchTutors, updateUrlParams]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSubject('');
    setPriceRange('');
    setMinRating('');
    setSortBy('rating');
  };

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'OL';
    const first = parts[0] || '';
    if (parts.length === 1) return first.slice(0, 2).toUpperCase();
    const last = parts[parts.length - 1] || '';
    return ((first[0] || '') + (last[0] || '')).toUpperCase() || 'OL';
  };


  const selectedSubjectObj = subjects.find((s) => s.slug === selectedSubject);

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
        {/* Header Hero da Busca */}
        <div className={styles.searchHeader}>
          <div className={styles.searchHeaderInner}>
            <div className={styles.searchHeaderTop}>
              <div className={styles.badgeLabel}>
                <Sparkles size={14} /> Catálogo Oficial de Tutores
              </div>
              <h1 className={styles.searchTitle}>Encontrar Tutor de IA</h1>
              <p className={styles.searchSubtitle}>
                Aprenda com mentores particulares de alta qualificação em sessões 1:1 ao vivo.
              </p>
            </div>

            {/* Input de Busca Principal */}
            <div className={styles.searchBar}>
              <div className={styles.searchIconWrapper}>
                <Search size={18} />
              </div>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Pesquisar por tutor, matéria ou tecnologia (ex: LangChain, Python, RAG)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className={styles.searchClearBtn}
                  onClick={() => setSearchQuery('')}
                  title="Limpar texto"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filtros rápidos em pílulas */}
            {subjects.length > 0 && (
              <div className={styles.quickSubjects}>
                <span className={styles.quickSubjectsLabel}>Populares:</span>
                <div className={styles.quickSubjectsList}>
                  {subjects.slice(0, 5).map((subj) => (
                    <button
                      key={subj.id}
                      type="button"
                      className={`${styles.quickSubjectChip} ${selectedSubject === subj.slug ? styles.quickSubjectChipActive : ''}`}
                      onClick={() => setSelectedSubject(selectedSubject === subj.slug ? '' : subj.slug)}
                    >
                      {subj.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI Tutor Matchmaker Banner */}
            <AIMatchmaker onApplyFilter={(term) => setSearchQuery(term)} />
          </div>
        </div>

        {/* Layout Principal */}
        <div className={styles.searchLayout}>
          {/* Barra Lateral Desktop */}
          <aside className={styles.sidebar}>
            <div className={styles.filtersCard}>
              <div className={styles.filtersHeader}>
                <h3 className={styles.filtersTitle}>
                  <Filter size={18} /> Filtros
                </h3>
                {activeFiltersCount > 0 && (
                  <button className={styles.resetFiltersLink} onClick={clearFilters}>
                    Limpar todos
                  </button>
                )}
              </div>

              {/* Filtro de Matéria */}
              <div className={styles.filterGroup}>
                <div className={styles.filterLabel}>Matéria & Especialidade</div>
                <div className={styles.filterOptions}>
                  <label className={`${styles.filterOption} ${selectedSubject === '' ? styles.filterOptionActive : ''}`}>
                    <input
                      type="radio"
                      name="subject"
                      value=""
                      checked={selectedSubject === ''}
                      onChange={() => setSelectedSubject('')}
                      className={styles.filterCheckbox}
                    />
                    <span className={styles.filterOptionText}>Todas as matérias</span>
                  </label>

                  {isLoadingSubjects ? (
                    <div className={styles.filterSkeleton}>Carregando matérias...</div>
                  ) : (
                    subjects.map((s) => (
                      <label 
                        key={s.id} 
                        className={`${styles.filterOption} ${selectedSubject === s.slug ? styles.filterOptionActive : ''}`}
                      >
                        <input
                          type="radio"
                          name="subject"
                          value={s.slug}
                          checked={selectedSubject === s.slug}
                          onChange={(e) => setSelectedSubject(e.target.value)}
                          className={styles.filterCheckbox}
                        />
                        <span className={styles.filterOptionText}>{s.name}</span>
                        {s.count > 0 && <span className={styles.filterBadgeCount}>{s.count}</span>}
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Filtro de Preço por Hora */}
              <div className={styles.filterGroup}>
                <div className={styles.filterLabel}>Preço por Hora</div>
                <div className={styles.filterOptions}>
                  <label className={`${styles.filterOption} ${priceRange === '' ? styles.filterOptionActive : ''}`}>
                    <input
                      type="radio"
                      name="price"
                      value=""
                      checked={priceRange === ''}
                      onChange={() => setPriceRange('')}
                      className={styles.filterCheckbox}
                    />
                    <span>Qualquer valor</span>
                  </label>
                  <label className={`${styles.filterOption} ${priceRange === '-100' ? styles.filterOptionActive : ''}`}>
                    <input
                      type="radio"
                      name="price"
                      value="-100"
                      checked={priceRange === '-100'}
                      onChange={() => setPriceRange('-100')}
                      className={styles.filterCheckbox}
                    />
                    <span>Até R$ 100/h</span>
                  </label>
                  <label className={`${styles.filterOption} ${priceRange === '100-150' ? styles.filterOptionActive : ''}`}>
                    <input
                      type="radio"
                      name="price"
                      value="100-150"
                      checked={priceRange === '100-150'}
                      onChange={() => setPriceRange('100-150')}
                      className={styles.filterCheckbox}
                    />
                    <span>R$ 100 - R$ 150/h</span>
                  </label>
                  <label className={`${styles.filterOption} ${priceRange === '150-' ? styles.filterOptionActive : ''}`}>
                    <input
                      type="radio"
                      name="price"
                      value="150-"
                      checked={priceRange === '150-'}
                      onChange={() => setPriceRange('150-')}
                      className={styles.filterCheckbox}
                    />
                    <span>Acima de R$ 150/h</span>
                  </label>
                </div>
              </div>

              {/* Filtro de Avaliação */}
              <div className={styles.filterGroup}>
                <div className={styles.filterLabel}>Avaliação Mínima</div>
                <div className={styles.filterOptions}>
                  <label className={`${styles.filterOption} ${minRating === '' ? styles.filterOptionActive : ''}`}>
                    <input
                      type="radio"
                      name="rating"
                      value=""
                      checked={minRating === ''}
                      onChange={() => setMinRating('')}
                      className={styles.filterCheckbox}
                    />
                    <span>Todas as notas</span>
                  </label>
                  <label className={`${styles.filterOption} ${minRating === '4.8' ? styles.filterOptionActive : ''}`}>
                    <input
                      type="radio"
                      name="rating"
                      value="4.8"
                      checked={minRating === '4.8'}
                      onChange={() => setMinRating('4.8')}
                      className={styles.filterCheckbox}
                    />
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={14} fill="#F59E0B" color="#F59E0B" /> 4.8 ou mais
                    </span>
                  </label>
                  <label className={`${styles.filterOption} ${minRating === '4.5' ? styles.filterOptionActive : ''}`}>
                    <input
                      type="radio"
                      name="rating"
                      value="4.5"
                      checked={minRating === '4.5'}
                      onChange={() => setMinRating('4.5')}
                      className={styles.filterCheckbox}
                    />
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={14} fill="#F59E0B" color="#F59E0B" /> 4.5 ou mais
                    </span>
                  </label>
                  <label className={`${styles.filterOption} ${minRating === '4.0' ? styles.filterOptionActive : ''}`}>
                    <input
                      type="radio"
                      name="rating"
                      value="4.0"
                      checked={minRating === '4.0'}
                      onChange={() => setMinRating('4.0')}
                      className={styles.filterCheckbox}
                    />
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Star size={14} fill="#F59E0B" color="#F59E0B" /> 4.0 ou mais
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* Área de Resultados */}
          <main className={styles.results}>
            {/* Barra de Controle de Resultados e Ordenação */}
            <div className={styles.resultsHeader}>
              <div className={styles.resultsInfo}>
                <span className={styles.resultsCount}>
                  <strong className={styles.resultsCountBold}>
                    {isLoading ? '...' : tutors.length}
                  </strong>{' '}
                  {tutors.length === 1 ? 'tutor disponível' : 'tutores disponíveis'}
                </span>

                {/* Botão de Filtro Mobile */}
                <button 
                  className={styles.mobileFilterBtn}
                  onClick={() => setIsMobileFiltersOpen(true)}
                >
                  <SlidersHorizontal size={16} />
                  <span>Filtros</span>
                  {activeFiltersCount > 0 && (
                    <span className={styles.mobileFilterBadge}>{activeFiltersCount}</span>
                  )}
                </button>
              </div>

              {/* Ordenação */}
              <div className={styles.sortWrapper}>
                <label htmlFor="sort-select" className={styles.sortLabel}>
                  Ordenar por:
                </label>
                <div className={styles.sortSelectContainer}>
                  <select
                    id="sort-select"
                    className={styles.sortSelect}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="rating">Melhor Avaliados</option>
                    <option value="price_asc">Menor Preço</option>
                    <option value="price_desc">Maior Preço</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Chips de Filtros Ativos */}
            {activeFiltersCount > 0 && (
              <div className={styles.activeChipsContainer}>
                {selectedSubject && (
                  <span className={styles.activeChip}>
                    Matéria: {selectedSubjectObj ? selectedSubjectObj.name : selectedSubject}
                    <button onClick={() => setSelectedSubject('')} aria-label="Remover filtro de matéria">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {priceRange && (
                  <span className={styles.activeChip}>
                    Preço: {priceRange === '-100' ? 'Até R$ 100' : priceRange === '100-150' ? 'R$ 100 - R$ 150' : 'Acima de R$ 150'}
                    <button onClick={() => setPriceRange('')} aria-label="Remover filtro de preço">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {minRating && (
                  <span className={styles.activeChip}>
                    ★ {minRating}+
                    <button onClick={() => setMinRating('')} aria-label="Remover filtro de avaliação">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className={styles.activeChip}>
                    Busca: &quot;{searchQuery}&quot;
                    <button onClick={() => setSearchQuery('')} aria-label="Limpar termo de busca">
                      <X size={12} />
                    </button>
                  </span>
                )}
                <button className={styles.clearAllChip} onClick={clearFilters}>
                  Limpar tudo
                </button>
              </div>
            )}

            {/* Estado de Carregamento com Skeletons Shimmer */}
            {isLoading ? (
              <div className={styles.skeletonList}>
                {[1, 2, 3].map((n) => (
                  <div key={n} className={styles.skeletonCard}>
                    <div className={styles.skeletonAvatar} />
                    <div className={styles.skeletonInfo}>
                      <div className={styles.skeletonLine} style={{ width: '40%', height: '22px' }} />
                      <div className={styles.skeletonLine} style={{ width: '65%', height: '16px' }} />
                      <div className={styles.skeletonLine} style={{ width: '30%', height: '14px' }} />
                      <div className={styles.skeletonLine} style={{ width: '85%', height: '40px' }} />
                    </div>
                    <div className={styles.skeletonRight}>
                      <div className={styles.skeletonLine} style={{ width: '80px', height: '28px' }} />
                      <div className={styles.skeletonLine} style={{ width: '120px', height: '36px' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : tutors.length === 0 ? (
              /* Estado Vazio */
              <div className={styles.emptyState}>
                <div className={styles.emptyIconWrapper}>
                  <GraduationCap size={44} />
                </div>
                <h3 className={styles.emptyTitle}>Nenhum tutor encontrado</h3>
                <p className={styles.emptyDesc}>
                  Não encontramos nenhum tutor com os filtros aplicados. Tente ajustar os termos de busca ou remover alguns filtros.
                </p>
                <button className="btn btn--primary" onClick={clearFilters}>
                  Ver todos os tutores
                </button>
              </div>
            ) : (
              /* Lista de Tutores Encontrados */
              <div className={styles.tutorsList}>
                {tutors.map((tutor) => {
                  const isSuperTutor = tutor.avgRating >= 4.8 && tutor.totalSessions >= 5;
                  const isNew = tutor.totalSessions <= 2;
                  const initials = getInitials(tutor.name);

                  return (
                    <article key={tutor.id} className={styles.tutorCard}>
                      {/* Avatar e Status */}
                      <div className={styles.avatarColumn}>
                        {tutor.avatarUrl ? (
                          <img 
                            src={tutor.avatarUrl} 
                            alt={tutor.name} 
                            className={styles.avatarImage} 
                          />
                        ) : (
                          <div className={styles.avatarFallback}>
                            {initials}
                          </div>
                        )}
                        <span className={styles.onlineStatusDot} title="Disponível para agendamento" />
                      </div>

                      {/* Informações Principais */}
                      <div className={styles.infoColumn}>
                        <div className={styles.tutorHeaderLine}>
                          <Link href={`/tutor/${tutor.id}`} className={styles.tutorNameLink}>
                            <h2 className={styles.tutorName}>{tutor.name}</h2>
                          </Link>
                          <span className={styles.verifiedBadge} title="Tutor Verificado pela Equipe OpenLearn">
                            <CheckCircle2 size={15} /> Verificado
                          </span>
                          {isSuperTutor && (
                            <span className={styles.superTutorBadge}>
                              <Sparkles size={12} /> Super Tutor
                            </span>
                          )}
                          {isNew && (
                            <span className={styles.newBadge}>
                              Novo Tutor
                            </span>
                          )}
                        </div>

                        <p className={styles.tutorHeadline}>{tutor.headline}</p>

                        {/* Avaliação e Estatísticas */}
                        <div className={styles.ratingRow}>
                          {renderStars(tutor.avgRating)}
                          <span className={styles.ratingNumber}>
                            {tutor.avgRating.toFixed(1)}
                          </span>
                          <span className={styles.sessionsCount}>
                            • {tutor.totalSessions || 0} {tutor.totalSessions === 1 ? 'aula ministrada' : 'aulas ministradas'}
                          </span>
                        </div>

                        {/* Matérias / Especialidades */}
                        <div className={styles.subjectTags}>
                          {tutor.subjects.map((subj) => (
                            <span 
                              key={subj} 
                              className={styles.subjectTag}
                              onClick={(e) => {
                                e.stopPropagation();
                                const found = subjects.find(s => s.name.toLowerCase() === subj.toLowerCase());
                                if (found) setSelectedSubject(found.slug);
                              }}
                            >
                              <BookOpen size={11} style={{ marginRight: '4px' }} />
                              {subj}
                            </span>
                          ))}
                        </div>

                        {/* Resumo da Biografia */}
                        <p className={styles.tutorBio}>{tutor.bio}</p>
                      </div>

                      {/* Coluna Direita: Preço & Ações */}
                      <div className={styles.priceActionColumn}>
                        <div className={styles.priceBox}>
                          <div className={styles.priceMain}>
                            <span className={styles.priceCurrency}>R$</span>
                            <span className={styles.priceValue}>
                              {(tutor.hourlyRateCents / 100).toFixed(0)}
                            </span>
                            <span className={styles.priceUnit}>/hora</span>
                          </div>

                          {tutor.trialRateCents && tutor.trialRateCents < tutor.hourlyRateCents ? (
                            <div className={styles.trialHighlight}>
                              <span className={styles.trialBadge}>Experimental</span>
                              <span className={styles.trialPrice}>
                                R$ {(tutor.trialRateCents / 100).toFixed(0)}
                              </span>
                            </div>
                          ) : (
                            <div className={styles.firstClassGuarantee}>
                              1ª Aula Garantida
                            </div>
                          )}
                        </div>

                        <div className={styles.actionButtons}>
                          <Link
                            href={`/tutor/${tutor.id}`}
                            className={styles.profileBtn}
                          >
                            Ver Perfil
                          </Link>
                          <Link
                            href={`/tutor/${tutor.id}/book`}
                            className={styles.bookBtn}
                          >
                            Agendar Aula <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </main>
        </div>

        {/* Modal Drawer de Filtros Mobile */}
        {isMobileFiltersOpen && (
          <div className={styles.mobileDrawerBackdrop} onClick={() => setIsMobileFiltersOpen(false)}>
            <div 
              className={styles.mobileDrawerContent} 
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.mobileDrawerHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Filter size={18} />
                  <h3 className={styles.mobileDrawerTitle}>Filtros</h3>
                </div>
                <button 
                  className={styles.closeDrawerBtn} 
                  onClick={() => setIsMobileFiltersOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className={styles.mobileDrawerBody}>
                {/* Matéria Mobile */}
                <div className={styles.filterGroup}>
                  <div className={styles.filterLabel}>Matéria</div>
                  <div className={styles.filterOptions}>
                    <label className={`${styles.filterOption} ${selectedSubject === '' ? styles.filterOptionActive : ''}`}>
                      <input
                        type="radio"
                        name="mobile-subject"
                        value=""
                        checked={selectedSubject === ''}
                        onChange={() => setSelectedSubject('')}
                        className={styles.filterCheckbox}
                      />
                      <span>Todas as matérias</span>
                    </label>
                    {subjects.map((s) => (
                      <label 
                        key={s.id} 
                        className={`${styles.filterOption} ${selectedSubject === s.slug ? styles.filterOptionActive : ''}`}
                      >
                        <input
                          type="radio"
                          name="mobile-subject"
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

                {/* Preço Mobile */}
                <div className={styles.filterGroup}>
                  <div className={styles.filterLabel}>Preço por Hora</div>
                  <div className={styles.filterOptions}>
                    <label className={styles.filterOption}>
                      <input
                        type="radio"
                        name="mobile-price"
                        value=""
                        checked={priceRange === ''}
                        onChange={() => setPriceRange('')}
                        className={styles.filterCheckbox}
                      />
                      <span>Qualquer valor</span>
                    </label>
                    <label className={styles.filterOption}>
                      <input
                        type="radio"
                        name="mobile-price"
                        value="-100"
                        checked={priceRange === '-100'}
                        onChange={() => setPriceRange('-100')}
                        className={styles.filterCheckbox}
                      />
                      <span>Até R$ 100/h</span>
                    </label>
                    <label className={styles.filterOption}>
                      <input
                        type="radio"
                        name="mobile-price"
                        value="100-150"
                        checked={priceRange === '100-150'}
                        onChange={() => setPriceRange('100-150')}
                        className={styles.filterCheckbox}
                      />
                      <span>R$ 100 - R$ 150/h</span>
                    </label>
                    <label className={styles.filterOption}>
                      <input
                        type="radio"
                        name="mobile-price"
                        value="150-"
                        checked={priceRange === '150-'}
                        onChange={() => setPriceRange('150-')}
                        className={styles.filterCheckbox}
                      />
                      <span>Acima de R$ 150/h</span>
                    </label>
                  </div>
                </div>

                {/* Avaliação Mobile */}
                <div className={styles.filterGroup}>
                  <div className={styles.filterLabel}>Avaliação Mínima</div>
                  <div className={styles.filterOptions}>
                    <label className={styles.filterOption}>
                      <input
                        type="radio"
                        name="mobile-rating"
                        value=""
                        checked={minRating === ''}
                        onChange={() => setMinRating('')}
                        className={styles.filterCheckbox}
                      />
                      <span>Todas</span>
                    </label>
                    <label className={styles.filterOption}>
                      <input
                        type="radio"
                        name="mobile-rating"
                        value="4.8"
                        checked={minRating === '4.8'}
                        onChange={() => setMinRating('4.8')}
                        className={styles.filterCheckbox}
                      />
                      <span>★ 4.8 ou mais</span>
                    </label>
                    <label className={styles.filterOption}>
                      <input
                        type="radio"
                        name="mobile-rating"
                        value="4.5"
                        checked={minRating === '4.5'}
                        onChange={() => setMinRating('4.5')}
                        className={styles.filterCheckbox}
                      />
                      <span>★ 4.5 ou mais</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className={styles.mobileDrawerFooter}>
                <button className="btn btn--secondary" onClick={clearFilters}>
                  Limpar
                </button>
                <button className="btn btn--primary" onClick={() => setIsMobileFiltersOpen(false)}>
                  Ver {tutors.length} {tutors.length === 1 ? 'resultado' : 'resultados'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
