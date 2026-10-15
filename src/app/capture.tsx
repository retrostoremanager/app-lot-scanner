import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useScanSession } from '@/state/useScanSession';
import { Spacing } from '@/constants/theme';

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
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.center}>
        <SafeAreaView style={styles.permissionBox}>
          <ThemedText type="subtitle" style={styles.centerText}>
            Camera access needed
          </ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.centerText}>
            Lot Scanner needs your camera to photograph a customer's game lot.
          </ThemedText>
          <Pressable onPress={requestPermission} style={styles.permissionButton}>
            <ThemedText type="linkPrimary">
              Grant camera access
            </ThemedText>
          </Pressable>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const busy = capturing || loading;

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <SafeAreaView style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          Fit the whole lot in frame, then capture.
        </ThemedText>
        <Pressable onPress={takePhoto} disabled={busy} style={styles.captureButton}>
          {busy ? <ActivityIndicator color="#fff" /> : <View style={styles.captureButtonInner} />}
        </Pressable>
        <Pressable onPress={pickFromLibrary} disabled={busy}>
          <ThemedText type="link" style={styles.libraryLink}>
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
  permissionBox: { gap: Spacing.three, alignItems: 'center' },
  permissionButton: { marginTop: Spacing.two },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  hint: { color: '#fff' },
  libraryLink: { color: '#fff', textDecorationLine: 'underline' },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
});
