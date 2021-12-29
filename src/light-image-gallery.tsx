import { useHeaderHeight } from '@react-navigation/elements';
import React, { RefObject, useEffect, useState } from 'react';
import { ViewStyle } from 'react-native';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type EventsCallbacks = {
  onSwipeToClose?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onScaleStart?: () => void;
  onPanStart?: () => void;
  onLongPress?: () => void;
};

type ImageDimensions = {
  height: number;
  width: number;
};

export type RenderItemInfo<T> = {
  index: number;
  item: T;
  setImageDimensions: (imageDimensions: ImageDimensions) => void;
};
export type GalleryRef = {
  setIndex: (newIndex: number) => void;
  reset: (animated?: boolean) => void;
};
export type GalleryReactRef = React.Ref<GalleryRef>;

type RenderItem<T> = (
  imageInfo: RenderItemInfo<T>,
) => React.ReactElement | null;

type LightImageGalleryProps<T> = EventsCallbacks & {
  ref?: GalleryReactRef;
  data: T[];
  renderItem?: RenderItem<T>;
  keyExtractor?: (item: T, index: number) => string | number;
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  numToRender?: number;
  emptySpaceWidth?: number;
  doubleTapScale?: number;
  doubleTapInterval?: number;
  maxScale?: number;
  style?: ViewStyle;
  containerDimensions?: { width: number; height: number };
  pinchEnabled?: boolean;
  disableTransitionOnScaledImage?: boolean;
  hideAdjacentImagesOnScaledImage?: boolean;
  disableVerticalSwipe?: boolean;
  disableSwipeUp?: boolean;
  loop?: boolean;
  onScaleChange?: (scale: number) => void;
  onScaleChangeRange?: { start: number; end: number };
};
export const LightImageGallery = <T extends any>({
  initialIndex = 0,
  emptySpaceWidth = 40,
  data,
  containerDimensions,
}: LightImageGalleryProps<T>) => {
  const windowDimensions = useWindowDimensions();
  const dimensions = containerDimensions || windowDimensions;
  const [index, setIndex] = useState(initialIndex);
  const backdropOpacity = useSharedValue(0);
  const currentIndex = useSharedValue(initialIndex);
  const translateX = useSharedValue(
    initialIndex * -(dimensions.width + emptySpaceWidth),
  );
  const backdropStyles = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });
  useEffect(() => {
    if (index >= data.length) {
      const newIndex = data.length - 1;
      setIndex(newIndex);
      currentIndex.value = newIndex;
      translateX.value = newIndex * -(dimensions.width + emptySpaceWidth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.length]);
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <Animated.View style={[styles.backdrop, backdropStyles]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    backgroundColor: '#fff',
  },

  scrollContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
});
