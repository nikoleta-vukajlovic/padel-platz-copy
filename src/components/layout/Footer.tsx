import { Mail, Phone, MapPin, Clock } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className='bg-[#c2ae80] border-t'>
      <div className='container mx-auto px-4 py-6'>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8'>
          {/* Contact Column */}
          <div className='text-center'>
            <h3 className='text-base md:text-lg font-semibold mb-3 md:mb-4 text-[#233c1d]'>Kontakt</h3>
            <div className='space-y-2'>
              <div className='flex items-center justify-center  gap-2 text-sm md:text-base text-[#4b5563]'>
                <Phone className='h-4 w-4 flex-shrink-0' />
                <span>+381 123 456 789</span>
              </div>
              <div className='flex items-center justify-center  gap-2 text-sm md:text-base text-[#4b5563]'>
                <Mail className='h-4 w-4 flex-shrink-0' />
                <a href='mailto:info@padelplatz.rs' className='hover:text-[#4b5563] transition-colors'>
                  info@padelplatz.rs
                </a>
              </div>
              <div className='flex items-center justify-center  gap-2 text-sm md:text-base text-[#4b5563]'>
                <MapPin className='h-4 w-4 flex-shrink-0' />
                <span>Milomira Glavcica 18, Kraljevo</span>
              </div>
            </div>
          </div>

          {/* Hours Column */}
          <div className='text-center'>
            <h3 className='text-base md:text-lg font-semibold mb-3 md:mb-4 text-[#233c1d]'>Radno vreme</h3>
            <div className='space-y-2 text-sm md:text-base text-[#4b5563]'>
              <div className='flex items-center justify-center  gap-2'>
                <Clock className='h-4 w-4 flex-shrink-0' />
                <span>Podenedeljak - Nedelja</span>
              </div>
              <div className='pl-6'>8:00 - 00:00</div>
            </div>
          </div>

          {/* Social Column */}
          <div className='text-center'>
            <h3 className='text-base md:text-lg font-semibold mb-3 md:mb-4 text-[#233c1d]'>Zapratite nas</h3>
            <div className='space-y-2'>
              <a
                href='https://www.instagram.com/padelplatz/'
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-2 text-sm md:text-base text-[#4b5563] hover:text-[#3398db] transition-colors'
              >
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div className='mt-6 md:mt-8 pt-4 border-t text-center text-xs md:text-sm text-[#4b5563]'>
          <p>© {new Date().getFullYear()} Padel Platz. Sva prava zadržana.</p>
        </div>
      </div>
    </footer>
  );
}