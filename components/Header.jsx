import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AuthModal from './auth/AuthModal';
import ProfileMenu from './ProfileMenu';
import { useAuth } from '../hooks/useAuth'; // We'll create this hook later

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={isScrolled ? 'scrolled' : ''}>
        <div className="logo">
          <Link href="/">
            <h1>Dragon<span>Quest</span>AI</h1>
          </Link>
        </div>

        <nav>
          <ul>
            <li>
              <Link href="/" className={router.pathname === '/' ? 'active' : ''}>
                Home
              </Link>
            </li>
            <li>
              <Link href="/#rules" className={router.pathname === '/rules' ? 'active' : ''}>
                Rules
              </Link>
            </li>
            <li>
              <Link href="/#plans" className={router.pathname === '/plans' ? 'active' : ''}>
                Plans
              </Link>
            </li>
            <li>
              <Link href="/#about" className={router.pathname === '/about' ? 'active' : ''}>
                About
              </Link>
            </li>
            {!isLoading && !user ? (
              <li>
                <a 
                  href="#" 
                  className="start-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    setAuthModalOpen(true);
                  }}
                >
                  Log In 
                </a>
              </li>
            ) : !isLoading && user ? (
              <li>
                <ProfileMenu user={user} />
              </li>
            ) : null}
          </ul>
        </nav>
      </header>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />
    </>
  );
};

export default Header;