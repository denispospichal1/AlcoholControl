# 🍺 Privacy-Preserving Alcohol Control System

A privacy-focused dApp for age and drink-limit verification using blockchain technology with MetaMask integration.

---

## 📋 Project Structure

```
Alcohol_Com2/
├── frontend/
│   └── public/
│       └── index.html              # Main web interface
├── contracts/
│   ├── AlcoholControl.sol          # Smart contract (deployed on Sepolia)
│   └── FHECounter.sol              # Additional contract
├── test/
│   └── AlcoholControl.ts           # Contract tests
├── tasks/
│   ├── AlcoholControl.ts           # Hardhat tasks
│   ├── accounts.ts
│   ├── balance.ts
│   └── check-env.ts
├── deploy/
│   ├── deploy.ts
│   └── deployAlcoholControl.ts     # Contract deployment script
├── types/                          # TypeScript type definitions
├── artifacts/                      # Compiled contracts
├── deployments/                    # Deployment information
├── server.js                       # Backend server (Express.js)
├── hardhat.config.ts               # Hardhat configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies
└── README.md                       # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v14+)
- **npm** or **yarn**
- **MetaMask** browser extension

### Installation

1. **Navigate to project directory**

   ```bash
   cd Alcohol_Com2
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables** Create a `.env` file in the root directory:
   ```
   CONTRACT_ADDRESS=0xeD7d4189448608842a6421074Fb1920449a1916f
   INFURA_API_KEY=your_infura_key
   PRIVATE_KEY=your_private_key
   ```

---

## 🖥️ Running the Server

### Backend Server (Express.js)

The backend server provides API endpoints for eligibility checks and encryption/decryption operations.

**Start the server:**

```bash
node server.js
```

**Output:**

```
✅ Server running on http://localhost:3001
```

**API Endpoints:**

- **GET** `/` - Health check
- **POST** `/api/check-eligibility` - Verify age and drink limit
  ```json
  Request: { "age": 25, "drinks": 2 }
  Response: { "allowed": true }
  ```
- **GET** `/api/contract-address` - Get deployed contract address
- **POST** `/api/simple-encrypt` - Simulate encryption

### Frontend Web Interface

**Access the frontend:**

Open your browser and navigate to:

```
http://localhost:3001
```

Or directly visit the HTML file:

```
file:///<path>/Alcohol_Com2/frontend/public/index.html
```

---

## 🔄 Application Flow

### Step 1: Input Data

- Enter your age and number of drinks already consumed
- Click "Check Eligibility"

### Step 2: MetaMask Confirmation (Transaction)

- MetaMask prompts you to confirm a transaction
- Shows: **Network Fee** and **Speed** options
- Requires Sepolia ETH for gas fees

### Step 3: Encrypt

- Data is encrypted on the backend
- Simulates FHE encryption process

### Step 4: Verify

- Smart contract checks eligibility
- Rules:
  - Age must be ≥ 21
  - Drinks consumed must be < 3 (0, 1, or 2 allowed)
  - If 3 drinks already consumed → **NOT ALLOWED**

### Step 5: Decrypt & Confirm (MetaMask Signature)

- MetaMask prompts for signature
- Shows: **Primary Type** "Decrypt" and **Public Key**
- No gas fees required for signatures

### Final Result

- ✅ **ALLOWED**: You can get a drink
- ❌ **NOT ALLOWED**: Age or drink limit requirements not satisfied

---

## 🔌 Network Configuration

The application is configured to work on **Sepolia Testnet**:

- **Network**: Sepolia
- **Chain ID**: 11155111 (0xaa36a7)
- **Contract Address**: `0xeD7d4189448608842a6421074Fb1920449a1916f`

**MetaMask Setup:**

1. Open MetaMask
2. Click the network dropdown
3. Select "Sepolia Testnet"
4. App will auto-connect

---

## 💰 Getting Sepolia ETH (Testnet)

For first confirmation (transaction with gas fees), you need Sepolia ETH:

**Free Faucets:**

- [Sepoliafaucet.com](https://sepoliafaucet.com/)
- [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
- [Infura Faucet](https://www.infura.io/faucet/sepolia)

Request 0.5-1 Sepolia ETH to have enough for multiple transactions.

---

## 📊 Policy Rules

- **Legal Age**: 21 years old
- **Maximum Drinks (Strict)**: 3 drinks
  - 0 drinks consumed → ✅ Allowed
  - 1 drink consumed → ✅ Allowed
  - 2 drinks consumed → ✅ Allowed
  - 3 drinks consumed → ❌ NOT ALLOWED

---

## 🔐 Security & Privacy

- **Age & Drink Data**: Encrypted in browser before transmission
- **MetaMask Integration**: All confirmations require explicit user approval
- **No Data Logging**: Sensitive personal information never logged to blockchain
- **Transaction Hash**: Available for verification but contains no personal data
- **Two-Factor Confirmation**:
  1. Transaction signature (with gas fee)
  2. Decryption signature (no gas fee)

---

## 📝 Smart Contract Details

**AlcoholControl.sol**

- Deployed on Sepolia Testnet
- Address: `0xeD7d4189448608842a6421074Fb1920449a1916f`
- Verifies age and drink limits under encryption
- Returns encrypted boolean result

**Key Function:**

```solidity
function checkAlcoholAllowed(
  externalEuint8 inputAge,
  bytes calldata inputProofAge,
  externalEuint8 inputDrinksSoFar,
  bytes calldata inputProofDrinks
) external returns (ebool);
```

---

## 📱 Browser Compatibility

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Edge
- ✅ Brave
- ⚠️ Safari (MetaMask support limited)

**Required**: MetaMask extension installed

---

## 🛠️ Development Commands

**Compile contracts:**

```bash
npx hardhat compile
```

**Deploy to Sepolia:**

```bash
npx hardhat run deploy/deployAlcoholControl.ts --network sepolia
```

**Run tests:**

```bash
npx hardhat test
```

**Start local Hardhat node:**

```bash
npx hardhat node
```

---

## 📞 Support

For issues or questions:

1. Check MetaMask is connected to Sepolia Testnet
2. Verify you have Sepolia ETH for gas fees
3. Clear browser cache and refresh
4. Check browser console for error messages (F12)

---

## 📄 License

See [LICENSE](LICENSE) file for details.

---

## 🎉 Features

- ✅ Simple, intuitive user interface
- ✅ Two-step MetaMask confirmation (Transaction + Signature)
- ✅ Real-time transaction logs with color-coded messages
- ✅ Centered responsive layout
- ✅ Visual step progress indicator (5 steps)
- ✅ Color-coded results (green/red)
- ✅ Privacy-focused architecture
- ✅ Sepolia testnet ready
- ✅ Zero page scrolling - everything fits on screen
