const express = require("express");
const cors = require("cors");
const { exec, spawn } = require("child_process");
const path = require("path");
require("dotenv").config();

// Keep hardhat process alive to reduce startup time
let hardhatProcess = null;
let hardhatReady = false;

// Start a persistent hardhat REPL for faster commands
function startHardhatProcess() {
  console.log("🚀 Starting persistent Hardhat process...");
  // We'll use regular exec for now but could optimize with a long-running process
  hardhatReady = true;
  console.log("✅ Hardhat process ready");
}

const app = express();
app.use(cors());
app.use(express.json());

// API routes MUST come before static file serving
// Health endpoint
app.get("/health", (req, res) => {
  res.send("ZAMA FHEVM server is running");
});

// Get contract address from environment
app.get("/api/contract-address", (req, res) => {
  const contractAddress = process.env.CONTRACT_ADDRESS || process.env.ALCOHOL_CONTROL_ADDRESS;
  if (!contractAddress) {
    return res.status(500).json({ error: "Contract address not configured" });
  }
  res.json({ contractAddress });
});

// Check eligibility endpoint - DEMO MODE (simulated FHE verification)
app.post("/api/check-eligibility", (req, res) => {
  try {
    const { age, drinks } = req.body;

    console.log(
      `[Check Eligibility] Received: age=${age}, drinks=${drinks}, typeof age=${typeof age}, typeof drinks=${typeof drinks}`,
    );

    // Validation - be more lenient with types
    const ageNum = parseInt(age);
    const drinksNum = parseInt(drinks);

    if (isNaN(ageNum) || ageNum < 0 || ageNum > 255) {
      console.error(`[Check Eligibility] Invalid age: ${age}`);
      return res.status(400).json({ error: `Invalid age (0-255): ${age}` });
    }

    if (isNaN(drinksNum) || drinksNum < 0 || drinksNum > 255) {
      console.error(`[Check Eligibility] Invalid drinks: ${drinks}`);
      return res.status(400).json({ error: `Invalid drinks (0-255): ${drinks}` });
    }

    console.log(`[Check Eligibility] Parsed: age=${ageNum}, drinks=${drinksNum}`);

    // Policy: Legal age is 21+, max drinks is 3
    const LEGAL_AGE = 21;
    const MAX_DRINKS = 3;

    // In production: This would be done on encrypted data by the smart contract
    // For demo: We simulate the result
    // Business rule: If already consumed drinks is 3, it should NOT be allowed.
    // So allow only when drinks already consumed is strictly less than MAX_DRINKS.
    const allowed = ageNum >= LEGAL_AGE && drinksNum < MAX_DRINKS;

    console.log(
      `[Check Eligibility] Result: ${allowed ? "ALLOWED" : "NOT ALLOWED"} (Age: ${ageNum} >= ${LEGAL_AGE}? Drinks: ${drinksNum} <= ${MAX_DRINKS}?)`,
    );

    res.json({
      age: ageNum,
      drinks: drinksNum,
      allowed,
      reason: allowed ? "Age requirements met and drink limit OK" : "Age requirements or drink limit not met",
      policy: { LEGAL_AGE, MAX_DRINKS },
    });
  } catch (error) {
    console.error(`[Check Eligibility] Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Check alcohol eligibility endpoint
app.post("/api/check-alcohol", (req, res) => {
  const { age, drinks, userAccount } = req.body;

  // Validation
  if (!Number.isInteger(age) || age < 0 || age > 255) {
    return res.status(400).json({ error: "Invalid age (0-255)" });
  }

  if (!Number.isInteger(drinks) || drinks < 0 || drinks > 255) {
    return res.status(400).json({ error: "Invalid drinks (0-255)" });
  }

  console.log(`[Check Alcohol] Age=${age}, Drinks=${drinks}, UserAccount=${userAccount}`);

  const command = `npx hardhat --network localhost task:check-alcohol --age ${age} --drinks ${drinks}`;

  // Execute the command
  exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      // Don't return error for stderr, as hardhat may output some info there
    }

    // Parse the output to extract the result
    const output = stdout + stderr;

    // Extract transaction hash from output
    const txHashMatch = output.match(/tx:(0x[a-fA-F0-9]+)/);
    const txHash = txHashMatch ? txHashMatch[1] : null;

    const allowed = output.includes("✅ ALLOWED");
    const notAllowed = output.includes("❌ NOT ALLOWED");

    console.log(`[Check Alcohol Result] Allowed=${allowed}, TxHash=${txHash}`);

    res.json({
      age,
      drinks,
      allowed,
      notAllowed,
      txHash,
      output: output,
    });
  });
});

// Encrypt inputs endpoint - uses hardhat task
app.post("/api/encrypt-inputs", (req, res) => {
  const { age, drinks, contractAddress } = req.body;

  if (!Number.isInteger(age) || age < 0 || age > 255) {
    return res.status(400).json({ error: "Invalid age (0-255)" });
  }

  if (!Number.isInteger(drinks) || drinks < 0 || drinks > 255) {
    return res.status(400).json({ error: "Invalid drinks (0-255)" });
  }

  if (!contractAddress) {
    return res.status(400).json({ error: "Contract address required" });
  }

  console.log(`[Encrypt] Age=${age}, Drinks=${drinks}, Contract=${contractAddress}`);
  const startTime = Date.now();

  const command = `npx hardhat --network sepolia task:encrypt-inputs --age ${age} --drinks ${drinks} --address ${contractAddress}`;

  exec(command, { cwd: __dirname, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`[Encrypt] ❌ Error: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }

    try {
      const output = stdout + stderr;

      // Look for JSON between markers
      const startMarker = "===JSON_START===";
      const endMarker = "===JSON_END===";
      const startIdx = output.indexOf(startMarker);
      const endIdx = output.indexOf(endMarker);

      let jsonString = null;

      if (startIdx !== -1 && endIdx !== -1) {
        jsonString = output.substring(startIdx + startMarker.length, endIdx).trim();
      } else {
        // Fallback
        const lines = output.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("{") && trimmed.includes('"handle1"')) {
            jsonString = trimmed;
            break;
          }
        }
      }

      if (!jsonString) {
        console.error("[Encrypt] Could not find JSON in output");
        return res.status(500).json({ error: "Failed to parse encryption output" });
      }

      const encryptedData = JSON.parse(jsonString);
      const elapsed = Date.now() - startTime;
      console.log(`[Encrypt] ✅ Success in ${(elapsed / 1000).toFixed(1)}s`);

      res.json(encryptedData);
    } catch (parseError) {
      console.error(`[Encrypt] ❌ Parse error: ${parseError.message}`);
      res.status(500).json({ error: `Failed to parse encryption result: ${parseError.message}` });
    }
  });
});

// Simplified encrypt endpoint - instant response without gateway delays
app.post("/api/simple-encrypt", (req, res) => {
  const { age, drinks, contractAddress } = req.body;

  if (!Number.isInteger(age) || age < 0 || age > 255) {
    return res.status(400).json({ error: "Invalid age (0-255)" });
  }

  if (!Number.isInteger(drinks) || drinks < 0 || drinks > 255) {
    return res.status(400).json({ error: "Invalid drinks (0-255)" });
  }

  if (!contractAddress) {
    return res.status(400).json({ error: "Contract address required" });
  }

  console.log(`[Simple Encrypt] Age=${age}, Drinks=${drinks}, Contract=${contractAddress}`);

  try {
    const ethers = require("ethers");

    // For demo purposes: create dummy encrypted inputs
    // In production, these would come from actual FHE encryption
    const dummyHandle1 = ethers.hexlify(ethers.randomBytes(32));
    const dummyHandle2 = ethers.hexlify(ethers.randomBytes(32));
    const dummyProof = ethers.hexlify(ethers.randomBytes(64));

    // Encode the function call
    const abi = [
      "function checkAlcoholAllowed(bytes calldata inputAge, bytes calldata inputProofAge, bytes calldata inputDrinksSoFar, bytes calldata inputProofDrinks) external returns (bytes)",
    ];

    const iface = new ethers.Interface(abi);
    const encodedFunction = iface.encodeFunctionData("checkAlcoholAllowed", [
      dummyHandle1,
      dummyProof,
      dummyHandle2,
      dummyProof,
    ]);

    console.log(`[Simple Encrypt] ✅ Success (instant)`);
    res.json({
      encodedFunction,
      handle1: dummyHandle1,
      handle2: dummyHandle2,
      inputProof: dummyProof,
    });
  } catch (error) {
    console.error(`[Simple Encrypt] ❌ Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Decrypt result endpoint - uses hardhat task
app.post("/api/decrypt-result", (req, res) => {
  const { userAccount, contractAddress } = req.body;

  if (!userAccount) {
    return res.status(400).json({ error: "User account required" });
  }

  if (!contractAddress) {
    return res.status(400).json({ error: "Contract address required" });
  }

  console.log(`[Decrypt] UserAccount=${userAccount}, Contract=${contractAddress}`);
  const startTime = Date.now();

  const command = `npx hardhat --network sepolia task:decrypt-result --address ${contractAddress}`;

  exec(command, { cwd: __dirname, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    if (error) {
      console.error(`[Decrypt] ❌ Error: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }

    const output = stdout + stderr;
    const allowed = output.includes("✅ ALLOWED");

    const elapsed = Date.now() - startTime;
    console.log(`[Decrypt] ✅ Result: ${allowed ? "ALLOWED" : "NOT ALLOWED"} in ${(elapsed / 1000).toFixed(1)}s`);

    res.json({ allowed });
  });
});

// Serve static frontend from frontend/public (AFTER API routes)
const publicDir = path.join(__dirname, "frontend", "public");
app.use(express.static(publicDir));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Frontend: http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/check-alcohol (POST)`);
  console.log(`Contract: ${process.env.CONTRACT_ADDRESS || process.env.ALCOHOL_CONTROL_ADDRESS || "Not configured"}`);
});
