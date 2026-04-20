import type { Metadata } from 'next';
import TerminiClient from './TerminiClient';

export const metadata: Metadata = {
  title: 'Terms of Service — JES',
  description: 'JES Terms of Service — conditions governing your use of the platform.',
};

export default function TerminiPage() {
  return <TerminiClient />;
}
