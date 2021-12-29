import React from 'react';
import { StyleSheet } from 'react-native';
import { Image } from 'react-native';

export type RenderItemInfo<T> = {
  index: number;
  item: T;
  setImageDimensions: (imageDimensions: ImgDimensions) => void;
};
export type ImgDimensions = {
  height: number;
  width: number;
};

export const defaultRenderImage = ({
  item,
  setImageDimensions,
}: RenderItemInfo<any>) => {
  return (
    <Image
      onLoad={e => {
        const { height: h, width: w } = e.nativeEvent.source;
        setImageDimensions({ height: h, width: w });
      }}
      source={{ uri: item }}
      resizeMode="contain"
      style={StyleSheet.absoluteFillObject}
    />
  );
};
