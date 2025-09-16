import expenseController from './src/controllers/expenseController.js';

console.log('Testing expenseController import...');
console.log('expenseController:', typeof expenseController);
console.log('expenseController.getExpenses:', typeof expenseController.getExpenses);

if (typeof expenseController.getExpenses === 'function') {
  console.log('✅ ExpenseController imported successfully');
} else {
  console.log('❌ ExpenseController import failed');
  console.log('Available methods:', Object.getOwnPropertyNames(expenseController));
}