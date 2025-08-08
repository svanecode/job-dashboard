'use client';

import { useUrlFilterSync } from '@/hooks/useUrlFilterSync';
import { ReactNode } from 'react';

interface UrlSyncWrapperProps {
  children: ReactNode;
}

export default function UrlSyncWrapper({ children }: UrlSyncWrapperProps) {
  useUrlFilterSync();
  
  return <>{children}</>;
} 