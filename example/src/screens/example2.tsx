import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { RootParamList } from "../../App";
const images = Array.from({ length: 3 }, (_, index) => {
  return {
    uri: `https://picsum.photos/id/${index + 10}/400/400`,
    width: Dimensions.get("window").width,
    height: 400,
  };
});

export const Example2 = () => {
  const { navigate } =
    useNavigation<NativeStackNavigationProp<RootParamList>>();
  return (
    <ScrollView>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {images.map((item, i) => (
          <TouchableOpacity
            key={`${i}`}
            onPress={() => {
              navigate("photos", {
                images: images.map((item) => item.uri),
                index: i,
              });
            }}
          >
            <Image
              style={{
                width: 120,
                height: 120,
              }}
              source={{ uri: item.uri }}
            />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};
