import {expect} from "chai";
import {ethers} from "hardhat";

describe("GuessNumberGame", function () {

    describe("Test Deploy", function () {
        it("Deployment should success with valid params", async function () {
            const nonce = "hello";
            const number = 35;
            const nonceHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(nonce));
            const nonceNumberHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(nonce + number));
            const playerNum = 2;
            const bet = ethers.utils.parseEther("1")
            const [owner] = await ethers.getSigners();
            const GuessNumberGame = await ethers.getContractFactory("GuessNumberGame");
            const guessNumberGame = await GuessNumberGame.deploy(nonceHash, nonceNumberHash, playerNum, {value: bet});


            expect(await guessNumberGame.playerNum()).to.equal(playerNum);
            expect(await guessNumberGame.bet()).to.equal(bet);
        });

        it("Deployment should failed if playerNum is not within [0, 1000)", async function () {
            const nonce = "hello";
            const number = 35;
            const nonceHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(nonce));
            const nonceNumberHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(nonce + number));
            const playerNum = 1001;
            const bet = ethers.utils.parseEther("1")
            const [owner] = await ethers.getSigners();
            const GuessNumberGame = await ethers.getContractFactory("GuessNumberGame");
            await expect(GuessNumberGame.deploy(nonceHash, nonceNumberHash, playerNum, {value: bet})).to.be.revertedWith('too many players');
        });

        it("Deployment should emit a event", async function () {
            // TODO: i dont know how to write the expect part
        });
    });

    async function deployContract(nonce: string, number: any, playerNum: any, bet: any) {
        const nonceHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(nonce));
        const nonceNumberHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(nonce + number));

        const [owner] = await ethers.getSigners();
        const GuessNumberGame = await ethers.getContractFactory("GuessNumberGame");
        const guessNumberGame = await GuessNumberGame.deploy(nonceHash, nonceNumberHash, playerNum, {value: bet});
        return {owner, guessNumberGame}

    }

    describe("Test Guess", function () {
        it("Guess() should failed if number is out of range", async function () {
            const bet = ethers.utils.parseEther("1");
            const {owner, guessNumberGame} = await deployContract("hello", 400, 2, bet);
            await expect(guessNumberGame.guess(2000, {value: bet})).to.be.revertedWith(
                "number out of range"
            );
        });

        it("Guess() should failed if a player guess twice", async function () {
            const bet = ethers.utils.parseEther("1");
            const {owner, guessNumberGame} = await deployContract("hello", 400, 2, bet);
            const [address1, address2] = await ethers.getSigners();
            await guessNumberGame.connect(address2).guess(15, {value: bet});
            await expect(guessNumberGame.connect(address2).guess(25, {value: bet})).to.be.revertedWith(
                "player has made a guess"
            );
        });

        it("Guess() should failed if a player guess the same number as others", async function () {
            const bet = ethers.utils.parseEther("1");
            const {owner, guessNumberGame} = await deployContract("hello", 400, 2, bet);
            const [address1, address2, address3] = await ethers.getSigners();
            await guessNumberGame.connect(address2).guess(15, {value: bet});
            await expect(guessNumberGame.connect(address3).guess(15, {value: bet})).to.be.revertedWith(
                "this number has been guessed by other player"
            );
        });

        it("Guess() should failed if the game has ended", async function () {
            const bet = ethers.utils.parseEther("1");
            const {owner, guessNumberGame} = await deployContract("HELLO", 400, 2, bet);
            const [, address1, address2, address3] = await ethers.getSigners();

            await guessNumberGame.connect(address1).guess(1, {value: bet});
            await guessNumberGame.connect(address2).guess(2, {value: bet});

            let nonce = ethers.utils.formatBytes32String("HELLO");
            await guessNumberGame.connect(owner).reveal(nonce, 400);

            await expect(guessNumberGame.connect(address3).guess(15, {value: bet})).to.be.revertedWith(
                "this game has ended"
            );
        });

        it("Guess() should failed if player is not sending the same bet", async function () {
            let bet = ethers.utils.parseEther("1");
            const {owner, guessNumberGame} = await deployContract("hello", 400, 2, bet);
            const [address1, address2] = await ethers.getSigners();
            bet = ethers.utils.parseEther("2");
            await expect(guessNumberGame.connect(address2).guess(15, {value: bet})).to.be.revertedWith(
                "player is not sending the same ether as host"
            );
        });

        it("Guess() success and emit event CommitGuess()", async function () {
            let bet = ethers.utils.parseEther("1");
            const {owner, guessNumberGame} = await deployContract("hello", 400, 2, bet);
            const [, address1] = await ethers.getSigners();
            bet = ethers.utils.parseEther("1");
            expect(await guessNumberGame.connect(address1).guess(15, {value: bet}))
                .to.emit(guessNumberGame, "CommitGuess")
                .withArgs(
                    ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hello")),
                    address1.getAddress(),
                    15);
        });
    });

    describe("Test Reveal", function () {
        it("Reveal() should failed if not called by host", async function () {
            const bet = ethers.utils.parseEther("1");
            const {owner, guessNumberGame} = await deployContract("HELLO", 689, 2, bet);
            const [address1, address2] = await ethers.getSigners();
            let nonce = ethers.utils.formatBytes32String("HELLO");
            await expect(guessNumberGame.connect(address2).reveal(nonce, 689)).to.be.revertedWith(
                "Ownable: caller is not the owner"
            );
        });

        it("Reveal() should failed if nonce is not correct", async function () {
            const bet = ethers.utils.parseEther("1");
            const {owner, guessNumberGame} = await deployContract("HELLO", 689, 2, bet);
            let nonce = ethers.utils.formatBytes32String("HELLOA");
            await expect(guessNumberGame.connect(owner).reveal(nonce, 689)).to.be.revertedWith(
                "nonce doesnt match"
            );
        });

        it("Reveal() should failed if nonce + number is not correct", async function () {
            const bet = ethers.utils.parseEther("1");
            const {owner, guessNumberGame} = await deployContract("HELLO", 400, 2, bet);
            let nonce = ethers.utils.formatBytes32String("HELLO");
            await expect(guessNumberGame.connect(owner).reveal(nonce, 300)).to.be.revertedWith(
                "number doesnt match"
            );
        });

        it("Reveal() should failed if state is not revealable", async function () {
            const bet = ethers.utils.parseEther("1");
            const {owner, guessNumberGame} = await deployContract("HELLO", 689, 2, bet);
            let nonce = ethers.utils.formatBytes32String("HELLO");
            await expect(guessNumberGame.connect(owner).reveal(nonce, 689)).to.be.revertedWith(
                "the game is not revealable yet"
            );
        });

        it("Reveal() should emit event RevealAnswer()", async function () {
            const bet = ethers.utils.parseEther("1");
            const {owner, guessNumberGame} = await deployContract("HELLO", 689, 2, bet);
            let nonce = ethers.utils.formatBytes32String("HELLO");

            const [, address1, address2] = await ethers.getSigners();
            await guessNumberGame.connect(address1).guess(25, {value: bet});
            await guessNumberGame.connect(address2).guess(555, {value: bet});

            expect(await guessNumberGame.connect(owner).reveal(nonce, 689))
                .to.emit(guessNumberGame, "RevealAnswer")
                .withArgs(ethers.utils.keccak256(ethers.utils.toUtf8Bytes("HELLO")));
        });

        it("Distribute rewards equally to players if host number is out of range", async function () {
            const bet = ethers.utils.parseEther("1");
            const {owner, guessNumberGame} = await deployContract("HELLO", 1500, 2, bet);

            const [, address1, address2] = await ethers.getSigners();
            await guessNumberGame.connect(address1).guess(25, {value: bet});
            await guessNumberGame.connect(address2).guess(555, {value: bet});

            let nonce = ethers.utils.formatBytes32String("HELLO");
            await expect(guessNumberGame.connect(owner).reveal(nonce, 1500)).to.changeEtherBalances(
                [address1, address2],
                [ethers.utils.parseEther("1.5").toBigInt(), ethers.utils.parseEther("1.5").toBigInt()]
            );

            // state = State.Ended
            expect(await guessNumberGame.getState()).to.equal(2);
        });

        it("Rewards to one player", async function () {
            const bet = ethers.utils.parseEther("1");
            const {owner, guessNumberGame} = await deployContract("HELLO", 500, 2, bet);

            const [, address1, address2] = await ethers.getSigners();
            await guessNumberGame.connect(address1).guess(25, {value: bet});
            await guessNumberGame.connect(address2).guess(555, {value: bet});

            let nonce = ethers.utils.formatBytes32String("HELLO");
            await expect(guessNumberGame.connect(owner).reveal(nonce, 500)).to.changeEtherBalances(
                [address2],
                [ethers.utils.parseEther("3").toBigInt()]
            );

            // state = State.Ended
            expect(await guessNumberGame.getState()).to.equal(2);
        });

        it("Rewards to one player, emit event RewardWinners()", async function () {
            const bet = ethers.utils.parseEther("1");
            const {owner, guessNumberGame} = await deployContract("HELLO", 500, 2, bet);

            const [, address1, address2] = await ethers.getSigners();
            await guessNumberGame.connect(address1).guess(25, {value: bet});
            await guessNumberGame.connect(address2).guess(555, {value: bet});

            let nonce = ethers.utils.formatBytes32String("HELLO");
            console.log("HELLO: ", nonce);
            expect(await guessNumberGame.connect(owner).reveal(nonce, 500))
                .to.emit(guessNumberGame, "RewardWinners")
                .withArgs(
                    ethers.utils.keccak256(ethers.utils.toUtf8Bytes("hello")),
                    address1.getAddress(),
                    ethers.utils.parseEther("3").toBigInt());

            // state = State.Ended
            expect(await guessNumberGame.getState()).to.equal(2);
        });

        it("Multiple players, rewards to two player", async function () {
            const bet = ethers.utils.parseEther("1");
            const {owner, guessNumberGame} = await deployContract("HELLO", 500, 3, bet);

            const [, address1, address2, address3] = await ethers.getSigners();
            await guessNumberGame.connect(address1).guess(25, {value: bet});
            await guessNumberGame.connect(address2).guess(550, {value: bet});
            await guessNumberGame.connect(address3).guess(450, {value: bet});

            let nonce = ethers.utils.formatBytes32String("HELLO");
            await expect(guessNumberGame.connect(owner).reveal(nonce, 500)).to.changeEtherBalances(
                [address2, address3],
                [ethers.utils.parseEther("2").toBigInt(), ethers.utils.parseEther("2").toBigInt()]
            );

            // state = State.Ended
            expect(await guessNumberGame.getState()).to.equal(2);
        });
    });
});