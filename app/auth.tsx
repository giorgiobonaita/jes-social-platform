import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, Animated,
  Pressable, Platform, StatusBar, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function AuthButton({
  style,
  textStyle,
  label,
  icon,
  onPress,
}: {
  style: object;
  textStyle: object;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
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
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.authButton, style, { opacity, transform: [{ scale }] }]}>
        <View style={styles.iconContainer}>{icon}</View>
        <Text style={[styles.authButtonText, textStyle]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

function GhostButton({ label, onPress, color = '#00829B' }: { label: string; onPress: () => void; color?: string }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.timing(opacity, { toValue: 0.65, duration: 80, useNativeDriver: true }).start();
  const onPressOut = () => Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <Animated.Text style={[styles.ghostText, { color, opacity }]}>{label}</Animated.Text>
    </Pressable>
  );
}

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

      <View style={styles.mainContent}>
        <View style={styles.logoContainer}>
          <View style={styles.logoRow}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logo}>JES</Text>
          </View>
          <Text style={styles.subtitle}>IL SOCIAL DELLE EMOZIONI</Text>
        </View>

        <View style={styles.buttonStack}>
          <AuthButton
            style={styles.appleButton}
            textStyle={styles.lightText}
            label="Continue with Apple"
            icon={<FontAwesome name="apple" size={22} color="#FFFFFF" />}
            onPress={() => router.replace('/home')}
          />
          <AuthButton
            style={styles.facebookButton}
            textStyle={styles.lightText}
            label="Continue with Facebook"
            icon={<FontAwesome name="facebook-f" size={20} color="#FFFFFF" />}
            onPress={() => router.replace('/home')}
          />
          <AuthButton
            style={styles.neutralButton}
            textStyle={styles.darkText}
            label="Continue with Google"
            icon={
              <Image
                source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png' }}
                style={styles.googleIconImage}
              />
            }
            onPress={() => router.replace('/home')}
          />
          <AuthButton
            style={styles.neutralButton}
            textStyle={styles.darkText}
            label="Continue with email"
            icon={<MaterialCommunityIcons name="email-outline" size={22} color="#111111" />}
            onPress={() => router.push('/email-signup')}
          />
        </View>

        <GhostButton label="Forgot password?" onPress={() => router.push('/forgot-password')} />

        <View style={styles.loginHint}>
          <Text style={styles.loginHintText}>Already have an account? </Text>
          <GhostButton label="Log in" onPress={() => router.push('/login')} />
        </View>
      </View>

      <View style={[styles.termsContainer, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.termsText}>
          By continuing, you agree to JES's{' '}
          <Text style={styles.link}>Terms of Service</Text>. We will manage information about you as described in our{' '}
          <Text style={styles.link}>Privacy Policy</Text>, and{' '}
          <Text style={styles.link}>Cookie Policy</Text>.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoImage: {
    width: 52,
    height: 52,
    marginRight: 8,
  },
  logo: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 50,
    color: '#F07B1D',
    letterSpacing: -1.5,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    letterSpacing: 4,
    color: '#888888',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  buttonStack: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    position: 'relative',
  },
  iconContainer: {
    position: 'absolute',
    left: 20,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconImage: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  authButtonText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 15,
    textAlign: 'center',
  },
  lightText: { color: '#FFFFFF' },
  darkText: { color: '#111111' },
  appleButton: { backgroundColor: '#000000' },
  facebookButton: { backgroundColor: '#1877F2' },
  neutralButton: { backgroundColor: '#F5F5F5' },
  ghostText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    textAlign: 'center',
    minHeight: 44,
    textAlignVertical: 'center',
    paddingVertical: 12,
  },
  loginHint: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginHintText: {
    color: '#888888',
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
  },
  termsContainer: {
    paddingHorizontal: 20,
  },
  termsText: {
    color: '#AAAAAA',
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: '#00829B',
    textDecorationLine: 'underline',
  },
});
