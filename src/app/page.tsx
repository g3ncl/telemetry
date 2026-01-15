import { DEFAULT_LOCALE } from '@/constants';
import { redirect } from 'next/navigation';

export default function RootPage() {
    redirect(`/${DEFAULT_LOCALE}/extract`);
}
