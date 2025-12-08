/**
 * Test script to verify the new maturity calculation system
 */

// Test the complete workflow
async function testMaturityCalculationWorkflow() {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🧪 Testing Maturity Calculation Workflow');
  console.log('==========================================\n');
  
  // Test 1: Test the calculation API with a mock session
  console.log('1. Testing calculation API...');
  try {
    const response = await fetch(`${baseUrl}/api/assessments/calculate-maturity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        sessionId: 'test-session-id' 
      })
    });
    
    const result = await response.json();
    console.log('   Status:', response.status);
    console.log('   Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  console.log('\n2. Testing maturity results API...');
  try {
    const response = await fetch(`${baseUrl}/api/maturity-results?organizationId=test-org`);
    const result = await response.json();
    console.log('   Status:', response.status);
    console.log('   Response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('   Error:', error.message);
  }
  
  console.log('\n✅ Test completed');
}

// Only run if this file is executed directly
if (require.main === module) {
  testMaturityCalculationWorkflow();
}

module.exports = { testMaturityCalculationWorkflow };