import type { Metadata } from 'next';
import TerminiClient from './TerminiClient';

export const metadata: Metadata = {
  title: 'Terms of Service — JES',
  description: 'Terms of Service for JES — Il Social delle Emozioni.',
};

export default function TerminiPage() {
  return <TerminiClient />;
}
