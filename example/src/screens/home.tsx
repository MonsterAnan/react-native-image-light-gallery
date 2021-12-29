import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ActiveImageType,
  ImageTransition,
  LightImage,
  LightImageProperties,
  LightImageProps,
} from 'react-native-image-light-gallery';
import { RootParamList } from '../../App';
export const Home = () => {
  const navigate = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const [activeImage, setActiveImage] = useState<ActiveImageType | null>(null);
  const onPress = (
    // @ts-ignore: FIXME AnimatedImage type
    // eslint-disable-next-line no-undef
    animatedRef: RefObject<AnimatedImage>,
    item: LightImageProps,
    svs: LightImageProperties,
  ) => {
    setActiveImage({
      animatedRef,
      item,
      ...svs,
    });
  };
  const onClose = () => {
    setActiveImage(null);
  };
  return (
    <View style={{ flex: 1, backgroundColor: '#e1e1e1' }}>
      <ScrollView style={{ padding: 20 }}>
        <StatusBar barStyle={'dark-content'} />
        <TouchableOpacity
          style={{ padding: 20 }}
          onPress={() => navigate.navigate('lightbox')}>
          <Text>Example1</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ padding: 20 }}
          onPress={() => navigate.navigate('example2')}>
          <Text>Example2</Text>
        </TouchableOpacity>
        <LightImage
          onPress={onPress}
          targetImgInfo={{
            width: 120,
            height: 120,
            uri: 'https://picsum.photos/id/1/400/400',
          }}
          imgWidth={120}
          imgHeight={120}
        />
      </ScrollView>
      {activeImage && (
        <ImageTransition onClose={onClose} activeImage={activeImage} />
      )}
    </View>
  );
};
