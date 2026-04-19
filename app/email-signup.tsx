import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Animated,
  Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled: boolean }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    if (disabled) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0.65, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
    ]).start();
  };
  const onPressOut = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable onPress={disabled ? undefined : onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View
        style={[
          styles.submitButton,
          disabled && styles.submitButtonDisabled,
          { opacity, transform: [{ scale }] },
        ]}
      >
        <Text style={styles.submitButtonText}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

function FocusableInput(props: React.ComponentProps<typeof TextInput>) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      {...props}
      style={[styles.input, focused && styles.inputFocused, props.style]}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholderTextColor="#AAAAAA"
    />
  );
}

const NATIONALITIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria',
  'Bangladesh', 'Belgium', 'Brazil', 'Canada', 'Chile', 'China', 'Colombia',
  'Croatia', 'Czech Republic', 'Denmark', 'Egypt', 'Ethiopia', 'Finland',
  'France', 'Germany', 'Ghana', 'Greece', 'Hungary', 'India', 'Indonesia',
  'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Japan', 'Jordan', 'Kenya',
  'South Korea', 'Kuwait', 'Lebanon', 'Libya', 'Malaysia', 'Mexico',
  'Morocco', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Pakistan',
  'Peru', 'Philippines', 'Poland', 'Portugal', 'Romania', 'Russia',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Singapore', 'South Africa', 'Spain',
  'Sweden', 'Switzerland', 'Syria', 'Thailand', 'Tunisia', 'Turkey',
  'UAE', 'Ukraine', 'United Kingdom', 'United States', 'Venezuela', 'Vietnam',
];

export default function EmailSignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [nationality, setNationality] = useState('');
  const [showNationalityList, setShowNationalityList] = useState(false);
  const [nationalityFilter, setNationalityFilter] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [acceptsPromotions, setAcceptsPromotions] = useState(false);
  const [loading, setLoading] = useState(false);

  const filteredNationalities = NATIONALITIES.filter(n =>
    n.toLowerCase().includes(nationalityFilter.toLowerCase())
  );

  const isReady =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.trim().length > 0 &&
    termsAccepted;

  const handleSignUp = async () => {
    if (!isReady || loading) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) {
        Alert.alert('Registrazione fallita', error.message);
        return;
      }
      if (!data.user) {
        Alert.alert('Errore', 'Impossibile creare l\'account. Riprova.');
        return;
      }

      const baseName = `${firstName.trim().toLowerCase()}${lastName.trim().toLowerCase()}`;
      const username  = `${baseName}${Math.floor(Math.random() * 900) + 100}`;
      await supabase.from('users').insert({
        auth_id:            data.user.id,
        email:              email.trim(),
        name:               `${firstName.trim()} ${lastName.trim()}`,
        username,
        phone:              phone.trim() || null,
        title:              title.trim() || null,
        bio:                bio.trim() || null,
        nationality:        nationality || null,
        accepts_promotions: acceptsPromotions,
      });

      router.push({
        pathname: '/onboarding-username',
        params: { firstName: firstName.trim(), lastName: lastName.trim() },
      });
    } catch {
      Alert.alert('Errore', 'Qualcosa è andato storto. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color="#111111" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Sign up</Text>
          <Text style={styles.subtitle}>Create an account to join JES</Text>

          <View style={styles.form}>
            {/* Name row */}
            <View style={styles.rowGroup}>
              <View style={[styles.inputGroup, styles.halfGroup]}>
                <Text style={styles.label}>First Name</Text>
                <FocusableInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Mario"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
              <View style={[styles.inputGroup, styles.halfGroup]}>
                <Text style={styles.label}>Last Name</Text>
                <FocusableInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Rossi"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <FocusableInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <FocusableInput
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                secureTextEntry
              />
            </View>

            {/* Phone (optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Phone number{' '}
                <Text style={styles.optionalLabel}>(optional)</Text>
              </Text>
              <FocusableInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+39 333 000 0000"
                keyboardType="phone-pad"
                autoCorrect={false}
              />
            </View>

            {/* Separatore: dati profilo */}
            <View style={styles.sectionDivider}>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionLabel}>Profilo</Text>
              <View style={styles.sectionLine} />
            </View>

            {/* Title / disciplina (optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Title / Discipline{' '}
                <Text style={styles.optionalLabel}>(optional)</Text>
              </Text>
              <FocusableInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Photographer, Painter…"
                autoCapitalize="sentences"
                autoCorrect={false}
              />
            </View>

            {/* Bio / description (optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Bio / Description{' '}
                <Text style={styles.optionalLabel}>(optional)</Text>
              </Text>
              <FocusableInput
                value={bio}
                onChangeText={t => { if (t.length <= 160) setBio(t); }}
                placeholder="Tell the JES community about yourself…"
                multiline
                style={{ minHeight: 80, textAlignVertical: 'top', paddingTop: 12 }}
                autoCapitalize="sentences"
              />
              <Text style={styles.charCount}>{bio.length}/160</Text>
            </View>

            {/* Nationality (optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Nationality{' '}
                <Text style={styles.optionalLabel}>(optional)</Text>
              </Text>
              <TouchableOpacity
                style={styles.selectInput}
                activeOpacity={0.7}
                onPress={() => { setShowNationalityList(p => !p); setNationalityFilter(''); }}
              >
                <Text style={[styles.selectInputText, !nationality && { color: '#AAAAAA' }]}>
                  {nationality || 'Select nationality'}
                </Text>
                <Ionicons name={showNationalityList ? 'chevron-up' : 'chevron-down'} size={18} color="#AAAAAA" />
              </TouchableOpacity>

              {showNationalityList && (
                <View style={styles.dropdownContainer}>
                  <FocusableInput
                    value={nationalityFilter}
                    onChangeText={setNationalityFilter}
                    placeholder="Search..."
                    style={styles.dropdownSearch}
                    autoCorrect={false}
                  />
                  <ScrollView style={styles.dropdownList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => { setNationality(''); setShowNationalityList(false); }}
                    >
                      <Text style={[styles.dropdownItemText, { color: '#AAAAAA' }]}>— None —</Text>
                    </TouchableOpacity>
                    {filteredNationalities.map(n => (
                      <TouchableOpacity
                        key={n}
                        style={styles.dropdownItem}
                        onPress={() => { setNationality(n); setShowNationalityList(false); setNationalityFilter(''); }}
                      >
                        <Text style={[styles.dropdownItemText, nationality === n && { color: '#F07B1D', fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
                          {n}
                        </Text>
                        {nationality === n && <Ionicons name="checkmark" size={16} color="#F07B1D" />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Terms checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              activeOpacity={0.7}
              onPress={() => setTermsAccepted(p => !p)}
            >
              <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                {termsAccepted && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>
                I agree to the{' '}
                <Text
                  style={styles.termsLink}
                  onPress={(e) => { e.stopPropagation(); router.push('/terms'); }}
                >
                  Terms of Use
                </Text>
                {' '}and{' '}
                <Text
                  style={styles.termsLink}
                  onPress={(e) => { e.stopPropagation(); router.push('/terms'); }}
                >
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Promotions checkbox */}
            <TouchableOpacity
              style={[styles.checkboxRow, { marginBottom: 28 }]}
              activeOpacity={0.7}
              onPress={() => setAcceptsPromotions(p => !p)}
            >
              <View style={[styles.checkbox, acceptsPromotions && styles.checkboxChecked]}>
                {acceptsPromotions && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>
                I agree to receive promotions and news from JES{' '}
                <Text style={styles.optionalLabel}>(optional)</Text>
              </Text>
            </TouchableOpacity>

            {loading
              ? <ActivityIndicator color="#F07B1D" style={{ marginTop: 8 }} />
              : <PrimaryButton label="Sign up" onPress={handleSignUp} disabled={!isReady} />
            }

            {/* Already have account */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.push('/email-login')}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLinkText}>
                Already have an account?{' '}
                <Text style={styles.termsLink}>Log in</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 28,
    color: '#111111',
    letterSpacing: -0.3,
    lineHeight: 34,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: '#666666',
    lineHeight: 23,
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  rowGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  halfGroup: {
    flex: 1,
  },
  label: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    color: '#111111',
    marginBottom: 8,
  },
  optionalLabel: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#AAAAAA',
  },
  input: {
    height: 52,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#111111',
  },
  inputFocused: {
    borderWidth: 1.5,
    borderColor: '#F07B1D',
    backgroundColor: '#FFFFFF',
  },
  selectInput: {
    height: 52,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectInputText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#111111',
    flex: 1,
  },
  dropdownContainer: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F07B1D',
    overflow: 'hidden',
    maxHeight: 220,
  },
  dropdownSearch: {
    height: 44,
    backgroundColor: '#F9F9F9',
    borderRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  dropdownList: {
    maxHeight: 176,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dropdownItemText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: '#111111',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#F07B1D',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#FAD8C3',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#DDDDDD',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: '#F07B1D',
    borderColor: '#F07B1D',
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13,
    color: '#666666',
    lineHeight: 20,
  },
  termsLink: {
    color: '#F07B1D',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginLinkText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    color: '#666666',
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    marginTop: 4,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  sectionLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    color: '#AAAAAA',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  charCount: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: '#AAAAAA',
    textAlign: 'right',
    marginTop: 4,
  },
});
