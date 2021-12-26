import { useHeaderHeight } from '@react-navigation/elements';
import React, { RefObject } from 'react';
import { Image, ViewStyle } from 'react-native';
import {
  TapGestureHandler,
  TapGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  measure,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

const AnimatedImage = Animated.createAnimatedComponent(Image);

export type LightImageProperties = {
  x: Animated.SharedValue<number>;
  y: Animated.SharedValue<number>;
  width: Animated.SharedValue<number>;
  height: Animated.SharedValue<number>;
  imageOpacity: Animated.SharedValue<number>;
};

export type onLightImagePressFn = <T>(
  animatedRef: RefObject<T>,
  item: LightImageProps,
  svs: LightImageProperties,
) => void;

export type LightImageProps = {
  uri: string;
  width: number;
  height: number;
};
export type LightImageItemProps = {
  item: LightImageProps;
  onPress: onLightImagePressFn;
  imgWidth: number;
  imgHeight: number;
  containerStyle?: ViewStyle;
};

export const LightImage = ({
  item,
  onPress,
  imgWidth,
  imgHeight,
  containerStyle,
}: LightImageItemProps) => {
  const ref = useAnimatedRef<Animated.Image>();
  const opacity = useSharedValue(1);
  const headerHeight = useHeaderHeight();
  const styles = useAnimatedStyle(() => {
    return {
      width: imgWidth,
      height: imgHeight,
      opacity: opacity.value,
    };
  });

  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const x = useSharedValue(0);
  const y = useSharedValue(0);

  const handlePress = () => {
    onPress(ref, item, { imageOpacity: opacity, width, height, x, y });
  };

  const handler = useAnimatedGestureHandler<TapGestureHandlerGestureEvent>({
    onFinish: (_evt, _ctx, isCanceledOrFailed) => {
      if (isCanceledOrFailed) {
        return;
      }
      const measurements = measure(ref);
      width.value = measurements.width;
      height.value = measurements.height;
      x.value = measurements.pageX;
      y.value = measurements.pageY - headerHeight;

      runOnJS(handlePress)();
    },
  });

  return (
    <TapGestureHandler onGestureEvent={handler}>
      <Animated.View style={containerStyle}>
        <AnimatedImage ref={ref} source={{ uri: item.uri }} style={styles} />
      </Animated.View>
    </TapGestureHandler>
  );
};
