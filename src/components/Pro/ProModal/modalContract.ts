import type { ModalProps } from 'antdv-next';

export const PRO_MODAL_DEFAULTS = {
  centered: true,
  closable: true,
  keyboard: true,
  mask: true,
} satisfies Pick<ModalProps, 'centered' | 'closable' | 'keyboard' | 'mask'>;
