import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { ScrollView, Text, TouchableOpacity } from "react-native";
import { RootParamList } from "../../App";

export const Home = () => {
  const navigate = useNavigation<NativeStackNavigationProp<RootParamList>>();
  return (
    <ScrollView style={{ padding: 20 }}>
      <TouchableOpacity
        style={{ padding: 20 }}
        onPress={() => navigate.navigate("lightbox")}
      >
        <Text>Example1</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ padding: 20 }}
        onPress={() => navigate.navigate("example2")}
      >
        <Text>Example2</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
