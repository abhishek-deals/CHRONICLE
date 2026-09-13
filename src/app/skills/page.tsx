import { redirect } from 'next/navigation';

// Skills feature has been removed — redirect to dashboard
export default function SkillsPage() {
  redirect('/dashboard');
}
