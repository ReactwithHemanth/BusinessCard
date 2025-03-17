// src/screens/polls/CreatePollScreen.js
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {Button} from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '../../context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

export const CreatePollScreen = ({navigation}) => {
  const {user} = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [loading, setLoading] = useState(false);

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = index => {
    if (options.length <= 2) {
      Alert.alert('Error', 'A poll must have at least two options');
      return;
    }

    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const updateOption = (text, index) => {
    const newOptions = [...options];
    newOptions[index] = text;
    setOptions(newOptions);
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a poll title');
      return false;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a poll description');
      return false;
    }

    const validOptions = options.filter(option => option.trim().length > 0);
    if (validOptions.length < 2) {
      Alert.alert('Error', 'Please enter at least two poll options');
      return false;
    }

    return true;
  };

  const createPoll = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Get existing polls
      const existingPollsJson = await AsyncStorage.getItem('polls');
      const existingPolls = existingPollsJson
        ? JSON.parse(existingPollsJson)
        : [];

      // Create new poll
      const newPoll = {
        id: Date.now().toString(),
        title: title.trim(),
        description: description.trim(),
        options: options
          .filter(option => option.trim().length > 0)
          .map(option => ({
            id: Math.random().toString(36).substr(2, 9),
            text: option.trim(),
            votes: 0,
          })),
        createdBy: user.username,
        createdAt: new Date().toISOString(),
        responses: 0,
      };

      // Save the poll
      const updatedPolls = [newPoll, ...existingPolls];
      await AsyncStorage.setItem('polls', JSON.stringify(updatedPolls));

      Alert.alert('Success', 'Poll created successfully!', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.label}>Poll Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter poll title"
          maxLength={100}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter poll description"
          multiline
          numberOfLines={4}
          maxLength={500}
        />

        <Text style={styles.label}>Poll Options</Text>
        {options.map((option, index) => (
          <View key={index} style={styles.optionContainer}>
            <TextInput
              style={styles.optionInput}
              value={option}
              onChangeText={text => updateOption(text, index)}
              placeholder={`Option ${index + 1}`}
              maxLength={100}
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeOption(index)}>
              <Ionicons name="remove-circle" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addOptionButton} onPress={addOption}>
          <Ionicons name="add-circle" size={20} color="#4B0082" />
          <Text style={styles.addOptionText}>Add Another Option</Text>
        </TouchableOpacity>

        <Button
          title="Create Poll"
          buttonStyle={styles.createButton}
          onPress={createPoll}
          disabled={loading}
          loading={loading}
        />
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
