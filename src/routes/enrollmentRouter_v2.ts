import { Router, type Request, type Response } from "express";

//import db
import { students, courses, enrollments } from '../db/db.ts';
import {
    zCourseId
} from "../libs/zodValidators.js";

import type { CustomRequest, CourseId } from "../libs/types.ts";

//import middlewares
import { authenticateToken } from "../middlewares/authenMiddleware.ts";
// import database
import { users} from "../db/db.ts";

const router = Router();

router.get("/", authenticateToken, (req: Request, res: Response) => {
  try {
    const payload = (req as CustomRequest).user;
    const token = (req as CustomRequest).token;

    const user = users.find((u) => u.username === payload?.username);
    if (!user) {
        return res.status(401).json({
        success: false,
        message: "Unauthorized user",
        });
    }

    //if admin return all
    if(user.role === "ADMIN"){
        return res.status(200).json({
            ok: true,
            enrollments: enrollments
        })
    }


    const resData = enrollments.filter((e) => e.studentId === user.studentId).map((x) => x.courseId)

    return res.status(200).json({
        ok: true,
        studentId: user.studentId,
        enrollments: resData
    })


    // const courseId = req.query.courseId;
    // const studentId = req.query.studentId;

    // if((courseId && studentId) || (!courseId && !studentId)) {
    //     return res.status(400).json({
    //         ok: false,
    //         message: "Please provide either studentId or courseId and not both!",
    //     })
    // }
    // else if(courseId){
    //     let resData = enrollments
    //                     .filter((e) => e.courseId === courseId)
    //                     .map((e) => students.filter((x) => x.studentId === e.studentId)[0])
    //                     .map((s) => ({
    //                         studentId: s?.studentId,
    //                         firstName: s?.firstName,
    //                         lastName: s?.lastName,
    //                         program: s?.program,
    //                     }));

    //     return res.status(200).json({
    //         ok: true,
    //         students: resData,
    //     })
    // }   
    // else if(studentId){
    //     let resData = enrollments.filter((e) => e.studentId === studentId).map((e) => courses.filter((c) => c.courseId === e.courseId)[0])
    //         .map((c) => ({
    //             courseId: c?.courseId,
    //             title: c?.courseTitle,
    //         }));

    //     return res.status(200).json({
    //         ok: true,
    //         courses: resData
    //     })
    // }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

router.post("/", authenticateToken, (req: Request, res: Response) => {
  try {
    const payload = (req as CustomRequest).user;
    const token = (req as CustomRequest).token;

    const user = users.find((u) => u.username === payload?.username);
    if (!user) {
        return res.status(401).json({
        success: false,
        message: "Unauthorized user",
        });
    }

    if(user.role === "ADMIN"){
        return res.status(403).json({
            ok: true,
            message: "Only Student can access this API routes"
        })
    }

    const body = req.body as CourseId; // input as courseId
    const result = zCourseId.safeParse(body.courseId); // check zod
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues[0]?.message,
      });
    }

    const courseId = body.courseId;

    const course = courses.find((c)=> c.courseId === courseId);
    if(!course){ // if course in db
      return res.status(404).json({
        ok: false,
        message: "Course is not exist"
      })
    }

    const sIndex = students.findIndex((s) => s.studentId === user.studentId);
    if(students[sIndex].courses?.find((c) => c === courseId)){
        return res.status(400).json({
          ok: false,
          message: "Already enrolled"
        })
    }

    students[sIndex].courses?.push(courseId)
    enrollments.push({
      studentId:students[sIndex].studentId,
      courseId:courseId
    })

    return res.status(200).json({
        ok: true,
        message: `${user.studentId} enroll in ${courseId}`
    })

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

router.delete("/", authenticateToken , (req: Request, res: Response) => {
  try {
    const payload = (req as CustomRequest).user;
    const token = (req as CustomRequest).token;

    const user = users.find((u) => u.username === payload?.username);
    if (!user) {
        return res.status(401).json({
        success: false,
        message: "Unauthorized user",
        });
    }

    if(user.role === "ADMIN"){
        return res.status(403).json({
            ok: true,
            message: "Only Student can access this API routes"
        })
    }

    const studentId = user.studentId;
    const body = req.body as CourseId;

    const result = zCourseId.safeParse(body.courseId);
    if (!result.success) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: result.error.issues[0]?.message,
        });
    }
    const courseId = body.courseId;

    const eIndex = enrollments.findIndex((e) => e.courseId === courseId && e.studentId === studentId);
    const enrollment = enrollments[eIndex];
    if(!enrollment){
        return res.status(404).json({
            ok: false,
            message: "Enrollment does not exist"
        })
    }

    // delete in student
    const sIndex = students.findIndex((s) => enrollment.studentId === s.studentId);
    const cIndex = students[sIndex]?.courses?.findIndex((c) => enrollment.courseId === c);

    if(!cIndex) {
        return res.status(404).json({
            ok: false,
            message: `${enrollment.courseId} in ${enrollment.studentId} is not exist`
        })
    }

    students[sIndex]?.courses?.splice(cIndex, 1);
    
    // delete in enrollment
    enrollments.splice(eIndex, 1);
    
    return res.status(200).json({
        ok: true,
        message: "You has dropped from this course. See you in next semester"
    })
   
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something is wrong, please try again",
      error: err,
    });
  }
});

export default router;