/**
 * Created by Administrator on 2017/6/19 0019.
 */
var app = require('express')();
var http=require('http').Server(app);
var io=require('socket.io')(http);

app.get('/index.html',function (req,res) {
    res.send('<h1>welcome</h1>');
})
//在线用户
var onlineRoom={};
var onlineRoomId=[];
var onlineRoomUser={};

io.on('connection',function (socket) {
    // console.log('新用户登录');
    io.emit('getAllRoom',onlineRoom);
    //监听直播间的加入

    socket.on('addRoom',function (obj) {
        socket.roomId=obj.roomId;
        socket.userId=obj.userId;
        socket.userName=obj.userName;
        socket.type=obj.type;
        socket.line=0; //判断位置

        var res="";
        //检查在线房间列表
        if(onlineRoomId.indexOf(obj.roomId)>-1){
            console.log("房间已经存在");
        }else{
            onlineRoomId.push(obj.roomId);
            onlineRoom[obj.roomId]=obj;
            onlineRoomUser[obj.roomId]={};
            onlineRoomUser[obj.roomId]["onlineNum"]=1;
            onlineRoomUser[obj.roomId]["onlineUser"]=[];
            console.log(obj);
            onlineRoomUser[obj.roomId]["onlineUser"].push(obj);
            console.log(onlineRoomUser);
            console.log(obj.userName+"创建了直播房间");
            res=obj;
        }
        //广播消息
        console.log(res);
        io.emit('addRoom',res);
    });

    socket.on('userIn',function (obj) {
        console.log("有人进来了");
        socket.roomId=obj.roomId;
        socket.userId=obj.uid;
        socket.userName=obj.user;
        socket.type=obj.utype;
        socket.line=1; //判断位置

        item={
            "roomId":obj.roomId,
            "userId":obj.uid,
            "userName":obj.user,
            "type":obj.utype,
            "line":1,
        }

        if(onlineRoomUser.hasOwnProperty(obj.roomId)){
            if(onlineRoomUser[obj.roomId]["onlineUser"].length>0){

                var has=false;

                for(var i=0;i<onlineRoomUser[obj.roomId]["onlineUser"].length;i++){
                    if(onlineRoomUser[obj.roomId]["onlineUser"][i]["userId"]==obj.uid){
                        has=true;
                        break;
                    }else {
                        has=false
                    }
                }

                if(!has){
                    onlineRoomUser[obj.roomId]["onlineNum"]++;
                    onlineRoomUser[obj.roomId]["onlineUser"].push(item);
                }
            }else {
                onlineRoomUser[obj.roomId]["onlineNum"]++;
                onlineRoomUser[obj.roomId]["onlineUser"].push(item);
            }

        }else{
            onlineRoomUser[obj.roomId]={};
            onlineRoomUser[obj.roomId]["onlineNum"]=1;
            onlineRoomUser[obj.roomId]["onlineUser"]=[];
            onlineRoomUser[obj.roomId]["onlineUser"].push(item);
        }
        
        obj["userNum"]=onlineRoomUser[obj.roomId]["onlineNum"];

        if(obj.utype==0){
            socket.join(obj.roomId);
            io.in(obj.roomId).emit('in',obj);
            console.log(obj.user+"游客进入了"+obj.roomId+"房间");
        }
        if(obj.utype==1){
            socket.join(obj.roomId);
            io.in(obj.roomId).emit('in',obj);
            console.log(obj.user+"主播进入了"+obj.roomId+"房间");
        }
    });

    //监听用户退出
    socket.on('disconnect',function () {
        //将退出用户在在线列表删除
        if(socket.line==1){
            if(socket.type==1){
                if(onlineRoom.hasOwnProperty(socket.roomId)){
                    var obj=onlineRoom[socket.roomId];
                    delete onlineRoom[socket.roomId];


                    socket.join(socket.roomId);
                    io.in(socket.roomId).emit('out',obj);

                    console.log(socket.userName+"关闭了直播间");
                }else {
                    console.log(socket.userName+"离开了直播间");
                }
            }else {
                data={
                    "user":socket.userName
                };

                delete onlineRoomId[onlineRoomId.indexOf(socket.roomId)];
                if(onlineRoomUser[socket.roomId]["onlineNum"]){
                    onlineRoomUser[socket.roomId]["onlineNum"]--;
                }
                data["userNum"]=onlineRoomUser[socket.roomId]["onlineNum"];

                socket.join(socket.roomId);
                io.in(socket.roomId).emit('out',data);
                console.log(socket.userName+"游客离开了直播间");
            }
        }
    })

    // 发送消息
    socket.on("sendMsg",function (obj) {
        console.log(obj);
        roomId=obj.roomId;
        io.in(roomId).emit('message',obj);
    })

    //获取视屏流信息
    socket.on("stream_created",function (obj) {
        var roomId=socket.roomId;
        console.log(obj);
        socket.join(roomId);
        io.in(roomId).emit('get_stream',obj);
    })

})
http.listen(8888, function(){
    console.log('listening on *:8888');
});