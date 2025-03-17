// App.js
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {LoginScreen} from './src/screens/auth/LoginScreen';
import {RegisterScreen} from './src/screens/auth/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import BusinessCardScannerScreen from './src/screens/BusinessCardScannerScreen';
import {CreatePollScreen} from './src/screens/polls/CreatePollScreen';
import {PollDetailScreen} from './src/screens/polls/PollDetailScreen';
import {PollStatsScreen} from './src/screens/polls/PollStatsScreen';
import {AuthProvider, useAuth} from './src/context/AuthContext';

// Auth Screens

// Main App Screens

// Auth Context

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Authentication stack
const AuthStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Login"
      component={LoginScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="Register"
      component={RegisterScreen}
      options={{headerShown: false}}
    />
  </Stack.Navigator>
);

// Main app stack
const HomeStack = () => (
  <Stack.Navigator screenOptions={{headerBackTitle: ''}}>
    <Stack.Screen
      name="Home"
      component={HomeScreen}
      options={({navigation}) => ({
        title: 'Interest Poll App',
        headerRight: () => (
          <Ionicons
            name="add-circle-outline"
            size={24}
            style={{marginRight: 15}}
            onPress={() => navigation.navigate('CreatePoll')}
          />
        ),
      })}
    />
    <Stack.Screen
      name="BusinessCardScanner"
      component={BusinessCardScannerScreen}
      options={{title: 'Scan Business Card'}}
    />
    <Stack.Screen
      name="CreatePoll"
      component={CreatePollScreen}
      options={{title: 'Create Poll'}}
    />
    <Stack.Screen
      name="PollDetail"
      component={PollDetailScreen}
      options={{title: 'Poll Details'}}
    />
    <Stack.Screen
      name="PollStats"
      component={PollStatsScreen}
      options={{title: 'Poll Statistics'}}
    />
  </Stack.Navigator>
);

// Navigation wrapper with auth state
const AppNavigator = () => {
  const {isLoggedIn} = useAuth();

  return (
    <NavigationContainer>
      {isLoggedIn ? <HomeStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

// Root component
const App = () => {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
};

export default App;
