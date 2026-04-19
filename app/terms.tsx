import React, { useState } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Pressable,
  ScrollView, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ORANGE = '#F07B1D';

const TABS = [
  { id: 'terms', label: 'Terms of Use' },
  { id: 'privacy', label: 'Privacy Policy' },
] as const;

const TERMS_CONTENT = `Last updated: January 2025

Welcome to JES – Social delle Emozioni ("JES", "we", "our"). Our website is jessocial.com. By using the JES app or website, you agree to these Terms of Use. Please read them carefully.

1. ACCEPTANCE OF TERMS

By accessing or using JES, you confirm that you are at least 13 years old and agree to be bound by these Terms of Use and our Privacy Policy. If you do not agree, please do not use the app.

2. YOUR ACCOUNT

You are responsible for maintaining the confidentiality of your account credentials. You agree to:
• Provide accurate and complete information during registration
• Not impersonate any person or entity
• Not share your account with others
• Notify us immediately of any unauthorized use

3. USER CONTENT

You retain ownership of content you post on JES. By posting, you grant JES a non-exclusive, worldwide, royalty-free license to display and distribute your content within the platform.

You agree NOT to post content that:
• Violates any laws or regulations
• Is defamatory, obscene, or harmful
• Infringes intellectual property rights
• Contains spam or commercial solicitation without authorization
• Harasses, threatens, or intimidates other users

4. PROHIBITED ACTIVITIES

You may not:
• Use the platform for illegal purposes
• Attempt to gain unauthorized access to systems or accounts
• Scrape or collect user data without consent
• Interfere with the normal operation of the platform
• Create fake accounts or manipulate engagement metrics

5. CONTENT MODERATION

JES reserves the right to remove content or suspend accounts that violate these Terms. We may use automated tools and human review to enforce our policies.

6. INTELLECTUAL PROPERTY

The JES name, logo, and all platform content created by us are protected by intellectual property laws. You may not copy, modify, or distribute our proprietary content without explicit permission.

7. DISCLAIMER OF WARRANTIES

JES is provided "as is" without warranties of any kind. We do not guarantee uninterrupted access or that the service will be error-free.

8. LIMITATION OF LIABILITY

To the maximum extent permitted by law, JES shall not be liable for indirect, incidental, or consequential damages arising from your use of the platform.

9. CHANGES TO TERMS

We may update these Terms at any time. Continued use of the platform after changes constitutes acceptance of the new Terms.

10. CONTACT

For questions about these Terms, contact us at:
jes.socialdelleemozioni@gmail.com
Website: jessocial.com`;

const PRIVACY_CONTENT = `Last updated: January 2025

JES – Social delle Emozioni ("we", "our", "us") operates the JES app and website at jessocial.com. We are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and share your data.

1. INFORMATION WE COLLECT

Personal information you provide:
• Name and username
• Email address
• Profile photo
• Bio and artistic discipline
• Nationality (optional)
• Content you post (photos, stories, captions)
• Messages you send within the platform

Information collected automatically:
• Device information and operating system
• App usage data and interactions
• IP address and general location

2. HOW WE USE YOUR INFORMATION

We use your information to:
• Provide and improve the JES platform
• Personalize your experience and content feed
• Send notifications about activity on your account
• Send promotional communications (only if you opted in)
• Ensure safety and enforce our Terms of Use
• Comply with legal obligations

3. INFORMATION SHARING

We do not sell your personal data. We may share information with:
• Service providers who help operate the platform (e.g., Supabase for database and storage)
• Law enforcement when required by law
• Other users, only the information you choose to make public on your profile

4. YOUR PROFILE DATA

By default, your profile (username, bio, posts) is visible to all JES users. You can set individual posts to private in the post privacy settings.

5. DATA RETENTION

We retain your data as long as your account is active. When you delete your account, your personal data and content are removed from our systems within 30 days.

6. YOUR RIGHTS

Depending on your location, you may have the right to:
• Access the personal data we hold about you
• Correct inaccurate data
• Request deletion of your data
• Object to or restrict certain processing
• Data portability

To exercise these rights, contact us at: jes.socialdelleemozioni@gmail.com

7. COOKIES AND TRACKING

The JES mobile app does not use browser cookies. We may use analytics tools to understand app usage patterns in an aggregated, anonymized form.

8. CHILDREN'S PRIVACY

JES is not directed to children under 13. If we learn that a child under 13 has provided personal information, we will delete it promptly.

9. PROMOTIONS AND COMMUNICATIONS

If you opted in to receive promotional communications during registration, we may send you updates about new features, partnerships, and events. You can opt out at any time through your account settings.

10. SECURITY

We implement industry-standard security measures to protect your data. However, no method of electronic transmission is 100% secure, and we cannot guarantee absolute security.

11. CHANGES TO THIS POLICY

We may update this Privacy Policy periodically. We will notify you of significant changes through the app or by email.

12. CONTACT

For privacy-related questions or requests:
📧 jes.socialdelleemozioni@gmail.com
🌐 jessocial.com`;

export default function TermsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  const content = activeTab === 'terms' ? TERMS_CONTENT : PRIVACY_CONTENT;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="#111111" />
        </Pressable>
        <Text style={styles.headerTitle}>Terms & Privacy</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.content}>{content}</Text>

        {/* Contact button */}
        <View style={styles.contactBox}>
          <Ionicons name="mail-outline" size={20} color={ORANGE} />
          <Text style={styles.contactText}>
            Questions? Email us at{'\n'}
            <Text style={styles.contactEmail}>jes.socialdelleemozioni@gmail.com</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 18,
    color: '#111111',
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 14,
    color: '#888888',
  },
  tabTextActive: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111111',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  content: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: '#444444',
    lineHeight: 22,
  },
  contactBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 32,
    backgroundColor: '#FFF0E6',
    borderRadius: 14,
    padding: 16,
  },
  contactText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#666666',
    lineHeight: 20,
  },
  contactEmail: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: ORANGE,
  },
});
