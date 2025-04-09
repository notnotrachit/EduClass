require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    educhain: {
      url: "https://rpc.open-campus-codex.gelato.digital",
      chainId: 65647,
      accounts: [process.env.PRIVATE_KEY || ""]
    }
  }
};
