import React, { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LightImageItem, RenderItem, ItemRef } from './';
import { useRef } from 'react';
import { useCallback } from 'react';
const timingConfig = {
  duration: 240,
  easing: Easing.bezier(0.33, 0.01, 0, 1),
};
export type EventsCallbacks = {
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

type LightImageGalleryProps<T> = EventsCallbacks & {
  ref?: GalleryReactRef;
  data: T[];
  renderItem: RenderItem<T>;
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
  keyExtractor,
  loop = false,
  doubleTapInterval = 500,
  doubleTapScale = 2,
  maxScale = 6,
  pinchEnabled = true,
  disableTransitionOnScaledImage = false,
  hideAdjacentImagesOnScaledImage = false,
  renderItem,
  disableVerticalSwipe = false,
  disableSwipeUp = false,
  onIndexChange,
  numToRender = 5,
  ...rest
}: LightImageGalleryProps<T>) => {
  const windowDimensions = useWindowDimensions();
  const dimensions = containerDimensions || windowDimensions;
  const [index, setIndex] = useState(initialIndex);
  const backdropOpacity = useSharedValue(0);
  const animationProgress = useSharedValue(0);
  const isLoop = loop && data?.length > 1;
  const refs = useRef<ItemRef[]>([]);

  const setRef = useCallback((i: number, value: ItemRef) => {
    refs.current[i] = value;
  }, []);
  const currentIndex = useSharedValue(initialIndex);
  const translateX = useSharedValue(
    initialIndex * -(dimensions.width + emptySpaceWidth),
  );
  const backdropStyles = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });
  const changeIndex = useCallback(
    newIndex => {
      onIndexChange?.(newIndex);
      setIndex(newIndex);
    },
    [onIndexChange, setIndex],
  );
  useAnimatedReaction(
    () => currentIndex.value,
    newIndex => runOnJS(changeIndex)(newIndex),
    [currentIndex, changeIndex],
  );
  useEffect(() => {
    translateX.value = index * -(dimensions.width + emptySpaceWidth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowDimensions]);

  useEffect(() => {
    if (index >= data.length) {
      const newIndex = data.length - 1;
      setIndex(newIndex);
      currentIndex.value = newIndex;
      translateX.value = newIndex * -(dimensions.width + emptySpaceWidth);
    }
    animationProgress.value = withTiming(1, timingConfig);
    backdropOpacity.value = withTiming(1, timingConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.length]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <Animated.View style={[styles.backdrop, backdropStyles]} />
      <Animated.View style={[styles.view, animatedStyle]}>
        {data.map((item, i) => {
          const isFirst = i === 0;
          const marginLeft = isFirst ? 0 : emptySpaceWidth;
          const zIndex = index === i ? 1 : 0;
          const outOfLoopRenderRange =
            !isLoop ||
            (Math.abs(i - index) < data.length - (numToRender - 1) / 2 &&
              Math.abs(i - index) > (numToRender - 1) / 2);
          const hidden =
            Math.abs(i - index) > (numToRender - 1) / 2 && outOfLoopRenderRange;

          return (
            <View
              key={keyExtractor ? keyExtractor(item, i) : i}
              style={[
                dimensions,
                {
                  marginLeft,
                  zIndex,
                },
              ]}>
              {hidden ? null : (
                <LightImageItem
                  {...{
                    translateX,
                    item,
                    currentIndex,
                    index: i,
                    renderItem,
                    isFirst,
                    isLast: i === data.length - 1,
                    length: data.length,
                    emptySpaceWidth,
                    loop: isLoop,
                    doubleTapInterval,
                    doubleTapScale,
                    maxScale,
                    pinchEnabled,
                    disableTransitionOnScaledImage,
                    hideAdjacentImagesOnScaledImage,
                    disableVerticalSwipe,
                    disableSwipeUp,
                    setRef,
                    ...rest,
                    ...dimensions,
                  }}
                />
              )}
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  view: {
    flex: 1,
    flexDirection: 'row',
  },
});
