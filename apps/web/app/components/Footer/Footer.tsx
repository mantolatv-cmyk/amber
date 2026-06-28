import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer} id="footer">
      <div className={styles.footerGrid}>
        <div className={styles.footerBrand}>
          <Link href="/" className={styles.footerLogo}>
            <span className={styles.logoIcon}><BookOpen size={18} strokeWidth={2.5} /></span>
            Open<span className={styles.logoAccent}>Learn</span>
          </Link>
          <p className={styles.footerDesc}>
            A plataforma líder em educação 1:1 de Inteligência Artificial no Brasil.
            Conectando alunos a tutores especialistas para uma aprendizagem personalizada.
          </p>
        </div>

        <div>
          <h4 className={styles.footerColTitle}>Plataforma</h4>
          <ul className={styles.footerLinks}>
            <li><Link href="/search" className={styles.footerLink}>Encontrar Tutor</Link></li>
            <li><Link href="/subjects" className={styles.footerLink}>Matérias</Link></li>
            <li><Link href="/become-tutor" className={styles.footerLink}>Seja um Tutor</Link></li>
            <li><Link href="/enterprise" className={styles.footerLink}>Para Empresas</Link></li>
          </ul>
        </div>

        <div>
          <h4 className={styles.footerColTitle}>Suporte</h4>
          <ul className={styles.footerLinks}>
            <li><Link href="/help" className={styles.footerLink}>Central de Ajuda</Link></li>
            <li><Link href="/contact" className={styles.footerLink}>Contato</Link></li>
            <li><Link href="/faq" className={styles.footerLink}>FAQ</Link></li>
            <li><Link href="/blog" className={styles.footerLink}>Blog</Link></li>
          </ul>
        </div>

        <div>
          <h4 className={styles.footerColTitle}>Legal</h4>
          <ul className={styles.footerLinks}>
            <li><Link href="/terms" className={styles.footerLink}>Termos de Uso</Link></li>
            <li><Link href="/privacy" className={styles.footerLink}>Privacidade</Link></li>
            <li><Link href="/cookies" className={styles.footerLink}>Cookies</Link></li>
          </ul>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <p className={styles.footerCopy}>
          © 2026 OpenLearn. Todos os direitos reservados. Feito com 🤖 no Brasil.
        </p>
      </div>
    </footer>
  );
}
