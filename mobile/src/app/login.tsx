import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// Using 10.0.2.2 for Android Emulator to reach localhost. For iOS simulator, use localhost.
// Replace with your actual local IP if testing on physical device.
const API_URL = "http://10.0.2.2:4000/api"; 

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Error", "Please fill all fields");
    
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      await AsyncStorage.setItem("token", res.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(res.data.user));
      
      if (res.data.user.role === "STUDENT") {
        router.replace("/student");
      } else if (res.data.user.role === "TUTOR") {
        router.replace("/tutor");
      } else {
        Alert.alert("Notice", "Admin Dashboard is only available on the Web Application.");
        await AsyncStorage.clear();
      }
    } catch (err: any) {
      Alert.alert("Login Failed", err.response?.data?.error || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Log in to your account</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput 
            style={styles.input} 
            value={email} 
            onChangeText={setEmail} 
            autoCapitalize="none" 
            keyboardType="email-address" 
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput 
            style={styles.input} 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log In</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/register")} style={styles.linkContainer}>
          <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Register</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa", justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#fff", padding: 24, borderRadius: 16, elevation: 2, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
  title: { fontSize: 28, fontWeight: "bold", color: "#1f2937", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 24 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "bold", color: "#4b5563", marginBottom: 8, textTransform: "uppercase" },
  input: { backgroundColor: "#f3f4f6", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: "#1f2937" },
  button: { backgroundColor: "#F26522", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  linkContainer: { marginTop: 24, alignItems: "center" },
  linkText: { color: "#6b7280", fontSize: 14 },
  linkBold: { color: "#F26522", fontWeight: "bold" },
});
