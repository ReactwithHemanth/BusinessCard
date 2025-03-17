// src/screens/HomeScreen.js
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import {Button, Card} from 'react-native-elements';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '../context/AuthContext';

// Mock API functions (replace with actual API calls in production)
const fetchPolls = async () => {
  try {
    const storedPolls = await AsyncStorage.getItem('polls');
    return storedPolls ? JSON.parse(storedPolls) : [];
  } catch (error) {
    console.error('Error fetching polls:', error);
    return [];
  }
};

const HomeScreen = ({navigation}) => {
  const [polls, setPolls] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const {user, logout, isAdmin} = useAuth();

  const loadPolls = async () => {
    setRefreshing(true);
    try {
      const pollData = await fetchPolls();
      setPolls(pollData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load polls');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPolls();

    // Set up a listener for when the screen is focused
    const unsubscribe = navigation.addListener('focus', loadPolls);
    return unsubscribe;
  }, [navigation]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Logout', onPress: logout},
    ]);
  };

  const renderPollItem = ({item}) => (
    <TouchableOpacity
      style={styles.pollItem}
      onPress={() => navigation.navigate('PollDetail', {pollId: item.id})}>
      <View style={styles.pollContent}>
        <Text style={styles.pollTitle}>{item.title}</Text>
        <Text style={styles.pollDate}>
          Created: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.pollDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.pollStats}>
          <Text style={styles.pollStatsText}>
            Responses: {item.responses || 0}
          </Text>
        </View>
      </View>
      <Ionicons
        name="bar-chart-outline"
        size={24}
        color="#4B0082"
        style={styles.statsIcon}
        onPress={() => navigation.navigate('PollStats', {pollId: item.id})}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Welcome, {user?.username}!
          {isAdmin && <Text style={styles.adminBadge}> (Admin)</Text>}
        </Text>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadPolls} />
        }>
        {/* Business Card Scanner Card */}
        <Card containerStyle={styles.card}>
          <Card.Title>Business Card Scanner</Card.Title>
          <Card.Divider />
          <View style={styles.cardContent}>
            <Ionicons name="camera" size={50} color="#4B0082" />
            <Text style={styles.cardDescription}>
              Scan business cards to quickly collect contact information
            </Text>
            <Button
              title="Scan Business Card"
              buttonStyle={styles.cardButton}
              icon={
                <Ionicons
                  name="scan-outline"
                  size={20}
                  color="white"
                  style={{marginRight: 10}}
                />
              }
              onPress={() => navigation.navigate('BusinessCardScanner')}
            />
          </View>
        </Card>

        {/* Interest Polls Card */}
        <Card containerStyle={styles.card}>
          <Card.Title>Interest Polls</Card.Title>
          <Card.Divider />
          <View style={styles.cardContent}>
            <View style={styles.pollHeader}>
              <Ionicons name="stats-chart" size={30} color="#4B0082" />
              <Text style={styles.pollCount}>{polls.length} polls</Text>
              {isAdmin && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => navigation.navigate('CreatePoll')}>
                  <Ionicons name="add-circle" size={30} color="#4B0082" />
                </TouchableOpacity>
              )}
            </View>

            {polls.length > 0 ? (
              <FlatList
                data={polls}
                renderItem={renderPollItem}
                keyExtractor={item => item.id.toString()}
                style={styles.pollsList}
                scrollEnabled={false} // Prevent nested scrolling issues
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No polls created yet</Text>
                {isAdmin && (
                  <Button
                    title="Create Your First Poll"
                    buttonStyle={styles.cardButton}
                    onPress={() => navigation.navigate('CreatePoll')}
                  />
                )}
              </View>
            )}
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  adminBadge: {
    color: '#4B0082',
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 10,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    alignItems: 'center',
    padding: 10,
  },
  cardDescription: {
    textAlign: 'center',
    marginVertical: 15,
    color: '#666',
  },
  cardButton: {
    backgroundColor: '#4B0082',
    borderRadius: 8,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  pollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  pollCount: {
    fontSize: 16,
    color: '#666',
  },
  addButton: {
    padding: 5,
  },
  pollsList: {
    width: '100%',
    maxHeight: 400,
  },
  pollItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  pollContent: {
    flex: 1,
  },
  pollTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  pollDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  pollDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  pollStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pollStatsText: {
    fontSize: 12,
    color: '#4B0082',
    fontWeight: '500',
  },
  statsIcon: {
    marginLeft: 10,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    color: '#888',
    marginBottom: 15,
  },
});

export default HomeScreen;
