import USER from "../models/user.schema";

const generateRandom10DigitId = () =>{
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}


export const generateUniqueUserId = async()=>{
    let id;
    let exists = true;

    while(exists){
        id = generateRandom10DigitId();
        exists = await USER.findOne({userId: id});
    }

    return id;
}
