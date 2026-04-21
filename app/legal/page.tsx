import type { Metadata } from 'next';
import LegalClient from './LegalClient';

export const metadata: Metadata = {
  title: 'Privacy & Terms — JES',
  description: 'Privacy Policy and Terms of Service for JES — Il Social delle Emozioni.',
};

export default function LegalPage() {
  return <LegalClient />;
}
