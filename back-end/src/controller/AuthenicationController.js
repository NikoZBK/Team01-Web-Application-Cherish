import bcrypt from "bcryptjs";
import ModelFactory from "../model/ModelFactory";
import { debugLog } from "../../config/debug.js";


const factoryResponse = (status, message) => ({status, message});

class AuthenticationController {
    constructor() {
        ModelFactory.getModel(sqlite)
        .then((model) => {
            this.model = model;
            debugLog(`DayController initialized with model: ${typeof model}`);
        })
        .catch((err) => console.error("Error initializing model: ", err));
    }

    async register(req, res) {
        const {username, password, email} = req.body;

        // Check if username already exists
        if (await this.model.userExists(username)){
            return res.status(400).json(factoryResponse(400, `Username ${username} already taken`));
        }

        // Encrypts password
        const hash = await bcrypt.hash(password, 10);

        // Creates new user account in database
        await this.model.createUser({username, password: hash, email});
        res.json(factoryResponse(200, "Registration successful"));
        console.log("User registered successfully");
    }

    async login(req, res, next) {
        
    }
    
}

export default AuthenticationController;