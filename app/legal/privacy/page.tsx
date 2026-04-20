import type { Metadata } from 'next';
import PrivacyClient from './PrivacyClient';

export const metadata: Metadata = {
  title: 'Privacy Policy — JES',
  description: 'JES privacy policy — how we collect, use and protect your personal data.',
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
