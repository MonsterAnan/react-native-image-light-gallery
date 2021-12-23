import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as React from "react";
import { useCallback } from "react";
import { Image, StyleSheet, View } from "react-native";
import { RootParamList } from "../../App";
import AwesomeGallery, { RenderItemInfo } from "../components";

const renderItem = ({
  index,
  item,
  setImageDimensions,
}: RenderItemInfo<{ uri: string }>) => {
  return (
    <Image
      source={{ uri: item.uri }}
      style={StyleSheet.absoluteFillObject}
      resizeMode={"contain"}
      onLoad={(e) => {
        const { width, height } = e.nativeEvent.source;
        setImageDimensions({ width, height });
      }}
    />
  );
};

export const Photos = () => {
  const { setParams, goBack, isFocused } =
    useNavigation<NativeStackNavigationProp<RootParamList>>();

  const { params } = useRoute<RouteProp<RootParamList, "photos">>();
  const onIndexChange = useCallback(
    (index) => {
      isFocused() && setParams({ index });
    },
    [setParams, isFocused]
  );

  return (
    <View style={styles.container}>
      <AwesomeGallery
        data={params.images.map((uri) => ({ uri }))}
        keyExtractor={(item) => item.uri}
        renderItem={renderItem}
        initialIndex={params.index}
        onIndexChange={onIndexChange}
        onSwipeToClose={goBack}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
