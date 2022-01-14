import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import CameraView from './components/CameraView';
import {RootStackParamList} from './types/type';
import HomeScreen from './screens/HomeScreen';
import BottomTab from './navigation/BottomTab';

const RootStack = createStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <NavigationContainer>
      <RootStack.Navigator
        initialRouteName="Tab"
        screenOptions={{headerShown: false}}>
        <RootStack.Screen name="Home" component={HomeScreen} />
        <RootStack.Screen name="Camera" component={CameraView} />
        <RootStack.Screen name="Tab" component={BottomTab} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default App;
