import { useEffect } from 'react';
import { Header } from './Header';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (userRole === 'manager' && router.pathname !== '/admin/dashboard') {
      router.push('/admin/dashboard');
    }
  }, [userRole, router]);

  return (
    <div className='min-h-screen flex flex-col'>
      <Header />
      <div className='flex-1 bg-[#1b362f]' style={{paddingTop: '5rem'}}>
        {children}
      </div>
      <Footer />
    </div>
  );
}