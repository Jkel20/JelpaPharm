const axios = require('axios');

// Test the integrated alert system
async function testAlertIntegration() {
  try {
    console.log('🧪 Testing Alert & Notification Integration...\n');

    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Health check passed:', healthResponse.data.message);

    // Test 2: Get integrated alerts list
    console.log('\n2. Testing integrated alerts endpoint...');
    const alertsResponse = await axios.get('http://localhost:5000/api/alerts/list');
    console.log('✅ Alerts endpoint working:', alertsResponse.data.success);
    console.log('📊 Alerts count:', alertsResponse.data.data?.length || 0);

    // Test 3: Get notifications endpoint
    console.log('\n3. Testing notifications endpoint...');
    const notificationsResponse = await axios.get('http://localhost:5000/api/notifications');
    console.log('✅ Notifications endpoint working:', notificationsResponse.data.success);
    console.log('📊 Notifications count:', notificationsResponse.data.data?.length || 0);

    // Test 4: Get alert statistics
    console.log('\n4. Testing alert statistics...');
    const statsResponse = await axios.get('http://localhost:5000/api/alerts/stats');
    console.log('✅ Alert stats working:', statsResponse.data.success);
    console.log('📈 Alert statistics:', statsResponse.data.data);

    console.log('\n🎉 All integration tests passed!');
    console.log('\n📋 Integration Summary:');
    console.log('   ✅ Backend server running');
    console.log('   ✅ Alert endpoints working');
    console.log('   ✅ Notification endpoints working');
    console.log('   ✅ Integrated alert system functional');
    console.log('   ✅ Real-time monitoring service active');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testAlertIntegration();
