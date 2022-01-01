/* eslint-disable curly */
import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { StyleSheet, Platform } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedGestureHandler,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { EventsCallbacks } from './';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { useRefs } from './hooks/useRefs';
import { TapGestureHandler } from 'react-native-gesture-handler';
import { GestureEvent } from 'react-native-gesture-handler';
import { TapGestureHandlerEventPayload } from 'react-native-gesture-handler';
import { PinchGestureHandler } from 'react-native-gesture-handler';
import { PinchGestureHandlerEventPayload } from 'react-native-gesture-handler';
import { useVector } from 'react-native-redash';
import { withRubberBandClamp } from '../example/src/components/utils';
const isAndroid = Platform.OS === 'android';

type RenderItemInfo<T> = {
  index: number;
  item: T;
};

type ItemRef = { reset: (animated: boolean) => void };

export type RenderItem<T> = (
  imageInfo: RenderItemInfo<T>,
) => React.ReactElement | null;

type LightImageProps<T> = EventsCallbacks & {
  item: T;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  translateX: Animated.SharedValue<number>;
  currentIndex: Animated.SharedValue<number>;
  renderItem: RenderItem<T>;
  width: number;
  height: number;
  length: number;
  emptySpaceWidth: number;
  doubleTapInterval: number;
  doubleTapScale: number;
  maxScale: number;
  pinchEnabled: boolean;
  disableTransitionOnScaledImage: boolean;
  hideAdjacentImagesOnScaledImage: boolean;
  disableVerticalSwipe: boolean;
  disableSwipeUp?: boolean;
  loop: boolean;
  onScaleChange?: (scale: number) => void;
  onScaleChangeRange?: { start: number; end: number };

  setRef: (index: number, value: ItemRef) => void;
};
export const LightImageItem = <T extends any>({
  onTap,
  pinchEnabled,
  currentIndex,
  index,
  onScaleStart,
  translateX,
  width,
  height,
  maxScale,
  isFirst,
  isLast,
  renderItem,
  item,
}: LightImageProps<T>) => {
  const { pinch, tap, doubleTap, pan } = useRefs();
  const isActive = useDerivedValue(() => currentIndex.value === index);
  const panActive = useSharedValue(false);
  const pinchActive = useSharedValue(false);
  const offset = useVector(0, 0);
  const translation = useVector(0, 0);
  const scale = useSharedValue(1);
  const adjustedFocal = useVector(0, 0);
  const origin = useVector(0, 0);
  const layout = useVector(width, 0);

  const CENTER = {
    x: width / 2,
    y: height / 2,
  };
  const onPan = useAnimatedGestureHandler({
    onActive: event => {
      console.log(event);

      // translateX.value = event.translationX;
      // translateY.value = event.translationY;

      // scale.value = interpolate(
      //   translateY.value,
      //   [-200, 0, 200],
      //   [0.65, 1, 0.65],
      //   Extrapolate.CLAMP,
      // );

      // backdropOpacity.value = interpolate(
      //   translateY.value,
      //   [-100, 0, 100],
      //   [0, 1, 0],
      //   Extrapolate.CLAMP,
      // );
    },

    onEnd: (_event, _ctx) => {
      console.log('onEnd');

      // if (Math.abs(translateY.value) > 40) {
      //   targetX.value = translateX.value - targetX.value * -1;
      //   targetY.value = translateY.value - targetY.value * -1;
      //   translateX.value = 0;
      //   translateY.value = 0;
      //   animationProgress.value = withTiming(0, timingConfig, () => {
      //     imageOpacity.value = withTiming(
      //       1,
      //       {
      //         duration: 16,
      //       },
      //       () => {
      //         runOnJS(onClose)();
      //       },
      //     );
      //   });
      //   backdropOpacity.value = withTiming(0, timingConfig);
      // } else {
      //   backdropOpacity.value = withTiming(1, timingConfig);
      //   translateX.value = withTiming(0, timingConfig);
      //   translateY.value = withTiming(0, timingConfig);
      // }
      // scale.value = withTiming(1, timingConfig);
    },
  });
  const onStart = () => {
    'worklet';

    cancelAnimation(translateX);

    offset.x.value = offset.x.value + translation.x.value;
    offset.y.value = offset.y.value + translation.y.value;

    translation.x.value = 0;
    translation.y.value = 0;
  };

  const setAdjustedFocal = ({
    focalX,
    focalY,
  }: Record<'focalX' | 'focalY', number>) => {
    'worklet';

    adjustedFocal.x.value = focalX - (CENTER.x + offset.x.value);
    adjustedFocal.y.value = focalY - (CENTER.y + offset.y.value);
  };

  const resetValues = (animated = true) => {
    'worklet';

    scale.value = animated ? withTiming(1) : 1;
    offset.x.value = animated ? withTiming(0) : 0;
    offset.y.value = animated ? withTiming(0) : 0;
    translation.x.value = animated ? withTiming(0) : 0;
    translation.y.value = animated ? withTiming(0) : 0;
  };
  const gestureHandler = useAnimatedGestureHandler<
    GestureEvent<PinchGestureHandlerEventPayload>,
    {
      scaleOffset: number;
      androidPinchActivated: boolean;
    }
  >(
    {
      onStart: ({ focalX, focalY }, ctx) => {
        if (!pinchEnabled) return;
        if (!isActive.value) return;
        if (panActive.value && !isAndroid) return;

        pinchActive.value = true;

        if (onScaleStart) {
          runOnJS(onScaleStart)();
        }

        if (isAndroid) {
          ctx.androidPinchActivated = false;
        }

        onStart();

        ctx.scaleOffset = scale.value;

        setAdjustedFocal({ focalX, focalY });

        origin.x.value = adjustedFocal.x.value;
        origin.y.value = adjustedFocal.y.value;
      },
      onActive: ({ scale: s, focalX, focalY, numberOfPointers }, ctx) => {
        if (!pinchEnabled) return;
        if (!isActive.value) return;
        if (numberOfPointers !== 2 && !isAndroid) return;
        if (panActive.value && !isAndroid) return;

        if (!ctx.androidPinchActivated && isAndroid) {
          setAdjustedFocal({ focalX, focalY });

          origin.x.value = adjustedFocal.x.value;
          origin.y.value = adjustedFocal.y.value;

          ctx.androidPinchActivated = true;
        }

        const nextScale = withRubberBandClamp(
          s * ctx.scaleOffset,
          0.55,
          maxScale,
          [1, maxScale],
        );

        scale.value = nextScale;

        setAdjustedFocal({ focalX, focalY });

        translation.x.value =
          adjustedFocal.x.value +
          ((-1 * nextScale) / ctx.scaleOffset) * origin.x.value;
        translation.y.value =
          adjustedFocal.y.value +
          ((-1 * nextScale) / ctx.scaleOffset) * origin.y.value;
      },
      onFinish: (_, ctx) => {
        if (!pinchEnabled) return;
        if (!isActive.value) return;

        pinchActive.value = false;

        if (scale.value < 1) {
          resetValues();
        } else {
          const sc = Math.min(scale.value, maxScale);

          const newWidth = sc * layout.x.value;
          const newHeight = sc * layout.y.value;

          const nextTransX =
            scale.value > maxScale
              ? adjustedFocal.x.value +
                ((-1 * maxScale) / ctx.scaleOffset) * origin.x.value
              : translation.x.value;

          const nextTransY =
            scale.value > maxScale
              ? adjustedFocal.y.value +
                ((-1 * maxScale) / ctx.scaleOffset) * origin.y.value
              : translation.y.value;

          const diffX = nextTransX + offset.x.value - (newWidth - width) / 2;

          if (scale.value > maxScale) {
            scale.value = withTiming(maxScale);
          }

          if (newWidth <= width) {
            translation.x.value = withTiming(0);
          } else {
            let moved;
            if (diffX > 0) {
              translation.x.value = withTiming(nextTransX - diffX);
              moved = true;
            }

            if (newWidth + diffX < width) {
              translation.x.value = withTiming(
                nextTransX + width - (newWidth + diffX),
              );
              moved = true;
            }
            if (!moved) {
              translation.x.value = withTiming(nextTransX);
            }
          }

          const diffY = nextTransY + offset.y.value - (newHeight - height) / 2;

          if (newHeight <= height) {
            translation.y.value = withTiming(-offset.y.value);
          } else {
            let moved;
            if (diffY > 0) {
              translation.y.value = withTiming(nextTransY - diffY);
              moved = true;
            }

            if (newHeight + diffY < height) {
              translation.y.value = withTiming(
                nextTransY + height - (newHeight + diffY),
              );
              moved = true;
            }
            if (!moved) {
              translation.y.value = withTiming(nextTransY);
            }
          }
        }
      },
    },
    [layout.x, layout.y, index, isFirst, isLast, width, height],
  );
  const singleTapHandler = useAnimatedGestureHandler<
    GestureEvent<TapGestureHandlerEventPayload>
  >({
    onActive: () => {
      if (onTap) {
        runOnJS(onTap)();
      }
    },
  });
  const itemProps: RenderItemInfo<T> = {
    item,
    index,
  };

  return (
    <PanGestureHandler
      onGestureEvent={onPan}
      minDist={10}
      minPointers={1}
      maxPointers={1}>
      <Animated.View style={StyleSheet.absoluteFillObject}>
        <TapGestureHandler
          ref={doubleTap}
          onGestureEvent={singleTapHandler}
          waitFor={tap}
          maxDeltaX={10}
          maxDeltaY={10}>
          <Animated.View style={StyleSheet.absoluteFillObject}>
            <PinchGestureHandler
              ref={pinch}
              simultaneousHandlers={[pan]}
              onGestureEvent={gestureHandler}
              minPointers={2}>
              <Animated.View style={StyleSheet.absoluteFillObject}>
                <ScrollView bounces={false}>
                  <ScrollView bounces={false} horizontal>
                    {renderItem(itemProps)}
                  </ScrollView>
                </ScrollView>
              </Animated.View>
            </PinchGestureHandler>
          </Animated.View>
        </TapGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
};
