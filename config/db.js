const mongoose = require('mongoose');

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/QUIZ');

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

const db = mongoose.connection;

db.on('error',console.error.bind(console,'error connectind to db'));
  
db.once('open',function(){
    console.log("db is connected succesfully");
});

module.exports=db;