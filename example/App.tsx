import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Example, Example2, Home, Photos } from "./src/screens";
export type RootParamList = {
  home: undefined;
  lightbox: undefined;
  example2: undefined;
  photos: {
    index: number;
    images: string[];
  };
};
const Stack = createNativeStackNavigator<RootParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="home" component={Home} />
          <Stack.Screen name="lightbox" component={Example} />
          <Stack.Screen name="example2" component={Example2} />
          <Stack.Screen
            name="photos"
            options={{
              headerShown: false,
              animation: "fade",
            }}
            component={Photos}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
