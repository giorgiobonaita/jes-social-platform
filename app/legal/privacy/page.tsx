import type { Metadata } from 'next';
import PrivacyClient from './PrivacyClient';

export const metadata: Metadata = {
  title: 'Privacy Policy — JES',
  description: 'Privacy Policy for JES — Il Social delle Emozioni.',
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
