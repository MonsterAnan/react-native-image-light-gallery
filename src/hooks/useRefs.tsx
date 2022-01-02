import { useRef } from 'react';
import { PinchGestureHandler } from 'react-native-gesture-handler';
import { ScrollView } from 'react-native-gesture-handler';

export const useRefs = () => {
  const pan = useRef();
  const tap = useRef();
  const doubleTap = useRef();
  const swVRef = useRef<ScrollView>();
  const swHRef = useRef<ScrollView>();

  const pinch = useRef<PinchGestureHandler>();
  return {
    pan,
    tap,
    doubleTap,
    pinch,
    swVRef,
    swHRef,
  };
};
