import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Image,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Input from '../components/Input';
import Button from '../components/Button';
import { loginUser, saveToken } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [passErr, setPassErr] = useState('');

  // ── Entrance animation ───────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, speed: 14, bounciness: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Validation ───────────────────────────────────────────────────────────
  const validateEmail = () => {
    if (!email) { setEmailErr('Email is required'); return false; }
    if (!/\S+@\S+\.\S+/.test(email)) { setEmailErr('Enter a valid email address'); return false; }
    setEmailErr(''); return true;
  };

  const validatePass = () => {
    if (!password) { setPassErr('Password is required'); return false; }
    setPassErr(''); return true;
  };

  const handleLogin = async () => {
    setError('');
    const ok = validateEmail() && validatePass();
    if (!ok) return;

    setLoading(true);
    try {
      const res = await loginUser({ email, password });
      await saveToken(res.data.access_token);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      setError(Array.isArray(message) ? message[0] : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.flex}>
        {/* ── Theme toggle ── */}
        <View style={[styles.topBar, { backgroundColor: theme.bg }]}>
          <TouchableOpacity
            onPress={toggleTheme}
            accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={[styles.themeBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* ── Brand ── */}
            <View style={styles.brandRow}>
              <View style={[styles.logoBox, { backgroundColor: theme.accentSurface, borderColor: theme.accentBorder }]}>
                <Image
                  source={require('../assets/images/trimly logo.png')}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.appName, { color: theme.text }]}>
                Trimly
              </Text>
              <Text style={[styles.tagline, { color: theme.textMuted }]}>
                Your fitness journey starts here
              </Text>
            </View>

            {/* ── Divider ── */}
            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* ── Heading ── */}
            <Text style={[styles.heading, { color: theme.text }]}>Welcome Back</Text>
            <Text style={[styles.subheading, { color: theme.textSecondary }]}>
              Sign in to your account to continue.
            </Text>

            {/* ── Global error — Rule 3: Informative Feedback ── */}
            {error ? (
              <View style={[styles.errorBanner, { backgroundColor: theme.errorSurface, borderColor: theme.errorBorder }]}>
                <Ionicons name="alert-circle" size={16} color={theme.error} style={{ marginRight: 8 }} />
                <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
              </View>
            ) : null}

            {/* ── Form ── */}
            <Input
              label="Email Address"
              value={email}
              onChangeText={(v) => { setEmail(v); if (emailErr) setEmailErr(''); }}
              placeholder="you@example.com"
              keyboardType="email-address"
              icon="mail-outline"
              error={emailErr}
              autoCapitalize="none"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={(v) => { setPassword(v); if (passErr) setPassErr(''); }}
              placeholder="Enter your password"
              secureTextEntry
              icon="lock-closed-outline"
              error={passErr}
            />

            {/* ── Forgot password — Rule 6: Easy Reversal ── */}
            <TouchableOpacity style={styles.forgotRow} accessibilityLabel="Forgot password">
              <Text style={[styles.forgotText, { color: theme.accentLight }]}>Forgot password?</Text>
            </TouchableOpacity>

            <Button title="Sign In" onPress={handleLogin} loading={loading} icon="log-in-outline" />

            {/* ── Divider ── */}
            <View style={styles.orRow}>
              <View style={[styles.orLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.orText, { color: theme.textMuted }]}>OR</Text>
              <View style={[styles.orLine, { backgroundColor: theme.border }]} />
            </View>

            {/* ── Google OAuth ── */}
            <TouchableOpacity
              style={[styles.googleBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = 'http://localhost:3000/auth/google';
                }
              }}
              activeOpacity={0.75}
              accessibilityLabel="Continue with Google"
            >
              <Ionicons name="logo-google" size={19} color="#ea4335" style={{ marginRight: 10 }} />
              <Text style={[styles.googleText, { color: theme.text }]}>Continue with Google</Text>
            </TouchableOpacity>

            {/* ── Register link ── */}
            <View style={styles.registerRow}>
              <Text style={[styles.registerPrompt, { color: theme.textSecondary }]}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/register')} accessibilityLabel="Create new account">
                <Text style={[styles.registerLink, { color: theme.accent }]}>Create one</Text>
              </TouchableOpacity>
            </View>

            {/* ── Footer ── */}
            <Text style={[styles.footer, { color: theme.textMuted }]}>Built by  <Link href="https://junaed93.github.io">Junaed</Link></Text>
          </Animated.View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  themeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  card: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  brandRow: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  brandLogo: {
    width: 64,
    height: 64,
    transform: [{ scale: 1.12 }],
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    marginBottom: 24,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -6,
    marginBottom: 12,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  orLine: { flex: 1, height: 1 },
  orText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginHorizontal: 12,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 24,
    marginBottom: 4,
  },
  googleText: {
    fontSize: 15,
    fontWeight: '700',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerPrompt: { fontSize: 14 },
  registerLink: { fontSize: 14, fontWeight: '700' },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
  },
});
