import { FC } from 'react';

interface GlobalVariablesManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

declare const GlobalVariablesManager: FC<GlobalVariablesManagerProps>;

export default GlobalVariablesManager;
