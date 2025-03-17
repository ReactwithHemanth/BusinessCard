import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Button} from 'react-native-elements';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useAuth} from '../../context/AuthContext';

export const PollDetailScreen = ({route, navigation}) => {
  const {pollId} = route.params;
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const {user} = useAuth();

  useEffect(() => {
    fetchPoll();
    checkIfVoted();
  }, [pollId]);

  const fetchPoll = async () => {
    try {
      const pollsJson = await AsyncStorage.getItem('polls');
      const polls = pollsJson ? JSON.parse(pollsJson) : [];
      const foundPoll = polls.find(p => p.id === pollId);

      if (foundPoll) {
        setPoll(foundPoll);
      } else {
        Alert.alert('Error', 'Poll not found');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load poll details');
    } finally {
      setLoading(false);
    }
  };

  const checkIfVoted = async () => {
    try {
      const votedPollsJson = await AsyncStorage.getItem(
        `user_${user.username}_votes`,
      );
      const votedPolls = votedPollsJson ? JSON.parse(votedPollsJson) : [];
      setHasVoted(votedPolls.includes(pollId));
    } catch (error) {
      console.error('Error checking voted status:', error);
    }
  };

  const handleVote = async () => {
    if (!selectedOption) {
      Alert.alert('Error', 'Please select an option');
      return;
    }

    setSubmitting(true);
    try {
      // Get all polls
      const pollsJson = await AsyncStorage.getItem('polls');
      const polls = pollsJson ? JSON.parse(pollsJson) : [];

      // Find and update the poll
      const updatedPolls = polls.map(p => {
        if (p.id === pollId) {
          // Update the vote count for the selected option
          const updatedOptions = p.options.map(opt => {
            if (opt.id === selectedOption) {
              return {...opt, votes: opt.votes + 1};
            }
            return opt;
          });

          return {
            ...p,
            options: updatedOptions,
            responses: p.responses + 1,
          };
        }
        return p;
      });

      // Save updated polls
      await AsyncStorage.setItem('polls', JSON.stringify(updatedPolls));

      // Save user's vote
      const votedPollsJson = await AsyncStorage.getItem(
        `user_${user.username}_votes`,
      );
      const votedPolls = votedPollsJson ? JSON.parse(votedPollsJson) : [];
      votedPolls.push(pollId);
      await AsyncStorage.setItem(
        `user_${user.username}_votes`,
        JSON.stringify(votedPolls),
      );

      // Update local state
      setHasVoted(true);
      const updatedPoll = updatedPolls.find(p => p.id === pollId);
      setPoll(updatedPoll);

      Alert.alert('Success', 'Your vote has been recorded');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit your vote');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this poll? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get all polls
              const pollsJson = await AsyncStorage.getItem('polls');
              const polls = pollsJson ? JSON.parse(pollsJson) : [];

              // Filter out the deleted poll
              const updatedPolls = polls.filter(p => p.id !== pollId);

              // Save updated polls
              await AsyncStorage.setItem('polls', JSON.stringify(updatedPolls));

              Alert.alert('Success', 'Poll deleted successfully', [
                {text: 'OK', onPress: () => navigation.goBack()},
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete poll');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4B0082" />
      </View>
    );
  }

  const isCreator = poll.createdBy === user.username;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.pollContainer}>
        <Text style={styles.title}>{poll.title}</Text>
        <Text style={styles.description}>{poll.description}</Text>

        <View style={styles.metadata}>
          <Text style={styles.metaText}>Created by: {poll.createdBy}</Text>
          <Text style={styles.metaText}>
            Date: {new Date(poll.createdAt).toLocaleDateString()}
          </Text>
          <Text style={styles.metaText}>Total responses: {poll.responses}</Text>
        </View>

        <Text style={styles.sectionTitle}>Options</Text>

        {poll.options.map(option => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionItem,
              selectedOption === option.id && styles.selectedOption,
              hasVoted && styles.disabledOption,
            ]}
            onPress={() => {
              if (!hasVoted) {
                setSelectedOption(option.id);
              }
            }}
            disabled={hasVoted}>
            <Text style={styles.optionText}>{option.text}</Text>
            {hasVoted && (
              <View style={styles.voteCount}>
                <Text style={styles.voteCountText}>{option.votes} votes</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {!hasVoted && (
          <Button
            title="Submit Vote"
            buttonStyle={styles.voteButton}
            onPress={handleVote}
            disabled={submitting || !selectedOption}
            loading={submitting}
          />
        )}

        {hasVoted && (
          <Button
            title="View Poll Results"
            buttonStyle={styles.resultsButton}
            icon={
              <Ionicons
                name="bar-chart-outline"
                size={20}
                color="white"
                style={{marginRight: 10}}
              />
            }
            onPress={() => navigation.navigate('PollStats', {pollId})}
          />
        )}

        {isCreator && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
            <Text style={styles.deleteText}>Delete Poll</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  removeButton: {
    padding: 10,
    marginLeft: 10,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
  },
  addOptionText: {
    color: '#4B0082',
    marginLeft: 8,
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: '#4B0082',
    borderRadius: 8,
    paddingVertical: 15,
    marginTop: 20,
  },
  pollContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  metadata: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  metaText: {
    color: '#666',
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 15,
  },
  optionItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedOption: {
    borderColor: '#4B0082',
    borderWidth: 2,
    backgroundColor: 'rgba(75, 0, 130, 0.05)',
  },
  disabledOption: {
    opacity: 0.8,
  },
  optionText: {
    fontSize: 16,
  },
  voteCount: {
    marginTop: 8,
  },
  voteCountText: {
    color: '#4B0082',
    fontWeight: '500',
  },
  voteButton: {
    backgroundColor: '#4B0082',
    borderRadius: 8,
    paddingVertical: 15,
    marginTop: 20,
  },
  resultsButton: {
    backgroundColor: '#4B0082',
    borderRadius: 8,
    paddingVertical: 15,
    marginTop: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    padding: 15,
  },
  deleteText: {
    color: '#FF6B6B',
    marginLeft: 8,
    fontWeight: '500',
  },
  statsContainer: {
    padding: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultItem: {
    marginBottom: 15,
  },
  resultData: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4B0082',
  },
  votePercentage: {
    fontWeight: 'bold',
  },
  totalContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
