const axios = require('axios');

const baseURL = 'http://localhost:5000/api';

async function testAPI() {
  try {
    console.log('Testing API...');
    
    // Test health check
    const health = await axios.get(`${baseURL}/health`);
    console.log('✅ Health check:', health.data);
    
    // Test categories
    const categories = await axios.get(`${baseURL}/categories`);
    console.log('✅ Categories:', categories.data.data.length, 'categories found');
    
    // Test creating an expense
    const newExpense = await axios.post(`${baseURL}/expenses`, {
      category: 'Food',
      amount: 15.99,
      note: 'Lunch at restaurant'
    });
    console.log('✅ Created expense:', newExpense.data);
    
    // Test getting expenses
    const expenses = await axios.get(`${baseURL}/expenses`);
    console.log('✅ Expenses:', expenses.data.data.length, 'expenses found');
    
    console.log('\n🎉 All API tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAPI();
