import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ActiveImageType,
  LightImage,
  LightImageProperties,
  LightImageProps,
  LightImageGallery,
} from 'react-native-image-light-gallery';
import { RootParamList } from '../../App';

const image: LightImageProps[] = [
  {
    width: 0,
    height: 0,
    uri: 'https://picsum.photos/id/1/900/700',
  },
  {
    width: 0,
    height: 0,
    uri: 'https://picsum.photos/id/3/400/400',
  },
];
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
    <>
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
          <LightImageGallery
            data={image}
            onTap={onClose}
            renderItem={({ item }) => {
              return (
                <Image
                  source={{ uri: item.uri }}
                  style={[StyleSheet.absoluteFillObject]}
                  resizeMode="contain"
                />
              );
            }}
          />
        )}
      </View>
    </>
  );
};
