const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config({path:'./config.env'});

const app = require("./app");
mongoose.connect(process.env.DB).then(()=>{
  console.log('DB conectionj sucessfull...');
}).catch((err)=>console.log(err));

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App Running on port ${port}`);
});
