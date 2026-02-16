// Comprehensive test scenarios for paid/unpaid leave calculation logic
// This tests the core business logic that drives the UI indicators

import { format, eachDayOfInterval, isWeekend, startOfMonth, endOfMonth } from 'date-fns';

// Copy the core calculation functions for testing
function calculateBusinessDays(startDate, endDate) {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  return days.filter(day => !isWeekend(day)).length;
}

function calculateMonthlyPaidLeaveUsage(userId, month, leaveRequests) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  
  return leaveRequests
    .filter(req => 
      req.userId === userId &&
      req.status === 'approved' &&
      (req.type === 'annual' || req.type === 'sick' || req.type === 'personal' || req.type === 'halfday') &&
      req.type !== 'unpaid' && req.type !== 'workfromhome'
    )
    .reduce((total, req) => {
      const reqStart = new Date(req.startDate);
      const reqEnd = new Date(req.endDate);
      
      // Clip the request dates to the month boundaries
      const clippedStart = new Date(Math.max(reqStart.getTime(), monthStart.getTime()));
      const clippedEnd = new Date(Math.min(reqEnd.getTime(), monthEnd.getTime()));
      
      if (clippedStart > clippedEnd) return total;
      
      const businessDays = calculateBusinessDays(clippedStart, clippedEnd);
      return total + (req.type === 'halfday' ? businessDays * 0.5 : businessDays);
    }, 0);
}

function wouldExceedPaidLeaveLimit(userId, startDate, endDate, leaveType, leaveRequests) {
  // Don't count unpaid or work-from-home requests
  if (leaveType === 'unpaid' || leaveType === 'workfromhome') {
    return { wouldExceed: false, willBePaid: true, totalRequestDays: 0, perMonthAnalysis: [] };
  }
  
  const monthStart = startOfMonth(startDate);
  const monthEnd = endOfMonth(endDate);
  
  const perMonthAnalysis = [];
  let currentMonth = new Date(monthStart);
  
  while (currentMonth <= monthEnd) {
    const monthStartDate = startOfMonth(currentMonth);
    const monthEndDate = endOfMonth(currentMonth);
    
    // Calculate current usage for this month
    const currentUsage = calculateMonthlyPaidLeaveUsage(userId, currentMonth, leaveRequests);
    
    // Calculate how many days of the new request fall in this month
    const requestStart = new Date(Math.max(startDate.getTime(), monthStartDate.getTime()));
    const requestEnd = new Date(Math.min(endDate.getTime(), monthEndDate.getTime()));
    
    let requestDaysInMonth = 0;
    if (requestStart <= requestEnd) {
      const businessDays = calculateBusinessDays(requestStart, requestEnd);
      requestDaysInMonth = leaveType === 'halfday' ? businessDays * 0.5 : businessDays;
    }
    
    const newTotal = currentUsage + requestDaysInMonth;
    const wouldExceed = newTotal > 1.5;
    
    perMonthAnalysis.push({
      month: format(currentMonth, 'MMMM yyyy'),
      currentUsage,
      requestDaysInMonth,
      newTotal,
      limit: 1.5,
      remaining: Math.max(0, 1.5 - currentUsage),
      wouldExceed
    });
    
    // Move to next month
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }
  
  const anyMonthExceeds = perMonthAnalysis.some(analysis => analysis.wouldExceed);
  const totalRequestDays = perMonthAnalysis.reduce((sum, analysis) => sum + analysis.requestDaysInMonth, 0);
  
  return {
    wouldExceed: anyMonthExceeds,
    willBePaid: !anyMonthExceeds,
    totalRequestDays,
    perMonthAnalysis
  };
}

// Test Scenarios
console.log("=== PAID/UNPAID LEAVE CALCULATION TESTS ===\n");

// Test Data: Existing approved leaves for user 1
const existingLeaves = [
  {
    id: 1,
    userId: 1,
    startDate: '2024-01-15',
    endDate: '2024-01-15',
    type: 'annual',
    status: 'approved'
  }
];

// Test 1: Basic within-limit request
console.log("Test 1: Basic within-limit request (1 day in January)");
const test1 = wouldExceedPaidLeaveLimit(
  1,
  new Date('2024-01-20'),
  new Date('2024-01-20'),
  'annual',
  existingLeaves
);
console.log(`Result: ${test1.willBePaid ? 'PAID' : 'UNPAID'} (would exceed: ${test1.wouldExceed})`);
console.log(`Total usage would be: ${test1.perMonthAnalysis[0]?.newTotal} days (limit: 1.5)\n`);

// Test 2: Exceed limit request (2 more days in January)
console.log("Test 2: Request that exceeds limit (2 days in January)");
const test2 = wouldExceedPaidLeaveLimit(
  1,
  new Date('2024-01-22'),
  new Date('2024-01-23'),
  'annual',
  existingLeaves
);
console.log(`Result: ${test2.willBePaid ? 'PAID' : 'UNPAID'} (would exceed: ${test2.wouldExceed})`);
console.log(`Total usage would be: ${test2.perMonthAnalysis[0]?.newTotal} days (limit: 1.5)\n`);

// Test 3: Cross-month request
console.log("Test 3: Cross-month request (Jan 30 - Feb 2)");
const test3 = wouldExceedPaidLeaveLimit(
  1,
  new Date('2024-01-30'),
  new Date('2024-02-02'),
  'annual',
  existingLeaves
);
console.log(`Result: ${test3.willBePaid ? 'PAID' : 'UNPAID'} (would exceed: ${test3.wouldExceed})`);
console.log(`January usage: ${test3.perMonthAnalysis[0]?.newTotal} days`);
console.log(`February usage: ${test3.perMonthAnalysis[1]?.newTotal} days\n`);

// Test 4: Weekend-only request (should count 0 days)
console.log("Test 4: Weekend-only request (Saturday-Sunday)");
const test4 = wouldExceedPaidLeaveLimit(
  1,
  new Date('2024-01-27'), // Saturday
  new Date('2024-01-28'), // Sunday
  'annual',
  []
);
console.log(`Result: ${test4.willBePaid ? 'PAID' : 'UNPAID'} (would exceed: ${test4.wouldExceed})`);
console.log(`Business days counted: ${test4.totalRequestDays}\n`);

// Test 5: Half-day request
console.log("Test 5: Half-day request");
const test5 = wouldExceedPaidLeaveLimit(
  1,
  new Date('2024-01-25'),
  new Date('2024-01-25'),
  'halfday',
  existingLeaves
);
console.log(`Result: ${test5.willBePaid ? 'PAID' : 'UNPAID'} (would exceed: ${test5.wouldExceed})`);
console.log(`Total usage would be: ${test5.perMonthAnalysis[0]?.newTotal} days (0.5 for halfday)\n`);

// Test 6: Exactly at limit (1.5 days total)
console.log("Test 6: Exactly at limit (0.5 day request with existing 1 day)");
const test6 = wouldExceedPaidLeaveLimit(
  1,
  new Date('2024-01-26'),
  new Date('2024-01-26'),
  'halfday',
  existingLeaves
);
console.log(`Result: ${test6.willBePaid ? 'PAID' : 'UNPAID'} (would exceed: ${test6.wouldExceed})`);
console.log(`Total usage would be: ${test6.perMonthAnalysis[0]?.newTotal} days (exactly at 1.5 limit)\n`);

// Test 7: Unpaid leave type (should always be paid=false)
console.log("Test 7: Unpaid leave type");
const test7 = wouldExceedPaidLeaveLimit(
  1,
  new Date('2024-01-29'),
  new Date('2024-01-31'),
  'unpaid',
  []
);
console.log(`Result: ${test7.willBePaid ? 'PAID' : 'UNPAID'} (would exceed: ${test7.wouldExceed})`);
console.log(`Should not count toward limit (unpaid type)\n`);

// Test 8: Work from home (should not count toward limit)
console.log("Test 8: Work from home request");
const test8 = wouldExceedPaidLeaveLimit(
  1,
  new Date('2024-01-29'),
  new Date('2024-01-31'),
  'workfromhome',
  []
);
console.log(`Result: ${test8.willBePaid ? 'PAID' : 'UNPAID'} (would exceed: ${test8.wouldExceed})`);
console.log(`Should not count toward limit (WFH type)\n`);

console.log("=== BUSINESS DAYS CALCULATION TESTS ===\n");

// Test business days calculation
console.log("Test 9: Business days calculation (Mon-Fri)");
const businessDays1 = calculateBusinessDays(
  new Date('2024-01-15'), // Monday
  new Date('2024-01-19')  // Friday
);
console.log(`Monday to Friday: ${businessDays1} business days (should be 5)\n`);

console.log("Test 10: Business days with weekend (Fri-Mon)");
const businessDays2 = calculateBusinessDays(
  new Date('2024-01-19'), // Friday
  new Date('2024-01-22')  // Monday
);
console.log(`Friday to Monday: ${businessDays2} business days (should be 2 - Fri and Mon only)\n`);

console.log("=== MONTHLY USAGE CALCULATION TESTS ===\n");

// Test monthly usage calculation
const testLeaves = [
  { userId: 1, startDate: '2024-01-01', endDate: '2024-01-03', type: 'annual', status: 'approved' },
  { userId: 1, startDate: '2024-01-15', endDate: '2024-01-15', type: 'halfday', status: 'approved' },
  { userId: 1, startDate: '2024-01-20', endDate: '2024-01-22', type: 'sick', status: 'pending' }, // Should not count
  { userId: 1, startDate: '2024-01-25', endDate: '2024-01-25', type: 'unpaid', status: 'approved' }, // Should not count
];

console.log("Test 11: Monthly usage calculation (January 2024)");
const monthlyUsage = calculateMonthlyPaidLeaveUsage(1, new Date('2024-01-15'), testLeaves);
console.log(`January usage: ${monthlyUsage} days`);
console.log("Should count: 3 days (Jan 1-3) + 0.5 days (halfday Jan 15) = 3.5 days");
console.log("Should NOT count: pending sick leave, unpaid leave\n");

console.log("=== ALL TESTS COMPLETED ===");