/* Game constants. */
const GAME_WIDTH = 288;
const GAME_HEIGHT = 512;

const BASE_WIDTH = 336;
const BASE_HEIGHT = 112;

const IN_BETWEEN_DISTANCE = 96;
const PIPES_DISTANCE = 174;

const PIPE_WIDTH = 52;
const MIN_SPAWN_Y = 40;
const MAX_SPAWN_Y = 192;

const BIRD_SIZE_X = 34;
const BIRD_SIZE_Y = 24;
const BIRD_FRAMES = 3;
const BIRD_ANIMATION_SPEED = 8;

const DIGIT_WIDTH = 24;

const GFORCE = 1100;

const MESSAGE_WIDTH = 184;
const MESSAGE_HEIGHT = 267;

/* Digit to image ID lookup tables. */
var digitLookup = {'0':'zero', '1':'one', '2':'two', '3':'three', '4':'four', '5':'five', '6':'six', '7':'seven', '8':'eight', '9':'nine'};
var smallDigitLookup = {'0':'small_zero', '1':'small_one', '2':'small_two', '3':'small_three', '4':'small_four', '5':'small_five', '6':'small_six', '7':'small_seven', '8':'small_eight', '9':'small_nine'};

/* Phaser game instance. */
var game = new Phaser.Game(GAME_WIDTH,GAME_HEIGHT,Phaser.CANVAS,'gameDiv');

/* Variables dealing with background and scrolling ground. */
var randNumber;
var background;
var base;

/* Variables for starting message and game over message sprites and workflow. */
var startingMessage;
var gameOverMessage;
var scoreBoard;
var scoreBoardGroup;
var gameOverMessagesShown;

/* Pipe sprite variables. */
var firstUpperPipe;
var firstLowerPipe;
var secondUpperPipe;
var secondLowerPipe;

/* Pipe position variables used for score calculation. */
var firstLinePos;
var secondLinePos;
var passedFirstLine;
var passedSecondLine;

/* Variables dealing with score update and best score update. */
var score;
var scoreNeedsUpdate;
var bestScore;
var newBestScoreAchieved;

/* Game state flag variables. */
var gameStarted;
var gameOver;

/* Pipe placement variable. */
var randomY;

/* Flappy bird sprite variables and flappy bird control flow variables. */
var flappyBird;
var flappyBirdAnimation;
var animation;
var canUpdateFlappyBird;
var canFlash;

/* Game speed variables. */
var objectSpeed;
var startingMovement;

/* Jump button variable and flag variable. */
var jumpButton;
var isButtonDown;

/* In-game gravity. */
var gForce;

/* Used for drawing score. */
var bitmapData;

/* Sound instance variables and sound flag variables. */
var wingSound;
var swooshSound;
var pointSound;
var hitSound;
var dieSound;

var playedHitSound;
var playedSwooshSound;
var playedDieSound;

/* Phaser main state. */
var mainState = {
    preload : function(){
        game.load.image('backgroundDay', 'assets/sprites/background-day.png');
        game.load.image('backgroundNight', 'assets/sprites/background-night.png');
        game.load.image('base', 'assets/sprites/base.png');
        game.load.image('pipe', 'assets/sprites/pipe-green.png');

        game.load.image('message', 'assets/sprites/message.png');
        game.load.image('gameover', 'assets/sprites/gameover.png');
        game.load.image('scoreboard', 'assets/sprites/scoreBoard.png');

        game.load.image('redbird-downflap', 'assets/sprites/redbird-downflap.png');
        game.load.spritesheet('red-flappy', 'assets/sprites/red-flappy.png', BIRD_SIZE_X, BIRD_SIZE_Y, BIRD_FRAMES);

        game.load.image('zero', 'assets/sprites/0.png');
        game.load.image('one', 'assets/sprites/1.png');
        game.load.image('two', 'assets/sprites/2.png');
        game.load.image('three', 'assets/sprites/3.png');
        game.load.image('four', 'assets/sprites/4.png');
        game.load.image('five', 'assets/sprites/5.png');
        game.load.image('six', 'assets/sprites/6.png');
        game.load.image('seven', 'assets/sprites/7.png');
        game.load.image('eight', 'assets/sprites/8.png');
        game.load.image('nine', 'assets/sprites/9.png');

        game.load.image('small_zero', 'assets/sprites/small_0.png');
        game.load.image('small_one', 'assets/sprites/small_1.png');
        game.load.image('small_two', 'assets/sprites/small_2.png');
        game.load.image('small_three', 'assets/sprites/small_3.png');
        game.load.image('small_four', 'assets/sprites/small_4.png');
        game.load.image('small_five', 'assets/sprites/small_5.png');
        game.load.image('small_six', 'assets/sprites/small_6.png');
        game.load.image('small_seven', 'assets/sprites/small_7.png');
        game.load.image('small_eight', 'assets/sprites/small_8.png');
        game.load.image('small_nine', 'assets/sprites/small_9.png');

        game.load.image('new_record', 'assets/sprites/new-record.png');

        game.load.audio('wing', 'assets/audio/wing.ogg');
        game.load.audio('swoosh', 'assets/audio/swoosh.ogg');
        game.load.audio('point', 'assets/audio/point.ogg');
        game.load.audio('hit', 'assets/audio/hit.ogg');
        game.load.audio('die', 'assets/audio/die.ogg');
    },

    create : function(){

        // Centering canvas in page.
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;
        game.scale.refresh();

        // Randomly picking a background.
        randNumber = Math.random();
        if(randNumber <= 0.5){
            background = game.add.tileSprite(0,0,GAME_WIDTH,GAME_HEIGHT,'backgroundDay');
        }
        else{
            background = game.add.tileSprite(0,0,GAME_WIDTH,GAME_HEIGHT,'backgroundNight');
        }
        
        // Randomly placing the first pipe.
        randomY = Math.floor(Math.random() * (MAX_SPAWN_Y - MIN_SPAWN_Y + 1)) + MIN_SPAWN_Y;

        firstUpperPipe = game.add.sprite(GAME_WIDTH * 2,randomY,'pipe');
        firstUpperPipe.scale.setTo(1,-1);
        game.physics.enable(firstUpperPipe, Phaser.Physics.ARCADE);
        firstUpperPipe.body.gravity.y = 0;

        firstLowerPipe = game.add.sprite(GAME_WIDTH * 2,randomY + IN_BETWEEN_DISTANCE,'pipe');
        game.physics.enable(firstLowerPipe, Phaser.Physics.ARCADE);
        firstLowerPipe.body.gravity.y = 0;

        firstLinePos = Math.floor(GAME_WIDTH * 2 + PIPE_WIDTH / 1.5);
        passedFirstLine = false;

        // Randomly placing the second pipe.
        randomY = Math.floor(Math.random() * (MAX_SPAWN_Y - MIN_SPAWN_Y + 1)) + MIN_SPAWN_Y;

        secondUpperPipe = game.add.sprite((GAME_WIDTH * 2) + PIPES_DISTANCE,randomY,'pipe');
        secondUpperPipe.scale.setTo(1,-1);
        game.physics.enable(secondUpperPipe, Phaser.Physics.ARCADE);
        secondUpperPipe.body.gravity.y = 0;

        secondLowerPipe = game.add.sprite((GAME_WIDTH * 2) + PIPES_DISTANCE,randomY + IN_BETWEEN_DISTANCE,'pipe');
        game.physics.enable(secondLowerPipe, Phaser.Physics.ARCADE);
        secondLowerPipe.body.gravity.y = 0;

        secondLinePos = Math.floor((GAME_WIDTH * 2) + PIPES_DISTANCE + PIPE_WIDTH / 1.5);
        passedSecondLine = false;

        // Creating scrolling background sprite.
        base = game.add.tileSprite(0,GAME_HEIGHT-BASE_HEIGHT,BASE_WIDTH-(BASE_WIDTH-GAME_WIDTH),GAME_HEIGHT,'base');
        game.physics.enable(base, Phaser.Physics.ARCADE);

        // Creating flappy bird sprite.
        flappyBird = game.add.sprite(GAME_WIDTH / 2 - BIRD_SIZE_X, (GAME_HEIGHT - BASE_HEIGHT) / 2 - BIRD_SIZE_Y / 2, 'red-flappy', BIRD_FRAMES);
        flappyBird.anchor.setTo(0.5,0.5);
        flappyBird.animations.add('flap');
        flappyBird.animations.play('flap', BIRD_ANIMATION_SPEED, true);
        
        game.physics.enable(flappyBird, Phaser.Physics.ARCADE);
        flappyBird.body.collideWorldBounds = true;
        canUpdateFlappyBird = true;
        canFlash = true;
        objectSpeed = -2;
        startingMovement = 0;

        // Initializing game message sprites.
        startingMessage = game.add.sprite((GAME_WIDTH - MESSAGE_WIDTH) / 2, (GAME_HEIGHT / 2 - MESSAGE_HEIGHT) / 2 + 32, 'message');

        gameOverMessage = game.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 5, 'gameover');
        gameOverMessage.anchor.setTo(0.5,0.5);
        gameOverMessage.alpha = 0;

        scoreBoard = game.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2.5, 'scoreboard');
        scoreBoard.anchor.setTo(0.5,0.5);
        scoreBoard.alpha = 0;
       
        // Initializing buttons and game states.
        jumpButton = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        jumpButton.onDown.add(updateFlappyBird, this);
        
        game.input.onDown.add(updateFlappyBird, this);
        
        isButtonDown = false;
        score = 0;
        bestScore = sessionStorage.getItem('bestScore');
        if(bestScore == null){
            bestScore = 0;
        }
        else bestScore = parseInt(bestScore);

        newBestScoreAchieved = false;
        scoreNeedsUpdate = true;

        gameStarted = false;
        gameOver = false;
        gameOverMessagesShown = false;

        bitmapData = game.add.bitmapData(game.width, game.height);
        bitmapData.addToWorld();

        // Initializing sound objects and flag variables.
        wingSound = game.add.audio('wing');
        swooshSound = game.add.audio('swoosh');
        pointSound = game.add.audio('point');
        hitSound = game.add.audio('hit');
        dieSound = game.add.audio('die');

        playedHitSound = false;
        playedSwooshSound = false;
        playedDieSound = false;
    },

    update : function(){
        if(gameStarted){
            checkBirdCollision();
            updateScore();
            updateFlappyBirdAngle();
            updatePipe(firstUpperPipe, firstLowerPipe, firstLinePos, passedFirstLine);
            updatePipe(secondUpperPipe, secondLowerPipe, secondLinePos, passedSecondLine);
            updateLineStatus();
            drawScore();
        }
        else {
            floatFlappyBird();
        } 
        updateBase();
        playCollisionSounds();
    },

    // render : function() {
    //     game.debug.text(score,32,32);
    //     game.debug.text(firstLinePos,32,64);
    //     game.debug.text(secondLinePos,32,96);
    //     game.debug.text(passedFirstLine,32,128);
    //     game.debug.text(passedSecondLine,32,160);
    // }
}

/* Function that updates game's score. */
function updateScore(){
    updateFirstPipeScore();
    updateSecondPipeScore();
}

/* Function that updates the score if player passed the first pipe. */
function updateFirstPipeScore(){
    if(flappyBird.x > firstLinePos && !passedFirstLine){
        score += 1;
        passedFirstLine = true;
        scoreNeedsUpdate = true;
        pointSound.play();
    }
}

/* Function that updates the score if player passed the second pipe. */
function updateSecondPipeScore(){
    if(flappyBird.x > secondLinePos && !passedSecondLine){
        score += 1;
        passedSecondLine = true;
        scoreNeedsUpdate = true;
        pointSound.play();
    }
}

/* Function that positions and draws score based on the game's digit sprites. */
function drawScore(){
    if(scoreNeedsUpdate){
        scoreString = score.toString();
        var digitList = [];
        for(var i=0; i<scoreString.length; i++){
            var digit = scoreString.charAt(i) 
            digitList.push(digit);
        }
        var totalWidth = digitList.length;
        var startingPos = GAME_WIDTH / 2 - (totalWidth * DIGIT_WIDTH) / 2;
        bitmapData.clear();
        var prevLetter = digitList[0];
        prevPos = startingPos;
        for(var i=0; i<totalWidth; i++){
            if(prevLetter == '1'){
                bitmapData.draw(digitLookup[digitList[i]], prevPos, 16);
                prevPos += 16;
            }
            else {
                bitmapData.draw(digitLookup[digitList[i]], prevPos, 16); 
                prevPos += DIGIT_WIDTH / 1.2;
            }
            prevLetter = digitList[i];  
        }
        scoreNeedsUpdate = false;
    }
    
}

/* Function that makes flappy bird float in starting screen. */
function floatFlappyBird(){
    startingMovement += 0.03;
    flappyBird.y += Math.sin(Math.PI * startingMovement) / 3;
}

/* Function that updates flappy bird state and behaviour. */
function updateFlappyBird(){
    if(gameOver){
        flash(500);
        game.state.restart();
    }
    if(!gameStarted){
        gameStarted = true;
        canUpdateFlappyBird = true;
        game.add.tween(startingMessage).to( { alpha: 0 }, 400, Phaser.Easing.Linear.None, true);
    }
    if(canUpdateFlappyBird){
        flappyBird.body.gravity.y = GFORCE;
        flappyBird.body.velocity.y = -(GFORCE * 0.32);
        while(flappyBird.angle > -20){
            flappyBird.angle -= 1;
        }
        wingSound.play();
    } 
}

/* Function that updates flappy bird's angle when flapping. */
function updateFlappyBirdAngle(){
    if(flappyBird.body.velocity.y > GFORCE / 6){
        if(flappyBird.angle < 90){
            flappyBird.angle += 3;
        }
    }  
}

/* Moving scrolling ground. */
function updateBase(){
    base.tilePosition.x += objectSpeed;
}

/* Function that updates sprite pipe's position. */
function updatePipe(upperPipe, lowerPipe){
    if(upperPipe.x <= -PIPE_WIDTH){
        upperPipe.x = GAME_WIDTH;
        upperPipe.y = Math.floor(Math.random() * (MAX_SPAWN_Y - MIN_SPAWN_Y + 1)) + MIN_SPAWN_Y;
        lowerPipe.x = GAME_WIDTH;
        lowerPipe.y = upperPipe.y + IN_BETWEEN_DISTANCE;
    }
    upperPipe.x += objectSpeed;
    lowerPipe.x += objectSpeed;
}

/* Function that updates pipe's position for score calculation. */
function updateLineStatus(){
    if(firstUpperPipe.x <= -PIPE_WIDTH){
        firstLinePos = Math.floor(GAME_WIDTH + PIPE_WIDTH / 1.5);
        passedFirstLine = false;
    }
    if(secondUpperPipe.x <= -PIPE_WIDTH){
        secondLinePos = Math.floor(GAME_WIDTH + PIPE_WIDTH / 1.5);
        passedSecondLine = false;
    }
    firstLinePos += objectSpeed;
    secondLinePos += objectSpeed;
}

/* Function that performs flash effect and game state modification after flappy bird death. */
function killFlappyBird(){
    objectSpeed = 0;
    canUpdateFlappyBird = false;
    flappyBird.animations.stop(null,true);
    flash(200);
    if(flappyBird.angle < 90){
        flappyBird.angle += 3;
    }
}

/* Function that shows game over message, score and best score when flappy bird touches ground. */
function levelFlappyBird(){
    flappyBird.body.velocity.y = 0;
    flappyBird.body.gravity.y = 0;
    objectSpeed = 0;
    canUpdateFlappyBird = false;
    gameOver = true;
    flappyBird.animations.stop(null,true);

    if(!gameOverMessagesShown){
        scoreBoardGroup = game.add.group();
        scoreBoardGroup.create(GAME_WIDTH / 2 - scoreBoard.width / 2, GAME_HEIGHT / 3, 'scoreboard');

        scoreString = score.toString();
        var digitList = [];
        for(var i=0; i<scoreString.length; i++){
            digitList.push(scoreString.charAt(i));
        }
        digitList = digitList.reverse();
        var startingPos = 0;
        if(digitList[0] == '1'){
            startingPos = scoreBoard.width / 2 - 24;
        }
        else startingPos = scoreBoard.width / 2 - 30;
        for(var i=0; i<=digitList.length; i++){
            scoreBoardGroup.create(GAME_WIDTH / 2 + startingPos, GAME_HEIGHT / 3 + 24, smallDigitLookup[digitList[i]]);
            if(i < digitList.length){
                if(digitList[i+1]=='1'){
                    startingPos -= 6;
                }
                else startingPos -= 12;
            } 
        }

        if(score > bestScore){
            bestScore = score;
            newBestScoreAchieved = true;
            sessionStorage.setItem('bestScore', score.toString());
        }

        bestScoreString = bestScore.toString();
        digitList = [];
        for(var i=0; i<bestScoreString.length; i++){
            digitList.push(bestScoreString.charAt(i));
        }
        digitList = digitList.reverse();
        if(digitList[0] == '1'){
            startingPos = scoreBoard.width / 2 - 24;
        }
        else startingPos = scoreBoard.width / 2 - 30;
        for(var i=0; i<=digitList.length; i++){
            scoreBoardGroup.create(GAME_WIDTH / 2 + startingPos, GAME_HEIGHT / 3 + 56, smallDigitLookup[digitList[i]]);
            if(i < digitList.length){
                if(digitList[i+1]=='1'){
                    startingPos -= 6;
                }
                else startingPos -= 12;
            } 
        }
            
        if(newBestScoreAchieved){
            scoreBoardGroup.create(GAME_WIDTH / 2 + startingPos - 28, GAME_HEIGHT / 3 + 56, 'new_record');
        }
        
        game.add.tween(gameOverMessage).to({alpha : 1, y : GAME_HEIGHT / 5 - 4}, 500, Phaser.Easing.Linear.None, true);
        game.add.tween(scoreBoardGroup).to({alpha : 1}, 500, Phaser.Easing.Linear.None, true, 2000);
        gameOverMessagesShown = true;
    }
    
}

/* Flash effect function. */
function flash(duration){
    if(canFlash){
        game.camera.flash(0xffffff, duration);
        canFlash = false;
    }  
}

/* Function that controls when and which game sounds to play. */
function playCollisionSounds(){
    if(!canUpdateFlappyBird && !playedHitSound){
        hitSound.play();
        playedHitSound = true;
    }
    if(!canUpdateFlappyBird && flappyBird.body.velocity.y > 0 && !playedDieSound){
        dieSound.play();
        playedDieSound = true;
    } 
    if(gameOver && !playedSwooshSound){
        swooshSound.play();
        playedSwooshSound = true;
    }
}

/* Function that checks bird collision with pipes and ground, performing the killFlappyBird or levelFlappyBird functions. */
function checkBirdCollision(){
    game.physics.arcade.overlap(flappyBird, firstUpperPipe, killFlappyBird, null, this);
    game.physics.arcade.overlap(flappyBird, firstLowerPipe, killFlappyBird, null, this);
    game.physics.arcade.overlap(flappyBird, secondUpperPipe, killFlappyBird, null, this);
    game.physics.arcade.overlap(flappyBird, secondLowerPipe, killFlappyBird, null, this);
    game.physics.arcade.overlap(flappyBird, base, levelFlappyBird, null, this);
}

/* Adding the main state to the game instance and starting the game. */
game.state.add('mainState', mainState);
game.state.start('mainState');
