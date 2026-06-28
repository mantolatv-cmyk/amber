'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

export default function WelcomeToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get('booking') === 'success') {
      toast.success('Reserva confirmada com sucesso! Você receberá um e-mail com os detalhes.');
      
      // Remove query param without refreshing the page
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('booking');
      const newUrl = `${pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`;
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  return null;
}
