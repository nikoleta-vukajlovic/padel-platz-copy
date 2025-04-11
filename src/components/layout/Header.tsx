import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import { useRouter } from "next/router";
import { useToast } from "@/hooks/use-toast";
import { User } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

export function Header() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const isDashboardPage = router.pathname === "/admin/dashboard";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast({
        title: 'Success',
        description: 'You have been logged out successfully.',
      });
      router.push('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to log out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const showBookingForm = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('showBooking', 'true');
    window.dispatchEvent(new CustomEvent('showBookingForm'));
    window.history.pushState({}, '', url);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element && router.pathname === "/") {
      if (id === 'booking') {
        element.scrollIntoView({ behavior: 'smooth' });
        showBookingForm();
      } else {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      if (router.pathname !== "/") {
        router.push('/').then(() => {
          window.setTimeout(() => {
            const elementAfterNavigation = document.getElementById(id);
            if (elementAfterNavigation) {
              if (id === 'booking') {
                elementAfterNavigation.scrollIntoView({ behavior: 'smooth' });
                showBookingForm();
              } else {
                elementAfterNavigation.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          }, 100);
        });
      }
    }
  };

  return (
    <header className={`z-50 border-b ${isDashboardPage ? '' : 'fixed top-0 left-0 right-0 bg-[#e3d8ba]'}`}>
      <div className='container mx-auto px-4 py-2'>
        <nav className='flex justify-between items-center'>
          {/* Logo - Always visible */}
          <Link href='/' className='flex-shrink-0'>
            <img
              src='/logo-transparent.png'
              alt='Padel Platz'
              className='w-12 sm:w-16 md:w-20'
            />
          </Link>

          {/* Desktop Menu */}
          <div className='hidden sm:flex gap-2 md:gap-4 mx-4'>
            {userRole !== 'manager' && (
              <>
                <Link href='/about_us'>
                  <Button variant='ghost' className='text-platz-green font-medium text-sm md:text-lg hover:text-platz-green/90'>
                    O nama
                  </Button>
                </Link>
                <Link href='/rules'>
                  <Button variant='ghost' className='text-platz-green font-medium text-sm md:text-lg hover:text-platz-green/90'>
                    Pravila
                  </Button>
                </Link>
                <Link href='/history'>
                  <Button variant='ghost' className='text-platz-green font-medium text-sm md:text-lg hover:text-platz-green/90'>
                    Istorija
                  </Button>
                </Link>
                <Link href='/blog'>
                  <Button variant='ghost' className='text-platz-green font-medium text-sm md:text-lg hover:text-platz-green/90'>
                    Vesti
                  </Button>
                </Link>
                <Link href='/contact'>
                  <Button variant='ghost' className='text-platz-green font-medium text-sm md:text-lg hover:text-platz-green/90'>
                    Kontakt
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Right Side Actions */}
          <div className='flex items-center gap-2'>
            {user ? (
              <>
                {userRole !== 'manager' && (
                  <Button
                    className="bg-[#FF7F50] text-white px-3 py-1 md:px-4 md:py-2 text-sm md:text-base"
                    onClick={() => scrollToSection('booking')}
                  >
                    Rezerviši
                  </Button>
                )}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' className='p-1 md:p-2 text-platz-green'>
                      <User className='w-5 h-5 md:w-6 md:h-6'/>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48" align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="w-full cursor-pointer">
                        Moj Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      Odjava
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <div className="hidden sm:flex items-center gap-1">
                  <Link href='/auth/login'>
                    <Button variant='ghost' className='text-platz-green text-sm md:text-base'>
                      Prijava
                    </Button>
                  </Link>
                  <span className='text-gray-400'>|</span>
                  <Link href='/auth/register'>
                    <Button variant='ghost' className='text-platz-green text-sm md:text-base'>
                      Registracija
                    </Button>
                  </Link>
                </div>
                <Button
                  className="bg-[#FF7F50] text-white px-3 py-1 md:px-4 md:py-2 text-sm md:text-base"
                  onClick={() => scrollToSection('booking')}
                >
                  Rezerviši
                </Button>
              </>
            )}

            {user && userRole !== 'manager' && (
                <>
                  {/* Mobile Menu Button */}
                  <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="sm:hidden text-platz-green ml-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
                    </svg>
                  </button>
                </>
            )}

          </div>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="sm:hidden flex flex-col gap-1 mt-2 pb-2">
            {userRole !== 'manager' && (
              <>
                <Link href='/about_us'>
                  <Button variant='ghost' className='w-full text-platz-green justify-start'>
                    O nama
                  </Button>
                </Link>
                <Link href='/rules'>
                  <Button variant='ghost' className='w-full text-platz-green justify-start'>
                    Pravila
                  </Button>
                </Link>
                <Link href='/history'>
                  <Button variant='ghost' className='w-full text-platz-green justify-start'>
                    Istorija
                  </Button>
                </Link>
                <Link href='/blog'>
                  <Button variant='ghost' className='w-full text-platz-green justify-start'>
                    Vesti
                  </Button>
                </Link>
                <Link href='/contact'>
                  <Button variant='ghost' className='w-full text-platz-green justify-start'>
                    Kontakt
                  </Button>
                </Link>
              </>
            )}
            {!user && (
              <div className="flex flex-col gap-1 mt-2 border-t pt-2">
                <Link href='/auth/login'>
                  <Button variant='ghost' className='w-full text-platz-green justify-start'>
                    Prijava
                  </Button>
                </Link>
                <Link href='/auth/register'>
                  <Button variant='ghost' className='w-full text-platz-green justify-start'>
                    Registracija
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}