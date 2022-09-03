import catchController from "../../utils/catchControllerAsyncs";
import { Request, Response, NextFunction } from "express";
import createPageInfo from "../../utils/createPagination";

// const createTask = catchController(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const user_id: string = req.user._id;
//     const { title, description, due_date } = req.body;

//   }
// );
