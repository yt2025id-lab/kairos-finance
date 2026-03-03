# Kairos Finance - Deposit Button Debug Guide

## Quick Checklist

### 1. **Wallet Connection**
- [ ] Open browser DevTools: **F12**
- [ ] Check Console for connection status
- [ ] Look for: `"● Wallet: 0x..."` in debug panel
- [ ] If disconnected, click **Login Button** in top-right

### 2. **Contract Configuration**
- [ ] Check `.env.local` has these variables:
  ```env
  NEXT_PUBLIC_VAULT_ADDRESS=0x5c4B8427fBF6F398C4F780711507E0AA2dEdc855
  NEXT_PUBLIC_CONTROLLER_ADDRESS=0x84A7C62dAa0DE17b0f01238443d7aBB942A00bfF
  NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
  ```
- [ ] Variables should NOT be empty or `0x0000...`

### 3. **USDC Balance**
- [ ] Check Console: Look for `"● USDC Balance: X.XX"`
- [ ] If "🔄 Loading...", wait 5 seconds
- [ ] If shows "0.00", claim from faucet:
  - Click **Claim 100 USDC** button (yellow)
  - Wait for confirmation

### 4. **Deposit Flow**
1. **Enter Amount** → Type in deposit amount (minimum 10 USDC)
2. **Hit Approve** (if first time) → Approve USDC spending
3. **Wait for Approval** → TX confirmation in wallet
4. **Hit Deposit** → Final deposit transaction
5. **Check Console** → Success/error logs

---

## Console Debugging

### Enable Console Logs
```bash
# Open DevTools: F12
# Click "Console" tab
# All transactions log with [Deposit], [Approve], [Withdraw] prefixes
```

### Expected Log Flow - Deposit

```
[Deposit] ═══════════════════════════════════════
[Deposit] Starting deposit flow...
[Deposit] ✅ Wallet connected: 0x...
[Deposit] ✅ Amount valid: 50 USDC
[Deposit] ✅ Amount meets minimum
[Deposit] ✅ USDC balance sufficient: 100.00
[Deposit] ✅ USDC already approved
[Deposit] ✅ Vault address valid: 0x5c4B...
[Deposit] 📤 Submitting deposit transaction...
[Deposit] Transaction args: {
  to: "0x5c4B...",
  functionName: "deposit",
  args: ["50000000", "0x..."]
}
[Deposit] ✅ Transaction submitted to wallet
[Deposit] ═══════════════════════════════════════
```

### Common Error Logs

**❌ Wallet Not Connected**
```
[Deposit] ❌ Wallet not connected
```
**Fix:** Click **Login Button** → Sign in with wallet

**❌ Insufficient Balance**
```
[Deposit] ❌ Insufficient USDC balance
  balance: "25.00"
  required: "50.00"
```
**Fix:** Claim from faucet or reduce amount

**❌ Not Approved**
```
[Deposit] ❌ USDC not approved yet. Click 'Approve USDC' first
```
**Fix:** Click **Approve USDC** button first, then deposit

**❌ Vault Address Invalid**
```
[Deposit] ❌ Vault address not configured
```
**Fix:** Check `.env.local` has `NEXT_PUBLIC_VAULT_ADDRESS`

---

## Network & RPC Issues

### Check Network
```javascript
// In DevTools Console, run:
console.log(window.location.href)  // Should be localhost:3000
```

### Verify Contract ABIs
The deposits uses these contract functions:
```solidity
// USDC (ERC20)
function approve(spender: address, amount: uint256) -> bool

// KairosVault  
function deposit(assets: uint256, receiver: address) -> uint256
```

### Test RPC Connection
```javascript
// In Console:
fetch('https://mainnet.base.org', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_blockNumber',
    params: []
  })
}).then(r => r.json()).then(console.log)
```

---

## Common Issues & Fixes

### Issue 1: Deposit Button Disabled (Grayed Out)

**Possible Causes:**
- [ ] Wallet not connected → Click Login
- [ ] USDC not approved → Click "Approve USDC"
- [ ] Amount = 0 → Enter deposit amount
- [ ] Vault address not set → Check .env.local

**Debug Steps:**
```javascript
// In Console, check:
console.log("VAULT_ADDRESS:", window.localStorage.getItem('vault'))  // May need to check actual env
console.log("Was amount entered?", document.querySelector('input[type="number"]')?.value)
```

---

### Issue 2: Click Deposit But Nothing Happens

**Check 4 Things:**

1. **Can the click reach handler?**
   ```
   Look for: [Deposit] Starting deposit flow...
   ```
   If NOT shown: Button click not firing
   - Try hard refresh: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+F5** (Windows)

2. **Is wallet connected?**
   ```
   Look for: [Deposit] ✅ Wallet connected: 0x...
   ```
   If NOT shown: Wallet is null
   - Click Login → reconnect

3. **Does wallet have USDC?**
   ```
   Look for: [Deposit] ✅ USDC balance sufficient: X.XX
   ```
   If says insufficient: Need more USDC
   - Click Faucet button

4. **Is USDC approved?**
   ```
   Look for: [Deposit] ✅ USDC already approved
   ```
   If says NOT approved:
   - Click "Approve USDC" first
   - Wait for approval TX to complete

---

### Issue 3: Approve Button Not Working

**Debug:**
1. Open Console (F12)
2. Click **Approve USDC** button
3. Look for: `[Approve] 📊 Details:`
4. Wait for wallet popup

**If no wallet popup:**
- Check browser blocklist (may be blocking popups)
- Try on Chrome instead of Safari
- Restart browser

---

### Issue 4: Transaction Stuck / Pending

**Check Etherscan (Block Explorer):**
1. Note TX hash from wallet notification
2. Go: https://basescan.org (Base Mainnet) or https://sepolia.basescan.org (Testnet)
3. Paste TX hash in search
4. Check:
   - Status: `Success`, `Failed`, or `Pending`
   - Gas used
   - Block number

**If Pending > 10 minutes:**
- Wallet gas price too low
- Retry with higher gas in wallet settings

---

## Environment Variables Checklist

### Required for Deposit:
```env
# .env.local

# ✅ Required: Your vault deployment
NEXT_PUBLIC_VAULT_ADDRESS=0x5c4B8427fBF6F398C4F780711507E0AA2dEdc855

# ✅ Required: Your controller deployment  
NEXT_PUBLIC_CONTROLLER_ADDRESS=0x84A7C62dAa0DE17b0f01238443d7aBB942A00bfF

# ✅ Required: Privy authentication app ID
NEXT_PUBLIC_PRIVY_APP_ID=cmlw0gf3w01l10cl10syruuzx

# ✅ Optional: Testnet faucet (only on Base Sepolia)
NEXT_PUBLIC_FAUCET_ADDRESS=0x4F6D082b3130745687dd200822280946125570F5

# ✅ Optional: Base RPC endpoints (usually auto-detected)
NEXT_PUBLIC_BASE_RPC=https://mainnet.base.org
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://sepolia.base.org
```

### Verify Env Setup:
```bash
cd frontend

# Check .env.local eists
cat .env.local | grep VAULT_ADDRESS

# Restart dev server after changing env
npm run dev
```

---

## Handler Code Reference

### handleDeposit() Validation Chain
```
1. ✓ Wallet connected?     → address !== undefined
2. ✓ Amount > 0?           → parsedAmount > 0n
3. ✓ Amount ≥ 10 USDC?     → parsedAmount >= MIN_DEPOSIT
4. ✓ Balance sufficient?    → usdcBalance >= parsedAmount
5. ✓ USDC approved?        → !needsApproval (allowance >= amount)
6. ✓ Vault configured?     → VAULT_ADDRESS !== 0x0000...
7. ✅ Submit to wallet     → writeContract() called
```

Every step logs to console with ✅ or ❌

---

## Testing Checklist (Local Dev)

### Test 1: Fresh Connection
```
1. npm run dev
2. Open http://localhost:3000/deposit
3. Check debug panel shows "● Wallet: ❌ Not Connected"
4. Click Login → Connect wallet
5. Check panel now shows wallet address
6. Treasury balance should show (may be 0)
```

### Test 2: Full Deposit Flow
```
1. Click "Claim 100 USDC" (if on testnet)
2. Wait for confirmation
3. Check USDC shows 100.00
4. Enter "50" in deposit field
5. Click "Approve USDC"
6. Confirm in wallet popup
7. Wait for approval TX
8. Click "Deposit 50 USDC"
9. Confirm in wallet popup
10. Check console for [Deposit] ✅ logs
11. Wait for TX confirmation
12. Vault Balance should show 50.00 USDC
```

### Test 3: Error Handling
```
✓ Try deposit with 0 amount → "Please enter amount > 0"
✓ Try with insufficient balance → "Insufficient balance. You have X USDC"
✓ Try without approval → "Please approve USDC spending first"
✓ Try with disconnected wallet → "Please connect your wallet first"
✓ Try with wrong network → Should show error in console
```

---

## Advanced Debugging

### Check Contract Interaction
```javascript
// In DevTools Console:

// 1. Check if writeContract is available
console.log('writeContract available?', Boolean(window.wagmi?.writeContract))

// 2. Check current connected chain
console.log('Connected chain:', window.wagmi?.chain)

// 3. Check allowance before deposit
console.log('Current allowance:', await fetchAllowance())
```

### View Raw Transaction
```javascript
// After clicking Deposit, get TX hash from wallet notification
const txHash = "0x..."  // From wallet

// Check on Basescan
// https://basescan.org/tx/{txHash}
```

### Inspect Component State
```javascript
// React DevTools (install Chrome extension)
// Look for <AppPage> component
// Check if these are updating:
//   - isDepositing: should be true during TX
//   - depositTxHash: should have value after submit
//   - allowance: should update after approve
```

---

## Still Not Working? Checklist

- [ ] Refresh browser (F5)
- [ ] Hard refresh (Cmd+Shift+R or Ctrl+Shift+F5)
- [ ] Clear cache: DevTools → Network → "Disable cache" → Hard refresh
- [ ] Check console for **any** error messages
- [ ] Verify wallet is on correct network (Base Mainnet or Base Sepolia)
- [ ] Try different wallet (WalletConnect, Coinbase Wallet, MetaMask)
- [ ] Check `.env.local` is NOT in `.gitignore`
- [ ] Verify contract addresses match your deployment
- [ ] Check web3 connection: `npm run dev` shows "Ready"

---

## Support Resources

**Kairos Finance Docs:**
- Frontend: [README.md](./README.md)
- Contracts: [contracts/README.md](../contracts/README.md)

**External Links:**
- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)
- [Base Documentation](https://docs.base.org)
- [Basescan Block Explorer](https://basescan.org)

---

## Production Deployment Notes

When deploying to **Vercel**:

1. Add environment variables in Vercel Dashboard:
   - NEXT_PUBLIC_VAULT_ADDRESS
   - NEXT_PUBLIC_CONTROLLER_ADDRESS
   - NEXT_PUBLIC_PRIVY_APP_ID

2. Debug panel (`{process.env.NODE_ENV === "development"}`) will be hidden in production

3. All console logs still available in production
   - Open DevTools in live site to see logs

4. No changes needed to deposit logic for production - it works unchanged

---

Generated: 3 March 2026
Last Updated: After Enhanced Deposit Handler Implementation
