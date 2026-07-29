import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import type { User, UserPayload, CustomRequest } from "../libs/types.ts";

//import middlewares
import { authenticateToken } from "../middlewares/authenMiddleware.ts"
import { checkRoleAdmin } from "../middlewares/checkRoleAdminMiddleware.ts"

// import database
import { users, reset_users } from "../db/db.ts";

const router = Router();

// GET /api/v2/users (ADMIN only)
router.get("/", authenticateToken, checkRoleAdmin, (req: Request, res: Response) => {
  try {

    // const payload = (req as CustomRequest).user;
    // const token = (req as CustomRequest).token;
        
    // const userPayload = payload as UserPayload;
    // //     // 4. check if user exists (search with username) and role is ADMIN
    // const user = users.find((u) => u.username === userPayload.username)

    // if(!user || user.role != "ADMIN"){
    //     return res.status(403).json({
    //         success: "false",
    //         message: "Unauthorize user"
    //     })
    // }
    
    // return all users
    return res.status(200).json({
        success: true,
        message: "successful authorize",
        data: users,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});


// POST /api/v2/users/login
router.post("/login", (req: Request, res: Response) => {
  // 1. get username and password from body
    const {username, password} = req.body;

  // 2. check if user exists (search with username & password in DB)
    const user = users.find((u) => u.username === username && u.password === password);

    if(!user){
        return res.status(404).json({
            success: false,
            message: "Invalid username or password"
        });
    }

  // 3. create JWT token (with user info object as payload) using JWT_SECRET_KEY
  //    (optional: save the token as part of User data)
    const jwt_secret = process.env.JWT_SECRET || "this_is_my_secret";
    const token = jwt.sign(
        {
            //app payload
            username: user.username,
            studentId: user.studentId,
            role: user.role
        }, 
        jwt_secret, 
        { expiresIn: "15m" }
    );

    user.tokens = user.tokens ? [...user.tokens, token] : [token];

  // 4. send HTTP response with JWT token
    return res.status(200).json({
        success: true,
        message: "login successful",
        token: token
    })
});

// POST /api/v2/users/logout
router.post("/logout", authenticateToken, (req: Request, res: Response) => {
  // 1. check Request if "authorization" header exists
  //    and container "Bearer ...JWT-Token..."
  // 2. extract the "...JWT-Token..." if available
  // 3. verify token using JWT_SECRET_KEY and get payload (username, studentId and role)

    const payload = (req as CustomRequest).user;
    const token = (req as CustomRequest).token;

  // 4. check if user exists (search with username)
    const user = users.find((u)=> u.username === payload?.username);
    if(!user){
        return res.status(401).json({
            success: false,
            message: "Unauthorize user"
        })
    }

    if(!token){
        return res.status(401).json({
            success: false,
            message: "token is required"
        })
    }
    if (!user.tokens || !user.tokens.includes(token)) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    user.tokens = user.tokens?.filter((t) => t !== token);

    return res.status(200).json({
        success: true,
        message: "logged out"
    })


    // need to implement logout part


  // 5. proceed with logout process and return HTTP response
  //    (optional: remove the token from User data)

});

// POST /api/v2/users/reset
router.post("/reset", (req: Request, res: Response) => {
  try {
    reset_users();
    return res.status(200).json({
      success: true,
      message: "User database has been reset",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

export default router;