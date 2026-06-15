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
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import GlassBackground from '../components/GlassBackground';
import Input from '../components/Input';
import Button from '../components/Button';
import { registerUser, loginUser, saveToken } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

WebBrowser.maybeCompleteAuthSession();

// ── Password Strength Meter ─────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const { theme } = useTheme();
  if (!password) return null;

  let level = 0;
  if (password.length >= 6) level = 1;
  if (password.length >= 8 && /[A-Z]/.test(password)) level = 2;
  if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9!@#$%^&*]/.test(password)) level = 3;

  const colors = ['#ef4444', '#f59e0b', '#10b981'];
  const labels = ['Weak', 'Fair', 'Strong'];
  const color = colors[level - 1] ?? colors[0];
  const label = labels[level - 1] ?? labels[0];

  return (
    <View style={styles.strengthWrapper}>
      <View style={styles.strengthBars}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.strengthBar,
              { backgroundColor: i <= level ? color : theme.border },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.strengthLabel, { color }]}>{label}</Text>
    </View>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // ── Entrance animation ───────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, speed: 14, bounciness: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  const update = (field: keyof typeof form, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  // ── Validation — Rule 5: Prevent Errors ─────────────────────────────────
  const validate = () => {
    const newErrors = { name: '', email: '', password: '' };
    let valid = true;
    if (!form.name.trim()) { newErrors.name = 'Full name is required'; valid = false; }
    if (!form.email) { newErrors.email = 'Email is required'; valid = false; }
    else if (!/\S+@\S+\.\S+/.test(form.email)) { newErrors.email = 'Enter a valid email'; valid = false; }
    if (!form.password) { newErrors.password = 'Password is required'; valid = false; }
    else if (form.password.length < 6) { newErrors.password = 'Password must be at least 6 characters'; valid = false; }
    setErrors(newErrors);
    return valid;
  };

  const handleRegister = async () => {
    setGlobalError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await registerUser(form);
      const loginRes = await loginUser({ email: form.email, password: form.password });
      await saveToken(loginRes.data.access_token);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setGlobalError(Array.isArray(message) ? message[0] : message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const redirectUri = Linking.createURL('/auth-callback');
      // @ts-ignore
      const backendUrl = api.defaults.baseURL;
      const authUrl = `${backendUrl}/auth/google?state=${encodeURIComponent(redirectUri)}`;
      
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      
      if (result.type === 'success' && result.url) {
        const parsedUrl = Linking.parse(result.url);
        const token = parsedUrl.queryParams?.token;
        if (token) {
           await saveToken(token as string);
           router.replace('/(tabs)/home');
        }
      }
    } catch (e) {
      console.error(e);
      setGlobalError('Google login failed.');
    }
  };

  return (
    <GlassBackground>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      {/* ── Top bar: back + theme toggle ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
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
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.6)' },
              { borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.4)' },
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
          {/* ── Brand icon ── */}
          <View style={styles.brandRow}>
            <View style={[styles.logoBox, { backgroundColor: theme.accentSurface, borderColor: theme.accentBorder }]}>
              <Image
                source={require('../assets/images/trimly logo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* ── Heading ── */}
          <Text style={[styles.heading, { color: theme.text }]}>Create Account</Text>
          <Text style={[styles.subheading, { color: theme.textSecondary }]}>
            Join thousands achieving their fitness goals.
          </Text>

          {/* ── Global error ── */}
          {globalError ? (
            <View style={[styles.errorBanner, { backgroundColor: theme.errorSurface, borderColor: theme.errorBorder }]}>
              <Ionicons name="alert-circle" size={16} color={theme.error} style={{ marginRight: 8 }} />
              <Text style={[styles.errorText, { color: theme.error }]}>{globalError}</Text>
            </View>
          ) : null}

          {/* ── Form ── */}
          <Input
            label="Full Name"
            value={form.name}
            onChangeText={(v) => update('name', v)}
            placeholder="John Doe"
            icon="person-outline"
            error={errors.name}
            autoCapitalize="words"
          />

          <Input
            label="Email Address"
            value={form.email}
            onChangeText={(v) => update('email', v)}
            placeholder="you@example.com"
            keyboardType="email-address"
            icon="mail-outline"
            error={errors.email}
          />

          <Input
            label="Password"
            value={form.password}
            onChangeText={(v) => update('password', v)}
            placeholder="Min. 6 characters"
            secureTextEntry
            icon="lock-closed-outline"
            error={errors.password}
            hint={!errors.password ? 'Use 8+ chars, uppercase & numbers for a strong password' : undefined}
          />

          {/* ── Password strength ── Rule 5 ── */}
          <PasswordStrength password={form.password} />

          <Button
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
            icon="person-add-outline"
          />

          {/* ── Divider ── */}
          <View style={styles.orRow}>
            <View style={[styles.orLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.orText, { color: theme.textMuted }]}>OR</Text>
            <View style={[styles.orLine, { backgroundColor: theme.border }]} />
          </View>

          {/* ── Google OAuth ── */}
          <TouchableOpacity
            style={[styles.googleBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handleGoogleAuth}
            activeOpacity={0.75}
            accessibilityLabel="Continue with Google"
          >
            <Ionicons name="logo-google" size={19} color="#ea4335" style={{ marginRight: 10 }} />
            <Text style={[styles.googleText, { color: theme.text }]}>Continue with Google</Text>
          </TouchableOpacity>

          {/* ── Sign in link — Rule 6: Reversal ── */}
          <View style={styles.loginRow}>
            <Text style={[styles.loginPrompt, { color: theme.textSecondary }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/login')} accessibilityLabel="Sign in">
              <Text style={[styles.loginLink, { color: theme.accent }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topBar: {
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  iconBtn: {
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
    paddingBottom: 32,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    padding: 32,
    borderRadius: 32,
    borderWidth: 1,
  },
  brandRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBox: {
    width: 70,
    height: 70,
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogo: {
    width: 58,
    height: 58,
    transform: [{ scale: 1.08 }],
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
  strengthWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 12,
  },
  strengthBars: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
    marginRight: 10,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
    width: 40,
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
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginPrompt: { fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: '700' },
});
