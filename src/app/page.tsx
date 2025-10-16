import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to studio as the main app
  redirect('/studio');
}
