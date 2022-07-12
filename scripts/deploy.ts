import { ethers } from "hardhat";

async function main() {
  const nonce = "HELLO";
  const number = 689;
  const playerNum = 2;
  const nonceHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(nonce));
  const nonceNumberHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(nonce + number));

  const betAmount = ethers.utils.parseEther("0.1");

  const [owner] = await ethers.getSigners();
  const GuessNumberGame = await ethers.getContractFactory("GuessNumberGame");
  const guessNumberGame = await GuessNumberGame.deploy(nonceHash, nonceNumberHash, playerNum, {value: betAmount});
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
