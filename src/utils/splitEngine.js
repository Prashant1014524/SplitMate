/**
 * Debt Simplification & Split Calculation Engine
 */

/**
 * Calculates net balance for every member in a group.
 * Positive balance = user is owed money by the group.
 * Negative balance = user owes money to the group.
 * 
 * @param {Array} members - Array of member objects [{id, name, email}]
 * @param {Array} expenses - Group expenses [{id, amount, payerId, splits: [{userId, amountOwed}]}]
 * @param {Array} settlements - Group settlements [{payerId, payeeId, amount}]
 * @returns {Object} Map of userId -> net balance number
 */
export function calculateNetBalances(members, expenses = [], settlements = []) {
  const balances = {};

  // Initialize all members with 0 balance
  members.forEach(m => {
    balances[m.id] = 0;
  });

  // Calculate from Expenses
  expenses.forEach(exp => {
    const amount = parseFloat(exp.amount) || 0;
    const payerId = exp.payerId;

    // Credit the payer
    if (balances[payerId] !== undefined) {
      balances[payerId] += amount;
    }

    // Debit the members who owe
    if (Array.isArray(exp.splits)) {
      exp.splits.forEach(split => {
        const userId = split.userId;
        const owed = parseFloat(split.amountOwed) || 0;
        if (balances[userId] !== undefined) {
          balances[userId] -= owed;
        }
      });
    }
  });

  // Apply Direct Settlements
  settlements.forEach(settlement => {
    const amount = parseFloat(settlement.amount) || 0;
    const payerId = settlement.payerId;
    const payeeId = settlement.payeeId;

    // Payer gave money to payee, so payer's balance increases (reduces debt)
    if (balances[payerId] !== undefined) {
      balances[payerId] += amount;
    }
    // Payee received money, so payee's balance decreases (receives what they were owed)
    if (balances[payeeId] !== undefined) {
      balances[payeeId] -= amount;
    }
  });

  // Round to 2 decimal places to prevent floating point inaccuracies
  Object.keys(balances).forEach(id => {
    balances[id] = Math.round(balances[id] * 100) / 100;
  });

  return balances;
}

/**
 * Minimizes total transaction settlements among members (Greedy Min-Cost Flow).
 * 
 * @param {Array} members 
 * @param {Array} expenses 
 * @param {Array} settlements 
 * @returns {Array} List of simplified transactions [{fromUser, toUser, amount}]
 */
export function calculateSimplifiedDebts(members, expenses = [], settlements = []) {
  const netBalances = calculateNetBalances(members, expenses, settlements);

  const debtors = [];
  const creditors = [];

  members.forEach(m => {
    const bal = netBalances[m.id] || 0;
    if (bal < -0.01) {
      debtors.push({ member: m, amount: Math.abs(bal) });
    } else if (bal > 0.01) {
      creditors.push({ member: m, amount: bal });
    }
  });

  // Sort debtors & creditors by amount descending
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const simplifiedTransactions = [];

  let i = 0; // debtor index
  let j = 0; // creditor index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const settlementAmount = Math.min(debtor.amount, creditor.amount);
    const roundedAmount = Math.round(settlementAmount * 100) / 100;

    if (roundedAmount > 0) {
      simplifiedTransactions.push({
        fromUser: debtor.member,
        toUser: creditor.member,
        amount: roundedAmount,
      });
    }

    debtor.amount -= settlementAmount;
    creditor.amount -= settlementAmount;

    if (debtor.amount <= 0.009) i++;
    if (creditor.amount <= 0.009) j++;
  }

  return simplifiedTransactions;
}
