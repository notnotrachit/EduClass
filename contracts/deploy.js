import {
  Client,
  PrivateKey,
  AccountId,
  FileCreateTransaction,
  ContractCreateTransaction,
} from "@hashgraph/sdk";
import fs from "fs";
import path from "path";
import { ethers } from "hardhat";

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
  const quizContractBytecode = JSON.parse(fs.readFileSync(
    "./artifacts/contracts/QuizContract.sol/QuizContract.json"
  )).bytecode;
  const notesFactoryBytecode = JSON.parse(fs.readFileSync(
    "./artifacts/contracts/NotesContract.sol/NotesFactory.json"
  )).bytecode;
  const notesContractBytecode = JSON.parse(fs.readFileSync(
    "./artifacts/contracts/NotesContract.sol/NotesContract.json"
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

  const quizContractFileId = await uploadBytecode(
    client,
    quizContractBytecode
  );
  console.log(
    "QuizContract bytecode uploaded with file ID:",
    quizContractFileId.toString()
  );

  const notesFactoryFileId = await uploadBytecode(
    client,
    notesFactoryBytecode
  );
  console.log(
    "NotesFactory bytecode uploaded with file ID:",
    notesFactoryFileId.toString()
  );

  const notesContractFileId = await uploadBytecode(
    client,
    notesContractBytecode
  );
  console.log(
    "NotesContract bytecode uploaded with file ID:",
    notesContractFileId.toString()
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

  const quizContractTx = await new ContractCreateTransaction()
    .setBytecodeFileId(quizContractFileId)
    .setGas(1000000)
    .execute(client);
  const quizContractReceipt = await quizContractTx.getReceipt(client);
  console.log(
    "QuizContract deployed to:",
    quizContractReceipt.contractId.toString()
  );

  const notesFactoryTx = await new ContractCreateTransaction()
    .setBytecodeFileId(notesFactoryFileId)
    .setGas(1000000)
    .execute(client);
  const notesFactoryReceipt = await notesFactoryTx.getReceipt(client);
  console.log(
    "NotesFactory deployed to:",
    notesFactoryReceipt.contractId.toString()
  );

  const notesContractTx = await new ContractCreateTransaction()
    .setBytecodeFileId(notesContractFileId)
    .setGas(1000000)
    .execute(client);
  const notesContractReceipt = await notesContractTx.getReceipt(client);
  console.log(
    "NotesContract deployed to:",
    notesContractReceipt.contractId.toString()
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
