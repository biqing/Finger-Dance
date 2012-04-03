// Array that holds all the directionButtons
var directionButtons = [];
var image_W = 134 / 2;
var image_H = 134 / 2;
var userscore = 0,
    errorpoint = 0,
    successpoint = 0,
    misspoint = 0;
var music = [];
var style = {
    "normal" : "#99A3AD",
    "start" : "#62CEF8",
    "mistake" : "#E20158",
    "good" : "#B5D65E"
};
$(document).ready(function (){
        var canvas = document.querySelector("#gameCanvas");
        var ctx = canvas.getContext("2d");

        // Canvas dimensions
        var canvasWidth = canvas.width;
        var canvasHeight = canvas.height;

        // Game settings
        var db;
        var audioEl;
        var playGame;
        var arrowLeft = 37;
        var arrowUp = 38;
        var arrowRight = 39;
        var arrowDown = 40;

        // Game UI
        var ui = $("#gameUI");
        var uiIntro = $("#gameIntro");
        var uiStage = $("#gameStage");
        var uiLoading = $("#gameLoading");
        var uiStats = $("#gameStats");
        var uiResult = $("#gameResult");
        var uiRank = $("#gameRank");
        var uiPlay = $("#gamePlay");
        var uiTime = $("#gameTime");
        var uiTimeProgress = $("#timeProgress");
        var uiReplay = $("#gameReplay");
        var uiMessage = $("#gameMessage");
        var uiScore = $(".gameScore");
        var uiScoreValue = $("#scoreValue");
        var waitImage = new Image();
        waitImage.src = "image/wait.png";
        var startImage = new Image();
        startImage.src = "image/start.png";
        var goodImage = new Image();
        goodImage.src = "image/good.png";
        var missImage = new Image();
        missImage.src = "image/miss.png";

        // DirectionButton class
        var DirectionButton = function (x, y, angle){
            // x,y为矩形中中心
            this.x = x;
            this.y = y;
            this.angle = angle;
            // 初始化为常态
            this.state = "wait";
        };

        $.extend(DirectionButton.prototype, {
            setState : function (state){
                if (state == "start") {
                    clearTimeout(this.successTimer);
                }
                this.state = state;
                this.draw();
            },
            draw : function (){
                var img;
                switch (this.state) {
                    case "wait":
                        img = waitImage;
                        break;
                    case "start":
                        img = startImage;
                        break;
                    case "good":
                        img = goodImage;
                        break;
                    case "miss":
                        img = missImage;
                        break;
                }
                // 保存画布
                ctx.save();
                // 将坐标系原点移至矩形中心
                ctx.translate(this.x, this.y);
                // 旋转坐标系
                ctx.rotate(this.angle);
                ctx.clearRect(-image_W / 2, -image_H / 2, image_W, image_H);
                ctx.drawImage(img, -image_W / 2, -image_H / 2, image_W, image_H);
                // 恢复画布
                ctx.restore();
            },
            success : function (){
                var self = this;
                // 加分
                userscore += 10;
                uiScoreValue.html(userscore);
                // 输出OK
                uiMessage.css('color', style.good);
                uiMessage.html('Good');
                // 成功+1
                successpoint += 1;
                this.setState("good");
                //还原
                this.successTimer = setTimeout(function (){
                    self.setState("wait");
                }, 500);
            },
            fail : function (){
                // 扣分
                // userscore += 10;
                // uiScoreValue.html(userscore);
                // 输出OK
                uiMessage.css('color', style.mistake);
                uiMessage.html('Mistake');
                // 失败+1
                errorpoint += 1;
                this.setState("miss");
            }
        })

        // Reset and start the game
        function startGame(){
            // Reset game stats
            uiStage.hide();
            uiTimeProgress.css('width', "0px");
            uiTime.html("--:--/--:--");
            uiScore.html("0");
            uiStats.show();

            function pressButton(button){
                if (button.state == "start") {
                    button.success();
                } else {
                    button.fail();
                }
            }

            $(window).bind("keydown", function (e){
                switch (e.keyCode) {
                    case arrowUp:
                        pressButton(directionButtons[0]);
                        break;
                    case arrowRight:
                        pressButton(directionButtons[1]);
                        break;
                    case arrowDown:
                        pressButton(directionButtons[2]);
                        break;
                    case arrowLeft:
                        pressButton(directionButtons[3]);
                        break;
                }
            });

            // Set up initial game settings
            playGame = true;
            userscore = 0;
            try {
                audioEl.currentTime = 0;
            } catch (e) {
                console.log(e);
            }

            audioEl.play();
            uiLoading.hide();
            changes(0);
        }

        // Inititialise the game environment
        function init(){
            var button;
            var buttonConfig = [
                // x, y, angle
                //top
                [161, 93, 0],
                //right
                [277, 218, Math.PI / 2],
                //bottom
                [161, 340, Math.PI],
                //left
                [42, 218, Math.PI * 1.5]
            ];
            for (var i = 0, len = buttonConfig.length; i < len; i++) {
                button = buttonConfig[i];
                directionButtons.push(new DirectionButton(button[0], button[1], button[2]));
            }
            openDatabase();
            creatTable();

            uiPlay.bind('click', function (e){
                e.preventDefault();
                uiIntro.hide();
                uiStage.show();
            });

            // select stage
            $('.stagebutton').bind('click', function (e){
                var target = e.target;
                var href = target.href,
                    url = $(target).attr("data-url"),
                    title = target.title;
                e.preventDefault();
                $.ajax({
                    type : 'GET',
                    url : href,
                    success : function (data){
                        var result = JSON.parse(data);
                        music = result.music;
                        initCanvas();
                    }
                });
                loadAudio(url, title);
            });

            uiReplay.bind('click', function (e){
                e.preventDefault();
                // Stop sound
                audioEl.pause();

                //startGame();
                onGameComplete();
            });

            $("#userInput").bind("blur", function (){
                insertData(this.value || "懒得留名");
            });
        }

        // Inititialise audio
        function initAudio(){
            var _audio;
            if (audioEl) {
                return;
            } //如果存在,说明已经初始化
            _audio = new Audio();
            _audio.addEventListener('canplaythrough', startGame, false);
            _audio.addEventListener('play', onPlay, false);
            _audio.addEventListener('pause', onPause, false);
            _audio.addEventListener('ended', onGameComplete, false);
            _audio.addEventListener('error', onError, false);
            _audio.addEventListener('timeupdate', onTimeUpdate, false);
            _audio.volume = 0.5;
            document.getElementById('game').appendChild(_audio);

            audioEl = _audio;
        }

        function loadAudio(url, title){
            uiStage.hide();
            uiLoading.show();
            if (!audioEl) {
                return;
            }
            var name = title || url.replace(/^.*\//, '').replace(/[#\?].*$/, '') || 'Unknown';
            musicName = name;
            audioEl.src = url;
            audioEl.load();
        }

        function onPlay(){
            //
        }

        function onPause(){
            //
        }

        function onGameComplete(){
            $(window).unbind("keydown");
            audioEl.pause();
            uiStage.hide();
            uiStats.hide();

            $('#userscore').html(userscore);
            $('#successpoint').html(successpoint);
            $('#errorpoint').html(errorpoint);
            $('#misspoint').html(misspoint);
            uiResult.show();
            console.log("Game over");

        }

        function onError(){
            uiMessage.html('<span style="color:red">加载错误:' + musicName + '</span>');
        }

        function onTimeUpdate(){
            var pos = audioEl.currentTime,
                dora = isFinite(audioEl.duration) ? audioEl.duration : 60;
            uiTime.html(formatTime(pos) + ' / ' + formatTime(dora));
            uiTimeProgress.css("width", Math.floor(pos / dora * canvasWidth) + "px");
        }

        function formatTime(sec){
            if (!isFinite(sec) || sec < 0) {
                return '--:--';
            } else {
                var m = Math.floor(sec / 60),
                    s = Math.floor(sec) % 60;
                return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
            }
        }

        // Web SQL
        function openDatabase(){
            //创建数据库
            db = window.openDatabase('shouzhiwu', '1.0', '手指舞应用', 500000);
            //window.openDatabase("数据库名字", "版本","数据库描述",数据库大小);
            if (db) {
                console.log("新建数据库成功！");
            }
        }

        function creatTable(){
            db.transaction(function (tx){
                tx.executeSql("CREATE TABLE users (id VARCHAR int NOT NULL AUTO_INCREMENT, username VARCHAR, userscore VARCHAR , errorpoint VARCHAR , successpoint VARCHAR, misspoint)");
            });
        }

        //插入记录：
        function insertData(){
            var username = $("#userInput").val() || '懒得留名';
            db.transaction(function (tx){
                tx.executeSql("INSERT INTO users (username, userscore , errorpoint , successpoint , misspoint) values("
                    + username + "," + userscore + "," + errorpoint + "," + successpoint + "," + misspoint + ")",
                    [],
                    function (tx, result){
                        uiResult.hide();
                        loadData();
                    });
                //插入数据的时候用变量来传值得
            });
        }

        //查询记录：
        function loadData(){
            db.transaction(function (tx){
                tx.executeSql("SELECT username,userscore FROM users ORDER BY userscore", [],
                    function (tx, result){
                        console.log(result);
                        var html = "", item;
                        for (var i = 0, len = Math.max(result.rows.length, 5); i < len; i++) {
                            item = result.rows.item(i);
                            html += (i + 1) + ". " + item['username'] + "<span>" + item['userscore'] + "</span>";
                        }
                        uiRank.html(html);
                        uiRank.show();
                    }, function (){
                        console.log("error");
                    });
            });
        }

        // Inititialise canvas
        function initCanvas(){
            for (var i = directionButtons.length; i--;) {
                directionButtons[i].draw();
            }
        }

        function changes(i){
            var len = music.length;
            if (i < len - 1) {
                var sh = window.setTimeout(function (){
                    changes(i + 1);
                }, music[i + 1].piece);
            } else {
                return;
            }

            for (var j = directionButtons.length; j--;) {
                if (directionButtons[j].state == "start") {
                    //MISS+1
                    misspoint += 1;
                    //输出MISS
                    uiMessage.css('color', style.mistake);
                    uiMessage.html('Miss');
                }
                directionButtons[j].setState("wait");
            }

            var d1 = music[i].direct1;
            var d2 = music[i].direct2;

            if (d1 == "top" || d2 == "top") {
                directionButtons[0].setState("start");
            }
            if (d1 == "bottom" || d2 == "bottom") {
                directionButtons[2].setState("start");
            }
            if (d1 == "left" || d2 == "left") {
                directionButtons[3].setState("start");
            }
            if (d1 == "right" || d2 == "right") {
                directionButtons[1].setState("start");
            }
        }

        init();
        initAudio();
        play.init(canvas);
    }
);
