import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BarChart} from 'react-native-chart-kit';

const PollStatsScreen = ({route}) => {
  const {pollId} = route.params;
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPoll();
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
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load poll statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4B0082" />
      </View>
    );
  }

  // Prepare data for chart
  const chartData = {
    labels: poll.options.map(option => {
      // Truncate option text if it's too long
      return option.text.length > 10
        ? option.text.substring(0, 10) + '...'
        : option.text;
    }),
    datasets: [
      {
        data: poll.options.map(option => option.votes),
      },
    ],
  };

  // Calculate percentages
  const totalVotes = poll.options.reduce(
    (sum, option) => sum + option.votes,
    0,
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsContainer}>
        <Text style={styles.title}>{poll.title}</Text>
        <Text style={styles.subtitle}>Poll Statistics</Text>

        <View style={styles.chartContainer}>
          <BarChart
            data={chartData}
            width={Dimensions.get('window').width - 40}
            height={220}
            yAxisLabel=""
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(75, 0, 130, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              barPercentage: 0.8,
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>

        <Text style={styles.sectionTitle}>Detailed Results</Text>
        {poll.options.map(option => (
          <View key={option.id} style={styles.resultItem}>
            <Text style={styles.optionText}>{option.text}</Text>
            <View style={styles.resultData}>
              <Text style={styles.voteCount}>{option.votes} votes</Text>
              <Text style={styles.votePercentage}>
                {totalVotes > 0
                  ? ((option.votes / totalVotes) * 100).toFixed(1)
                  : 0}
                %
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${
                      totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0
                    }%`,
                  },
                ]}
              />
            </View>
          </View>
        ))}

        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>
            Total Responses: {poll.responses}
          </Text>
        </View>
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

export {PollStatsScreen};
