const fs = require("fs");
const {
  Client,
  FileCreateTransaction,
  PrivateKey,
  Hbar,
} = require("@hashgraph/sdk");

async function uploadBytecode(client, filePath) {
  // Read the bytecode file from the file system
  const bytecode = fs.readFileSync(filePath);

  if (!bytecode || bytecode.length === 0) {
    throw new Error(
      "Bytecode is empty or the file is missing. Ensure the file path is correct."
    );
  }

  // Create a new FileCreateTransaction and set its contents
  const transaction = await new FileCreateTransaction()
    .setContents(bytecode)
    .setMaxTransactionFee(new Hbar(2)) // Set the maximum transaction fee
    .execute(client);

  // Get the receipt for the transaction
  const receipt = await transaction.getReceipt(client);

  // Retrieve the file ID from the receipt
  const fileId = receipt.fileId;

  console.log("File uploaded successfully. File ID:", fileId.toString());

  return fileId;
}

async function main() {
  // Configure the Hedera client
  const operatorId = process.env.OPERATOR_ID; // Your Hedera Account ID
  const operatorKey = process.env.OPERATOR_KEY; // Your Private Key

  if (!operatorId || !operatorKey) {
    throw new Error(
      "Environment variables OPERATOR_ID and OPERATOR_KEY must be set."
    );
  }

  const client = Client.forTestnet(); // Use Client.forMainnet() for production
  client.setOperator(operatorId, operatorKey);

  const filePath = "./contracts/bytecode.bin"; // Path to your bytecode file

  try {
    const fileId = await uploadBytecode(client, filePath);
    console.log(
      "Smart contract bytecode uploaded successfully with File ID:",
      fileId.toString()
    );
  } catch (error) {
    console.error("Error uploading bytecode:", error.message);
  }
}

// Run the main function
main();
