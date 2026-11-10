import { Modal, Pressable, StyleSheet, Text } from 'react-native';

import { COLORS, LINE_HEIGHTS, TYPE } from '@/constants/theme';
import { RADIUS, SPACE } from '@/constants/layout';
import { CONFIRM_DIALOG_SIZES } from '@/constants/sizes';
import type { ConfirmDialogProps, DialogButtonProps } from './types';

// A centred confirmation: message, a red action button, Cancel.
export function ConfirmDialog({
  visible,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
  onDismiss = onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onDismiss}>
      <Pressable style={styles.overlay} onPress={onDismiss}>
        {/* Inner Pressable swallows taps so only the dim area cancels. */}
        <Pressable style={styles.box}>
          <Text style={styles.message}>{message}</Text>
          <DialogButton label={confirmLabel} destructive={tone === 'danger'} primary={tone === 'primary'} onPress={onConfirm} />
          <DialogButton label={cancelLabel} onPress={onCancel} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// `primary` is the blue Save button; disabled it turns grey and ignores taps.
export function DialogButton({
  label,
  destructive,
  primary,
  disabled,
  onPress,
}: DialogButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        primary && (disabled ? styles.primaryDisabled : styles.primary),
        pressed && !disabled && styles.pressed,
      ]}
      disabled={disabled}
      accessibilityRole="button"
      onPress={onPress}>
      <Text style={[styles.buttonLabel, destructive && styles.destructive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACE.xxl,
    backgroundColor: COLORS.dialogOverlay,
  },
  box: {
    borderRadius: RADIUS.xl,
    padding: SPACE.lg,
    paddingTop: SPACE.xl,
    backgroundColor: COLORS.surface,
  },
  message: {
    marginBottom: SPACE.sm,
    textAlign: 'center',
    ...TYPE.body,
    lineHeight: LINE_HEIGHTS.normal,
  },
  button: {
    height: CONFIRM_DIALOG_SIZES.buttonHeight,
    marginTop: SPACE.lg,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.separator,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  primaryDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  pressed: {
    opacity: 0.7,
  },
  buttonLabel: {
    ...TYPE.bodyMedium,
  },
  destructive: {
    color: COLORS.danger,
  },
});
