import React from 'react';
import { ScrollView, ScrollViewProps, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
}

/**
 * ScrollView component that automatically adds bottom padding to avoid system navigation bar
 */
export default function SafeScrollView({ 
  children, 
  contentContainerStyle,
  ...props 
}: SafeScrollViewProps) {
  const insets = useSafeAreaInsets();
  
  return (
    <ScrollView
      {...props}
      contentContainerStyle={[
        contentContainerStyle,
        { paddingBottom: Math.max(insets.bottom, 20) }
      ]}
    >
      {children}
    </ScrollView>
  );
}





