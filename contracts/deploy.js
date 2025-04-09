import {
  Client,
  PrivateKey,
  AccountId,
  FileCreateTransaction,
  ContractCreateTransaction,
} from "@hashgraph/sdk";
import fs from "fs";

async function uploadBytecode(client, bytecode) {
  // console.log(bytecode);
  const fileCreateTx = new FileCreateTransaction().setContents(bytecode);
  const submitTx = await fileCreateTx.execute(client);
  const fileReceipt = await submitTx.getReceipt(client);
  return fileReceipt.fileId;
}

async function main() {
  const operatorId = AccountId.fromString("0.0.4668477");
  const operatorKey = PrivateKey.fromStringDer(
    ""
  );

  const client = Client.forTestnet();
  client.setOperator(operatorId, operatorKey);
  // const bytecode = fs.readFileSync("./contracts/bytecode.bin");

  const classFactoryBytecode = require(
    "./artifacts/contracts/ClassFactory.sol/ClassFactory.json", "utf8"
  ).bytecode;
  console.log(classFactoryBytecode);
  const classContractBytecode = JSON.parse(fs.readFileSync(
    "./artifacts/contracts/ClassContract.sol/ClassContract.json"
  )).bytecode;

  const classFactoryFileId = await uploadBytecode(client, classFactoryBytecode);
  console.log(
    "ClassFactory bytecode uploaded with file ID:",
    classFactoryFileId.toString()
  );

  const classContractFileId = await uploadBytecode(
    client,
    classContractBytecode
  );
  console.log(
    "ClassContract bytecode uploaded with file ID:",
    classContractFileId.toString()
  );

  // Use file IDs to deploy the contracts
  const classFactoryTx = await new ContractCreateTransaction()
    .setBytecodeFileId(classFactoryFileId)
    .setGas(1000000)
    .execute(client);
  const classFactoryReceipt = await classFactoryTx.getReceipt(client);
  console.log(
    "ClassFactory deployed to:",
    classFactoryReceipt.contractId.toString()
  );

  const classContractTx = await new ContractCreateTransaction()
    .setBytecodeFileId(classContractFileId)
    .setGas(1000000)
    .execute(client);
  const classContractReceipt = await classContractTx.getReceipt(client);
  console.log(
    "ClassContract deployed to:",
    classContractReceipt.contractId.toString()
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
