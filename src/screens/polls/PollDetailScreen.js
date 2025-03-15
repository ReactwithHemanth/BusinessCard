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
