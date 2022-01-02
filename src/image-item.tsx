/* eslint-disable curly */
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { EventsCallbacks } from './';
import {
  PanGestureHandler,
  PanGestureHandlerEventPayload,
  TapGestureHandler,
  GestureEvent,
  TapGestureHandlerEventPayload,
  PinchGestureHandler,
  PinchGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import { useRefs } from './hooks/useRefs';
import {
  withDecaySpring,
  withRubberBandClamp,
} from '../example/src/components/utils';
import { clamp, snapPoint, useVector } from 'react-native-redash';
const isAndroid = Platform.OS === 'android';
type Dimensions = {
  height: number;
  width: number;
};

type RenderItemInfo<T> = {
  index: number;
  item: T;
  setImageDimensions: (imageDimensions: Dimensions) => void;
};

export type ItemRef = { reset: (animated: boolean) => void };

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
  loop,
  emptySpaceWidth,
  length,
  onPanStart,
  disableVerticalSwipe,
  disableSwipeUp,
  onSwipeToClose,
  setRef,
  onScaleChange,
  onScaleChangeRange,
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
  const originalLayout = useVector(width, 0);
  const CENTER = {
    x: width / 2,
    y: height / 2,
  };

  const onStart = () => {
    'worklet';

    cancelAnimation(translateX);

    offset.x.value = offset.x.value + translation.x.value;
    offset.y.value = offset.y.value + translation.y.value;

    translation.x.value = 0;
    translation.y.value = 0;
  };
  const getIndexFromPosition = (position: number) => {
    'worklet';

    return Math.round(position / -(width + emptySpaceWidth));
  };
  const getEdgeX = () => {
    'worklet';
    const newWidth = scale.value * layout.x.value;

    const point = (newWidth - width) / 2;

    if (point < 0) {
      return [-0, 0];
    }

    return [-point, point];
  };
  const getEdgeY = () => {
    'worklet';

    const newHeight = scale.value * layout.y.value;

    const point = (newHeight - height) / 2;

    return [-point, point];
  };

  const getPosition = (i?: number) => {
    'worklet';

    return -(width + emptySpaceWidth) * (typeof i !== 'undefined' ? i : index);
  };
  const onPan = useAnimatedGestureHandler<
    GestureEvent<PanGestureHandlerEventPayload>,
    {
      scaleOffset: number;
      initialTranslateX: number;
      isVertical: boolean;
      shouldClose: boolean;
    }
  >({
    onStart: ({ velocityY, velocityX }, ctx) => {
      if (!isActive.value) return;
      if (pinchActive.value && !isAndroid) return;

      panActive.value = true;
      if (onPanStart) {
        runOnJS(onPanStart)();
      }

      onStart();
      ctx.isVertical = Math.abs(velocityY) > Math.abs(velocityX);
      ctx.initialTranslateX = translateX.value;
    },
    onActive: ({ translationX, translationY, velocityY }, ctx) => {
      if (!isActive.value) return;
      if (pinchActive.value && !isAndroid) return;
      if (disableVerticalSwipe && scale.value === 1 && ctx.isVertical) return;

      const x = getEdgeX();
      if (!ctx.isVertical || scale.value > 1) {
        const clampedX = clamp(
          translationX,
          x[0] - offset.x.value,
          x[1] - offset.x.value,
        );

        if (loop) {
          translateX.value = ctx.initialTranslateX + translationX - clampedX;
        } else {
          translateX.value = withRubberBandClamp(
            ctx.initialTranslateX + translationX - clampedX,
            0.55,
            width,
            [getPosition(length - 1), 0],
          );
        }
        translation.x.value = clampedX;
        const newHeight = scale.value * layout.y.value;

        const edgeY = getEdgeY();

        if (newHeight > height) {
          translation.y.value = withRubberBandClamp(
            translationY,
            0.55,
            newHeight,
            [edgeY[0] - offset.y.value, edgeY[1] - offset.y.value],
          );
        } else if (
          !(scale.value === 1 && translateX.value !== getPosition()) &&
          (!disableSwipeUp || translationY >= 0)
        ) {
          translation.y.value = translationY;
        }

        if (ctx.isVertical && newHeight <= height) {
          const destY = translationY + velocityY * 0.2;
          ctx.shouldClose = disableSwipeUp
            ? destY > 220
            : Math.abs(destY) > 220;
        }
      }
      // console.log(scaleOffset);
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

    onEnd: ({ velocityX, velocityY }, ctx) => {
      if (!isActive.value) return;

      panActive.value = false;

      const newHeight = scale.value * layout.y.value;

      const edgeX = getEdgeX();

      if (
        Math.abs(translateX.value - getPosition()) >= 0 &&
        edgeX.some(x => x === translation.x.value + offset.x.value)
      ) {
        let snapPoints = [index - 1, index, index + 1]
          .filter((_, y) => {
            if (loop) return true;

            if (y === 0) {
              return !isFirst;
            }
            if (y === 2) {
              return !isLast;
            }
            return true;
          })
          .map(i => getPosition(i));

        let snapTo = snapPoint(translateX.value, velocityX, snapPoints);

        const nextIndex = getIndexFromPosition(snapTo);

        if (currentIndex.value !== nextIndex) {
          if (loop) {
            if (nextIndex === length) {
              currentIndex.value = 0;
              translateX.value = translateX.value - getPosition(length);
              snapTo = 0;
            } else if (nextIndex === -1) {
              currentIndex.value = length - 1;
              translateX.value = translateX.value + getPosition(length);
              snapTo = getPosition(length - 1);
            } else {
              currentIndex.value = nextIndex;
            }
          } else {
            currentIndex.value = nextIndex;
          }
        }

        translateX.value = withSpring(snapTo, {
          damping: 800,
          mass: 1,
          stiffness: 250,
          restDisplacementThreshold: 0.02,
          restSpeedThreshold: 4,
        });
      } else {
        const newWidth = scale.value * layout.x.value;

        offset.x.value = withDecaySpring({
          velocity: velocityX,
          clamp: [
            -(newWidth - width) / 2 - translation.x.value,
            (newWidth - width) / 2 - translation.x.value,
          ],
        });
      }

      if (onSwipeToClose && ctx.shouldClose) {
        offset.y.value = withDecay({
          velocity: velocityY,
        });
        runOnJS(onSwipeToClose)();
        return;
      }

      if (newHeight > height) {
        offset.y.value = withDecaySpring({
          velocity: velocityY,
          clamp: [
            -(newHeight - height) / 2 - translation.y.value,
            (newHeight - height) / 2 - translation.y.value,
          ],
        });
      } else {
        const diffY =
          translation.y.value + offset.y.value - (newHeight - height) / 2;

        if (newHeight <= height && diffY !== height - diffY - newHeight) {
          const moveTo = diffY - (height - newHeight) / 2;

          translation.y.value = withTiming(translation.y.value - moveTo);
        }
      }
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
  const pinchGestureHandler = useAnimatedGestureHandler<
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
  const setImageDimensions: RenderItemInfo<T>['setImageDimensions'] = ({
    width: w,
    height: h,
  }) => {
    originalLayout.x.value = w;
    originalLayout.y.value = h;

    const portrait = width > height;

    if (portrait) {
      const imageHeight = Math.min((h * width) / w, height);
      const imageWidth = Math.min(w, width);
      layout.y.value = imageHeight;
      if (imageHeight === height) {
        layout.x.value = (w * height) / h;
      } else {
        layout.x.value = imageWidth;
      }
    } else {
      const imageWidth = Math.min((w * height) / h, width);
      const imageHeight = Math.min(h, height);

      layout.x.value = imageWidth;
      if (imageWidth === width) {
        layout.y.value = (h * width) / w;
      } else {
        layout.y.value = imageHeight;
      }
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    const isNextForLast =
      loop &&
      isFirst &&
      currentIndex.value === length - 1 &&
      translateX.value < getPosition(length - 1);
    const isPrevForFirst =
      loop &&
      isLast &&
      currentIndex.value === 0 &&
      translateX.value > getPosition(0);
    return {
      transform: [
        {
          translateX:
            offset.x.value +
            translation.x.value -
            (isNextForLast ? getPosition(length) : 0) +
            (isPrevForFirst ? getPosition(length) : 0),
        },
        { translateY: offset.y.value + translation.y.value },
        { scale: scale.value },
      ],
    };
  });
  useAnimatedReaction(
    () => {
      return scale.value;
    },
    scaleReaction => {
      if (!onScaleChange) {
        return;
      }

      if (!onScaleChangeRange) {
        runOnJS(onScaleChange)(scaleReaction);
        return;
      }

      if (
        scaleReaction > onScaleChangeRange.start &&
        scaleReaction < onScaleChangeRange.end
      ) {
        runOnJS(onScaleChange)(scaleReaction);
      }
    },
  );
  useAnimatedReaction(
    () => {
      return {
        i: currentIndex.value,
        _translateX: translateX.value,
        currentScale: scale.value,
      };
    },
    ({ i, _translateX, currentScale }) => {
      const translateIndex = _translateX / -(width + emptySpaceWidth);
      if (loop) {
        let diff = Math.abs((translateIndex % 1) - 0.5);
        if (diff > 0.5) {
          diff = 1 - diff;
        }
        if (diff > 0.48 && Math.abs(i) !== index) {
          resetValues(false);
          return;
        }
      }
      if (Math.abs(i - index) === 2 && currentScale > 1) {
        resetValues(false);
      }
    },
  );
  useEffect(() => {
    setRef(index, {
      reset: (animated: boolean) => resetValues(animated),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);
  useEffect(() => {
    setImageDimensions({
      width: originalLayout.x.value,
      height: originalLayout.y.value,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);
  const itemProps: RenderItemInfo<T> = {
    item,
    index,
    setImageDimensions,
  };

  return (
    <PanGestureHandler
      onGestureEvent={onPan}
      ref={pan}
      minDist={10}
      minPointers={1}
      maxPointers={1}>
      <Animated.View style={[{ width, height }]}>
        <PinchGestureHandler
          ref={pinch}
          simultaneousHandlers={[pan]}
          onGestureEvent={pinchGestureHandler}
          minPointers={2}>
          <Animated.View style={[{ width, height }]}>
            <TapGestureHandler
              ref={doubleTap}
              onGestureEvent={singleTapHandler}
              waitFor={tap}
              maxDeltaX={10}
              maxDeltaY={10}>
              <Animated.View style={[{ width, height }, animatedStyle]}>
                <TapGestureHandler ref={tap} numberOfTaps={2}>
                  <Animated.View style={{ width, height }}>
                    {renderItem(itemProps)}
                  </Animated.View>
                </TapGestureHandler>
              </Animated.View>
            </TapGestureHandler>
          </Animated.View>
        </PinchGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
};
