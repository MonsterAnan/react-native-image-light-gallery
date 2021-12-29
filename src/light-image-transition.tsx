import { useHeaderHeight } from '@react-navigation/elements';
import React, { RefObject, useEffect } from 'react';
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
import { LightImageProperties, LightImageProps } from './light-image';

const AnimatedImage = Animated.createAnimatedComponent(Image);

export type ActiveImageType = LightImageProperties & {
  // @ts-ignore: FIXME AnimatedImage type
  animatedRef: RefObject<ActiveImageType>;
  item: LightImageProps;
};
const timingConfig = {
  duration: 240,
  easing: Easing.bezier(0.33, 0.01, 0, 1),
};
export const ImageTransition = ({
  activeImage,
  onClose,
}: {
  activeImage: ActiveImageType;
  onClose: () => void;
}) => {
  const { item, x, y, width, height, imageOpacity } = activeImage;
  const { uri } = item;
  const { width: targetWidth, height: dimensionHeight } = useWindowDimensions();

  const scaleFactor = item.width / targetWidth;

  const targetHeight = item.height / scaleFactor;

  const headerHeight = useHeaderHeight();

  const animationProgress = useSharedValue(0);

  const backdropOpacity = useSharedValue(0);
  const scale = useSharedValue(1);

  const targetX = useSharedValue(0);
  const targetY = useSharedValue(
    (dimensionHeight - targetHeight) / 2 - headerHeight,
  );

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const onPan = useAnimatedGestureHandler({
    onActive: event => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;

      scale.value = interpolate(
        translateY.value,
        [-200, 0, 200],
        [0.65, 1, 0.65],
        Extrapolate.CLAMP,
      );

      backdropOpacity.value = interpolate(
        translateY.value,
        [-100, 0, 100],
        [0, 1, 0],
        Extrapolate.CLAMP,
      );
    },

    onEnd: (_event, _ctx) => {
      if (Math.abs(translateY.value) > 40) {
        targetX.value = translateX.value - targetX.value * -1;
        targetY.value = translateY.value - targetY.value * -1;

        translateX.value = 0;
        translateY.value = 0;

        animationProgress.value = withTiming(0, timingConfig, () => {
          imageOpacity.value = withTiming(
            1,
            {
              duration: 16,
            },
            () => {
              runOnJS(onClose)();
            },
          );
        });

        backdropOpacity.value = withTiming(0, timingConfig);
      } else {
        backdropOpacity.value = withTiming(1, timingConfig);
        translateX.value = withTiming(0, timingConfig);
        translateY.value = withTiming(0, timingConfig);
      }

      scale.value = withTiming(1, timingConfig);
    },
  });

  const imageStyles = useAnimatedStyle(() => {
    const interpolateProgress = (range: [number, number]) =>
      interpolate(animationProgress.value, [0, 1], range, Extrapolate.CLAMP);

    const top =
      translateY.value + interpolateProgress([y.value, targetY.value]);
    const left =
      translateX.value + interpolateProgress([x.value, targetX.value]);
    return {
      position: 'absolute',
      top,
      left,
      width: interpolateProgress([width.value, targetWidth]),
      height: interpolateProgress([height.value, targetHeight]),
      transform: [
        {
          scale: scale.value,
        },
      ],
    };
  });

  const backdropStyles = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
    };
  });

  useEffect(() => {
    requestAnimationFrame(() => {
      imageOpacity.value = 0;
    });

    animationProgress.value = withTiming(1, timingConfig);
    backdropOpacity.value = withTiming(1, timingConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <Animated.View style={[styles.backdrop, backdropStyles]} />
      <PanGestureHandler
        onGestureEvent={onPan}
        minDist={10}
        minPointers={1}
        maxPointers={1}>
        <Animated.View style={StyleSheet.absoluteFillObject}>
          <AnimatedImage source={{ uri }} style={imageStyles} />
        </Animated.View>
      </PanGestureHandler>
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
