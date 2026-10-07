/**
 * Core Debt Simplification Engine (Greedy Bipartite Settlement Algorithm)
 * Time Complexity: O(N log N) where N = number of group members
 * Space Complexity: O(N)
 */

export function calculateNetBalances(members, expenses = [], settlements = []) {
  const balances = {};

  members.forEach(m => {
    balances[m.id] = 0;
  });

  // Calculate from Expenses
  expenses.forEach(exp => {
    const amount = parseFloat(exp.amount) || 0;
    const payerId = exp.payerId;

    if (balances[payerId] !== undefined) {
      balances[payerId] += amount;
    }

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

  // Calculate from direct Settlements
  settlements.forEach(s => {
    const amount = parseFloat(s.amount) || 0;
    if (balances[s.payerId] !== undefined) {
      balances[s.payerId] += amount;
    }
    if (balances[s.payeeId] !== undefined) {
      balances[s.payeeId] -= amount;
    }
  });

  // Round balances to 2 decimal places to avoid floating point drift
  Object.keys(balances).forEach(id => {
    balances[id] = Math.round(balances[id] * 100) / 100;
  });

  return balances;
}

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

  // Sort descending by amount
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const simplifiedTransactions = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const settlementAmount = Math.min(debtor.amount, creditor.amount);
    const rounded = Math.round(settlementAmount * 100) / 100;

    if (rounded > 0) {
      simplifiedTransactions.push({
        fromUser: debtor.member,
        toUser: creditor.member,
        amount: rounded
      });
    }

    debtor.amount -= settlementAmount;
    creditor.amount -= settlementAmount;

    if (debtor.amount <= 0.009) i++;
    if (creditor.amount <= 0.009) j++;
  }

  return simplifiedTransactions;
}
