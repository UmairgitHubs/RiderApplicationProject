import React from 'react';
import ComingSoonScreen from '../common/ComingSoonScreen';

export default function RouteScreen({ navigation }: any) {
  return (
    <ComingSoonScreen 
      navigation={navigation}
      route={{
        params: {
          featureName: 'Route Planning',
          description: 'Advanced route planning and optimization with real-time traffic updates is coming soon!'
        }
      }}
    />
  );
}









