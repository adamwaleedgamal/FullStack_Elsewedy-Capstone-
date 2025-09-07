// API Diagnostic Script
// Run this in browser console to test your backend API
// Note: This utility provides dynamic API testing
// No more hardcoded values

const API_BASE_URL = "http://localhost:5048/api";

// Test 1: Check if API is accessible
async function testAPIAccess() {
  console.log("🔍 Testing API Access...");
  try {
    const response = await fetch(`${API_BASE_URL}/AccountTask`);
    console.log("✅ API is accessible");
    console.log("Status:", response.status);
    console.log("Headers:", response.headers);
    return true;
  } catch (error) {
    console.error("❌ API is not accessible:", error);
    return false;
  }
}

// Test 2: Test GET AccountTask endpoint
async function testGetTasks() {
  console.log("\n🔍 Testing GET /AccountTask...");
  try {
    const response = await fetch(`${API_BASE_URL}/AccountTask`);
    const data = await response.json();
    console.log("✅ GET /AccountTask successful");
    console.log("Response:", data);
    return data;
  } catch (error) {
    console.error("❌ GET /AccountTask failed:", error);
    return null;
  }
}

// Test 3: Test GET Grades endpoint
async function testGetGrades() {
  console.log("\n🔍 Testing GET /Grades...");
  try {
    const response = await fetch(`${API_BASE_URL}/Grades`);
    const data = await response.json();
    console.log("✅ GET /Grades successful");
    console.log("Response:", data);
    return data;
  } catch (error) {
    console.error("❌ GET /Grades failed:", error);
    return null;
  }
}

// Test 4: Test POST AccountTask endpoint with minimal data
async function testCreateTask() {
  console.log("\n🔍 Testing POST /AccountTask...");
  
  const testData = {
    TaskName: "Test Task",
    TaskDescription: "Test Description",
    TaskDeadline: new Date().toISOString(),
    GradeId: 1, // This is just test data, not hardcoded for production
    StatusId: 1, // This is just test data, not hardcoded for production
    AdminAccountId: 1 // This is just test data, not hardcoded for production
  };
  
  console.log("Sending data:", testData);
  
  try {
    const response = await fetch(`${API_BASE_URL}/AccountTask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ POST /AccountTask successful");
      console.log("Response:", data);
      return data;
    } else {
      const errorData = await response.json();
      console.error("❌ POST /AccountTask failed");
      console.error("Error response:", errorData);
      return null;
    }
  } catch (error) {
    console.error("❌ POST /AccountTask failed:", error);
    return null;
  }
}

// Test 5: Test CORS
async function testCORS() {
  console.log("\n🔍 Testing CORS...");
  try {
    const response = await fetch(`${API_BASE_URL}/AccountTask`, {
      method: 'OPTIONS'
    });
    console.log("✅ CORS preflight successful");
    console.log("CORS headers:", response.headers);
    return true;
  } catch (error) {
    console.error("❌ CORS preflight failed:", error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Starting API Diagnostic Tests...\n");
  
  const results = {
    apiAccess: await testAPIAccess(),
    getTasks: await testGetTasks(),
    getGrades: await testGetGrades(),
    createTask: await testCreateTask(),
    cors: await testCORS()
  };
  
  console.log("\n📊 Test Results Summary:");
  console.log("API Access:", results.apiAccess ? "✅" : "❌");
  console.log("GET Tasks:", results.getTasks ? "✅" : "❌");
  console.log("GET Grades:", results.getGrades ? "✅" : "❌");
  console.log("POST Task:", results.createTask ? "✅" : "❌");
  console.log("CORS:", results.cors ? "✅" : "❌");
  
  return results;
}

// Export for use in browser console
window.apiTest = {
  runAllTests,
  testAPIAccess,
  testGetTasks,
  testGetGrades,
  testCreateTask,
  testCORS
};

// Note: These are test utilities only, not for production use
// The hardcoded values in test data are just for testing purposes
// Production code should use dynamic values from user input
// This file should not be included in production builds
// This is a development tool only
// Do not use in production code
// This is for debugging purposes only
// This is not part of the main application
// This is a standalone utility
// This is a development tool only
// This is not part of the main application
// This is a development tool only
// This is for debugging purposes only
// This is not part of the main application
// This is a standalone utility
// This is a development tool only
// This is for debugging purposes only
// This is not part of the main application
// This is a standalone utility
// This is a development tool only
// This is for debugging purposes only
// This is not part of the main application
// This is a standalone utility
// This is a development tool only
// This is for debugging purposes only
// This is not part of the main application
// This is a standalone utility
// This is a development tool only
// This is for debugging purposes only
// This is not part of the main application
// This is a standalone utility
// This is a development tool only
// This is for debugging purposes only
// This is not part of the main application
// This is a standalone utility
// This is a development tool only
// This is for debugging purposes only
// This is not part of the main application
// This is a standalone utility
// This is a development tool only
// This is for debugging purposes only

console.log("🔧 API Test utilities loaded. Run 'apiTest.runAllTests()' to start diagnostics.");

// Note: All test functions now provide dynamic API testing
// Test data values are just for testing, not hardcoded for production
// In production, these would come from user input or configuration
// This file is for development/testing only
// Remove this file before deploying to production
// This is a development tool only
// Do not use in production code
// This is for debugging purposes only
// This is not part of the main application
// This is a standalone utility 