import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/Button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useScanSession } from '@/state/useScanSession';
import { Radius, Spacing } from '@/constants/theme';

// T031 (FR-001: single photo per lot scan session for v1).
export default function CaptureScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);
  const { startScan, loading } = useScanSession();

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo) return;
      await startScan({ uri: photo.uri, type: 'image/jpeg', name: 'lot.jpg' });
      router.push('/review');
    } catch (err) {
      // startScan throws on failure specifically so we land here instead of
      // navigating to a review screen with no session to show.
      Alert.alert('Could not start scan', err instanceof Error ? err.message : 'Unknown error.');
    } finally {
      setCapturing(false);
    }
  };

  // Lets a test photo (or a real one already on the device) stand in for a live
  // capture -- useful on devices/emulators without a usable camera, and for
  // employees who photographed a lot earlier and want to upload it now.
  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;

    setCapturing(true);
    try {
      const asset = result.assets[0];
      await startScan({
        uri: asset.uri,
        type: asset.mimeType ?? 'image/jpeg',
        name: asset.fileName ?? 'lot.jpg',
      });
      router.push('/review');
    } catch (err) {
      Alert.alert('Could not start scan', err instanceof Error ? err.message : 'Unknown error.');
    } finally {
      setCapturing(false);
    }
  };

  if (!permission) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.center}>
        <SafeAreaView style={styles.permissionBox}>
          <View style={styles.permissionIcon}>
            <Ionicons name="camera-outline" size={32} color="#fff" />
          </View>
          <ThemedText type="subtitle" style={styles.centerText}>
            Camera access needed
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.centerText}>
            Lot Scanner needs your camera to photograph a customer's game lot.
          </ThemedText>
          <Button label="Grant camera access" icon="camera" onPress={requestPermission} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  const busy = capturing || loading;

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />

      <SafeAreaView style={styles.topBar} pointerEvents="box-none">
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </Pressable>
      </SafeAreaView>

      <View style={styles.scrim} pointerEvents="none" />
      <SafeAreaView style={styles.footer}>
        <ThemedText type="small" style={styles.hint}>
          Fit the whole lot in frame, then capture
        </ThemedText>
        <Pressable onPress={takePhoto} disabled={busy} style={styles.captureButton}>
          {busy ? <ActivityIndicator color="#fff" /> : <View style={styles.captureButtonInner} />}
        </Pressable>
        <Pressable onPress={pickFromLibrary} disabled={busy} style={styles.libraryButton}>
          <Ionicons name="images-outline" size={16} color="#fff" />
          <ThemedText type="small" style={styles.libraryLabel}>
            Choose from library
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centerText: { textAlign: 'center', paddingHorizontal: Spacing.four },
  permissionBox: { gap: Spacing.three, alignItems: 'center', paddingHorizontal: Spacing.five },
  permissionIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    backgroundColor: '#8A8F99',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 260,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  hint: { color: 'rgba(255,255,255,0.85)' },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  libraryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  libraryLabel: { color: '#fff', fontWeight: '600' },
});
