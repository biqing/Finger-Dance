var directionButtons; // Array that holds all the directionButtons
var w = 0;
var h = 0;
var r = 57.0;
var sTop = false;
var sBottom = false;
var sLeft = false;
var sRight = false;
var image_W = 134;
var image_H = 134;
var userscore = 0,
    errorpoint = 0,
    successpoint = 0,
    misspoint = 0;
var m = {
    "music" : []
};
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

        // DirectionButton class
        var DirectionButton = function (x, y, radius, direct){
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.direct = direct;
        };

        DirectionButton.prototype.success = function (){
            // 加分
            userscore += 10;
            uiScoreValue.html(userscore);
            // 输出OK
            $Message.css('color', style.good);
            $Message.html('Good');
            // 成功+1
            successpoint += 1;
            directionButtons.jsImages(this, image_W, image_H, "good");
            //还原
            this.successTimer = setTimeout(function (){
                directionButtons.jsImages(this, image_W, image_H, "wait");
            }, 500);
        }
        DirectionButton.prototype.fail = function (){
            // 扣分
            // userscore += 10;
            // uiScoreValue.html(userscore);
            // 输出OK
            $Message.css('color', style.mistake);
            $Message.html('Mistake');
            // 失败+1
            errorpoint += 1;
            directionButtons.jsImages(this, image_W, image_H, "miss");
        }

        // Reset and start the game
        function startGame(){
            // Reset game stats
            uiStage.hide();
            uiTimeProgress.css('width', "0px");
            uiTime.html("--:--/--:--");
            uiScore.html("0");
            uiStats.show();

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

            directionButtons = new Array();
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
                        m.music = result.music;
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
            var nw = canvasWidth;
            var nh = canvasHeight;
            if ((w != nw) || (h != nh)) {
                w = nw;
                h = nh;
            }

            directionButtons = new draw();
            directionButtons.top = new DirectionButton(161, 93, r, "top");
            directionButtons.bottom = new DirectionButton(161, 340, r, "bottom");
            directionButtons.left = new DirectionButton(42, 218, r, "left");
            directionButtons.right = new DirectionButton(277, 218, r, "right");

            directionButtons.jsImages(directionButtons.top, image_W, image_H, "wait");
            directionButtons.jsImages(directionButtons.bottom, image_W, image_H, "wait");
            directionButtons.jsImages(directionButtons.left, image_W, image_H, "wait");
            directionButtons.jsImages(directionButtons.right, image_W, image_H, "wait");
        }

        function changes(i){
            var len = m.music.length;
            if (i < len - 1) {
                var sh = window.setTimeout(function (){
                    changes(i + 1);
                }, m.music[i + 1].piece);
            } else {
                return;
            }

            if (sTop || sBottom || sLeft || sRight) {
                //MISS+1
                misspoint += 1;
                //输出MISS
                $Message.css('color', style.mistake);
                $Message.html('Miss');
            }

            sTop = false;
            sBottom = false;
            sLeft = false;
            sRight = false;

            directionButtons.jsImages(directionButtons.top, image_W, image_H, "wait");
            directionButtons.jsImages(directionButtons.bottom, image_W, image_H, "wait");
            directionButtons.jsImages(directionButtons.left, image_W, image_H, "wait");
            directionButtons.jsImages(directionButtons.right, image_W, image_H, "wait");

            var d1 = m.music[i].direct1;
            var d2 = m.music[i].direct2;

            if (d1 == "top" || d2 == "top") {
                sTop = true;
                clearTimeout(directionButtons.top.successTimer);
            }
            if (d1 == "bottom" || d2 == "bottom") {
                sBottom = true;
                clearTimeout(directionButtons.bottom.successTimer);
            }
            if (d1 == "left" || d2 == "left") {
                sLeft = true;
                clearTimeout(directionButtons.left.successTimer);
            }
            if (d1 == "right" || d2 == "right") {
                sRight = true;
                clearTimeout(directionButtons.right.successTimer);
            }

            //console.log(d1 + ":" + d2 + " " + s1 + ":" + s2);

            if (sTop == true) {
                //directionButtons.jsRadius(directionButtons.top, style.start);
                directionButtons.jsImages(directionButtons.top, image_W, image_H, "start");
            }
            if (sBottom == true) {
//                directionButtons.jsRadius(directionButtons.bottom, style.start);
                directionButtons.jsImages(directionButtons.bottom, image_W, image_H, "start");
            }
            if (sLeft == true) {
//                directionButtons.jsRadius(directionButtons.left, style.start);
                directionButtons.jsImages(directionButtons.left, image_W, image_H, "start");
            }
            if (sRight == true) {
//                directionButtons.jsRadius(directionButtons.right, style.start);
                directionButtons.jsImages(directionButtons.right, image_W, image_H, "start");
            }
        }

        function draw(){
            this.jsImages = function (button, image_W, image_H, state){
                var img = new Image();
                img.src = "image/" + state + "_" + button.direct + ".png";
                img.onload = function (){
                    ctx.drawImage(img, button.x - image_W / 4, button.y - image_H / 2, image_H / 2, image_W / 2);
                }
            }
        }

        init();
        initAudio();
        play.init(canvas);
    }
);
