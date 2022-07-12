# Week 2 Assignment

Cronos dapp engineer training week2 task: a smart contract of a "Guess Number" game. 

Contract File: contracts/GuessNumberGame.sol

Test File: test/GuessNumberGame.ts

The basic requirements, tests, and addtional task 1 are implemented.


## Contract Deployment

Params to deploy:

* _nonceHash_ - keccak256 hash of the nonce to identify a game
* _nonceNumHash_ - keccak256 hash of the nonce + number, number is the one to be guessed by players
* _playerNum_ - how many players in this game. Number of players cannot be larger than 1000, because number is in range [0, 1000) and each player need to      make a unique guess


## Contract external functions

A guess() function to be called by players:
```
function guess(uint16 number) external payable {}
```

A Reveal() function to be called by host:
```
function reveal(bytes32 nonce, uint16 number) external onlyOwner {}
```

## Contract events
* _StartGame_ - emit when contract deploys
```
event StartGame(bytes32 nonceHash, bytes32 nonceNumHash, uint playerNum, uint bet);
```

* _CommitGuess_ - emit when play call guess()
```
event CommitGuess(bytes32 nonceHash, address player, uint guess);
```
* _RevealAnswer_ - emit when host call reveal()
```
event RevealAnswer(bytes32 nonceHash);
```
* _RewardWinners_ - emit when distribute reward to a player successfully
```
event RewardWinners(bytes32 nonceHash, address player, uint reward);
```

## Contract sample

I deployed a game with nonce = "HELLO", number = 689, playerNum = 2, bet = 0.1 ether at address [0x027d3a2854fc10323d511f9C612149a9d0310B08](https://rinkeby.etherscan.io/address/0x027d3a2854fc10323d511f9c612149a9d0310b08).
<br />
<br />
The contract has been verified using hardhat etherscan tool.
<br />
<br />
Please check out the transaction history with the contract. One contract creation Tx, two Guess() Txs, and one Reveal() Tx can be finded.
