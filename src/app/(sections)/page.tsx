'use client';

import { useBasePath } from '@/hooks/useBasePath';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RootPage() {
    const basePath = useBasePath();
    const router = useRouter();

    useEffect(() => {
        router.replace(`${basePath}/extract`);
    }, [basePath, router]);

    return null;
}
