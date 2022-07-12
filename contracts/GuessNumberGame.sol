// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "hardhat/console.sol";

contract GuessNumberGame is Ownable {

    // status of the game:
    // Ongoing - game has started, players are submitting guesses
    // Revealable - All players have submitted guess, host can reveal answer
    // Ended - Host has revealed answer, game is ended
    enum State {Ongoing, Revealable, Ended}

    bytes32 nonceHash;
    bytes32 nonceNumHash;

    State state;
    uint16 public playerNum;
    uint16 public submittedGuessCount;
    uint public bet;

    mapping (uint16 => bool) numGuessed;
    mapping (address => bool) addressUsed;
    mapping (address => uint16) addressToNumber;
    address payable[] players;
    address payable[] playersToBeReward;

    event StartGame(bytes32 nonceHash, bytes32 nonceNumHash, uint playerNum, uint bet);

    event CommitGuess(bytes32 nonceHash, address player, uint guess);

    event RevealAnswer(bytes32 nonceHash);

    event RewardWinners(bytes32 nonceHash, address player, uint reward);

    constructor (bytes32 _nonceHash, bytes32 _nonceNumHash, uint16 _playerNum) payable {
        require(_playerNum <= 1000, "too many players");

        nonceHash = _nonceHash;
        nonceNumHash = _nonceNumHash;
        playerNum = _playerNum;

        bet = msg.value;
        state = State.Ongoing;

        emit StartGame(nonceHash, nonceNumHash, playerNum, bet);
    }

    function guess(uint16 number) external payable {
        // check if number is out of range
        require(0 <= number && number < 1000, "number out of range");

        // check if this address has guessed
        require(addressUsed[msg.sender] == false, "player has made a guess");

        // check if the number has not been used
        require(numGuessed[number] == false, "this number has been guessed by other player");

        // check if the game has ended
        require(state == State.Ongoing, "this game has ended");

        // check if the player sends the same ether value as host
        require(msg.value == bet, "player is not sending the same ether as host");

        submittedGuessCount++;

        // change state if all players has submitted their guesses
        if (submittedGuessCount == playerNum) {
            state = State.Revealable;
        }

        addressUsed[msg.sender] = true;
        numGuessed[number] = true;
        addressToNumber[msg.sender] = number;
        players.push(payable(msg.sender));

        emit CommitGuess(nonceHash, msg.sender, number);
    }

    function reveal(bytes32 nonce, uint16 number) external onlyOwner {
        // check if nonce is correct
        // TODO: I think I am not doing this properly, need help to simplify here
        string memory nonceString = _bytes32ToString(nonce);
        require(keccak256(abi.encodePacked(nonceString)) == nonceHash, "nonce doesnt match");

        // check if nonce + number is correct
        require(keccak256(abi.encodePacked(nonceString, Strings.toString(number))) == nonceNumHash, "number doesnt match");

        // check if state is revealable
        require(state == State.Revealable, "the game is not revealable yet");

        emit RevealAnswer(nonce);

        // split and distribute rewards equally to players if number is out of range
        if (number < 0 || number > 1000) {
            _splitRewardToPlayers(players);
            state = State.Ended;
            return;
        }

        // find closest number
        uint16 MIN_DELTA = 1000;
        for (uint index = 0; index < playerNum; index++) {
            uint16 playerNumber = addressToNumber[players[index]];
            uint16 delta = _getDelta(number, playerNumber);

            if (delta < MIN_DELTA) {
                MIN_DELTA = delta;
                delete playersToBeReward;
                playersToBeReward.push(players[index]);
            } else if (delta == MIN_DELTA) {
                playersToBeReward.push(players[index]);
            }
        }

        _splitRewardToPlayers(playersToBeReward);
        state = State.Ended;
    }

    function getState() external view returns(State) {
        return state;
    }

    function _splitRewardToPlayers(address payable[] memory playersToReward) internal {
        uint splittedReward = bet * (1 + playerNum) / playersToReward.length;

        for (uint index = 0; index < playersToReward.length; index++) {
            (bool result, ) = playersToReward[index].call{value: splittedReward}("");
            require(result, "split rewards failed");
            emit RewardWinners(nonceHash, playersToReward[index], splittedReward);
        }
    }

    function _getDelta(uint16 number1, uint16 number2) internal pure returns (uint16 delta) {
        if (number1 > number2) {
            delta = number1 - number2;
        } else {
            delta = number2 - number1;
        }
    }

    function _bytes32ToString(bytes32 _bytes32) internal pure returns (string memory) {
        uint8 i = 0;
        while(i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }
}
