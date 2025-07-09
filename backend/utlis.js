const registerUser = [];

const addUser = ({id,name,roomid}) =>{
    const user = {name,roomid,id};
    registerUser.push(user);
    return user;
}

const removeUser = (id) =>{
    const index = registerUser.findIndex(user => user.id === id);
    if(index !== -1){
        return registerUser.splice(index,1)[0];
        }
 
}

const getUser = (id) => registerUser.find(user => user.id === id);
const getUserList = (roomid) => registerUser.filter(user => user.roomid === roomid);

module.exports = {addUser,removeUser,getUser,getUserList};