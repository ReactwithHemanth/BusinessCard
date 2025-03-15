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
