import { createContext } from 'react';

export const SettingsModalContext = createContext<{
  setOpenHandler: (handler: (() => void) | null) => void;
  openHandler?: (() => void) | null;
}>({ setOpenHandler: () => {}, openHandler: null });

export {}; 