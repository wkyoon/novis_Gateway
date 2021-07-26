
const schedule = require('node-schedule');
const io = require("socket.io-client");

var SerialPort = require('serialport')
const PORT = '/dev/ttyS0'
const BAUDRATE = 115200

var moment = require('moment');

var sqlite3 = require('sqlite3').verbose()
//var db = new sqlite3.Database(':memory:');
var db = new sqlite3.Database('/home/pi/novis.db');

db.serialize(function(){
  //db.run("CREATE TABLE lorem (nid TEXT,tinfo TEXT,info TEXT)");
  console.log('db db db')
});

//db.close()

// return by line 
// ,parser: new SerialPort.parsers.Readline("\n")
var serialport = new SerialPort(PORT,{baudRate:BAUDRATE,parser: new SerialPort.parsers.Readline("\n")})

var buf = Buffer.alloc(0)

serialport.on('open', function() {
  console.log("serialport open ",serialport.isOpen);
});

var uartcheck_rx =false

serialport.on('data', function (data) {
  //console.log("data Buf",data);
  //console.log('data str',data.toString('utf-8'));
 
  
  console.log('data',data)
  if(data.length>0)
  {
    if(data[0] == 0x55 )
    {
      if(data.length<16)
      {
        uartcheck_rx = true
        buf = Buffer.concat([buf,data])
      }
      else
      {
        var nid = data.slice(4,6)
        console.log('nid  :',nid.toString('hex'))
        //console.log('on / off :',data[11])
        //console.log('temp :',data[14])
        
        if(socket.connected)
        {
          socket.emit('chat message', data.toString('hex'));
        }
	const tinfo = moment().format('YYYYMMDDHHmmss');
	console.log('tinfo',tinfo)

        db.run(`INSERT INTO lorem (nid,tinfo,info) VALUES(?,?,?)`,nid.toString('hex'),tinfo.toString() ,data.toString('hex'), function(err) {
          if (err) {
            return console.log(err.message);
          }
          // get the last insert id
          console.log(`A row has been inserted with rowid ${this.lastID}`);
        });

        uartcheck_rx = false
        buf = Buffer.alloc(0)
      }
    }
    else
    {
      buf = Buffer.concat([buf,data])

      if(uartcheck_rx)
      {
        if(socket.connected)
        {
          socket.emit('chat message', buf.toString('hex'));
        }
        
        var nid = buf.slice(4,6)
        console.log('nid  :',nid.toString('hex'))
	const tinfo = moment().format('YYYYMMDDHHmmss');
	console.log('tinfo',tinfo)
        db.run(`INSERT INTO lorem (nid,tinfo,info) VALUES(?,?,?)`,nid.toString('hex'),tinfo.toString() ,buf.toString('hex'), function(err) {
          if (err) {
            return console.log(err.message);
          }
          // get the last insert id
          console.log(`A row has been inserted with rowid ${this.lastID}`);
        });
        //console.log('on / off :',buf[11])
        //console.log('temp :',buf[14])
        uartcheck_rx = false
        buf = Buffer.alloc(0)
        return
      }

      var index = buf.lastIndexOf(0x0a)
      //var index = buf.indexOf(0x0a)
      var indexlast = buf.length
  
      console.log('index',index)
      console.log('indexlast',indexlast)
  
      var newbuf = buf.slice(0,index)
      console.log('newbuf',newbuf)
      console.log('newbuf length',newbuf.length)

      if(newbuf.length>0)
          socket.emit('chat message', newbuf.toString('utf-8'));
  
      buf= buf.slice(index,indexlast)
    }

    

  }
    //console.log('receive',data.toString('utf-8'));
    //
  
});

//serialport.write(msg+'\n')

//const socket = io("http://15.164.102.170:3000/");
var socket = require('socket.io-client')('http://localhost:3001');
//console.log(socket.id); // undefined

socket.on("connect", () => {
  console.log(socket.id); // "G5p5..."
  socket.emit("chat message", "Gateway Connect");
});


socket.on("chat message", (data) => {
  console.log(data);
  serialport.write(data+'\n')
});

//const job = schedule.scheduleJob('*/10 * * * * *', function(){
//  console.log('schedule $Tbd3=83:10:1:10')
//  serialport.write('$Tbd3=83:10:1:10\n')
//});
