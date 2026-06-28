import type { Metadata } from "next";
import { Star, BookOpen, Clock, Zap, Video, Play, User, MessageCircle, Check } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@ailearn/database";
import Header from "../../components/Header/Header";
import styles from "./profile.module.css";

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function renderStars(count: number): string {
  const full = Math.floor(count);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const tutor = await prisma.tutorProfile.findUnique({
    where: { id: params.id },
    include: { user: { select: { fullName: true } } },
  });

  if (!tutor) return { title: "Tutor não encontrado | OpenLearn" };

  return {
    title: `${tutor.user.fullName} — Tutor de IA | OpenLearn`,
    description: `${tutor.headline}. ${tutor.totalSessions} aulas, avaliação ${tutor.avgRating}/5.`,
  };
}

export default async function TutorProfilePage({ params }: any) {
  const tutor = await prisma.tutorProfile.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { fullName: true, avatarUrl: true } },
      subjects: { include: { subject: { select: { name: true } } } },
      availability: { orderBy: { dayOfWeek: "asc" } },
      reviews: {
        include: { student: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!tutor) notFound();

  const name = tutor.user.fullName;
  const initials = name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
  const avgRating = Number(tutor.avgRating);
  const priceFormatted = `R$ ${(tutor.hourlyRateCents / 100).toFixed(0)}`;
  const trialFormatted = tutor.trialRateCents ? `R$ ${(tutor.trialRateCents / 100).toFixed(0)}` : null;

  // Group availability by day
  const availByDay = DAY_LABELS.map((label, idx) => {
    const slots = tutor.availability
      .filter((a: any) => a.dayOfWeek === idx)
      .map((a: any) => a.startTimeUtc.substring(0, 5));
    return { label, slots };
  });

  return (
    <>
      <Header
        variant="light"
        backLink={{ label: 'Voltar à busca', href: '/search' }}
        navLinks={[]}
      />

      <div className={styles.profilePage}>
        {/* Profile Header */}
        <div className={styles.profileHeader}>
          <div className={styles.profileHeaderMesh} />
          <div className={styles.profileHeaderInner}>
            <div className={styles.profileAvatar} style={{ background: 'linear-gradient(135deg, #6C5CE7, #A29BFE)' }}>
              {initials}
              <span className={styles.profileOnline} />
            </div>

            <div className={styles.profileHeaderInfo}>
              <h1 className={styles.profileName}>{name}</h1>
              <p className={styles.profileHeadline}>{tutor.headline}</p>

              <div className={styles.profileMeta}>
                <div className={styles.profileMetaItem}>
                  <span className={styles.profileMetaIcon}><Star size={16} fill="var(--color-warning)" color="var(--color-warning)" /></span>
                  <span className={styles.profileMetaValue}>{avgRating.toFixed(2)}</span>
                  <span>({tutor.reviews.length} avaliações)</span>
                </div>
                <div className={styles.profileMetaItem}>
                  <span className={styles.profileMetaIcon}><BookOpen size={16} /></span>
                  <span className={styles.profileMetaValue}>{tutor.totalSessions}</span>
                  <span>aulas realizadas</span>
                </div>
                {tutor.yearsExperience && (
                  <div className={styles.profileMetaItem}>
                    <span className={styles.profileMetaIcon}><Clock size={16} /></span>
                    <span className={styles.profileMetaValue}>{tutor.yearsExperience} anos</span>
                    <span>de experiência</span>
                  </div>
                )}
                {tutor.responseTimeMins && (
                  <div className={styles.profileMetaItem}>
                    <span className={styles.profileMetaIcon}><Zap size={16} color="var(--color-warning)" /></span>
                    <span>Responde em</span>
                    <span className={styles.profileMetaValue}>{tutor.responseTimeMins} min</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className={styles.profileContent}>
          {/* Left Column */}
          <div className={styles.profileMain}>
            {/* Video Intro */}
            {tutor.videoIntroUrl && (
              <div className={styles.profileSection}>
                <h2 className={styles.profileSectionTitle}><Video size={20} className={styles.titleIcon} /> Vídeo de Apresentação</h2>
                <div className={styles.videoPlaceholder} id="video-intro">
                  <div className={styles.videoPlayBtn}><Play size={24} fill="currentColor" /></div>
                </div>
              </div>
            )}

            {/* About */}
            <div className={styles.profileSection} id="about-section">
              <h2 className={styles.profileSectionTitle}><User size={20} className={styles.titleIcon} /> Sobre Mim</h2>
              <p className={styles.profileBioText}>{tutor.bio}</p>
            </div>

            {/* Subjects */}
            <div className={styles.profileSection} id="subjects-section">
              <h2 className={styles.profileSectionTitle}><BookOpen size={20} className={styles.titleIcon} /> Matérias</h2>
              <div className={styles.profileSubjects}>
                {tutor.subjects.map((ts: any) => (
                  <span key={ts.id} className={styles.profileSubjectTag}>{ts.subject.name}</span>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className={styles.profileSection} id="availability-section">
              <h2 className={styles.profileSectionTitle}><Clock size={20} className={styles.titleIcon} /> Disponibilidade</h2>
              <div className={styles.availabilityGrid}>
                {availByDay.map((day) => (
                  <div key={day.label} className={styles.availDay}>
                    <div className={styles.availDayLabel}>{day.label}</div>
                    <div className={styles.availSlots}>
                      {day.slots.length > 0 ? (
                        day.slots.map((slot: string) => (
                          <div key={slot} className={`${styles.availSlot} ${styles.availSlotOpen}`}>
                            {slot}
                          </div>
                        ))
                      ) : (
                        <div className={`${styles.availSlot} ${styles.availSlotBusy}`}>—</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className={styles.profileSection} id="reviews-section">
              <h2 className={styles.profileSectionTitle}>
                <MessageCircle size={20} className={styles.titleIcon} /> Avaliações ({tutor.reviews.length})
              </h2>
              <div className={styles.reviewsList}>
                {tutor.reviews.length === 0 ? (
                  <p style={{ color: 'var(--color-text-secondary)' }}>Este tutor ainda não possui avaliações.</p>
                ) : (
                  tutor.reviews.map((review: any) => {
                    const reviewInitials = review.student.fullName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
                    return (
                      <div key={review.id} className={styles.reviewCard}>
                        <div className={styles.reviewHeader}>
                          <div className={styles.reviewAvatar}>{reviewInitials}</div>
                          <div>
                            <div className={styles.reviewName}>{review.student.fullName}</div>
                            <div className={styles.reviewDate}>
                              {review.createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </div>
                          </div>
                          <span className={styles.reviewStars}>{renderStars(review.rating)}</span>
                        </div>
                        {review.comment && <p className={styles.reviewComment}>{review.comment}</p>}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column — Booking Card */}
          <div>
            <div className={styles.bookingCard} id="booking-card">
              <div className={styles.bookingPrice}>
                <div className={styles.bookingPriceValue}>
                  {priceFormatted}<span className={styles.bookingPriceSuffix}> /hora</span>
                </div>
                {trialFormatted && (
                  <div className={styles.bookingTrial}>
                    <Star size={14} fill="currentColor" /> Aula experimental por {trialFormatted}
                  </div>
                )}
              </div>

              <Link href={`/tutor/${tutor.id}/book`} className={`${styles.bookingBtn} ${styles.bookingBtnPrimary}`} id="book-trial-btn">
                Agendar Aula Experimental
              </Link>

              <Link href={`/tutor/${tutor.id}/book`} className={`${styles.bookingBtn} ${styles.bookingBtnSecondary}`} id="book-regular-btn">
                Agendar Aula Regular
              </Link>

              <Link href="/dashboard/messages" className={`${styles.bookingBtn} ${styles.bookingBtnSecondary}`} id="send-message-btn">
                <MessageCircle size={18} style={{marginRight: '8px', verticalAlign: 'middle'}} /> Enviar Mensagem
              </Link>

              <ul className={styles.bookingFeatures}>
                <li className={styles.bookingFeature}>
                  <span className={styles.bookingFeatureIcon}><Check size={16} /></span>
                  Pagamento seguro em escrow
                </li>
                <li className={styles.bookingFeature}>
                  <span className={styles.bookingFeatureIcon}><Check size={16} /></span>
                  Reembolso total se cancelar com 24h+
                </li>
                <li className={styles.bookingFeature}>
                  <span className={styles.bookingFeatureIcon}><Check size={16} /></span>
                  Sala virtual com vídeo e compartilhamento de tela
                </li>
                <li className={styles.bookingFeature}>
                  <span className={styles.bookingFeatureIcon}><Check size={16} /></span>
                  Gravação da aula disponível por 30 dias
                </li>
                <li className={styles.bookingFeature}>
                  <span className={styles.bookingFeatureIcon}><Check size={16} /></span>
                  Suporte dedicado 7 dias por semana
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
