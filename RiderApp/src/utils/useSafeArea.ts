import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Hook to get safe area insets
 * Use this to add padding to avoid content being hidden under system bars
 */
export const useSafeArea = () => {
  const insets = useSafeAreaInsets();
  
  return {
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,
    // Common padding values
    paddingBottom: Math.max(insets.bottom, 16), // At least 16px, or more if system bar is present
    paddingTop: Math.max(insets.top, 0),
  };
};





