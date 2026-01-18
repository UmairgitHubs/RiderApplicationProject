import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeViewProps extends ViewProps {
  children: React.ReactNode;
  safeBottom?: boolean;
  safeTop?: boolean;
}

/**
 * View component that automatically adds safe area padding
 */
export default function SafeView({ 
  children, 
  style,
  safeBottom = true,
  safeTop = false,
  ...props 
}: SafeViewProps) {
  const insets = useSafeAreaInsets();
  
  const safeStyle = {
    paddingBottom: safeBottom ? Math.max(insets.bottom, 16) : 0,
    paddingTop: safeTop ? Math.max(insets.top, 0) : 0,
  };
  
  return (
    <View
      {...props}
      style={[style, safeStyle]}
    >
      {children}
    </View>
  );
}





